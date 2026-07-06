'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { type PaymentMethod } from '@/types'
import { PaymentMethodSelector } from '@/components/game/PaymentMethodSelector'
import { StepIndicator } from '@/components/game/StepIndicator'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { formatCurrency, copyToClipboard } from '@/lib/utils'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { createInvoice, type SakurupiahInvoice } from '@/lib/sakurupiah'
import { useAuth } from '@/context/AuthContext'
import {
  ArrowLeft,
  Shield,
  Clock,
  CheckCircle,
  Copy,
  Check,
  AlertCircle,
  QrCode,
  CreditCard,
  User,
  LogOut,
} from 'lucide-react'

const checkoutSteps = [
  { id: 'identify', label: 'Identitas' },
  { id: 'payment', label: 'Pembayaran' },
  { id: 'confirmation', label: 'Selesai' },
]

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, profile, isAuthenticated, isLoading: authLoading } = useAuth()

  const gameSlug = searchParams.get('game')
  const productId = searchParams.get('product')
  const userId = searchParams.get('userId')
  const serverId = searchParams.get('serverId')
  const voucherCode = searchParams.get('voucher')

  // Data state
  const [game, setGame] = useState<any>(null)
  const [product, setProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Checkout state - determine initial step based on auth status
  const [step, setStep] = useState<'identify' | 'payment' | 'confirmation'>('identify')
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [invoiceNo, setInvoiceNo] = useState('')
  const [copied, setCopied] = useState(false)
  const [orderId, setOrderId] = useState('')

  // Sakurupiah state
  const [sakurupiahInvoice, setSakurupiahInvoice] = useState<SakurupiahInvoice | null>(null)
  const [paymentInstructions, setPaymentInstructions] = useState<{
    type: 'QRIS' | 'VA' | 'EWALLET'
    instruction: string
    qrCode?: string
    paymentNo?: string
    checkoutUrl?: string
  } | null>(null)

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

  // Determine initial step when auth is ready
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // User is logged in - skip to payment step
      setStep('payment')
    }
  }, [authLoading, isAuthenticated])

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

  // Handle payment - NOW USES SAKURUPIAH!
  const handleProcessPayment = async () => {
    if (!selectedPayment) {
      toast.error('Pilih metode pembayaran terlebih dahulu')
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

      // 2. Create Sakurupiah invoice
      const invoice = await createInvoice({
        method: selectedPayment,
        name: profile?.name || user?.email || 'Customer',
        email: profile?.email || user?.email || 'guest@topupkilat.com',
        phone: profile?.phone || '081234567890',
        amount: product.price,
        merchant_ref: order.invoice_no,
        expired: 24,
        produk: [product.name],
        qty: [1],
        harga: [product.price],
      })

      console.log('Sakurupiah invoice:', invoice)

      // 3. Save payment to Supabase
      const paymentData = {
        order_id: order.id,
        method: selectedPayment,
        amount: invoice.total,
        status: 'PENDING',
        provider_ref: invoice.trx_id,
        merchant_ref: invoice.merchant_ref,
        qr_url: invoice.qr || null,
        checkout_url: invoice.checkout_url || null,
        payment_no: invoice.payment_no ? String(invoice.payment_no) : null,
        expired_at: invoice.expired,
      }

      await supabase.from('payments').insert(paymentData)

      // 4. Set payment instructions based on payment type
      // Convert our PaymentMethod to Sakurupiah format
      const paymentTypeUpper = selectedPayment.toUpperCase()
      const paymentType = paymentTypeUpper === 'QRIS' ? 'QRIS' :
                         paymentTypeUpper.endsWith('VA') ? 'VA' : 'EWALLET'

      setPaymentInstructions({
        type: paymentType,
        qrCode: invoice.qr,
        paymentNo: invoice.payment_no ? String(invoice.payment_no) : undefined,
        checkoutUrl: invoice.checkout_url || undefined,
        instruction: getPaymentInstruction(selectedPayment),
      })

      // 5. Update state
      setInvoiceNo(order.invoice_no)
      setOrderId(order.id)
      setSakurupiahInvoice(invoice)

      // 6. Move to confirmation
      setIsProcessing(false)
      setStep('confirmation')
      toast.success('Invoice dibuat! Selesaikan pembayaran.')
    } catch (error: any) {
      console.error('Checkout error:', error)
      setIsProcessing(false)
      toast.error(error.message || 'Terjadi kesalahan saat checkout')
    }
  }

  // Get payment instructions based on method
  const getPaymentInstruction = (method: string): string => {
    const instructions: Record<string, string> = {
      QRIS: 'Scan kode QR menggunakan aplikasi bank atau e-wallet yang mendukung QRIS.',
      BCAVA: 'Bayar melalui ATM BCA, mobile banking BCA, atau internet banking BCA.',
      BRIVA: 'Bayar melalui ATM BRI, mobile banking BRI, atau internet banking BRI.',
      BNIVA: 'Bayar melalui ATM BNI, mobile banking BNI, atau internet banking BNI.',
      MANDIRIVA: 'Bayar melalui ATM Mandiri, mobile banking Mandiri, atau internet banking Mandiri.',
      GOPAY: 'Akan diarahkan ke aplikasi GoPay untuk menyelesaikan pembayaran.',
      DANA: 'Akan diarahkan ke aplikasi DANA untuk menyelesaikan pembayaran.',
      SHOPEEPAY: 'Akan diarahkan ke aplikasi ShopeePay untuk menyelesaikan pembayaran.',
      OVO: 'Akan diarahkan ke aplikasi OVO untuk menyelesaikan pembayaran.',
    }
    return instructions[method] || 'Ikuti instruksi pembayaran yang muncul.'
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

                {!authLoading && !isAuthenticated && (
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

                {/* Loading state */}
                {authLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
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
                {/* User Info Header */}
                {isAuthenticated && profile && (
                  <div className="flex items-center justify-between mb-4 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-accent-purple flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {profile.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{profile.name || 'User'}</p>
                        <p className="text-xs text-white/60">{profile.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle size={16} />
                      <span className="text-sm">Logged in</span>
                    </div>
                  </div>
                )}

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
                className="bg-surface-primary rounded-2xl border border-white/5 p-6"
              >
                {/* Success Icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Clock className="w-10 h-10 text-blue-400" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2 text-center">
                  Invoice Dibuat!
                </h2>
                <p className="text-white/70 mb-6 text-center">
                  Selesaikan pembayaran sebelum {sakurupiahInvoice?.expired || '24 jam'}.
                </p>

                {/* Payment Instructions - QRIS */}
                <AnimatePresence>
                  {paymentInstructions?.type === 'QRIS' && paymentInstructions.qrCode && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl p-6 mb-6"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <QrCode className="w-5 h-5 text-gray-800" />
                        <span className="font-semibold text-gray-800">Scan QR Code</span>
                      </div>
                      <div className="flex justify-center mb-4">
                        <img
                          src={paymentInstructions.qrCode}
                          alt="QRIS Payment"
                          className="w-64 h-64"
                        />
                      </div>
                      <p className="text-sm text-gray-600 text-center">
                        {paymentInstructions.instruction}
                      </p>
                    </motion.div>
                  )}

                  {/* Payment Instructions - Virtual Account */}
                  {paymentInstructions?.type === 'VA' && paymentInstructions.paymentNo && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-dark-100 rounded-2xl p-6 mb-6"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="w-5 h-5 text-primary-400" />
                        <span className="font-semibold text-white">Nomor Virtual Account</span>
                      </div>
                      <div className="bg-white rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-500 mb-2">Nomor VA</p>
                        <p className="text-2xl font-mono font-bold text-gray-800 tracking-wider">
                          {paymentInstructions.paymentNo}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(paymentInstructions.paymentNo || '')}
                        className="w-full mt-3 py-2 text-sm text-primary-400 hover:text-primary-300"
                      >
                        Salin Nomor VA
                      </button>
                      <p className="text-sm text-white/60 mt-4">
                        {paymentInstructions.instruction}
                      </p>
                    </motion.div>
                  )}

                  {/* Payment Instructions - E-Wallet */}
                  {paymentInstructions?.type === 'EWALLET' && paymentInstructions.checkoutUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-dark-100 rounded-2xl p-6 mb-6"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="w-5 h-5 text-primary-400" />
                        <span className="font-semibold text-white">Metode E-Wallet</span>
                      </div>
                      <a
                        href={paymentInstructions.checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-center rounded-xl font-medium hover:from-primary-500 hover:to-primary-400 transition-all"
                      >
                        Bayar Sekarang
                      </a>
                      <p className="text-sm text-white/60 mt-4">
                        {paymentInstructions.instruction}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

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
                  <div className="mt-2 pt-2 border-t border-white/10 flex justify-between text-sm">
                    <span className="text-white/50">Total Bayar</span>
                    <span className="font-bold text-accent-cyan">
                      {formatCurrency(sakurupiahInvoice?.total || product?.price || 0)}
                    </span>
                  </div>
                </div>

                {/* Status Info */}
                <div className="flex items-center justify-center gap-6 mb-6 text-sm">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Clock size={16} />
                    <span>Menunggu Pembayaran</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Link href="/dashboard/riwayat" className="flex-1">
                    <Button variant="secondary" className="w-full">
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
