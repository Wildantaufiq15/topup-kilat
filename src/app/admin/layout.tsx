'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Ticket,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Image as ImageIcon,
} from 'lucide-react'
import { AdminGuard } from '@/components/admin/AdminGuard'

const adminNavItems = [
  {
    title: 'Overview',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Transaksi',
    href: '/admin/transactions',
    icon: ShoppingCart,
  },
  {
    title: 'Produk',
    href: '/admin/products',
    icon: Package,
  },
  {
    title: 'Banner',
    href: '/admin/banners',
    icon: ImageIcon,
  },
  {
    title: 'Voucher',
    href: '/admin/vouchers',
    icon: Ticket,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminGuard>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminGuard>
  )
}

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-dark-100 flex">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-surface-primary border-b border-white/5 z-50 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-white/70 hover:text-white"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="text-lg font-bold text-white">Admin Panel</h1>
        <div className="w-10" />
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen bg-surface-primary border-r border-white/5 z-50
          transition-all duration-300 flex flex-col
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-accent-purple flex items-center justify-center">
                <span className="text-white font-bold text-sm">TK</span>
              </div>
              <span className="text-white font-bold">TopupKilat</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-2 text-white/50 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                  ${isActive
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <Icon size={20} className={collapsed ? 'mx-auto' : ''} />
                {!collapsed && <span className="font-medium">{item.title}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/5">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-all"
          >
            <LogOut size={20} className={collapsed ? 'mx-auto' : ''} />
            {!collapsed && <span>Kembali ke Web</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
