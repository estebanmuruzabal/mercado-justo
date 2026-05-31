-- =============================================================================
-- Mercado Justo — development demo seed
-- Password for all demo users: 123456
-- Geographic focus: Resistencia, Chaco (geo search, maps, marketplace)
-- Idempotent — safe to re-run via npm run db:seed
-- =============================================================================

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
    {"id":"10000000-0000-4000-8000-000000000024","email":"vendor4@test.com","full_name":"Vendedor 4","role":"seller"}
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
-- ---------------------------------------------------------------------------

do $$
declare
  v_banner text := 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1500&auto=format&fit=crop';
  v_logo text := 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop';
begin
  insert into public.store (
    id, name, slug, bio, banner_url, logo_url, allow_followers,
    whatsapp_number, show_whatsapp,
    address, latitude, longitude, mode, plan, product_limit,
    terms_accepted, terms_accepted_at, status, is_featured
  )
  values
    (
      '10000000-0000-4000-8000-000000000021',
      'Ditto Farms Resistencia',
      'ditto-farms-resistencia',
      'Producción local de verduras, plantines y alimentos frescos.',
      v_banner, v_logo, true,
      '5493624123456', true,
      'Frondizi y Alberdi, Resistencia',
      -27.45155, -58.98685,
      'online', 'free', 50,
      true, now(), 'active', true
    ),
    (
      '10000000-0000-4000-8000-000000000022',
      'DittoBots',
      'dittobots',
      'Automatización agrícola, sensores y dispositivos IoT.',
      v_banner, v_logo, true,
      '5493624987654', true,
      'Moreno y Santa María de Oro, Resistencia',
      -27.44795, -58.98980,
      'online', 'free', 50,
      true, now(), 'active', false
    ),
    (
      '10000000-0000-4000-8000-000000000023',
      'Artesanías del Litoral',
      'artesanias-del-litoral',
      'Artesanías regionales y productos culturales.',
      v_banner, v_logo, true,
      '5493624556677', true,
      'San Martín y Rodríguez Peña, Resistencia',
      -27.45490, -58.98240,
      'online', 'free', 50,
      true, now(), 'active', false
    ),
    (
      '10000000-0000-4000-8000-000000000024',
      'Vivero Chaqueño',
      'vivero-chaqueno',
      'Árboles, plantas ornamentales y aromáticas.',
      v_banner, v_logo, true,
      '5493624778899', true,
      'Zona Plaza 12 de Octubre',
      -27.44890, -58.98120,
      'online', 'free', 50,
      true, now(), 'active', false
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
    status = excluded.status,
    is_featured = excluded.is_featured,
    terms_accepted = excluded.terms_accepted,
    terms_accepted_at = excluded.terms_accepted_at;
end $$;

-- ---------------------------------------------------------------------------
-- Demo listings + variants (published, geo-tagged per store)
-- ---------------------------------------------------------------------------

do $$
declare
  v_cat_verduras uuid;
  v_cat_tecnologia uuid;
  v_cat_artesanias uuid;
  v_cat_plantas uuid;
  v_listing uuid;
  listing record;
  listings constant jsonb := '[
    {"store":"10000000-0000-4000-8000-000000000021","category":"Verduras","title":"Lechuga hidropónica","description":"Lechuga fresca cultivada en invernadero local, cosecha diaria.","price":2500,"stock":30,"lat":-27.45155,"lng":-58.98685,"image":"https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?q=80&w=800&auto=format&fit=crop"},
    {"store":"10000000-0000-4000-8000-000000000021","category":"Verduras","title":"Tomate cherry","description":"Tomates cherry orgánicos, ideal para ensaladas y pastas.","price":3200,"stock":25,"lat":-27.45155,"lng":-58.98685,"image":"https://images.unsplash.com/photo-1592920334722-677c2c865938?q=80&w=800&auto=format&fit=crop"},
    {"store":"10000000-0000-4000-8000-000000000021","category":"Verduras","title":"Rúcula","description":"Rúcula fresca de estación, picante y aromática.","price":2800,"stock":20,"lat":-27.45155,"lng":-58.98685,"image":"https://images.unsplash.com/photo-1518843875459-f738682238a6?q=80&w=800&auto=format&fit=crop"},
    {"store":"10000000-0000-4000-8000-000000000021","category":"Verduras","title":"Albahaca","description":"Manojo de albahaca fresca, perfecta para pesto casero.","price":1800,"stock":40,"lat":-27.45155,"lng":-58.98685,"image":"https://images.unsplash.com/photo-1618375569909-3c8616cf7733?q=80&w=800&auto=format&fit=crop"},
    {"store":"10000000-0000-4000-8000-000000000021","category":"Verduras","title":"Kale","description":"Kale orgánico, rico en nutrientes y listo para consumir.","price":3000,"stock":18,"lat":-27.45155,"lng":-58.98685,"image":"https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=800&auto=format&fit=crop"},

    {"store":"10000000-0000-4000-8000-000000000022","category":"Tecnología","title":"DittoClima Mini","description":"Estación meteorológica compacta con app móvil.","price":22000,"stock":12,"lat":-27.44795,"lng":-58.98980,"image":"https://images.unsplash.com/photo-1592210454359-9043f067919b?q=80&w=800&auto=format&fit=crop"},
    {"store":"10000000-0000-4000-8000-000000000022","category":"Tecnología","title":"Sensor de Humedad V1","description":"Sensor IoT de humedad de suelo con conectividad Wi-Fi.","price":18900,"stock":15,"lat":-27.44795,"lng":-58.98980,"image":"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop"},
    {"store":"10000000-0000-4000-8000-000000000022","category":"Tecnología","title":"Controlador de Riego","description":"Automatizá el riego de tu huerta con programación por app.","price":24500,"stock":8,"lat":-27.44795,"lng":-58.98980,"image":"https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop"},
    {"store":"10000000-0000-4000-8000-000000000022","category":"Tecnología","title":"DittoNode ESP32","description":"Nodo de campo ESP32 para sensores agrícolas en red mesh.","price":15600,"stock":20,"lat":-27.44795,"lng":-58.98980,"image":"https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=800&auto=format&fit=crop"},

    {"store":"10000000-0000-4000-8000-000000000023","category":"Artesanías","title":"Mate artesanal","description":"Mate tradicional con calabaza seleccionada y virola de alpaca.","price":12500,"stock":10,"lat":-27.45490,"lng":-58.98240,"image":"https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=800&auto=format&fit=crop"},
    {"store":"10000000-0000-4000-8000-000000000023","category":"Artesanías","title":"Canasta de mimbre","description":"Canasta tejida a mano con materiales del litoral argentino.","price":7800,"stock":14,"lat":-27.45490,"lng":-58.98240,"image":"https://images.unsplash.com/photo-1591195853828-11db59a814f9?q=80&w=800&auto=format&fit=crop"},
    {"store":"10000000-0000-4000-8000-000000000023","category":"Artesanías","title":"Cerámica regional","description":"Piezas únicas de cerámica hechas por artesanos del litoral.","price":9800,"stock":6,"lat":-27.45490,"lng":-58.98240,"image":"https://images.unsplash.com/photo-1578749556568-bc2c40f68b55?q=80&w=800&auto=format&fit=crop"},

    {"store":"10000000-0000-4000-8000-000000000024","category":"Plantas","title":"Lapacho Rosa","description":"Árbol nativo en maceta, ideal para jardines urbanos.","price":45000,"stock":5,"lat":-27.44890,"lng":-58.98120,"image":"https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=800&auto=format&fit=crop"},
    {"store":"10000000-0000-4000-8000-000000000024","category":"Plantas","title":"Limonero Injertado","description":"Limonero injertado listo para trasplantar, producción temprana.","price":38000,"stock":7,"lat":-27.44890,"lng":-58.98120,"image":"https://images.unsplash.com/photo-1587735243615-c94539732572?q=80&w=800&auto=format&fit=crop"},
    {"store":"10000000-0000-4000-8000-000000000024","category":"Plantas","title":"Romero","description":"Plantín de romero aromático, resistente y perenne.","price":2500,"stock":35,"lat":-27.44890,"lng":-58.98120,"image":"https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=800&auto=format&fit=crop"},
    {"store":"10000000-0000-4000-8000-000000000024","category":"Plantas","title":"Lavanda","description":"Lavanda en maceta, aroma intenso para jardín o balcón.","price":3200,"stock":22,"lat":-27.44890,"lng":-58.98120,"image":"https://images.unsplash.com/photo-1596409189063-aa4524a8bf97?q=80&w=800&auto=format&fit=crop"}
  ]'::jsonb;
