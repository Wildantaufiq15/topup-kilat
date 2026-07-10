/**
 * RLS Migration Verification Script
 * Verifies that all RLS policies from 001_enable_rls.sql are properly created
 *
 * Run this in Supabase SQL Editor or via script
 */

-- =====================================================
-- CHECK 1: Verify RLS is enabled on all tables
-- =====================================================
SELECT
  'CHECK 1: RLS Enabled Tables' as check_name,
  COUNT(*) as tables_with_rls
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'games', 'game_products', 'orders', 'payments',
    'vouchers', 'promos', 'wishlists', 'points_ledger',
    'notifications', 'supplier_requests'
  )
  AND rowsecurity = true;

-- Expected: 11 (all tables should have RLS enabled)

-- =====================================================
-- CHECK 2: List all policies created
-- =====================================================
SELECT
  'CHECK 2: All RLS Policies' as check_name,
  tablename,
  policyname,
  permissive,
  cmd,
  roles::text
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- CHECK 3: Count policies per table
-- =====================================================
SELECT
  'CHECK 3: Policy Count per Table' as check_name,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'games', 'game_products', 'orders', 'payments',
    'vouchers', 'promos', 'wishlists', 'points_ledger',
    'notifications', 'supplier_requests'
  )
GROUP BY tablename
ORDER BY tablename;

-- Expected policy counts:
-- users: 4 (select own, select admin, update own, update admin)
-- games: 5 (select public, select admin, insert, update, delete)
-- game_products: 5 (select public, select admin, insert, update, delete)
-- orders: 3 (select own, select admin, insert own)
-- payments: 3 (select own, select admin, insert own)
-- vouchers: 5 (select public, select admin, insert, update, delete)
-- promos: 5 (select public, select admin, insert, update, delete)
-- wishlists: 5 (select, select admin, insert, update, delete)
-- points_ledger: 3 (select own, select admin, insert admin)
-- notifications: 5 (select own, select admin, insert admin, update own, delete own)
-- supplier_requests: 4 (select admin, insert admin, update admin, delete admin)

-- =====================================================
-- CHECK 4: Verify is_admin() function exists
-- =====================================================
SELECT
  'CHECK 4: is_admin() Function' as check_name,
  routine_name,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_admin', 'user_role');

-- Expected: is_admin function with boolean return type

-- =====================================================
-- CHECK 5: Verify grants on tables
-- =====================================================
SELECT
  'CHECK 5: Table Grants' as check_name,
  table_schema,
  table_name,
  privilege_type,
  grantee
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN (
    'users', 'games', 'game_products', 'orders', 'payments',
    'vouchers', 'promos', 'wishlists', 'points_ledger',
    'notifications', 'supplier_requests'
  )
ORDER BY table_name, privilege_type, grantee;

-- Expected:
-- anon: SELECT on games, game_products, vouchers, promos
-- authenticated: SELECT on all tables
-- No grants for INSERT/UPDATE/DELETE to anon

-- =====================================================
-- CHECK 6: Summary verification
-- =====================================================
SELECT
  'CHECK 6: Migration Status' as check_name,
  CASE
    WHEN COUNT(DISTINCT tablename) = 11
      AND SUM(CASE WHEN rowsecurity THEN 1 ELSE 0 END) = 11
    THEN '✅ COMPLETE - All RLS policies applied'
    ELSE '❌ INCOMPLETE - Some tables missing RLS'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'games', 'game_products', 'orders', 'payments',
    'vouchers', 'promos', 'wishlists', 'points_ledger',
    'notifications', 'supplier_requests'
  );

-- =====================================================
-- Final Summary
-- =====================================================
SELECT '========================================' as separator;
SELECT 'RLS Migration Verification Complete' as message;
SELECT 'Run all checks above to verify migration status' as note;
