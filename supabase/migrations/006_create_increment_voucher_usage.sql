-- Create RPC function to increment voucher usage safely
-- This prevents race conditions when multiple orders use the same voucher simultaneously

CREATE OR REPLACE FUNCTION public.increment_voucher_usage(voucher_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.vouchers
  SET
    used_quota = used_quota + 1,
    updated_at = NOW()
  WHERE id = voucher_id;

  -- If no rows updated, silently ignore (voucher may not exist)
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_voucher_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_voucher_usage(UUID) TO anon;
