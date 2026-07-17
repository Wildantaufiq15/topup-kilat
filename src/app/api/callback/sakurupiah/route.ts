/**
 * Sakurupiah Payment Gateway Callback Handler
 *
 * SECURITY: This endpoint processes payment status updates from Sakurupiah.
 * All requests MUST have valid x-callback-signature header (HMAC-SHA256).
 * Requests with missing or invalid signatures are REJECTED with 401.
 *
 * This is critical to prevent fake payment notifications that could:
 * - Mark unpaid orders as PAID
 * - Bypass payment verification
 * - Cause financial loss
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  notifyAdminNewOrder,
  notifyAdminPaymentReceived,
  notifyAdminPaymentExpired,
  notifyCustomerOrderSuccess,
} from '@/lib/fonnte'
import { verifyCallbackSignature } from '@/lib/sakurupiah'
import { createTopup, checkTopupStatus } from '@/lib/digiflazz'

// Initialize Supabase admin client (server-side)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

interface SakurupiahCallback {
  trx_id: string
  merchant_ref: string
  payment_kode: string
  amount: number
  status: 'berhasil' | 'pending' | 'expired' | 'failed'
  status_kode: number
  name?: string
  email?: string
  phone?: string
  callback_url?: string
}

interface OrderData {
  id: string
  invoice_no: string
  user_game_id: string
  server_id: string | null
  fulfillment_status?: string | null
  fulfillment_ref?: string | null
  fulfillment_rc?: string | null
  fulfillment_message?: string | null
  fulfillment_sn?: string | null
  product: {
    id: string
    name: string
  }
  game: {
    name: string
    slug: string
  }
}

interface FulfillmentResult {
  success: boolean
  ref_id?: string
  rc?: string
  message?: string
  sn?: string
}

/**
 * Check if callback was already processed (idempotency)
 * Returns true if callback exists in log with same status
 */
async function isCallbackProcessed(
  trxId: string,
  status: string
): Promise<{ processed: boolean; data?: any }> {
  const { data, error } = await supabaseAdmin
    .from('payment_callback_log')
    .select('*')
    .eq('trx_id', trxId)
    .eq('status', status)
    .maybeSingle()

  if (error) {
    console.error('Error checking callback log:', error)
    return { processed: false }
  }

  return { processed: !!data, data }
}

/**
 * Log processed callback to prevent duplicate processing
 */
async function logCallback(
  trxId: string,
  merchantRef: string | null,
  eventType: string,
  status: string,
  rawPayload: object,
  signature: string | null
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('payment_callback_log')
    .insert({
      trx_id: trxId,
      merchant_ref: merchantRef,
      event_type: eventType,
      status: status,
      raw_payload: rawPayload,
      signature: signature,
    })

  if (error) {
    console.error('Error logging callback:', error)
    // Don't throw - logging failure shouldn't stop processing
  }
}

/**
 * Process Digiflazz topup fulfillment
 *
 * Flow:
 * 1. Get order details (buyer_sku_code, customer_no)
 * 2. Generate unique ref_id for this transaction
 * 3. Call Digiflazz API
 * 4. Update order with fulfillment status
 */
