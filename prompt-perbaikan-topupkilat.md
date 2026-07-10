# Prompt Perbaikan Project TopupKilat (Urut Prioritas)

> Cara pakai: salin dan tempel prompt di bawah ke Claude Code (atau AI coding assistant lain) yang sudah terhubung ke repo TopupKilat. Kerjakan **satu bagian dulu sampai selesai dan diuji**, baru lanjut ke bagian berikutnya — jangan digabung sekaligus karena bagian 1-3 saling bergantung dan berisiko tinggi jika terburu-buru.

---

## PRIORITAS 1 — Perbaiki Row Level Security (RLS) Supabase (KRITIS)

```
Bertindaklah sebagai Database Security Engineer. Project ini menggunakan Supabase dan file
supabase-setup.sql saat ini MENONAKTIFKAN RLS di semua tabel (users, games, game_products,
orders, payments, vouchers, promos, wishlists, points_ledger, notifications,
supplier_requests) dan memberi GRANT ALL ON ALL TABLES TO anon. Ini kritis karena anon key
bersifat publik (ter-embed di client bundle).

Tugas:
1. Buat file migrasi SQL baru (jangan edit file lama langsung, buat versi baru bernomor)
   yang meng-ENABLE RLS di semua tabel di atas.
2. Buat policy per tabel dengan prinsip least privilege:
   - users: user hanya boleh SELECT/UPDATE baris miliknya sendiri (auth.uid() = id).
     Role ADMIN/SUPER_ADMIN boleh akses semua (cek via kolom role di tabel users,
     pakai security definer function agar tidak infinite recursion).
   - games, game_products, promos, vouchers: SELECT publik boleh (untuk anon & authenticated)
     tapi INSERT/UPDATE/DELETE HANYA untuk role ADMIN/SUPER_ADMIN.
   - orders, payments: user hanya boleh SELECT order/payment miliknya sendiri
     (auth.uid() = user_id, atau join lewat orders.user_id untuk payments).
     INSERT order boleh oleh authenticated user untuk dirinya sendiri.
     UPDATE status order/payment TIDAK boleh dari client sama sekali — hanya lewat
     service_role key di server (API routes).
   - wishlists, points_ledger, notifications: scoped ke auth.uid() milik user.
   - supplier_requests: hanya service_role/admin yang boleh akses.
3. Cabut GRANT ALL FROM anon, ganti dengan GRANT SELECT saja pada tabel yang memang
   perlu dibaca publik (games, game_products, promos), sisanya tanpa grant langsung
   (diatur RLS policy saja).
4. Tulis skrip test (bisa pakai supabase-js dengan anon key) yang membuktikan:
   - Anon TIDAK BISA update kolom role di tabel users.
   - Anon TIDAK BISA update status di tabel payments/orders.
   - User A TIDAK BISA melihat order milik User B.
5. Update README dengan instruksi cara apply migrasi RLS ini di Supabase project.

Jangan ubah skema kolom/tabel yang sudah ada, fokus HANYA pada RLS & grants.
```

---

## PRIORITAS 2 — Wajibkan Verifikasi Signature Webhook Sakurupiah (KRITIS)

```
Bertindaklah sebagai Backend Security Engineer. File src/app/api/callback/sakurupiah/route.ts
saat ini memverifikasi signature webhook TAPI tetap melanjutkan proses meski signature
tidak valid (ada komentar "Continue anyway for now - signature might be optional").
Ini membuat siapa pun bisa memalsukan callback pembayaran dan menandai order sebagai PAID
tanpa membayar sungguhan.

Tugas:
1. Ubah logika verifikasi signature agar WAJIB (tidak opsional):
   - Jika header x-callback-signature tidak ada ATAU tidak valid dibanding
     HMAC-SHA256(SAKURUPIAH_API_KEY, rawBody), langsung return 401 Unauthorized
     dan JANGAN proses update apa pun ke database.
   - Log percobaan yang gagal verifikasi (untuk audit/rate-limiting).
2. Pastikan fungsi verifyCallbackSignature() di src/lib/sakurupiah.ts yang sudah ada
   dipakai secara konsisten di sini (saat ini logic verifikasi malah ditulis ulang manual
   di dalam route.ts).
3. Konfirmasi ke dokumentasi resmi Sakurupiah format signature yang benar (nama header,
   algoritma hash, data apa saja yang di-sign) — jangan asumsi, cek dokumentasi asli
   jika tersedia di repo (workers/ atau lib/sakurupiah.ts referensinya).
4. Tambahkan test case: kirim request dummy ke endpoint callback dengan signature salah,
   pastikan response 401 dan tidak ada perubahan status di database.
5. Terapkan pola yang sama (verifikasi signature wajib, reject jika gagal) untuk semua
   webhook lain di project ini jika ada (misalnya dari Digiflazz proxy worker).
```

