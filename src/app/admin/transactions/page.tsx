'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

interface Order {
  id: string
  invoice_no: string
  status: string
  total: number
  created_at: string
  user_game_id: string
  server_id: string | null
  game: { name: string } | null
  product: { name: string; price: number } | null
  user: { name: string; email: string } | null
  payment: { method: string; paid_at: string | null } | null
}

type StatusFilter = 'ALL' | 'PENDING' | 'PAID' | 'SUCCESS' | 'FAILED' | 'EXPIRED'

export default function TransactionsPage() {
  const { session } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const itemsPerPage = 20

  useEffect(() => {
    fetchOrders()
  }, [session])

  const fetchOrders = async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const headers: HeadersInit = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/admin/orders', { headers })
      const result = await response.json()

      if (!result.success) {
        // Don't throw for auth errors - just show empty state
        if (response.status === 401 || response.status === 403) {
          setFetchError('Tidak memiliki akses ke data transaksi')
          setOrders([])
          return
        }
        throw new Error(result.message || 'Gagal memuat data')
      }
      setOrders(result.data || [])
    } catch (error: any) {
      console.error('Error fetching orders:', error)
      setFetchError(error.message || 'Terjadi kesalahan')
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.invoice_no?.toLowerCase().includes(search.toLowerCase()) ||
      order.user_game_id?.toLowerCase().includes(search.toLowerCase()) ||
      order.game?.name?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === 'ALL' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: any }> = {
      PENDING: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Clock },
      PAID: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: CheckCircle },
      PROCESSING: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: AlertCircle },
      SUCCESS: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
      FAILED: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle },
      EXPIRED: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: XCircle },
    }
    const style = styles[status] || styles.PENDING
    const Icon = style.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>
        <Icon size={12} />
        {status}
      </span>
    )
  }

  const exportToCSV = () => {
    const headers = ['Invoice', 'Game', 'Produk', 'User ID', 'Total', 'Status', 'Tanggal']
    const rows = filteredOrders.map(order => [
      order.invoice_no,
      order.game?.name || '-',
      order.product?.name || '-',
      order.user_game_id,
      order.total,
      order.status,
      formatDate(order.created_at),
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Transaksi</h1>
          <p className="text-white/60 text-sm mt-1">
            {filteredOrders.length} transaksi ditemukan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-surface-primary border border-white/10 rounded-lg text-white/70 hover:text-white hover:border-white/20 transition-all"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 bg-surface-primary border border-white/10 rounded-lg text-white/70 hover:text-white hover:border-white/20 transition-all"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Cari invoice, user ID, game..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-primary border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-500/50"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {(['ALL', 'PENDING', 'PAID', 'SUCCESS', 'FAILED', 'EXPIRED'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 text-sm rounded-lg whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'bg-surface-primary border border-white/10 text-white/60 hover:text-white hover:border-white/20'
              }`}
            >
              {status === 'ALL' ? 'Semua' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-primary rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Invoice</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Game</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">User ID</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Total</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Status</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-white/50">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                    Memuat data...
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="text-red-400 mb-2">
                      <AlertCircle size={24} className="mx-auto" />
                    </div>
                    <p className="text-white/50">{fetchError}</p>
                    <button
                      onClick={fetchOrders}
                      className="mt-2 text-sm text-primary-400 hover:text-primary-300"
                    >
                      Coba lagi
                    </button>
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-white/50">
                    Tidak ada transaksi ditemukan
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-white">
                        {order.invoice_no || order.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-white">{order.game?.name || '-'}</p>
                        <p className="text-xs text-white/50">{order.product?.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-white">{order.user_game_id}</p>
                        {order.server_id && (
                          <p className="text-xs text-white/50">Server: {order.server_id}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-accent-cyan">
                        {formatCurrency(order.total)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-white/70">
                        {formatDate(order.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
            <p className="text-sm text-white/50">
              Halaman {currentPage} dari {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 text-white/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-white/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-primary rounded-xl border border-white/5 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Detail Transaksi</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-white/50">Invoice</p>
                  <p className="text-sm font-mono text-white">
                    {selectedOrder.invoice_no || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <p className="text-xs text-white/50">Game</p>
                  <p className="text-sm text-white">{selectedOrder.game?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Produk</p>
                  <p className="text-sm text-white">{selectedOrder.product?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">User ID</p>
                  <p className="text-sm text-white">{selectedOrder.user_game_id}</p>
                </div>
                {selectedOrder.server_id && (
                  <div>
                    <p className="text-xs text-white/50">Server ID</p>
                    <p className="text-sm text-white">{selectedOrder.server_id}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-white/50">Total</p>
                  <p className="text-lg font-bold text-accent-cyan">
                    {formatCurrency(selectedOrder.total)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Tanggal</p>
                  <p className="text-sm text-white">{formatDate(selectedOrder.created_at)}</p>
                </div>
              </div>

              {selectedOrder.user && (
                <div className="pt-4 border-t border-white/5">
                  <p className="text-xs text-white/50 mb-2">Customer</p>
                  <p className="text-sm text-white">{selectedOrder.user.name || '-'}</p>
                  <p className="text-xs text-white/50">{selectedOrder.user.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
