/**
 * Order Flow Test
 * Run with: npx tsx scripts/manual/test-order.ts
 *
 * Requires .env.local with:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!')
  console.log('Please create .env.local with your Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testOrder() {
  console.log('🔄 Testing order creation...\n')

  // 1. Get Mobile Legends game
  console.log('1️⃣ Get Mobile Legends game...')
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('slug', 'mobile-legends')
    .single()

  if (gameError) {
    console.log('❌ Game error:', gameError.message)
    return
  }
  console.log('✅ Game:', game?.name, '(ID:', game?.id + ')')

  // 2. Get products
  console.log('\n2️⃣ Get products...')
  const { data: products, error: productsError } = await supabase
    .from('game_products')
    .select('*')
    .eq('game_id', game?.id)
    .limit(1)

  if (productsError) {
    console.log('❌ Products error:', productsError.message)
    return
  }
  console.log('✅ Products:', products?.length)
  if (products && products.length > 0) {
    console.log('   First product:', products[0].name, '- Rp', products[0].price)
  }

  // 3. Create order (guest order)
  console.log('\n3️⃣ Create order...')
  const invoiceNo = 'TEST' + Date.now()

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: null, // guest order
      game_id: game?.id,
      product_id: products?.[0]?.id || null,
      invoice_no: invoiceNo,
      user_game_id: '12345678',
      server_id: '1234',
      subtotal: products?.[0]?.price || 20000,
      total: products?.[0]?.price || 20000,
      status: 'PENDING',
    })
    .select()
    .single()

  if (orderError) {
    console.log('❌ Order error:', orderError.message)
    console.log('\n💡 This is likely an RLS issue!')
    console.log('   Make sure you ran the RLS migration scripts.')
    return
  }
  console.log('✅ Order created!')
  console.log('   Invoice:', order?.invoice_no)
  console.log('   ID:', order?.id)
  console.log('   Status:', order?.status)

  // 4. Create payment
  console.log('\n4️⃣ Create payment...')
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      order_id: order?.id,
      method: 'QRIS',
      amount: order?.total,
      status: 'PENDING',
      provider_ref: 'TEST-' + Date.now(),
      expired_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single()

  if (paymentError) {
    console.log('❌ Payment error:', paymentError.message)
    return
  }
  console.log('✅ Payment created!')
  console.log('   Payment ID:', payment?.id)
  console.log('   Method:', payment?.method)
  console.log('   Status:', payment?.status)

  // 5. Verify in database
  console.log('\n5️⃣ Verify in database...')
  const { data: verifyOrder } = await supabase
    .from('orders')
    .select('*')
    .eq('invoice_no', invoiceNo)
    .single()
  console.log('✅ Order verified:', verifyOrder?.invoice_no)

  console.log('\n🎉 TEST ORDER SUCCESS!')
  console.log('Invoice:', invoiceNo)
}

testOrder().catch(console.error)
