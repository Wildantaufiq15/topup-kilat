'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import NextLink from 'next/link'
import { Shield, Clock, Zap, Heart, Users, Award } from 'lucide-react'

const stats = [
  { value: '50K+', label: 'Transaksi Berhasil' },
  { value: '20+', label: 'Game Tersedia' },
  { value: '4.9/5', label: 'Rating Pelanggan' },
  { value: '24/7', label: 'Support Aktif' },
]

const values = [
  {
    icon: Zap,
    title: 'Cepat',
    description: 'Proses top up otomatis dan instan. Diamond/UC masuk dalam hitungan menit.',
  },
  {
    icon: Shield,
    title: 'Aman',
    description: 'Transaksi terenkripsi dengan payment gateway terpercaya. Data kamu aman 100%.',
  },
  {
    icon: Clock,
    title: 'Mudah',
    description: 'Interface yang simpel dan mudah dipahami. Top up dalam 3 langkah saja.',
  },
  {
    icon: Heart,
    title: 'Terpercaya',
    description: 'Ribuan pelanggan puas dengan layanan kami. Tested & trusted.',
  },
]

const team = [
  {
    name: 'Tim Topup Kilat',
    role: 'Developer & Customer Service',
    description: 'Tim profesional yang siap membantu kamu 24/7',
  },
]

export default function TentangPage() {
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
              Tentang{' '}
              <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-accent-cyan to-primary-400">
                Kami
              </span>
            </h1>
            <p className="text-white/60">
              Kenali lebih dekat dengan Topup Kilat
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container-page py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-purple p-1 mb-6">
            <Image
              src="/logo-topup-kilat.png"
              alt="Topup Kilat"
              width={80}
              height={80}
              className="w-full h-full rounded-xl object-contain bg-dark-100"
            />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Topup Kilat
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto text-lg">
            Platform top up game terpercaya di Indonesia. Kami berkomitmen memberikan
            pengalaman top up yang cepat, mudah, dan aman untuk para gamers Indonesia.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-surface-primary rounded-2xl border border-white/5 p-6 text-center"
            >
              <div className="text-3xl md:text-4xl font-bold text-gradient bg-clip-text text-transparent bg-gradient-to-r from-accent-cyan to-primary-400 mb-2">
                {stat.value}
              </div>
              <div className="text-white/60 text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-primary rounded-2xl border border-white/5 p-8 mb-16"
        >
          <h2 className="text-2xl font-bold text-white mb-4 text-center">Misi Kami</h2>
          <p className="text-white/70 text-center max-w-3xl mx-auto">
            Misi kami adalah menjadi platform top up game nomor satu di Indonesia dengan
           提供 memberikan layanan terbaik, harga termurah, dan pengalaman pengguna yang
            menyenangkan. Kami percaya bahwa setiap gamer berhak mendapatkan akses mudah
            ke konten game favorit mereka tanpa harus ribet.
          </p>
        </motion.div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Nilai-Nilai Kami
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-surface-primary rounded-2xl border border-white/5 p-6 text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-600/20 to-accent-purple/20 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-7 h-7 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{value.title}</h3>
                <p className="text-white/60 text-sm">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Team */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Tim Kami
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-surface-primary rounded-2xl border border-white/5 p-6 text-center w-64"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-600 to-accent-purple flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-1">{member.name}</h3>
                <p className="text-primary-400 text-sm mb-2">{member.role}</p>
                <p className="text-white/60 text-sm">{member.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Siap Top Up Sekarang?
          </h2>
          <p className="text-white/60 mb-6">
            Bergabung dengan ribuan gamers yang sudah mempercayai Topup Kilat
          </p>
          <NextLink
            href="/games"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-bold hover:from-primary-500 hover:to-primary-400 transition-all shadow-lg shadow-primary-500/25"
          >
            Mulai Top Up
          </NextLink>
        </motion.div>
      </div>
    </div>
  )
}
