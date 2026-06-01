-- R6.0a M0: Vendor Oficial DittoBots — canonical commercial owner of DittoBot catalog.

ALTER TABLE public.store
  ADD COLUMN IF NOT EXISTS is_official_ditto_bot_vendor boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.store.is_official_ditto_bot_vendor IS
  'R6.0a: When true, this store owns the canonical DittoBot product catalog. At most one row.';

CREATE UNIQUE INDEX IF NOT EXISTS store_one_official_ditto_bot_vendor_idx
  ON public.store ((true))
  WHERE is_official_ditto_bot_vendor = true;

-- Reuse demo seed store slug dittobots (vendor2) as official catalog owner.
UPDATE public.store
SET is_official_ditto_bot_vendor = true
WHERE slug = 'dittobots';

-- ROLLBACK (manual):
-- DROP INDEX IF EXISTS store_one_official_ditto_bot_vendor_idx;
-- ALTER TABLE public.store DROP COLUMN IF EXISTS is_official_ditto_bot_vendor;
