'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { type Game, type GameProduct } from '@/types'
import { mockGames, mockProducts } from '../../data/mockData'
import { NominalGrid } from '@/components/game/NominalGrid'
import { OrderSummary } from '@/components/game/OrderSummary'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/components/ui/Toast'
import { formatCurrency } from '@/lib/utils'
import {
  ArrowLeft,
  User,
  Server,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  ChevronRight
} from 'lucide-react'

export default function TopupPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  // Find game data
  const game = mockGames.find(g => g.slug === slug)
  const products = mockProducts[slug] || []

  // Form state
  const [userId, setUserId] = useState('')
  const [serverId, setServerId] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<GameProduct | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isValidated, setIsValidated] = useState(false)
  const [validationResult, setValidationResult] = useState<{ nickname?: string; error?: string } | null>(null)
  const [showVoucherModal, setShowVoucherModal] = useState(false)
  const [voucherCode, setVoucherCode] = useState('')

  // Handle ID validation
  const handleValidateId = async () => {
    if (!userId) {
      toast.error('Masukkan User ID terlebih dahulu')
      return
    }

    if (game?.requiresServerId && !serverId) {
      toast.error('Masukkan Server ID terlebih dahulu')
      return
    }

    setIsValidating(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock validation result
    const mockNicknames: Record<string, string> = {
      '12345678': 'RizkyPro',
      '87654321': 'SitiGaming',
      '11223344': 'TopupKilat',
    }

    const nickname = mockNicknames[userId]
    if (nickname) {
      setValidationResult({ nickname })
      setIsValidated(true)
      toast.success(`Player "${nickname}" ditemukan!`)
    } else {
      setValidationResult({ nickname: userId })
      setIsValidated(true)
      toast.info('Player ID ditemukan (preview nickname tidak tersedia)')
    }

    setIsValidating(false)
  }

  // Handle product selection
  const handleProductSelect = (product: GameProduct) => {
    setSelectedProduct(product)
  }

  // Handle continue to checkout
  const handleContinue = () => {
    if (!userId) {
      toast.error('Masukkan User ID terlebih dahulu')
      return
    }

    if (game?.requiresServerId && !serverId) {
      toast.error('Masukkan Server ID terlebih dahulu')
      return
    }

    if (!selectedProduct) {
      toast.error('Pilih nominal terlebih dahulu')
      return
    }

    // Navigate to checkout
    router.push(`/checkout?game=${slug}&product=${selectedProduct.id}&userId=${userId}${serverId ? `&serverId=${serverId}` : ''}`)
  }

  // Copy User ID
  const handleCopyId = () => {
    navigator.clipboard.writeText(userId)
    toast.success('User ID berhasil disalin!')
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Game tidak ditemukan</h1>
          <p className="text-white/60 mb-6">Maaf, game yang Anda cari tidak tersedia.</p>
          <Link href="/games">
            <Button variant="primary">Kembali ke Daftar Game</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary-900 to-accent-purple/50">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="container-page relative h-full flex items-end pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end gap-4"
          >
            {/* Back Button */}
            <Link
              href="/games"
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Kembali</span>
            </Link>

            {/* Game Logo */}
            <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl">
              <Image
                src={game.logo}
                alt={game.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Game Info */}
            <div className="mb-1">
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">{game.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                <Badge variant="glow" size="sm">Aktif 24 Jam</Badge>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  Proses 1-5 Menit
                </span>
                <span className="flex items-center gap-1">
                  <Shield size={14} />
                  Aman & Terpercaya
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-page py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* User ID Input Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface-primary rounded-2xl border border-white/5 p-6"
            >
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <User size={20} className="text-primary-400" />
                Masukkan ID Player
              </h2>

              <div className="space-y-4">
                {/* User ID */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-white/80">
                      User ID <span className="text-red-400">*</span>
                    </label>
                    {userId && (
                      <button
                        onClick={handleCopyId}
                        className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300"
                      >
                        <Copy size={12} />
                        Salin
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      value={userId}
                      onChange={(e) => {
                        setUserId(e.target.value)
                        setIsValidated(false)
                        setValidationResult(null)
                      }}
                      placeholder={`Masukkan User ID ${game.name}`}
                      className="pr-20"
                    />
                    {userId && !isValidated && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleValidateId}
                        isLoading={isValidating}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                      >
                        Validasi
                      </Button>
                    )}
                  </div>
                </div>

                {/* Server ID (if required) */}
                {game.requiresServerId && (
                  <div>
                    <label className="text-sm font-medium text-white/80 mb-2 block">
                      Server ID <span className="text-red-400">*</span>
                    </label>
                    <Input
                      value={serverId}
                      onChange={(e) => setServerId(e.target.value)}
                      placeholder="Masukkan Server ID"
                    />
                    <p className="mt-2 text-xs text-white/50">
                      {game.name} membutuhkan Server ID untuk top up. Cek di profil game Anda.
                    </p>
                  </div>
                )}

                {/* Validation Result */}
                <AnimatePresence>
                  {isValidated && validationResult && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`p-4 rounded-xl ${
                        validationResult.nickname
                          ? 'bg-green-500/10 border border-green-500/30'
                          : 'bg-yellow-500/10 border border-yellow-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {validationResult.nickname ? (
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                        )}
                        <div>
                          {validationResult.nickname ? (
                            <>
                              <p className="font-medium text-green-400">Player ditemukan!</p>
                              <p className="text-sm text-white/70">Nickname: {validationResult.nickname}</p>
                            </>
                          ) : (
                            <p className="text-sm text-yellow-400">
                              Player ID ditemukan. Preview nickname tidak tersedia dari server.
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Nominal Selection Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface-primary rounded-2xl border border-white/5 p-6"
            >
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pilih Nominal
              </h2>

              <NominalGrid
                products={products}
                selectedId={selectedProduct?.id}
                onSelect={handleProductSelect}
              />
            </motion.div>

            {/* How to Check ID */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-surface-secondary/50 rounded-2xl border border-white/5 p-6"
            >
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary-400" />
                Cara Cek {game.name} ID
              </h3>
              <ol className="space-y-2 text-sm text-white/70">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  Buka game {game.name} di perangkat Anda
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  Klik ikon profil di pojok kiri atas
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  User ID dan Server ID akan terlihat di profil Anda
                </li>
              </ol>
            </motion.div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <OrderSummary
                game={game}
                product={selectedProduct || products[0] || {
                  id: '',
                  gameId: game.id,
                  label: '-',
                  price: 0,
                  stock: 'available',
                  supplierCode: '',
                  isActive: true,
                  sortOrder: 0,
                }}
                userGameId={userId || 'Belum diisi'}
                serverId={serverId || undefined}
                onApplyVoucher={() => setShowVoucherModal(true)}
                onRemoveVoucher={() => setVoucherCode('')}
              />

              {/* Continue Button */}
              <Button
                variant="accent"
                size="lg"
                onClick={handleContinue}
                disabled={!userId || !selectedProduct}
                className="w-full"
                rightIcon={<ChevronRight size={20} />}
              >
                Lanjutkan Pembayaran
              </Button>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-4 text-xs text-white/50">
                <span className="flex items-center gap-1">
                  <Shield size={14} className="text-green-400" />
                  Aman
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} className="text-blue-400" />
                  Cepat
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle size={14} className="text-primary-400" />
                  Garansi
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voucher Modal */}
      <Modal
        isOpen={showVoucherModal}
        onClose={() => setShowVoucherModal(false)}
        title="Gunakan Voucher"
        description="Masukkan kode voucher untuk mendapatkan diskon"
      >
        <div className="space-y-4">
          <Input
            label="Kode Voucher"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
            placeholder="Contoh: HEMAT10"
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowVoucherModal(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (voucherCode) {
                  toast.success('Voucher berhasil diterapkan!')
                  setShowVoucherModal(false)
                } else {
                  toast.error('Masukkan kode voucher')
                }
              }}
              className="flex-1"
            >
              Gunakan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// Helper icon component
function HelpCircle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}
