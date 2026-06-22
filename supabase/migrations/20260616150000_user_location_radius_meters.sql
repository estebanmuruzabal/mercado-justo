-- Continuous public location radius (slider); legacy enum buckets become reference-only.

ALTER TABLE public."user"
  ADD COLUMN IF NOT EXISTS location_radius_meters integer;

UPDATE public."user"
SET location_radius_meters = CASE
  WHEN location_precision = 'exact' THEN 0
  WHEN location_precision = '50m' THEN 50
  WHEN location_precision = '100m' THEN 100
  WHEN location_precision = '500m' THEN 500
  WHEN location_precision = '1km' THEN 1000
  ELSE NULL
END
WHERE location_radius_meters IS NULL;

ALTER TABLE public."user"
  DROP CONSTRAINT IF EXISTS user_location_precision_check;

UPDATE public."user"
SET location_precision = 'radius'
WHERE location_precision IN ('50m', '100m', '500m', '1km');

ALTER TABLE public."user"
  ADD CONSTRAINT user_location_precision_check
  CHECK (location_precision IN ('exact', 'radius', 'city'));

ALTER TABLE public."user"
  ADD CONSTRAINT user_location_radius_meters_check
  CHECK (
    (location_precision = 'exact' AND location_radius_meters = 0)
    OR (location_precision = 'radius' AND location_radius_meters IS NOT NULL AND location_radius_meters > 0)
    OR (location_precision = 'city' AND location_radius_meters IS NULL)
  );

COMMENT ON COLUMN public."user".location_radius_meters IS 'Public fuzz radius in meters: 0 exact, >0 circle, NULL city.';
