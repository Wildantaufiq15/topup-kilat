/**
 * Digiflazz Product Sync API
 *
 * Imports products from Digiflazz to our database
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface SyncProduct {
  sku_code: string
  product_name: string
  price_base: number
  category?: string
  brand?: string
  stock: string | number
}

interface SyncRequest {
  products: SyncProduct[]
  gameId: string
  margin: number // percentage markup
  updateExisting: boolean
}

export async function POST(request: NextRequest) {
  const requestId = `sync-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  try {
    const body: SyncRequest = await request.json()
    const { products, gameId, margin, updateExisting } = body

    console.log(`[${requestId}] Sync request:`, {
      gameId,
      productCount: products.length,
      margin,
      updateExisting,
    })

    // Validate input
    if (!gameId || !products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Game dan produk harus dipilih' },
        { status: 400 }
      )
    }

    if (margin < 0 || margin > 100) {
      return NextResponse.json(
        { success: false, message: 'Margin harus antara 0-100%' },
        { status: 400 }
      )
    }

    // Verify game exists
    const { data: game, error: gameError } = await supabaseAdmin
      .from('games')
      .select('id, name, slug')
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return NextResponse.json(
        { success: false, message: 'Game tidak ditemukan' },
        { status: 404 }
      )
    }

    console.log(`[${requestId}] Syncing to game: ${game.name}`)

    // Get existing products for this game
    const { data: existingProducts } = await supabaseAdmin
      .from('game_products')
      .select('id, buyer_sku_code')
      .eq('game_id', gameId)

    const existingSkuMap = new Map(
      (existingProducts || []).map((p: any) => [p.buyer_sku_code, p.id])
    )

    // Process products
    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const product of products) {
      try {
        const sellingPrice = Math.round(product.price_base * (1 + margin / 100))
        const skuCode = product.sku_code
        const productName = product.product_name

        // Check if product already exists
        const existingId = existingSkuMap.get(skuCode)

        if (existingId) {
          // Update existing product
          if (updateExisting) {
            const { error: updateError } = await supabaseAdmin
              .from('game_products')
              .update({
                name: productName,
                price: sellingPrice,
                original_price: product.price_base,
                is_active: true,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingId)

            if (updateError) {
              results.errors.push(`Update ${skuCode}: ${updateError.message}`)
            } else {
              results.updated++
            }
          } else {
            results.skipped++
          }
        } else {
          // Create new product
          const { error: insertError } = await supabaseAdmin
            .from('game_products')
            .insert({
              game_id: gameId,
              name: productName,
              price: sellingPrice,
              original_price: product.price_base,
              buyer_sku_code: skuCode,
              stock: product.stock?.toString() || 'READY',
              is_active: true,
            })

          if (insertError) {
            results.errors.push(`Insert ${skuCode}: ${insertError.message}`)
          } else {
            results.created++
          }
        }
      } catch (err: any) {
        results.errors.push(`Error: ${err.message}`)
      }
    }

    console.log(`[${requestId}] Sync complete:`, results)

    return NextResponse.json({
      success: true,
      message: `Sync selesai!`,
      results: {
        created: results.created,
        updated: results.updated,
        skipped: results.skipped,
        errors: results.errors.length > 0 ? results.errors : undefined,
      },
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
