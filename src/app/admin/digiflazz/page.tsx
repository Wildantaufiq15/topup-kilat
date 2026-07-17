'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

interface DigiflazzProduct {
  sku_code: string
  product_name: string
  price_base: number
  category?: string
  brand?: string
  stock: string | number
  status: string
  existing: {
    id: string
    name: string
    price: number
    synced: boolean
  } | null
}

interface Game {
  id: string
  name: string
  slug: string
}

export default function DigiflazzSyncPage() {
  const [games, setGames] = useState<Game[]>([])
  const [selectedGame, setSelectedGame] = useState<string>('')
  const [products, setProducts] = useState<DigiflazzProduct[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [margin, setMargin] = useState<number>(20) // Default 20% margin
  const [updateExisting, setUpdateExisting] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [syncing, setSyncing] = useState<boolean>(false)
  const [balance, setBalance] = useState<number>(0)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [filter, setFilter] = useState<string>('')
  const [category, setCategory] = useState<string>('')

  // Fetch games
  useEffect(() => {
    fetchGames()
  }, [])

  async function fetchGames() {
    try {
      const gamesData = await api.getGames()
      setGames(gamesData || [])
    } catch (err: any) {
      console.error('Error fetching games:', err)
    }
  }

  // Fetch products from Digiflazz
  async function fetchProducts() {
    if (!selectedGame) {
      setMessage({ type: 'error', text: 'Pilih game terlebih dahulu' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(
        `/api/admin/digiflazz/price-list?game=${selectedGame}`
      )
      const data = await response.json()

      if (data.success) {
        setProducts(data.products || [])
        setBalance(data.balance || 0)
        setSelectedProducts(new Set())
        setMessage({ type: 'success', text: `Ditemukan ${data.total} produk dari Digiflazz` })
      } else {
        setMessage({ type: 'error', text: data.message || 'Gagal mengambil produk' })
        setProducts([])
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  // Sync products
  async function syncProducts() {
    if (selectedProducts.size === 0) {
      setMessage({ type: 'error', text: 'Pilih minimal 1 produk untuk di-sync' })
      return
    }

    setSyncing(true)
    setMessage(null)

    try {
      const productsToSync = products
        .filter(p => selectedProducts.has(p.sku_code))
        .map(p => ({
          sku_code: p.sku_code,
          product_name: p.product_name,
          price_base: p.price_base,
          category: p.category,
          stock: p.stock,
        }))

      const response = await fetch('/api/admin/digiflazz/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: productsToSync,
          gameId: selectedGame,
          margin,
          updateExisting,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const results = data.results
        setMessage({
          type: 'success',
          text: `Berhasil! Dibuat: ${results.created}, Diupdate: ${results.updated}, Dilewati: ${results.skipped}`,
        })
        setSelectedProducts(new Set())
        // Refresh products
        fetchProducts()
      } else {
        setMessage({ type: 'error', text: data.message || 'Gagal sync produk' })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSyncing(false)
    }
  }

  // Toggle product selection
  function toggleProduct(skuCode: string) {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(skuCode)) {
      newSelected.delete(skuCode)
    } else {
      newSelected.add(skuCode)
    }
    setSelectedProducts(newSelected)
  }

  // Toggle all products
  function toggleAll() {
    const filteredProducts = getFilteredProducts()
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.sku_code)))
    }
  }

  // Get filtered products
  function getFilteredProducts() {
    return products.filter(p => {
      const matchesFilter = !filter ||
        p.product_name.toLowerCase().includes(filter.toLowerCase()) ||
        p.sku_code.toLowerCase().includes(filter.toLowerCase())
      const matchesCategory = !category || p.category === category
      return matchesFilter && matchesCategory
    })
  }

  // Get unique categories
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]

  // Calculate selling price preview
  function calculatePrice(basePrice: number) {
    return Math.round(basePrice * (1 + margin / 100)).toLocaleString('id-ID')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🔄 Sync Produk Digiflazz</h1>
          <p className="text-gray-400">
            Ambil produk dari Digiflazz dan import ke database website
          </p>
        </div>

        {/* Balance Info */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Saldo Digiflazz</p>
            <p className="text-2xl font-bold text-green-400">
              Rp {balance.toLocaleString('id-ID')}
            </p>
          </div>
          <a
            href="https://member.digiflazz.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Buka Dashboard Digiflazz →
          </a>
        </div>

        {/* Message */}
        {message && (
          <div className={`rounded-lg p-4 mb-6 ${message.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
            {message.text}
          </div>
        )}

        {/* Step 1: Select Game */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">1️⃣ Pilih Game</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {games.map(game => (
              <button
                key={game.id}
                onClick={() => {
                  setSelectedGame(game.id)
                  setProducts([])
                  setSelectedProducts(new Set())
                }}
                className={`p-3 rounded-lg text-center transition ${
                  selectedGame === game.id
                    ? 'bg-blue-600 ring-2 ring-blue-400'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {game.name}
              </button>
            ))}
          </div>
          {selectedGame && (
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? '⏳ Mengambil produk...' : '🔍 Ambil Produk dari Digiflazz'}
            </button>
          )}
        </div>

        {/* Step 2: Configure & Preview */}
        {products.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">2️⃣ Konfigurasi & Preview</h2>

            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Margin/Laba (%)</label>
                <input
                  type="number"
                  value={margin}
                  onChange={e => setMargin(Number(e.target.value))}
                  min={0}
                  max={100}
                  className="w-full bg-gray-700 rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Contoh: Base Rp 1.000 + {margin}% = Rp {calculatePrice(1000)}
                </p>
              </div>
              <div>
                <label className="flex items-center space-x-2 text-gray-400 text-sm mb-2">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={e => setUpdateExisting(e.target.checked)}
                    className="rounded"
                  />
                  <span>Update produk yang sudah ada</span>
                </label>
                <p className="text-xs text-gray-500">
                  Jika tidak dicentang, produk yang sudah ada akan dilewati
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Total Dipilih</p>
                <p className="text-2xl font-bold text-blue-400">
                  {selectedProducts.size} / {getFilteredProducts().length}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-4">
              <input
                type="text"
                placeholder="🔍 Filter nama produk..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="flex-1 min-w-[200px] bg-gray-700 rounded px-3 py-2"
              />
              {categories.length > 1 && (
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="bg-gray-700 rounded px-3 py-2"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat!}>{cat}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Product List */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="pb-3 w-12">
                      <input
                        type="checkbox"
                        checked={selectedProducts.size === getFilteredProducts().length && getFilteredProducts().length > 0}
                        onChange={toggleAll}
                        className="rounded"
                      />
                    </th>
                    <th className="pb-3">SKU</th>
                    <th className="pb-3">Nama Produk</th>
                    <th className="pb-3">Kategori</th>
                    <th className="pb-3 text-right">Harga Base</th>
                    <th className="pb-3 text-right">Jual</th>
                    <th className="pb-3 text-center">Stock</th>
                    <th className="pb-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredProducts().map(product => (
                    <tr key={product.sku_code} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="py-3">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.sku_code)}
                          onChange={() => toggleProduct(product.sku_code)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-3 font-mono text-xs">{product.sku_code}</td>
                      <td className="py-3">
                        <div>
                          <p>{product.product_name}</p>
                          {product.existing && (
                            <p className="text-xs text-blue-400">
                              ↔ Sudah ada: {product.existing.name} (Rp {product.existing.price.toLocaleString('id-ID')})
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-gray-400">{product.category || '-'}</td>
                      <td className="py-3 text-right">
                        Rp {product.price_base.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 text-right text-green-400 font-medium">
                        Rp {calculatePrice(product.price_base)}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          product.stock === 'READY' || Number(product.stock) > 0
                            ? 'bg-green-900 text-green-400'
                            : 'bg-red-900 text-red-400'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        {product.existing ? (
                          <span className="text-blue-400 text-xs">✓ Synced</span>
                        ) : (
                          <span className="text-gray-500 text-xs">Baru</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action */}
            <div className="mt-6 flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                {selectedProducts.size} produk dipilih
              </p>
              <button
                onClick={syncProducts}
                disabled={selectedProducts.size === 0 || syncing}
                className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium disabled:opacity-50"
              >
                {syncing ? '⏳ Menyimpan...' : `✅ Import ${selectedProducts.size} Produk`}
              </button>
            </div>
          </div>
        )}

        {/* Help */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="font-semibold mb-3">💡 Cara Pakai</h3>
          <ol className="text-gray-400 text-sm space-y-2">
            <li>1. Pilih game yang akan di-sync</li>
            <li>2. Klik "Ambil Produk dari Digiflazz" untuk melihat produk yang tersedia</li>
            <li>3. Atur margin/laba yang ingin kamu tambahkan (default 20%)</li>
            <li>4. Checklist produk yang ingin di-import</li>
            <li>5. Klik "Import" untuk menyimpan ke database</li>
          </ol>
          <div className="mt-4 p-3 bg-yellow-900/30 rounded border border-yellow-700/50">
            <p className="text-yellow-400 text-sm">
              ⚠️ <strong>Catatan:</strong> Pastikan saldo Digiflazz cukup. Setiap transaksi akan memotong saldo sesuai harga produk.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
