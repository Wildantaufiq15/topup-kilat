'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Game {
  id: string
  name: string
  slug: string
  logo: string
  banner?: string
  category: string
  description?: string
  requires_server_id?: boolean
  is_active?: boolean
  featured?: boolean
  totalTransactions?: number
}

interface GameBannerCardProps {
  game: Game
  className?: string
  featured?: boolean
}

export function GameBannerCard({ game, className, featured = false }: GameBannerCardProps) {
  // Truncate description to ~50 chars
  const shortDescription = game.description
    ? game.description.length > 55
      ? game.description.slice(0, 55) + '...'
      : game.description
    : 'Top up cepat dan aman untuk pengalaman gaming terbaik'

  return (
    <Link href={`/topup/${game.slug}`} className="block">
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'relative bg-surface-primary rounded-xl border border-white/5 overflow-hidden',
          'group cursor-pointer transition-all duration-300',
          'hover:border-primary-500/40 hover:shadow-lg',
          featured && 'ring-2 ring-accent-cyan/30',
          className
        )}
      >
        <div className="flex items-center gap-4 p-4">
          {/* Logo Container */}
          <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-dark-100 shadow-lg ring-2 ring-white/10">
            <Image
              src={game.logo || '/placeholder/game.svg'}
              alt={game.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="56px"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-base truncate group-hover:text-primary-400 transition-colors">
              {game.name}
            </h3>
            <p className="text-xs text-white/50 mt-0.5 line-clamp-1">
              {shortDescription}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-white/5 text-white/60 rounded-full border border-white/5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Aktif 24 Jam
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-white/5 text-white/60 rounded-full border border-white/5">
                <svg className="w-3 h-3 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Cepat
              </span>
              {featured && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-accent-cyan to-accent-purple text-white rounded-full">
                  Featured
                </span>
              )}
            </div>
          </div>

          {/* Arrow indicator */}
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-white/30 group-hover:text-primary-400 transition-colors duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

// Skeleton loader for GameBannerCard
export function GameBannerCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-surface-primary rounded-xl border border-white/5 overflow-hidden p-4', className)}>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-dark-100 animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-dark-100 rounded animate-pulse" />
          <div className="h-3 w-48 bg-dark-100 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-5 w-20 bg-dark-100 rounded-full animate-pulse" />
            <div className="h-5 w-16 bg-dark-100 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
