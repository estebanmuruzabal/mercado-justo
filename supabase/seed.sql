-- =============================================================================
-- Mercado Justo — development seed (idempotent)
-- Password for all demo users: 123456
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Block A: Auth users + public."user" mirror
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
    {"id":"10000000-0000-4000-8000-000000000023","email":"vendor3@test.com","full_name":"Vendedor 3","role":"seller"}
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
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      ) values (
        v_instance_id,
        u.id,
        'authenticated',
        'authenticated',
        u.email,
        crypt('123456', gen_salt('bf')),
        now(),
        now(),
        now(),
        jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
        jsonb_build_object('full_name', u.full_name, 'role', u.role),
        now(),
        now(),
        '',
        '',
        '',
        ''
      );

      insert into auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      ) values (
        u.id,
        u.id,
        jsonb_build_object('sub', u.id::text, 'email', u.email),
        'email',
        u.email,
        now(),
        now(),
        now()
      );
    end if;

    insert into public."user" (id, email, role, full_name)
    values (u.id, u.email, u.role, u.full_name)
    on conflict (id) do update set
      email = excluded.email,
      role = excluded.role,
      full_name = excluded.full_name;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Block B: Categories
-- ---------------------------------------------------------------------------

insert into public.category (name)
values
  ('Verduras'),
  ('Frutas'),
  ('Hongos'),
  ('Cannabis'),
  ('Tecnología'),
  ('Artesanías'),
  ('Mascotas'),
  ('Servicios')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Block C: Demo stores (one per vendor)
-- ---------------------------------------------------------------------------

do $$
declare
  v_vendor1 uuid := '10000000-0000-4000-8000-000000000021';
  v_vendor2 uuid := '10000000-0000-4000-8000-000000000022';
  v_vendor3 uuid := '10000000-0000-4000-8000-000000000023';
  v_banner text := 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1500&auto=format&fit=crop';
  v_logo text := 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop';
begin
  insert into public.store (
    id, name, slug, bio, banner_url, logo_url, allow_followers,
    whatsapp_number, show_whatsapp,
    address, latitude, longitude, mode, plan, product_limit,
    terms_accepted, terms_accepted_at, status
  )
  values
    (
      v_vendor1,
      'Ditto Farms Resistencia',
      'ditto-farms-resistencia',
      'Producción de verduras y alimentos locales.',
      v_banner, v_logo, true,
      '5493624123456', true,
      'Resistencia, Chaco',
      -27.4511, -58.9867,
      'online', 'free', 50,
      true, now(), 'active'
    ),
    (
      v_vendor2,
      'DittoBots',
      'dittobots',
      'Automatización agrícola, sensores y dispositivos inteligentes.',
      v_banner, v_logo, true,
      '5493624987654', true,
      'Resistencia, Chaco',
      -27.4511, -58.9867,
      'online', 'free', 50,
      true, now(), 'active'
    ),
    (
      v_vendor3,
      'Artesanías del Litoral',
      'artesanias-del-litoral',
      'Productos artesanales regionales.',
      v_banner, v_logo, true,
      '5493624556677', true,
      'Resistencia, Chaco',
      -27.4511, -58.9867,
      'online', 'free', 50,
      true, now(), 'active'
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
    terms_accepted = excluded.terms_accepted,
    terms_accepted_at = excluded.terms_accepted_at;
end $$;

-- ---------------------------------------------------------------------------
-- Block D: Demo listings + variants
-- ---------------------------------------------------------------------------

do $$
declare
  v_vendor1 uuid := '10000000-0000-4000-8000-000000000021';
  v_vendor2 uuid := '10000000-0000-4000-8000-000000000022';
  v_vendor3 uuid := '10000000-0000-4000-8000-000000000023';
  v_cat_verduras uuid;
  v_cat_tecnologia uuid;
  v_cat_artesanias uuid;
  v_listing uuid;
  listing record;
  listings constant jsonb := '[
    {"store":"10000000-0000-4000-8000-000000000021","category":"Verduras","title":"Lechuga hidropónica","description":"Lechuga fresca cultivada en invernadero local.","price":2500,"image":"https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?q=80&w=800&auto=format&fit=crop"},
    {"store":"10000000-0000-4000-8000-000000000021","category":"Verduras","title":"Tomate cherry orgánico","description":"Tomates cherry de producción orgánica, cosecha semanal.","price":3200,"image":"https://images.unsplash.com/photo-1546094097-2d3c2c2c2c2c?q=80&w=800&auto=format&fit=crop"},
    {"store":"10000000-0000-4000-8000-000000000021","category":"Verduras","title":"Mix de verduras de estación","description":"Selección de verduras de temporada de productores locales.","price":4500,"image":"https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop"},
    {"store":"10000000-0000-4000-8000-000000000022","category":"Tecnología","title":"Sensor de humedad de suelo","description":"Sensor IoT con conectividad Wi-Fi para monitoreo remoto.","price":18900,"image":"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop"},
    {"store":"10000000-0000-4000-8000-000000000022","category":"Tecnología","title":"Controlador IoT para riego","description":"Automatizá el riego de tu huerta con programación por app.","price":24500,"image":"https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop"},
    {"store":"10000000-0000-4000-8000-000000000022","category":"Tecnología","title":"Estación meteorológica compacta","description":"Temperatura, humedad y lluvia en tiempo real para el campo.","price":31200,"image":"https://images.unsplash.com/photo-1592210454359-9043f067919b?q=80&w=800&auto=format&fit=crop"},
    {"store":"10000000-0000-4000-8000-000000000023","category":"Artesanías","title":"Canasta de mimbre artesanal","description":"Canasta tejida a mano con materiales del litoral argentino.","price":7800,"image":"https://images.unsplash.com/photo-1591195853828-11db59a814f9?q=80&w=800&auto=format&fit=crop"},
    {"store":"10000000-0000-4000-8000-000000000023","category":"Artesanías","title":"Mate calabaza tallado","description":"Mate tradicional con calabaza seleccionada y virola de alpaca.","price":12500,"image":"https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=800&auto=format&fit=crop"},
    {"store":"10000000-0000-4000-8000-000000000023","category":"Artesanías","title":"Cerámica esmaltada regional","description":"Piezas únicas de cerámica hechas por artesanos del litoral.","price":9800,"image":"https://images.unsplash.com/photo-1578749556568-bc2c40f68b55?q=80&w=800&auto=format&fit=crop"}
  ]'::jsonb;
