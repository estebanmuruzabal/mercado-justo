-- =============================================================================
-- Mercado Justo — development demo seed
-- Password for all demo users: 123456
-- Geographic focus: Resistencia, Chaco (geo search, maps, marketplace)
-- Idempotent — safe to re-run via npm run db:seed
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Dev taxonomy + Product Base registry (testing catalog)
-- ---------------------------------------------------------------------------

do $$
begin
  -- Food hierarchy used for Product Base + listing manager testing.
  perform public.seed_upsert_category(
    'd0000000-0000-4000-8000-000000000001',
    'Alimentos y Bebidas',
    'alimentos-y-bebidas'
  );
  perform public.seed_upsert_category(
    'd0000000-0000-4000-8000-000000000002',
    'Frescos',
    'frescos',
    'd0000000-0000-4000-8000-000000000001'
  );
  perform public.seed_upsert_category(
    'd0000000-0000-4000-8000-000000000003',
    'Frutas y Verduras',
    'frutas-y-verduras',
    'd0000000-0000-4000-8000-000000000002'
  );
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
    image_strategy
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
    'BASE_ONLY'
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

-- ---------------------------------------------------------------------------
-- Auth users + public."user" mirror
-- ---------------------------------------------------------------------------

do $$
declare
  v_instance_id uuid := '00000000-0000-0000-0000-000000000000';
  u record;
  users constant jsonb := '[
    {"id":"10000000-0000-4000-8000-000000000001","email":"admin@test.com","full_name":"Super Admin","role":"super-admin"},
    {"id":"10000000-0000-4000-8000-000000000011","email":"buyer1@test.com","full_name":"Comprador 1","role":"user"},
    {"id":"10000000-0000-4000-8000-000000000012","email":"buyer2@test.com","full_name":"Comprador 2","role":"user"},
    {"id":"10000000-0000-4000-8000-000000000013","email":"buyer3@test.com","full_name":"Comprador 3","role":"user"},
    {"id":"10000000-0000-4000-8000-000000000021","email":"vendor1@test.com","full_name":"Vendedor 1","role":"seller"},
    {"id":"10000000-0000-4000-8000-000000000022","email":"vendor2@test.com","full_name":"Vendedor 2","role":"seller"},
    {"id":"10000000-0000-4000-8000-000000000023","email":"vendor3@test.com","full_name":"Vendedor 3","role":"seller"},
    {"id":"10000000-0000-4000-8000-000000000024","email":"vendor4@test.com","full_name":"Vendedor 4","role":"seller"},
    {"id":"10000000-0000-4000-8000-000000000031","email":"dittobot-resistencia@test.com","full_name":"DittoBot Resistencia","role":"seller"},
    {"id":"10000000-0000-4000-8000-000000000032","email":"dittobot-corrientes@test.com","full_name":"DittoBot Corrientes","role":"seller"},
    {"id":"10000000-0000-4000-8000-000000000033","email":"dittobot-formosa@test.com","full_name":"DittoBot Formosa","role":"seller"}
  ]'::jsonb;
begin
  for u in
    select
      (elem->>'id')::uuid as id,
      elem->>'email' as email,
      elem->>'full_name' as full_name,
      elem->>'role' as role
    from jsonb_array_elements(users) as elem
  loop
    if not exists (select 1 from auth.users where id = u.id) then
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, recovery_sent_at, last_sign_in_at,
        raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
      ) values (
        v_instance_id, u.id, 'authenticated', 'authenticated', u.email,
        crypt('123456', gen_salt('bf')),
        now(), now(), now(),
        jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
        jsonb_build_object('full_name', u.full_name, 'role', u.role),
        now(), now(), '', '', '', ''
      );

      insert into auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
      ) values (
        u.id, u.id,
        jsonb_build_object('sub', u.id::text, 'email', u.email),
        'email', u.email, now(), now(), now()
      );
    end if;

    insert into public."user" (id, email, role, full_name, status)
    values (u.id, u.email, u.role, u.full_name, 'active')
    on conflict (id) do update set
      email = excluded.email,
      role = excluded.role,
      full_name = excluded.full_name,
      status = excluded.status;
  end loop;
end $$;

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
