-- =====================================================
-- Topup Kilat - Price Display Feature v012
-- Add price_display column for showing strikethrough prices
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add price_display column
ALTER TABLE public.game_products
ADD COLUMN IF NOT EXISTS price_display INTEGER DEFAULT NULL;

-- Verification
SELECT 'Price Display Migration Complete!' as status;
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'game_products'
AND column_name = 'price_display';
