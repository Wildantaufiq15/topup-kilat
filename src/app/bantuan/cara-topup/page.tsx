'use client'

import { motion } from 'framer-motion'
import { Search, CreditCard, Gamepad2, CheckCircle, ArrowRight, Zap } from 'lucide-react'

const steps = [
  {
    icon: Search,
    title: 'Pilih Game',
    description: 'Cari dan pilih game yang ingin kamu top up dari daftar game yang tersedia.',
  },
  {
    icon: Gamepad2,
    title: 'Masukkan ID Player',
    description: 'Masukkan ID player dan server (jika diperlukan) untuk akun game kamu.',
  },
  {
    icon: CreditCard,
    title: 'Pilih Nominal & Bayar',
    description: 'Pilih jumlah diamond UC atau item yang diinginkan, lalu selesaikan pembayaran.',
  },
  {
    icon: CheckCircle,
    title: 'Item Masuk',
    description: 'Diamond UC akan masuk ke akun kamu dalam hitungan menit setelah pembayaran berhasil.',
  },
]

export default function CaraTopupPage() {
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
              Cara{' '}
              <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-accent-cyan to-primary-400">
                Top Up
              </span>
            </h1>
            <p className="text-white/60">
              Langkah mudah untuk top up game favorit kamu
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container-page py-12">
        {/* Steps */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            4 Langkah Mudah
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative bg-surface-primary rounded-2xl border border-white/5 p-6"
              >
                {/* Step Number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-accent-purple flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{index + 1}</span>
                </div>

                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-600/20 to-accent-purple/20 flex items-center justify-center mb-4">
                  <step.icon className="w-7 h-7 text-primary-400" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-white/60 text-sm">{step.description}</p>

                {/* Arrow (except last) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2">
                    <ArrowRight className="w-5 h-5 text-primary-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Pertanyaan Umum
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: 'Berapa lama diamond/UC masuk setelah pembayaran?',
                a: 'Proses biasanya memakan waktu 1-15 menit setelah pembayaran berhasil. Jika lebih dari 30 menit, silakan hubungi customer service.',
              },
              {
                q: 'Apakah aman top up di Topup Kilat?',
                a: 'Ya, Topup Kilat menggunakan payment gateway yang terenkripsi dan terpercaya. Data transaksi kamu aman 100%.',
              },
              {
                q: 'Bagaimana jika item tidak masuk?',
                a: 'Hubungi customer service melalui WhatsApp atau email dengan menyertakan nomor invoice. Kami akan bantu menyelesaikan masalah kamu.',
              },
              {
                q: 'Metode pembayaran apa saja yang tersedia?',
                a: 'Kami menerima QRIS, Virtual Account (BCA, BNI, Mandiri, BRI), dan e-wallet (GoPay, OVO, DANA, ShopeePay).',
              },
              {
                q: 'Apakah bisa top up tanpa login?',
                a: 'Ya, kamu bisa top up sebagai guest. Namun, disarankan untuk login agar bisa melihat riwayat transaksi.',
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-surface-primary rounded-xl border border-white/5 p-6"
              >
                <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-white/60 text-sm">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600/20 to-accent-purple/20 rounded-full border border-primary-500/20 mb-6">
            <Zap className="w-5 h-5 text-primary-400" />
            <span className="text-white/80">Proses cepat & otomatis 24/7</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Siap Top Up Sekarang?
          </h2>
          <a
            href="/games"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-bold hover:from-primary-500 hover:to-primary-400 transition-all shadow-lg shadow-primary-500/25"
          >
            Mulai Top Up
            <ArrowRight size={20} />
          </a>
        </motion.div>
      </div>
    </div>
  )
}
