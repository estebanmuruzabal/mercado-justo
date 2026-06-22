-- User profile location privacy settings (global, any coordinates).

ALTER TABLE public."user"
  ADD COLUMN IF NOT EXISTS location_visibility boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS location_precision text NOT NULL DEFAULT 'city',
  ADD COLUMN IF NOT EXISTS location_city text,
  ADD COLUMN IF NOT EXISTS location_province text;

ALTER TABLE public."user"
  DROP CONSTRAINT IF EXISTS user_location_precision_check;

ALTER TABLE public."user"
  ADD CONSTRAINT user_location_precision_check
  CHECK (location_precision IN ('exact', '50m', '100m', '500m', '1km', 'city'));

COMMENT ON COLUMN public."user".location_visibility IS 'When true, public location may be shown to other users (future discovery).';
COMMENT ON COLUMN public."user".location_precision IS 'Public location fuzz level: exact, 50m, 100m, 500m, 1km, city.';
COMMENT ON COLUMN public."user".location_city IS 'Reverse-geocoded city/town for city-level public preview.';
COMMENT ON COLUMN public."user".location_province IS 'Reverse-geocoded state/region/country for city-level public preview.';
