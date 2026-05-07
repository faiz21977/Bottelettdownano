// ============================================
// utils/validator.js
// Fungsi untuk validasi dan parsing link TikTok
// ============================================

/**
 * Cek apakah sebuah string adalah link TikTok yang valid.
 * Mendukung format:
 * - https://www.tiktok.com/@username/video/1234567890
 * - https://vm.tiktok.com/AbCdEf/
 * - https://vt.tiktok.com/AbCdEf/
 * - https://m.tiktok.com/v/1234567890
 * - https://tiktok.com/t/AbCdEf/
 */
function isTikTokUrl(text) {
  // Bersihkan spasi depan belakang
  const url = text.trim();

  // Regex yang cocok dengan berbagai format link TikTok
  const tiktokRegex =
    /^https?:\/\/(www\.|vm\.|vt\.|m\.)?(tiktok\.com)\/([@a-zA-Z0-9._-]+\/video\/\d+|v\/\d+|t\/[a-zA-Z0-9]+|[a-zA-Z0-9]+)\/?(\?.*)?$/i;

  return tiktokRegex.test(url);
}

/**
 * Ekstrak URL pertama yang ditemukan dari sebuah pesan teks.
 * Berguna kalau user ngirim link bareng teks biasa.
 */
function extractUrl(text) {
  const urlRegex = /https?:\/\/[^\s]+/g;
  const matches = text.match(urlRegex);
  return matches ? matches[0] : null;
}

/**
 * Bersihkan URL TikTok dari query params yang tidak perlu
 * tapi pertahankan strukturnya
 */
function cleanTikTokUrl(url) {
  try {
    const parsed = new URL(url);
    // Hapus query params, cukup ambil path utama
    return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
  } catch {
    return url;
  }
}

module.exports = { isTikTokUrl, extractUrl, cleanTikTokUrl };