async function processFulfillment(
  orderData: OrderData,
  paymentId: string,
  requestId: string
): Promise<FulfillmentResult> {
  console.log(`[${requestId}] Processing fulfillment for order:`, orderData.id)

  // Check if order already fulfilled
  if (orderData.fulfillment_status === 'SUCCESS') {
    console.log(`[${requestId}] Order already fulfilled, skipping...`)
    return { success: true, ref_id: orderData.fulfillment_ref || undefined }
  }

  // Generate unique ref_id for Digiflazz
  // Format: ORDER-{invoice_no}-{timestamp}
  const refId = `ORD-${orderData.invoice_no}`

  console.log(`[${requestId}] Fulfillment ref_id:`, refId)

  // Map game slug to Digiflazz buyer_sku_code
  // This needs to be configured in the game_products table
  const buyerSkuCode = await getBuyerSkuCode(orderData.game.slug, orderData.product?.id)

  if (!buyerSkuCode) {
    console.error(`[${requestId}] No SKU code mapping found for game: ${orderData.game.slug}`)
    return {
      success: false,
      message: 'SKU code not configured for this product',
    }
  }

  console.log(`[${requestId}] SKU Code: ${buyerSkuCode}`)
  console.log(`[${requestId}] Customer No: ${orderData.user_game_id}`)
  console.log(`[${requestId}] Server: ${orderData.server_id || 'N/A'}`)

  // Call Digiflazz API
  try {
    const digiflazzResponse = await createTopup({
      buyer_sku_code: buyerSkuCode,
      customer_no: orderData.user_game_id,
      ref_id: refId,
      testing: false, // Set to true for testing
    })

    console.log(`[${requestId}] Digiflazz response:`, digiflazzResponse)

    // Determine status based on RC code
    const isSuccess = digiflazzResponse.rc === '00' || digiflazzResponse.status === 'Sukses'
    const isPending = digiflazzResponse.rc === '01' || digiflazzResponse.status === 'Pending'

    // Update order with fulfillment info
    await supabaseAdmin
      .from('orders')
      .update({
        fulfillment_status: isSuccess ? 'SUCCESS' : isPending ? 'PENDING' : 'FAILED',
        fulfillment_ref: refId,
        fulfillment_rc: digiflazzResponse.rc,
        fulfillment_message: digiflazzResponse.message,
        fulfillment_sn: digiflazzResponse.sn || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderData.id)

    // Update order status based on fulfillment
    if (!isSuccess && !isPending) {
      await supabaseAdmin
        .from('orders')
        .update({ status: 'FAILED' })
        .eq('id', orderData.id)
    }

    return {
      success: isSuccess,
      ref_id: refId,
      rc: digiflazzResponse.rc,
      message: digiflazzResponse.message,
      sn: digiflazzResponse.sn,
    }
  } catch (error: any) {
    console.error(`[${requestId}] Digiflazz API error:`, error)

    // Mark fulfillment as failed
    await supabaseAdmin
      .from('orders')
      .update({
        fulfillment_status: 'FAILED',
        fulfillment_ref: refId,
        fulfillment_message: error.message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderData.id)

    return {
      success: false,
      ref_id: refId,
      message: error.message,
    }
  }
}

/**
 * Map game slug + product name to Digiflazz buyer_sku_code
 * Fetch from database game_products table
 */
async function getBuyerSkuCode(gameSlug: string, productId: string): Promise<string | null> {
  // Fetch from database
  const { data, error } = await supabaseAdmin
    .from('game_products')
    .select('buyer_sku_code')
    .eq('id', productId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching SKU code:', error)
    return null
  }

  return data?.buyer_sku_code || null
}

export async function POST(request: NextRequest) {
  const requestId = `cb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('x-callback-signature') || ''
    const callbackEvent = request.headers.get('x-callback-event') || ''

    console.log('========== SAKURUPIAH CALLBACK ==========')
    console.log(`[${requestId}] Event:`, callbackEvent)
    console.log(`[${requestId}] Raw Body:`, rawBody)
    console.log(`[${requestId}] Signature:`, signature ? 'present' : 'missing')

    // Parse callback data
    const data: SakurupiahCallback = JSON.parse(rawBody)
    const { trx_id, merchant_ref, status } = data

    console.log(`[${requestId}] Parsed data:`, { trx_id, merchant_ref, status })

    // Verify signature - MANDATORY for security
    // If signature is missing or invalid, reject immediately without processing
    if (!signature) {
      console.error(`[${requestId}] ❌ Signature missing - rejecting callback`)
      console.error(`[${requestId}] This could be an attack attempt - logging for audit`)

      return NextResponse.json(
        { success: false, message: 'Missing signature' },
        { status: 401 }
      )
    }

    if (!verifyCallbackSignature(rawBody, signature)) {
      console.error(`[${requestId}] ❌ Invalid signature - rejecting callback`)
      console.error(`[${requestId}] Received signature: ${signature.substring(0, 20)}...`)
      console.error(`[${requestId}] This could be an attack attempt - logging for audit`)

      return NextResponse.json(
        { success: false, message: 'Invalid signature' },
        { status: 401 }
      )
    }

    console.log(`[${requestId}] ✅ Signature verified successfully`)

    // IDEMPOTENCY CHECK: Skip if callback already processed with same status
    if (trx_id) {
      const { processed, data: existingLog } = await isCallbackProcessed(trx_id, status)
      if (processed) {
        console.log(`[${requestId}] ⏭️ Callback already processed (idempotent), skipping...`)
        console.log(`[${requestId}] Existing log:`, existingLog)
        return NextResponse.json({
          success: true,
          message: 'Callback already processed',
          idempotent: true,
        })
      }
    }

    // Only process payment_status events
    if (callbackEvent !== 'payment_status' && callbackEvent !== '') {
      console.log('Ignoring event:', callbackEvent)
      return NextResponse.json({ success: true, message: 'Event ignored' })
    }

    // Map Sakurupiah status to our status
    let paymentStatus: string = 'PENDING'
    let orderStatus: string = 'PENDING'

    switch (status) {
      case 'berhasil':
        paymentStatus = 'PAID'
        orderStatus = 'PAID'
        break
      case 'pending':
        paymentStatus = 'PENDING'
        orderStatus = 'PENDING'
        break
      case 'expired':
        paymentStatus = 'EXPIRED'
        orderStatus = 'EXPIRED'
        break
      case 'failed':
        paymentStatus = 'FAILED'
        orderStatus = 'FAILED'
        break
      default:
        // Handle unknown status gracefully
        paymentStatus = (status as string).toUpperCase()
        orderStatus = (status as string).toUpperCase()
    }

    console.log(`[${requestId}] Mapped status:`, { paymentStatus, orderStatus })

    // Find payment by trx_id (provider_ref) or merchant_ref
    let paymentData: any = null
    let paymentId: string | null = null

    // Try to find by trx_id first (provider_ref in our DB)
    if (trx_id) {
      console.log(`[${requestId}] Searching by trx_id (provider_ref):`, trx_id)
      const { data: paymentByTrx } = await supabaseAdmin
        .from('payments')
        .select('id, order_id')
        .eq('provider_ref', trx_id)
        .maybeSingle()

      if (paymentByTrx) {
        paymentData = paymentByTrx
        console.log(`[${requestId}] Found payment by trx_id:`, paymentByTrx)
      }
    }

    // Try by merchant_ref if not found
    if (!paymentData && merchant_ref) {
      console.log(`[${requestId}] Searching by merchant_ref:`, merchant_ref)
      const { data: paymentByRef } = await supabaseAdmin
        .from('payments')
        .select('id, order_id')
        .eq('merchant_ref', merchant_ref)
        .maybeSingle()

      if (paymentByRef) {
        paymentData = paymentByRef
        console.log(`[${requestId}] Found payment by merchant_ref:`, paymentByRef)
      }
    }

    // NOTE: ILIKE fallback for invoice_no was removed because:
    // 1. trx_id and merchant_ref lookups should always succeed for valid callbacks
    // 2. ILIKE with leading wildcard cannot use B-tree index efficiently
    // 3. Dead code increases maintenance burden

    if (!paymentData) {
      console.error(`[${requestId}] Payment not found for:`, { trx_id, merchant_ref })
      console.log(`[${requestId}] Failed callback data:`, JSON.stringify(data))

      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      )
    }

    paymentId = paymentData.id
    console.log(`[${requestId}] Updating payment:`, paymentId, 'to status:', paymentStatus)

    // Get order and game info for notification
    let orderData: any = null
    let gameData: any = null
    let userData: any = null

    if (paymentData.order_id) {
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('*, game:games(name), product:game_products(name), user:users(name, phone)')
        .eq('id', paymentData.order_id)
        .single()

      if (order) {
        orderData = order
        gameData = order.game
        userData = order.user
      }
    }

    // Update payment status
    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .update({
        status: paymentStatus,
        paid_at: status === 'berhasil' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)

    if (paymentError) {
      console.error('Error updating payment:', paymentError)
      return NextResponse.json(
        { success: false, message: 'Failed to update payment' },
        { status: 500 }
      )
    }

    console.log(`[${requestId}] Payment updated successfully`)

    // Prepare notification data
    const notificationData = orderData ? {
      invoiceNo: orderData.invoice_no,
      gameName: gameData?.name || 'Unknown Game',
      productName: orderData.product?.name || 'Unknown Product',
      userGameId: orderData.user_game_id,
      serverId: orderData.server_id,
      total: orderData.total,
      paymentMethod: data.payment_kode || paymentData.method || 'Unknown',
      status: orderStatus as any,
    } : null

    // Update order status
    if (paymentData.order_id) {
      console.log(`[${requestId}] Updating order:`, paymentData.order_id, 'to status:', orderStatus)

      const { error: orderError } = await supabaseAdmin
        .from('orders')
        .update({
          status: orderStatus,
          paid_at: status === 'berhasil' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentData.order_id)

      if (orderError) {
        console.error(`[${requestId}] Error updating order:`, orderError)
        // Continue anyway - payment is updated
      } else {
        console.log(`[${requestId}] Order updated successfully`)
      }

      // Send WhatsApp notifications based on payment status
      if (notificationData) {
        // Send notification to admin based on status
        if (status === 'berhasil') {
          console.log(`[${requestId}] Sending payment received notification to admin`)
          await notifyAdminPaymentReceived(notificationData)
        } else if (status === 'expired') {
          console.log(`[${requestId}] Sending payment expired notification to admin`)
          await notifyAdminPaymentExpired(notificationData)
        }

        // Send notification to customer if payment successful
        if (status === 'berhasil' && userData?.phone) {
          console.log(`[${requestId}] Sending order success notification to customer`)
          await notifyCustomerOrderSuccess(userData.phone, notificationData)
        }
      }

      // If payment successful, trigger supplier delivery
      if (status === 'berhasil') {
        console.log(`[${requestId}] 🎉 Payment successful, starting fulfillment...`)

        // Trigger Digiflazz topup
        try {
          const fulfillmentResult = await processFulfillment(
            orderData,
            paymentId!,  // paymentId is guaranteed to be set here
            requestId
          )
          console.log(`[${requestId}] ✅ Fulfillment result:`, fulfillmentResult)
        } catch (fulfillmentError: any) {
          console.error(`[${requestId}] ❌ Fulfillment error:`, fulfillmentError.message)
          // Don't fail the callback - payment is already processed
          // Fulfillment can be retried via admin panel
        }
      }
    }

    // LOG SUCCESS: Record callback to prevent duplicate processing
    if (trx_id) {
      await logCallback(
        trx_id,
        merchant_ref || null,
        callbackEvent || 'payment_status',
        status,
        data,
        signature || null
      )
      console.log(`[${requestId}] ✅ Callback logged for idempotency`)
    }

    console.log(`[${requestId}] === Callback processing complete ===`)
    console.log('==========================================')

    return NextResponse.json({
      success: true,
      message: 'Payment status updated',
      paymentId: paymentId,
      newStatus: paymentStatus,
    })
  } catch (error: any) {
    console.error(`[${requestId}] Callback error:`, error.message || error)
    console.error(`[${requestId}] Full error:`, error)
    console.log('==========================================')
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle GET requests (Sakurupiah might check callback URL)
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Sakurupiah callback endpoint active',
    timestamp: new Date().toISOString(),
  })
}
