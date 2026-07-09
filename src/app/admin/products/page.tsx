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
  logo: string
  category: string
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
        <Button
          variant="primary"
          onClick={() => {
            setEditingGame(null)
            setShowGameModal(true)
          }}
        >
          <Plus size={18} />
          Tambah Game
        </Button>
      </div>

      {/* Game Selector */}
      <div className="bg-surface-primary rounded-xl border border-white/5 p-4">
        <h3 className="text-white font-medium mb-3">Pilih Game</h3>
        <div className="flex flex-wrap gap-2">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                selectedGame?.id === game.id
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'bg-dark-100 text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {game.logo ? (
                <img src={game.logo} alt={game.name} className="w-6 h-6 rounded object-cover" />
              ) : (
                <Image size={16} />
              )}
              <span className="text-sm">{game.name}</span>
              {!game.is_active && (
                <XCircle size={14} className="text-red-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      {selectedGame && (
        <div className="bg-surface-primary rounded-xl border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">{selectedGame.name}</h3>
              <p className="text-white/50 text-sm">{selectedGame.category}</p>
            </div>
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
    category: game?.category || 'MOBILE',
    sort_order: game?.sort_order || 1,
  })
  const [logoMode, setLogoMode] = useState<'upload' | 'url'>(form.logo?.startsWith('http') ? 'url' : 'upload')

  const categories = ['MOBILE', 'PC', 'CONSOLE', 'VOUCHER', 'OTHER']

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    setForm({ ...form, name, slug: game?.slug || slug })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-primary rounded-xl border border-white/5 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-surface-primary z-10">
          <h2 className="text-lg font-bold text-white">
            {game ? 'Edit Game' : 'Tambah Game Baru'}
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
        </div>
        <div className="p-4 space-y-4">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Logo Game</label>
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
                Upload Gambar
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

          <div>
            <label className="block text-sm text-white/70 mb-1">Nama Game</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3 py-2 bg-dark-100 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
              placeholder="Mobile Legends"
            />
          </div>
          <div>
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
        </div>
        <div className="p-4 border-t border-white/5 flex items-center justify-between sticky bottom-0 bg-surface-primary">
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
              onClick={() => onSave(form)}
              disabled={!form.name}
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
