'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Gamepad2, Gift, HelpCircle } from 'lucide-react'

const mobileNavLinks = [
  { href: '/', label: 'Beranda', icon: Home },
  { href: '/games', label: 'Game', icon: Gamepad2 },
  { href: '/promo', label: 'Promo', icon: Gift },
  { href: '/bantuan', label: 'Bantuan', icon: HelpCircle },
]

export function MobileNav() {
  const pathname = usePathname()

  // Hide on admin pages
  if (pathname.startsWith('/admin')) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-dark-50/95 backdrop-blur-xl border-t border-white/5 safe-area-pb">
      <div className="flex items-center justify-around py-2">
        {mobileNavLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
          const Icon = link.icon

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300',
                isActive
                  ? 'text-primary-400'
                  : 'text-white/50 hover:text-white/70'
              )}
            >
              <Icon
                size={22}
                className={cn(
                  'transition-transform duration-300',
                  isActive && 'scale-110'
                )}
              />
              <span className="text-xs font-medium">{link.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary-400" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
