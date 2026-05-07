// ============================================
// api/webhook.js
// Entry point utama bot Telegram
// File ini yang dipanggil Vercel saat ada request masuk
// ============================================

const TelegramBot = require("../lib/telegram");
const { downloadTikTok } = require("../lib/downloader");
const { isTikTokUrl, extractUrl, cleanTikTokUrl } = require("../utils/validator");
const messages = require("../utils/messages");

// ============================================
// INISIALISASI BOT
// ============================================

// Ambil token dari environment variable
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";

// Buat instance bot
let bot;
try {
  bot = new TelegramBot(BOT_TOKEN);
} catch (err) {
  console.error("[Init] Failed to create bot:", err.message);
}

// ============================================
// HANDLER PERINTAH /start
// ============================================

async function handleStart(chatId, firstName) {
  await bot.sendMessage(chatId, messages.start(firstName));
}

// ============================================
// HANDLER PERINTAH /help
// ============================================

async function handleHelp(chatId) {
  await bot.sendMessage(chatId, messages.help);
}

// ============================================
// HANDLER LINK TIKTOK
// Ini logika utama: terima link → download → kirim video
// ============================================

async function handleTikTokLink(chatId, url) {
  let statusMessageId = null;

  try {
    // Step 1: Kirim pesan "sedang memproses"
    // Dan simpan message_id-nya biar bisa diedit nanti
    const statusMsg = await bot.sendMessage(chatId, messages.downloading);
    statusMessageId = statusMsg?.result?.message_id;

    // Step 2: Tampilkan "upload_video" action di chat
    await bot.sendChatAction(chatId, "upload_video");

    // Step 3: Bersihkan URL dari parameter yang tidak perlu
    const cleanUrl = cleanTikTokUrl(url);
    console.log(`[Handler] Processing URL: ${cleanUrl}`);

    // Step 4: Download video (ini yang paling lama prosesnya)
    const { buffer, title, author } = await downloadTikTok(cleanUrl);

    // Step 5: Buat caption video yang bagus
    // Escape karakter khusus untuk MarkdownV2
    const safeTitle = escapeMarkdown(title.substring(0, 200)); // max 200 char
    const safeAuthor = escapeMarkdown(author);
    const caption =
      `🎬 *${safeTitle}*\n\n` +
      `👤 by *@${safeAuthor}*\n\n` +
      `_Downloaded via TikTok Bot_`;

    // Step 6: Kirim video ke user
    console.log(`[Handler] Sending video to chat ${chatId}...`);
    await bot.sendVideo(chatId, buffer, "tiktok_video.mp4", caption);

    // Step 7: Hapus pesan "sedang memproses" jika masih ada
    if (statusMessageId) {
      try {
        await bot.callApi("deleteMessage", {
          chat_id: chatId,
          message_id: statusMessageId,
        });
      } catch {
        // Tidak masalah kalau gagal hapus pesan status
      }
    }

    console.log(`[Handler] Successfully sent video to chat ${chatId}`);
  } catch (error) {
    console.error(`[Handler] Error processing TikTok URL:`, error.message);

    // Tentukan pesan error yang tepat berdasarkan jenis error
    let errorMessage = messages.downloadFailed;

    if (error.message === "VIDEO_TOO_LARGE") {
      errorMessage = messages.videoTooLarge;
    } else if (
      error.message.includes("timeout") ||
      error.message.includes("TIMEOUT")
    ) {
      errorMessage = messages.downloadFailed;
    }

    // Edit pesan status jadi pesan error, atau kirim pesan baru
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

// ============================================
// HANDLER PESAN TEKS UMUM
// ============================================

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text || "";
  const firstName = message.from?.first_name || "Kamu";

  console.log(`[Message] From chat ${chatId}: ${text.substring(0, 100)}`);

  // Cek apakah pesan adalah command
  if (text.startsWith("/start")) {
    return handleStart(chatId, firstName);
  }

  if (text.startsWith("/help")) {
    return handleHelp(chatId);
  }

  // Coba ekstrak URL dari teks (mungkin user kirim link bareng teks lain)
  const extractedUrl = extractUrl(text);

  if (!extractedUrl) {
    // Tidak ada URL sama sekali dalam pesan
    return bot.sendMessage(chatId, messages.notALink);
  }

  // Ada URL, tapi apakah itu link TikTok?
  if (!isTikTokUrl(extractedUrl)) {
    // URL ditemukan tapi bukan TikTok
    return bot.sendMessage(chatId, messages.invalidLink);
  }

  // URL valid, proses download
  return handleTikTokLink(chatId, extractedUrl);
}

// ============================================
// UTILITY: Escape karakter khusus MarkdownV2
// Telegram MarkdownV2 butuh escape untuk karakter ini
// ============================================

function escapeMarkdown(text) {
  if (!text) return "";
  // Karakter yang harus di-escape di MarkdownV2
  return text.replace(/[_*[\]()~`>#+=|{}.!\\-]/g, (char) => `\\${char}`);
}

// ============================================
// MAIN HANDLER: Entry point yang dipanggil Vercel
// Vercel akan memanggil fungsi ini untuk setiap HTTP request
// ============================================

module.exports = async (req, res) => {
  // ─── GET Request: cek status bot ────────────────────
  if (req.method === "GET") {
    return res.status(200).json({
      status: "ok",
      message: "TikTok Telegram Bot is running!",
      timestamp: new Date().toISOString(),
    });
  }

  // ─── POST Request: proses update dari Telegram ──────
  if (req.method === "POST") {
    try {
      // Verifikasi secret token kalau ada
      // Ini lapisan keamanan agar hanya Telegram yang bisa kirim update
      if (WEBHOOK_SECRET) {
        const incomingSecret = req.headers["x-telegram-bot-api-secret-token"];
        if (incomingSecret !== WEBHOOK_SECRET) {
          console.warn("[Security] Invalid secret token received");
          return res.status(403).json({ error: "Forbidden" });
        }
      }

      // Pastikan bot sudah terinisialisasi
      if (!bot) {
        console.error("[Handler] Bot not initialized - missing BOT_TOKEN");
        return res.status(500).json({ error: "Bot not configured" });
      }

      // Parse body request (berisi update dari Telegram)
      const update = req.body;

      if (!update) {
        return res.status(400).json({ error: "Empty request body" });
      }

      console.log(
        "[Webhook] Received update:",
        JSON.stringify(update).substring(0, 200)
      );

      // Telegram bisa kirim berbagai jenis update
      // Kita hanya handle 'message' untuk sekarang
      if (update.message) {
        // Jalankan handler TANPA await
        // Ini penting! Vercel punya timeout, kita balas 200 dulu
        // baru proses di background
        handleMessage(update.message).catch((err) => {
          console.error("[Handler] Unhandled error:", err.message);
        });
      }

      // Balas 200 OK ke Telegram SEGERA
      // Kalau tidak dibalas dalam 10 detik, Telegram akan retry
      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error("[Webhook] Fatal error:", error.message);
      // Tetap balas 200 agar Telegram tidak retry terus-menerus
      return res.status(200).json({ ok: true });
    }
  }

  // Method lain (PUT, DELETE, dll) tidak didukung
  return res.status(405).json({ error: "Method not allowed" });
};
