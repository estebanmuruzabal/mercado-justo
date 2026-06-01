-- R6.0a M6: Backfill R5.4 inventory units with manufacturer_vendor_id (Vendor Oficial).

DO $$
DECLARE
  v_official_id uuid;
BEGIN
  SELECT id INTO v_official_id
  FROM public.store
  WHERE is_official_ditto_bot_vendor = true
  LIMIT 1;

  IF v_official_id IS NOT NULL THEN
    UPDATE public.ditto_bot_inventory_unit
    SET manufacturer_vendor_id = v_official_id
    WHERE manufacturer_vendor_id IS NULL;
  END IF;
END $$;

-- ROLLBACK (manual): no-op (nullable column backfill).
