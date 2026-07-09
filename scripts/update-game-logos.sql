-- =====================================================
-- Topup Kilat - Update Game Logos
-- Run this in Supabase SQL Editor
-- =====================================================

-- Update Mobile Legends logo
UPDATE public.games
SET logo = '/images/games/mobile-legends.svg',
    updated_at = NOW()
WHERE slug = 'mobile-legends';

-- Update Free Fire logo
UPDATE public.games
SET logo = '/images/games/free-fire.svg',
    updated_at = NOW()
WHERE slug = 'free-fire';

-- Update Genshin Impact logo
UPDATE public.games
SET logo = '/images/games/genshin-impact.svg',
    updated_at = NOW()
WHERE slug = 'genshin-impact';

-- Update PUBG Mobile logo
UPDATE public.games
SET logo = '/images/games/pubg-mobile.svg',
    updated_at = NOW()
WHERE slug = 'pubg-mobile';

-- Update Valorant logo
UPDATE public.games
SET logo = '/images/games/valorant.svg',
    updated_at = NOW()
WHERE slug = 'valorant';

-- Update Honor of Kings logo
UPDATE public.games
SET logo = '/images/games/honor-of-kings.svg',
    updated_at = NOW()
WHERE slug = 'honor-of-kings';

-- Update Call of Duty Mobile logo
UPDATE public.games
SET logo = '/images/games/cod-mobile.svg',
    updated_at = NOW()
WHERE slug = 'cod-mobile';

-- Update Wild Rift logo
UPDATE public.games
SET logo = '/images/games/wild-rift.svg',
    updated_at = NOW()
WHERE slug = 'wild-rift';

-- Update Higgs Domino logo
UPDATE public.games
SET logo = '/images/games/higgs-domino.svg',
    updated_at = NOW()
WHERE slug = 'higgs-domino';

-- Update Tower of Fantasy logo
UPDATE public.games
SET logo = '/images/games/tower-of-fantasy.svg',
    updated_at = NOW()
WHERE slug = 'tower-of-fantasy';

-- Update Apex Legends logo
UPDATE public.games
SET logo = '/images/games/apex-legends.svg',
    updated_at = NOW()
WHERE slug = 'apex-legends';

-- Update Free Fire MAX logo
UPDATE public.games
SET logo = '/images/games/free-fire-max.svg',
    updated_at = NOW()
WHERE slug = 'free-fire-max';

-- Verify updates
SELECT id, name, slug, logo FROM public.games ORDER BY sort_order;