begin
  select id into v_cat_verduras from public.category where name = 'Verduras';
  select id into v_cat_tecnologia from public.category where name = 'Tecnología';
  select id into v_cat_artesanias from public.category where name = 'Artesanías';
  select id into v_cat_plantas from public.category where name = 'Plantas';

  for listing in
    select
      (elem->>'store')::uuid as store_id,
      elem->>'category' as category_name,
      elem->>'title' as title,
      elem->>'description' as description,
      (elem->>'price')::numeric as price,
      (elem->>'stock')::integer as stock,
      (elem->>'lat')::numeric as lat,
      (elem->>'lng')::numeric as lng,
      elem->>'image' as image
    from jsonb_array_elements(listings) as elem
  loop
    if exists (
      select 1 from public.listing l
      where l.store_id = listing.store_id and l.title = listing.title
    ) then
      continue;
    end if;

    insert into public.listing (
      title, description, price, stock, condition,
      category_id, store_id, status, listing_type,
      latitude, longitude, moderation_status
    )
    values (
      listing.title,
      listing.description,
      listing.price,
      listing.stock,
      'new',
      case listing.category_name
        when 'Verduras' then v_cat_verduras
        when 'Tecnología' then v_cat_tecnologia
        when 'Artesanías' then v_cat_artesanias
        when 'Plantas' then v_cat_plantas
      end,
      listing.store_id,
      'published',
      'product',
      listing.lat,
      listing.lng,
      'approved'
    )
    returning id into v_listing;

    insert into public.listing_variant (
      listing_id, sku, name, price, stock, is_default, attributes_json
    )
    values (
      v_listing,
      'SKU-' || substr(v_listing::text, 1, 8),
      listing.title,
      listing.price,
      listing.stock,
      true,
      jsonb_build_object('name', listing.title, 'image', listing.image)
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Social data (reviews + followers)
-- ---------------------------------------------------------------------------

do $$
declare
  v_buyer1 uuid := '10000000-0000-4000-8000-000000000011';
  v_buyer2 uuid := '10000000-0000-4000-8000-000000000012';
  v_buyer3 uuid := '10000000-0000-4000-8000-000000000013';
  v_vendor1 uuid := '10000000-0000-4000-8000-000000000021';
  v_vendor2 uuid := '10000000-0000-4000-8000-000000000022';
  v_vendor3 uuid := '10000000-0000-4000-8000-000000000023';
  v_vendor4 uuid := '10000000-0000-4000-8000-000000000024';
begin
  insert into public.store_review (store_id, author_id, author_name, rating, comment)
  values
    (v_vendor1, v_buyer1, 'Comprador 1', 5, 'Verduras frescas y entrega puntual. ¡Muy recomendable!'),
    (v_vendor2, v_buyer2, 'Comprador 2', 4, 'Los sensores funcionan perfecto para mi huerta.'),
    (v_vendor3, v_buyer3, 'Comprador 3', 5, 'Artesanías de excelente calidad, muy auténticas.'),
    (v_vendor4, v_buyer1, 'Comprador 1', 5, 'Plantas sanas y bien cuidadas, el lapacho es hermoso.')
  on conflict (store_id, author_id) do nothing;

  insert into public.vendor_follower (follower_id, store_id)
  values
    (v_buyer1, v_vendor1),
    (v_buyer2, v_vendor2),
    (v_buyer1, v_vendor3),
    (v_buyer3, v_vendor4),
    (v_buyer2, v_vendor1)
  on conflict do nothing;
end $$;
