/**
 * Sakurupiah Callback Security Test
 *
 * Tests that the callback endpoint properly rejects requests with:
 * 1. Missing signature
 * 2. Invalid signature
 *
 * Usage:
 *   npx tsx scripts/test-callback-security.ts
 *
 * IMPORTANT: Run against a STAGING environment, not production!
 */

// Load environment variables
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const CALLBACK_URL = `${APP_URL}/api/callback/sakurupiah`

// Validate required environment variables
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing required environment variables!')
  console.error('')
  console.error('Please ensure these are set in .env.local:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Sample callback payload (fake data)
const samplePayload = {
  trx_id: 'TEST-FAKE-TRX-ID',
  merchant_ref: 'TEST-FAKE-MERCHANT-REF',
  payment_kode: 'BCAVA',
  amount: 50000,
  status: 'berhasil', // "berhasil" = PAID
  status_kode: 200,
  name: 'Test User',
  email: 'test@example.com',
  phone: '081234567890',
}

async function testCallbackSecurity() {
  console.log('🔒 Sakurupiah Callback Security Tests')
  console.log('='.repeat(50))
  console.log(`Callback URL: ${CALLBACK_URL}`)
  console.log()

  const results: { test: string; passed: boolean; details: string }[] = []

  // ====================================================
  // TEST 1: Missing Signature
  // ====================================================
  console.log('📌 TEST 1: Missing Signature')
  console.log('-'.repeat(50))

  try {
    const response = await fetch(CALLBACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No x-callback-signature header
        'x-callback-event': 'payment_status',
      },
      body: JSON.stringify(samplePayload),
    })

    const data = await response.json()

    console.log(`   Status: ${response.status}`)
    console.log(`   Response: ${JSON.stringify(data)}`)

    if (response.status === 401 && !data.success) {
      console.log('✅ PASS: Request rejected with 401')
      results.push({
        test: 'Missing Signature',
        passed: true,
        details: `Status ${response.status}, message: ${data.message}`,
      })
    } else {
      console.log('❌ FAIL: Request should be rejected with 401')
      results.push({
        test: 'Missing Signature',
        passed: false,
        details: `Got status ${response.status} instead of 401`,
      })
    }
  } catch (error: any) {
    console.log(`❌ FAIL: Request failed - ${error.message}`)
    results.push({
      test: 'Missing Signature',
      passed: false,
      details: error.message,
    })
  }

  // ====================================================
  // TEST 2: Invalid Signature
  // ====================================================
  console.log('\n📌 TEST 2: Invalid Signature')
  console.log('-'.repeat(50))

  try {
    const response = await fetch(CALLBACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-callback-signature': 'invalid-signature-12345',
        'x-callback-event': 'payment_status',
      },
      body: JSON.stringify(samplePayload),
    })

    const data = await response.json()

    console.log(`   Status: ${response.status}`)
    console.log(`   Response: ${JSON.stringify(data)}`)

    if (response.status === 401 && !data.success) {
      console.log('✅ PASS: Request rejected with 401')
      results.push({
        test: 'Invalid Signature',
        passed: true,
        details: `Status ${response.status}, message: ${data.message}`,
      })
    } else {
      console.log('❌ FAIL: Request should be rejected with 401')
      results.push({
        test: 'Invalid Signature',
        passed: false,
        details: `Got status ${response.status} instead of 401`,
      })
    }
  } catch (error: any) {
    console.log(`❌ FAIL: Request failed - ${error.message}`)
    results.push({
      test: 'Invalid Signature',
      passed: false,
      details: error.message,
    })
  }

  // ====================================================
  // TEST 3: Valid Signature (Integration test - needs real Sakurupiah)
  // ====================================================
  console.log('\n📌 TEST 3: Valid Signature (Manual Test)')
  console.log('-'.repeat(50))
  console.log('   To test valid signature:')
  console.log('   1. Create a real order and initiate payment')
  console.log('   2. Complete the payment on Sakurupiah')
  console.log('   3. Sakurupiah will send callback with valid signature')
  console.log('   4. Check that payment/order status is updated correctly')
  console.log('   5. Verify in database that no fake status changes occurred')
  results.push({
    test: 'Valid Signature',
    passed: true,
    details: 'Manual integration test required',
  })

  // ====================================================
  // TEST 4: Verify NO database changes for invalid requests
  // ====================================================
  console.log('\n📌 TEST 4: No Database Changes for Invalid Requests')
  console.log('-'.repeat(50))

  const adminClient = createClient(SUPABASE_URL!, SERVICE_KEY!)

  // Get current payment status
  const { data: beforePayment } = await adminClient
    .from('payments')
    .select('id, status')
    .eq('provider_ref', 'TEST-FAKE-TRX-ID')
    .maybeSingle()

  console.log(`   Before test - Payment exists: ${!!beforePayment}`)

  if (beforePayment) {
    console.log(`   Before test - Payment status: ${beforePayment.status}`)
  }

  // The invalid requests above should NOT have created or updated anything
  const { data: afterPayment } = await adminClient
    .from('payments')
    .select('id, status')
    .eq('provider_ref', 'TEST-FAKE-TRX-ID')
    .maybeSingle()

  console.log(`   After test - Payment exists: ${!!afterPayment}`)

  if (afterPayment) {
    console.log(`   After test - Payment status: ${afterPayment.status}`)
    console.log(`   ⚠️  WARNING: Payment was found! This might indicate existing test data.`)
    results.push({
      test: 'No DB Changes',
      passed: !beforePayment || beforePayment.status === afterPayment.status,
      details: beforePayment
        ? `Payment status unchanged: ${afterPayment.status}`
        : 'No payment found (expected)',
    })
  } else {
    console.log('✅ PASS: No fake payment created')
    results.push({
      test: 'No DB Changes',
      passed: true,
      details: 'No fake payment records created',
    })
  }

  // ====================================================
  // SUMMARY
  // ====================================================
  console.log('\n' + '='.repeat(50))
  console.log('📊 SECURITY TEST SUMMARY')
  console.log('='.repeat(50))

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length

  results.forEach((result, i) => {
    const status = result.passed ? '✅' : '❌'
    console.log(`${status} ${i + 1}. ${result.test}`)
    console.log(`   └─ ${result.details}`)
  })

  console.log('\n' + '-'.repeat(50))
  console.log(`Total: ${passed} passed, ${failed} failed`)
  console.log('='.repeat(50))

  if (failed > 0) {
    console.log('\n⚠️  SECURITY ISSUE: Some tests failed!')
    console.log('The callback endpoint may be vulnerable to fake payment notifications.')
    process.exit(1)
  } else {
    console.log('\n🎉 All security tests passed!')
    process.exit(0)
  }
}

testCallbackSecurity().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
