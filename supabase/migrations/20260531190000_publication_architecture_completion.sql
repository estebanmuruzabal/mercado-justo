-- Publication architecture completion: order sync, taxonomy compat, type schemas

-- ── Templates by type + taxonomy (Phase 2) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.publication_type_schema (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_type text NOT NULL REFERENCES public.publication_type_definition(code),
  taxonomy_node_id uuid REFERENCES public.taxonomy_node(id) ON DELETE CASCADE,
  schema_version integer NOT NULL DEFAULT 1,
  template_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (publication_type, taxonomy_node_id, schema_version)
);

ALTER TABLE public.publication_type_schema ENABLE ROW LEVEL SECURITY;

CREATE POLICY "publication_type_schema_select_authenticated"
  ON public.publication_type_schema FOR SELECT
  TO authenticated
  USING (true);

-- ── Taxonomy ↔ category compat view (Phase 6) ────────────────────────────────
CREATE OR REPLACE VIEW public.category_taxonomy_compat AS
SELECT
  tn.legacy_category_id AS category_id,
  tn.id AS taxonomy_node_id,
  tn.name,
  tn.slug,
  tn.allowed_types,
  tn.parent_id
FROM public.taxonomy_node tn
WHERE tn.legacy_category_id IS NOT NULL;

COMMENT ON VIEW public.category_taxonomy_compat IS
  'Maps legacy category IDs to taxonomy_node during Ditto migration.';

-- ── Order → marketplace_transaction sync (Strangler) ─────────────────────────
CREATE OR REPLACE FUNCTION public.sync_order_to_marketplace_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.marketplace_transaction (
    id, kind, status, payment_status, buyer_id, seller_id,
    subtotal, delivery_price, total, legacy_order_id, created_at, updated_at
  )
  VALUES (
    NEW.id, 'purchase', NEW.status, NEW.payment_status, NEW.buyer_id, NEW.seller_id,
    NEW.subtotal, NEW.delivery_price, NEW.total, NEW.id, NEW.created_at, now()
  )
  ON CONFLICT (legacy_order_id) DO UPDATE SET
    status = EXCLUDED.status,
    payment_status = EXCLUDED.payment_status,
    subtotal = EXCLUDED.subtotal,
    delivery_price = EXCLUDED.delivery_price,
    total = EXCLUDED.total,
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_order_to_marketplace_transaction ON public."order";
CREATE TRIGGER trg_sync_order_to_marketplace_transaction
  AFTER INSERT OR UPDATE ON public."order"
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_order_to_marketplace_transaction();

CREATE OR REPLACE FUNCTION public.sync_order_item_to_transaction_line()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.transaction_line (
    id, transaction_id, line_kind, publication_id, variant_id,
    quantity, unit_price_snapshot, title_snapshot, attributes_snapshot,
    legacy_order_item_id, created_at
  )
  VALUES (
    NEW.id, NEW.order_id, 'offer_variant', NEW.listing_id, NEW.variant_id,
    NEW.quantity, NEW.price_snapshot, NEW.title_snapshot,
    COALESCE(NEW.variant_snapshot, '{}'::jsonb),
    NEW.id, NEW.created_at
  )
  ON CONFLICT (legacy_order_item_id) DO UPDATE SET
    quantity = EXCLUDED.quantity,
    unit_price_snapshot = EXCLUDED.unit_price_snapshot,
    title_snapshot = EXCLUDED.title_snapshot,
    attributes_snapshot = EXCLUDED.attributes_snapshot;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_order_item_to_transaction_line ON public.order_item;
CREATE TRIGGER trg_sync_order_item_to_transaction_line
  AFTER INSERT OR UPDATE ON public.order_item
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_order_item_to_transaction_line();

-- ── Order read compat view (Phase 6) ───────────────────────────────────────────
CREATE OR REPLACE VIEW public.order_transaction_compat AS
SELECT
  mt.legacy_order_id AS order_id,
  mt.id AS transaction_id,
  mt.kind,
  mt.status,
  mt.payment_status
FROM public.marketplace_transaction mt
WHERE mt.legacy_order_id IS NOT NULL;

COMMENT ON VIEW public.order_transaction_compat IS
  'Maps legacy order IDs to marketplace_transaction during Ditto migration.';
