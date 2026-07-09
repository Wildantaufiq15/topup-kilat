'use client'

import { useState, useMemo } from 'react'
import { Suspense } from 'react'
import { GameGrid } from '@/components/game/GameGrid'
import { GameCardSkeleton } from '@/components/ui/Skeleton'
import { mockGames } from '../data/mockData'
import { GameCategoryFilter } from '@/components/game/GameGrid'
import { GamesHeader } from './components/GamesHeader'

export default function GamesPage() {
  const [games] = useState(mockGames)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter games by category and search
  const filteredGames = useMemo(() => {
    let result = games

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(g => g.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(g =>
        g.name.toLowerCase().includes(query) ||
        g.category.toLowerCase().includes(query) ||
        g.description?.toLowerCase().includes(query)
      )
    }

    return result
  }, [games, selectedCategory, searchQuery])

  return (
    <div className="min-h-screen">
      <GamesHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="container-page py-6">
        {/* Filters */}
        <div className="mb-6">
          <GameCategoryFilter
            categories={['all', 'mobile', 'pc', 'console', 'voucher']}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>

        {/* Results count */}
        <div className="mb-4">
          <p className="text-sm text-white/50">
            {searchQuery ? (
              <>Menampilkan <span className="text-white font-medium">{filteredGames.length}</span> hasil untuk "{searchQuery}"</>
            ) : (
              <>Menampilkan <span className="text-white font-medium">{filteredGames.length}</span> game</>
            )}
          </p>
        </div>

        {/* Games Grid - Compact layout */}
        <Suspense
          fallback={
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {Array.from({ length: 16 }).map((_, i) => (
                <GameCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <GameGrid games={filteredGames} columns={6} />
        </Suspense>
      </div>
    </div>
  )
}
