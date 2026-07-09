'use client'

import { motion } from 'framer-motion'
import { Search, Filter, X } from 'lucide-react'

interface GamesHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function GamesHeader({ searchQuery, onSearchChange }: GamesHeaderProps) {
  return (
    <div className="bg-dark-100/50 border-b border-white/5">
      <div className="container-page py-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Semua{' '}
            <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-accent-cyan to-primary-400">
              Game
            </span>
          </h1>
          <p className="text-white/60">
            Pilih game favorit dan mulai top up dengan harga termurah
          </p>
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Cari game... (ML, FF, Genshin, dll)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-surface-primary rounded-xl border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Button */}
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-surface-primary rounded-xl border border-white/10 text-white hover:bg-surface-secondary hover:border-primary-500/30 transition-all">
            <Filter size={20} />
            <span>Filter</span>
          </button>
        </motion.div>
      </div>
    </div>
  )
}
