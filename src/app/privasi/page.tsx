'use client'

import { motion } from 'framer-motion'

export default function PrivasiPage() {
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
              Kebijakan{' '}
              <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-accent-cyan to-primary-400">
                Privasi
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
                <h2 className="text-xl font-bold text-white mb-3">1. Pengenalan</h2>
                <p className="text-white/70">
                  Topup Kilat (&quot;kami&quot;, &quot; kita&quot;) berkomitmen untuk melindungi privasi Anda.
                  Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan,
                  dan melindungi informasi pribadi Anda ketika Anda menggunakan layanan kami.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">2. Informasi yang Kami Kumpulkan</h2>
                <p className="text-white/70 mb-3">Kami dapat mengumpulkan informasi berikut:</p>
                <ul className="list-disc list-inside text-white/70 space-y-1">
                  <li><strong>Informasi Akun:</strong> Nama, email, nomor HP, dan password (jika register)</li>
                  <li><strong>Informasi Transaksi:</strong> ID Player, Server ID, dan riwayat pembelian</li>
                  <li><strong>Data Pembayaran:</strong> Informasi metode pembayaran (diproses oleh payment gateway)</li>
                  <li><strong>Data Penggunaan:</strong> Cookie, IP address, dan aktivitas browsing</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">3. Penggunaan Informasi</h2>
                <p className="text-white/70 mb-3">Informasi yang kami kumpulkan digunakan untuk:</p>
                <ul className="list-disc list-inside text-white/70 space-y-1">
                  <li>Memproses transaksi top up Anda</li>
                  <li>Mengirimkan item top up ke akun game Anda</li>
                  <li>Memberikan customer service dan dukungan</li>
                  <li>Mengirimkan notifikasi terkait pesanan</li>
                  <li>Meningkatkan layanan dan pengalaman pengguna</li>
                  <li>Mencegah penipuan dan penyalahgunaan</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">4. Perlindungan Data</h2>
                <p className="text-white/70">
                  Kami menggunakan langkah-langkah keamanan yang tepat untuk melindungi informasi
                  pribadi Anda, termasuk enkripsi data, firewall, dan prosedur keamanan internal.
                  Namun, tidak ada metode transmisi internet yang 100% aman.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">5. Berbagi Informasi</h2>
                <p className="text-white/70 mb-3">Kami tidak menjual informasi pribadi Anda. Informasi dapat dibagikan dengan:</p>
                <ul className="list-disc list-inside text-white/70 space-y-1">
                  <li><strong>Payment Gateway:</strong> Untuk memproses pembayaran (Sakurupiah)</li>
                  <li><strong>Supplier Game:</strong> Untuk mengirim item top up (Digiflazz, dll)</li>
                  <li><strong>Penyedia Hosting:</strong> Untuk menyimpan data (Supabase, Vercel)</li>
                  <li><strong>Pihak Berwenang:</strong> Jika diperlukan oleh hukum</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">6. Cookie</h2>
                <p className="text-white/70">
                  Kami menggunakan cookie untuk meningkatkan pengalaman browsing Anda. Cookie adalah
                  file kecil yang disimpan di perangkat Anda. Anda dapat mengatur browser untuk
                  menolak cookie jika diinginkan.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">7. Hak Anda</h2>
                <p className="text-white/70 mb-3">Anda memiliki hak untuk:</p>
                <ul className="list-disc list-inside text-white/70 space-y-1">
                  <li>Mengakses informasi pribadi Anda</li>
                  <li>Memperbaiki informasi yang tidak akurat</li>
                  <li>Menghapus akun dan data Anda</li>
                  <li>Menolak pemasaran langsung</li>
                  <li>Mengajukan keluhan ke otoritas perlindungan data</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">8. Penyimpanan Data</h2>
                <p className="text-white/70">
                  Data Anda disimpan selama Anda memiliki akun dan untuk periode yang diperlukan
                  setelah akun dihapus untuk memenuhi kewajiban hukum. Data transaksi disimpan
                  minimal 5 tahun sesuai peraturan perpajakan Indonesia.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">9. Perubahan Kebijakan</h2>
                <p className="text-white/70">
                  Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan
                  akan dipublikasikan di halaman ini dengan tanggal &quot;last updated&quot; yang baru.
                  Kami sarankan untuk memeriksa halaman ini secara berkala.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">10. Kontak</h2>
                <p className="text-white/70">
                  Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami:
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
