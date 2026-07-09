'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { NominalGrid } from '@/components/game/NominalGrid'
import { OrderSummary } from '@/components/game/OrderSummary'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/components/ui/Toast'
import { formatCurrency } from '@/lib/utils'
import { api } from '@/lib/api'
import {
  ArrowLeft,
  User,
  Server,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
  ChevronRight
} from 'lucide-react'

export default function TopupPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  // Data state from Supabase
  const [game, setGame] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Form state
  const [userId, setUserId] = useState('')
  const [serverId, setServerId] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isValidated, setIsValidated] = useState(false)
  const [validationResult, setValidationResult] = useState<{ nickname?: string; error?: string } | null>(null)
  const [showVoucherModal, setShowVoucherModal] = useState(false)
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherData, setVoucherData] = useState<any>(null)

  // Fetch game and products from Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch game by slug
        const gameData = await api.getGameBySlug(slug)
        setGame(gameData)

        // Fetch products for this game
        const productsData = await api.getProductsByGame(gameData.id)
        setProducts(productsData)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Gagal memuat data game')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [slug])

  // Handle ID validation
  const handleValidateId = async () => {
    if (!userId) {
      toast.error('Masukkan User ID terlebih dahulu')
      return
    }

    if (game?.requires_server_id && !serverId) {
      toast.error('Masukkan Server ID terlebih dahulu')
      return
    }

    setIsValidating(true)

    try {
      // For now, simulate validation (later can integrate with game API)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock validation - just show the userId as nickname
      setValidationResult({ nickname: `Player ${userId}` })
      setIsValidated(true)
      toast.success('Player ID valid!')
    } catch (error) {
      toast.error('Validasi gagal')
    } finally {
      setIsValidating(false)
    }
  }

  // Handle product selection
  const handleProductSelect = (product: any) => {
    setSelectedProduct(product)
  }

  // Handle voucher validation
  const handleApplyVoucher = async () => {
    if (!voucherCode) {
      toast.error('Masukkan kode voucher')
      return
    }

    try {
      const voucher = await api.validateVoucher(voucherCode, selectedProduct?.price)
      setVoucherData(voucher)
      toast.success('Voucher berhasil diterapkan!')
      setShowVoucherModal(false)
    } catch (error: any) {
      toast.error(error.message || 'Voucher tidak valid')
    }
  }

  // Handle continue to checkout
  const handleContinue = () => {
    if (!userId) {
      toast.error('Masukkan User ID terlebih dahulu')
      return
    }

    if (game?.requires_server_id && !serverId) {
      toast.error('Masukkan Server ID terlebih dahulu')
      return
    }

    if (!selectedProduct) {
      toast.error('Pilih nominal terlebih dahulu')
      return
    }

    // Build checkout URL with voucher if applied
    let checkoutUrl = `/checkout?game=${slug}&product=${selectedProduct.id}&userId=${userId}`
    if (serverId) {
      checkoutUrl += `&serverId=${serverId}`
    }
    if (voucherCode) {
      checkoutUrl += `&voucher=${voucherCode}`
    }

    router.push(checkoutUrl)
  }

  // Copy User ID
  const handleCopyId = () => {
    navigator.clipboard.writeText(userId)
    toast.success('User ID berhasil disalin!')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Memuat...</p>
        </div>
      </div>
    )
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
      <div className="relative h-48 md:h-64 overflow-hidden">
        {/* Banner Image from Database */}
        {game.banner ? (
          <>
            <img
              src={game.banner}
              alt={game.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Gradient overlay only at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-100 via-dark-100/30 to-transparent" />
          </>
        ) : (
          <>
            {/* Default Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-900 to-accent-purple/50" />
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }} />
            </div>
          </>
        )}

        <div className="container-page relative h-full flex items-end pb-6 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end gap-4"
          >
            {/* Back Button */}
            <Link
              href="/games"
              className="flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-2 backdrop-blur-sm px-2 py-1 rounded-lg"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Kembali</span>
            </Link>

            {/* Game Logo */}
            <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden border-4 border-white/30 shadow-2xl bg-dark-100">
              <Image
                src={game.logo || '/placeholder/game.svg'}
                alt={game.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Game Info */}
            <div className="mb-1 flex-1">
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">{game.name}</h1>
              {game.description && (
                <p className="text-sm text-white/80 mb-2 max-w-xl drop-shadow-md">{game.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
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
                {game.requires_server_id && (
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

              {products.length > 0 ? (
                <NominalGrid
                  products={products}
                  selectedId={selectedProduct?.id}
                  onSelect={handleProductSelect}
                />
              ) : (
                <p className="text-white/60">Produk tidak tersedia</p>
              )}
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
                  game_id: game.id,
                  name: '-',
                  price: 0,
                  stock: 'UNLIMITED',
                  is_active: true,
                }}
                userGameId={userId || 'Belum diisi'}
                serverId={serverId || undefined}
                voucher={voucherData}
                onApplyVoucher={() => setShowVoucherModal(true)}
                onRemoveVoucher={() => {
                  setVoucherCode('')
                  setVoucherData(null)
                }}
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

              {/* trust Badges */}
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
              onClick={handleApplyVoucher}
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
