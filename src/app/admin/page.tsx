'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Users,
  Package,
  RefreshCw,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface Stats {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  todayOrders: number
  todayRevenue: number
  successRate: number
  recentOrders: any[]
  topProducts: any[]
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    todayOrders: 0,
    todayRevenue: 0,
    successRate: 0,
    recentOrders: [],
    topProducts: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setIsLoading(true)
    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0]

      // Fetch all orders with related data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          game:games(name),
          product:game_products(name, price)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (ordersError) throw ordersError

      // Calculate stats
      const totalOrders = orders?.length || 0
      const totalRevenue = orders
        ?.filter(o => o.status === 'PAID' || o.status === 'SUCCESS')
        .reduce((sum, o) => sum + (o.total || 0), 0) || 0

      const pendingOrders = orders?.filter(o => o.status === 'PENDING').length || 0

      const todayOrdersList = orders?.filter(o => o.created_at?.startsWith(today)) || []
      const todayOrders = todayOrdersList.length
      const todayRevenue = todayOrdersList
        .filter(o => o.status === 'PAID' || o.status === 'SUCCESS')
        .reduce((sum, o) => sum + (o.total || 0), 0)

      const successOrders = orders?.filter(o => o.status === 'PAID' || o.status === 'SUCCESS').length || 0
      const successRate = totalOrders > 0 ? (successOrders / totalOrders) * 100 : 0

      // Get top products
      const productCounts: Record<string, any> = {}
      orders?.forEach(order => {
        const productName = order.product?.name || 'Unknown'
        if (!productCounts[productName]) {
          productCounts[productName] = {
            name: productName,
            game: order.game?.name || 'Unknown',
            count: 0,
            revenue: 0,
          }
        }
        productCounts[productName].count++
        if (order.status === 'PAID' || order.status === 'SUCCESS') {
          productCounts[productName].revenue += order.total || 0
        }
      })
      const topProducts = Object.values(productCounts)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5)

      setStats({
        totalOrders,
        totalRevenue,
        pendingOrders,
        todayOrders,
        todayRevenue,
        successRate,
        recentOrders: orders?.slice(0, 10) || [],
        topProducts,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Pesanan',
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      color: 'from-blue-500 to-blue-600',
      trend: null,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: Wallet,
      color: 'from-green-500 to-green-600',
      trend: null,
    },
    {
      title: 'Pesanan Hari Ini',
      value: stats.todayOrders.toString(),
      icon: Package,
      color: 'from-purple-500 to-purple-600',
      trend: stats.todayRevenue > 0 ? `+${formatCurrency(stats.todayRevenue)}` : null,
    },
    {
      title: 'Pending',
      value: stats.pendingOrders.toString(),
      icon: Clock,
      color: 'from-yellow-500 to-yellow-600',
      trend: null,
    },
  ]

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      PAID: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      PROCESSING: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      SUCCESS: 'bg-green-500/20 text-green-400 border-green-500/30',
      FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
      EXPIRED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    }
    return styles[status] || styles.PENDING
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-white/60 text-sm mt-1">
            Ringkasan performa toko hari ini
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-surface-primary border border-white/10 rounded-lg text-white/70 hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className="bg-surface-primary rounded-xl border border-white/5 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/60 text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {isLoading ? '-' : stat.value}
                  </p>
                  {stat.trend && (
                    <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                      <TrendingUp size={12} />
                      {stat.trend}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <Icon size={20} className="text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-surface-primary rounded-xl border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Pesanan Terbaru</h2>
              <a
                href="/admin/transactions"
                className="text-primary-400 text-sm hover:text-primary-300"
              >
                Lihat semua
              </a>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Game</th>
                  <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Total</th>
                  <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-white/50">
                      Memuat...
                    </td>
                  </tr>
                ) : stats.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-white/50">
                      Belum ada pesanan
                    </td>
                  </tr>
                ) : (
                  stats.recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-white/5 hover:bg-white/5">
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
                        <span className="text-sm font-medium text-accent-cyan">
                          {formatCurrency(order.total)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-surface-primary rounded-xl border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h2 className="text-lg font-bold text-white">Produk Terlaris</h2>
          </div>

          <div className="p-4">
            {isLoading ? (
              <div className="text-center py-8 text-white/50">Memuat...</div>
            ) : stats.topProducts.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                Belum ada data produk
              </div>
            ) : (
              <div className="space-y-4">
                {stats.topProducts.map((product: any, index: number) => (
                  <div
                    key={product.name}
                    className="flex items-center gap-4 p-3 bg-dark-100/50 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-accent-purple flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{product.name}</p>
                      <p className="text-xs text-white/50">{product.game}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">{product.count} orders</p>
                      <p className="text-xs text-green-400">
                        {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <a
          href="/admin/transactions"
          className="p-4 bg-surface-primary rounded-xl border border-white/5 hover:border-white/10 transition-all group"
        >
          <ShoppingCart className="w-8 h-8 text-primary-400 mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-white font-medium">Kelola Transaksi</p>
          <p className="text-white/50 text-sm">Lihat & proses pesanan</p>
        </a>
        <a
          href="/admin/products"
          className="p-4 bg-surface-primary rounded-xl border border-white/5 hover:border-white/10 transition-all group"
        >
          <Package className="w-8 h-8 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-white font-medium">Kelola Produk</p>
          <p className="text-white/50 text-sm">Tambah & edit game</p>
        </a>
        <a
          href="/admin/vouchers"
          className="p-4 bg-surface-primary rounded-xl border border-white/5 hover:border-white/10 transition-all group"
        >
          <DollarSign className="w-8 h-8 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-white font-medium">Kelola Voucher</p>
          <p className="text-white/50 text-sm">Buat promo & diskon</p>
        </a>
        <a
          href="/admin/users"
          className="p-4 bg-surface-primary rounded-xl border border-white/5 hover:border-white/10 transition-all group"
        >
          <Users className="w-8 h-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-white font-medium">Kelola Users</p>
          <p className="text-white/50 text-sm">Lihat data pengguna</p>
        </a>
      </div>
    </div>
  )
}
