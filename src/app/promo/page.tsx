'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'
import { mockPromos, mockVouchers } from '../data/mockData'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Gift, Tag, Clock, Percent, ArrowRight, Sparkles } from 'lucide-react'

export default function PromoPage() {
  const promos = mockPromos
  const vouchers = mockVouchers

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-900/50 to-dark-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-3xl" />

        <div className="container-page relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto"
          >
            <Badge variant="glow" className="mb-4">
              <Sparkles size={14} />
              Promo Spesial
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Promo &{' '}
              <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-accent-cyan to-primary-400">
                Diskon Menarik
              </span>
            </h1>
            <p className="text-white/70 text-lg">
              Tingkatkan pengalaman gaming Anda dengan berbagai promo eksklusif dan voucher diskon dari Topup Kilat.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Active Promos */}
      <section className="container-page py-8">
        <div className="flex items-center gap-2 mb-6">
          <Gift className="w-6 h-6 text-accent-purple" />
          <h2 className="text-2xl font-bold text-white">Promo Aktif</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promos.map((promo, index) => (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group bg-surface-primary rounded-2xl border border-white/5 overflow-hidden hover:border-primary-500/30 transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={promo.image}
                  alt={promo.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-primary via-transparent to-transparent" />

                {/* Badge */}
                <div className="absolute top-4 left-4">
                  <Badge variant="primary">Promo</Badge>
                </div>

                {/* Expires */}
                <div className="absolute top-4 right-4">
                  <Badge variant="warning">
                    <Clock size={12} />
                    {formatDate(promo.endDate)}
                  </Badge>
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-bold text-white text-lg mb-2">{promo.title}</h3>
                <p className="text-white/60 text-sm mb-4">{promo.description}</p>

                <Link
                  href={promo.link || '#'}
                  className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium text-sm"
                >
                  Lihat Detail
                  <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Vouchers */}
      <section className="container-page py-8">
        <div className="flex items-center gap-2 mb-6">
          <Tag className="w-6 h-6 text-accent-cyan" />
          <h2 className="text-2xl font-bold text-white">Voucher Tersedia</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vouchers.map((voucher, index) => {
            const remaining = voucher.quota - voucher.usedQuota
            const percentUsed = (voucher.usedQuota / voucher.quota) * 100

            return (
              <motion.div
                key={voucher.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative bg-surface-primary rounded-2xl border border-accent-cyan/30 overflow-hidden"
              >
                {/* Decorative */}
                <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-accent-cyan/30 rounded-tl-2xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-accent-cyan/30 rounded-br-2xl" />

                <div className="p-6">
                  {/* Discount Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-gradient-to-r from-accent-cyan/20 to-primary-500/20 border border-accent-cyan/30 rounded-xl px-4 py-2">
                      <span className="text-2xl font-bold text-accent-cyan">
                        {voucher.discountType === 'percentage'
                          ? `${voucher.discountValue}%`
                          : formatCurrency(voucher.discountValue)}
                      </span>
                      <span className="block text-xs text-white/60">
                        {voucher.discountType === 'percentage' ? 'OFF' : 'DISKON'}
                      </span>
                    </div>
                    <Badge variant="success">
                      <Percent size={12} />
                      Tersedia
                    </Badge>
                  </div>

                  {/* Voucher Info */}
                  <h3 className="font-bold text-white mb-1">{voucher.name}</h3>
                  <p className="text-sm text-white/60 mb-4">{voucher.description}</p>

                  {/* Min Transaction */}
                  <p className="text-xs text-white/50 mb-4">
                    Min. transaksi {formatCurrency(voucher.minTransaction)}
                  </p>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">Tersisa {remaining} dari {voucher.quota}</span>
                      <span className="text-accent-cyan">{percentUsed.toFixed(0)}% terpakai</span>
                    </div>
                    <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent-cyan to-primary-500 transition-all"
                        style={{ width: `${100 - percentUsed}%` }}
                      />
                    </div>
                  </div>

                  {/* Code */}
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-white tracking-wider">{voucher.code}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(voucher.code)}
                        className="text-xs text-primary-400 hover:text-primary-300"
                      >
                        Salin
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-16">
        <div className="bg-gradient-to-r from-primary-600 to-accent-purple rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Tidak menemukan promo yang cocok?
          </h2>
          <p className="text-white/80 mb-6 max-w-lg mx-auto">
            Jangan khawatir! Pantau terus halaman ini untuk promo terbaru yang mungkin lebih sesuai dengan kebutuhan Anda.
          </p>
          <Link
            href="/games"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-primary-600 font-bold hover:bg-white/90 transition-all"
          >
            Mulai Top Up Sekarang
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
