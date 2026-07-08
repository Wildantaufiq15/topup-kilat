-- =====================================================
-- Fix: Add merchant_ref column to payments table
-- =====================================================

-- Add merchant_ref column if it doesn't exist
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS merchant_ref TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_merchant_ref ON public.payments(merchant_ref);

-- Verify the column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'payments' AND column_name = 'merchant_ref';
