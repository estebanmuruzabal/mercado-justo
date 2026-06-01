-- R6.0b/c: assigned_at on inventory units + tags sync in listing→publication.

ALTER TABLE public.ditto_bot_inventory_unit
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz;

COMMENT ON COLUMN public.ditto_bot_inventory_unit.assigned_at IS
  'R6.0c: Timestamp when unit was assigned to a regional vendor.';

CREATE OR REPLACE FUNCTION public.sync_listing_to_publication()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_taxonomy_id uuid;
  v_attributes jsonb;
  v_tags jsonb;
BEGIN
  v_taxonomy_id := public.ensure_taxonomy_node_for_category(NEW.category_id);

  v_attributes := COALESCE(NEW.characteristics, '{}'::jsonb);

  IF NEW.characteristics ? 'tags' AND jsonb_typeof(NEW.characteristics->'tags') = 'array' THEN
    v_tags := NEW.characteristics->'tags';
    v_attributes := v_attributes || jsonb_build_object('tags', v_tags);
  END IF;

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
-- ALTER TABLE ditto_bot_inventory_unit DROP COLUMN IF EXISTS assigned_at;
-- Restore sync_listing_to_publication from 20260607121000_r60_add_ditto_bot_product_columns.sql
