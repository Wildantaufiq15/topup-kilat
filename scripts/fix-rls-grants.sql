-- =====================================================
-- Topup Kilat - RLS Security Fix
-- REVOKE all privileges from anon and reapply correct grants
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: REVOKE ALL from anon (CRITICAL)
-- =====================================================

-- Revoke ALL privileges from all tables
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- Revoke ALL privileges from all sequences
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- Revoke ALL privileges from all functions
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- =====================================================
-- STEP 2: Grant USAGE on schema (needed for RLS to work)
-- =====================================================
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- =====================================================
-- STEP 3: Grant EXECUTE on helper functions
-- =====================================================
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- =====================================================
-- STEP 4: Grant SELECT only on PUBLIC tables to anon
-- Only games, game_products, promos, vouchers can be read without auth
-- =====================================================

-- games - public read (active only via RLS policy)
GRANT SELECT ON public.games TO anon;

-- game_products - public read (active only via RLS policy)
GRANT SELECT ON public.game_products TO anon;

-- promos - public read (active only via RLS policy)
GRANT SELECT ON public.promos TO anon;

-- vouchers - public read (active only via RLS policy)
GRANT SELECT ON public.vouchers TO anon;

-- =====================================================
-- STEP 5: Grant basic operations to authenticated users
-- =====================================================

-- Users can read their own data (via RLS)
GRANT SELECT ON public.users TO authenticated;

-- Games, products, promos, vouchers - read access
GRANT SELECT ON public.games TO authenticated;
GRANT SELECT ON public.game_products TO authenticated;
GRANT SELECT ON public.promos TO authenticated;
GRANT SELECT ON public.vouchers TO authenticated;

-- Orders and payments - users can see their own (via RLS)
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.payments TO authenticated;

-- Wishlists - users can manage their own (via RLS)
GRANT SELECT ON public.wishlists TO authenticated;

-- Points ledger - users can see their own (via RLS)
GRANT SELECT ON public.points_ledger TO authenticated;

-- Notifications - users can see their own (via RLS)
GRANT SELECT ON public.notifications TO authenticated;

-- Supplier requests - admin only via RLS
GRANT SELECT ON public.supplier_requests TO authenticated;

-- =====================================================
-- STEP 6: Verify the changes
-- =====================================================

-- Check current grants for anon
SELECT
  'Verification: Anon Grants' as check_name,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND grantee = 'anon'
ORDER BY table_name, privilege_type;

-- Expected result:
-- anon should ONLY have SELECT on:
--   - games
--   - game_products
--   - promos
--   - vouchers
-- And USAGE on public schema

-- If you see INSERT, UPDATE, DELETE, TRUNCATE, etc. for anon, something is wrong!

SELECT '========================================' as separator;
SELECT 'RLS Security Fix Applied!' as message;
SELECT 'Please verify anon grants show only SELECT on public tables above.' as note;
