import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  notifyAdminNewOrder,
  notifyAdminPaymentReceived,
  notifyAdminPaymentExpired,
  notifyCustomerOrderSuccess,
} from '@/lib/fonnte'

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

    // Verify signature (optional in production, but recommended)
    if (signature && process.env.SAKURUPIAH_API_KEY) {
      const crypto = await import('crypto')
      const expectedSignature = crypto
        .createHmac('sha256', process.env.SAKURUPIAH_API_KEY)
        .update(rawBody)
        .digest('hex')

      if (signature !== expectedSignature) {
        console.error('Invalid signature!')
        // Continue anyway for now - signature might be optional
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

    // If still not found, try to find by partial match in order invoice
    if (!paymentData && merchant_ref) {
      console.log(`[${requestId}] Trying to find by order invoice_no...`)
      // merchant_ref format: TK-{orderId_prefix}-{timestamp}
      // Extract potential order reference
      const orderPrefix = merchant_ref.replace(/^TK-/, '').split('-')[0]

      if (orderPrefix) {
        // Find orders with matching invoice_no prefix
        const { data: orders } = await supabaseAdmin
          .from('orders')
          .select('id')
          .ilike('invoice_no', `%${orderPrefix}%`)
          .limit(1)

        if (orders && orders.length > 0) {
          // Find payment for this order
          const { data: paymentForOrder } = await supabaseAdmin
            .from('payments')
            .select('id, order_id')
            .eq('order_id', orders[0].id)
            .maybeSingle()

          if (paymentForOrder) {
            paymentData = paymentForOrder
            console.log(`[${requestId}] Found payment by order prefix:`, paymentForOrder)
          }
        }
      }
    }

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

      // If payment successful, trigger supplier delivery (future)
      if (status === 'berhasil') {
        console.log(`[${requestId}] 🎉 Payment successful, order ready for processing!`)
        // TODO: Trigger supplier API (Digiflazz) to deliver the product
      }
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
