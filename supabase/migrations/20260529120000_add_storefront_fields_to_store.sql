-- Storefront fields for the public vendor profile (/vendor/[slug]).
-- Adds slug + branding (banner/logo/bio), a followers toggle, and
-- denormalized social counters maintained by triggers for O(1) reads.

-- Slugify helper: lowercase, strip diacritics-less special chars, collapse to dashes.
create or replace function public.slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(
      regexp_replace(lower(coalesce(value, '')), '[^a-z0-9\s-]', '', 'g'),
      '[\s-]+', '-', 'g'
    )
  )
$$;

alter table public.store
  add column if not exists slug text,
  add column if not exists banner_url text,
  add column if not exists logo_url text,
  add column if not exists bio text,
  add column if not exists allow_followers boolean not null default true,
  add column if not exists follower_count integer not null default 0,
  add column if not exists review_count integer not null default 0,
  add column if not exists rating_avg numeric(3, 2) not null default 0;

-- Backfill slug for existing rows, de-duplicating collisions with a short id suffix.
with ranked as (
  select
    id,
    name,
    created_at,
    row_number() over (
      partition by public.slugify(name)
      order by created_at, id
    ) as rn
  from public.store
)
update public.store s
set slug = case
  when nullif(public.slugify(ranked.name), '') is null
    then 'tienda-' || substr(s.id::text, 1, 8)
  when ranked.rn = 1
    then public.slugify(ranked.name)
  else public.slugify(ranked.name) || '-' || substr(s.id::text, 1, 4)
end
from ranked
where s.id = ranked.id
  and s.slug is null;

create unique index if not exists store_slug_key on public.store (slug);
