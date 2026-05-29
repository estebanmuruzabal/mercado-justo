alter table public.listing_variant
  add column if not exists name text not null default '';

