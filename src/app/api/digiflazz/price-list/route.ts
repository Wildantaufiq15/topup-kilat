/**
 * Digiflazz Price List API (Public)
 *
 * Get available products from Digiflazz
 * This is a PUBLIC endpoint - no authentication required
 * Used for displaying products on the website
 *
 * GET: Fetch price list with optional filters
 * Query params:
 *   - category: Filter by category (e.g., "Games")
 *   - brand: Filter by brand (e.g., "Mobile Legends")
 *   - code: Search by SKU code or product name
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPriceList } from '@/lib/digiflazz'
import { apiRateLimiter, getClientIP } from '@/lib/ratelimit'

// Game slug to Digiflazz brand mapping
const GAME_BRAND_MAP: Record<string, string> = {
  'mobile-legends': 'Mobile Legends',
  'free-fire': 'Free Fire',
  'free-fire-max': 'Free Fire',
  'genshin-impact': 'Genshin Impact',
  'pubg-mobile': 'PUBG Mobile',
  'cod-mobile': 'Call of Duty Mobile',
  'valorant': 'Valorant',
  'higgs-domino': 'Higgs Domino',
  'minecraft': 'Minecraft',
  'honor-of-kings': 'Honor of Kings',
  'wild-rift': 'Wild Rift',
  'honkai-star-rail': 'Honkai: Star Rail',
  'apex-legends': 'Apex Legends',
  'tower-of-fantasy': 'Tower of Fantasy',
  'point-blank': 'Point Blank',
  'lord-of-aria': 'Lord of Aria',
  'stumble-guys': 'Stumble Guys',
  'aov': 'Arena of Valor',
  'lost-ark': 'Lost Ark',
  'sausage-man': 'Sausage Man',
  'lifeafter': 'LifeAfter',
  'ragnarok': 'Ragnarok M',
}

export async function GET(request: NextRequest) {
  const requestId = `pl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  // Rate limiting check
  if (apiRateLimiter) {
    const clientIP = getClientIP(request)
    const { success, remaining, limit } = await apiRateLimiter.limit(clientIP)

    if (!success) {
      console.log(`[${requestId}] Rate limit exceeded for IP:`, clientIP)
      return NextResponse.json(
        {
          success: false,
          message: 'Terlalu banyak request. Silakan tunggu beberapa menit.',
          error: 'RATE_LIMIT',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'Retry-After': '60',
          },
        }
      )
    }
  }

  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const brand = searchParams.get('brand')
    const code = searchParams.get('code')
    const gameSlug = searchParams.get('game') // Support both 'game' and 'brand' params

    console.log(`[${requestId}] Price list request:`, { category, brand, code, gameSlug })

    // Build filter params for Digiflazz API
    const filterParams: { brand?: string; category?: string; code?: string } = {}

    // Support both 'brand' and 'game' params
    const brandFilter = brand || gameSlug
    if (brandFilter) {
      // Check if it's a game slug and map to brand name
      filterParams.brand = GAME_BRAND_MAP[brandFilter.toLowerCase()] || brandFilter
    }
    if (category) {
      filterParams.category = category
    }
    if (code) {
      filterParams.code = code
    }

    // Fetch from Digiflazz API
    let products = await getPriceList(Object.keys(filterParams).length > 0 ? filterParams : undefined)

    console.log(`[${requestId}] Got ${products.length} products from Digiflazz`)

    // If no filter, optionally limit results for performance
    if (!brandFilter && !category && !code && products.length > 100) {
      // Only return first 100 products if no specific filter
      products = products.slice(0, 100)
      console.log(`[${requestId}] Limited to 100 products (no filter applied)`)
    }

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
      filters: { category, brand: brandFilter, code },
      source: 'digiflazz',
    })
  } catch (error: any) {
    console.error(`[${requestId}] Error:`, error)

    // Check for specific error types
    const isRateLimit = error.message?.includes('rate limit') || error.message?.includes('limitasi')
    const isApiError = error.message?.includes('Digiflazz')

    return NextResponse.json(
      {
        success: false,
        message: isRateLimit
          ? 'Terlalu banyak request. Silakan tunggu beberapa menit dan coba lagi.'
          : isApiError
            ? 'Layanan Digiflazz sedang tidak tersedia. Silakan coba lagi nanti.'
            : 'Gagal mengambil daftar harga',
        error: isRateLimit ? 'RATE_LIMIT' : isApiError ? 'DIGIFLAZZ_ERROR' : 'INTERNAL_ERROR',
      },
      { status: isRateLimit ? 429 : 500 }
    )
  }
}
