/**
 * Admin Products API
 *
 * Handles product CRUD operations for admin panel
 * Requires admin authentication for all operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyAdminAuth } from '@/lib/admin-auth'

// GET - Fetch products for a game (requires auth)
export async function GET(request: NextRequest) {
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
    const gameId = searchParams.get('gameId')

    if (!gameId) {
      return NextResponse.json(
        { success: false, message: 'Game ID diperlukan' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('game_products')
      .select('*')
      .eq('game_id', gameId)
      .eq('is_active', true)
      .order('sort_order')
      .order('price')

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || [],
    })
  } catch (error: any) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}

// POST - Create product
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request)
    if (!auth.success) {
      return NextResponse.json(
        { success: false, message: auth.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { gameId, name, price, priceBase, priceDisplay, buyerSkuCode, stock, sortOrder } = body

    if (!gameId || !name || !price) {
      return NextResponse.json(
        { success: false, message: 'Game, nama, dan harga wajib diisi' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('game_products')
      .insert({
        game_id: gameId,
        name,
        price,
        price_base: priceBase || null,
        price_display: priceDisplay || null,
        buyer_sku_code: buyerSkuCode || null,
        stock: stock || 'READY',
        sort_order: sortOrder || 1,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}
