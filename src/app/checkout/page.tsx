'use client'

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
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
  RefreshCw,
  PartyPopper,
  XCircle,
} from 'lucide-react'

const checkoutSteps = [
  { id: 'identify', label: 'Identitas' },
  { id: 'payment', label: 'Pembayaran' },
  { id: 'confirmation', label: 'Selesai' },
]

// Storage key for checkout state persistence
const CHECKOUT_STATE_KEY = 'topupkilat_checkout_state'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, profile, isAuthenticated, isLoading: authLoading, session } = useAuth()

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
  const [paymentId, setPaymentId] = useState('')

  // Payment state
  const [paymentInstructions, setPaymentInstructions] = useState<{
    type: 'QRIS' | 'VA' | 'EWALLET'
    instruction: string
    qrCode?: string
    paymentNo?: string
    checkoutUrl?: string
  } | null>(null)
  const [invoiceData, setInvoiceData] = useState<{
    expired: string
    total: number
  } | null>(null)

  // Payment status polling
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed' | 'expired'>('pending')
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Save state to sessionStorage
  const saveCheckoutState = useCallback(() => {
    if (typeof window === 'undefined') return
    const state = {
      step,
      selectedPayment,
      invoiceNo,
      orderId,
      paymentId,
      paymentInstructions,
      invoiceData,
      gameSlug,
      productId,
      userId,
      serverId,
      voucherCode,
    }
    sessionStorage.setItem(CHECKOUT_STATE_KEY, JSON.stringify(state))
  }, [step, selectedPayment, invoiceNo, orderId, paymentId, paymentInstructions, invoiceData, gameSlug, productId, userId, serverId, voucherCode])

  // Load state from sessionStorage
  const loadCheckoutState = useCallback(() => {
    if (typeof window === 'undefined') return null
    const saved = sessionStorage.getItem(CHECKOUT_STATE_KEY)
    if (!saved) return null
    try {
      return JSON.parse(saved)
    } catch {
      return null
    }
  }, [])

  // Clear checkout state
  const clearCheckoutState = useCallback(() => {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem(CHECKOUT_STATE_KEY)
    // Clear polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  // Fetch game and product data from Supabase
  useEffect(() => {
    async function fetchData() {
      // First check if we have saved state
      const savedState = loadCheckoutState()

      // Only restore state if it's the SAME product and order is still valid
      if (savedState && savedState.gameSlug === gameSlug && savedState.productId === productId) {
        // Verify the saved order still exists in database
        if (savedState.orderId) {
          try {
            const response = await fetch(`/api/payments/status?paymentId=${savedState.paymentId}`)
            // If payment still exists and is pending, restore the state
            // Otherwise, clear the old state
            if (savedState.step === 'confirmation' && savedState.invoiceNo) {
              // This is a valid in-progress checkout, restore it
              console.log('Restoring checkout state from sessionStorage')
              setStep(savedState.step)
              setSelectedPayment(savedState.selectedPayment)
              setInvoiceNo(savedState.invoiceNo)
              setOrderId(savedState.orderId)
              setPaymentId(savedState.paymentId)
              setPaymentInstructions(savedState.paymentInstructions)
              setInvoiceData(savedState.invoiceData)
            }
          } catch {
            // Payment status check failed, don't restore old state
            clearCheckoutState()
          }
        }
      }

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
  }, [gameSlug, productId, loadCheckoutState, clearCheckoutState])

  // Determine initial step when auth is ready
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // User is logged in - skip to payment step
      setStep('payment')
    }
  }, [authLoading, isAuthenticated])

  // Save state whenever it changes
  useEffect(() => {
    if (step !== 'identify') {
      saveCheckoutState()
    }
  }, [step, saveCheckoutState])

  // Poll payment status from Sakurupiah via API route
  const checkPaymentStatus = useCallback(async () => {
    if (!paymentId || isCheckingStatus) return

    setIsCheckingStatus(true)
    try {
      // Call our API route which checks Sakurupiah directly
      const response = await fetch(`/api/payments/status?paymentId=${paymentId}`)
      const result = await response.json()

      if (result.success) {
        const newStatus = result.status?.toLowerCase() || 'pending'
        console.log('Payment status from Sakurupiah:', newStatus, 'updated:', result.updated)
        setPaymentStatus(newStatus as any)

        // If paid, stop polling and show success
        if (newStatus === 'paid') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
          toast.success('Pembayaran berhasil!')
        }

        // If expired or failed
        if (newStatus === 'expired' || newStatus === 'failed') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
        }
      } else {
        console.error('Error checking payment status:', result.message)
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
    } finally {
      setIsCheckingStatus(false)
    }
  }, [paymentId, isCheckingStatus])

  // Start polling when on confirmation step with paymentId
  useEffect(() => {
    if (step === 'confirmation' && paymentId && !pollingIntervalRef.current) {
      // Check immediately
      checkPaymentStatus()
      // Then poll every 5 seconds
      pollingIntervalRef.current = setInterval(checkPaymentStatus, 5000)
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [step, paymentId, checkPaymentStatus])

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

  // Handle payment - USES API ROUTES
  const handleProcessPayment = async () => {
    if (!selectedPayment) {
      toast.error('Pilih metode pembayaran terlebih dahulu')
      return
    }

    setIsProcessing(true)

    try {
      // 1. Create order via server-side API route
      // SECURITY: All price calculations done server-side, client only sends identifiers
      const orderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Pass auth token if user is logged in
          ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          gameSlug: gameSlug!,
          productId: productId!,
          userGameId: userId!,
          serverId: serverId || undefined,
          voucherCode: voucherCode || undefined,
        }),
      })

      const orderResult = await orderResponse.json()

      if (!orderResult.success) {
        throw new Error(orderResult.message || 'Failed to create order')
      }

      const orderData = orderResult.data
      console.log('Order created via API:', orderData)

      // 2. Create payment via API route (server-side)
      // SECURITY: We only send orderId - server fetches actual price from database
      // DO NOT send amount from client - it will be ignored and calculated server-side
      const paymentResponse = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderData.orderId,
          invoiceNo: orderData.invoiceNo,
          method: selectedPayment,
          userName: profile?.name || user?.email || 'Customer',
          userEmail: profile?.email || user?.email || 'guest@topupkilat.com',
          userPhone: profile?.phone || '081234567890',
          userGameId: userId,
          serverId: serverId,
        }),
      })

      const paymentResult = await paymentResponse.json()

      if (!paymentResult.success) {
        throw new Error(paymentResult.message || 'Failed to create payment')
      }

      const invoice = paymentResult.data
      const paymentIdFromApi = paymentResult.paymentId // Get payment ID from response
      console.log('Payment created:', invoice, 'Payment ID:', paymentIdFromApi)

      // 3. Set payment instructions based on payment type
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

      // 4. Update state
      setInvoiceNo(orderData.invoiceNo)
      setOrderId(orderData.orderId)
      if (paymentIdFromApi) {
        setPaymentId(paymentIdFromApi)
      }
      setInvoiceData({
        expired: invoice.expired,
        total: invoice.total,
      })

      // 5. Reset payment status
      setPaymentStatus('pending')

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
                {/* Dynamic Status Display */}
                {paymentStatus === 'pending' && (
                  <>
                    {/* Pending Icon */}
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Clock className="w-10 h-10 text-blue-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2 text-center">
                      Invoice Dibuat!
                    </h2>
                    <p className="text-white/70 mb-6 text-center">
                      Selesaikan pembayaran sebelum {invoiceData?.expired || '24 jam'}.
                    </p>
                  </>
                )}

                {paymentStatus === 'paid' && (
                  <>
                    {/* Success Icon */}
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <PartyPopper className="w-10 h-10 text-green-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2 text-center">
                      Pembayaran Berhasil! 🎉
                    </h2>
                    <p className="text-white/70 mb-6 text-center">
                      Terima kasih! Pesanan kamu sedang diproses.
                    </p>
                  </>
                )}

                {paymentStatus === 'expired' && (
                  <>
                    {/* Expired Icon */}
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Clock className="w-10 h-10 text-yellow-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2 text-center">
                      Pembayaran Kadaluarsa
                    </h2>
                    <p className="text-white/70 mb-6 text-center">
                      Waktu pembayaran telah habis. Silakan buat pesanan baru.
                    </p>
                  </>
                )}

                {paymentStatus === 'failed' && (
                  <>
                    {/* Failed Icon */}
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                      <XCircle className="w-10 h-10 text-red-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2 text-center">
                      Pembayaran Gagal
                    </h2>
                    <p className="text-white/70 mb-6 text-center">
                      Terjadi kesalahan saat proses pembayaran. Silakan coba lagi.
                    </p>
                  </>
                )}

                {/* Status Checker (only show when pending) */}
                {paymentStatus === 'pending' && (
                  <>
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
                          {formatCurrency(invoiceData?.total || product?.price || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Status Info - With Refresh Button */}
                    <div className="flex items-center justify-center gap-6 mb-6 text-sm">
                      <div className="flex items-center gap-2 text-yellow-400">
                        <Clock size={16} />
                        <span>Menunggu Pembayaran</span>
                      </div>
                      <button
                        onClick={checkPaymentStatus}
                        disabled={isCheckingStatus}
                        className="flex items-center gap-1 text-primary-400 hover:text-primary-300 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw size={14} className={isCheckingStatus ? 'animate-spin' : ''} />
                        <span>Cek Status</span>
                      </button>
                    </div>

                    {/* Auto-refresh indicator */}
                    <div className="text-xs text-white/40 text-center mb-4">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                        Auto-refresh aktif
                      </span>
                    </div>
                  </>
                )}

                {/* Action Buttons - Different based on status */}
                {paymentStatus === 'pending' && (
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
                )}

                {paymentStatus === 'paid' && (
                  <div className="flex flex-col gap-3">
                    <Link href="/dashboard/riwayat">
                      <Button variant="primary" className="w-full">
                        Lihat Pesanan
                      </Button>
                    </Link>
                    <Link href="/games">
                      <Button variant="secondary" className="w-full">
                        Top Up Lagi
                      </Button>
                    </Link>
                  </div>
                )}

                {(paymentStatus === 'expired' || paymentStatus === 'failed') && (
                  <div className="flex flex-col gap-3">
                    <Button
                      variant="primary"
                      onClick={() => {
                        clearCheckoutState()
                        setStep('payment')
                      }}
                      className="w-full"
                    >
                      Coba Lagi
                    </Button>
                    <Link href="/games">
                      <Button variant="secondary" className="w-full">
                        Pilih Game Lain
                      </Button>
                    </Link>
                  </div>
                )}
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
