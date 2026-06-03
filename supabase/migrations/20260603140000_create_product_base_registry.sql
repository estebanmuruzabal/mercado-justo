-- R3.0: Product Base registry — master templates for dynamic listing attributes.

CREATE TABLE IF NOT EXISTS public.product_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  category_id uuid NOT NULL REFERENCES public.category(id) ON DELETE RESTRICT,
  subcategory_id uuid REFERENCES public.category(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN (
    'PRODUCT',
    'SERVICE',
    'PROPERTY',
    'EXPERIENCE',
    'DITTOBOT',
    'DITTO_RECIPE'
  )),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE')),
  base_image_url text,
  image_strategy text NOT NULL DEFAULT 'BASE_OR_LISTING' CHECK (image_strategy IN (
    'BASE_ONLY',
    'BASE_OR_LISTING',
    'LISTING_REQUIRED'
  )),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_base_slug_idx ON public.product_base (slug);
CREATE INDEX IF NOT EXISTS product_base_category_status_idx ON public.product_base (category_id, status);
CREATE INDEX IF NOT EXISTS product_base_type_status_idx ON public.product_base (type, status);

COMMENT ON TABLE public.product_base IS
  'R3.0: Superadmin-managed master templates for marketplace listings.';

CREATE TABLE IF NOT EXISTS public.product_base_attribute (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_base_id uuid NOT NULL REFERENCES public.product_base(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN (
    'TEXT',
    'TEXTAREA',
    'NUMBER',
    'BOOLEAN',
    'DATE',
    'SELECT',
    'MULTISELECT',
    'IMAGE',
    'FILE',
    'LOCATION',
    'EMAIL',
    'PHONE',
    'URL',
    'CURRENCY',
    'PERCENTAGE'
  )),
  required boolean NOT NULL DEFAULT false,
  default_value jsonb,
  placeholder text,
  options jsonb,
  validation jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  is_filterable boolean NOT NULL DEFAULT false,
  is_searchable boolean NOT NULL DEFAULT false,
  is_variant_dimension boolean NOT NULL DEFAULT false,
  allow_variant_pricing boolean NOT NULL DEFAULT false,
  score_contribution jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_base_attribute_key_unique UNIQUE (product_base_id, key)
);

CREATE INDEX IF NOT EXISTS product_base_attribute_base_sort_idx
  ON public.product_base_attribute (product_base_id, sort_order);

CREATE UNIQUE INDEX IF NOT EXISTS product_base_attribute_single_variant_dimension_idx
  ON public.product_base_attribute (product_base_id)
  WHERE is_variant_dimension = true;

COMMENT ON TABLE public.product_base_attribute IS
  'R3.0: Dynamic attribute schema for a Product Base. Max 1 is_variant_dimension per base.';

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.set_product_base_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_base_updated_at ON public.product_base;
CREATE TRIGGER trg_product_base_updated_at
  BEFORE UPDATE ON public.product_base
  FOR EACH ROW EXECUTE FUNCTION public.set_product_base_updated_at();

DROP TRIGGER IF EXISTS trg_product_base_attribute_updated_at ON public.product_base_attribute;
CREATE TRIGGER trg_product_base_attribute_updated_at
  BEFORE UPDATE ON public.product_base_attribute
  FOR EACH ROW EXECUTE FUNCTION public.set_product_base_updated_at();

-- RLS
ALTER TABLE public.product_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_base_attribute ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_base_select_active
  ON public.product_base
  FOR SELECT
  TO authenticated
  USING (status = 'ACTIVE');

CREATE POLICY product_base_select_staff
  ON public.product_base
  FOR SELECT
  TO authenticated
  USING (public.is_staff());

CREATE POLICY product_base_insert_super_admin
  ON public.product_base
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY product_base_update_super_admin
  ON public.product_base
  FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY product_base_delete_super_admin
  ON public.product_base
  FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY product_base_attribute_select_active_base
  ON public.product_base_attribute
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.product_base pb
      WHERE pb.id = product_base_id
        AND (pb.status = 'ACTIVE' OR public.is_staff())
    )
  );

CREATE POLICY product_base_attribute_insert_super_admin
  ON public.product_base_attribute
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY product_base_attribute_update_super_admin
  ON public.product_base_attribute
  FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY product_base_attribute_delete_super_admin
  ON public.product_base_attribute
  FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

-- ROLLBACK (manual):
-- DROP TABLE IF EXISTS public.product_base_attribute;
-- DROP TABLE IF EXISTS public.product_base;
-- DROP FUNCTION IF EXISTS public.set_product_base_updated_at();
