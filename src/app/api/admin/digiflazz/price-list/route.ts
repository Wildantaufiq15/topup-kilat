/**
 * Digiflazz Price List API
 *
 * Fetches product catalog from Digiflazz for admin syncing
 * Supports caching and game filtering
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkBalance, getPriceList } from '@/lib/digiflazz'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyAdminAuth } from '@/lib/admin-auth'

// Game to Digiflazz brand/category mapping
const GAME_BRAND_MAP: Record<string, string> = {
  'mobile-legends': 'Mobile Legends',
  'free-fire': 'Free Fire',
  'genshin-impact': 'Genshin Impact',
  'pubg-mobile': 'PUBG Mobile',
  'cod-mobile': 'Call of Duty Mobile',
  'higgs-domino': 'Higgs Domino',
  'minecraft': 'Minecraft',
  'Valorant': 'Valorant',
  'point-blank': 'Point Blank',
  'lord-of-aria': 'Lord of Aria',
  'stumble-guys': 'Stumble Guys',
  'aov': 'Arena of Valor',
  'lost-ark': 'Lost Ark',
  'honkai-star-rail': 'Honkai: Star Rail',
  'zen-cliffe': 'Zen/Cliff Ceria',
  'sausage-man': 'Sausage Man',
  'lifeafter': 'LifeAfter',
  'ragnarok': 'Ragnarok M',
  'super-embox': 'Super Embux',
}

export async function GET(request: NextRequest) {
  const requestId = `digiflazz-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request)
    if (!auth.success) {
      return NextResponse.json(
        { success: false, message: auth.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const gameSlug = searchParams.get('game') || ''
    const useCache = searchParams.get('cache') !== 'false' // Default true

    console.log(`[${requestId}] Fetching Digiflazz price list`, { gameSlug, useCache })

    // Get balance first
    let balance = 0
    try {
      const balanceData = await checkBalance()
      balance = balanceData.deposit
      console.log(`[${requestId}] Digiflazz balance: Rp ${balance.toLocaleString('id-ID')}`)
    } catch (balanceError: any) {
      console.warn(`[${requestId}] Could not fetch balance:`, balanceError.message)
      // Continue without balance - not critical
    }

    // Determine filter based on game
    const filterParams: { brand?: string } = {}
    if (gameSlug && GAME_BRAND_MAP[gameSlug]) {
      filterParams.brand = GAME_BRAND_MAP[gameSlug]
      console.log(`[${requestId}] Filtering by brand: ${filterParams.brand}`)
    }

    // Fetch price list from Digiflazz (uses cache automatically)
    let products: any[] = []
    try {
      products = await getPriceList(filterParams)
      console.log(`[${requestId}] Fetched ${products.length} products from Digiflazz`)
    } catch (apiError: any) {
      console.error(`[${requestId}] Digiflazz API Error:`, apiError.message)

      // Check if it's a rate limit error
      const isRateLimit = apiError.message?.includes('limitasi') || apiError.message?.includes('rate limit')

      return NextResponse.json(
        {
          success: false,
          message: isRateLimit
            ? 'Terlalu banyak request. Silakan tunggu beberapa menit dan coba lagi.'
            : (apiError.message || 'Gagal mengambil produk dari Digiflazz'),
          error: isRateLimit ? 'RATE_LIMIT' : 'DIGIFLAZZ_API_ERROR',
          retryAfter: isRateLimit ? 300 : undefined, // 5 minutes
        },
        { status: isRateLimit ? 429 : 500 }
      )
    }

    // Ensure products is always an array
    if (!Array.isArray(products)) {
      console.error(`[${requestId}] Products is not an array:`, typeof products)
      return NextResponse.json(
        {
          success: false,
          message: 'Format data dari Digiflazz tidak valid',
          error: 'INVALID_RESPONSE_FORMAT',
        },
        { status: 500 }
      )
    }

    // Get existing SKU codes from our database
    const { data: existingProducts } = await supabaseAdmin
      .from('game_products')
      .select('id, name, buyer_sku_code, price')
      .not('buyer_sku_code', 'is', null)

    const existingSkuMap = new Map(
      (existingProducts || []).map((p: any) => [p.buyer_sku_code, p])
    )

    // Map products with existing status
    const mappedProducts = products.map((product: any) => {
      const existing = existingSkuMap.get(product.buyer_sku_code)
      return {
        sku_code: product.buyer_sku_code,
        product_name: product.product_name,
        category: product.category,
        brand: product.brand,
        price_base: product.price,
        stock: product.stock,
        status: product.status,
        uniq: product.uniq,
        // Existing data
        existing: existing ? {
          id: existing.id,
          name: existing.name,
          price: existing.price,
          synced: true,
        } : null,
      }
    })

    return NextResponse.json({
      success: true,
      balance,
      products: mappedProducts,
      total: products.length,
    })
  } catch (error: any) {
    console.error(`[${requestId}] Error:`, error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal server error',
        error: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
