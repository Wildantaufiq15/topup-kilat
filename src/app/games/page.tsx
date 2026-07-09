'use client'

import { useState, useMemo, useEffect } from 'react'
import { Suspense } from 'react'
import { GameGrid } from '@/components/game/GameGrid'
import { GameCardSkeleton } from '@/components/ui/Skeleton'
import { GameCategoryFilter } from '@/components/game/GameGrid'
import { GamesHeader } from './components/GamesHeader'
import { api } from '@/lib/api'

export default function GamesPage() {
  const [games, setGames] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchGames() {
      try {
        const data = await api.getGames()
        setGames(data)
      } catch (error) {
        console.error('Error fetching games:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchGames()
  }, [])

  // Filter games by category and search
  const filteredGames = useMemo(() => {
    let result = games

    // Filter by category (case-insensitive)
    if (selectedCategory !== 'all') {
      result = result.filter(g => g.category?.toLowerCase() === selectedCategory.toLowerCase())
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(g =>
        g.name?.toLowerCase().includes(query) ||
        g.category?.toLowerCase().includes(query) ||
        g.description?.toLowerCase().includes(query)
      )
    }

    return result
  }, [games, selectedCategory, searchQuery])

  // Map database games to component format
  const mappedGames = useMemo(() => {
    return filteredGames.map(g => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      logo: g.logo || '/placeholder/game.svg',
      banner: g.banner || null,
      category: g.category?.toLowerCase() || 'mobile',
      description: g.description || null,
      requires_server_id: g.requires_server_id ?? true,
      is_active: g.is_active ?? true,
      featured: g.featured ?? false,
      totalTransactions: g.total_transactions || 0,
    }))
  }, [filteredGames])

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
            {isLoading ? (
              'Memuat game...'
            ) : searchQuery ? (
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
          <GameGrid games={mappedGames} columns={6} isLoading={isLoading} />
        </Suspense>
      </div>
    </div>
  )
}