---

## PRIORITAS 3 — Hitung Ulang Total Pembayaran di Server, Jangan Percaya Client (KRITIS)

```
Bertindaklah sebagai Backend Engineer yang fokus pada integritas transaksi finansial.
File src/app/api/payments/create/route.ts saat ini menerima field `amount` LANGSUNG dari
body request client dan mengirimkannya ke Sakurupiah tanpa validasi ulang. Ini berarti
pengguna bisa memanipulasi request (via DevTools/Postman) untuk membayar dengan nominal
yang lebih rendah dari harga produk asli.

Tugas:
1. Ubah endpoint create payment agar:
   - Hanya menerima orderId dari client (bukan amount, gameName, productName langsung).
   - Ambil data order dari database Supabase menggunakan orderId, lalu JOIN ke
     game_products untuk mendapatkan harga asli (product.price), voucher_discount,
     dan hitung ulang total di server.
   - Bandingkan hasil hitungan server dengan total yang tersimpan di kolom orders.total
     saat order dibuat — jika beda, tolak request (kemungkinan tampering) dan log insiden.
   - Field `amount` yang dikirim ke Sakurupiah HARUS berasal dari hasil kalkulasi server,
     bukan dari body request.
2. Cek juga alur pembuatan order (CheckoutContext.tsx / halaman checkout) — pastikan saat
   order awal dibuat, kolom `total`/`subtotal` juga dihitung ulang di server (via API route
   atau Supabase function), bukan dikirim mentah dari state client.
3. Tambahkan validasi tambahan: jumlah minimum/maksimum transaksi sesuai kebijakan bisnis,
   dan pastikan orderId yang dipakai belum pernah punya payment lain yang statusnya PAID
   (mencegah double payment/replay).
4. Tulis test yang mensimulasikan client mengirim amount yang dimanipulasi, pastikan
   server menolak atau mengabaikan nilai tersebut dan tetap memakai harga dari database.
```

---

## PRIORITAS 4 — Bersihkan Kredensial dari Git & File Konfigurasi (TINGGI)

```
Bertindaklah sebagai DevOps Engineer. Beberapa file di repo ini mengandung URL Supabase
dan anon key nyata (bukan placeholder) yang ter-commit ke git:
- .env.example (harus berisi contoh/placeholder, bukan value asli project)
- test-full-flow.ts, test-order.ts, test-supabase.ts (hardcode credentials langsung
  di source code, berada di root repo)

Tugas:
1. Ganti isi .env.example agar semua value jadi placeholder generik
   (contoh: NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co), sesuai konvensi
   yang sudah benar dipakai untuk SAKURUPIAH_API_ID/SAKURUPIAH_API_KEY di file yang sama.
2. Pindahkan test-full-flow.ts, test-order.ts, test-supabase.ts ke folder scripts/
   atau __tests__/manual/, dan ubah agar membaca URL & key dari process.env
   (pakai dotenv), bukan hardcoded string.
3. Karena anon key ini sifatnya memang public by design (bukan rahasia), commit ini
   BUKAN kebocoran kredensial kritis — tapi tetap perbaiki sebagai best practice dan
   agar key mudah dirotasi ke depannya tanpa perlu mengubah banyak file.
4. Pastikan tidak ada SUPABASE_SERVICE_ROLE_KEY, SAKURUPIAH_API_KEY, atau FONNTE_API_KEY
   asli yang pernah ter-commit di riwayat git manapun — jalankan git log -p atau grep
   di seluruh riwayat commit untuk memastikan.
5. Tambahkan pre-commit hook sederhana (misal pakai gitleaks atau git-secrets) agar
   kejadian serupa tidak terulang di masa depan.
```

---

## PRIORITAS 5 — Bereskan Backend Ganda (`apps/api`) & Dokumentasi (SEDANG)

