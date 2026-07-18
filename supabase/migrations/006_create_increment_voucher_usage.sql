-- Create RPC function to increment voucher usage safely
-- This prevents race conditions when multiple orders use the same voucher simultaneously
--
-- Features:
-- 1. Atomic increment (UPDATE is atomic in PostgreSQL)
-- 2. Limit check: Only increments if used_quota < usage_limit
-- 3. Active check: Only increments if voucher is active
--
-- Returns:
-- 1 if increment successful
-- 0 if voucher not found or limit reached

CREATE OR REPLACE FUNCTION public.increment_voucher_usage(voucher_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  -- Atomic increment with limit check
  -- Only update if:
  -- 1. Voucher exists and is active
  -- 2. usage_limit is NULL (unlimited) OR used_quota < usage_limit
  UPDATE public.vouchers
  SET
    used_quota = used_quota + 1,
    updated_at = NOW()
  WHERE id = voucher_id
    AND is_active = true
    AND (usage_limit IS NULL OR used_quota < usage_limit);

  GET DIAGNOSTICS rows_updated = ROW_COUNT;

  -- Return 1 if updated, 0 if not (limit reached or not found)
  RETURN rows_updated;
END;
$$;

-- Grant execute permission to authenticated users and anon (for guest checkout)
GRANT EXECUTE ON FUNCTION public.increment_voucher_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_voucher_usage(UUID) TO anon;
