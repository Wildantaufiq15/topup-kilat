'use client'

import { motion } from 'framer-motion'
import { cn, formatCurrency } from '@/lib/utils'
import { Check, Zap, Sparkles } from 'lucide-react'

// Support both mock data format and Supabase format
interface Product {
  id: string
  name?: string
  label?: string
  price: number
  original_price?: number
  originalPrice?: number
  discount?: number
  stock?: string
}

interface NominalGridProps {
  products: Product[]
  selectedId?: string
  onSelect: (product: Product) => void
  isLoading?: boolean
}

export function NominalGrid({ products, selectedId, onSelect, isLoading = false }: NominalGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-dark-100 rounded-xl p-4 animate-pulse">
            <div className="h-5 w-3/4 bg-dark-200 rounded mb-2" />
            <div className="h-4 w-1/2 bg-dark-200 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8 bg-surface-primary rounded-xl border border-white/5">
        <p className="text-white/50">Tidak ada nominal tersedia untuk game ini</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {products.map((product, index) => {
        const isSelected = selectedId === product.id
        const originalPrice = product.original_price || product.originalPrice
        const hasDiscount = originalPrice && originalPrice > product.price
        const discountPercent = hasDiscount ? Math.round(((originalPrice - product.price) / originalPrice) * 100) : 0
        const isBestValue = discountPercent >= 20

        // Support both name and label
        const displayName = product.name || product.label || 'Unknown'

        return (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <button
              onClick={() => onSelect(product)}
              className={cn(
                'relative w-full p-4 rounded-xl border-2 text-left transition-all duration-300',
                'hover:scale-[1.02] active:scale-[0.98]',
                isSelected
                  ? 'bg-primary-500/10 border-primary-500 shadow-glow-primary'
                  : 'bg-dark-100 border-white/5 hover:border-white/20 hover:bg-dark-100/80'
              )}
            >
              {/* Best Value Badge */}
              {isBestValue && (
                <div className="absolute -top-2 -right-2">
                  <span className="flex items-center gap-1 px-2 py-1 text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-400 text-white rounded-full shadow-lg">
                    <Sparkles size={10} />
                    Best Value
                  </span>
                </div>
              )}

              {/* Discount Badge */}
              {hasDiscount && !isBestValue && (
                <div className="absolute -top-2 -right-2">
                  <span className="px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full">
                    -{discountPercent}%
                  </span>
                </div>
              )}

              {/* Product Label */}
              <div className="flex items-start justify-between mb-2">
                <span className="font-bold text-white text-lg leading-tight">
                  {displayName}
                </span>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="space-y-1">
                <span className="font-bold text-primary-400 text-lg">
                  {formatCurrency(product.price)}
                </span>
                {hasDiscount && originalPrice && (
                  <span className="block text-sm text-white/40 line-through">
                    {formatCurrency(originalPrice)}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              {product.stock === 'limited' && (
                <div className="mt-2 flex items-center gap-1 text-xs text-yellow-400">
                  <Zap size={12} />
                  <span>Stok Terbatas</span>
                </div>
              )}
            </button>
          </motion.div>
        )
      })}
    </div>
  )
}

// Compact version for mobile
export function NominalList({ products, selectedId, onSelect }: NominalGridProps) {
  return (
    <div className="space-y-2">
      {products.map((product) => {
        const isSelected = selectedId === product.id
        const originalPrice = product.original_price || product.originalPrice
        const hasDiscount = originalPrice && originalPrice > product.price
        const displayName = product.name || product.label || 'Unknown'

        return (
          <button
            key={product.id}
            onClick={() => onSelect(product)}
            className={cn(
              'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300',
              isSelected
                ? 'bg-primary-500/10 border-primary-500'
                : 'bg-dark-100 border-white/5 hover:border-white/20'
            )}
          >
            <div className="flex items-center gap-3">
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}
              <span className="font-semibold text-white">{displayName}</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-primary-400">
                {formatCurrency(product.price)}
              </span>
              {hasDiscount && (
                <span className="block text-xs text-white/40 line-through">
                  {formatCurrency(originalPrice || 0)}
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
