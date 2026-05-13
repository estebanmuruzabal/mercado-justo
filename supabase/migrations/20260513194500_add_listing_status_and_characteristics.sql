-- Status + draft storage for listings (simple: enum + jsonb)

do $$ begin
  create type public.listing_status as enum ('draft', 'published');
exception
  when duplicate_object then null;
end $$;

alter table public.listing
  add column if not exists status public.listing_status not null default 'draft',
  add column if not exists characteristics jsonb not null default '{}'::jsonb;

-- Allow drafts to be created from step 1 without all fields being filled yet.
alter table public.listing
  alter column title drop not null,
  alter column description drop not null,
  alter column price drop not null,
  alter column condition drop not null;

-- Keep RLS as-is (policies already exist for select/insert/update/delete).
