-- Listing variants + checkout-ready tables.
-- This migration is additive and keeps legacy `public.listing` columns intact for drafts.

create table if not exists public.listing_variant (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listing(id) on delete cascade,
  sku text not null,
  price numeric not null,
  stock integer not null default 0,
  is_default boolean not null default false,
  attributes_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Fast lookup for variants belonging to a listing.
create index if not exists listing_variant_listing_id_idx on public.listing_variant (listing_id);

-- Optional: if you want global uniqueness for SKUs.
-- create unique index if not exists listing_variant_sku_unique on public.listing_variant (sku);

-- RLS
alter table public.listing_variant enable row level security;

-- Sellers can manage variants for their listings (via listing.store_id ownership).
create policy "Sellers can select own listing variants"
  on public.listing_variant
  for select
  using (
    exists (
      select 1
      from public.listing l
      where l.id = listing_variant.listing_id
        and l.store_id = auth.uid()
    )
  );

create policy "Sellers can insert own listing variants"
  on public.listing_variant
  for insert
  with check (
    exists (
      select 1
      from public.listing l
      where l.id = listing_variant.listing_id
        and l.store_id = auth.uid()
    )
  );

create policy "Sellers can update own listing variants"
  on public.listing_variant
  for update
  using (
    exists (
      select 1
      from public.listing l
      where l.id = listing_variant.listing_id
        and l.store_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.listing l
      where l.id = listing_variant.listing_id
        and l.store_id = auth.uid()
    )
  );

create policy "Sellers can delete own listing variants"
  on public.listing_variant
  for delete
  using (
    exists (
      select 1
      from public.listing l
      where l.id = listing_variant.listing_id
        and l.store_id = auth.uid()
    )
  );

-- Public can select variants only for published listings.
create policy "Public can select variants for published listings"
  on public.listing_variant
  for select
  using (
    exists (
      select 1
      from public.listing l
      where l.id = listing_variant.listing_id
        and l.status = 'published'
    )
  );

create table if not exists public.cart_item (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  variant_id uuid not null references public.listing_variant(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index if not exists cart_item_user_id_idx on public.cart_item (user_id);
create index if not exists cart_item_variant_id_idx on public.cart_item (variant_id);

alter table public.cart_item enable row level security;

create policy "Users can manage own cart items"
  on public.cart_item
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create table if not exists public.order (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete restrict,
  seller_id uuid not null references public.store(id) on delete restrict,
  status text not null default 'pending',
  payment_status text not null default 'unpaid',
  subtotal numeric not null default 0,
  delivery_price numeric not null default 0,
  total numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists order_buyer_id_idx on public.order (buyer_id);
create index if not exists order_seller_id_idx on public.order (seller_id);

alter table public.order enable row level security;

create policy "Users can view orders they participate in"
  on public.order
  for select
  using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "Users can insert their own orders"
  on public.order
  for insert
  with check (buyer_id = auth.uid());

create table if not exists public.order_item (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.order(id) on delete cascade,
  listing_id uuid not null,
  variant_id uuid not null references public.listing_variant(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  title_snapshot text not null,
  variant_snapshot jsonb not null default '{}'::jsonb,
  price_snapshot numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists order_item_order_id_idx on public.order_item (order_id);
create index if not exists order_item_variant_id_idx on public.order_item (variant_id);

alter table public.order_item enable row level security;

create policy "Order participants can view order items"
  on public.order_item
  for select
  using (
    exists (
      select 1 from public.order o
      where o.id = order_item.order_id
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );

create policy "Buyers can insert order items for their orders"
  on public.order_item
  for insert
  with check (
    exists (
      select 1 from public.order o
      where o.id = order_item.order_id
        and o.buyer_id = auth.uid()
    )
  );

