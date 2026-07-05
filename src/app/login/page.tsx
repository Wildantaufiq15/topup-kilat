'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { isValidEmail, isValidPhone } from '@/lib/utils'
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard/riwayat'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const newErrors: typeof errors = {}

    if (!email) {
      newErrors.email = 'Email atau nomor HP wajib diisi'
    } else if (!isValidEmail(email) && !isValidPhone(email)) {
      newErrors.email = 'Format email atau nomor HP tidak valid'
    }

    if (!password) {
      newErrors.password = 'Password wajib diisi'
    } else if (password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsLoading(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Mock success (in real app, this would call the auth API)
    toast.success('Login berhasil!')
    router.push(redirect)

    setIsLoading(false)
  }

  const handleGoogleLogin = () => {
    // In real app, this would trigger Google OAuth
    toast.info('Fitur login Google akan segera hadir!')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-accent-purple flex items-center justify-center shadow-lg">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <span className="font-bold text-2xl text-white">
            Topup<span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-accent-cyan to-primary-400">Kilat</span>
          </span>
        </Link>
      </div>

      {/* Card */}
      <div className="bg-surface-primary rounded-2xl border border-white/5 p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Selamat Datang!</h1>
          <p className="text-white/60">Masuk ke akun Topup Kilat Anda</p>
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 p-3 bg-white rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Masuk dengan Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-surface-primary text-white/50">atau</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email atau Nomor HP"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com / 081234567890"
            error={errors.email}
            leftIcon={<Mail size={18} />}
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan password"
            error={errors.password}
            leftIcon={<Lock size={18} />}
            rightIcon={
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              Lupa password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="accent"
            isLoading={isLoading}
            className="w-full"
          >
            Masuk
          </Button>
        </form>
      </div>

      {/* Register Link */}
      <p className="text-center mt-6 text-white/60">
        Belum punya akun?{' '}
        <Link
          href={`/register${redirect ? `?redirect=${redirect}` : ''}`}
          className="text-primary-400 hover:text-primary-300 font-medium"
        >
          Daftar sekarang
        </Link>
      </p>
    </motion.div>
  )
}

export default function LoginPage() {
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
              <div className="h-12 bg-dark-100 rounded-xl" />
            </div>
          </div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
