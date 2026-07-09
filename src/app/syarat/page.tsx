'use client'

import { motion } from 'framer-motion'

export default function SyaratPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-dark-100/50 border-b border-white/5">
        <div className="container-page py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Syarat &{' '}
              <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-accent-cyan to-primary-400">
                Ketentuan
              </span>
            </h1>
            <p className="text-white/60">
              last updated: 9 Juli 2026
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container-page py-12">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-primary rounded-2xl border border-white/5 p-8"
          >
            <div className="prose prose-invert prose-sm max-w-none space-y-6">
              <section>
                <h2 className="text-xl font-bold text-white mb-3">1. Umum</h2>
                <p className="text-white/70">
                  Dengan mengakses dan menggunakan layanan Topup Kilat, Anda setuju untuk terikat
                  dengan syarat dan ketentuan ini. Jika Anda tidak setuju dengan syarat ini,
                  silakan jangan menggunakan layanan kami.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">2. Layanan</h2>
                <p className="text-white/70 mb-3">
                  Topup Kilat menyediakan layanan top up game digital, termasuk tetapi tidak
                  terbatas pada:
                </p>
                <ul className="list-disc list-inside text-white/70 space-y-1">
                  <li>Diamond (Mobile Legends, Free Fire, dll)</li>
                  <li>UC (PUBG Mobile)</li>
                  <li>CP (Valorant)</li>
                  <li>Dan mata uang virtual game lainnya</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">3. Pembayaran</h2>
                <p className="text-white/70 mb-3">
                  Pembayaran harus dilakukan dalam waktu yang ditentukan setelah order dibuat.
                  Pembayaran yang tidak diterima dalam waktu 24 jam akan menyebabkan order
                  dibatalkan secara otomatis.
                </p>
                <p className="text-white/70">
                  Metode pembayaran yang diterima termasuk: QRIS, Virtual Account (BCA, BNI,
                  Mandiri, BRI), dan e-wallet (GoPay, OVO, DANA, ShopeePay).
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">4. Pengiriman</h2>
                <p className="text-white/70 mb-3">
                  Item top up akan dikirimkan setelah pembayaran terkonfirmasi. Waktu pengiriman
                  biasanya 1-15 menit, tetapi dapat lebih lama pada kondisi tertentu.
                </p>
                <p className="text-white/70">
                  <strong>Penting:</strong> Pastikan ID Player dan Server yang Anda masukkan
                  sudah benar. Item yang sudah dikirim ke akun yang salah tidak dapat ditarik
                  kembali.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">5. Refund</h2>
                <p className="text-white/70">
                  Refund hanya dapat dilakukan jika item tidak masuk ke akun setelah 24 jam
                  pembayaran berhasil. Refund harus diajukan melalui customer service dengan
                  menyertakan bukti pembayaran.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">6. Tanggung Jawab</h2>
                <p className="text-white/70">
                  Topup Kilat tidak bertanggung jawab atas kesalahan yang dilakukan oleh
                  pengguna, termasuk tetapi tidak terbatas pada ID Player yang salah, Server
                  yang salah, atau informasi akun yang tidak valid.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">7. Perubahan Syarat</h2>
                <p className="text-white/70">
                  Topup Kilat berhak mengubah syarat dan ketentuan ini kapan saja tanpa
                  pemberitahuan terlebih dahulu. Perubahan akan berlaku segera setelah
                  dipublikasikan di website ini.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">8. Hukum yang Berlaku</h2>
                <p className="text-white/70">
                  Syarat dan ketentuan ini diatur oleh hukum yang berlaku di Republik
                  Indonesia. Setiap perselisihan akan diselesaikan secara musyawarah
                  untuk mufakat.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">9. Kontak</h2>
                <p className="text-white/70">
                  Untuk pertanyaan mengenai syarat dan ketentuan ini, silakan hubungi kami
                  melalui:
                </p>
                <ul className="list-disc list-inside text-white/70 mt-2 space-y-1">
                  <li>Email: support@topupkilat.com</li>
                  <li>WhatsApp: +62 812-3456-7890</li>
                </ul>
              </section>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
