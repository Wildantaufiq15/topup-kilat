-- =====================================================
-- Topup Kilat - Fulfillment Migration v009
-- Add Digiflazz SKU code and fulfillment tracking
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. Add buyer_sku_code to game_products
-- This links our products to Digiflazz SKU codes
-- =====================================================

ALTER TABLE public.game_products
ADD COLUMN IF NOT EXISTS buyer_sku_code VARCHAR(100);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_products_sku_code
ON public.game_products(buyer_sku_code)
WHERE buyer_sku_code IS NOT NULL;

-- =====================================================
-- 2. Add fulfillment columns to orders
-- Track Digiflazz transaction status
-- =====================================================

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fulfillment_ref VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fulfillment_rc VARCHAR(10) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fulfillment_message TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fulfillment_sn VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fulfillment_attempts INTEGER DEFAULT 0;

-- Indexes for fulfillment queries
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status
ON public.orders(fulfillment_status);

CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_ref
ON public.orders(fulfillment_ref);

-- =====================================================
-- 3. Add supplier columns to games
-- Track supplier configuration per game
-- =====================================================

ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS supplier VARCHAR(50) DEFAULT 'DIGIFLAZZ',
ADD COLUMN IF NOT EXISTS supplier_config JSONB DEFAULT NULL;

-- =====================================================
-- 4. Sample data: Mobile Legends SKU codes
-- Replace with actual Digiflazz SKU codes
-- =====================================================

-- Mobile Legends Diamond packages
UPDATE public.game_products
SET buyer_sku_code = 'ML5'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'mobile-legends')
AND name LIKE '%5 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'ML12'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'mobile-legends')
AND name LIKE '%12 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'ML17'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'mobile-legends')
AND name LIKE '%17 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'ML28'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'mobile-legends')
AND name LIKE '%28 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'ML36'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'mobile-legends')
AND name LIKE '%36 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'ML50'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'mobile-legends')
AND name LIKE '%50 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'ML100'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'mobile-legends')
AND name LIKE '%100 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'ML144'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'mobile-legends')
AND name LIKE '%144 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'ML185'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'mobile-legends')
AND name LIKE '%185 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'ML296'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'mobile-legends')
AND name LIKE '%296 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'ML408'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'mobile-legends')
AND name LIKE '%408 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'ML500'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'mobile-legends')
AND name LIKE '%500 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'ML720'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'mobile-legends')
AND name LIKE '%720 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'ML1000'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'mobile-legends')
AND name LIKE '%1000 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'ML2000'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'mobile-legends')
AND name LIKE '%2000 Diamond%';

-- Free Fire Diamond packages
UPDATE public.game_products
SET buyer_sku_code = 'FF5'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'free-fire')
AND name LIKE '%5 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'FF12'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'free-fire')
AND name LIKE '%12 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'FF50'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'free-fire')
AND name LIKE '%50 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'FF70'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'free-fire')
AND name LIKE '%70 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'FF100'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'free-fire')
AND name LIKE '%100 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'FF140'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'free-fire')
AND name LIKE '%140 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'FF200'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'free-fire')
AND name LIKE '%200 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'FF250'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'free-fire')
AND name LIKE '%250 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'FF355'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'free-fire')
AND name LIKE '%355 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'FF500'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'free-fire')
AND name LIKE '%500 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'FF720'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'free-fire')
AND name LIKE '%720 Diamond%';

UPDATE public.game_products
SET buyer_sku_code = 'FF1000'
WHERE game_id = (SELECT id FROM public.games WHERE slug = 'free-fire')
AND name LIKE '%1000 Diamond%';

-- =====================================================
-- 5. Verification
-- =====================================================

SELECT 'Fulfillment Migration Complete!' as status;

-- Check game_products columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'game_products'
AND column_name IN ('buyer_sku_code');

-- Check orders columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name LIKE 'fulfillment%';

-- Sample SKU codes
SELECT
  g.name as game,
  gp.name as product,
  gp.buyer_sku_code as sku
FROM public.game_products gp
JOIN public.games g ON g.id = gp.game_id
WHERE gp.buyer_sku_code IS NOT NULL
LIMIT 10;
