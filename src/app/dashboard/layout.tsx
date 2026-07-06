'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ShieldAlert } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard/riwayat')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <ShieldAlert className="w-16 h-16 text-white/30 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Akses Ditolak</h1>
        <p className="text-white/60 mb-6">Anda harus login untuk mengakses halaman ini</p>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium hover:from-primary-500 hover:to-primary-400 transition-all"
        >
          Login
        </button>
      </div>
    )
  }

  return (
    <div className="container-page">
      {children}
    </div>
  )
}
