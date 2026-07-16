# VPS & Domain Setup - Topup Kilat

**Tanggal:** 16-17 Juli 2026
**Status:** ✅ COMPLETED - All Systems Working

---

## 📋 Ringkasan Setup

### Infrastruktur Baru

| Item | Detail | Status |
|------|--------|--------|
| **Domain** | topupkilat.store | ✅ Aktif |
| **VPS IP** | 103.169.207.161 | ✅ Static |
| **VPS OS** | Ubuntu 24.04 LTS | ✅ Terinstall |
| **Proxy Server** | Node.js + PM2 | ✅ Running |
| **Nginx + SSL** | Let's Encrypt | ✅ Active |
| **Digiflazz KYC** | Privy.id | ✅ Approved |
| **Digiflazz API** | Production Mode | ✅ Working |

---

## 🖥️ VPS Specifications

| Spec | Detail |
|------|--------|
| **Provider** | DomaiNesia |
| **Paket** | Cloud VPS Lite 1GB |
| **Harga** | Rp 48.000/bulan |
| **IP** | 103.169.207.161 (Static) |
| **CPU** | 1 Core |
| **RAM** | 1 GB |
| **Storage** | 20 GB SSD NVMe |
| **OS** | Ubuntu 24.04 LTS |

---

## 🔧 VPS Setup Steps

### Yang Sudah Dilakukan

- [x] SSH login ke VPS
- [x] Update server (`apt update && apt upgrade`)
- [x] Install Node.js 20
- [x] Install PM2
- [x] Setup UFW firewall (port 22, 80, 443, 3000)
- [x] Buat folder `/var/www/digiflazz-proxy`
- [x] Deploy Digiflazz proxy script
- [x] Jalankan proxy dengan PM2
- [x] Setup PM2 auto-save
- [x] Install Nginx
- [x] Setup SSL dengan Certbot
- [x] Konfigurasi reverse proxy

### Perintah yang Dijalankan

```bash
# SSH
ssh root@103.169.207.161

# Update
apt update && apt upgrade -y

# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# PM2
npm install -g pm2

# Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw enable

# Setup Proxy
mkdir -p /var/www/digiflazz-proxy
cd /var/www/digiflazz-proxy
nano index.js  # (paste proxy script)
npm init -y
npm install
pm2 start index.js --name digiflazz-proxy
pm2 save

# Nginx + SSL
apt install -y nginx certbot python3-certbot-nginx
nano /etc/nginx/sites-available/digiflazz-proxy
ln -s /etc/nginx/sites-available/digiflazz-proxy /etc/nginx/sites-enabled/
systemctl restart nginx
certbot --nginx -d api.topupkilat.store
```

### Verifikasi

```bash
# Cek Node.js
node -v && npm -v
# Output: v20.20.2 dan 10.8.2

# Cek PM2 status
pm2 status
# Output: digiflazz-proxy | online

# Test Proxy
curl https://api.topupkilat.store/health
# Output: {"success":true,"message":"Proxy is running"...}

# Test API
curl -X POST https://api.topupkilat.store \
  -H "Content-Type: application/json" \
  -d '{"cmd":"deposit"}'
# Output: {"data":{"deposit":0}}
```

---

## 🌐 DNS Setup

### DNS Records (di Hostinger)

| Type | Name | Value | TTL | Status |
|------|------|-------|-----|--------|
| **A** | api | 103.169.207.161 | 300 | ✅ Sudah diset |
| **A** | @ | 103.169.207.161 | 300 | ✅ Sudah diset |
| **CNAME** | www | topupkilat.store | 300 | ✅ Sudah diset |

### Verifikasi DNS

```bash
nslookup api.topupkilat.store
# Output: api.topupkilat.store -> 103.169.207.161
```

---

## 🔐 Digiflazz Integration

### Credentials (RAHASIA - JANGAN SHARE!)

