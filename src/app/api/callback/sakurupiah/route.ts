import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('x-callback-signature') || ''
    const callbackEvent = request.headers.get('x-callback-event') || ''

    console.log('=== Sakurupiah Callback ===')
    console.log('Event:', callbackEvent)
    console.log('Body:', rawBody)
    console.log('Signature:', signature)

    // Verify signature
    if (signature) {
      const crypto = await import('crypto')
      const expectedSignature = crypto
        .createHmac('sha256', process.env.SAKURUPIAH_API_KEY || '')
        .update(rawBody)
        .digest('hex')

      if (signature !== expectedSignature) {
        console.error('Invalid signature!')
        return NextResponse.json(
          { success: false, message: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    // Parse callback data
    const data: SakurupiahCallback = JSON.parse(rawBody)

    // Only process payment_status events
    if (callbackEvent !== 'payment_status') {
      console.log('Ignoring non-payment_status event:', callbackEvent)
      return NextResponse.json({ success: true, message: 'Event ignored' })
    }

    const { trx_id, merchant_ref, status, status_kode } = data

    console.log('Processing payment status:', status, 'trx_id:', trx_id, 'merchant_ref:', merchant_ref)

    // Find the payment by trx_id or merchant_ref
    let query = supabaseAdmin
      .from('payments')
      .select('*, orders(*)')
      .eq('provider_ref', trx_id)

    const { data: payment, error: paymentError } = await query.single()

    if (paymentError || !payment) {
      // Try by merchant_ref (invoice_no)
      const { data: paymentByRef, error: paymentByRefError } = await supabaseAdmin
        .from('payments')
        .select('*, orders(*)')
        .eq('merchant_ref', merchant_ref)
        .single()

      if (paymentByRefError || !paymentByRef) {
        console.error('Payment not found:', { trx_id, merchant_ref })
        return NextResponse.json(
          { success: false, message: 'Payment not found' },
          { status: 404 }
        )
      }

      // Update payment by reference
      await updatePaymentStatus(paymentByRef.id, status, status_kode)
    } else {
      // Update payment by trx_id
      await updatePaymentStatus(payment.id, status, status_kode)
    }

    return NextResponse.json({
      success: true,
      message: 'Payment status updated',
    })
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function updatePaymentStatus(
  paymentId: string,
  status: string,
  statusKode: number
) {
  // Map Sakurupiah status to our status
  let paymentStatus: string
  let orderStatus: string

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
      paymentStatus = status.toUpperCase()
      orderStatus = status.toUpperCase()
  }

  console.log('Updating payment to:', paymentStatus, 'order to:', orderStatus)

  // Update payment status
  await supabaseAdmin
    .from('payments')
    .update({
      status: paymentStatus,
      paid_at: status === 'berhasil' ? new Date().toISOString() : null,
    })
    .eq('id', paymentId)

  // Get order ID and update order status
  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('order_id')
    .eq('id', paymentId)
    .single()

  if (payment?.order_id) {
    await supabaseAdmin
      .from('orders')
      .update({
        status: orderStatus,
        paid_at: status === 'berhasil' ? new Date().toISOString() : null,
      })
      .eq('id', payment.order_id)

    // If payment successful, trigger supplier delivery (future)
    if (status === 'berhasil') {
      console.log('Payment successful, order ready for processing')
      // TODO: Trigger supplier API (Digiflazz) to deliver the product
    }
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
