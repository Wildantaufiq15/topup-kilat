'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface AdminGuardProps {
  children: React.ReactNode
  allowedRoles?: Array<'ADMIN' | 'SUPER_ADMIN' | 'CS' | 'FINANCE' | 'USER'>
}

export function AdminGuard({ children, allowedRoles = ['ADMIN', 'SUPER_ADMIN'] }: AdminGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { profile, isLoading, isProfileLoading, isAuthenticated } = useAuth()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Wait for both auth AND profile to be loaded
    if (isLoading || isProfileLoading) {
      setChecked(false)
      return
    }

    // Both loaded, now check conditions
    if (!isAuthenticated) {
      // Not logged in - redirect to login
      router.push(`/login?redirect=${pathname}`)
      return
    }

    // Check role
    const userRole = profile?.role || 'USER'
    if (!allowedRoles.includes(userRole as any)) {
      // Not an admin - redirect to home
      router.push('/')
      return
    }

    // User is authenticated and has the right role
    setChecked(true)
  }, [isLoading, isProfileLoading, isAuthenticated, profile, router, pathname])

  // Show loading while checking auth and profile
  if (isLoading || isProfileLoading || !checked) {
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
