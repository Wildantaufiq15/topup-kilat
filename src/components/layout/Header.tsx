'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { Menu, X, ShoppingCart, User, Zap, LogOut, ChevronDown } from 'lucide-react'

const navLinks = [
  { href: '/', label: 'Beranda' },
  { href: '/games', label: 'Semua Game' },
  { href: '/promo', label: 'Promo' },
  { href: '/bantuan', label: 'Bantuan' },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { isAuthenticated, profile, logout, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await logout()
    setIsDropdownOpen(false)
    router.push('/')
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-dark-50/95 backdrop-blur-xl border-b border-white/5 shadow-lg'
          : 'bg-transparent'
      )}
    >
      <div className="container-page">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-accent-purple flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-shadow">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-xl text-white group-hover:text-primary-400 transition-colors">
                Topup<span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-accent-cyan to-primary-400">Kilat</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300',
                  'text-white/70 hover:text-white hover:bg-white/5'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Cart/Checkout - optional */}
            {isAuthenticated && (
              <Link
                href="/dashboard/riwayat"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-primary text-white/70 hover:text-white transition-colors"
              >
                <ShoppingCart size={18} />
                <span className="text-sm">Riwayat</span>
              </Link>
            )}

            {/* Auth Section */}
            {!isLoading && (
              isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-primary border border-white/10 text-white hover:bg-surface-secondary transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-accent-purple flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {profile?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="hidden sm:inline text-sm font-medium max-w-[100px] truncate">
                      {profile?.name || profile?.email?.split('@')[0] || 'User'}
                    </span>
                    <ChevronDown size={16} className={cn('transition-transform', isDropdownOpen && 'rotate-180')} />
                  </button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-56 bg-surface-primary rounded-xl border border-white/10 shadow-xl overflow-hidden z-50"
                      >
                        <div className="p-3 border-b border-white/10">
                          <p className="text-sm font-medium text-white truncate">{profile?.name || 'User'}</p>
                          <p className="text-xs text-white/50 truncate">{profile?.email}</p>
                        </div>
                        <div className="p-2">
                          <Link
                            href="/dashboard/profil"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <User size={18} />
                            <span className="text-sm">Profil Saya</span>
                          </Link>
                          <Link
                            href="/dashboard/riwayat"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <ShoppingCart size={18} />
                            <span className="text-sm">Riwayat Transaksi</span>
                          </Link>
                        </div>
                        <div className="p-2 border-t border-white/10">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full"
                          >
                            <LogOut size={18} />
                            <span className="text-sm">Keluar</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-colors"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-500 hover:to-primary-400 shadow-lg shadow-primary-500/25 transition-all"
                  >
                    Daftar
                  </Link>
                </div>
              )
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-dark-50/98 backdrop-blur-xl border-t border-white/5"
          >
            <nav className="container-page py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-white/5 space-y-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/dashboard/profil"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5"
                    >
                      <User size={20} />
                      <span>Profil Saya</span>
                    </Link>
                    <Link
                      href="/dashboard/riwayat"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5"
                    >
                      <ShoppingCart size={20} />
                      <span>Riwayat Transaksi</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full"
                    >
                      <LogOut size={20} />
                      <span>Keluar</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-xl text-center text-white/70 hover:text-white hover:bg-white/5"
                    >
                      Masuk
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-xl text-center font-medium bg-gradient-to-r from-primary-600 to-primary-500 text-white"
                    >
                      Daftar
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
