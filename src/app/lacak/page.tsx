'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Package, Clock, CheckCircle, XCircle } from 'lucide-react'

export default function LacakPage() {
  const [invoiceNo, setInvoiceNo] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [notFound, setNotFound] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invoiceNo.trim()) return

    setIsSearching(true)
    setNotFound(false)
    setResult(null)

    try {
      // Simulate search - in production, call API
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock result for demo
      if (invoiceNo.toLowerCase().includes('test')) {
        setResult({
          invoiceNo: invoiceNo.toUpperCase(),
          game: 'Mobile Legends',
          product: '86 Diamond',
          total: 20000,
          status: 'SUCCESS',
          date: new Date().toISOString(),
        })
      } else {
        setNotFound(true)
      }
    } catch (error) {
      setNotFound(true)
    } finally {
      setIsSearching(false)
    }
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: any; color: string; label: string }> = {
      PENDING: { icon: Clock, color: 'text-yellow-400 bg-yellow-400/10', label: 'Menunggu Pembayaran' },
      PAID: { icon: Clock, color: 'text-blue-400 bg-blue-400/10', label: 'Sudah Dibayar' },
      PROCESSING: { icon: Package, color: 'text-purple-400 bg-purple-400/10', label: 'Sedang Diproses' },
      SUCCESS: { icon: CheckCircle, color: 'text-green-400 bg-green-400/10', label: 'Berhasil' },
      FAILED: { icon: XCircle, color: 'text-red-400 bg-red-400/10', label: 'Gagal' },
      EXPIRED: { icon: Clock, color: 'text-gray-400 bg-gray-400/10', label: 'Expired' },
    }
    return configs[status] || configs.PENDING
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

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
              Lacak{' '}
              <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-accent-cyan to-primary-400">
                Transaksi
              </span>
            </h1>
            <p className="text-white/60">
              Masukkan nomor invoice untuk melihat status transaksi Anda
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container-page py-8">
        <div className="max-w-2xl mx-auto">
          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface-primary rounded-2xl border border-white/5 p-6 mb-8"
          >
            <form onSubmit={handleSearch}>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Nomor Invoice
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    placeholder="Contoh: TK1234567890"
                    className="w-full pl-12 pr-4 py-3 bg-dark-100 rounded-xl border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching || !invoiceNo.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium hover:from-primary-500 hover:to-primary-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Cari'
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Result */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-primary rounded-2xl border border-white/5 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Detail Transaksi</h3>
                {(() => {
                  const config = getStatusConfig(result.status)
                  const Icon = config.icon
                  return (
                    <span className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${config.color}`}>
                      <Icon size={16} />
                      {config.label}
                    </span>
                  )
                })()}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-white/5">
                  <span className="text-white/60">Invoice</span>
                  <span className="font-mono font-medium text-white">{result.invoiceNo}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/5">
                  <span className="text-white/60">Game</span>
                  <span className="text-white">{result.game}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/5">
                  <span className="text-white/60">Product</span>
                  <span className="text-white">{result.product}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-white/5">
                  <span className="text-white/60">Tanggal</span>
                  <span className="text-white">
                    {new Date(result.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-white/60">Total</span>
                  <span className="text-xl font-bold text-accent-cyan">
                    {formatCurrency(result.total)}
                  </span>
                </div>
              </div>

              {result.status === 'SUCCESS' && (
                <div className="mt-6 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                  <p className="text-green-400 text-sm">
                    ✅ Item sudah dikirim ke akun Anda. Silakan cek di dalam game.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Not Found */}
          {notFound && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-primary rounded-2xl border border-white/5 p-8 text-center"
            >
              <XCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Transaksi Tidak Ditemukan</h3>
              <p className="text-white/60 mb-4">
                Invoice yang Anda cari tidak ditemukan. Pastikan nomor invoice sudah benar.
              </p>
              <p className="text-white/40 text-sm">
                Tips: Nomor invoice biasanya dimulai dengan "TK" diikuti angka
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
