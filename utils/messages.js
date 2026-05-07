// ============================================
// utils/messages.js
// Template pesan bot dengan formatting Telegram
// Telegram mendukung: *bold*, _italic_, `code`, [link](url)
// ============================================

const messages = {
  // Pesan sambutan saat user ketik /start
  start: (firstName) =>
    `🎬 *Halo, ${firstName}\\!*\n\n` +
    `Gue adalah bot untuk download video TikTok\\.\n\n` +
    `*Cara pakai:*\n` +
    `Cukup kirim link TikTok ke sini dan gue akan download videonya buat kamu\\. ✨\n\n` +
    `*Contoh link yang valid:*\n` +
    `\\- https://www\\.tiktok\\.com/@user/video/123\n` +
    `\\- https://vm\\.tiktok\\.com/AbCdEf/\n` +
    `\\- https://vt\\.tiktok\\.com/AbCdEf/\n\n` +
    `*Ketik /help untuk bantuan lebih lanjut\\.*`,

  // Pesan bantuan
  help:
    `📖 *Panduan Penggunaan Bot*\n\n` +
    `*Perintah yang tersedia:*\n` +
    `/start \\- Mulai bot\n` +
    `/help \\- Tampilkan bantuan ini\n\n` +
    `*Cara download video TikTok:*\n` +
    `1\\. Buka TikTok dan temukan video yang mau didownload\n` +
    `2\\. Tap tombol *Share* di video tersebut\n` +
    `3\\. Tap *Copy Link*\n` +
    `4\\. Paste link tersebut ke sini\n\n` +
    `*Format link yang didukung:*\n` +
    `✅ tiktok\\.com/@user/video/ID\n` +
    `✅ vm\\.tiktok\\.com/xxxxx\n` +
    `✅ vt\\.tiktok\\.com/xxxxx\n\n` +
    `*Catatan:* Video dikirim tanpa watermark jika memungkinkan\\.`,

  // Pesan sedang memproses
  downloading:
    `⏳ *Sedang memproses video kamu\\.\\.\\.*\n\n` +
    `Mohon tunggu sebentar ya, gue lagi ngunduh videonya\\. 🎬`,

  // Pesan link tidak valid
  invalidLink:
    `❌ *Link tidak valid\\!*\n\n` +
    `Link yang kamu kirim bukan link TikTok yang valid\\.\n\n` +
    `*Pastikan link kamu seperti ini:*\n` +
    `• https://www\\.tiktok\\.com/@user/video/123\n` +
    `• https://vm\\.tiktok\\.com/AbCdEf/\n\n` +
    `Coba copy ulang link dari aplikasi TikTok dan kirim lagi ya\\. 🙏`,

  // Pesan bukan link
  notALink:
    `ℹ️ *Kirim link TikTok*\n\n` +
    `Untuk download video, kirim link TikTok ke sini\\.\n\n` +
    `Ketik /help untuk panduan penggunaan\\.`,

  // Pesan error download
  downloadFailed:
    `😕 *Download gagal\\!*\n\n` +
    `Gue nggak bisa download video ini\\. Kemungkinan penyebabnya:\n\n` +
    `• Video sudah dihapus atau private\n` +
    `• Link sudah expired\n` +
    `• Server lagi sibuk\n\n` +
    `Coba lagi dalam beberapa menit ya\\. Kalau tetap gagal, coba link lain\\. 🙏`,

  // Pesan video terlalu besar
  videoTooLarge:
    `⚠️ *Video terlalu besar\\!*\n\n` +
    `Ukuran video melebihi batas 50MB yang diizinkan Telegram\\.\n\n` +
    `Coba download video yang lebih pendek ya\\.`,

  // Pesan error umum/server
  serverError:
    `🔧 *Terjadi kesalahan\\!*\n\n` +
    `Ada masalah di server saat memproses request kamu\\.\n` +
    `Coba lagi dalam beberapa menit\\.`,
};

module.exports = messages;
