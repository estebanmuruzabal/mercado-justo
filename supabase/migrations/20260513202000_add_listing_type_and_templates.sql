do $$ begin
  create type public.listing_type as enum ('product', 'service', 'property');
exception
  when duplicate_object then null;
end $$;

alter table public.category
  add column if not exists listing_type public.listing_type not null default 'product';

-- JSONB-driven templates:
-- { sections: [{ title: string, fields: [{ key, label, type, placeholder?, required?, options? }] }] }
create table if not exists public.listing_template (
  id uuid primary key default gen_random_uuid(),
  listing_type public.listing_type not null,
  category_id uuid not null references public.category(id) on delete cascade,
  template jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (listing_type, category_id)
);

alter table public.listing_template enable row level security;

create policy "Authenticated can view listing templates"
  on public.listing_template
  for select
  using (auth.role() = 'authenticated');

-- Track listing type on the listing row.
alter table public.listing
  add column if not exists listing_type public.listing_type not null default 'product';