| Field | Value | Notes |
|-------|-------|-------|
| **Username** | `kemikegwdEJo` | Username API |
| **Development Key** | `dev-b11acd60-810e-11f1-b9f1-7df8eb84eb16` | Dev API key |
| **Production Key** | `ebc8d480-f61a-57da-a478-b7579e729c12` | **PRODUCTION - RAHASIA!** |

### IP Whitelist

| IP | Type | Status |
|----|------|--------|
| `103.169.207.161` | Production (VPS) | ✅ Whitelisted |
| `182.10.97.46` | Development (Laptop) | ✅ Whitelisted |

### ⚠️ PENTING: Production/Development Toggle

Di dashboard Digiflazz, ada **toggle button** untuk switch antara:
- **Development Mode** → pakai Development Key
- **Production Mode** → pakai Production Key

Pastikan toggle sesuai dengan key yang digunakan!

### Signature Format

```bash
# Format: MD5(username + apiKey + command_string)
# Command string BERBEDA dari cmd di body!

# Cek Saldo
# Body: {"cmd":"deposit"}
# Sign dari: "depo" (bukan "deposit"!)
SIGN=$(echo -n "kemikegwdEJoebc8d480-f61a-57da-a478-b7579e729c12depo" | md5sum)
# Result: 36a2d133643a4cea746eadb283347fe8

# Price List
# Body: {"cmd":"prepaid"}
# Sign dari: "pricelist"
SIGN=$(echo -n "kemikegwdEJoebc8d480-f61a-57da-a478-b7579e729c12pricelist" | md5sum)
```

### Command Mapping

| CMD di Body | Sign dari | Endpoint |
|-------------|-----------|----------|
| `deposit` | `depo` | `/v1/cek-saldo` |
| `prepaid` | `pricelist` | `/v1/price-list` |
| `pasca` | `pricelist` | `/v1/price-list` |
| (topup) | `ref_id` | `/v1/transaction` |

### API Test Results

| Test | Command | Result |
|------|---------|--------|
| Cek Saldo | `curl -X POST https://api.topupkilat.store -d '{"cmd":"deposit"}'` | ✅ `{"data":{"deposit":0}}` |
| Health Check | `curl https://api.topupkilat.store/health` | ✅ Working |

---

## 🌐 SSL Certificate

### Status: ✅ Active

- **Provider:** Let's Encrypt (Certbot)
- **Domain:** api.topupkilat.store
- **Auto-renewal:** Enabled
- **Certificate Location:** `/etc/letsencrypt/live/api.topupkilat.store/`

### Test SSL

```bash
curl https://api.topupkilat.store/health
# HTTPS working ✅

openssl s_client -connect api.topupkilat.store:443 -servername api.topupkilat.store
# Certificate details
```

---

## 📱 Proxy Script (Final Version)

Lokasi: `/var/www/digiflazz-proxy/index.js`

```javascript
const http = require('http');
const https = require('https');
const crypto = require('crypto');

// ============== KONFIGURASI ==============
const CONFIG = {
  DIGIFLAZZ_API_URL: 'https://api.digiflazz.com/v1',
  API_USERNAME: 'kemikegwdEJo',
  API_KEY: 'ebc8d480-f61a-57da-a478-b7579e729c12',  // Production Key
  PORT: 3000,
};

// ============== HELPER FUNCTIONS ==============

// Mapping command ke signature string
const SIGNATURE_MAP = {
  'deposit': 'depo',
  'prepaid': 'pricelist',
  'pasca': 'pricelist',
};

function generateSignature(cmd) {
  const signCmd = SIGNATURE_MAP[cmd] || cmd;
  const data = CONFIG.API_USERNAME + CONFIG.API_KEY + signCmd;
  return crypto.createHash('md5').update(data).digest('hex');
}

// ============== REQUEST HANDLER ==============

const server = http.createServer(async (req, res) => {
  // ... health check, CORS, proxy logic
});
```

---

## 📅 Timeline

