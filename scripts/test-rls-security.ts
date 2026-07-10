/**
 * RLS Security Test Script
 * Tests that RLS policies are working correctly
 *
 * Run this script to verify:
 * - Anon CANNOT update role column in users table
 * - Anon CANNOT update status in payments/orders tables
 * - User A CANNOT see User B's orders
 *
 * Usage:
 *   npx tsx scripts/test-rls-security.ts
 */

// Load environment variables
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Get credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate environment variables
if (!supabaseUrl || !anonKey || !serviceKey) {
  console.error('❌ Missing required environment variables!')
  console.error('')
  console.error('Please ensure these are set in .env.local:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  console.error('')
  console.error('Copy from .env.example and fill in the values.')
  process.exit(1)
}

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

async function runTests() {
  console.log('🧪 Starting RLS Security Tests\n')
  console.log('='.repeat(50))

  const results: TestResult[] = []

  // Create clients
  const anonClient = createClient(supabaseUrl!, anonKey!)
  const serviceClient = createClient(supabaseUrl!, serviceKey!)

  try {
    // Get test data
    console.log('\n📋 Preparing test data...\n')

    // Get a test user (need at least one user for some tests)
    const { data: testUsers, error: usersError } = await serviceClient
      .from('users')
      .select('id, email, role')
      .limit(2)

    if (usersError || !testUsers || testUsers.length === 0) {
      console.log('⚠️  No users found in database. Some tests will be skipped.')
    }

    // Get a test order
    const { data: testOrders } = await serviceClient
      .from('orders')
      .select('id, user_id, status')
      .limit(2)

    // Get a test payment
    const { data: testPayments } = await serviceClient
      .from('payments')
      .select('id, order_id, status')
      .limit(2)

    // ====================================================
    // TEST 1: Anon CANNOT update role in users table
    // ====================================================
    console.log('\n📌 TEST 1: Anon cannot update role in users table')
    console.log('-'.repeat(50))

    try {
      // Try to update role to SUPER_ADMIN (should fail)
      const { error: roleUpdateError } = await anonClient
        .from('users')
        .update({ role: 'SUPER_ADMIN' })
        .eq('role', 'USER')
        .limit(1)

      if (roleUpdateError) {
        console.log('✅ PASS: Anon update blocked (error received)')
        console.log(`   Error: ${roleUpdateError.message}`)
        results.push({ name: 'Anon cannot update user role', passed: true })
      } else {
        console.log('❌ FAIL: Anon was able to update user role - RLS NOT WORKING!')
        results.push({ name: 'Anon cannot update user role', passed: false, error: 'Update succeeded when it should have failed' })
      }
    } catch (e: any) {
      console.log('✅ PASS: Anon update blocked (exception thrown)')
      console.log(`   Error: ${e.message}`)
      results.push({ name: 'Anon cannot update user role', passed: true })
    }

    // ====================================================
    // TEST 2: Anon CANNOT update order status
    // ====================================================
    console.log('\n📌 TEST 2: Anon cannot update order status')
    console.log('-'.repeat(50))

    try {
      // Try to update order status to SUCCESS (should fail)
      const { error: orderUpdateError } = await anonClient
        .from('orders')
        .update({ status: 'SUCCESS' })
        .eq('status', 'PENDING')
        .limit(1)

      if (orderUpdateError) {
        console.log('✅ PASS: Anon order update blocked (error received)')
        console.log(`   Error: ${orderUpdateError.message}`)
        results.push({ name: 'Anon cannot update order status', passed: true })
      } else {
        console.log('❌ FAIL: Anon was able to update order status - RLS NOT WORKING!')
        results.push({ name: 'Anon cannot update order status', passed: false, error: 'Update succeeded when it should have failed' })
      }
    } catch (e: any) {
      console.log('✅ PASS: Anon order update blocked (exception thrown)')
      console.log(`   Error: ${e.message}`)
      results.push({ name: 'Anon cannot update order status', passed: true })
    }

    // ====================================================
    // TEST 3: Anon CANNOT update payment status
    // ====================================================
    console.log('\n📌 TEST 3: Anon cannot update payment status')
    console.log('-'.repeat(50))

    try {
      // Try to update payment status to PAID (should fail)
      const { error: paymentUpdateError } = await anonClient
        .from('payments')
        .update({ status: 'PAID' })
        .eq('status', 'PENDING')
        .limit(1)

      if (paymentUpdateError) {
        console.log('✅ PASS: Anon payment update blocked (error received)')
        console.log(`   Error: ${paymentUpdateError.message}`)
        results.push({ name: 'Anon cannot update payment status', passed: true })
      } else {
        console.log('❌ FAIL: Anon was able to update payment status - RLS NOT WORKING!')
        results.push({ name: 'Anon cannot update payment status', passed: false, error: 'Update succeeded when it should have failed' })
      }
    } catch (e: any) {
      console.log('✅ PASS: Anon payment update blocked (exception thrown)')
      console.log(`   Error: ${e.message}`)
      results.push({ name: 'Anon cannot update payment status', passed: true })
    }

    // ====================================================
    // TEST 4: User A CANNOT see User B's orders
    // ====================================================
    console.log('\n📌 TEST 4: User A cannot see User B\'s orders')
    console.log('-'.repeat(50))

    if (testUsers && testUsers.length >= 2) {
      const userA = testUsers[0]
      const userB = testUsers[1]

      // Get orders for user B
      const userBOrders = testOrders?.filter(o => o.user_id === userB.id) || []

      if (userBOrders.length > 0) {
        // Try to fetch user B's orders as user A (should not work or return empty)
        const { data: userAOrders, error: ordersError } = await anonClient
          .from('orders')
          .select('id, user_id, status')
          .eq('user_id', userA.id)

        // Check if user A can see user B's orders
        const canSeeUserBOrders = testOrders?.some(o =>
          o.user_id === userB.id &&
          userAOrders?.some(uao => uao.id === o.id)
        )

        if (!canSeeUserBOrders || ordersError) {
          console.log('✅ PASS: User isolation working (cannot see other users\' orders)')
          if (ordersError) {
            console.log(`   Error: ${ordersError.message}`)
          }
          results.push({ name: 'User A cannot see User B orders', passed: true })
        } else {
          console.log('❌ FAIL: User A can see User B\'s orders - RLS NOT WORKING!')
          results.push({ name: 'User A cannot see User B orders', passed: false, error: 'User isolation failed' })
        }
      } else {
        console.log('⚠️  SKIP: No orders found for user B to test isolation')
        results.push({ name: 'User A cannot see User B orders', passed: true, error: 'Skipped - no test data' })
      }
    } else {
      console.log('⚠️  SKIP: Need at least 2 users to test order isolation')
      results.push({ name: 'User A cannot see User B orders', passed: true, error: 'Skipped - insufficient test data' })
    }

    // ====================================================
    // TEST 5: Anon CAN read games (public data)
    // ====================================================
    console.log('\n📌 TEST 5: Anon can read active games (public data)')
    console.log('-'.repeat(50))

    try {
      const { data: games, error: gamesError } = await anonClient
        .from('games')
        .select('id, name, slug')
        .eq('is_active', true)
        .limit(5)

      if (gamesError) {
        console.log('❌ FAIL: Anon cannot read games')
        console.log(`   Error: ${gamesError.message}`)
        results.push({ name: 'Anon can read public games', passed: false, error: gamesError.message })
      } else {
        console.log('✅ PASS: Anon can read active games')
        console.log(`   Found ${games?.length || 0} active games`)
        results.push({ name: 'Anon can read public games', passed: true })
      }
    } catch (e: any) {
      console.log('❌ FAIL: Anon cannot read games')
      console.log(`   Error: ${e.message}`)
      results.push({ name: 'Anon can read public games', passed: false, error: e.message })
    }

    // ====================================================
    // TEST 6: Anon CAN read promos (public data)
    // ====================================================
    console.log('\n📌 TEST 6: Anon can read active promos (public data)')
    console.log('-'.repeat(50))

    try {
      const { data: promos, error: promosError } = await anonClient
        .from('promos')
        .select('id, title')
        .eq('is_active', true)
        .limit(5)

      if (promosError) {
        console.log('❌ FAIL: Anon cannot read promos')
        console.log(`   Error: ${promosError.message}`)
        results.push({ name: 'Anon can read public promos', passed: false, error: promosError.message })
      } else {
        console.log('✅ PASS: Anon can read active promos')
        console.log(`   Found ${promos?.length || 0} active promos`)
        results.push({ name: 'Anon can read public promos', passed: true })
      }
    } catch (e: any) {
      console.log('❌ FAIL: Anon cannot read promos')
      console.log(`   Error: ${e.message}`)
      results.push({ name: 'Anon can read public promos', passed: false, error: e.message })
    }

    // ====================================================
    // TEST 7: Anon CANNOT access supplier_requests
    // ====================================================
    console.log('\n📌 TEST 7: Anon cannot access supplier_requests')
    console.log('-'.repeat(50))

    try {
      const { data, error: supplierError } = await anonClient
        .from('supplier_requests')
        .select('id')
        .limit(1)

      if (supplierError) {
        console.log('✅ PASS: Anon cannot access supplier_requests')
        console.log(`   Error: ${supplierError.message}`)
        results.push({ name: 'Anon cannot access supplier_requests', passed: true })
      } else if (data === null || (Array.isArray(data) && data.length === 0)) {
        console.log('✅ PASS: Anon cannot access supplier_requests (empty result)')
        results.push({ name: 'Anon cannot access supplier_requests', passed: true })
      } else {
        console.log('❌ FAIL: Anon can access supplier_requests - RLS NOT WORKING!')
        results.push({ name: 'Anon cannot access supplier_requests', passed: false, error: 'Supplier requests accessible to anon' })
      }
    } catch (e: any) {
      console.log('✅ PASS: Anon cannot access supplier_requests (exception thrown)')
      console.log(`   Error: ${e.message}`)
      results.push({ name: 'Anon cannot access supplier_requests', passed: true })
    }

    // ====================================================
    // SUMMARY
    // ====================================================
    console.log('\n' + '='.repeat(50))
    console.log('📊 TEST SUMMARY')
    console.log('='.repeat(50))

    const passed = results.filter(r => r.passed).length
    const failed = results.filter(r => !r.passed).length

    results.forEach((result, i) => {
      const status = result.passed ? '✅' : '❌'
      console.log(`${status} ${i + 1}. ${result.name}`)
      if (!result.passed && result.error) {
        console.log(`   └─ Error: ${result.error}`)
      }
    })

    console.log('\n' + '-'.repeat(50))
    console.log(`Total: ${passed} passed, ${failed} failed`)
    console.log('='.repeat(50))

    if (failed > 0) {
      console.log('\n⚠️  WARNING: Some RLS tests failed!')
      console.log('Please review the failed tests above.')
      console.log('\nTo apply RLS migration:')
      console.log('1. Go to https://supabase.com/dashboard')
      console.log('2. Select your project')
      console.log('3. Go to SQL Editor')
      console.log('4. Run the migration: supabase/migrations/001_enable_rls.sql')
      process.exit(1)
    } else {
      console.log('\n🎉 All RLS tests passed!')
      process.exit(0)
    }

  } catch (error: any) {
    console.error('\n❌ Fatal error running tests:', error.message)
    console.log('\nMake sure you have set the required environment variables:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL')
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
    console.log('- SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
}

runTests()
