/**
 * RLS Migration Status Checker
 * Run this to verify RLS policies are properly applied
 *
 * Usage:
 *   npx tsx scripts/check-rls-status.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function checkRLSStatus() {
  console.log('🔍 Checking RLS Migration Status...\n')
  console.log('='.repeat(50))

  const adminClient = createClient(supabaseUrl, serviceKey)

  try {
    // ====================================================
    // CHECK 1: Verify RLS is enabled on all tables
    // ====================================================
    console.log('\n📌 CHECK 1: RLS Enabled Tables')
    console.log('-'.repeat(50))

    const tablesToCheck = [
      'users', 'games', 'game_products', 'orders', 'payments',
      'vouchers', 'promos', 'wishlists', 'points_ledger',
      'notifications', 'supplier_requests'
    ]

    const { data: rlsStatus, error: rlsError } = await adminClient.rpc('exec_sql', {
      sql_query: `
        SELECT tablename, rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename IN ('${tablesToCheck.join("','")}')
        ORDER BY tablename
      `
    })

    // Alternative: Use raw query with postgrest
    const { data: pgTables, error: tablesError } = await adminClient
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .in('tablename', tablesToCheck)

    if (tablesError) {
      console.log('Note: Cannot directly query pg_tables via Supabase client')
      console.log('Please run the verification SQL in Supabase SQL Editor:')
      console.log('  scripts/verify-rls-migration.sql')
    } else {
      let rlsEnabledCount = 0
      pgTables?.forEach((table: any) => {
        const status = table.rowsecurity ? '✅' : '❌'
        console.log(`${status} ${table.tablename}: RLS ${table.rowsecurity ? 'enabled' : 'DISABLED'}`)
        if (table.rowsecurity) rlsEnabledCount++
      })
      console.log(`\n   Total: ${rlsEnabledCount}/${tablesToCheck.length} tables with RLS enabled`)
    }

    // ====================================================
    // CHECK 2: Test public read access (should work)
    // ====================================================
    console.log('\n📌 CHECK 2: Public Read Access (Anon Key)')
    console.log('-'.repeat(50))

    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // Test games read
    const { data: games, error: gamesError } = await anonClient
      .from('games')
      .select('id, name')
      .eq('is_active', true)
      .limit(1)

    if (gamesError) {
      console.log(`❌ Cannot read games: ${gamesError.message}`)
    } else {
      console.log(`✅ Anon can read active games (${games?.length || 0} found)`)
    }

    // Test promos read
    const { data: promos, error: promosError } = await anonClient
      .from('promos')
      .select('id, title')
      .eq('is_active', true)
      .limit(1)

    if (promosError) {
      console.log(`❌ Cannot read promos: ${promosError.message}`)
    } else {
      console.log(`✅ Anon can read active promos (${promos?.length || 0} found)`)
    }

    // ====================================================
    // CHECK 3: Test protected write access (should fail)
    // ====================================================
    console.log('\n📌 CHECK 3: Protected Write Access (Anon Key)')
    console.log('-'.repeat(50))

    // Try to update user role
    const { error: roleError } = await anonClient
      .from('users')
      .update({ role: 'ADMIN' })
      .eq('id', '00000000-0000-0000-0000-000000000000') // Non-existent user

    console.log(`${roleError ? '✅' : '❌'} Update users: ${roleError ? 'BLOCKED (correct)' : 'ALLOWED (WRONG!)'}`)

    // Try to update order status
    const { error: orderError } = await anonClient
      .from('orders')
      .update({ status: 'SUCCESS' })
      .eq('id', '00000000-0000-0000-0000-000000000000')

    console.log(`${orderError ? '✅' : '❌'} Update orders: ${orderError ? 'BLOCKED (correct)' : 'ALLOWED (WRONG!)'}`)

    // Try to update payment status
    const { error: paymentError } = await anonClient
      .from('payments')
      .update({ status: 'PAID' })
      .eq('id', '00000000-0000-0000-0000-000000000000')

    console.log(`${paymentError ? '✅' : '❌'} Update payments: ${paymentError ? 'BLOCKED (correct)' : 'ALLOWED (WRONG!)'}`)

    // ====================================================
    // CHECK 4: Verify no UPDATE/DELETE policies on orders/payments
    // ====================================================
    console.log('\n📌 CHECK 4: No UPDATE/DELETE policies on orders/payments')
    console.log('-'.repeat(50))

    console.log('ℹ️  To verify, run this in Supabase SQL Editor:')
    console.log(`
    SELECT policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('orders', 'payments')
    ORDER BY tablename, cmd;
    `)
    console.log('Expected: Only SELECT and INSERT policies, NO UPDATE/DELETE')

    // ====================================================
    // FINAL SUMMARY
    // ====================================================
    console.log('\n' + '='.repeat(50))
    console.log('📊 VERIFICATION SUMMARY')
    console.log('='.repeat(50))
    console.log(`
To fully verify RLS migration:

1. Run scripts/verify-rls-migration.sql in Supabase SQL Editor
2. Check that all 11 tables have RLS enabled
3. Check that is_admin() function exists
4. Check that policies match expected count per table

For quick client-side check, run:
  npx tsx scripts/test-rls-security.ts
`)

  } catch (error: any) {
    console.error('\n❌ Error checking RLS status:', error.message)
    console.log('\nMake sure you have:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL')
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
    console.log('- SUPABASE_SERVICE_ROLE_KEY')
  }
}

checkRLSStatus()
