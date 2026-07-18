-- =====================================================
-- Topup Kilat - Best Seller Feature v011
-- Add is_best_seller column to game_products
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add is_best_seller column
ALTER TABLE public.game_products
ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT false;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_game_products_best_seller
ON public.game_products(is_best_seller)
WHERE is_best_seller = true;

-- Verification
SELECT 'Best Seller Migration Complete!' as status;
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'game_products'
AND column_name = 'is_best_seller';