| Tanggal | Aktivitas | Status |
|---------|-----------|--------|
| 16 Juli 2026 | VPS + Domain purchased | ✅ |
| 16 Juli 2026 | VPS setup completed | ✅ |
| 16 Juli 2026 | Proxy deployed & running | ✅ |
| 16 Juli 2026 | KYC Privy selesai | ✅ |
| 16 Juli 2026 | DNS configured | ✅ |
| 16 Juli 2026 | SSL setup | ✅ |
| 16 Juli 2026 | IP whitelisted | ✅ |
| 16 Juli 2026 | API credentials received | ✅ |
| 17 Juli 2026 | **RC 40 Error SOLVED** | ✅ |
| 17 Juli 2026 | Proxy tested & working | ✅ |
| TBD | Deposit to account | ⏳ |
| TBD | Integration with website | ⏳ |
| TBD | Go-Live | ⏳ |

---

## 🔧 Troubleshooting

### RC 41 - Signature Salah

1. Pastikan Production/Development toggle di dashboard sesuai
2. Pastikan signature dihitung dari `command_string` yang benar
3. Cek apakah IP sudah whitelisted

### RC 40 - Payload Error

1. Cek format JSON body
2. Pastikan `Content-Type: application/json` di header

### RC 45 - IP Tidak Dikenali

1. Cek IP whitelist di dashboard
2. Pastikan IP server sudah benar
3. Cek apakah toggle mode sesuai

---

## 📝 Checklist Sebelum Go-Live

### VPS & Proxy ✅

- [x] Beli VPS DomaiNesia
- [x] Install Ubuntu 24.04
- [x] Install Node.js + PM2
- [x] Deploy proxy script
- [x] Setup DNS domain
- [x] Setup SSL (HTTPS)
- [x] Update proxy dengan SSL

### Digiflazz ✅

- [x] KYC Privy.id selesai
- [x] Screenshot profil Privy ke CS
- [x] IP di-whitelist (103.169.207.161, 182.10.97.46)
- [x] Dapat API credentials
- [x] Update proxy script dengan credentials
- [x] Test API Digiflazz - **WORKING**

### Code Updates ⏳

- [ ] Deposit saldo ke akun Digiflazz
- [ ] Update `src/lib/api.ts` dengan Digiflazz proxy URL
- [ ] Update `src/lib/sakurupiah.ts` callback URL
- [ ] Implementasi fulfillment di webhook callback
- [ ] Test end-to-end flow

---

## 🔗 Link Penting

| Service | URL | Notes |
|---------|-----|-------|
| VPS Panel | (cek email DomaiNesia) | Manage VPS |
| Hostinger | https://hpanel.hostinger.com | DNS Management |
| Digiflazz | https://member.digiflazz.com | Dashboard |
| Privy.id | https://privy.id | KYC |
| Website | https://topup-kilat-chi.vercel.app | Current live site |
| **Proxy API** | https://api.topupkilat.store | **WORKING!** |

---

## 📊 Estimated Biaya Bulanan

| Item | Harga |
|------|-------|
| VPS DomaiNesia | Rp 48.000 |
| Domain .store (Hostinger) | ~Rp 15.000 |
| **Total** | **~Rp 63.000/bulan** |

---

## 📝 Notes

### Masalah RC 40/41 yang Ditemukan

1. **Toggle Production/Development** di dashboard harus sesuai dengan key yang dipakai
2. **Signature command string** berbeda dari `cmd` di body:
   - `cmd: "deposit"` → sign dari: `"depo"`
   - `cmd: "prepaid"` → sign dari: `"pricelist"`
3. Field signature di body harus `sign` bukan `signature`

### Solution

1. Aktifkan **Production Mode** di dashboard Digiflazz
2. Gunakan **Production Key** untuk production environment
3. Gunakan **Development Key** untuk development/testing
4. Pastikan IP whitelist sesuai dengan environment

---

*Dokumen ini diupdate pada: 17 Juli 2026*
