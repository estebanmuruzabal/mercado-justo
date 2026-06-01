-- R6.0a M2: Batch generation metadata for DittoBot physical inventory.

CREATE TABLE IF NOT EXISTS public.ditto_bot_inventory_batch (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.publication(id) ON DELETE RESTRICT,
  manufacturer_vendor_id uuid NOT NULL REFERENCES public.store(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  serial_prefix text NOT NULL DEFAULT 'DTB-',
  serial_start integer NOT NULL DEFAULT 1 CHECK (serial_start >= 0),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ditto_bot_inventory_batch_product_idx
  ON public.ditto_bot_inventory_batch (product_id);

CREATE INDEX IF NOT EXISTS ditto_bot_inventory_batch_manufacturer_idx
  ON public.ditto_bot_inventory_batch (manufacturer_vendor_id);

ALTER TABLE public.ditto_bot_inventory_batch ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.ditto_bot_inventory_batch IS
  'R6.0a: SuperAdmin batch generation for DittoBot hardware units. Writes via service role until R6.0c RLS.';

-- ROLLBACK (manual):
-- DROP TABLE IF EXISTS public.ditto_bot_inventory_batch;
