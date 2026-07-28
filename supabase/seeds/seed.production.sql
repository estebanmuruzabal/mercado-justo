-- =============================================================================
-- Mercado Justo — production E2E bootstrap scenario
-- Prerequisites: seed.shared.sql + taxonomy runtime (categories / product_base)
-- Users: created by scripts/db-seed-production.js (BOOTSTRAP_* or dev defaults)
-- Idempotent: safe to re-run via npm run db:seed:production
-- =============================================================================

-- Stable bootstrap actor IDs (same as local seed.dev-users.sql)
--   admin  10000000-0000-4000-8000-000000000001
--   buyer  10000000-0000-4000-8000-000000000011
--   vendor 10000000-0000-4000-8000-000000000021

-- ---------------------------------------------------------------------------
-- Vendor store (owner id = vendor user id)
-- ---------------------------------------------------------------------------

do $$
declare
  v_vendor constant uuid := '10000000-0000-4000-8000-000000000021';
  v_banner text := 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1500&auto=format&fit=crop';
  v_logo text := 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop';
begin
  if not exists (select 1 from public."user" where id = v_vendor) then
    raise exception 'Bootstrap vendor user % missing — run user bootstrap first', v_vendor;
  end if;

  insert into public.store (
    id, name, slug, bio, banner_url, logo_url, allow_followers,
    whatsapp_number, show_whatsapp,
    address, latitude, longitude, mode, plan, product_limit,
    terms_accepted, terms_accepted_at, status, is_featured
  )
  values (
    v_vendor,
    'Ditto Farms Resistencia',
    'ditto-farms-resistencia',
    'Producción local de verduras, frutas y alimentos frescos — tienda bootstrap E2E.',
    v_banner,
    v_logo,
    true,
    '5493624123456',
    true,
    'Frondizi y Alberdi, Resistencia',
    -27.45155,
    -58.98685,
    'online',
    'free',
    50,
    true,
    now(),
    'active',
    true
  )
  on conflict (id) do update set
    name = excluded.name,
    slug = excluded.slug,
    bio = excluded.bio,
    banner_url = excluded.banner_url,
    logo_url = excluded.logo_url,
    allow_followers = excluded.allow_followers,
    whatsapp_number = excluded.whatsapp_number,
    show_whatsapp = excluded.show_whatsapp,
    address = excluded.address,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    product_limit = excluded.product_limit,
    status = excluded.status,
    is_featured = excluded.is_featured,
    terms_accepted = excluded.terms_accepted,
    terms_accepted_at = excluded.terms_accepted_at;
end $$;

-- ---------------------------------------------------------------------------
-- Lechuga Romana product_base (template used by at least one listing)
-- ---------------------------------------------------------------------------

do $$
declare
  v_product_base_id constant uuid := 'f0000000-0000-4000-8000-000000000001';
  v_category_id constant uuid := 'd0000000-0000-4000-8000-000000000001';
  v_subcategory_id constant uuid := 'd0000000-0000-4000-8000-000000000004';
  v_image constant text :=
    'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?q=80&w=800&auto=format&fit=crop';
