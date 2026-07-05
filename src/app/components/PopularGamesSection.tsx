'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { type Game } from '@/types'
import { GameCard } from '@/components/game/GameCard'
import { ArrowRight, TrendingUp, Flame } from 'lucide-react'

interface PopularGamesSectionProps {
  games: Game[]
}

export function PopularGamesSection({ games }: PopularGamesSectionProps) {
  // Get featured/popular games
  const popularGames = games.filter(g => g.featured).slice(0, 8)
  const otherGames = games.filter(g => !g.featured).slice(0, 8)

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-medium text-orange-400 uppercase tracking-wide">Trending</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white">
            Game{' '}
            <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-400">
              Populer
            </span>
          </h2>
        </div>
        <Link
          href="/games"
          className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors"
        >
          <span className="hidden sm:inline">Lihat Semua</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Popular Games Grid - Horizontal scroll on mobile */}
      <div className="relative">
        {/* Horizontal scroll container for mobile */}
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:grid sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-4 scrollbar-hide">
          {popularGames.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex-shrink-0 w-[140px] sm:w-auto"
            >
              <GameCard game={game} featured compact />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Other Games */}
      {otherGames.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <h3 className="text-lg font-bold text-white">Game Lainnya</h3>
          </div>

          {/* Horizontal scroll for other games too */}
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:grid sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 sm:gap-3 scrollbar-hide">
            {otherGames.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex-shrink-0 w-[100px] sm:w-auto"
              >
                <GameCard game={game} compact />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* View All CTA */}
      <div className="mt-8 text-center">
        <Link
          href="/games"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-primary border border-white/10 text-white font-medium hover:bg-surface-secondary hover:border-primary-500/30 transition-all text-sm"
        >
          Lihat Semua Game
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  )
}
