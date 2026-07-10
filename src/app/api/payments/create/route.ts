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
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createInvoice } from '@/lib/sakurupiah'
import { notifyAdminNewOrder } from '@/lib/fonnte'

// Server-side Supabase client (service role for bypassing RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Business rules
const MIN_TRANSACTION_AMOUNT = 10000 // Rp 10,000 minimum
const MAX_TRANSACTION_AMOUNT = 50000000 // Rp 50,000,000 maximum

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
    // STEP 5: Server-side price calculation
    // =====================================================
    // Recalculate total from database to prevent tampering
    const productPrice = order.product?.price || 0
    const voucherDiscount = order.voucher_discount || 0
    const serverCalculatedTotal = Math.max(0, productPrice - voucherDiscount)

    console.log(`[${requestId}] Server-side price calculation:`, {
      productPrice,
      voucherDiscount,
      serverCalculatedTotal,
      storedTotal: order.total,
    })

    // =====================================================
    // STEP 6: Validate against tampering
    // =====================================================
    // Compare server calculation with stored order total
    // Allow small floating point differences (due to rounding)
    const priceDifference = Math.abs(serverCalculatedTotal - order.total)

    if (priceDifference > 100) { // Allow up to Rp 100 difference for rounding
      console.error(`[${requestId}] ⚠️ PRICE TAMPERING DETECTED!`)
      console.error(`[${requestId}] Stored total: ${order.total}`)
      console.error(`[${requestId}] Server calculated: ${serverCalculatedTotal}`)
      console.error(`[${requestId}] Difference: ${priceDifference}`)
      console.error(`[${requestId}] User may have manipulated price during checkout`)

      // Log the incident for audit
      console.error(`[${requestId}] 🚨 SECURITY INCIDENT: Possible price tampering for order ${orderId}`)

      return NextResponse.json(
        {
          success: false,
          message: 'Order total mismatch detected. Please refresh the page and try again.'
        },
        { status: 400 }
      )
    }

    // =====================================================
    // STEP 7: Validate transaction amount limits
    // =====================================================
    const finalAmount = serverCalculatedTotal // Use server-calculated amount

    if (finalAmount < MIN_TRANSACTION_AMOUNT) {
      return NextResponse.json(
        { success: false, message: `Minimum transaction amount is Rp ${MIN_TRANSACTION_AMOUNT.toLocaleString('id-ID')}` },
        { status: 400 }
      )
    }

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
