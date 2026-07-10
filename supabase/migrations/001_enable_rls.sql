-- =====================================================
-- Topup Kilat - RLS Migration v003
-- Enable Row Level Security with Least Privilege
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 0. DROP existing functions if they exist (clean slate)
-- =====================================================
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.user_role();

-- =====================================================
-- 1. HELPER FUNCTIONS (in public schema)
-- We use CASE WHEN to avoid type mismatch issues
-- =====================================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Try to cast auth.uid() to uuid
  BEGIN
    current_user_id := auth.uid()::uuid;
  EXCEPTION WHEN OTHERS THEN
    -- If cast fails, return false
    RETURN false;
  END;

  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = current_user_id
    AND role IN ('ADMIN', 'SUPER_ADMIN')
    AND is_active = true
  );
END;
$$;

-- =====================================================
-- 2. ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. USERS TABLE POLICIES
-- =====================================================

-- Users can select own profile
CREATE POLICY "Users can select own profile"
ON public.users FOR SELECT
TO authenticated
USING (
  id = (auth.uid())::uuid
);

-- Admins can select all users
CREATE POLICY "Admins can select all users"
ON public.users FOR SELECT
TO authenticated
USING (
  public.is_admin()
);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (
  id = (auth.uid())::uuid
);

-- Admins can update any user
CREATE POLICY "Admins can update any user"
ON public.users FOR UPDATE
TO authenticated
USING (
  public.is_admin()
);

-- =====================================================
-- 4. GAMES TABLE POLICIES
-- =====================================================

CREATE POLICY "Anyone can select active games"
ON public.games FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Admins can select all games"
ON public.games FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert games"
ON public.games FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update games"
ON public.games FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete games"
ON public.games FOR DELETE
TO authenticated
USING (public.is_admin());

-- =====================================================
-- 5. GAME_PRODUCTS TABLE POLICIES
-- =====================================================

-- Anyone (including anon) can select active game products
CREATE POLICY "Anyone can select active game products"
ON public.game_products FOR SELECT
TO authenticated
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = game_products.game_id
    AND g.is_active = true
  )
);

-- Also allow anon to read active products
CREATE POLICY "Anon can select active game products"
ON public.game_products FOR SELECT
TO anon
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = game_products.game_id
    AND g.is_active = true
  )
);

-- Admin override for selecting all products
CREATE POLICY "Admins can select all game products"
ON public.game_products FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert game products"
ON public.game_products FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update game products"
ON public.game_products FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete game products"
ON public.game_products FOR DELETE
TO authenticated
USING (public.is_admin());

-- =====================================================
-- 6. ORDERS TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can select own orders"
ON public.orders FOR SELECT
TO authenticated
USING (
  user_id = (auth.uid())::uuid
);

CREATE POLICY "Admins can select all orders"
ON public.orders FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Users can insert own orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (auth.uid())::uuid
);

-- NO UPDATE/DELETE policy - status updates via service_role only

-- =====================================================
-- 7. PAYMENTS TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can select payments for own orders"
ON public.payments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = payments.order_id
    AND o.user_id = (auth.uid())::uuid
  )
);

CREATE POLICY "Admins can select all payments"
ON public.payments FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Users can insert payments for own orders"
ON public.payments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = payments.order_id
    AND o.user_id = (auth.uid())::uuid
  )
);

-- NO UPDATE/DELETE policy - status updates via service_role only

-- =====================================================
-- 8. VOUCHERS TABLE POLICIES
-- =====================================================

CREATE POLICY "Anyone can select active vouchers"
ON public.vouchers FOR SELECT
TO public
USING (
  is_active = true
  AND (expires_at IS NULL OR expires_at > NOW())
  AND (starts_at IS NULL OR starts_at <= NOW())
);

CREATE POLICY "Admins can select all vouchers"
ON public.vouchers FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert vouchers"
ON public.vouchers FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update vouchers"
ON public.vouchers FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete vouchers"
ON public.vouchers FOR DELETE
TO authenticated
USING (public.is_admin());

-- =====================================================
-- 9. PROMOS TABLE POLICIES
-- =====================================================

CREATE POLICY "Anyone can select active promos"
ON public.promos FOR SELECT
TO public
USING (
  is_active = true
  AND (expires_at IS NULL OR expires_at > NOW())
  AND (starts_at <= NOW())
);

CREATE POLICY "Admins can select all promos"
ON public.promos FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert promos"
ON public.promos FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update promos"
ON public.promos FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete promos"
ON public.promos FOR DELETE
TO authenticated
USING (public.is_admin());

-- =====================================================
-- 10. WISHLISTS TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can select own wishlists"
ON public.wishlists FOR SELECT
TO authenticated
USING (user_id = (auth.uid())::uuid);

CREATE POLICY "Admins can select all wishlists"
ON public.wishlists FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Users can insert own wishlists"
ON public.wishlists FOR INSERT
TO authenticated
WITH CHECK (user_id = (auth.uid())::uuid);

CREATE POLICY "Users can update own wishlists"
ON public.wishlists FOR UPDATE
TO authenticated
USING (user_id = (auth.uid())::uuid);

CREATE POLICY "Users can delete own wishlists"
ON public.wishlists FOR DELETE
TO authenticated
USING (user_id = (auth.uid())::uuid);

-- =====================================================
-- 11. POINTS_LEDGER TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can select own points ledger"
ON public.points_ledger FOR SELECT
TO authenticated
USING (user_id = (auth.uid())::uuid);

CREATE POLICY "Admins can select all points ledger"
ON public.points_ledger FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert points ledger"
ON public.points_ledger FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- =====================================================
-- 12. NOTIFICATIONS TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can select own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = (auth.uid())::uuid);

CREATE POLICY "Admins can select all notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = (auth.uid())::uuid);

CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (user_id = (auth.uid())::uuid);

-- =====================================================
-- 13. SUPPLIER_REQUESTS TABLE POLICIES
-- =====================================================

CREATE POLICY "Admins can select supplier requests"
ON public.supplier_requests FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert supplier requests"
ON public.supplier_requests FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update supplier requests"
ON public.supplier_requests FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete supplier requests"
ON public.supplier_requests FOR DELETE
TO authenticated
USING (public.is_admin());

-- =====================================================
-- 14. GRANT PERMISSIONS
-- =====================================================

-- Revoke ALL from anon first
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- Grant USAGE
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant EXECUTE on functions
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Grant SELECT on public tables to anon
GRANT SELECT ON public.games TO anon;
GRANT SELECT ON public.game_products TO anon;
GRANT SELECT ON public.vouchers TO anon;
GRANT SELECT ON public.promos TO anon;

-- Grant SELECT to authenticated
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.games TO authenticated;
GRANT SELECT ON public.game_products TO authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.payments TO authenticated;
GRANT SELECT ON public.vouchers TO authenticated;
GRANT SELECT ON public.promos TO authenticated;
GRANT SELECT ON public.wishlists TO authenticated;
GRANT SELECT ON public.points_ledger TO authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT SELECT ON public.supplier_requests TO authenticated;

-- =====================================================
-- 15. VERIFICATION
-- =====================================================
SELECT 'RLS Migration Complete!' as status;
