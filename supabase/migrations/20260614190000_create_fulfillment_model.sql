-- Initial fulfillment model for SuperAdmin logistics.
--
-- This keeps the current shipment-backed system intact while introducing a
-- normalized fulfillment layer for methods, pickup windows, requests and
-- multi-vendor batches. Existing shipment rows are backfilled into requests so
-- the new dashboard can read real data immediately.

create table if not exists public.fulfillment_methods (
  code text primary key,
  label text not null,
  kind text not null,
  provider text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fulfillment_methods_kind_check check (kind in ('pickup', 'delivery')),
  constraint fulfillment_methods_provider_check check (provider in ('seller', 'dittovan'))
);

create table if not exists public.pickup_windows (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  start_time time not null,
  end_time time not null,
  timezone text not null default 'America/Argentina/Buenos_Aires',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fulfillment_batches (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  status text not null default 'open',
  scheduled_window jsonb,
  created_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fulfillment_batches_status_check check (
    status in ('open', 'assigned', 'in_progress', 'completed', 'cancelled')
  )
);

create table if not exists public.fulfillment_requests (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null unique references public.shipment(id) on delete cascade,
  order_id uuid not null references public."order"(id) on delete cascade,
  vendor_id uuid not null references public.store(id) on delete restrict,
  buyer_id uuid not null references auth.users(id) on delete restrict,
  method_code text not null references public.fulfillment_methods(code) on delete restrict,
  status text not null default 'pending',
  pickup_window_id uuid references public.pickup_windows(id) on delete set null,
  scheduled_window jsonb,
  pickup_address text,
  delivery_address text,
  assigned_operator_id uuid references auth.users(id) on delete set null,
  batch_id uuid references public.fulfillment_batches(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fulfillment_requests_status_check check (
    status in ('pending', 'preparing', 'ready_for_pickup', 'in_transit', 'delivered', 'cancelled', 'incident')
  )
);

create index if not exists fulfillment_methods_kind_idx on public.fulfillment_methods (kind);
create index if not exists fulfillment_methods_provider_idx on public.fulfillment_methods (provider);
create index if not exists pickup_windows_active_sort_idx on public.pickup_windows (is_active, sort_order);
create index if not exists fulfillment_batches_status_idx on public.fulfillment_batches (status);
create index if not exists fulfillment_requests_order_id_idx on public.fulfillment_requests (order_id);
create index if not exists fulfillment_requests_vendor_id_idx on public.fulfillment_requests (vendor_id);
create index if not exists fulfillment_requests_buyer_id_idx on public.fulfillment_requests (buyer_id);
create index if not exists fulfillment_requests_method_code_idx on public.fulfillment_requests (method_code);
create index if not exists fulfillment_requests_status_idx on public.fulfillment_requests (status);
create index if not exists fulfillment_requests_batch_id_idx on public.fulfillment_requests (batch_id) where batch_id is not null;
create index if not exists fulfillment_requests_pickup_window_id_idx on public.fulfillment_requests (pickup_window_id) where pickup_window_id is not null;

alter table public.fulfillment_methods enable row level security;
alter table public.pickup_windows enable row level security;
alter table public.fulfillment_batches enable row level security;
alter table public.fulfillment_requests enable row level security;

create policy "Staff can view fulfillment methods"
  on public.fulfillment_methods
  for select
  using (public.is_staff());

create policy "Staff can view pickup windows"
  on public.pickup_windows
  for select
  using (public.is_staff());

create policy "Staff can view fulfillment batches"
  on public.fulfillment_batches
  for select
  using (public.is_staff());

create policy "Staff can view fulfillment requests"
  on public.fulfillment_requests
  for select
  using (public.is_staff());

create policy "Vendors can view own fulfillment requests"
  on public.fulfillment_requests
  for select
  using (vendor_id = auth.uid());

create policy "Buyers can view their fulfillment requests"
  on public.fulfillment_requests
  for select
  using (buyer_id = auth.uid());

create trigger fulfillment_methods_set_updated_at
  before update on public.fulfillment_methods
  for each row execute function public.handle_updated_at();

create trigger pickup_windows_set_updated_at
  before update on public.pickup_windows
  for each row execute function public.handle_updated_at();

create trigger fulfillment_batches_set_updated_at
  before update on public.fulfillment_batches
  for each row execute function public.handle_updated_at();

create trigger fulfillment_requests_set_updated_at
  before update on public.fulfillment_requests
  for each row execute function public.handle_updated_at();

insert into public.fulfillment_methods (code, label, kind, provider, sort_order, is_active)
values
  ('pickup_seller', 'Pickup en domicilio del vendedor', 'pickup', 'seller', 1, true),
  ('pickup_dittovan', 'Pickup en DittoVan', 'pickup', 'dittovan', 2, true),
  ('delivery_seller', 'Entrega del vendedor', 'delivery', 'seller', 3, true),
  ('delivery_dittovan', 'Entrega de DittoVan', 'delivery', 'dittovan', 4, true)
on conflict (code) do update set
  label = excluded.label,
  kind = excluded.kind,
  provider = excluded.provider,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.pickup_windows (code, label, start_time, end_time, timezone, sort_order, is_active)
values
  ('morning', 'Mañana', '08:00', '11:00', 'America/Argentina/Buenos_Aires', 1, true),
  ('afternoon', 'Tarde', '14:00', '16:00', 'America/Argentina/Buenos_Aires', 2, true)
on conflict (code) do update set
  label = excluded.label,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  timezone = excluded.timezone,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.fulfillment_batches (id, code, status, scheduled_window, created_by, notes, created_at, updated_at)
select
  db.id,
  db.code,
  db.status,
  db.scheduled_window,
  db.created_by,
  db.notes,
  db.created_at,
  db.updated_at
from public.delivery_batch db
on conflict (id) do update set
  code = excluded.code,
  status = excluded.status,
  scheduled_window = excluded.scheduled_window,
  created_by = excluded.created_by,
  notes = excluded.notes,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

create or replace function public.fulfillment_method_code_from_delivery_method(p_delivery_method text)
returns text
language sql
immutable
set search_path = public
as $$
  select case coalesce(p_delivery_method, 'pickup')
    when 'mj_delivery' then 'delivery_dittovan'
    when 'own_delivery' then 'delivery_seller'
    when 'pickup' then 'pickup_seller'
    else 'pickup_seller'
  end
$$;

create or replace function public.sync_fulfillment_request_from_shipment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id uuid;
  v_vendor_id uuid;
  v_pickup_address text;
  v_delivery_address text;
  v_method_code text;
  v_pickup_window_id uuid;
begin
  select o.buyer_id, s.store_id, st.address
    into v_buyer_id, v_vendor_id, v_pickup_address
  from public."order" o
  join public.shipment s on s.order_id = o.id
  join public.store st on st.id = s.store_id
  where s.id = new.id;

  if v_buyer_id is null or v_vendor_id is null then
    return new;
  end if;

  v_method_code := public.fulfillment_method_code_from_delivery_method(new.delivery_method);
  v_delivery_address := null;

  if new.scheduled_window is not null then
    select pw.id
      into v_pickup_window_id
    from public.pickup_windows pw
    where pw.is_active = true
      and pw.start_time = nullif(new.scheduled_window->>'start', '')::time
      and pw.end_time = nullif(new.scheduled_window->>'end', '')::time
    order by pw.sort_order
    limit 1;
  end if;

  insert into public.fulfillment_requests (
    shipment_id,
    order_id,
    vendor_id,
    buyer_id,
    method_code,
    status,
    pickup_window_id,
    scheduled_window,
    pickup_address,
    delivery_address,
    assigned_operator_id,
    batch_id,
    notes,
    created_at,
    updated_at
  ) values (
    new.id,
    new.order_id,
    v_vendor_id,
    v_buyer_id,
    v_method_code,
    new.status,
    v_pickup_window_id,
    new.scheduled_window,
    v_pickup_address,
    v_delivery_address,
    null,
    new.batch_id,
    null,
    new.created_at,
    now()
  )
  on conflict (shipment_id) do update set
    order_id = excluded.order_id,
    vendor_id = excluded.vendor_id,
    buyer_id = excluded.buyer_id,
    method_code = excluded.method_code,
    status = excluded.status,
    pickup_window_id = excluded.pickup_window_id,
    scheduled_window = excluded.scheduled_window,
    pickup_address = excluded.pickup_address,
    delivery_address = excluded.delivery_address,
    batch_id = excluded.batch_id,
    created_at = excluded.created_at,
    updated_at = now();

  return new;
end;
$$;

insert into public.fulfillment_requests (
  shipment_id,
  order_id,
  vendor_id,
  buyer_id,
  method_code,
  status,
  pickup_window_id,
  scheduled_window,
  pickup_address,
  delivery_address,
  assigned_operator_id,
  batch_id,
  notes,
  created_at,
  updated_at
)
select
  s.id,
  s.order_id,
  s.store_id,
  o.buyer_id,
  public.fulfillment_method_code_from_delivery_method(s.delivery_method),
  s.status,
  pw.id,
  s.scheduled_window,
  st.address,
  null,
  null,
  fb.id,
  null,
  s.created_at,
  now()
from public.shipment s
join public."order" o on o.id = s.order_id
join public.store st on st.id = s.store_id
left join lateral (
  select id
  from public.pickup_windows
  where is_active = true
    and start_time = nullif(s.scheduled_window->>'start', '')::time
    and end_time = nullif(s.scheduled_window->>'end', '')::time
  order by sort_order
  limit 1
) pw on true
left join public.fulfillment_batches fb on fb.id = s.batch_id
on conflict (shipment_id) do update set
  order_id = excluded.order_id,
  vendor_id = excluded.vendor_id,
  buyer_id = excluded.buyer_id,
  method_code = excluded.method_code,
  status = excluded.status,
  pickup_window_id = excluded.pickup_window_id,
  scheduled_window = excluded.scheduled_window,
  pickup_address = excluded.pickup_address,
  delivery_address = excluded.delivery_address,
  batch_id = excluded.batch_id,
  created_at = excluded.created_at,
  updated_at = now();

create trigger shipment_sync_fulfillment_request
  after insert or update on public.shipment
  for each row execute function public.sync_fulfillment_request_from_shipment();
