insert into public.category (name)
values
  ('Alimentos'),
  ('Ropa'),
  ('Hogar'),
  ('Servicios'),
  ('Otros')
on conflict (name) do nothing;

-- Demo storefront for the public vendor profile (/vendor/the-tree-kings).
do $$
declare
  v_vendor uuid;
  v_admin uuid;
  v_cat uuid;
  v_listing uuid;
  titles text[] := array[
    'Pack Premium', 'Edición Limitada', 'Clásico de la casa',
    'Combo Familiar', 'Selección Especial', 'Novedad del mes'
  ];
  imgs text[] := array[
    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1606787366850-de6330128bfc?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1559181567-c3190ca9959b?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1521405924368-64c5b84bec60?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1553546895-531931aa1aa8?q=80&w=800&auto=format&fit=crop'
  ];
  prices numeric[] := array[4500, 8900, 3200, 12500, 6700, 5400];
  i int;
begin
  select id into v_vendor from auth.users where email = 'vendor@gmail.com';
  select id into v_admin from auth.users where email = 'estebanmuruzabal@gmail.com';
  if v_vendor is null then return; end if;

  insert into public.store (
    id, name, slug, bio, banner_url, logo_url, allow_followers,
    address, latitude, longitude, mode, plan, product_limit,
    terms_accepted, terms_accepted_at
  )
  values (
    v_vendor,
    'The Tree Kings',
    'the-tree-kings',
    'Productos premium testeados en laboratorio. Servicio confiable y atención personalizada.',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop',
    true,
    'Plantation, Florida',
    -27.4705, -58.9868,
    'online', 'free', 50,
    true, now()
  )
  on conflict (id) do update set
    name = excluded.name,
    slug = excluded.slug,
    bio = excluded.bio,
    banner_url = excluded.banner_url,
    logo_url = excluded.logo_url,
    allow_followers = excluded.allow_followers,
    address = excluded.address;

  select id into v_cat from public.category order by name limit 1;

  for i in 1..array_length(titles, 1) loop
    insert into public.listing (
      title, description, price, stock, condition,
      category_id, store_id, status, listing_type, latitude, longitude
    )
    values (
      titles[i], 'Descripción de ' || titles[i] || '.', prices[i], 25, 'new',
      v_cat, v_vendor, 'published', 'product', -27.4705, -58.9868
    )
    returning id into v_listing;

    insert into public.listing_variant (listing_id, sku, price, stock, is_default, attributes_json)
    values (
      v_listing,
      'SKU-' || substr(v_listing::text, 1, 8),
      prices[i], 25, true,
      jsonb_build_object('name', titles[i], 'image', imgs[i])
    );
  end loop;

  if v_admin is not null then
    insert into public.store_review (store_id, author_id, author_name, author_avatar_url, rating, comment)
    values (
      v_vendor, v_admin, 'Esteban Muruzabal', null, 5,
      'Excelente atención y productos de primera. ¡Súper recomendado!'
    )
    on conflict (store_id, author_id) do nothing;

    insert into public.vendor_follower (follower_id, store_id)
    values (v_admin, v_vendor)
    on conflict do nothing;
  end if;
end $$;

