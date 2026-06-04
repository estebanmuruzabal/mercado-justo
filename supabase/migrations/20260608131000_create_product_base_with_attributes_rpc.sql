-- R3.1: Atomically create Product Base and its dynamic attributes.

CREATE OR REPLACE FUNCTION public.create_product_base_with_attributes(
  p_product_base_id uuid,
  p_name text,
  p_slug text,
  p_description text,
  p_category_id uuid,
  p_subcategory_id uuid,
  p_type text,
  p_status text,
  p_base_image_url text,
  p_image_strategy text,
  p_attributes jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attributes jsonb := COALESCE(p_attributes, '[]'::jsonb);
BEGIN
  IF jsonb_typeof(v_attributes) <> 'array' THEN
    RAISE EXCEPTION 'p_attributes must be a JSON array';
  END IF;

  INSERT INTO public.product_base (
    id,
    name,
    slug,
    description,
    category_id,
    subcategory_id,
    type,
    status,
    base_image_url,
    image_strategy
  )
  VALUES (
    p_product_base_id,
    btrim(p_name),
    btrim(p_slug),
    NULLIF(btrim(p_description), ''),
    p_category_id,
    p_subcategory_id,
    p_type,
    COALESCE(p_status, 'DRAFT'),
    NULLIF(btrim(p_base_image_url), ''),
    p_image_strategy
  );

  INSERT INTO public.product_base_attribute (
    product_base_id,
    key,
    label,
    description,
    type,
    required,
    default_value,
    placeholder,
    options,
    validation,
    sort_order,
    is_visible,
    is_filterable,
    is_searchable,
    is_variant_dimension,
    allow_variant_pricing,
    score_contribution
  )
  SELECT
    p_product_base_id,
    btrim(attr.key),
    btrim(attr.label),
    NULLIF(btrim(attr.description), ''),
    attr.type,
    COALESCE(attr.required, false),
    attr.default_value,
    NULLIF(btrim(attr.placeholder), ''),
    attr.options,
    attr.validation,
    COALESCE(attr.sort_order, 0),
    COALESCE(attr.is_visible, true),
    COALESCE(attr.is_filterable, false),
    COALESCE(attr.is_searchable, false),
    COALESCE(attr.is_variant_dimension, false),
    COALESCE(attr.allow_variant_pricing, false),
    attr.score_contribution
  FROM jsonb_to_recordset(v_attributes) AS attr(
    key text,
    label text,
    description text,
    type text,
    required boolean,
    default_value jsonb,
    placeholder text,
    options jsonb,
    validation jsonb,
    sort_order integer,
    is_visible boolean,
    is_filterable boolean,
    is_searchable boolean,
    is_variant_dimension boolean,
    allow_variant_pricing boolean,
    score_contribution jsonb
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_product_base_with_attributes(
  uuid,
  text,
  text,
  text,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  jsonb
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_product_base_with_attributes(
  uuid,
  text,
  text,
  text,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  jsonb
) TO service_role;

COMMENT ON FUNCTION public.create_product_base_with_attributes(
  uuid,
  text,
  text,
  text,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  jsonb
) IS 'Creates a product_base row with a caller-provided id and its product_base_attribute rows atomically.';

-- ROLLBACK (manual):
-- DROP FUNCTION IF EXISTS public.create_product_base_with_attributes(uuid, text, text, text, uuid, uuid, text, text, text, text, jsonb);
