/**
 * Order Creation API - Server-side
 *
 * SECURITY: This endpoint handles ALL order creation server-side.
 *
 * IMPORTANT:
 * 1. All price calculations are done server-side from database
 * 2. Client only sends identifiers (gameSlug, productId, etc.)
 * 3. No client-side price or discount values are trusted
 * 4. Voucher validation is done against actual database records
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface CreateOrderRequest {
  gameSlug: string
  productId: string
  userGameId: string
  serverId?: string
  voucherCode?: string
}

// Voucher validation result
interface ValidatedVoucher {
  id: string
  code: string
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  maxDiscount: number | null
  minTransaction: number | null
}

/**
 * Calculate discount based on voucher rules
 */
function calculateDiscount(
  subtotal: number,
  voucher: ValidatedVoucher
): number {
  let discount = 0

  if (voucher.discountType === 'PERCENTAGE') {
    discount = Math.floor((subtotal * voucher.discountValue) / 100)
    // Apply max discount cap if exists
    if (voucher.maxDiscount) {
      discount = Math.min(discount, voucher.maxDiscount)
    }
  } else {
    // FIXED discount
    discount = voucher.discountValue
  }

  // Discount cannot exceed subtotal
  return Math.min(discount, subtotal)
}

/**
 * Validate voucher from database
 */
async function validateVoucher(
  voucherCode: string,
  subtotal: number
): Promise<ValidatedVoucher | null> {
  // Fetch voucher from database
  const { data: voucher, error } = await supabase
    .from('vouchers')
    .select('*')
    .eq('code', voucherCode.toUpperCase())
    .single()

  if (error || !voucher) {
    return null
  }

  const now = new Date()

  // Check if voucher is active
  if (!voucher.is_active) {
    console.warn(`Voucher ${voucherCode} is not active`)
    return null
  }

  // Check starts_at
  if (voucher.starts_at && new Date(voucher.starts_at) > now) {
    console.warn(`Voucher ${voucherCode} has not started yet`)
    return null
  }

  // Check expires_at
  if (voucher.expires_at && new Date(voucher.expires_at) <= now) {
    console.warn(`Voucher ${voucherCode} has expired`)
    return null
  }

  // Check usage_limit
  if (voucher.usage_limit !== null && voucher.usage_limit > 0) {
    if (voucher.used_quota >= voucher.usage_limit) {
      console.warn(`Voucher ${voucherCode} has reached usage limit`)
      return null
    }
  }

  // Check min_transaction
  if (voucher.min_transaction && subtotal < voucher.min_transaction) {
    console.warn(`Voucher ${voucherCode} requires minimum transaction of ${voucher.min_transaction}`)
    return null
  }

  return {
    id: voucher.id,
    code: voucher.code,
    discountType: voucher.discount_type,
    discountValue: voucher.discount_value,
    maxDiscount: voucher.max_discount,
    minTransaction: voucher.min_transaction,
  }
}

export async function POST(request: NextRequest) {
  const requestId = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  try {
    const body: CreateOrderRequest = await request.json()
    const { gameSlug, productId, userGameId, serverId, voucherCode } = body

    console.log(`[${requestId}] Order creation request:`, {
      gameSlug,
      productId,
      userGameId,
      hasVoucher: !!voucherCode,
    })

    // =====================================================
    // STEP 1: Validate required fields
    // =====================================================
    if (!gameSlug || !productId || !userGameId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: gameSlug, productId, userGameId' },
        { status: 400 }
      )
    }

    // =====================================================
    // STEP 2: Fetch game from database
    // =====================================================
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id, name, slug')
      .eq('slug', gameSlug)
      .maybeSingle()

    if (gameError || !game) {
      console.error(`[${requestId}] Game not found:`, gameSlug)
      return NextResponse.json(
        { success: false, message: 'Game not found' },
        { status: 404 }
      )
    }

    // =====================================================
    // STEP 3: Fetch product from database (SERVER-SIDE)
    // =====================================================
    const { data: product, error: productError } = await supabase
      .from('game_products')
      .select('id, name, price, game_id')
      .eq('id', productId)
      .eq('game_id', game.id)
      .eq('is_active', true)
      .maybeSingle()

    if (productError || !product) {
      console.error(`[${requestId}] Product not found:`, productId)
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    // =====================================================
    // STEP 4: Get user session (if logged in)
    // =====================================================
    let userId: string | null = null
    const authHeader = request.headers.get('authorization')

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)

      if (!authError && user) {
        userId = user.id
        console.log(`[${requestId}] Authenticated user: ${userId}`)
      }
    }

    // =====================================================
    // STEP 5: Calculate prices SERVER-SIDE
    // =====================================================
    const subtotal = product.price
    let voucherId: string | null = null
    let voucherCodeDb: string | null = null
    let voucherDiscount = 0

    // Validate and apply voucher if provided
    if (voucherCode) {
      const validatedVoucher = await validateVoucher(voucherCode, subtotal)

      if (validatedVoucher) {
        voucherId = validatedVoucher.id
        voucherCodeDb = validatedVoucher.code
        voucherDiscount = calculateDiscount(subtotal, validatedVoucher)

        console.log(`[${requestId}] Voucher applied:`, {
          code: voucherCodeDb,
          discountType: validatedVoucher.discountType,
          discountValue: validatedVoucher.discountValue,
          discount: voucherDiscount,
        })
      } else {
        console.warn(`[${requestId}] Invalid voucher: ${voucherCode}`)
        // Don't fail the order, just don't apply the voucher
        // The client will see the order total without discount
      }
    }

    const total = Math.max(0, subtotal - voucherDiscount)

    console.log(`[${requestId}] Price calculation:`, {
      subtotal,
      voucherDiscount,
      total,
    })

    // =====================================================
    // STEP 6: Generate invoice number
    // =====================================================
    const invoiceNo = `TK${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    // =====================================================
    // STEP 7: Create order in database
    // =====================================================
    const orderId = crypto.randomUUID()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        user_id: userId,
        game_id: game.id,
        product_id: product.id,
        invoice_no: invoiceNo,
        user_game_id: userGameId,
        server_id: serverId || null,
        voucher_id: voucherId,
        voucher_code: voucherCodeDb,
        voucher_discount: voucherDiscount,
        subtotal: subtotal,
        total: total,
        status: 'PENDING',
      })
      .select()
      .single()

    if (orderError) {
      console.error(`[${requestId}] Order creation error:`, orderError)
      return NextResponse.json(
        { success: false, message: `Failed to create order: ${orderError.message}` },
        { status: 500 }
      )
    }

    // =====================================================
    // STEP 8: Increment voucher usage if applied
    // =====================================================
    if (voucherId) {
      const { error: updateError } = await supabase.rpc('increment_voucher_usage', {
        voucher_id: voucherId,
      })

      if (updateError) {
        console.error(`[${requestId}] Failed to increment voucher usage:`, updateError)
        // Don't fail the order, just log the error
      }
    }

    console.log(`[${requestId}] Order created successfully:`, {
      orderId: order.id,
      invoiceNo: order.invoice_no,
      total: order.total,
    })

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        invoiceNo: order.invoice_no,
        subtotal: order.subtotal,
        voucherDiscount: order.voucher_discount,
        total: order.total,
        voucherApplied: !!voucherId,
        voucherCode: voucherCodeDb,
      },
    })
  } catch (error: any) {
    console.error(`[${requestId}] Order creation error:`, error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}
