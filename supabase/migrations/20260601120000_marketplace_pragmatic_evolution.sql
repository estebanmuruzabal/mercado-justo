-- Marketplace Pragmatic Evolution: structural_role, offer, publication_relation, RLS

-- ── StructuralRole (replaces PublicationKind semantics) ─────────────────────
ALTER TABLE public.publication
  ADD COLUMN IF NOT EXISTS structural_role text NOT NULL DEFAULT 'root'
  CHECK (structural_role IN ('root', 'child'));

UPDATE public.publication
SET structural_role = CASE
  WHEN kind = 'variant' THEN 'child'
  ELSE 'root'
END
WHERE structural_role = 'root' AND kind IS NOT NULL;

CREATE INDEX IF NOT EXISTS publication_structural_role_idx
  ON public.publication(structural_role, lifecycle_state);

-- ── Offer facet (Strangler from listing_variant) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.offer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id uuid NOT NULL UNIQUE REFERENCES public.publication(id) ON DELETE CASCADE,
  pricing_model text NOT NULL DEFAULT 'fixed',
  currency text NOT NULL DEFAULT 'ARS',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.offer_variant (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offer(id) ON DELETE CASCADE,
  sku text,
  name text,
  price numeric NOT NULL DEFAULT 0,
  stock integer,
  attributes_json jsonb NOT NULL DEFAULT '{}',
  is_default boolean NOT NULL DEFAULT false,
  legacy_variant_id uuid UNIQUE REFERENCES public.listing_variant(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS offer_variant_offer_id_idx ON public.offer_variant(offer_id);

ALTER TABLE public.offer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_variant ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offer_select_public"
  ON public.offer FOR SELECT USING (true);

CREATE POLICY "offer_variant_select_public"
  ON public.offer_variant FOR SELECT USING (true);

-- Sync listing_variant → offer + offer_variant
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
    offer_id, sku, name, price, stock, attributes_json, is_default, legacy_variant_id
  )
  VALUES (
    v_offer_id,
    NEW.sku,
    NEW.name,
    NEW.price,
    NEW.stock,
    COALESCE(NEW.attributes_json, '{}'::jsonb),
    NEW.is_default,
    NEW.id
  )
  ON CONFLICT (legacy_variant_id) DO UPDATE SET
    sku = EXCLUDED.sku,
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    stock = EXCLUDED.stock,
    attributes_json = EXCLUDED.attributes_json,
    is_default = EXCLUDED.is_default,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_listing_variant_to_offer ON public.listing_variant;
CREATE TRIGGER trg_sync_listing_variant_to_offer
  AFTER INSERT OR UPDATE ON public.listing_variant
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_listing_variant_to_offer();

-- Backfill offers from existing variants
INSERT INTO public.offer (publication_id, pricing_model, is_active)
SELECT DISTINCT p.id, COALESCE(p.offer_model, 'fixed'), true
FROM public.publication p
WHERE p.legacy_listing_id IS NOT NULL
ON CONFLICT (publication_id) DO NOTHING;

INSERT INTO public.offer_variant (
  offer_id, sku, name, price, stock, attributes_json, is_default, legacy_variant_id
)
SELECT
  o.id,
  lv.sku,
  lv.name,
  lv.price,
  lv.stock,
  COALESCE(lv.attributes_json, '{}'::jsonb),
  lv.is_default,
  lv.id
FROM public.listing_variant lv
JOIN public.publication p ON p.legacy_listing_id = lv.listing_id
JOIN public.offer o ON o.publication_id = p.id
ON CONFLICT (legacy_variant_id) DO NOTHING;

-- Update listing→publication sync to set structural_role
CREATE OR REPLACE FUNCTION public.sync_listing_to_publication()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_taxonomy_id uuid;
BEGIN
  v_taxonomy_id := public.ensure_taxonomy_node_for_category(NEW.category_id);

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
    COALESCE(NEW.characteristics, '{}'::jsonb),
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

-- ── PublicationRelation (universal graph edges) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.publication_relation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_publication_id uuid NOT NULL REFERENCES public.publication(id) ON DELETE CASCADE,
  target_publication_id uuid NOT NULL REFERENCES public.publication(id) ON DELETE CASCADE,
  relation_type text NOT NULL CHECK (
    relation_type IN ('uses', 'hosted_at', 'promotes', 'maintains', 'commercial_variant_of')
  ),
  metadata_json jsonb NOT NULL DEFAULT '{}',
  visibility text NOT NULL DEFAULT 'inherit' CHECK (
    visibility IN ('inherit', 'public', 'private')
  ),
  valid_from timestamptz,
  valid_to timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_publication_id, target_publication_id, relation_type)
);

CREATE INDEX IF NOT EXISTS publication_relation_source_idx
  ON public.publication_relation(source_publication_id, relation_type);
CREATE INDEX IF NOT EXISTS publication_relation_target_idx
  ON public.publication_relation(target_publication_id, relation_type);

ALTER TABLE public.publication_relation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "publication_relation_select_public"
  ON public.publication_relation FOR SELECT
  USING (visibility IN ('public', 'inherit'));

-- Migrate publication_composition → publication_relation
INSERT INTO public.publication_relation (
  source_publication_id, target_publication_id, relation_type, metadata_json, visibility
)
SELECT
  pc.parent_publication_id,
  pc.child_publication_id,
  CASE pc.composition_type
    WHEN 'base_variant' THEN 'commercial_variant_of'
    WHEN 'base_recipe' THEN 'uses'
    ELSE 'promotes'
  END,
  jsonb_build_object('sort_order', pc.sort_order, 'migrated_from', 'publication_composition'),
  'inherit'
FROM public.publication_composition pc
ON CONFLICT (source_publication_id, target_publication_id, relation_type) DO NOTHING;

-- ── Enable persistable types: event, recipe, project (R5) ───────────────────
UPDATE public.publication_type_definition
SET is_persistable = true
WHERE code IN ('event', 'recipe', 'project');

-- ── RLS: publication owner policies (store.id = auth.uid()) ────────────────
DROP POLICY IF EXISTS "publication_select_owner" ON public.publication;

CREATE POLICY "publication_select_owner_store"
  ON public.publication FOR SELECT
  TO authenticated
  USING (owner_type = 'store' AND owner_id = auth.uid());

CREATE POLICY "publication_select_owner_user"
  ON public.publication FOR SELECT
  TO authenticated
  USING (owner_type = 'user' AND owner_id = auth.uid());

CREATE POLICY "publication_update_owner_store"
  ON public.publication FOR UPDATE
  TO authenticated
  USING (owner_type = 'store' AND owner_id = auth.uid())
  WITH CHECK (owner_type = 'store' AND owner_id = auth.uid());

CREATE POLICY "publication_update_owner_user"
  ON public.publication FOR UPDATE
  TO authenticated
  USING (owner_type = 'user' AND owner_id = auth.uid())
  WITH CHECK (owner_type = 'user' AND owner_id = auth.uid());

CREATE POLICY "publication_insert_authenticated"
  ON public.publication FOR INSERT
  TO authenticated
  WITH CHECK (
    (owner_type = 'store' AND owner_id = auth.uid())
    OR (owner_type = 'user' AND owner_id = auth.uid())
  );
