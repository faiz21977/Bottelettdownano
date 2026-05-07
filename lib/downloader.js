// ============================================
// lib/downloader.js
// Logika utama untuk download video TikTok
// Menggunakan TikWM API (gratis, tanpa key, stabil)
// Docs: https://www.tikwm.com/
// ============================================

const axios = require("axios");

// Batas ukuran video yang bisa dikirim Telegram (50MB dalam bytes)
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

// Timeout untuk request HTTP (30 detik)
const REQUEST_TIMEOUT = 30000;

/**
 * Download info video TikTok menggunakan TikWM API
 * TikWM adalah API gratis yang menyediakan video TikTok tanpa watermark
 *
 * @param {string} tiktokUrl - URL video TikTok
 * @returns {Promise<{videoUrl: string, title: string, author: string}>}
 */
async function getTikTokVideoInfo(tiktokUrl) {
  try {
    // TikWM API endpoint
    const apiUrl = "https://www.tikwm.com/api/";

    // Kirim POST request ke TikWM API
    const response = await axios.post(
      apiUrl,
      new URLSearchParams({
        url: tiktokUrl,  // URL TikTok yang mau didownload
        count: "12",
        cursor: "0",
        web: "1",
        hd: "1",         // Request kualitas HD
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          // User-Agent agar request terlihat seperti dari browser
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        },
        timeout: REQUEST_TIMEOUT,
      }
    );

    const data = response.data;

    // Cek apakah API mengembalikan data yang valid
    if (!data || data.code !== 0) {
      throw new Error(`API Error: ${data?.msg || "Unknown error from API"}`);
    }

    const videoData = data.data;

    if (!videoData) {
      throw new Error("No video data returned from API");
    }

    // Ambil URL video tanpa watermark (play) atau HD (hdplay)
    // Priority: hdplay → play → wmplay (dengan watermark)
    const videoUrl = videoData.hdplay || videoData.play || videoData.wmplay;

    if (!videoUrl) {
      throw new Error("No video URL found in API response");
    }

    return {
      videoUrl,
      title: videoData.title || "TikTok Video",
      author: videoData.author?.nickname || videoData.author?.unique_id || "Unknown",
      duration: videoData.duration || 0,
      cover: videoData.cover || null,
    };
  } catch (error) {
    // Lempar error yang lebih deskriptif
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      throw new Error("Request timeout: API tidak merespons");
    }
    if (error.response) {
      throw new Error(`HTTP Error ${error.response.status}: ${error.response.statusText}`);
    }
    throw error;
  }
}

/**
 * Download video dari URL dan kembalikan sebagai Buffer
 * Buffer = data binary video yang siap dikirim ke Telegram
 *
 * @param {string} videoUrl - Direct URL ke file video
 * @returns {Promise<Buffer>} - Binary data video
 */
async function downloadVideoBuffer(videoUrl) {
  try {
    const response = await axios.get(videoUrl, {
      responseType: "arraybuffer", // Minta response sebagai binary data
      timeout: REQUEST_TIMEOUT,
      maxContentLength: MAX_VIDEO_SIZE, // Tolak video > 50MB
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Referer: "https://www.tiktok.com/",
      },
      // Validasi ukuran saat download berlangsung
      onDownloadProgress: (progressEvent) => {
        if (progressEvent.total && progressEvent.total > MAX_VIDEO_SIZE) {
          throw new Error("VIDEO_TOO_LARGE");
        }
      },
    });

    return Buffer.from(response.data);
  } catch (error) {
    if (error.message === "VIDEO_TOO_LARGE" || error.code === "ERR_FR_MAX_BODY_LENGTH_EXCEEDED") {
      throw new Error("VIDEO_TOO_LARGE");
    }
    if (error.code === "ECONNABORTED") {
      throw new Error("Download timeout: video terlalu lambat diunduh");
    }
    throw error;
  }
}

/**
 * Fungsi utama: ambil info + download video TikTok
 * Ini yang dipanggil dari webhook handler
 *
 * @param {string} tiktokUrl - URL TikTok
 * @returns {Promise<{buffer: Buffer, title: string, author: string}>}
 */
async function downloadTikTok(tiktokUrl) {
  // Step 1: Dapatkan info dan URL video
  console.log(`[Downloader] Getting video info for: ${tiktokUrl}`);
  const videoInfo = await getTikTokVideoInfo(tiktokUrl);

  console.log(
    `[Downloader] Got video: "${videoInfo.title}" by @${videoInfo.author}`
  );
  console.log(`[Downloader] Video URL: ${videoInfo.videoUrl}`);

  // Step 2: Download video sebagai buffer
  console.log(`[Downloader] Downloading video buffer...`);
  const buffer = await downloadVideoBuffer(videoInfo.videoUrl);

  console.log(
    `[Downloader] Download complete. Size: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`
  );

  return {
    buffer,
    title: videoInfo.title,
    author: videoInfo.author,
    cover: videoInfo.cover,
  };
}

module.exports = { downloadTikTok };
