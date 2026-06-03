-- Canonical DittoBot identity: listing_type = 'dittobot'.
-- Product Base attributes / listing.characteristics carry all operational settings.

-- Existing R6.0 rows used listing_type='product' + is_ditto_bot=true.
UPDATE public.listing
SET listing_type = 'dittobot'
WHERE is_ditto_bot = true;

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
    NEW.listing_type::text IN ('product', 'service', 'property', 'experience', 'dittobot'),
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
    is_transactable = EXCLUDED.is_transactable,
    updated_at = now();

  RETURN NEW;
END;
$$;

ALTER TABLE public.listing
  DROP COLUMN IF EXISTS ditto_bot_settings,
  DROP COLUMN IF EXISTS is_ditto_bot;