begin
  insert into public.product_base (
    id, name, slug, description, category_id, subcategory_id,
    type, status, base_image_url, image_strategy, source
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
    product_base_id, key, label, type, required, sort_order,
    is_visible, is_filterable, is_searchable, is_variant_dimension, allow_variant_pricing
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
-- Published products + default variants (Discovery + cart/checkout)
-- Categories use taxonomy-alimentos UUIDs (d0000000-…)
-- ---------------------------------------------------------------------------

do $$
declare
  v_vendor constant uuid := '10000000-0000-4000-8000-000000000021';
  v_cat_verduras constant uuid := 'd0000000-0000-4000-8000-000000000011';
  v_cat_frutas constant uuid := 'd0000000-0000-4000-8000-000000000010';
  v_cat_hojas constant uuid := 'd0000000-0000-4000-8000-000000000004';
  v_cat_bebidas constant uuid := 'd0000000-0000-4000-8000-000000000006';
  v_cat_almacen constant uuid := 'd0000000-0000-4000-8000-000000000005';
  v_cat_congelados constant uuid := 'd0000000-0000-4000-8000-000000000008';
  v_pb_lechuga constant uuid := 'f0000000-0000-4000-8000-000000000001';
  v_listing uuid;
  item record;
  listings constant jsonb := '[
    {"category":"hojas","title":"Lechuga hidropónica","description":"Lechuga fresca cultivada en invernadero local, cosecha diaria.","price":2500,"stock":30,"image":"https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?q=80&w=800&auto=format&fit=crop","product_base":true},
    {"category":"verduras","title":"Tomate cherry","description":"Tomates cherry orgánicos, ideal para ensaladas y pastas.","price":3200,"stock":25,"image":"https://images.unsplash.com/photo-1592920334722-677c2c865938?q=80&w=800&auto=format&fit=crop"},
    {"category":"hojas","title":"Rúcula","description":"Rúcula fresca de estación, picante y aromática.","price":2800,"stock":20,"image":"https://images.unsplash.com/photo-1518843875459-f738682238a6?q=80&w=800&auto=format&fit=crop"},
    {"category":"hojas","title":"Albahaca","description":"Manojo de albahaca fresca, perfecta para pesto casero.","price":1800,"stock":40,"image":"https://images.unsplash.com/photo-1618375569909-3c8616cf7733?q=80&w=800&auto=format&fit=crop"},
    {"category":"hojas","title":"Kale","description":"Kale orgánico, rico en nutrientes y listo para consumir.","price":3000,"stock":18,"image":"https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=800&auto=format&fit=crop"},
    {"category":"frutas","title":"Banana Ecuador","description":"Bananas maduras, ideales para consumo diario.","price":2100,"stock":45,"image":"https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?q=80&w=800&auto=format&fit=crop"},
    {"category":"frutas","title":"Manzana roja","description":"Manzanas rojas crocantes, seleccionadas a mano.","price":3500,"stock":28,"image":"https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?q=80&w=800&auto=format&fit=crop"},
    {"category":"frutas","title":"Naranja jugosa","description":"Naranjas dulces para jugo o mesa.","price":2400,"stock":50,"image":"https://images.unsplash.com/photo-1547514701-42782101795e?q=80&w=800&auto=format&fit=crop"},
    {"category":"verduras","title":"Zanahoria","description":"Zanahorias frescas de producción local.","price":1600,"stock":60,"image":"https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=800&auto=format&fit=crop"},
    {"category":"verduras","title":"Papa lavada","description":"Papa lavada lista para cocinar, bolsa familiar.","price":1900,"stock":55,"image":"https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=800&auto=format&fit=crop"},
    {"category":"bebidas","title":"Jugo de naranja natural","description":"Jugo exprimido del día, sin conservantes.","price":4200,"stock":16,"image":"https://images.unsplash.com/photo-1600271886742-f049cd341b88?q=80&w=800&auto=format&fit=crop"},
    {"category":"bebidas","title":"Agua mineral 2L","description":"Agua mineral sin gas, bidón 2 litros.","price":1200,"stock":80,"image":"https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=800&auto=format&fit=crop"},
    {"category":"almacen","title":"Arroz largo fino 1kg","description":"Arroz largo fino premium, paquete de 1 kg.","price":2800,"stock":40,"image":"https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=800&auto=format&fit=crop"},
    {"category":"almacen","title":"Aceite de oliva 500ml","description":"Aceite de oliva extra virgen, botella 500 ml.","price":8900,"stock":22,"image":"https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=800&auto=format&fit=crop"},
    {"category":"congelados","title":"Frutillas congeladas","description":"Frutillas IQF, ideales para smoothies.","price":5600,"stock":14,"image":"https://images.unsplash.com/photo-1464965911861-746a04b4bca6?q=80&w=800&auto=format&fit=crop"}
  ]'::jsonb;
begin
  for item in
    select
      elem->>'category' as category_key,
      elem->>'title' as title,
      elem->>'description' as description,
      (elem->>'price')::numeric as price,
      (elem->>'stock')::integer as stock,
      elem->>'image' as image,
      coalesce((elem->>'product_base')::boolean, false) as use_product_base
    from jsonb_array_elements(listings) as elem
  loop
    select l.id into v_listing
    from public.listing l
    where l.store_id = v_vendor and l.title = item.title
    limit 1;

    if v_listing is null then
      insert into public.listing (
        title, description, price, stock, condition,
        category_id, store_id, status, listing_type,
        latitude, longitude, moderation_status, images, product_base_id
      )
      values (
        item.title,
        item.description,
        item.price,
        item.stock,
        'new',
        case item.category_key
          when 'verduras' then v_cat_verduras
          when 'frutas' then v_cat_frutas
          when 'hojas' then v_cat_hojas
          when 'bebidas' then v_cat_bebidas
          when 'almacen' then v_cat_almacen
          when 'congelados' then v_cat_congelados
        end,
        v_vendor,
        'published',
        'product',
        -27.45155,
        -58.98685,
        'approved',
        jsonb_build_array(item.image),
        case when item.use_product_base then v_pb_lechuga else null end
      )
      returning id into v_listing;
    else
      update public.listing as l
      set
        description = item.description,
        price = item.price,
        stock = item.stock,
        status = 'published',
        moderation_status = 'approved',
        images = jsonb_build_array(item.image),
        category_id = case item.category_key
          when 'verduras' then v_cat_verduras
          when 'frutas' then v_cat_frutas
          when 'hojas' then v_cat_hojas
          when 'bebidas' then v_cat_bebidas
          when 'almacen' then v_cat_almacen
          when 'congelados' then v_cat_congelados
        end,
        product_base_id = case when item.use_product_base then v_pb_lechuga else l.product_base_id end,
        latitude = -27.45155,
        longitude = -58.98685
      where l.id = v_listing;
    end if;

    if exists (
      select 1 from public.listing_variant lv
      where lv.listing_id = v_listing and lv.is_default = true
    ) then
      update public.listing_variant
      set
        name = item.title,
        price = item.price,
        stock = item.stock,
        attributes_json = jsonb_build_object('name', item.title, 'image', item.image)
      where listing_id = v_listing and is_default = true;
    else
      insert into public.listing_variant (
        listing_id, sku, name, price, stock, is_default, attributes_json
      )
      values (
        v_listing,
        'SKU-BOOT-' || substr(replace(v_listing::text, '-', ''), 1, 10),
        item.title,
        item.price,
        item.stock,
        true,
        jsonb_build_object('name', item.title, 'image', item.image)
      );
    end if;
  end loop;
end $$;
