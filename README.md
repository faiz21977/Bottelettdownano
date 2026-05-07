# 🎬 TikTok Telegram Bot

Bot Telegram untuk download video TikTok tanpa watermark, dijalankan di Vercel (gratis).

## ✨ Fitur
- Download video TikTok tanpa watermark
- Kirim video langsung ke chat Telegram
- Validasi link TikTok otomatis
- Error handling yang informatif
- Gratis (Vercel free tier + TikWM API gratis)

---

## 📁 Struktur Folder

```
tiktok-bot/
├── api/
│   ├── webhook.js      ← Entry point utama (dipanggil Vercel)
│   └── setup.js        ← Helper untuk set webhook
├── lib/
│   ├── telegram.js     ← Wrapper Telegram Bot API
│   └── downloader.js   ← Logika download TikTok
├── utils/
│   ├── validator.js    ← Validasi link TikTok
│   └── messages.js     ← Template pesan bot
├── .env.example        ← Contoh environment variables
├── .gitignore
├── package.json
├── vercel.json
└── README.md
```

---

## 🚀 Setup dari Nol (Step by Step)

### STEP 1: Buat Bot Telegram di BotFather

1. Buka Telegram, cari `@BotFather`
2. Ketik `/newbot`
3. Masukkan **nama bot** (bebas, contoh: `My TikTok Downloader`)
4. Masukkan **username bot** (harus diakhiri `bot`, contoh: `mytiktok_dl_bot`)
5. BotFather akan memberikan **TOKEN** — simpan token ini, jangan dibagikan!
   - Format: `1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ`

### STEP 2: Install Tools yang Dibutuhkan

Pastikan sudah terinstall di komputer kamu:
- **Node.js** (v18+): https://nodejs.org
- **Git**: https://git-scm.com
- **Akun GitHub**: https://github.com (gratis)
- **Akun Vercel**: https://vercel.com (gratis, bisa login pakai GitHub)

Cek versi setelah install:
```bash
node --version    # Harus v18.0.0 atau lebih baru
npm --version     # Biasanya sudah include dengan Node.js
git --version
```

### STEP 3: Setup Project Lokal

```bash
# 1. Clone atau buat folder project
mkdir tiktok-bot
cd tiktok-bot

# 2. Copy semua file dari project ini ke folder tersebut

# 3. Install dependencies
npm install

# 4. Buat file .env dari template
cp .env.example .env
```

Edit file `.env`:
```env
TELEGRAM_BOT_TOKEN=masukkan_token_dari_botfather_di_sini
VERCEL_URL=https://nama-project-kamu.vercel.app
WEBHOOK_SECRET=sembarang_string_rahasia_min8karakter
```

### STEP 4: Upload ke GitHub

```bash
# 1. Inisialisasi git repository
git init

# 2. Tambahkan semua file
git add .

# 3. Commit pertama
git commit -m "Initial commit: TikTok Telegram Bot"

# 4. Buat repository baru di GitHub
# Buka https://github.com/new
# Nama repo: tiktok-bot (atau bebas)
# Visibility: Public atau Private (keduanya bisa)
# JANGAN centang "Add README" atau "Add .gitignore"
# Klik "Create repository"

# 5. Push ke GitHub (ganti USERNAME dengan username GitHub kamu)
git remote add origin https://github.com/USERNAME/tiktok-bot.git
git branch -M main
git push -u origin main
```

### STEP 5: Deploy ke Vercel

**Cara A: Via Dashboard Vercel (Mudah)**

1. Buka https://vercel.com dan login
2. Klik **"Add New Project"**
3. Import repository GitHub kamu
4. Di bagian **"Environment Variables"**, tambahkan:
   - `TELEGRAM_BOT_TOKEN` = token bot kamu
   - `WEBHOOK_SECRET` = string rahasia kamu (bebas, min 8 karakter)
5. Klik **"Deploy"**
6. Tunggu sampai deployment selesai
7. Catat URL deployment kamu (contoh: `https://tiktok-bot-username.vercel.app`)

**Cara B: Via CLI Vercel**

```bash
# Install Vercel CLI
npm install -g vercel

# Login ke Vercel
vercel login

# Deploy (ikuti instruksi interaktif)
vercel

# Set environment variables
vercel env add TELEGRAM_BOT_TOKEN
vercel env add WEBHOOK_SECRET

# Deploy ke production
vercel --prod
```

### STEP 6: Set Webhook Telegram

Setelah deploy, kamu perlu memberitahu Telegram URL webhook bot kamu.

**Cara A: Otomatis via endpoint setup**

Buka browser dan akses URL ini (ganti sesuai data kamu):
```
https://nama-project-kamu.vercel.app/api/setup?secret=WEBHOOK_SECRET_KAMU
```

