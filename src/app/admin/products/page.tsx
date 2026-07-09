'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Image,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Star,
  Globe,
  Eye,
  EyeOff,
  ImagePlus,
  Trophy,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { ImageUploader } from '@/components/ui/ImageUploader'

interface Game {
  id: string
  name: string
  slug: string
  logo: string | null
  banner: string | null
  category: string
  description: string | null
  featured: boolean
  requires_serverId: boolean
  sort_order: number
  is_active: boolean
  created_at: string
}

interface Product {
  id: string
  game_id: string
  name: string
  price: number
  price_base: number | null
  supplier_code: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  game?: Game
}

export default function ProductsPage() {
  const [games, setGames] = useState<Game[]>([])
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showGameModal, setShowGameModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  useEffect(() => {
    fetchGames()
  }, [])

  useEffect(() => {
    if (selectedGame) {
      fetchProducts(selectedGame.id)
    }
  }, [selectedGame])

  const fetchGames = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('sort_order')

      if (error) throw error
      setGames(data || [])
      if (data && data.length > 0 && !selectedGame) {
        setSelectedGame(data[0])
      }
    } catch (error) {
      console.error('Error fetching games:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProducts = async (gameId: string) => {
    try {
      const { data, error } = await supabase
        .from('game_products')
        .select('*')
        .eq('game_id', gameId)
        .order('sort_order')

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const handleSaveGame = async (gameData: Partial<Game>) => {
    try {
      if (editingGame) {
        // Update existing game
        const { error } = await supabase
          .from('games')
          .update(gameData)
          .eq('id', editingGame.id)

        if (error) throw error
        toast.success('Game berhasil diupdate')
      } else {
        // Create new game
        const { error } = await supabase
          .from('games')
          .insert([{
            ...gameData,
            slug: gameData.slug || gameData.name?.toLowerCase().replace(/\s+/g, '-'),
            is_active: true,
            sort_order: games.length + 1,
          }])

        if (error) throw error
        toast.success('Game berhasil dibuat')
      }

      setShowGameModal(false)
      setEditingGame(null)
      fetchGames()
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan game')
    }
  }

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm('Yakin ingin menghapus game ini? Semua produk terkait juga akan dihapus.')) return

    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId)

      if (error) throw error
      toast.success('Game berhasil dihapus')
      fetchGames()
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus game')
    }
  }

  const handleToggleGameActive = async (game: Game) => {
    try {
      const { error } = await supabase
        .from('games')
        .update({ is_active: !game.is_active })
        .eq('id', game.id)

      if (error) throw error
      toast.success(`Game ${game.is_active ? 'dinonaktifkan' : 'diaktifkan'}`)
      fetchGames()
    } catch (error: any) {
      toast.error(error.message || 'Gagal update status game')
    }
  }

  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('game_products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (error) throw error
        toast.success('Produk berhasil diupdate')
      } else {
        // Create new product
        const { error } = await supabase
          .from('game_products')
          .insert([{
            ...productData,
            game_id: selectedGame!.id,
            is_active: true,
            sort_order: products.length + 1,
          }])

        if (error) throw error
        toast.success('Produk berhasil dibuat')
      }

      setShowProductModal(false)
      setEditingProduct(null)
      if (selectedGame) fetchProducts(selectedGame.id)
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan produk')
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return

    try {
      const { error } = await supabase
        .from('game_products')
        .delete()
        .eq('id', productId)

      if (error) throw error
      toast.success('Produk berhasil dihapus')
      if (selectedGame) fetchProducts(selectedGame.id)
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus produk')
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  // Toggle featured status
  const handleToggleFeatured = async (game: Game) => {
    try {
      const { error } = await supabase
        .from('games')
        .update({ featured: !game.featured })
        .eq('id', game.id)

      if (error) throw error
      toast.success(game.featured ? 'Game dihapus dari populer' : 'Game ditambahkan ke populer')
      fetchGames()
    } catch (error: any) {
      toast.error(error.message || 'Gagal update status')
    }
  }

  // Get featured games
  const featuredGames = games.filter(g => g.featured)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Produk</h1>
          <p className="text-white/60 text-sm mt-1">
            Kelola game dan nominal/top-up item
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchGames}
          >
            <RefreshCw size={16} />
          </Button>
        </div>
      </div>

      {/* Featured Games Section */}
      <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 rounded-xl border border-yellow-500/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={18} className="text-yellow-400" />
          <h3 className="text-white font-medium">Game Populer</h3>
          <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
            {featuredGames.length} game
          </span>
        </div>
        <p className="text-xs text-white/50 mb-3">Game yang ditampilkan di halaman utama website</p>
        <div className="flex flex-wrap gap-2">
          {featuredGames.length > 0 ? (
            featuredGames.map((game) => (
              <div
                key={game.id}
                className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
              >
                {game.logo ? (
                  <img src={game.logo} alt={game.name} className="w-6 h-6 rounded object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                    <Image size={12} />
                  </div>
                )}
                <span className="text-sm text-white font-medium">{game.name}</span>
                <button
                  onClick={() => handleToggleFeatured(game)}
                  className="p-1 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 rounded transition-colors"
                  title="Hapus dari populer"
                >
                  <Star size={14} fill="currentColor" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-white/50 py-2">Belum ada game populer. Pilih game di bawah.</p>
          )}
        </div>
      </div>

      {/* Game Selector */}
      <div className="bg-surface-primary rounded-xl border border-white/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium">Semua Game</h3>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingGame(null)
              setShowGameModal(true)
            }}
          >
            <Plus size={14} />
            Tambah
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {games.map((game) => (
            <div
              key={game.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all group ${
                selectedGame?.id === game.id
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'bg-dark-100 text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <button
                onClick={() => setSelectedGame(game)}
                className="flex items-center gap-2"
              >
                {game.logo ? (
                  <img src={game.logo} alt={game.name} className="w-6 h-6 rounded object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                    <Image size={12} />
                  </div>
                )}
                <span className="text-sm">{game.name}</span>
              </button>
              {/* Featured Toggle */}
              <button
                onClick={() => handleToggleFeatured(game)}
                className={`p-1 rounded transition-colors ${
                  game.featured
                    ? 'text-yellow-400 hover:text-yellow-300'
                    : 'text-white/30 hover:text-yellow-400 hover:bg-yellow-500/10'
                }`}
                title={game.featured ? 'Hapus dari populer' : 'Tambahkan ke populer'}
              >
                <Star size={14} fill={game.featured ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingGame(game)
                  setShowGameModal(true)
                }}
                className="p-1 opacity-0 group-hover:opacity-100 text-white/40 hover:text-primary-400 hover:bg-primary-500/10 rounded transition-all"
                title="Edit game"
              >
                <Edit size={14} />
              </button>
              {!game.is_active && (
                <XCircle size={14} className="text-red-400" />
              )}
            </div>
          ))}
          {games.length === 0 && (
            <p className="text-sm text-white/50 py-4">Belum ada game. Klik "Tambah" untuk membuat game baru.</p>
          )}
        </div>
      </div>

      {/* Products Table */}
      {selectedGame && (
        <div className="bg-surface-primary rounded-xl border border-white/5 overflow-hidden">
          {/* Game Info Header */}
          <div className="relative h-32 bg-gradient-to-r from-primary-900/50 to-purple-900/50">
            {selectedGame.banner ? (
              <img
                src={selectedGame.banner}
                alt={selectedGame.name}
                className="w-full h-full object-cover opacity-30"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-purple-600/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-primary to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-primary border-2 border-white/10 shadow-xl">
                {selectedGame.logo ? (
                  <img src={selectedGame.logo} alt={selectedGame.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/30">
                    <Image size={24} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{selectedGame.name}</h3>
                  {selectedGame.featured && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-yellow-500/20 text-yellow-400 rounded-full flex items-center gap-1">
                      <Star size={10} />
                      Featured
                    </span>
                  )}
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                    selectedGame.is_active
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {selectedGame.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <p className="text-sm text-white/60">{selectedGame.category} • {selectedGame.description || 'Tidak ada deskripsi'}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEditingGame(selectedGame)
                  setShowGameModal(true)
                }}
              >
                <Edit size={14} />
                Edit Game
              </Button>
            </div>
          </div>

          {/* Products Table */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h4 className="text-white font-medium">Daftar Produk</h4>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-dark-100 border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-primary-500/50 w-48"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingProduct(null)
                  setShowProductModal(true)
                }}
              >
                <Plus size={16} />
                Tambah Produk
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Nama</th>
                  <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Harga Jual</th>
                  <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Harga Modal</th>
                  <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Kode Supplier</th>
                  <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-white/50">
                      {search ? 'Produk tidak ditemukan' : 'Belum ada produk. Tambahkan produk baru.'}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm text-white">{product.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-accent-cyan">
                          {formatCurrency(product.price)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-white/70">
                          {product.price_base ? formatCurrency(product.price_base) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-white/50 font-mono">
                          {product.supplier_code || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            const updated = products.map(p =>
                              p.id === product.id ? { ...p, is_active: !p.is_active } : p
                            )
                            setProducts(updated)
                            supabase.from('game_products').update({ is_active: !product.is_active }).eq('id', product.id)
                          }}
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                            product.is_active
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {product.is_active ? (
                            <><CheckCircle size={12} /> Aktif</>
                          ) : (
                            <><XCircle size={12} /> Nonaktif</>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingProduct(product)
                              setShowProductModal(true)
                            }}
                            className="p-2 text-white/50 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Game Modal */}
      {showGameModal && (
        <GameModal
          game={editingGame}
          onClose={() => {
            setShowGameModal(false)
            setEditingGame(null)
          }}
          onSave={handleSaveGame}
          onDelete={editingGame ? () => handleDeleteGame(editingGame.id) : undefined}
        />
      )}

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => {
            setShowProductModal(false)
            setEditingProduct(null)
          }}
          onSave={handleSaveProduct}
          onDelete={editingProduct ? () => handleDeleteProduct(editingProduct.id) : undefined}
        />
      )}
    </div>
  )
}

// Game Modal Component
function GameModal({
  game,
  onClose,
  onSave,
  onDelete,
}: {
  game: Game | null
  onClose: () => void
  onSave: (data: Partial<Game>) => void
  onDelete?: () => void
}) {
  const [form, setForm] = useState({
    name: game?.name || '',
    slug: game?.slug || '',
    logo: game?.logo || '',
    banner: game?.banner || '',
    category: game?.category || 'MOBILE',
    description: game?.description || '',
    featured: game?.featured || false,
    requires_serverId: game?.requires_serverId || true,
    is_active: game?.is_active !== undefined ? game.is_active : true,
    sort_order: game?.sort_order || 1,
  })
  const [logoMode, setLogoMode] = useState<'upload' | 'url'>(
    form.logo?.startsWith('http') ? 'url' : 'upload'
  )
  const [bannerMode, setBannerMode] = useState<'upload' | 'url'>(
    form.banner?.startsWith('http') ? 'url' : 'upload'
  )
  const [showAdvanced, setShowAdvanced] = useState(false)

  const categories = ['MOBILE', 'PC', 'CONSOLE', 'VOUCHER', 'OTHER']

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    setForm({ ...form, name, slug: game?.slug || slug })
  }

  // Toggle boolean fields
  const toggleField = (field: 'featured' | 'requires_serverId' | 'is_active') => {
    setForm({ ...form, [field]: !form[field] })
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-primary rounded-xl border border-white/5 w-full max-w-lg max-h-[95vh] overflow-y-auto">
        <div className="p-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-surface-primary z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-dark-100">
              {form.logo ? (
                <img src={form.logo} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/30">
                  <Image size={20} />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {game ? 'Edit Game' : 'Tambah Game Baru'}
              </h2>
              <p className="text-xs text-white/50">
                {game ? `Edit: ${game.name}` : 'Tambah game baru ke catalog'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white p-2">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm text-white/70 mb-2">
              <span className="flex items-center gap-2">
                <Image size={14} />
                Logo Game
              </span>
            </label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setLogoMode('upload')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                  logoMode === 'upload'
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-dark-100 text-white/50 border border-white/5'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setLogoMode('url')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                  logoMode === 'url'
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-dark-100 text-white/50 border border-white/5'
                }`}
              >
                URL Gambar
              </button>
            </div>

            {logoMode === 'upload' ? (
              <ImageUploader
                value={form.logo}
                onChange={(url) => setForm({ ...form, logo: url })}
                aspectRatio="square"
                maxSize={2}
                folder="game-logos"
              />
            ) : (
              <input
                type="url"
                value={form.logo}
                onChange={(e) => setForm({ ...form, logo: e.target.value })}
                className="w-full px-3 py-2 bg-dark-100 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500 placeholder-white/30"
                placeholder="https://example.com/logo.png"
              />
            )}
          </div>

          {/* Banner Upload */}
          <div>
            <label className="block text-sm text-white/70 mb-2">
              <span className="flex items-center gap-2">
                <ImagePlus size={14} />
                Banner Game (Opsional)
              </span>
            </label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setBannerMode('upload')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                  bannerMode === 'upload'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-dark-100 text-white/50 border border-white/5'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setBannerMode('url')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                  bannerMode === 'url'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-dark-100 text-white/50 border border-white/5'
                }`}
              >
                URL Gambar
              </button>
            </div>

            {bannerMode === 'upload' ? (
              <ImageUploader
                value={form.banner}
                onChange={(url) => setForm({ ...form, banner: url })}
                aspectRatio="video"
                maxSize={5}
                folder="game-banners"
              />
            ) : (
              <input
                type="url"
                value={form.banner}
                onChange={(e) => setForm({ ...form, banner: e.target.value })}
                className="w-full px-3 py-2 bg-dark-100 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500 placeholder-white/30"
                placeholder="https://example.com/banner.jpg"
              />
            )}
            <p className="text-xs text-white/40 mt-1">Ukuran disarankan: 1280x720px</p>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm text-white/70 mb-1">Nama Game</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 bg-dark-100 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
                placeholder="Mobile Legends"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-white/70 mb-1">Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full px-3 py-2 bg-dark-100 border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-primary-500"
                placeholder="mobile-legends"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 bg-dark-100 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Urutan</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-dark-100 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
                min={1}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-white/70 mb-1">Deskripsi</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 bg-dark-100 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500 resize-none"
                placeholder="Deskripsi singkat tentang game..."
                rows={2}
              />
            </div>
          </div>

          {/* Toggle Options */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full px-3 py-2 bg-dark-100 rounded-lg text-sm text-white/70 hover:text-white transition-colors"
            >
              <span>Opsi Tambahan</span>
              <ChevronRight size={16} className={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
            </button>

            {showAdvanced && (
              <div className="space-y-2 pt-2">
                {/* Featured Toggle */}
                <div
                  onClick={() => toggleField('featured')}
                  className="flex items-center justify-between px-3 py-2.5 bg-dark-100 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Star size={16} className={form.featured ? 'text-yellow-400' : 'text-white/40'} />
                    <div>
                      <span className="text-sm text-white">Featured</span>
                      <p className="text-xs text-white/40">Tampil di halaman utama</p>
                    </div>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors ${form.featured ? 'bg-primary-500' : 'bg-white/10'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${form.featured ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
                  </div>
                </div>

                {/* Requires Server ID Toggle */}
                <div
                  onClick={() => toggleField('requires_serverId')}
                  className="flex items-center justify-between px-3 py-2.5 bg-dark-100 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Globe size={16} className={form.requires_serverId ? 'text-accent-cyan' : 'text-white/40'} />
                    <div>
                      <span className="text-sm text-white">Butuh Server ID</span>
                      <p className="text-xs text-white/40">Pengguna harus input Server ID saat order</p>
                    </div>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors ${form.requires_serverId ? 'bg-accent-cyan' : 'bg-white/10'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${form.requires_serverId ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
                  </div>
                </div>

                {/* Active Toggle */}
                <div
                  onClick={() => toggleField('is_active')}
                  className="flex items-center justify-between px-3 py-2.5 bg-dark-100 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {form.is_active ? (
                      <Eye size={16} className="text-green-400" />
                    ) : (
                      <EyeOff size={16} className="text-red-400" />
                    )}
                    <div>
                      <span className="text-sm text-white">Status</span>
                      <p className="text-xs text-white/40">{form.is_active ? 'Game aktif & bisa dipesan' : 'Game nonaktif'}</p>
                    </div>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors ${form.is_active ? 'bg-green-500' : 'bg-red-500'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-white/5 flex items-center justify-between sticky bottom-0 bg-surface-primary">
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              Hapus Game
            </button>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <Button variant="secondary" onClick={onClose}>Batal</Button>
            <Button
              variant="primary"
              onClick={() => onSave({
                name: form.name,
                slug: form.slug,
                logo: form.logo || null,
                banner: form.banner || null,
                category: form.category,
                description: form.description || null,
                featured: form.featured,
                requires_serverId: form.requires_serverId,
                is_active: form.is_active,
                sort_order: form.sort_order,
              })}
              disabled={!form.name || !form.slug}
            >
              Simpan
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Product Modal Component
function ProductModal({
  product,
  onClose,
  onSave,
  onDelete,
}: {
  product: Product | null
  onClose: () => void
  onSave: (data: Partial<Product>) => void
  onDelete?: () => void
}) {
  const [form, setForm] = useState({
    name: product?.name || '',
    price: product?.price?.toString() || '',
    price_base: product?.price_base?.toString() || '',
    supplier_code: product?.supplier_code || '',
    sort_order: product?.sort_order || 1,
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-primary rounded-xl border border-white/5 w-full max-w-md">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {product ? 'Edit Produk' : 'Tambah Produk Baru'}
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Nama/Nominal</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-dark-100 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
              placeholder="86 Diamonds"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Harga Jual (Rp)</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full px-3 py-2 bg-dark-100 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
              placeholder="15000"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Harga Modal (Rp)</label>
            <input
              type="number"
              value={form.price_base}
              onChange={(e) => setForm({ ...form, price_base: e.target.value })}
              className="w-full px-3 py-2 bg-dark-100 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
              placeholder="12000"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Kode Supplier (Digiflazz)</label>
            <input
              type="text"
              value={form.supplier_code}
              onChange={(e) => setForm({ ...form, supplier_code: e.target.value })}
              className="w-full px-3 py-2 bg-dark-100 border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-primary-500"
              placeholder="ML-86"
            />
          </div>
        </div>
        <div className="p-4 border-t border-white/5 flex items-center justify-between">
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-2 text-red-400 hover:text-red-300"
            >
              Hapus
            </button>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <Button variant="secondary" onClick={onClose}>Batal</Button>
            <Button
              variant="primary"
              onClick={() => onSave({
                name: form.name,
                price: parseInt(form.price),
                price_base: form.price_base ? parseInt(form.price_base) : null,
                supplier_code: form.supplier_code || null,
                sort_order: form.sort_order,
              })}
              disabled={!form.name || !form.price}
            >
              Simpan
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
