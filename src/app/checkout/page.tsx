'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { type PaymentMethod } from '@/types'
import { PaymentMethodSelector } from '@/components/game/PaymentMethodSelector'
import { StepIndicator } from '@/components/game/StepIndicator'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { formatCurrency, copyToClipboard } from '@/lib/utils'
import { api } from '@/lib/api'
import {
  ArrowLeft,
  Shield,
  Clock,
  CheckCircle,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react'

const checkoutSteps = [
  { id: 'identify', label: 'Identitas' },
  { id: 'payment', label: 'Pembayaran' },
  { id: 'confirmation', label: 'Selesai' },
]

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const gameSlug = searchParams.get('game')
  const productId = searchParams.get('product')
  const userId = searchParams.get('userId')
  const serverId = searchParams.get('serverId')
  const voucherCode = searchParams.get('voucher')

  // Data state
  const [game, setGame] = useState<any>(null)
  const [product, setProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Checkout state
  const [step, setStep] = useState<'identify' | 'payment' | 'confirmation'>('identify')
  const [isLoggedIn] = useState(false) // TODO: Connect to auth
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [invoiceNo, setInvoiceNo] = useState('')
  const [copied, setCopied] = useState(false)
  const [orderId, setOrderId] = useState('')

  // Fetch game and product data from Supabase
  useEffect(() => {
    async function fetchData() {
      if (!gameSlug || !productId) {
        setIsLoading(false)
        return
      }

      try {
        // Fetch game
        const gameData = await api.getGameBySlug(gameSlug)
        setGame(gameData)

        // Fetch products
        const products = await api.getProductsByGame(gameData.id)
        const selectedProduct = products.find((p: any) => p.id === productId)
        setProduct(selectedProduct)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Gagal memuat data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [gameSlug, productId])

  // Redirect if no product selected
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Memuat checkout...</p>
        </div>
      </div>
    )
  }

  if (!game || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Transaksi tidak ditemukan</h1>
          <p className="text-white/60 mb-6">Silakan pilih game dan nominal terlebih dahulu.</p>
          <Link href="/games">
            <Button variant="primary">Pilih Game</Button>
          </Link>
        </div>
      </div>
    )
  }

  const total = product.price

  // Handle payment - NOW ACTUALLY CREATES ORDER IN SUPABASE!
  const handleProcessPayment = async () => {
    if (!selectedPayment) {
      toast.error('Pilih metode pembayaran terlebih dahulu')
      return
    }

    if (!userId) {
      toast.error('User ID diperlukan')
      return
    }

    setIsProcessing(true)

    try {
      // 1. Create order in Supabase
      const order = await api.createOrder({
        gameSlug: gameSlug!,
        productId: productId!,
        userGameId: userId!,
        serverId: serverId || undefined,
        voucherCode: voucherCode || undefined,
      })

      console.log('Order created:', order)

      // 2. Create payment
      const payment = await api.checkout(order.id, selectedPayment)

      console.log('Payment created:', payment)

      // 3. Update state
      setInvoiceNo(order.invoice_no)
      setOrderId(order.id)

      // 4. Show success
      setIsProcessing(false)
      setStep('confirmation')
      toast.success('Pembayaran berhasil!')
    } catch (error: any) {
      console.error('Checkout error:', error)
      setIsProcessing(false)
      toast.error(error.message || 'Terjadi kesalahan saat checkout')
    }
  }

  // Copy invoice
  const handleCopyInvoice = async () => {
    await copyToClipboard(invoiceNo)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-dark-100/50">
      {/* Header */}
      <div className="bg-surface-primary border-b border-white/5">
        <div className="container-page py-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/topup/${gameSlug}`}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Kembali</span>
            </Link>

            <h1 className="text-lg font-bold text-white">Checkout</h1>

            <div className="w-20" />
          </div>

          {/* Steps */}
          <div className="mt-6">
            <StepIndicator
              steps={checkoutSteps}
              currentStep={step}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-page py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left - Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Identify / Login */}
            {step === 'identify' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-surface-primary rounded-2xl border border-white/5 p-6"
              >
                <h2 className="text-lg font-bold text-white mb-4">Verifikasi Identitas</h2>

                {isLoggedIn ? (
                  <div className="flex items-center gap-4 p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                    <div>
                      <p className="font-medium text-green-400">Anda sudah login</p>
                      <p className="text-sm text-white/70">john@example.com</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-white/70">
                      Anda perlu login untuk melanjutkan pembayaran. Daftar gratis jika belum punya akun.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Button
                        variant="primary"
                        onClick={() => router.push('/login?redirect=/checkout')}
                        className="w-full"
                      >
                        Masuk
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => router.push('/register?redirect=/checkout')}
                        className="w-full"
                      >
                        Daftar
                      </Button>
                    </div>

                    <p className="text-xs text-white/50 text-center">
                      Atau lanjutkan sebagai guest. Anda tetap bisa checkout tanpa akun.
                    </p>

                    <Button
                      variant="ghost"
                      onClick={() => setStep('payment')}
                      className="w-full"
                    >
                      Lanjutkan sebagai Guest
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Payment Method */}
            {step === 'payment' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-surface-primary rounded-2xl border border-white/5 p-6"
              >
                <h2 className="text-lg font-bold text-white mb-4">Pilih Metode Pembayaran</h2>

                <PaymentMethodSelector
                  selected={selectedPayment}
                  onSelect={setSelectedPayment}
                />

                <div className="mt-6">
                  <Button
                    variant="accent"
                    size="lg"
                    onClick={handleProcessPayment}
                    isLoading={isProcessing}
                    disabled={!selectedPayment}
                    className="w-full"
                  >
                    Bayar Sekarang
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Confirmation */}
            {step === 'confirmation' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-surface-primary rounded-2xl border border-white/5 p-6 text-center"
              >
                {/* Success Icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">
                  Pembayaran Berhasil!
                </h2>
                <p className="text-white/70 mb-6">
                  Top up akan diproses dalam 1-5 menit setelah pembayaran terkonfirmasi.
                </p>

                {/* Invoice */}
                <div className="bg-dark-100 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/60">Invoice</span>
                    <button
                      onClick={handleCopyInvoice}
                      className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300"
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'Disalin!' : 'Salin'}
                    </button>
                  </div>
                  <p className="font-mono font-bold text-white text-lg">{invoiceNo}</p>
                </div>

                {/* Status Info */}
                <div className="flex items-center justify-center gap-6 mb-6 text-sm">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Clock size={16} />
                    <span>Sedang Diproses</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Link href="/dashboard/riwayat" className="flex-1">
                    <Button variant="primary" className="w-full">
                      Lihat Riwayat
                    </Button>
                  </Link>
                  <Link href="/games" className="flex-1">
                    <Button variant="secondary" className="w-full">
                      Top Up Lagi
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-surface-primary rounded-2xl border border-white/5 overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-white/5 bg-dark-100/50">
                <h3 className="font-bold text-white">Ringkasan Pesanan</h3>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Game & Product */}
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                    <Image
                      src={game.logo}
                      alt={game.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{game.name}</h4>
                    <p className="text-sm text-white/60">{product.name}</p>
                  </div>
                </div>

                {/* User ID */}
                <div className="bg-dark-100 rounded-xl p-3">
                  <div className="text-xs text-white/50 mb-1">ID Player</div>
                  <p className="font-semibold text-white">
                    {userId}
                    {serverId && <span className="text-white/50"> ({serverId})</span>}
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-white/5" />

                {/* Price */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-white/70">
                    <span>Subtotal</span>
                    <span>{formatCurrency(product.price)}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Biaya Layanan</span>
                    <span>Rp 0</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/5" />

                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">Total</span>
                  <span className="text-2xl font-bold text-gradient bg-clip-text text-transparent bg-gradient-to-r from-accent-cyan to-primary-400">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="p-4 bg-dark-100/50 border-t border-white/5">
                <div className="flex items-center justify-center gap-4 text-xs text-white/50">
                  <span className="flex items-center gap-1">
                    <Shield size={14} className="text-green-400" />
                    Aman
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} className="text-blue-400" />
                    Cepat
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckoutFallback() {
  return (
    <div className="min-h-screen bg-dark-100/50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/60">Memuat checkout...</p>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutContent />
    </Suspense>
  )
}
