-- =============================================================================
-- Mercado Justo — system seed (all environments)
-- Global marketplace taxonomy: root categories + taxonomy_node slugs.
-- Idempotent: safe to re-run via npm run db:seed or supabase db reset.
-- =============================================================================

create extension if not exists "pgcrypto";

-- Upsert category row and matching taxonomy_node (canonical slug, parent chain).
create or replace function public.seed_upsert_category(
  p_id uuid,
  p_name text,
  p_slug text,
  p_parent_id uuid default null,
  p_listing_type public.listing_type default 'product',
  p_is_visible boolean default true
)
returns void
language plpgsql
as $$
begin
  insert into public.category (id, name, parent_id, is_visible, listing_type)
  values (p_id, p_name, p_parent_id, p_is_visible, p_listing_type)
  on conflict (id) do update set
    name = excluded.name,
    parent_id = excluded.parent_id,
    is_visible = excluded.is_visible,
    listing_type = excluded.listing_type;

  insert into public.taxonomy_node (
    id,
    parent_id,
    name,
    slug,
    allowed_types,
    is_visible,
    legacy_category_id
  )
  values (
    p_id,
    p_parent_id,
    p_name,
    p_slug,
    array[p_listing_type::text],
    p_is_visible,
    p_id
  )
  on conflict (legacy_category_id) do update set
    parent_id = excluded.parent_id,
    name = excluded.name,
    slug = excluded.slug,
    allowed_types = excluded.allowed_types,
    is_visible = excluded.is_visible;
end;
$$;

-- ── Root categories (stable UUIDs) ───────────────────────────────────────────

do $$
begin
  perform public.seed_upsert_category(
    'c0000000-0000-4000-8000-000000000001'::uuid, 'Verduras', 'verduras'
  );
  perform public.seed_upsert_category(
    'c0000000-0000-4000-8000-000000000002'::uuid, 'Frutas', 'frutas'
  );
  perform public.seed_upsert_category(
    'c0000000-0000-4000-8000-000000000003'::uuid, 'Hongos', 'hongos'
  );
  perform public.seed_upsert_category(
    'c0000000-0000-4000-8000-000000000004'::uuid, 'Cannabis', 'cannabis'
  );
  perform public.seed_upsert_category(
    'c0000000-0000-4000-8000-000000000005'::uuid, 'Tecnología', 'tecnologia'
  );
  perform public.seed_upsert_category(
    'c0000000-0000-4000-8000-000000000006'::uuid, 'Artesanías', 'artesanias'
  );
  perform public.seed_upsert_category(
    'c0000000-0000-4000-8000-000000000007'::uuid, 'Plantas', 'plantas'
  );
  perform public.seed_upsert_category(
    'c0000000-0000-4000-8000-000000000008'::uuid, 'Mascotas', 'mascotas'
  );
  perform public.seed_upsert_category(
    'c0000000-0000-4000-8000-000000000009'::uuid,
    'Servicios',
    'servicios',
    null,
    'service'::public.listing_type
  );
end $$;

-- Grower / protocol taxonomy (hidden from public browse; used by recipe publications).
insert into public.taxonomy_node (id, parent_id, name, slug, allowed_types, is_visible, legacy_category_id)
values (
  'c0000000-0000-4000-8000-000000000010',
  null,
  'Protocolos',
  'protocolos',
  array['recipe'],
  false,
  null
)
on conflict (slug) do update set
  name = excluded.name,
  allowed_types = excluded.allowed_types,
  is_visible = excluded.is_visible;
