'use client'

import { motion } from 'framer-motion'
import { Zap, Shield, Clock, CreditCard, Headphones, Gift } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Proses Instan',
    description: 'Top up langsung masuk ke akun game dalam 1-5 menit setelah pembayaran.',
    color: 'from-yellow-400 to-orange-400',
  },
  {
    icon: Shield,
    title: 'Aman & Terpercaya',
    description: 'Transaksi dilindungi enkripsi SSL dan sistem keamanan tingkat tinggi.',
    color: 'from-green-400 to-emerald-400',
  },
  {
    icon: Clock,
    title: '24 Jam Non-Stop',
    description: 'Layanan top up tersedia setiap saat, termasuk hari libur.',
    color: 'from-blue-400 to-cyan-400',
  },
  {
    icon: CreditCard,
    title: 'Berbagai Metode',
    description: 'Bayar dengan QRIS, e-wallet, virtual account, atau transfer bank.',
    color: 'from-purple-400 to-pink-400',
  },
  {
    icon: Headphones,
    title: 'Support Responsif',
    description: 'Tim customer service siap membantu via chat 24/7.',
    color: 'from-red-400 to-rose-400',
  },
  {
    icon: Gift,
    title: 'Promo Menarik',
    description: 'Dapatkan diskon dan cashback dari berbagai promo menarik setiap hari.',
    color: 'from-accent-cyan to-primary-400',
  },
]

export function FeatureSection() {
  return (
    <section className="py-16 bg-dark-100/50">
      <div className="container-page">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Kenapa Pilih{' '}
            <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-accent-purple">
              Topup Kilat?
            </span>
          </h2>
          <p className="text-white/60 max-w-xl mx-auto">
            Kami memberikan pengalaman top up terbaik dengan berbagai keunggulan yang tidak akan Anda temukan di tempat lain.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group p-6 bg-surface-primary rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} p-0.5 mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <div className="w-full h-full rounded-xl bg-surface-primary flex items-center justify-center">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
