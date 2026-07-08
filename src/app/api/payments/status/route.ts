import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkTransactionStatus } from '@/lib/sakurupiah'

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.json(
        { success: false, message: 'Missing paymentId' },
        { status: 400 }
      )
    }

    // Get payment from database to get provider_ref and merchant_ref
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, provider_ref, merchant_ref, status, order_id')
      .eq('id', paymentId)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      )
    }

    console.log('Checking transaction status for payment:', paymentId)
    console.log('provider_ref:', payment.provider_ref)
    console.log('merchant_ref:', payment.merchant_ref)

    // Check status from Sakurupiah
    let sakurupiahStatus: string | null = null
    let updateNeeded = false

    try {
      // Try with trx_id (provider_ref) first, then merchant_ref
      if (payment.provider_ref) {
        const result = await checkTransactionStatus(payment.provider_ref)
        sakurupiahStatus = result.status
        console.log('Sakurupiah status (by trx_id):', sakurupiahStatus)
      } else if (payment.merchant_ref) {
        const result = await checkTransactionStatus(undefined, payment.merchant_ref)
        sakurupiahStatus = result.status
        console.log('Sakurupiah status (by merchant_ref):', sakurupiahStatus)
      }
    } catch (apiError: any) {
      console.error('Error checking Sakurupiah:', apiError.message)
      // Continue - we'll return current DB status
    }

    // Map Sakurupiah status to our status
    let newPaymentStatus = payment.status
    let newOrderStatus: string | null = null

    if (sakurupiahStatus) {
      switch (sakurupiahStatus) {
        case 'berhasil':
          newPaymentStatus = 'PAID'
          newOrderStatus = 'PAID'
          break
        case 'pending':
          newPaymentStatus = 'PENDING'
          break
        case 'expired':
          newPaymentStatus = 'EXPIRED'
          newOrderStatus = 'EXPIRED'
          break
        case 'failed':
          newPaymentStatus = 'FAILED'
          newOrderStatus = 'FAILED'
          break
        default:
          console.log('Unknown Sakurupiah status:', sakurupiahStatus)
      }

      // Update database if status changed
      if (newPaymentStatus !== payment.status) {
        console.log('Status changed from', payment.status, 'to', newPaymentStatus)
        updateNeeded = true

        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: newPaymentStatus,
            paid_at: newPaymentStatus === 'PAID' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', paymentId)

        if (updateError) {
          console.error('Error updating payment status:', updateError)
        }

        // Update order status if needed
        if (newOrderStatus && payment.order_id) {
          await supabase
            .from('orders')
            .update({
              status: newOrderStatus,
              paid_at: newOrderStatus === 'PAID' ? new Date().toISOString() : null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.order_id)
        }
      }
    }

    return NextResponse.json({
      success: true,
      paymentId: paymentId,
      status: newPaymentStatus,
      sakurupiahStatus: sakurupiahStatus,
      updated: updateNeeded,
    })
  } catch (error: any) {
    console.error('Check status error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
