/**
 * Digiflazz Price List API
 *
 * Fetches product catalog from Digiflazz for admin syncing
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkBalance, getPriceList } from '@/lib/digiflazz'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const requestId = `digiflazz-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  try {
    const searchParams = request.nextUrl.searchParams
    const gameSlug = searchParams.get('game')
    const category = searchParams.get('category')

    console.log(`[${requestId}] Fetching Digiflazz price list`, { gameSlug, category })

    // Get balance first
    let balance = 0
    try {
      const balanceData = await checkBalance()
      balance = balanceData.deposit
      console.log(`[${requestId}] Digiflazz balance: Rp ${balance.toLocaleString('id-ID')}`)
    } catch (balanceError) {
      console.warn(`[${requestId}] Could not fetch balance:`, balanceError)
    }

    // Fetch price list from Digiflazz (fetch all, don't filter by game ID)
    let products: any[] = []
    try {
      products = await getPriceList()

      // Handle different response formats
      if (Array.isArray(products)) {
        // Already an array
      } else if (products && typeof products === 'object') {
        // Might be wrapped in { data: [...] }
        const productsObj = products as any
        if (Array.isArray(productsObj.data)) {
          products = productsObj.data
        }
      }

      if (!Array.isArray(products)) {
        throw new Error('Invalid response format from Digiflazz')
      }

      console.log(`[${requestId}] Fetched ${products.length} products from Digiflazz`)
    } catch (apiError: any) {
      console.error(`[${requestId}] Digiflazz API Error:`, apiError.message)
      return NextResponse.json(
        {
          success: false,
          message: `Gagal mengambil produk dari Digiflazz: ${apiError.message}`,
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
      },
      { status: 500 }
    )
  }
}
