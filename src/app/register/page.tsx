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
import { useAuth } from '@/context/AuthContext'
import { Mail, Lock, User, Phone, Check } from 'lucide-react'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard/riwayat'

  const { register, isAuthenticated } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push(redirect)
    return null
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!name || name.length < 2) {
      newErrors.name = 'Nama minimal 2 karakter'
    }

    if (!email) {
      newErrors.email = 'Email wajib diisi'
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Format email tidak valid'
    }

    if (phone && !isValidPhone(phone)) {
      newErrors.phone = 'Format nomor HP tidak valid (08xx)'
    }

    if (!password) {
      newErrors.password = 'Password wajib diisi'
    } else if (password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter'
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Password tidak cocok'
    }

    if (!agreed) {
      newErrors.agreed = 'Anda harus menyetujui syarat dan ketentuan'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsLoading(true)

    try {
      await register({ email, name, password, phone: phone || undefined })
      toast.success('Registrasi berhasil! Silakan login.')
      router.push('/login')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registrasi gagal')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/dashboard/riwayat" className="inline-block">
          <Image
            src="/logo-topup-kilat.png"
            alt="Topup Kilat"
            width={64}
            height={64}
            className="w-16 h-16 rounded-xl object-contain"
          />
        </Link>
      </div>

      {/* Card */}
      <div className="bg-surface-primary rounded-2xl border border-white/5 p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Buat Akun Baru</h1>
          <p className="text-white/60">Bergabung dengan Topup Kilat hari ini</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Lengkap"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan nama lengkap"
            error={errors.name}
            leftIcon={<User size={18} />}
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            error={errors.email}
            leftIcon={<Mail size={18} />}
          />

          <Input
            label="Nomor HP (opsional)"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="081234567890"
            error={errors.phone}
            hint="Opsional. Digunakan untuk notifikasi dan login."
            leftIcon={<Phone size={18} />}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            error={errors.password}
            leftIcon={<Lock size={18} />}
          />

          <Input
            label="Konfirmasi Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Ulangi password"
            error={errors.confirmPassword}
            leftIcon={<Lock size={18} />}
          />

          {/* Terms Checkbox */}
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded border-2 transition-all ${
                    agreed
                      ? 'bg-primary-500 border-primary-500'
                      : 'border-white/30 hover:border-white/50'
                  }`}
                >
                  {agreed && (
                    <Check className="w-full h-full text-white p-0.5" />
                  )}
                </div>
              </div>
              <span className="text-sm text-white/70">
                Saya setuju dengan{' '}
                <Link href="/syarat" className="text-primary-400 hover:underline">
                  Syarat & Ketentuan
                </Link>{' '}
                dan{' '}
                <Link href="/privasi" className="text-primary-400 hover:underline">
                  Kebijakan Privasi
                </Link>
              </span>
            </label>
            {errors.agreed && (
              <p className="text-sm text-red-400">{errors.agreed}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="accent"
            isLoading={isLoading}
            className="w-full"
          >
            Daftar
          </Button>
        </form>
      </div>

      {/* Login Link */}
      <p className="text-center mt-6 text-white/60">
        Sudah punya akun?{' '}
        <Link
          href={`/login${redirect ? `?redirect=${redirect}` : ''}`}
          className="text-primary-400 hover:text-primary-300 font-medium"
        >
          Masuk
        </Link>
      </p>
    </motion.div>
  )
}

export default function RegisterPage() {
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
              <div className="h-12 bg-dark-100 rounded-xl" />
            </div>
          </div>
        </div>
      }>
        <RegisterForm />
      </Suspense>
    </div>
  )
}
