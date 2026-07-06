'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type Order = Database['public']['Tables']['orders']['Row'] & {
  game?: Database['public']['Tables']['games']['Row']
  product?: Database['public']['Tables']['game_products']['Row']
}

export default function RiwayatPage() {
  const { profile } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true)
        const data = await api.getUserOrders()
        setOrders(data as Order[])
      } catch (err) {
        console.error('Error fetching orders:', err)
        setError('Gagal memuat riwayat order')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const getStatusBadge = (status: Order['status']) => {
    const statusConfig: Record<Order['status'], { variant: 'success' | 'warning' | 'error' | 'default' | 'glow'; label: string }> = {
      PENDING: { variant: 'warning', label: 'Menunggu Pembayaran' },
      PAID: { variant: 'primary' as 'default', label: 'Sudah Dibayar' },
      PROCESSING: { variant: 'primary' as 'default', label: 'Diproses' },
      SUCCESS: { variant: 'success', label: 'Berhasil' },
      FAILED: { variant: 'error', label: 'Gagal' },
      EXPIRED: { variant: 'error', label: 'Expired' },
      REFUNDED: { variant: 'default', label: 'DiRefund' },
    }
    return statusConfig[status]
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="container-page py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Riwayat Transaksi</h1>
        <p className="text-white/60">Lihat semua transaksi top up kamu</p>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="transaction" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-surface-primary rounded-2xl border border-white/5 p-8 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-surface-primary rounded-2xl border border-white/5 p-12 text-center">
          <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Belum Ada Transaksi</h2>
          <p className="text-white/60 mb-6">Mulai top up game favoritmu sekarang!</p>
          <a
            href="/games"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium hover:from-primary-500 hover:to-primary-400 transition-all"
          >
            Top Up Sekarang
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusConfig = getStatusBadge(order.status)
            return (
              <div
                key={order.id}
                className="bg-surface-primary rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-600/20 to-accent-purple/20 flex items-center justify-center">
                      <Package className="w-7 h-7 text-primary-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{order.game?.name || 'Game'}</p>
                      <p className="text-white/60 text-sm">{order.product?.name || 'Product'}</p>
                      <p className="text-white/40 text-xs mt-1">Invoice: {order.invoice_no}</p>
                    </div>
                  </div>

                  {/* Status & Price */}
                  <div className="flex items-center gap-4 md:flex-col md:items-end">
                    <Badge variant={statusConfig.variant}>
                      {statusConfig.label}
                    </Badge>
                    <p className="text-xl font-bold text-white">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                </div>

                {/* Order Details */}
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 text-white/50">
                    <Clock size={14} />
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/50">
                    <span>ID Game: {order.user_game_id}</span>
                  </div>
                  {order.server_id && (
                    <div className="flex items-center gap-2 text-white/50">
                      <span>Server: {order.server_id}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
