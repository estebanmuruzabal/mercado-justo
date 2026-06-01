-- R6.0a M3: Extend physical inventory — product link, traceability, order refs, expanded status.

ALTER TABLE public.ditto_bot_inventory_unit
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.publication(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.ditto_bot_inventory_batch(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS firmware_version text,
  ADD COLUMN IF NOT EXISTS hardware_revision text,
  ADD COLUMN IF NOT EXISTS manufacture_date date,
  ADD COLUMN IF NOT EXISTS manufacturer_vendor_id uuid REFERENCES public.store(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS seller_vendor_id uuid REFERENCES public.store(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS installer_vendor_id uuid REFERENCES public.store(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS service_partner_id uuid REFERENCES public.store(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_vendor_id uuid REFERENCES public.store(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public."order"(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS order_item_id uuid REFERENCES public.order_item(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reserved_at timestamptz,
  ADD COLUMN IF NOT EXISTS sold_at timestamptz;

ALTER TABLE public.ditto_bot_inventory_unit
  DROP CONSTRAINT IF EXISTS ditto_bot_inventory_unit_status_check;

ALTER TABLE public.ditto_bot_inventory_unit
  ADD CONSTRAINT ditto_bot_inventory_unit_status_check
  CHECK (status IN (
    'available',
    'assigned',
    'reserved',
    'sold',
    'activated',
    'warranty',
    'repair',
    'retired'
  ));

CREATE INDEX IF NOT EXISTS ditto_bot_inventory_product_idx
  ON public.ditto_bot_inventory_unit (product_id)
  WHERE product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ditto_bot_inventory_assigned_vendor_idx
  ON public.ditto_bot_inventory_unit (assigned_vendor_id, status)
  WHERE assigned_vendor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ditto_bot_inventory_manufacturer_idx
  ON public.ditto_bot_inventory_unit (manufacturer_vendor_id);

CREATE INDEX IF NOT EXISTS ditto_bot_inventory_order_idx
  ON public.ditto_bot_inventory_unit (order_id)
  WHERE order_id IS NOT NULL;

COMMENT ON COLUMN public.ditto_bot_inventory_unit.product_id IS
  'R6.0a: Canonical DittoBot publication (Vendor Oficial catalog).';
COMMENT ON COLUMN public.ditto_bot_inventory_unit.manufacturer_vendor_id IS
  'R6.0a: Vendor Oficial DittoBots — who manufactured the batch.';
COMMENT ON COLUMN public.ditto_bot_inventory_unit.assigned_vendor_id IS
  'R6.0a: Regional vendor with assigned stock (pre-sale).';
COMMENT ON COLUMN public.ditto_bot_inventory_unit.seller_vendor_id IS
  'R6.0a: Regional vendor who sold the unit (set on order confirm, R6.0e).';

-- ROLLBACK (manual):
-- ALTER TABLE ditto_bot_inventory_unit DROP COLUMN IF EXISTS product_id, ...;
-- Restore status CHECK ('available','sold','activated','retired') from 20260605120000.
