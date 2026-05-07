// ============================================
// lib/telegram.js
// Wrapper untuk Telegram Bot API
// Menggunakan fetch bawaan Node.js >= 18
// Tidak perlu library tambahan untuk ini
// ============================================

const FormData = require("form-data");
const axios = require("axios");

/**
 * Class TelegramBot: berisi semua method untuk komunikasi dengan Telegram
 */
class TelegramBot {
  constructor(token) {
    if (!token) {
      throw new Error("TELEGRAM_BOT_TOKEN is required");
    }
    this.token = token;
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  /**
   * Method dasar untuk panggil Telegram Bot API
   * @param {string} method - nama method API (sendMessage, sendVideo, dll)
   * @param {object} data - parameter yang dikirim
   */
  async callApi(method, data = {}) {
    try {
      const response = await axios.post(`${this.baseUrl}/${method}`, data, {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      });
      return response.data;
    } catch (error) {
      const errMsg = error.response?.data?.description || error.message;
      console.error(`[Telegram API] Error calling ${method}: ${errMsg}`);
      throw new Error(`Telegram API error: ${errMsg}`);
    }
  }

  /**
   * Kirim pesan teks biasa ke user
   * @param {number|string} chatId - ID chat tujuan
   * @param {string} text - isi pesan (mendukung MarkdownV2)
   * @param {object} extra - opsi tambahan (parse_mode, dll)
   */
  async sendMessage(chatId, text, extra = {}) {
    return this.callApi("sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "MarkdownV2",
      ...extra,
    });
  }

  /**
   * Edit pesan yang sudah terkirim (biasa dipakai buat update status)
   * @param {number|string} chatId
   * @param {number} messageId - ID pesan yang mau diedit
   * @param {string} text - teks baru
   */
  async editMessage(chatId, messageId, text) {
    return this.callApi("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "MarkdownV2",
    });
  }

  /**
   * Kirim video ke user dari Buffer (data binary)
   * Ini dipakai setelah video selesai didownload
   *
   * @param {number|string} chatId
   * @param {Buffer} videoBuffer - data binary video
   * @param {string} filename - nama file video
   * @param {string} caption - caption pesan video (opsional)
   */
  async sendVideo(chatId, videoBuffer, filename = "video.mp4", caption = "") {
    // Buat FormData karena kita upload file binary
    const formData = new FormData();
    formData.append("chat_id", String(chatId));
    formData.append("video", videoBuffer, {
      filename,
      contentType: "video/mp4",
    });

    if (caption) {
      formData.append("caption", caption);
      formData.append("parse_mode", "MarkdownV2");
    }

    // supports_streaming = true biar video bisa langsung diputar di Telegram
    formData.append("supports_streaming", "true");

    try {
      const response = await axios.post(
        `${this.baseUrl}/sendVideo`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          // Timeout lebih lama karena upload video bisa butuh waktu
          timeout: 120000, // 2 menit
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      );
      return response.data;
    } catch (error) {
      const errMsg = error.response?.data?.description || error.message;
      console.error(`[Telegram API] Error sending video: ${errMsg}`);
      throw new Error(`Failed to send video: ${errMsg}`);
    }
  }

  /**
   * Kirim "typing..." indicator ke user
   * Ini menampilkan "sedang mengetik..." di chat
   */
  async sendChatAction(chatId, action = "upload_video") {
    return this.callApi("sendChatAction", {
      chat_id: chatId,
      action, // 'typing', 'upload_video', 'upload_document', dll
    });
  }

  /**
   * Set webhook URL - dipanggil saat setup awal
   * @param {string} webhookUrl - URL endpoint webhook kita
   * @param {string} secretToken - token keamanan (opsional tapi disarankan)
   */
  async setWebhook(webhookUrl, secretToken = "") {
    const data = { url: webhookUrl };
    if (secretToken) {
      data.secret_token = secretToken;
    }
    return this.callApi("setWebhook", data);
  }

  /**
   * Hapus webhook (kalau mau balik ke polling mode)
   */
  async deleteWebhook() {
    return this.callApi("deleteWebhook");
  }

  /**
   * Dapatkan info webhook yang aktif saat ini
   */
  async getWebhookInfo() {
    return this.callApi("getWebhookInfo");
  }
}

module.exports = TelegramBot;
