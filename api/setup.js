// ============================================
// api/setup.js
// Endpoint helper untuk setup webhook otomatis
// Akses: https://your-project.vercel.app/api/setup?secret=WEBHOOK_SECRET
// ============================================

const TelegramBot = require("../lib/telegram");

module.exports = async (req, res) => {
  // Hanya izinkan GET request
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verifikasi secret untuk keamanan (biar orang lain tidak bisa akses endpoint ini)
  const { secret } = req.query;
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";

  if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
    return res.status(403).json({ error: "Forbidden: invalid secret" });
  }

  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) {
      return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN not set" });
    }

    const bot = new TelegramBot(BOT_TOKEN);

    // Tentukan URL webhook
    // VERCEL_URL adalah environment variable otomatis dari Vercel
    // VERCEL_PROJECT_PRODUCTION_URL untuk URL production
    const baseUrl =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : req.headers.host
          ? `https://${req.headers.host}`
          : null;

    if (!baseUrl) {
      return res.status(500).json({ error: "Cannot determine webhook URL" });
    }

    const webhookUrl = `${baseUrl}/api/webhook`;

    // Set webhook
    console.log(`[Setup] Setting webhook to: ${webhookUrl}`);
    const result = await bot.setWebhook(webhookUrl, WEBHOOK_SECRET);

    if (result.result) {
      // Ambil info webhook untuk konfirmasi
      const info = await bot.getWebhookInfo();

      return res.status(200).json({
        success: true,
        message: "Webhook berhasil diset!",
        webhook_url: webhookUrl,
        webhook_info: info.result,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Gagal set webhook",
        telegram_response: result,
      });
    }
  } catch (error) {
    console.error("[Setup] Error:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
