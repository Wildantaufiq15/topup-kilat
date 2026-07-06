-- =====================================================
-- Topup Kilat - Supabase RLS & Schema Setup
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. DISABLE RLS FOR DEVELOPMENT (Enable after setup)
-- =====================================================

-- Disable RLS on all tables for easier development
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.games DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_ledger DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_requests DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. OPTIONAL - Enable RLS with proper policies
-- (Uncomment when you're ready for production)
-- =====================================================

/*
-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Allow public read on users"
ON public.users FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow authenticated users to insert their own profile"
ON public.users FOR INSERT
TO anon
WITH CHECK (
  auth.uid() = id
);

CREATE POLICY "Allow users to update their own profile"
ON public.users FOR UPDATE
TO anon
USING (
  auth.uid() = id
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own orders"
ON public.orders FOR SELECT
TO anon
USING (
  auth.uid() = user_id
);

CREATE POLICY "Allow authenticated users to create orders"
ON public.orders FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow users to update their own orders"
ON public.orders FOR UPDATE
TO anon
USING (
  auth.uid() = user_id
);
*/

-- =====================================================
-- 3. Grant permissions to authenticated role
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =====================================================
-- 4. Verify tables exist
-- =====================================================

SELECT
    table_name,
    rowsecurity
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
