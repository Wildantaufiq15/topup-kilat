'use client'

import { type Game } from '@/types'
import { GameCard, GameCardList } from './GameCard'
import { GameCardSkeleton } from '@/components/ui/Skeleton'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GameGridProps {
  games: Game[]
  isLoading?: boolean
  variant?: 'grid' | 'list'
  columns?: 2 | 3 | 4 | 5 | 6 | 7 | 8
  featured?: Game[]
}

const gridColsClasses = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  5: 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5',
  6: 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6',
  7: 'grid-cols-4 sm:grid-cols-5 lg:grid-cols-7',
  8: 'grid-cols-4 sm:grid-cols-6 lg:grid-cols-8',
}

export function GameGrid({
  games,
  isLoading = false,
  variant = 'grid',
  columns = 4,
  featured = [],
}: GameGridProps) {
  if (isLoading) {
    return (
      <div className={cn('grid gap-3', gridColsClasses[columns])}>
        {Array.from({ length: Math.min(games.length || 8, 12) }).map((_, i) => (
          <GameCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-primary flex items-center justify-center">
          <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-white mb-1">Tidak ada game ditemukan</h3>
        <p className="text-sm text-white/50">Coba ubah kata kunci pencarian atau filter Anda</p>
      </div>
    )
  }

  if (variant === 'list') {
    return (
      <div className="space-y-1">
        {games.map((game) => (
          <GameCardList key={game.id} game={game} />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('grid gap-3', gridColsClasses[columns])}>
      {games.map((game, index) => (
        <motion.div
          key={game.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
        >
          <GameCard game={game} compact />
        </motion.div>
      ))}
    </div>
  )
}

// Category Pills Filter
interface GameCategoryFilterProps {
  categories: string[]
  selected: string
  onSelect: (category: string) => void
}

export function GameCategoryFilter({ categories, selected, onSelect }: GameCategoryFilterProps) {
  const categoryLabels: Record<string, string> = {
    all: 'Semua',
    mobile: 'Mobile',
    pc: 'PC',
    console: 'Console',
    voucher: 'Voucher',
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
            selected === category
              ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md'
              : 'bg-surface-primary text-white/60 hover:text-white hover:bg-surface-secondary border border-white/5'
          )}
        >
          {categoryLabels[category] || category}
        </button>
      ))}
    </div>
  )
}
