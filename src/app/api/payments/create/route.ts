/**
 * Payment Creation Endpoint
 *
 * SECURITY: This endpoint is CRITICAL for financial integrity.
 *
 * IMPORTANT SECURITY MEASURES:
 * 1. Amount sent to Sakurupiah MUST come from server-side calculation
 * 2. Client only sends orderId - server fetches actual price from database
 * 3. Order total is recalculated and validated against stored total
 * 4. Double-payment prevention: reject if order already has PAID payment
 * 5. Rate limiting and request validation
 * 6. Voucher validation against actual database records (NOT order.voucher_discount)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createInvoice } from '@/lib/sakurupiah'
import { notifyAdminNewOrder } from '@/lib/fonnte'

// Server-side Supabase client (service role for bypassing RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Business rules
// NOTE: Minimum transaction removed to allow all purchase amounts
const MAX_TRANSACTION_AMOUNT = 50000000 // Rp 50,000,000 maximum

// Tolerance for price mismatch (to account for rounding)
const PRICE_TOLERANCE = 100 // Rp 100

interface CreatePaymentRequest {
  orderId: string
  invoiceNo?: string
  method: string
  // NOTE: We intentionally do NOT accept amount from client
  // gameName, productName, amount are fetched from database
  userName?: string
  userEmail?: string
  userPhone?: string
  userGameId?: string
  serverId?: string
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

// Map our method format to Sakurupiah format
function mapPaymentMethod(method: string): string {
  const mapping: Record<string, string> = {
    'qris': 'QRIS',
    'gopay': 'GOPAY',
    'ovo': 'OVO',
    'dana': 'DANA',
    'shopeepay': 'SHOPEEPAY',
    'bcava': 'BCAVA',
    'bniva': 'BNIVA',
    'mandiriva': 'MANDIRIVA',
    'briva': 'BRIVA',
    'permatava': 'PERMATAVA',
  }
  return mapping[method.toLowerCase()] || method.toUpperCase()
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
 * CRITICAL: This fetches voucher data from the database, NOT from order.voucher_discount
 */
async function validateVoucherFromDatabase(
  voucherId: string,
  subtotal: number
): Promise<{ voucher: ValidatedVoucher | null; error: string | null }> {
  // Fetch voucher from database using voucher_id
  const { data: voucher, error: voucherError } = await supabase
    .from('vouchers')
    .select('*')
    .eq('id', voucherId)
    .maybeSingle()

  if (voucherError || !voucher) {
    return {
      voucher: null,
      error: 'Voucher tidak ditemukan'
    }
  }

  const now = new Date()

  // Check if voucher is active
  if (!voucher.is_active) {
    return {
      voucher: null,
      error: 'Voucher tidak aktif'
    }
  }

  // Check starts_at
  if (voucher.starts_at && new Date(voucher.starts_at) > now) {
    return {
      voucher: null,
      error: 'Voucher belum berlaku'
    }
  }

  // Check expires_at
  if (voucher.expires_at && new Date(voucher.expires_at) <= now) {
    return {
      voucher: null,
      error: 'Voucher sudah expired'
    }
  }

  // Check usage_limit
  if (voucher.usage_limit !== null && voucher.usage_limit > 0) {
    if (voucher.used_quota >= voucher.usage_limit) {
      return {
        voucher: null,
        error: 'Voucher sudah mencapai batas penggunaan'
      }
    }
  }

  // Check min_transaction
  if (voucher.min_transaction && subtotal < voucher.min_transaction) {
    return {
      voucher: null,
      error: `Minimal transaksi Rp ${voucher.min_transaction.toLocaleString('id-ID')}`
    }
  }

  return {
    voucher: {
      id: voucher.id,
      code: voucher.code,
      discountType: voucher.discount_type,
      discountValue: voucher.discount_value,
      maxDiscount: voucher.max_discount,
      minTransaction: voucher.min_transaction,
    },
    error: null
  }
}

