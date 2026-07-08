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

    // Map method to Sakurupiah format (uppercase)
    const sakurupiahMethod = mapPaymentMethod(method)

    console.log('Creating Sakurupiah invoice for order:', orderId)
    console.log('Request payload:', {
      method: sakurupiahMethod,
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
        method: sakurupiahMethod,
        name: userName || 'Customer',
        email: userEmail || 'guest@topupkilat.com',
        phone: userPhone || '081234567890',
        amount,
        merchant_ref: `TK-${orderId.slice(0, 8)}-${Date.now()}`,
      })
    } catch (apiError: any) {
      console.error('Sakurupiah API Error:', apiError.message)
      return NextResponse.json(
        { success: false, message: `Sakurupiah Error: ${apiError.message}` },
        { status: 400 }
      )
    }

    console.log('Sakurupiah invoice created:', invoice)

    // Generate UUID for payment id
    const paymentId = crypto.randomUUID()

    // Map to actual Supabase schema (snake_case as per Database types)
    const paymentData = {
      id: paymentId,
      order_id: orderId,
      method: sakurupiahMethod,
      amount: invoice.total,
      status: 'PENDING',
      provider_ref: invoice.trx_id,
      merchant_ref: invoice.merchant_ref, // Add merchant_ref for webhook lookup
      payment_url: invoice.checkout_url || null,
      qr_code: invoice.qr || null,
      va_number: invoice.payment_no ? String(invoice.payment_no) : null,
      expired_at: invoice.expired,
    }
    console.log('Saving payment data:', JSON.stringify(paymentData, null, 2))

    const { error: paymentError } = await supabase.from('payments').insert(paymentData)

    if (paymentError) {
      console.error('Error saving payment:', JSON.stringify(paymentError, null, 2))
      return NextResponse.json(
        { success: false, message: `Failed to save payment: ${paymentError.message}`, details: paymentError },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      paymentId: paymentId, // Return payment ID for status polling
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
