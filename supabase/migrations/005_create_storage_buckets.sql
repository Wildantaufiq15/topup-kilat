-- =====================================================
-- Topup Kilat - Create Storage Bucket
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create bucket for game images (public bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'game-images',
  'game-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for promo banners (public bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promo-banners',
  'promo-banners',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for user avatars (public bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Grant public access to read files (skip if exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read game-images') THEN
    CREATE POLICY "Public can read game-images" ON storage.objects FOR SELECT USING (bucket_id = 'game-images');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read promo-banners') THEN
    CREATE POLICY "Public can read promo-banners" ON storage.objects FOR SELECT USING (bucket_id = 'promo-banners');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can read avatars') THEN
    CREATE POLICY "Public can read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
  END IF;
END
$$;

-- Grant authenticated users write access (skip if exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated can upload game-images') THEN
    CREATE POLICY "Authenticated can upload game-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'game-images');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated can upload promo-banners') THEN
    CREATE POLICY "Authenticated can upload promo-banners" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'promo-banners');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated can upload avatars') THEN
    CREATE POLICY "Authenticated can upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
  END IF;
END
$$;

-- Verify buckets created
SELECT * FROM storage.buckets;
