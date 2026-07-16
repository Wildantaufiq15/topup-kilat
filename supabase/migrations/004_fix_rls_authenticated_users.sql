-- =====================================================
-- Topup Kilat - RLS Fix v005
-- Fix INSERT policies for authenticated users
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. PROBLEM: Users cannot INSERT into users table during registration
-- SOLUTION: Add INSERT policy for authenticated users
-- =====================================================

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create INSERT policy for authenticated users (registration)
CREATE POLICY "Users can insert own profile"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (
  id = (auth.uid())::uuid
);

-- =====================================================
-- 2. PROBLEM: Users cannot INSERT into orders table when logged in
-- SOLUTION: Add INSERT policy for authenticated users
-- =====================================================

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;

-- Create INSERT policy for authenticated users (logged in checkout)
CREATE POLICY "Users can insert own orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (auth.uid())::uuid
);

-- =====================================================
-- 3. PROBLEM: Users cannot SELECT own orders
-- SOLUTION: Ensure SELECT policy exists
-- =====================================================

DROP POLICY IF EXISTS "Users can select own orders" ON public.orders;

CREATE POLICY "Users can select own orders"
ON public.orders FOR SELECT
TO authenticated
USING (
  user_id = (auth.uid())::uuid
);

-- =====================================================
-- 4. PROBLEM: Users cannot INSERT into payments table when logged in
-- SOLUTION: Add INSERT policy for authenticated users
-- =====================================================

DROP POLICY IF EXISTS "Users can insert payments for own orders" ON public.payments;

CREATE POLICY "Users can insert payments for own orders"
ON public.payments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = payments.order_id::uuid
    AND o.user_id = (auth.uid())::uuid
  )
);

-- =====================================================
-- 5. PROBLEM: Users cannot SELECT own payments
-- SOLUTION: Ensure SELECT policy exists
-- =====================================================

DROP POLICY IF EXISTS "Users can select payments for own orders" ON public.payments;

CREATE POLICY "Users can select payments for own orders"
ON public.payments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = payments.order_id::uuid
    AND o.user_id = (auth.uid())::uuid
  )
);

-- =====================================================
-- 6. VERIFICATION
-- =====================================================

SELECT 'RLS Fix v005 Complete!' as status;
SELECT 'All authenticated INSERT/SELECT policies created!' as info;
