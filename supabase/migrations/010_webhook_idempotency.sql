-- =====================================================
-- Topup Kilat - Webhook Idempotency v010
-- Add payment_callback_log table for deduplication
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. Create payment_callback_log table
-- Tracks processed callbacks to prevent duplicate processing
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payment_callback_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trx_id VARCHAR(100) UNIQUE NOT NULL,
  merchant_ref VARCHAR(100),
  event_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  raw_payload JSONB NOT NULL,
  signature VARCHAR(255),
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
CREATE POLICY "No public access to callback log"
ON public.payment_callback_log
FOR ALL
TO public
USING (false);

-- Service role can do everything
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