```
Bertindaklah sebagai Software Architect. Repo ini punya dua implementasi backend yang
tidak konsisten: (1) Next.js API routes + Supabase langsung yang aktif dipakai frontend,
dan (2) folder apps/api berisi NestJS + Prisma + PostgreSQL lengkap dengan Dockerfile
dan migration yang TIDAK terhubung ke frontend sama sekali.

Tugas:
1. Konfirmasi dulu ke saya (jangan asumsi sendiri): apakah apps/api ini rencananya akan
   dipakai untuk migrasi ke depan, atau memang sisa eksperimen yang boleh dihapus?
2. Jika keputusannya DIHAPUS: hapus folder apps/api sepenuhnya dari repo (termasuk
   node_modules, dist, .env), commit dengan pesan jelas "remove unused NestJS backend
   experiment", dan update README agar tidak menyinggung backend ini lagi.
3. Jika keputusannya DIPERTAHANKAN untuk migrasi masa depan: pindahkan ke branch terpisah
   atau beri README khusus di dalam apps/api yang menjelaskan statusnya jelas
   ("experimental, not in use, migration in progress") agar tidak membingungkan
   developer baru.
4. Setelah keputusan di atas dieksekusi, update README utama project dengan bagian
   "Backend & Database Setup" yang menjelaskan: skema SQL yang harus dijalankan di
   Supabase, environment variable yang wajib diisi (termasuk SUPABASE_SERVICE_ROLE_KEY),
   cara test webhook secara lokal (misal pakai ngrok), dan diagram alur data
   singkat (Frontend → API Routes → Supabase / Sakurupiah / Fonnte).
```

---

## PRIORITAS 6 — Migrasi Skema ke Version-Controlled Migrations + Index (SEDANG)

```
Bertindaklah sebagai Database Engineer. Saat ini skema tabel Supabase (definisi kolom,
tipe, constraint) tidak sepenuhnya tercermin di supabase-setup.sql — file itu hanya berisi
perintah ALTER/GRANT, bukan CREATE TABLE lengkap. Ini berisiko untuk disaster recovery
karena skema tidak ter-version-control penuh.

Tugas:
1. Setup Supabase CLI di project ini (jika belum), lalu jalankan supabase db pull
   untuk menarik skema aktual dari project Supabase yang sedang jalan ke folder
   supabase/migrations/.
2. Review hasilnya, pastikan semua tabel (users, games, game_products, orders, payments,
   vouchers, promos, wishlists, points_ledger, notifications, supplier_requests) beserta
   kolom, tipe data, dan constraint-nya lengkap tercatat.
3. Tambahkan index pada kolom yang sering dipakai untuk filter/join, minimal:
   - payments.provider_ref, payments.merchant_ref
   - orders.invoice_no, orders.user_id
   - game_products.game_id
   - users.email (jika belum unique index otomatis dari Supabase Auth)
4. Commit migration files ini ke git, dan dokumentasikan di README cara menjalankan
   migrasi untuk environment baru (staging/local).
```

---

## PRIORITAS 7 — Dockerfile & CORS Hardening untuk Aplikasi Utama (RENDAH)

```
Bertindaklah sebagai DevOps Engineer. Project utama (Next.js) belum punya Dockerfile
sendiri (hanya apps/api yang punya, dan itu tidak dipakai). Selain itu Cloudflare Worker
di workers/digiflazz-proxy.js mengirim header Access-Control-Allow-Origin: '*' padahal
proxy ini seharusnya hanya dipanggil server-ke-server.

Tugas:
1. Buat Dockerfile multi-stage standar untuk aplikasi Next.js (base node:20-alpine,
   builder stage untuk npm ci + build, production stage yang copy .next/standalone
   output saja, jalankan sebagai non-root user, expose port 3000, tambahkan HEALTHCHECK).
2. Tambahkan docker-compose.yml sederhana untuk local dev (opsional, jika tim mau
   testing tanpa Vercel).
3. Di workers/digiflazz-proxy.js, hapus header Access-Control-Allow-Origin: '*' karena
   proxy ini dipanggil server-to-server (dari API route Next.js ke Cloudflare Worker),
   bukan dari browser — jadi CORS header tidak diperlukan sama sekali. Jika ternyata ada
   kebutuhan dipanggil dari domain tertentu, batasi ke domain aplikasi resmi saja.
4. Update README dengan instruksi build & run via Docker sebagai alternatif dari
   `npm run dev`.
```

---

### Catatan Penting

- **Kerjakan Prioritas 1–3 dulu dan uji secara menyeluruh sebelum menyentuh apa pun yang lain** — ini menutup celah yang memungkinkan pencurian data user, pengambilalihan akses admin, dan pemalsuan status pembayaran.
- Setelah Prioritas 1 (RLS) diaktifkan, **wajib regression test seluruh alur aplikasi** (login, register, checkout, admin panel) karena banyak query yang tadinya berjalan lewat anon key tanpa hambatan bisa saja mulai gagal jika policy kurang lengkap.
- Simpan rotasi key (jika Anda memutuskan mengganti anon key/service role key setelah audit ini) di catatan terpisah, dan update seluruh environment (Vercel, local .env, Cloudflare Worker) secara bersamaan agar tidak ada downtime.
