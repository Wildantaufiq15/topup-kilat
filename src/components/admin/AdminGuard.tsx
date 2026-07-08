'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface AdminGuardProps {
  children: React.ReactNode
  allowedRoles?: Array<'ADMIN' | 'SUPER_ADMIN' | 'CS' | 'FINANCE' | 'USER'>
}

export function AdminGuard({ children, allowedRoles = ['ADMIN', 'SUPER_ADMIN'] }: AdminGuardProps) {
  const router = useRouter()
  const { user, profile, isLoading, isAuthenticated } = useAuth()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return

    // Check if authenticated
    if (!isAuthenticated) {
      router.push('/login?redirect=/admin')
      return
    }

    // Check role
    const userRole = profile?.role || 'USER'
    if (!allowedRoles.includes(userRole as any)) {
      // Redirect non-admin users
      router.push('/')
      return
    }

    setChecking(false)
  }, [isLoading, isAuthenticated, profile, router])

  if (checking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Memuat...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