begin
  select id into v_cat_verduras from public.category where name = 'Verduras';
  select id into v_cat_tecnologia from public.category where name = 'Tecnología';
  select id into v_cat_artesanias from public.category where name = 'Artesanías';

  for listing in
    select
      (elem->>'store')::uuid as store_id,
      elem->>'category' as category_name,
      elem->>'title' as title,
      elem->>'description' as description,
      (elem->>'price')::numeric as price,
      elem->>'image' as image
    from jsonb_array_elements(listings) as elem
  loop
    if exists (
      select 1
      from public.listing l
      where l.store_id = listing.store_id
        and l.title = listing.title
    ) then
      continue;
    end if;

    insert into public.listing (
      title, description, price, stock, condition,
      category_id, store_id, status, listing_type, latitude, longitude
    )
    values (
      listing.title,
      listing.description,
      listing.price,
      25,
      'new',
      case listing.category_name
        when 'Verduras' then v_cat_verduras
        when 'Tecnología' then v_cat_tecnologia
        when 'Artesanías' then v_cat_artesanias
      end,
      listing.store_id,
      'published',
      'product',
      -27.4511,
      -58.9867
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
      25,
      true,
      jsonb_build_object('name', listing.title, 'image', listing.image)
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Block E: Social data (reviews + followers)
-- ---------------------------------------------------------------------------

do $$
declare
  v_buyer1 uuid := '10000000-0000-4000-8000-000000000011';
  v_buyer2 uuid := '10000000-0000-4000-8000-000000000012';
  v_vendor1 uuid := '10000000-0000-4000-8000-000000000021';
  v_vendor2 uuid := '10000000-0000-4000-8000-000000000022';
  v_vendor3 uuid := '10000000-0000-4000-8000-000000000023';
begin
  insert into public.store_review (store_id, author_id, author_name, rating, comment)
  values
    (v_vendor1, v_buyer1, 'Comprador 1', 5, 'Verduras frescas y entrega puntual. ¡Muy recomendable!'),
    (v_vendor2, v_buyer2, 'Comprador 2', 4, 'Los sensores funcionan perfecto para mi huerta.')
  on conflict (store_id, author_id) do nothing;

  insert into public.vendor_follower (follower_id, store_id)
  values
    (v_buyer1, v_vendor1),
    (v_buyer2, v_vendor2),
    (v_buyer1, v_vendor3)
  on conflict do nothing;
end $$;
