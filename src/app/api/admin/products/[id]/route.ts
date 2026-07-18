/**
 * Admin Individual Product API
 *
 * Handles single product operations: GET, UPDATE, DELETE
 * Requires admin authentication for all operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyAdminAuth } from '@/lib/admin-auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Fetch single product
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request)
    if (!auth.success) {
      return NextResponse.json(
        { success: false, message: auth.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const { data, error } = await supabaseAdmin
      .from('game_products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Update product
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request)
    if (!auth.success) {
      return NextResponse.json(
        { success: false, message: auth.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const body = await request.json()
    const { name, price, priceBase, priceDisplay, buyerSkuCode, stock, isActive, sortOrder, isBestSeller } = body

    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (price !== undefined) updateData.price = price
    if (priceBase !== undefined) updateData.price_base = priceBase
    if (priceDisplay !== undefined) updateData.price_display = priceDisplay
    if (buyerSkuCode !== undefined) updateData.buyer_sku_code = buyerSkuCode
    if (stock !== undefined) updateData.stock = stock
    if (isActive !== undefined) updateData.is_active = isActive
    if (sortOrder !== undefined) updateData.sort_order = sortOrder
    if (isBestSeller !== undefined) updateData.is_best_seller = isBestSeller

    const { data, error } = await supabaseAdmin
      .from('game_products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete product
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request)
    if (!auth.success) {
      return NextResponse.json(
        { success: false, message: auth.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const { error } = await supabaseAdmin
      .from('game_products')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Produk berhasil dihapus',
    })
  } catch (error: any) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}
