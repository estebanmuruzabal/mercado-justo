-- R5.4 WP4.5: User location columns for initial device location snapshot on activation.

ALTER TABLE public.user
  ADD COLUMN IF NOT EXISTS location_lat numeric(10, 7),
  ADD COLUMN IF NOT EXISTS location_lng numeric(10, 7),
  ADD COLUMN IF NOT EXISTS location_region text;

COMMENT ON COLUMN public.user.location_lat IS 'R5.4: Optional user location — snapshot source for device activation when inherits_user_location=true.';
COMMENT ON COLUMN public.user.location_lng IS 'R5.4: Optional user location — snapshot source for device activation when inherits_user_location=true.';
COMMENT ON COLUMN public.user.location_region IS 'R5.4: Human-readable region label (e.g. Granja, Casa).';
