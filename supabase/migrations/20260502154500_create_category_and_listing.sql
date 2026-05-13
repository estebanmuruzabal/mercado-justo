create extension if not exists "pgcrypto";

-- Categories are reference data for listings
create table if not exists public.category (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.category enable row level security;

create policy "Anyone can view categories" on public.category
  for select using (true);

-- Seller listings
create table if not exists public.listing (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  price numeric not null check (price > 0),
  stock integer not null default 0 check (stock >= 0),
  condition text not null check (condition in ('new', 'used')),
  category_id uuid not null references public.category(id) on delete restrict,
  store_id uuid not null references public.store(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.listing enable row level security;

create index if not exists listing_store_id_idx on public.listing (store_id);
create index if not exists listing_category_id_idx on public.listing (category_id);

create policy "Users can view own listings" on public.listing
  for select using (auth.uid() = store_id);

create policy "Users can insert own listings" on public.listing
  for insert with check (auth.uid() = store_id);

create policy "Users can update own listings" on public.listing
  for update using (auth.uid() = store_id);

create policy "Users can delete own listings" on public.listing
  for delete using (auth.uid() = store_id);

