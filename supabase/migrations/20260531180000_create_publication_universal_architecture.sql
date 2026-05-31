-- Publication Universal Architecture (Ditto Marketplace)
-- Phase 1-6: registry, taxonomy, publication, engagement, transactions, legacy compat

-- Extend legacy enum for experience (registry persistable type)
ALTER TYPE public.listing_type ADD VALUE IF NOT EXISTS 'experience';

-- ── Type registry ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.publication_type_definition (
  code text PRIMARY KEY,
  display_name text NOT NULL,
  ecosystem text NOT NULL DEFAULT 'market',
  capabilities text[] NOT NULL DEFAULT '{}',
  default_offer_model text NOT NULL DEFAULT 'fixed',
  schema_version integer NOT NULL DEFAULT 1,
  attribute_schema jsonb NOT NULL DEFAULT '{}',
  is_persistable boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.publication_type_definition (code, display_name, ecosystem, capabilities, default_offer_model, is_persistable, is_active)
VALUES
  ('product', 'Productos', 'market', ARRAY['transactable','has_variants','stock','geolocated','reviewable'], 'fixed', true, true),
  ('service', 'Servicios', 'market', ARRAY['transactable','hourly','geolocated','reviewable'], 'hourly', true, true),
  ('property', 'Propiedades', 'market', ARRAY['transactable','geolocated','reviewable'], 'negotiable', true, true),
  ('experience', 'Experiencias', 'world', ARRAY['transactable','booking','geolocated','reviewable','datetime'], 'fixed', true, true),
  ('event', 'Eventos', 'world', ARRAY['transactable','booking','datetime','geolocated','reviewable'], 'fixed', false, true),
  ('recipe', 'Recetas', 'life', ARRAY['reviewable','composable','followable'], 'none', false, true),
  ('job', 'Empleos', 'life', ARRAY['application_flow','geolocated'], 'none', false, true),
  ('project', 'Proyectos', 'world', ARRAY['followable','composable','reviewable'], 'negotiable', false, true),
  ('channel', 'Canales', 'community', ARRAY['followable'], 'none', false, true),
  ('dittobot', 'DittoBots', 'bots', ARRAY['followable'], 'subscription', false, true),
  ('resource', 'Recursos', 'life', ARRAY['downloadable','reviewable'], 'free', false, true),
  ('alliance', 'Alianzas', 'world', ARRAY['followable'], 'none', false, true)
ON CONFLICT (code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  ecosystem = EXCLUDED.ecosystem,
  capabilities = EXCLUDED.capabilities,
  default_offer_model = EXCLUDED.default_offer_model,
  is_persistable = EXCLUDED.is_persistable,
  is_active = EXCLUDED.is_active;

ALTER TABLE public.publication_type_definition ENABLE ROW LEVEL SECURITY;

CREATE POLICY "publication_type_definition_select_authenticated"
  ON public.publication_type_definition FOR SELECT
  TO authenticated
  USING (true);

-- ── Taxonomy (evolution of category) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.taxonomy_node (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.taxonomy_node(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  allowed_types text[] NOT NULL DEFAULT ARRAY['product'],
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  metadata_json jsonb NOT NULL DEFAULT '{}',
  legacy_category_id uuid UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS taxonomy_node_parent_id_idx ON public.taxonomy_node(parent_id);

INSERT INTO public.taxonomy_node (id, parent_id, name, slug, allowed_types, is_visible, legacy_category_id, created_at)
SELECT
  c.id,
  c.parent_id,
  c.name,
  lower(regexp_replace(c.name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(c.id::text, 1, 8),
  ARRAY[c.listing_type::text],
  c.is_visible,
  c.id,
  c.created_at
FROM public.category c
ON CONFLICT (legacy_category_id) DO NOTHING;

ALTER TABLE public.taxonomy_node ENABLE ROW LEVEL SECURITY;

CREATE POLICY "taxonomy_node_select_all"
  ON public.taxonomy_node FOR SELECT
  USING (is_visible = true OR auth.role() = 'service_role');

-- ── Publication (universal publishable entity) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.publication (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type text NOT NULL DEFAULT 'store' CHECK (owner_type IN ('user', 'store', 'org')),
  owner_id uuid NOT NULL,
  publication_type text NOT NULL REFERENCES public.publication_type_definition(code),
  kind text NOT NULL DEFAULT 'base' CHECK (kind IN ('base', 'variant', 'recipe', 'instance')),
  parent_publication_id uuid REFERENCES public.publication(id) ON DELETE SET NULL,
  taxonomy_node_id uuid NOT NULL REFERENCES public.taxonomy_node(id) ON DELETE RESTRICT,
  taxonomy_path text,
  lifecycle_state text NOT NULL DEFAULT 'draft' CHECK (
    lifecycle_state IN ('draft', 'pending_review', 'published', 'suspended', 'archived', 'deleted')
  ),
  visibility text NOT NULL DEFAULT 'public' CHECK (
    visibility IN ('public', 'unlisted', 'private', 'followers_only')
  ),
  moderation_status text NOT NULL DEFAULT 'pending',
  moderation_reason text,
  moderated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  moderated_at timestamptz,
  title text,
  summary text,
  body text,
  slug text,
  seo_json jsonb NOT NULL DEFAULT '{}',
  media_json jsonb NOT NULL DEFAULT '[]',
  attributes_json jsonb NOT NULL DEFAULT '{}',
  location_mode text NOT NULL DEFAULT 'none',
  latitude numeric,
  longitude numeric,
  region_code text,
  offer_model text NOT NULL DEFAULT 'fixed',
  is_transactable boolean NOT NULL DEFAULT false,
  view_count integer NOT NULL DEFAULT 0,
  follower_count integer NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  rating_avg numeric(3,2) NOT NULL DEFAULT 0,
  legacy_listing_id uuid UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  archived_at timestamptz,
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS publication_owner_idx ON public.publication(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS publication_type_lifecycle_idx ON public.publication(publication_type, lifecycle_state);
CREATE INDEX IF NOT EXISTS publication_taxonomy_path_idx ON public.publication(taxonomy_path);

INSERT INTO public.publication (
  id, owner_type, owner_id, publication_type, kind, taxonomy_node_id,
  lifecycle_state, visibility, moderation_status, moderation_reason,
  title, body, attributes_json, latitude, longitude, is_transactable,
  legacy_listing_id, created_at, published_at
)
SELECT
  l.id,
  'store',
  l.store_id,
  l.listing_type::text,
  'base',
  COALESCE(tn.id, l.category_id),
  CASE
    WHEN l.moderation_status IN ('hidden', 'rejected') THEN 'suspended'
    WHEN l.status = 'published' AND l.moderation_status = 'approved' THEN 'published'
    WHEN l.status = 'published' THEN 'pending_review'
    ELSE 'draft'
  END,
  'public',
  l.moderation_status,
  l.moderation_reason,
  l.title,
  l.description,
  COALESCE(l.characteristics, '{}'::jsonb),
  l.latitude,
  l.longitude,
  l.listing_type::text IN ('product', 'service', 'property'),
  l.id,
  l.created_at,
  CASE WHEN l.status = 'published' THEN l.created_at ELSE NULL END
FROM public.listing l
LEFT JOIN public.taxonomy_node tn ON tn.legacy_category_id = l.category_id
ON CONFLICT (legacy_listing_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.publication_composition (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_publication_id uuid NOT NULL REFERENCES public.publication(id) ON DELETE CASCADE,
  child_publication_id uuid NOT NULL REFERENCES public.publication(id) ON DELETE CASCADE,
  composition_type text NOT NULL CHECK (composition_type IN ('base_variant', 'base_recipe', 'derived')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_publication_id, child_publication_id)
);

ALTER TABLE public.publication ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_composition ENABLE ROW LEVEL SECURITY;

CREATE POLICY "publication_select_published"
  ON public.publication FOR SELECT
  USING (
    lifecycle_state = 'published'
    AND visibility = 'public'
    AND moderation_status = 'approved'
  );

CREATE POLICY "publication_select_owner"
  ON public.publication FOR SELECT
  TO authenticated
  USING (owner_type = 'store' AND owner_id = auth.uid());

-- ── Engagement ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.publication_review (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id uuid NOT NULL REFERENCES public.publication(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (publication_id, author_id)
);

CREATE TABLE IF NOT EXISTS public.publication_follow (
  publication_id uuid NOT NULL REFERENCES public.publication(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (publication_id, user_id)
);

ALTER TABLE public.publication_review ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_follow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "publication_review_select_public"
  ON public.publication_review FOR SELECT USING (true);

CREATE POLICY "publication_review_insert_own"
  ON public.publication_review FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- ── Cart (server-side, replaces localStorage over time) ──────────────────────
CREATE TABLE IF NOT EXISTS public.cart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cart_line (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.cart(id) ON DELETE CASCADE,
  line_kind text NOT NULL DEFAULT 'offer_variant' CHECK (line_kind IN ('offer_variant', 'publication', 'custom')),
  publication_id uuid REFERENCES public.publication(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.listing_variant(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL,
  title_snapshot text NOT NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cart_id, variant_id)
);

ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_line ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cart_own"
  ON public.cart FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "cart_line_own"
  ON public.cart_line FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.cart c WHERE c.id = cart_id AND c.user_id = auth.uid())
  );

-- ── Transaction (polymorphic evolution of order) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_transaction (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'purchase' CHECK (
    kind IN ('purchase', 'booking', 'contract', 'enrollment', 'rental', 'donation', 'exchange')
  ),
  status text NOT NULL DEFAULT 'pending',
  payment_status text NOT NULL DEFAULT 'unpaid',
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  seller_id uuid NOT NULL REFERENCES public.store(id) ON DELETE RESTRICT,
  subtotal numeric NOT NULL DEFAULT 0,
  delivery_price numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  metadata_json jsonb NOT NULL DEFAULT '{}',
  legacy_order_id uuid UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transaction_line (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES public.marketplace_transaction(id) ON DELETE CASCADE,
  line_kind text NOT NULL DEFAULT 'offer_variant',
  publication_id uuid,
  variant_id uuid REFERENCES public.listing_variant(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price_snapshot numeric NOT NULL,
  title_snapshot text NOT NULL,
  attributes_snapshot jsonb NOT NULL DEFAULT '{}',
  fulfillment_hint text NOT NULL DEFAULT 'ship',
  legacy_order_item_id uuid UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_transaction_buyer_idx ON public.marketplace_transaction(buyer_id);
CREATE INDEX IF NOT EXISTS marketplace_transaction_seller_idx ON public.marketplace_transaction(seller_id);
CREATE INDEX IF NOT EXISTS transaction_line_transaction_idx ON public.transaction_line(transaction_id);

INSERT INTO public.marketplace_transaction (
  id, kind, status, payment_status, buyer_id, seller_id,
  subtotal, delivery_price, total, legacy_order_id, created_at
)
SELECT
  o.id, 'purchase', o.status, o.payment_status, o.buyer_id, o.seller_id,
  o.subtotal, o.delivery_price, o.total, o.id, o.created_at
FROM public."order" o
ON CONFLICT (legacy_order_id) DO NOTHING;

INSERT INTO public.transaction_line (
  id, transaction_id, line_kind, publication_id, variant_id,
  quantity, unit_price_snapshot, title_snapshot, attributes_snapshot,
  legacy_order_item_id, created_at
)
SELECT
  oi.id, oi.order_id, 'offer_variant', oi.listing_id, oi.variant_id,
  oi.quantity, oi.price_snapshot, oi.title_snapshot, oi.variant_snapshot,
  oi.id, oi.created_at
FROM public.order_item oi
ON CONFLICT (legacy_order_item_id) DO NOTHING;

ALTER TABLE public.marketplace_transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_line ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketplace_transaction_buyer_seller"
  ON public.marketplace_transaction FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- ── Sync listing → publication (Strangler) ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.ensure_taxonomy_node_for_category(p_category_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_node_id uuid;
BEGIN
  SELECT id INTO v_node_id FROM public.taxonomy_node WHERE legacy_category_id = p_category_id;
  IF v_node_id IS NOT NULL THEN
    RETURN v_node_id;
  END IF;

  INSERT INTO public.taxonomy_node (id, parent_id, name, slug, allowed_types, is_visible, legacy_category_id)
  SELECT
    c.id,
    c.parent_id,
    c.name,
    lower(regexp_replace(c.name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(c.id::text, 1, 8),
    ARRAY[c.listing_type::text],
    c.is_visible,
    c.id
  FROM public.category c
  WHERE c.id = p_category_id
  ON CONFLICT (legacy_category_id) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_node_id;

  RETURN v_node_id;
END;
$$;

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
    id, owner_type, owner_id, publication_type, kind, taxonomy_node_id,
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

DROP TRIGGER IF EXISTS trg_sync_listing_to_publication ON public.listing;
CREATE TRIGGER trg_sync_listing_to_publication
  AFTER INSERT OR UPDATE ON public.listing
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_listing_to_publication();

-- ── Legacy compat views (Phase 6 — read path migration) ──────────────────────
CREATE OR REPLACE VIEW public.listing_publication_compat AS
SELECT
  p.legacy_listing_id AS listing_id,
  p.id AS publication_id,
  p.publication_type,
  p.lifecycle_state,
  p.kind
FROM public.publication p
WHERE p.legacy_listing_id IS NOT NULL;

COMMENT ON VIEW public.listing_publication_compat IS
  'Maps legacy listing IDs to publication IDs during Ditto migration.';