Kalau berhasil, kamu akan melihat response JSON seperti ini:
```json
{
  "success": true,
  "message": "Webhook berhasil diset!",
  "webhook_url": "https://nama-project-kamu.vercel.app/api/webhook"
}
```

**Cara B: Manual via Telegram API**

Buka browser dan akses URL ini:
```
https://api.telegram.org/botTOKEN_KAMU/setWebhook?url=https://nama-project.vercel.app/api/webhook
```

Ganti `TOKEN_KAMU` dengan token bot dan `nama-project.vercel.app` dengan URL Vercel kamu.

### STEP 7: Test Bot

1. Buka Telegram
2. Cari username bot kamu (yang dibuat di BotFather)
3. Ketik `/start`
4. Bot harus membalas dengan pesan sambutan
5. Coba kirim link TikTok:
   ```
   https://www.tiktok.com/@username/video/1234567890
   ```
6. Bot akan membalas dengan video yang sudah didownload

---

## 🖥️ Menjalankan Lokal (Development)

Untuk test di lokal tanpa deploy ke Vercel, kamu butuh tools untuk expose localhost ke internet (agar Telegram bisa kirim webhook ke lokal kamu).

```bash
# Install ngrok untuk tunnel
# Download dari: https://ngrok.com/download

# Atau pakai cloudflared (gratis, tidak butuh signup)
# Download dari: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

# 1. Jalankan bot lokal
node api/webhook.js

# 2. Di terminal lain, buat tunnel
# Pakai ngrok:
ngrok http 3000

# Pakai cloudflared:
cloudflared tunnel --url http://localhost:3000
```

Setelah tunnel aktif, kamu dapat URL seperti `https://abc123.ngrok.io`.
Set webhook ke URL tersebut:
```
https://api.telegram.org/botTOKEN/setWebhook?url=https://abc123.ngrok.io/api/webhook
```

**Catatan:** Untuk lokal, tambahkan server listener di bawah file `api/webhook.js`:

```javascript
// Tambahkan ini di BAWAH module.exports = ...
if (require.main === module) {
  const http = require('http');
  const PORT = process.env.PORT || 3000;
  
  const server = http.createServer((req, res) => {
    // Parse body
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch { req.body = {}; }
      module.exports(req, res);
    });
  });
  
  server.listen(PORT, () => {
    console.log(`Bot running on http://localhost:${PORT}`);
  });
}
```

---

## 🔧 Troubleshooting

### Error: Bot tidak membalas

1. Cek apakah webhook sudah diset dengan benar:
   ```
   https://api.telegram.org/botTOKEN/getWebhookInfo
   ```
2. Pastikan `TELEGRAM_BOT_TOKEN` benar di Vercel environment variables
3. Cek Vercel logs: Dashboard Vercel → Project → Deployments → Functions → Logs

### Error: "Video tidak bisa didownload"

1. Pastikan link TikTok valid dan video masih ada (tidak dihapus/private)
2. Coba link lain untuk memastikan bukan masalah bot
3. API TikWM kadang down, tunggu beberapa menit

### Error: "Request Entity Too Large"

Vercel memiliki batas 4.5MB untuk request body. Untuk video besar (>50MB), bot sudah menangani ini dengan pesan error. Tapi kalau error ini muncul untuk video kecil, kemungkinan ada masalah buffer.

### Error: Timeout di Vercel

Vercel free tier punya batas 60 detik per function. Sudah dikonfigurasi di `vercel.json`. Kalau masih timeout, kemungkinan server TikWM sedang lambat.

### Webhook tidak bisa diset

Pastikan URL webhook menggunakan HTTPS (bukan HTTP). Vercel otomatis HTTPS jadi harusnya tidak ada masalah.

---

## 📝 Environment Variables

| Variable | Deskripsi | Wajib |
|----------|-----------|-------|
| `TELEGRAM_BOT_TOKEN` | Token bot dari BotFather | ✅ Ya |
| `WEBHOOK_SECRET` | String rahasia untuk keamanan webhook | Disarankan |
| `VERCEL_URL` | URL deployment Vercel (auto-set oleh Vercel) | Auto |

---

## 🔒 Keamanan

- Jangan pernah share `TELEGRAM_BOT_TOKEN` ke publik
- `WEBHOOK_SECRET` dipakai untuk memverifikasi bahwa request benar-benar dari Telegram
- File `.env` sudah ada di `.gitignore`, jadi tidak akan ter-upload ke GitHub

---

## 📦 Dependencies

- `node-telegram-bot-api`: SDK Telegram Bot (dipakai minimal)
- `axios`: HTTP client untuk request ke API
- `form-data`: Untuk upload file ke Telegram

---

## 🌐 API yang Digunakan

Bot ini menggunakan **TikWM API** (https://www.tikwm.com/) untuk download video TikTok tanpa watermark. API ini gratis dan tidak memerlukan API key.
