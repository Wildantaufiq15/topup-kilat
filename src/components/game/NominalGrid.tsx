'use client'

import { motion } from 'framer-motion'
import { cn, formatCurrency } from '@/lib/utils'
import { Check, Award } from 'lucide-react'

// Support both mock data format and Supabase format
interface Product {
  id: string
  name?: string
  label?: string
  price: number
  price_display?: number | null
  price_display_raw?: number | null
  original_price?: number
  originalPrice?: number
  discount?: number
  stock?: string
  is_best_seller?: boolean
  isBestSeller?: boolean
}

interface NominalGridProps {
  products: Product[]
  selectedId?: string
  onSelect: (product: Product) => void
  isLoading?: boolean
}

// Diamond SVG component - realistic diamond shape
function DiamondIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Diamond top facets */}
      <path d="M32 4L8 20H56L32 4Z" fill="url(#diamondGradient)" />
      <path d="M32 4L8 20L20 32L32 4Z" fill="url(#diamondGradientLight)" opacity="0.8"/>
      <path d="M32 4L56 20L44 32L32 4Z" fill="url(#diamondGradientDark)" opacity="0.9"/>

      {/* Diamond middle facets */}
      <path d="M8 20L20 32V44L8 20Z" fill="url(#diamondGradientDark2)" />
      <path d="M56 20L44 32V44L56 20Z" fill="url(#diamondGradientDark3)" />
      <path d="M20 32L32 48L44 32L32 20L20 32Z" fill="url(#diamondGradientMid)" />

      {/* Diamond bottom */}
      <path d="M20 32V44L32 60L20 32Z" fill="url(#diamondGradientBottom)" />
      <path d="M44 32V44L32 60L44 32Z" fill="url(#diamondGradientBottom2)" />

      {/* Highlight/reflection */}
      <path d="M24 16L28 12L32 16L28 20L24 16Z" fill="white" opacity="0.6"/>
      <path d="M32 20L36 16L40 20L36 24L32 20Z" fill="white" opacity="0.4"/>

      {/* Gradients */}
      <defs>
        <linearGradient id="diamondGradient" x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E0F7FA"/>
          <stop offset="50%" stopColor="#4DD0E1"/>
          <stop offset="100%" stopColor="#00ACC1"/>
        </linearGradient>
        <linearGradient id="diamondGradientLight" x1="20" y1="12" x2="20" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#80DEEA"/>
        </linearGradient>
        <linearGradient id="diamondGradientDark" x1="44" y1="12" x2="44" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#26C6DA"/>
          <stop offset="100%" stopColor="#0097A7"/>
        </linearGradient>
        <linearGradient id="diamondGradientDark2" x1="14" y1="20" x2="20" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00BCD4"/>
          <stop offset="100%" stopColor="#00838F"/>
        </linearGradient>
        <linearGradient id="diamondGradientDark3" x1="50" y1="20" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00BCD4"/>
          <stop offset="100%" stopColor="#006064"/>
        </linearGradient>
        <linearGradient id="diamondGradientMid" x1="32" y1="20" x2="32" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4DD0E1"/>
          <stop offset="100%" stopColor="#00ACC1"/>
        </linearGradient>
        <linearGradient id="diamondGradientBottom" x1="26" y1="32" x2="26" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00BCD4"/>
          <stop offset="100%" stopColor="#00838F"/>
        </linearGradient>
        <linearGradient id="diamondGradientBottom2" x1="38" y1="32" x2="38" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00ACC1"/>
          <stop offset="100%" stopColor="#006064"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

