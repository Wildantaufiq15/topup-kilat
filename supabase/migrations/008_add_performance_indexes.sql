-- =====================================================
-- Topup Kilat - Performance Indexes
-- Add indexes for frequently queried columns in webhook callbacks
--
-- This migration adds indexes to optimize payment lookup queries
-- used in /api/callback/sakurupiah callback handler.
--
-- NOTE: ILIKE fallback for invoice_no was removed from callback route
-- because trx_id and merchant_ref lookups should always succeed.
-- =====================================================

BEGIN;

-- =====================================================
-- 1. payments.provider_ref index
-- Used by: callback route
-- Query: .eq('provider_ref', trx_id)
-- Purpose: Primary lookup by Sakurupiah transaction ID
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_payments_provider_ref
ON public.payments(provider_ref);

-- =====================================================
-- 2. payments.merchant_ref index
-- Used by: callback route
-- Query: .eq('merchant_ref', merchant_ref)
-- Purpose: Secondary lookup by merchant reference
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_payments_merchant_ref
ON public.payments(merchant_ref);

-- =====================================================
-- 3. orders.invoice_no index
-- Used by: payment status check API
-- Query: .eq('invoice_no', invoiceNo)
-- Purpose: Quick lookup by invoice number
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_orders_invoice_no
ON public.orders(invoice_no);

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Performance Indexes Added!' as status;

-- List all indexes on payments table
SELECT 'Indexes on payments table:' as info;
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'payments';

-- List all indexes on orders table
SELECT 'Indexes on orders table:' as info;
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'orders';

COMMIT;
