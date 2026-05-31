-- Offer subdomain completion: soft-disable on DELETE, is_active, indexes, docs

ALTER TABLE public.offer_variant
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS offer_publication_id_idx ON public.offer(publication_id);
CREATE INDEX IF NOT EXISTS offer_variant_legacy_variant_id_idx ON public.offer_variant(legacy_variant_id);

COMMENT ON TABLE public.offer IS
  'Commercial facet of a Publication. Read-side canonical for pricing; write via listing_variant Strangler.';
COMMENT ON TABLE public.offer_variant IS
  'Sellable SKUs. Synced from listing_variant; NOT a Publication child.';

-- Re-sync upsert keeps offer_variant active
CREATE OR REPLACE FUNCTION public.sync_listing_variant_to_offer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_publication_id uuid;
  v_offer_id uuid;
BEGIN
  SELECT p.id INTO v_publication_id
  FROM public.publication p
  WHERE p.legacy_listing_id = NEW.listing_id;

  IF v_publication_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.offer (publication_id, pricing_model, is_active)
  SELECT v_publication_id, COALESCE(p.offer_model, 'fixed'), true
  FROM public.publication p
  WHERE p.id = v_publication_id
  ON CONFLICT (publication_id) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_offer_id;

  IF v_offer_id IS NULL THEN
    SELECT id INTO v_offer_id FROM public.offer WHERE publication_id = v_publication_id;
  END IF;

  INSERT INTO public.offer_variant (
    offer_id, sku, name, price, stock, attributes_json, is_default, legacy_variant_id, is_active
  )
  VALUES (
    v_offer_id,
    NEW.sku,
    NEW.name,
    NEW.price,
    NEW.stock,
    COALESCE(NEW.attributes_json, '{}'::jsonb),
    NEW.is_default,
    NEW.id,
    true
  )
  ON CONFLICT (legacy_variant_id) DO UPDATE SET
    sku = EXCLUDED.sku,
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    stock = EXCLUDED.stock,
    attributes_json = EXCLUDED.attributes_json,
    is_default = EXCLUDED.is_default,
    is_active = true,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Soft-disable offer_variant when listing_variant is deleted
CREATE OR REPLACE FUNCTION public.soft_disable_offer_variant_on_listing_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.offer_variant
  SET is_active = false, updated_at = now()
  WHERE legacy_variant_id = OLD.id;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_soft_disable_offer_variant_on_listing_delete ON public.listing_variant;
CREATE TRIGGER trg_soft_disable_offer_variant_on_listing_delete
  AFTER DELETE ON public.listing_variant
  FOR EACH ROW
  EXECUTE FUNCTION public.soft_disable_offer_variant_on_listing_delete();