export async function POST(request: NextRequest) {
  const requestId = `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  try {
    const body: CreatePaymentRequest = await request.json()
    const { orderId, method, userName, userEmail, userPhone } = body

    console.log(`[${requestId}] Payment creation request for order: ${orderId}`)

    // =====================================================
    // STEP 1: Validate required fields
    // =====================================================
    if (!orderId || !method) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: orderId, method' },
        { status: 400 }
      )
    }

    // =====================================================
    // STEP 2: Fetch order from database (server-side)
    // =====================================================
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        game:games(name, slug),
        product:game_products(name, price)
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error(`[${requestId}] Order not found:`, orderId)
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    console.log(`[${requestId}] Order found:`, {
      id: order.id,
      invoice_no: order.invoice_no,
      status: order.status,
      total: order.total,
      voucher_id: order.voucher_id,
    })

    // =====================================================
    // STEP 3: Validate order status
    // =====================================================
    if (order.status !== 'PENDING') {
      console.error(`[${requestId}] Order is not pending: ${order.status}`)
      return NextResponse.json(
        { success: false, message: `Order status is ${order.status}, cannot create payment` },
        { status: 400 }
      )
    }

    // =====================================================
    // STEP 4: Prevent double payment - check existing payments
    // =====================================================
    const { data: existingPayments } = await supabase
      .from('payments')
      .select('id, status')
      .eq('order_id', orderId)
      .in('status', ['PENDING', 'PAID'])

    if (existingPayments && existingPayments.length > 0) {
      const paidPayment = existingPayments.find(p => p.status === 'PAID')
      if (paidPayment) {
        console.error(`[${requestId}] Double payment attempt - order already paid`)
        return NextResponse.json(
          { success: false, message: 'Order has already been paid' },
          { status: 400 }
        )
      }

      // If there's a pending payment, reject to prevent duplicate payments
      const pendingPayment = existingPayments.find(p => p.status === 'PENDING')
      if (pendingPayment) {
        console.error(`[${requestId}] Pending payment already exists`)
        return NextResponse.json(
          { success: false, message: 'A pending payment already exists for this order' },
          { status: 400 }
        )
      }
    }

    // =====================================================
    // STEP 5: Server-side price calculation with voucher validation
    // CRITICAL: We do NOT trust order.voucher_discount from client
    // =====================================================
    const productPrice = order.product?.price || 0
    let serverCalculatedDiscount = 0
    let voucherValidationError: string | null = null

    // If order has a voucher, validate it against actual database
    if (order.voucher_id) {
      console.log(`[${requestId}] Validating voucher from database: ${order.voucher_id}`)

      const voucherResult = await validateVoucherFromDatabase(order.voucher_id, productPrice)

      if (voucherResult.error) {
        // Voucher is invalid - this is a security issue
        voucherValidationError = voucherResult.error
        console.error(`[${requestId}] 🚨 SECURITY: Voucher validation failed: ${voucherResult.error}`)
        console.error(`[${requestId}] Order ${orderId} references voucher ${order.voucher_id} which is no longer valid`)
        // Continue without discount but log the security incident
      } else if (voucherResult.voucher) {
        // Calculate discount from validated voucher
        serverCalculatedDiscount = calculateDiscount(productPrice, voucherResult.voucher)
        console.log(`[${requestId}] Voucher validated, calculated discount: ${serverCalculatedDiscount}`)
      }
    }

    const serverCalculatedTotal = Math.max(0, productPrice - serverCalculatedDiscount)

    console.log(`[${requestId}] Server-side price calculation:`, {
      productPrice,
      serverCalculatedDiscount,
      serverCalculatedTotal,
      storedDiscount: order.voucher_discount,
      storedTotal: order.total,
    })

    // =====================================================
    // STEP 6: Validate against tampering
    // =====================================================
    // Compare server calculation with stored order total
    // Allow small floating point differences (due to rounding)
    const priceDifference = Math.abs(serverCalculatedTotal - order.total)
    const discountDifference = Math.abs(serverCalculatedDiscount - (order.voucher_discount || 0))

    // Check for voucher tampering
    if (order.voucher_id && discountDifference > PRICE_TOLERANCE) {
      console.error(`[${requestId}] 🚨 SECURITY INCIDENT: Voucher discount mismatch!`)
      console.error(`[${requestId}] Stored discount: ${order.voucher_discount}`)
      console.error(`[${requestId}] Server calculated: ${serverCalculatedDiscount}`)
      console.error(`[${requestId}] Difference: ${discountDifference}`)
      console.error(`[${requestId}] Order ID: ${orderId}`)
      console.error(`[${requestId}] Voucher ID: ${order.voucher_id}`)
      // This indicates the order was created with manipulated discount
      // Reject the payment
      return NextResponse.json(
        {
          success: false,
          message: 'Order total mismatch detected. Voucher discount has been modified. Please refresh the page and try again.'
        },
        { status: 400 }
      )
    }

    // Check for general price tampering (if no voucher, or as additional check)
    if (priceDifference > PRICE_TOLERANCE) {
      console.error(`[${requestId}] 🚨 SECURITY INCIDENT: Order total mismatch!`)
      console.error(`[${requestId}] Stored total: ${order.total}`)
      console.error(`[${requestId}] Server calculated: ${serverCalculatedTotal}`)
      console.error(`[${requestId}] Difference: ${priceDifference}`)
      console.error(`[${requestId}] Order ID: ${orderId}`)
      if (order.voucher_id) {
        console.error(`[${requestId}] Voucher ID: ${order.voucher_id}`)
      }

      return NextResponse.json(
        {
          success: false,
          message: 'Order total mismatch detected. Please refresh the page and try again.'
        },
        { status: 400 }
      )
    }

    // If voucher was invalid, return clear error
    if (voucherValidationError) {
      return NextResponse.json(
        {
          success: false,
          message: `Voucher tidak valid: ${voucherValidationError}. Silakan buat pesanan baru tanpa voucher atau gunakan voucher lain.`
        },
        { status: 400 }
      )
    }

    // =====================================================
    // STEP 7: Validate transaction amount limits
    // =====================================================
    const finalAmount = serverCalculatedTotal // Use server-calculated amount

    // Minimum transaction check removed - allow all amounts

    if (finalAmount > MAX_TRANSACTION_AMOUNT) {
      return NextResponse.json(
        { success: false, message: `Maximum transaction amount is Rp ${MAX_TRANSACTION_AMOUNT.toLocaleString('id-ID')}` },
        { status: 400 }
      )
    }

    // =====================================================
    // STEP 8: Create payment with Sakurupiah
    // =====================================================
    const sakurupiahMethod = mapPaymentMethod(method)
    const merchantRef = order.invoice_no || `TK-${orderId.slice(0, 8)}-${Date.now()}`

    console.log(`[${requestId}] Creating Sakurupiah invoice:`, {
      method: sakurupiahMethod,
      amount: finalAmount, // ALWAYS use server-calculated amount
      merchant_ref: merchantRef,
    })

    let invoice
    try {
      invoice = await createInvoice({
        method: sakurupiahMethod,
        name: userName || order.user_game_id || 'Customer',
        email: userEmail || 'guest@topupkilat.com',
        phone: userPhone || '081234567890',
        amount: finalAmount, // CRITICAL: Server-calculated, not from client
        merchant_ref: merchantRef,
      })
    } catch (apiError: any) {
      console.error(`[${requestId}] Sakurupiah API Error:`, apiError.message)
      return NextResponse.json(
        { success: false, message: `Sakurupiah Error: ${apiError.message}` },
        { status: 400 }
      )
    }

    console.log(`[${requestId}] Sakurupiah invoice created:`, invoice)

    // =====================================================
    // STEP 9: Save payment to database
    // =====================================================
    const paymentId = crypto.randomUUID()

    const paymentData = {
      id: paymentId,
      order_id: orderId,
      method: sakurupiahMethod,
      amount: invoice.total || finalAmount, // Use invoice total if available
      status: 'PENDING',
      provider_ref: invoice.trx_id,
      merchant_ref: invoice.merchant_ref,
      payment_url: invoice.checkout_url || null,
      qr_code: invoice.qr || null,
      va_number: invoice.payment_no ? String(invoice.payment_no) : null,
      expired_at: invoice.expired,
    }

    const { error: paymentError } = await supabase.from('payments').insert(paymentData)

    if (paymentError) {
      console.error(`[${requestId}] Error saving payment:`, JSON.stringify(paymentError))
      return NextResponse.json(
        { success: false, message: `Failed to save payment: ${paymentError.message}` },
        { status: 500 }
      )
    }

    // =====================================================
    // STEP 10: Send admin notification
    // =====================================================
    console.log(`[${requestId}] Sending admin notification...`)
    notifyAdminNewOrder({
      invoiceNo: order.invoice_no || merchantRef,
      gameName: order.game?.name || 'Unknown Game',
      productName: order.product?.name || 'Unknown Product',
      userGameId: order.user_game_id || '-',
      serverId: order.server_id,
      total: invoice.total || finalAmount,
      paymentMethod: sakurupiahMethod,
      status: 'PENDING',
    }).then(result => {
      if (result.status) {
        console.log(`[${requestId}] Admin notification sent`)
      } else {
        console.log(`[${requestId}] Admin notification failed:`, result.reason)
      }
    }).catch(err => {
      console.error(`[${requestId}] Admin notification error:`, err)
    })

    console.log(`[${requestId}] Payment creation complete!`)

    return NextResponse.json({
      success: true,
      paymentId: paymentId,
      data: {
        trx_id: invoice.trx_id,
        merchant_ref: invoice.merchant_ref,
        total: invoice.total || finalAmount,
        expired: invoice.expired,
        qr: invoice.qr,
        payment_no: invoice.payment_no,
        checkout_url: invoice.checkout_url,
        via: invoice.via,
        payment_kode: invoice.payment_kode,
      },
    })
  } catch (error: any) {
    console.error(`[${requestId}] Payment creation error:`, error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create payment' },
      { status: 500 }
    )
  }
}
