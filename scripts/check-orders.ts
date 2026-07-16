/**
 * Check Orders and Payments
 * Run this to verify orders and payments exist in the database
 * Uses anon key since orders/payments are publicly readable (with RLS)
 */

// Load environment variables
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('❌ Missing environment variables!')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

async function checkOrders() {
  const client = createClient(SUPABASE_URL!, ANON_KEY!)

  console.log('🔍 Checking orders in Supabase...\n')

  // Check orders
  const { data: orders, error: ordersError } = await client
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  if (ordersError) {
    console.log('❌ Orders error:', ordersError.message)
  } else {
    console.log('📦 Orders found:', orders?.length || 0)
    if (orders) {
      orders.forEach(o => {
        console.log('  Invoice:', o.invoice_no)
        console.log('  Status:', o.status)
        console.log('  Total: Rp', o.total?.toLocaleString('id-ID'))
        console.log('  User Game ID:', o.user_game_id)
        console.log()
      })
    }
  }

  // Check payments
  const { data: payments, error: paymentsError } = await client
    .from('payments')
    .select('*')
    .limit(5)

  if (paymentsError) {
    console.log('❌ Payments error:', paymentsError.message)
  } else {
    console.log('💳 Payments found:', payments?.length || 0)
    if (payments) {
      payments.forEach(p => {
        console.log('  Order ID:', p.order_id)
        console.log('  Method:', p.method)
        console.log('  Status:', p.status)
        console.log()
      })
    }
  }
}

checkOrders().catch(console.error)
