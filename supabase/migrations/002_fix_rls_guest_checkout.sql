-- =====================================================
-- Topup Kilat - RLS Fix v004
-- Fix guest checkout, profile creation, and auth issues
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. PROBLEM: Guest checkout fails with "permission denied for table orders"
-- SOLUTION: Add INSERT policy for anon (unauthenticated users)
-- =====================================================

-- Drop existing anon insert policy if exists
DROP POLICY IF EXISTS "Anon can insert own orders" ON public.orders;

-- Create INSERT policy for anon (guest checkout)
CREATE POLICY "Anon can insert own orders"
ON public.orders FOR INSERT
TO anon
WITH CHECK (
  -- Guest orders have user_id = NULL
  user_id IS NULL
);

-- =====================================================
-- 2. PROBLEM: Profile creation fails after register (users table)
-- SOLUTION: Add INSERT policy for authenticated users
-- =====================================================

-- Drop existing insert policy if exists
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create INSERT policy for authenticated users (registration)
CREATE POLICY "Users can insert own profile"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (
  id = (auth.uid())::uuid
);

-- =====================================================
-- 3. PROBLEM: Payments INSERT fails for guest orders
-- SOLUTION: Add INSERT policy for anon
-- =====================================================

-- Drop existing anon insert policy if exists
DROP POLICY IF EXISTS "Anon can insert payments for guest orders" ON public.payments;

-- Create INSERT policy for anon (guest checkout payments)
CREATE POLICY "Anon can insert payments for guest orders"
ON public.payments FOR INSERT
TO anon
WITH CHECK (
  -- Only allow payment for guest orders (user_id = NULL)
  -- Cast order_id to uuid for comparison
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = payments.order_id::uuid
    AND o.user_id IS NULL
  )
);

-- =====================================================
-- 4. PROBLEM: .single() throws 406 when no data found
-- SOLUTION: Add SELECT policy for anon to read their own orders/payments
-- =====================================================

-- Drop existing policies if exists
DROP POLICY IF EXISTS "Anon can select own orders" ON public.orders;
DROP POLICY IF EXISTS "Anon can select payments for guest orders" ON public.payments;

-- Create SELECT policy for anon (guest orders)
CREATE POLICY "Anon can select own orders"
ON public.orders FOR SELECT
TO anon
USING (
  user_id IS NULL
);

-- Create SELECT policy for anon (guest payments)
CREATE POLICY "Anon can select payments for guest orders"
ON public.payments FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = payments.order_id::uuid
    AND o.user_id IS NULL
  )
);

-- =====================================================
-- FIX: Add INSERT policy for authenticated users (logged in checkout)
-- =====================================================

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;

CREATE POLICY "Users can insert own orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (auth.uid())::uuid
);

-- Also add SELECT policy for authenticated users' own orders
DROP POLICY IF EXISTS "Users can select own orders" ON public.orders;

CREATE POLICY "Users can select own orders"
ON public.orders FOR SELECT
TO authenticated
USING (
  user_id = (auth.uid())::uuid
);

-- =====================================================
-- 5. Fix is_admin() function to handle case sensitivity
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  user_role text;
BEGIN
  -- Try to get auth.uid()
  BEGIN
    current_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;

  -- If no user, return false
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Get user role (case insensitive)
  SELECT LOWER(u.role) INTO user_role
  FROM public.users u
  WHERE u.id = current_user_id
  AND u.is_active = true;

  -- Return true if admin
  RETURN user_role IN ('admin', 'super_admin');
END;
$$;

-- =====================================================
-- 6. Grant additional permissions to anon
-- =====================================================

GRANT INSERT ON public.orders TO anon;
GRANT INSERT ON public.payments TO anon;
GRANT SELECT ON public.orders TO anon;
GRANT SELECT ON public.payments TO anon;

-- =====================================================
-- 7. Create users table indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);

-- =====================================================
-- 8. VERIFICATION
-- =====================================================

SELECT 'RLS Fix v004 Complete!' as status;
SELECT 'Policies created:' as info;
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('orders', 'users', 'payments');
