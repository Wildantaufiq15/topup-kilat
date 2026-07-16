-- =====================================================
-- Topup Kilat - Update Promos Images
-- Run this in Supabase SQL Editor
-- =====================================================

-- Update existing promos to use SVG images
UPDATE public.promos
SET image = '/promos/promo-1.svg'
WHERE image LIKE '%promo-1%' OR image IS NULL OR image = '';

UPDATE public.promos
SET image = '/promos/promo-2.svg'
WHERE image LIKE '%promo-2%';

UPDATE public.promos
SET image = '/promos/promo-3.svg'
WHERE image LIKE '%promo-3%';

-- Or create default promos if table is empty
INSERT INTO public.promos (title, subtitle, image, link, type, is_active, sort_order, starts_at)
SELECT 'Diskon 10% Top Up Pertama', 'Minimal transaksi Rp 50.000', '/promos/promo-1.svg', '/promo/cashback', 'BANNER', true, 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.promos WHERE title LIKE '%Diskon%');

INSERT INTO public.promos (title, subtitle, image, link, type, is_active, sort_order, starts_at)
SELECT 'Cashback Rp 5.000', 'Setiap Transaksi Tanpa Minimum', '/promos/promo-2.svg', '/promo/cashback', 'BANNER', true, 2, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.promos WHERE title LIKE '%Cashback%');

INSERT INTO public.promos (title, subtitle, image, link, type, is_active, sort_order, starts_at)
SELECT 'Proses Cepat 1-5 Menit', 'Diamond masuk langsung ke akun', '/promos/promo-3.svg', '/games', 'BANNER', true, 3, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.promos WHERE title LIKE '%Proses%');

-- Verify promos
SELECT id, title, image, is_active FROM public.promos ORDER BY sort_order;
