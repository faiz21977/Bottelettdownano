const TelegramBot = require("../lib/telegram");
const { downloadTikTok } = require("../lib/downloader");
const { isTikTokUrl, extractUrl, cleanTikTokUrl } = require("../utils/validator");
const messages = require("../utils/messages");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";

let bot;
try {
  bot = new TelegramBot(BOT_TOKEN);
} catch (err) {
  console.error("[Init] Failed to create bot:", err.message);
}

function escapeMarkdown(text) {
  if (!text) return "";
  return text.replace(/[_*[\]()~`>#+=|{}.!\\-]/g, (char) => `\\${char}`);
}

async function handleStart(chatId, firstName) {
  await bot.sendMessage(chatId, messages.start(firstName));
}

async function handleHelp(chatId) {
  await bot.sendMessage(chatId, messages.help);
}

async function handleTikTokLink(chatId, url) {
  let statusMessageId = null;

  try {
    const statusMsg = await bot.sendMessage(chatId, messages.downloading);
    statusMessageId = statusMsg?.result?.message_id;

    await bot.sendChatAction(chatId, "upload_video");

    const cleanUrl = cleanTikTokUrl(url);
    console.log(`[Handler] Processing URL: ${cleanUrl}`);

    // Ambil info video (URL direct, judul, author)
    const { videoUrl, title, author } = await getTikTokInfo(cleanUrl);

    const safeTitle = escapeMarkdown(title.substring(0, 200));
    const safeAuthor = escapeMarkdown(author);
    const caption =
      `🎬 *${safeTitle}*\n\n` +
      `👤 by *@${safeAuthor}*\n\n` +
      `_Downloaded via TikTok Bot_`;

    // Kirim URL langsung ke Telegram (Telegram yang download)
    await bot.callApi("sendVideo", {
      chat_id: chatId,
      video: videoUrl,
      caption: caption,
      parse_mode: "MarkdownV2",
      supports_streaming: true,
    });

    if (statusMessageId) {
      try {
        await bot.callApi("deleteMessage", {
          chat_id: chatId,
          message_id: statusMessageId,
        });
      } catch {}
    }

    console.log(`[Handler] Successfully sent video to chat ${chatId}`);
  } catch (error) {
    console.error(`[Handler] Error:`, error.message);

    let errorMessage = messages.downloadFailed;
    if (error.message === "VIDEO_TOO_LARGE") {
      errorMessage = messages.videoTooLarge;
    }

    if (statusMessageId) {
      try {
        await bot.editMessage(chatId, statusMessageId, errorMessage);
      } catch {
        await bot.sendMessage(chatId, errorMessage);
      }
    } else {
      await bot.sendMessage(chatId, errorMessage);
    }
  }
}

async function getTikTokInfo(tiktokUrl) {
  const axios = require("axios");

  const response = await axios.post(
    "https://www.tikwm.com/api/",
    new URLSearchParams({
      url: tiktokUrl,
      count: "12",
      cursor: "0",
      web: "1",
      hd: "1",
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      },
      timeout: 15000,
    }
  );

  const data = response.data;
  if (!data || data.code !== 0) {
    throw new Error(`API Error: ${data?.msg || "Unknown error"}`);
  }

  const videoData = data.data;
  const videoUrl = videoData.hdplay || videoData.play || videoData.wmplay;

  if (!videoUrl) throw new Error("No video URL found");

  return {
    videoUrl,
    title: videoData.title || "TikTok Video",
    author: videoData.author?.nickname || videoData.author?.unique_id || "Unknown",
  };
}

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text || "";
  const firstName = message.from?.first_name || "Kamu";

  if (text.startsWith("/start")) return handleStart(chatId, firstName);
  if (text.startsWith("/help")) return handleHelp(chatId);

  const extractedUrl = extractUrl(text);
  if (!extractedUrl) return bot.sendMessage(chatId, messages.notALink);
  if (!isTikTokUrl(extractedUrl)) return bot.sendMessage(chatId, messages.invalidLink);

  return handleTikTokLink(chatId, extractedUrl);
}

module.exports = async (req, res) => {
  if (req.method === "GET") {
    return res.status(200).json({
      status: "ok",
      message: "TikTok Telegram Bot is running!",
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method === "POST") {
    try {
      if (WEBHOOK_SECRET) {
        const incomingSecret = req.headers["x-telegram-bot-api-secret-token"];
        if (incomingSecret !== WEBHOOK_SECRET) {
          return res.status(403).json({ error: "Forbidden" });
        }
      }

      if (!bot) return res.status(500).json({ error: "Bot not configured" });

      const update = req.body;
      if (!update) return res.status(400).json({ error: "Empty body" });

      if (update.message) {
        handleMessage(update.message).catch((err) => {
          console.error("[Handler] Unhandled error:", err.message);
        });
      }

      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error("[Webhook] Fatal error:", error.message);
      return res.status(200).json({ ok: true });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