export function NominalGrid({ products, selectedId, onSelect, isLoading = false }: NominalGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl animate-pulse bg-gradient-to-br from-gray-800 to-gray-900" />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-white/5">
        <div className="w-16 h-16 mx-auto mb-4 opacity-30">
          <DiamondIcon className="w-full h-full" />
        </div>
        <p className="text-white/50">Tidak ada nominal tersedia untuk game ini</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {products.map((product, index) => {
        const isSelected = selectedId === product.id

        // Support price_display (from database) and original_price (mock data)
        const displayPrice = product.price_display || product.price_display_raw
        const originalPrice = displayPrice || product.original_price || product.originalPrice
        const hasDiscount = displayPrice && displayPrice > product.price
        const discountPercent = hasDiscount ? Math.round(((displayPrice! - product.price) / displayPrice!) * 100) : 0
        const isBestValue = hasDiscount && discountPercent >= 20

        // Support both name and label
        const displayName = product.name || product.label || 'Unknown'
        const isBestSeller = product.is_best_seller || product.isBestSeller

        return (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
          >
            <button
              onClick={() => onSelect(product)}
              className={cn(
                'relative w-full rounded-2xl overflow-hidden transition-all duration-300',
                'hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary-500/20',
                'active:scale-[0.98]',
                isSelected
                  ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-500/30'
                  : 'shadow-lg shadow-black/20'
              )}
            >
              {/* Animated Gradient Background */}
              <div className={cn(
                'absolute inset-0 rounded-2xl',
                hasDiscount
                  ? 'bg-gradient-to-br from-pink-600 via-purple-600 to-blue-600 animate-gradient'
                  : isBestSeller
                  ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 animate-gradient'
                  : 'bg-gradient-to-br from-primary-600 via-accent-purple to-accent-cyan animate-gradient'
              )} />

              {/* Background Pattern Overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                  backgroundSize: '24px 24px'
                }} />
              </div>

              {/* Content */}
              <div className="relative p-4 min-h-[140px] flex flex-col">
                {/* Top Row - Badges */}
                <div className="flex items-start justify-between mb-3">
                  {/* Left Badge - Discount */}
                  {hasDiscount && (
                    <div className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-lg">
                      <span className="text-xs font-bold text-white">
                        -{discountPercent}%
                      </span>
                    </div>
                  )}

                  {/* Right Badge - Best Seller */}
                  {isBestSeller && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-lg">
                      <Award size={12} className="text-yellow-300" fill="currentColor" />
                      <span className="text-xs font-bold text-white">Best</span>
                    </div>
                  )}

                  {/* Spacer if no badges */}
                  {!hasDiscount && !isBestSeller && <div />}

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                      <Check size={14} className="text-primary-600" />
                    </div>
                  )}
                </div>

                {/* Middle - Diamond Icon & Product Name */}
                <div className="flex-1 flex flex-col justify-center">
                  {/* Diamond Icon */}
                  <div className="w-10 h-10 mb-2 mx-auto">
                    <DiamondIcon className="w-full h-full drop-shadow-lg" />
                  </div>

                  {/* Product Name */}
                  <div className="text-center mb-2">
                    <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 drop-shadow-md">
                      {displayName}
                    </h3>
                  </div>
                </div>

                {/* Bottom - Price */}
                <div className="text-center mt-auto">
                  {/* Original Price (Strikethrough) */}
                  {hasDiscount && displayPrice && (
                    <p className="text-white/60 text-xs line-through mb-0.5">
                      Rp {displayPrice.toLocaleString('id-ID')}
                    </p>
                  )}

                  {/* Current Price */}
                  <p className={cn(
                    "font-bold text-lg drop-shadow-lg",
                    hasDiscount ? "text-yellow-300" : "text-white"
                  )}>
                    Rp {product.price.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Shine effect on hover */}
              <div className={cn(
                "absolute inset-0 rounded-2xl pointer-events-none",
                "bg-gradient-to-r from-transparent via-white/10 to-transparent",
                "translate-x-[-100%] skew-x-[-20deg]",
                "transition-transform duration-700",
                "group-hover:translate-x-[200%]"
              )} />
            </button>
          </motion.div>
        )
      })}
    </div>
  )
}

// Compact version for mobile - List style
export function NominalList({ products, selectedId, onSelect }: NominalGridProps) {
  return (
    <div className="space-y-3">
      {products.map((product) => {
        const isSelected = selectedId === product.id
        const displayPrice = product.price_display || product.price_display_raw
        const hasDiscount = displayPrice && displayPrice > product.price
        const displayName = product.name || product.label || 'Unknown'
        const isBestSeller = product.is_best_seller || product.isBestSeller

        return (
          <button
            key={product.id}
            onClick={() => onSelect(product)}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300',
              'hover:scale-[1.01] active:scale-[0.99]',
              isSelected
                ? 'bg-gradient-to-r from-primary-600 to-accent-purple shadow-lg shadow-primary-500/20 ring-2 ring-primary-500'
                : 'bg-gradient-to-r from-gray-800/80 to-gray-900/80 hover:from-gray-800 hover:to-gray-900'
            )}
          >
            {/* Diamond Icon */}
            <div className="w-12 h-12 flex-shrink-0">
              <DiamondIcon className="w-full h-full" />
            </div>

            {/* Product Info */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-semibold">{displayName}</h3>
                {isBestSeller && (
                  <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-medium">
                    Best
                  </span>
                )}
              </div>
              {hasDiscount && displayPrice && (
                <p className="text-white/50 text-sm line-through">
                  Rp {displayPrice.toLocaleString('id-ID')}
                </p>
              )}
            </div>

            {/* Price & Selection */}
            <div className="flex items-center gap-3">
              <span className={cn(
                "font-bold text-lg",
                hasDiscount ? "text-yellow-300" : "text-primary-400"
              )}>
                Rp {product.price.toLocaleString('id-ID')}
              </span>
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                  <Check size={14} className="text-primary-600" />
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
