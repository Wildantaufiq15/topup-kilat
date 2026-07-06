'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// Support both mock data and Supabase format
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

interface GameCardProps {
  game: Game
  className?: string
  featured?: boolean
  compact?: boolean
}

export function GameCard({ game, className, featured = false, compact = false }: GameCardProps) {
  if (compact) {
    return <CompactCard game={game} className={className} featured={featured} />
  }

  // Normalize category for display
  const categoryLabel = game.category?.toLowerCase?.() === 'mobile' ? 'Mobile' :
                        game.category?.toLowerCase?.() === 'pc' ? 'PC' :
                        game.category?.toLowerCase?.() === 'console' ? 'Console' :
                        game.category?.toLowerCase?.() === 'web' ? 'Web' : 'Game'

  return (
    <Link href={`/topup/${game.slug}`} className="block">
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'relative bg-surface-primary rounded-xl border border-white/5 overflow-hidden',
          'group cursor-pointer transition-all duration-300',
          'hover:border-primary-500/40 hover:shadow-lg',
          featured && 'ring-2 ring-accent-cyan/30',
          className
        )}
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-dark-100">
          <Image
            src={game.logo || '/placeholder/game.png'}
            alt={game.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 180px"
          />

          {/* Featured Badge */}
          {featured && (
            <div className="absolute top-1.5 left-1.5">
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-accent-cyan to-accent-purple text-white rounded-full">
                Featured
              </span>
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute bottom-1.5 right-1.5">
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-dark-400/90 backdrop-blur-sm text-white/80 rounded-md">
              {categoryLabel}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-2.5">
          <h3 className="font-semibold text-white text-sm truncate group-hover:text-primary-400 transition-colors">
            {game.name}
          </h3>
          {game.totalTransactions !== undefined && (
            <p className="text-[11px] text-white/40 mt-0.5 truncate">
              {game.totalTransactions.toLocaleString('id-ID')} transaksi
            </p>
          )}
        </div>
      </motion.div>
    </Link>
  )
}

// Compact Card - smaller version for dense grids
function CompactCard({ game, className, featured }: Omit<GameCardProps, 'compact'>) {
  return (
    <Link href={`/topup/${game.slug}`} className="block">
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'relative bg-surface-primary rounded-lg border border-white/5 overflow-hidden',
          'group cursor-pointer transition-all duration-200',
          'hover:border-primary-500/30',
          featured && 'ring-1 ring-accent-cyan/30',
          className
        )}
      >
        <div className="relative w-full aspect-square bg-dark-100">
          <Image
            src={game.logo || '/placeholder/game.png'}
            alt={game.name}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-110"
            sizes="80px"
          />
        </div>
        <div className="p-2">
          <h4 className="font-medium text-white text-xs truncate group-hover:text-primary-400 transition-colors">
            {game.name}
          </h4>
        </div>
      </motion.div>
    </Link>
  )
}

// List version for sidebar/compact areas
export function GameCardList({ game, className }: Omit<GameCardProps, 'featured' | 'compact'>) {
  const categoryLabel = game.category?.toLowerCase?.() === 'mobile' ? 'Mobile' :
                        game.category?.toLowerCase?.() === 'pc' ? 'PC' :
                        game.category?.toLowerCase?.() === 'console' ? 'Console' : 'Game'

  return (
    <Link href={`/topup/${game.slug}`} className="block">
      <div
        className={cn(
          'flex items-center gap-3 p-2 rounded-lg',
          'bg-surface-primary/50 hover:bg-surface-primary',
          'border border-transparent hover:border-white/10',
          'group cursor-pointer transition-all duration-200',
          className
        )}
      >
        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-dark-100">
          <Image
            src={game.logo || '/placeholder/game.png'}
            alt={game.name}
            fill
            className="object-cover"
            sizes="40px"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white text-sm truncate group-hover:text-primary-400 transition-colors">
            {game.name}
          </h4>
          <p className="text-[11px] text-white/40 capitalize">{categoryLabel}</p>
        </div>
      </div>
    </Link>
  )
}
