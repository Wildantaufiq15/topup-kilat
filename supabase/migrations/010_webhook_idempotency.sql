-- =====================================================
-- Topup Kilat - Webhook Idempotency v010 (Updated)
-- Add payment_callback_log table for deduplication
-- Run this in Supabase SQL Editor
--
-- IMPORTANT: Run this migration once. If table already exists with old schema,
-- you'll need to handle the constraint change manually.
-- =====================================================

-- =====================================================
-- 1. Create payment_callback_log table (IF NOT EXISTS handles existing table)
-- Tracks processed callbacks to prevent duplicate processing
--
-- Unique constraint: (trx_id, status) combination
-- This prevents race condition where same callback arrives twice
-- with the same status. If same trx_id arrives with different status,
-- it will be processed separately.
-- =====================================================

-- Drop existing table if exists (for clean migration)
DROP TABLE IF EXISTS public.payment_callback_log CASCADE;

-- Create table with composite unique constraint
CREATE TABLE public.payment_callback_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trx_id VARCHAR(100) NOT NULL,
  merchant_ref VARCHAR(100),
  event_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  raw_payload JSONB NOT NULL,
  signature VARCHAR(255),
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Unique constraint on (trx_id, status) to prevent duplicate processing
  -- If the same callback arrives twice with the same status, the second insert will fail
  CONSTRAINT unique_callback_trx_status UNIQUE (trx_id, status)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_callback_log_trx_id ON public.payment_callback_log(trx_id);
CREATE INDEX IF NOT EXISTS idx_callback_log_merchant_ref ON public.payment_callback_log(merchant_ref);
CREATE INDEX IF NOT EXISTS idx_callback_log_processed_at ON public.payment_callback_log(processed_at);

-- =====================================================
-- 2. RLS Policies
-- Only service role should access this table
-- =====================================================

ALTER TABLE public.payment_callback_log ENABLE ROW LEVEL SECURITY;

-- No public access
DROP POLICY IF EXISTS "No public access to callback log" ON public.payment_callback_log;
CREATE POLICY "No public access to callback log"
ON public.payment_callback_log
FOR ALL
TO public
USING (false);

-- Service role can do everything
DROP POLICY IF EXISTS "Service role full access to callback log" ON public.payment_callback_log;
CREATE POLICY "Service role full access to callback log"
ON public.payment_callback_log
FOR ALL
TO service_role
USING (true);

-- =====================================================
-- 3. Verification
-- =====================================================

SELECT 'Webhook Idempotency Migration Complete!' as status;

-- Check table exists
SELECT table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_name)))
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'payment_callback_log';

-- Check columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payment_callback_log'
ORDER BY ordinal_position;

-- Check constraints
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.payment_callback_log'::regclass;
