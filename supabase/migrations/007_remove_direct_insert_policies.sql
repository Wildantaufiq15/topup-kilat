-- =====================================================
-- Topup Kilat - RLS Policy Update v007
-- Remove direct INSERT policies for orders and payments
--
-- RATIONALE:
-- After implementing secure server-side order creation at /api/orders/create,
-- all order creation should go through the validated API route.
-- Direct INSERT via Supabase client bypasses server-side validation.
--
-- BEFORE APPLYING:
-- 1. Ensure /api/orders/create endpoint is working correctly
-- 2. Ensure checkout page uses the new API endpoint (not client-side createOrder)
-- 3. Run regression tests to verify checkout flows work
-- 4. Review the code that uses direct inserts
--
-- REVERT: Run migration 002_fix_rls_guest_checkout.sql to restore
-- =====================================================

BEGIN;

-- =====================================================
-- 1. REMOVE: Direct INSERT policy for anon on orders
-- =====================================================
-- This was for guest checkout, but now guest checkout
-- should use /api/orders/create which uses service role key

DROP POLICY IF EXISTS "Anon can insert own orders" ON public.orders;

-- =====================================================
-- 2. REMOVE: Direct INSERT policy for authenticated users on orders
-- =====================================================
-- This was for logged-in users to create orders directly,
-- but now all order creation goes through /api/orders/create

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;

-- =====================================================
-- 3. REMOVE: Direct INSERT policy for anon on payments
-- =====================================================
-- Payment creation should go through /api/payments/create

DROP POLICY IF EXISTS "Anon can insert payments for guest orders" ON public.payments;

-- =====================================================
-- 4. REMOVE: Direct INSERT policy for authenticated on payments
-- =====================================================
-- Payment creation should go through /api/payments/create

DROP POLICY IF EXISTS "Users can insert payments for own orders" ON public.payments;

-- =====================================================
-- 5. KEEP: SELECT policies for orders (needed for viewing orders)
-- =====================================================
-- These policies are NOT being removed:
-- - "Anon can select own orders" (for guest order history)
-- - "Users can select own orders" (for logged-in order history)
-- - "Admins can select all orders" (for admin panel)

-- =====================================================
-- 6. KEEP: SELECT policies for payments (needed for viewing payments)
-- =====================================================
-- These policies are NOT being removed:
-- - "Anon can select payments for guest orders"
-- - "Users can select payments for own orders"
-- - "Admins can select all payments"

-- =====================================================
-- 7. REVOKE INSERT permissions from anon/authenticated
-- =====================================================
-- This is redundant with RLS policies but adds defense in depth

REVOKE INSERT ON public.orders FROM anon;
REVOKE INSERT ON public.orders FROM authenticated;
REVOKE INSERT ON public.payments FROM anon;
REVOKE INSERT ON public.payments FROM authenticated;

-- =====================================================
-- 8. VERIFICATION
-- =====================================================

SELECT 'RLS Policy Update v007 Complete!' as status;

-- Show remaining policies
SELECT 'Remaining policies on orders table:' as info;
SELECT policyname, cmd, permissive FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders';

SELECT 'Remaining policies on payments table:' as info;
SELECT policyname, cmd, permissive FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payments';

-- Show current grants
SELECT 'Current grants on orders:' as info;
SELECT grantee, privilege_type FROM information_schema.table_privileges WHERE table_schema = 'public' AND table_name = 'orders';

SELECT 'Current grants on payments:' as info;
SELECT grantee, privilege_type FROM information_schema.table_privileges WHERE table_schema = 'public' AND table_name = 'payments';

COMMIT;
