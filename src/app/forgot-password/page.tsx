'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { isValidEmail, isValidPhone } from '@/lib/utils'
import { Mail, Phone, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

function ForgotPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/login'

  const [step, setStep] = useState<'email' | 'success'>('email')
  const [method, setMethod] = useState<'email' | 'phone'>('email')
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ input?: string }>({})

  const validate = () => {
    const newErrors: typeof errors = {}

    if (!input) {
      newErrors.input = method === 'email'
        ? 'Email wajib diisi'
        : 'Nomor HP wajib diisi'
    } else if (method === 'email' && !isValidEmail(input)) {
      newErrors.input = 'Format email tidak valid'
    } else if (method === 'phone' && !isValidPhone(input)) {
      newErrors.input = 'Format nomor HP tidak valid (contoh: 081234567890)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsLoading(true)

    try {
      // In a real app, this would call an API to send reset link
      // For now, we'll simulate the process
      // Supabase Auth has resetPasswordForEmail() but requires email

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      // For demo purposes, show success message
      // In production, use Supabase auth.resetPasswordForEmail(email)

      toast.success(`Link reset password telah dikirim ke ${input}`)
      setStep('success')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengirim link reset password')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsLoading(true)

    try {
      // For phone-based reset, in production this would use SMS OTP
      // Supabase doesn't support phone reset by default, would need custom implementation

      await new Promise(resolve => setTimeout(resolve, 1500))

      toast.success(`Kode OTP telah dikirim ke ${input}`)
      setStep('success')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengirim kode OTP')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-surface-primary rounded-2xl border border-white/5 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">Cek {method === 'email' ? 'Email' : 'Pesan'} Kamu</h2>
          <p className="text-white/60 mb-6">
            {method === 'email'
              ? `Kami telah mengirim link untuk reset password ke ${input}`
              : `Kami telah mengirim kode OTP ke nomor ${input}`
            }
          </p>

          <div className="bg-dark-100 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-white/70">
                <p className="font-medium text-white mb-1">Tips:</p>
                <ul className="space-y-1">
                  <li>• Cek folder Spam jika tidak ada di Inbox</li>
                  <li>• Link reset berlaku selama 1 jam</li>
                  <li>• Jika butuh bantuan, hubungi CS kami</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="accent"
              className="w-full"
              onClick={() => router.push('/login')}
            >
              Kembali ke Halaman Login
            </Button>

            <button
              onClick={() => setStep('email')}
              className="w-full text-sm text-white/60 hover:text-white transition-colors"
            >
              Coba cara lain
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-block">
          <Image
            src="/logo-topup-kilat.png"
            alt="Topup Kilat"
            width={80}
            height={80}
            className="w-20 h-20 rounded-xl object-contain"
          />
        </Link>
      </div>

      {/* Card */}
      <div className="bg-surface-primary rounded-2xl border border-white/5 p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Lupa Password?</h1>
          <p className="text-white/60">
            Masukkan {method === 'email' ? 'email' : 'nomor HP'} yang terdaftar untuk reset password
          </p>
        </div>

        {/* Method Toggle */}
        <div className="flex gap-2 p-1 bg-dark-100 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setMethod('email'); setInput(''); setErrors({}) }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              method === 'email'
                ? 'bg-surface-primary text-white shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Mail size={16} />
            Email
          </button>
          <button
            type="button"
            onClick={() => { setMethod('phone'); setInput(''); setErrors({}) }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              method === 'phone'
                ? 'bg-surface-primary text-white shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Phone size={16} />
            WhatsApp
          </button>
        </div>

        {/* Form */}
        <form onSubmit={method === 'email' ? handleSubmit : handlePhoneSubmit} className="space-y-4">
          <div>
            <Input
              label={method === 'email' ? 'Email' : 'Nomor WhatsApp'}
              type={method === 'email' ? 'email' : 'tel'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={method === 'email' ? 'nama@email.com' : '081234567890'}
              error={errors.input}
              leftIcon={method === 'email' ? <Mail size={18} /> : <Phone size={18} />}
            />
            {method === 'phone' && !errors.input && (
              <p className="mt-1.5 text-xs text-white/40">
                Pastikan nomor WhatsApp aktif dan bisa menerima pesan
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="accent"
            isLoading={isLoading}
            className="w-full"
          >
            {method === 'email' ? 'Kirim Link Reset' : 'Kirim Kode OTP'}
          </Button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            href={`/login${redirect !== '/login' ? `?redirect=${redirect}` : ''}`}
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Kembali ke halaman login
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-purple/10 rounded-full blur-3xl" />
      </div>

      <Suspense fallback={
        <div className="w-full max-w-md">
          <div className="bg-surface-primary rounded-2xl border border-white/5 p-8 animate-pulse">
            <div className="h-8 bg-dark-100 rounded mb-6 mx-auto w-48" />
            <div className="space-y-4">
              <div className="h-12 bg-dark-100 rounded-xl" />
              <div className="h-12 bg-dark-100 rounded-xl" />
            </div>
          </div>
        </div>
      }>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  )
}
