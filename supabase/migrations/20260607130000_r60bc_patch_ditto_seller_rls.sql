-- R6.0bc patch: DittoSeller capability + vendor read RLS for assigned inventory.

ALTER TABLE public.store
  ADD COLUMN IF NOT EXISTS can_sell_ditto_bots boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.store.can_sell_ditto_bots IS
  'R6.0bc DittoSeller: regional vendor authorized to sell assigned DittoBot stock.';

-- Regional DittoBot demo vendors (seed also sets these).
UPDATE public.store
SET can_sell_ditto_bots = true
WHERE slug IN ('dittobot-resistencia', 'dittobot-corrientes', 'dittobot-formosa');

-- DittoSeller vendors may read units assigned or sold through their store.
CREATE POLICY ditto_bot_select_assigned_vendor
  ON public.ditto_bot_inventory_unit
  FOR SELECT
  TO authenticated
  USING (
    status IN ('assigned', 'reserved', 'sold', 'activated', 'warranty', 'repair')
    AND (
      assigned_vendor_id = auth.uid()
      OR seller_vendor_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.store s
      WHERE s.id = auth.uid()
        AND s.can_sell_ditto_bots = true
    )
  );

-- ROLLBACK (manual):
-- DROP POLICY IF EXISTS ditto_bot_select_assigned_vendor ON public.ditto_bot_inventory_unit;
-- ALTER TABLE public.store DROP COLUMN IF EXISTS can_sell_ditto_bots;
