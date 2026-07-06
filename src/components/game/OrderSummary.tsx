'use client'

import Image from 'next/image'
import { formatCurrency } from '@/lib/utils'
import { Gamepad2, Tag, Percent, Trash2 } from 'lucide-react'

interface OrderSummaryProps {
  game: any // from Supabase - snake_case
  product: any // from Supabase - snake_case
  userGameId: string
  serverId?: string
  voucher?: any | null // from Supabase
  onApplyVoucher?: () => void
  onRemoveVoucher?: () => void
}

export function OrderSummary({
  game,
  product,
  userGameId,
  serverId,
  voucher,
  onApplyVoucher,
  onRemoveVoucher,
}: OrderSummaryProps) {
  const subtotal = product.price || 0
  const discount = voucher
    ? voucher.discount_type === 'PERCENTAGE'
      ? Math.min((subtotal * voucher.discount_value) / 100, voucher.max_discount || Infinity)
      : voucher.discount_value
    : 0
  const total = Math.max(0, subtotal - discount)

  return (
    <div className="bg-surface-primary rounded-2xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-dark-100/50">
        <h3 className="font-bold text-white">Ringkasan Pesanan</h3>
      </div>

      {/* Game & Product Info */}
      <div className="p-4 space-y-4">
        {/* Game */}
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src={game.logo || '/placeholder/game.png'}
              alt={game.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h4 className="font-semibold text-white">{game.name}</h4>
            <p className="text-sm text-white/50">{product.name || product.label || '-'}</p>
          </div>
        </div>

        {/* User ID */}
        <div className="bg-dark-100 rounded-xl p-3">
          <div className="flex items-center gap-2 text-sm text-white/50 mb-1">
            <Gamepad2 size={14} />
            <span>ID Player</span>
          </div>
          <p className="font-semibold text-white">
            {userGameId}
            {serverId && <span className="text-white/50"> ({serverId})</span>}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5" />

        {/* Price Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-white/70">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          {voucher && (
            <div className="flex justify-between text-green-400">
              <span className="flex items-center gap-1">
                <Tag size={14} />
                {voucher.code}
              </span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}

          {!voucher && onApplyVoucher && (
            <button
              onClick={onApplyVoucher}
              className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
            >
              <Percent size={14} />
              <span>Gunakan Voucher</span>
            </button>
          )}

          {voucher && onRemoveVoucher && (
            <button
              onClick={onRemoveVoucher}
              className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm transition-colors"
            >
              <Trash2 size={14} />
              <span>Hapus Voucher</span>
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-white/5" />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="font-bold text-white text-lg">Total</span>
          <span className="font-bold text-2xl text-gradient bg-clip-text text-transparent bg-gradient-to-r from-accent-cyan to-primary-400">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  )
}

// Compact version for checkout page
interface OrderSummaryCompactProps {
  game: any
  product: any
  userGameId: string
  serverId?: string
  total: number
}

export function OrderSummaryCompact({ game, product, userGameId, serverId, total }: OrderSummaryCompactProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-dark-100 rounded-xl">
      <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
        <Image
          src={game.logo || '/placeholder/game.png'}
          alt={game.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white text-sm truncate">{product.name || product.label}</p>
        <p className="text-xs text-white/50 truncate">ID: {userGameId}{serverId && ` (${serverId})`}</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-primary-400">{formatCurrency(total)}</p>
      </div>
    </div>
  )
}
