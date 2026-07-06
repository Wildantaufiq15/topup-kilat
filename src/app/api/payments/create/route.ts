import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createInvoice } from '@/lib/sakurupiah'

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface CreatePaymentRequest {
  orderId: string
  method: string
  gameName: string
  productName: string
  amount: number
  userName: string
  userEmail: string
  userPhone: string
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePaymentRequest = await request.json()
    const { orderId, method, gameName, productName, amount, userName, userEmail, userPhone } = body

    // Validate required fields
    if (!orderId || !method || !amount) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('Creating Sakurupiah invoice for order:', orderId)
    console.log('Request payload:', {
      method,
      name: userName || 'Customer',
      email: userEmail || 'guest@topupkilat.com',
      phone: userPhone || '081234567890',
      amount,
      merchant_ref: `TK-${orderId.slice(0, 8)}-${Date.now()}`,
    })

    // Create invoice with Sakurupiah
    let invoice
    try {
      invoice = await createInvoice({
        method,
        name: userName || 'Customer',
        email: userEmail || 'guest@topupkilat.com',
        phone: userPhone || '081234567890',
        amount,
        merchant_ref: `TK-${orderId.slice(0, 8)}-${Date.now()}`,
        expired: 24,
        produk: [`${gameName} - ${productName}`],
        qty: [1],
        harga: [amount],
      })
    } catch (apiError: any) {
      console.error('Sakurupiah API Error:', apiError.message)
      // Return more detailed error
      return NextResponse.json(
        { success: false, message: `Sakurupiah Error: ${apiError.message}` },
        { status: 400 }
      )
    }

    console.log('Sakurupiah invoice created:', invoice)

    // Save payment to Supabase
    const { error: paymentError } = await supabase.from('payments').insert({
      order_id: orderId,
      method,
      amount: invoice.total,
      status: 'PENDING',
      provider_ref: invoice.trx_id,
      merchant_ref: invoice.merchant_ref,
      qr_url: invoice.qr || null,
      checkout_url: invoice.checkout_url || null,
      payment_no: invoice.payment_no ? String(invoice.payment_no) : null,
      expired_at: invoice.expired,
    })

    if (paymentError) {
      console.error('Error saving payment:', paymentError)
      return NextResponse.json(
        { success: false, message: 'Failed to save payment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        trx_id: invoice.trx_id,
        merchant_ref: invoice.merchant_ref,
        total: invoice.total,
        expired: invoice.expired,
        qr: invoice.qr,
        payment_no: invoice.payment_no,
        checkout_url: invoice.checkout_url,
        via: invoice.via,
        payment_kode: invoice.payment_kode,
      },
    })
  } catch (error: any) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create payment' },
      { status: 500 }
    )
  }
}
