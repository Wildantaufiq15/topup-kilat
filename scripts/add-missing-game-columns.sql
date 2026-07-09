-- =====================================================
-- Topup Kilat - Add Missing Columns to Games Table
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add banner column
ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS banner TEXT;

-- Add description column
ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add featured column (for homepage featured games)
ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Add requires_server_id column
ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS requires_server_id BOOLEAN DEFAULT true;

-- Update existing games to have default values
UPDATE public.games SET featured = false WHERE featured IS NULL;
UPDATE public.games SET requires_server_id = true WHERE requires_server_id IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'games'
ORDER BY ordinal_position;
