-- =============================================================================
-- Mercado Justo — development demo seed
-- Password for all demo users: 123456
-- Geographic focus: Resistencia, Chaco (geo search, maps, marketplace)
-- Idempotent — safe to re-run via npm run db:seed
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Merge-only taxonomy (bulk catalog from taxonomy-alimentos.json via runtime)
-- ---------------------------------------------------------------------------

do $$
begin
  perform public.seed_upsert_category(
    'd0000000-0000-4000-8000-000000000010',
    'Frutas',
    'frutas',
    'd0000000-0000-4000-8000-000000000003'
  );

  perform public.seed_upsert_category(
    'd0000000-0000-4000-8000-000000000011',
    'Verduras',
    'verduras',
    'd0000000-0000-4000-8000-000000000003'
  );

  -- 4th level under Frutas y Verduras (reuses manifest UUID)
  perform public.seed_upsert_category(
    'd0000000-0000-4000-8000-000000000004',
    'Hortalizas de Hojas',
    'hortalizas-de-hojas',
    'd0000000-0000-4000-8000-000000000003'
  );
end $$;

-- Product Base: Lechuga Romana (dynamic attribute schema for seller listings)
do $$
declare
  v_product_base_id constant uuid := 'f0000000-0000-4000-8000-000000000001';
  v_category_id constant uuid := 'd0000000-0000-4000-8000-000000000001';
  v_subcategory_id constant uuid := 'd0000000-0000-4000-8000-000000000004';
  v_image constant text :=
    'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?q=80&w=800&auto=format&fit=crop';
begin
  insert into public.product_base (
    id,
    name,
    slug,
    description,
    category_id,
    subcategory_id,
    type,
    status,
    base_image_url,
    image_strategy,
    source
  )
  values (
    v_product_base_id,
    'Lechuga Romana',
    'lechuga-romana',
    'Lechuga romana fresca — plantilla base para publicaciones de hortalizas de hoja.',
    v_category_id,
    v_subcategory_id,
    'PRODUCT',
    'ACTIVE',
    v_image,
    'BASE_ONLY',
    'seed'
  )
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    subcategory_id = excluded.subcategory_id,
    type = excluded.type,
    status = excluded.status,
    base_image_url = excluded.base_image_url,
    image_strategy = excluded.image_strategy,
    source = excluded.source,
    updated_at = now();

  insert into public.product_base_attribute (
    product_base_id,
    key,
    label,
    type,
    required,
    sort_order,
    is_visible,
    is_filterable,
    is_searchable,
    is_variant_dimension,
    allow_variant_pricing
  )
  values (
    v_product_base_id,
    'peso',
    'Peso en gramos aprox.',
    'NUMBER',
    true,
    0,
    true,
    false,
    false,
    false,
    false
  )
  on conflict (product_base_id, key) do update set
    label = excluded.label,
    type = excluded.type,
    required = excluded.required,
    sort_order = excluded.sort_order,
    is_visible = excluded.is_visible,
    is_filterable = excluded.is_filterable,
    is_searchable = excluded.is_searchable,
    is_variant_dimension = excluded.is_variant_dimension,
    allow_variant_pricing = excluded.allow_variant_pricing,
    updated_at = now();
end $$;

-- Demo auth users: see seed.dev-users.sql (runs on db reset + db:seed)

-- ---------------------------------------------------------------------------
-- Demo stores (4 vendors around Resistencia)
-- -----------------------
-- ---------------------------------------------------------------------------
-- R6.0c: Regional DittoBot vendors (assignment targets)
-- -
-- ---------------------------------------------------------------------------
-- Demo listings + variants (published, geo-tagged per store)
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Social data (reviews + followers)
-- ---------------------------------------------------------------------------
