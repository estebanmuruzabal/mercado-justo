-- R6.0a M1: DittoBot product flags on listing + sync to publication attributes.

ALTER TABLE public.listing
  ADD COLUMN IF NOT EXISTS is_ditto_bot boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ditto_bot_settings jsonb,
  ADD COLUMN IF NOT EXISTS price_mode text NOT NULL DEFAULT 'centralized'
    CHECK (price_mode IN ('centralized', 'suggested'));

COMMENT ON COLUMN public.listing.is_ditto_bot IS
  'R6.0a: Hardware DittoBot product. Catalog owned by Vendor Oficial store.';
COMMENT ON COLUMN public.listing.ditto_bot_settings IS
  'R6.0a: Operational flags only — never serial_number or activation_code.';
COMMENT ON COLUMN public.listing.price_mode IS
  'R6.0a: centralized (v1 SuperAdmin only) | suggested (future regional).';

CREATE OR REPLACE FUNCTION public.sync_listing_to_publication()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_taxonomy_id uuid;
  v_attributes jsonb;
BEGIN
  v_taxonomy_id := public.ensure_taxonomy_node_for_category(NEW.category_id);

  v_attributes := COALESCE(NEW.characteristics, '{}'::jsonb);
  IF NEW.is_ditto_bot THEN
    v_attributes := v_attributes
      || jsonb_build_object(
        'isDittoBot', true,
        'dittoBotSettings', COALESCE(NEW.ditto_bot_settings, '{}'::jsonb),
        'priceMode', NEW.price_mode
      );
  END IF;

  INSERT INTO public.publication (
    id, owner_type, owner_id, publication_type, kind, structural_role, taxonomy_node_id,
    lifecycle_state, visibility, moderation_status, moderation_reason,
    title, body, attributes_json, latitude, longitude, is_transactable,
    legacy_listing_id, created_at, updated_at
  )
  VALUES (
    NEW.id,
    'store',
    NEW.store_id,
    NEW.listing_type::text,
    'base',
    'root',
    v_taxonomy_id,
    CASE
      WHEN NEW.moderation_status IN ('hidden', 'rejected') THEN 'suspended'
      WHEN NEW.status = 'published' AND NEW.moderation_status = 'approved' THEN 'published'
      WHEN NEW.status = 'published' THEN 'pending_review'
      ELSE 'draft'
    END,
    'public',
    NEW.moderation_status,
    NEW.moderation_reason,
    NEW.title,
    NEW.description,
    v_attributes,
    NEW.latitude,
    NEW.longitude,
    NEW.listing_type::text IN ('product', 'service', 'property', 'experience'),
    NEW.id,
    NEW.created_at,
    now()
  )
  ON CONFLICT (legacy_listing_id) DO UPDATE SET
    publication_type = EXCLUDED.publication_type,
    taxonomy_node_id = EXCLUDED.taxonomy_node_id,
    structural_role = 'root',
    lifecycle_state = EXCLUDED.lifecycle_state,
    moderation_status = EXCLUDED.moderation_status,
    moderation_reason = EXCLUDED.moderation_reason,
    title = EXCLUDED.title,
    body = EXCLUDED.body,
    attributes_json = EXCLUDED.attributes_json,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = now();
  RETURN NEW;
END;
$$;

-- ROLLBACK (manual):
-- ALTER TABLE public.listing DROP COLUMN IF EXISTS is_ditto_bot;
-- ALTER TABLE public.listing DROP COLUMN IF EXISTS ditto_bot_settings;
-- ALTER TABLE public.listing DROP COLUMN IF EXISTS price_mode;
-- Restore prior sync_listing_to_publication from 20260601120000 migration.
