-- Shipment-first logistics model.
--
-- order   = commercial / payment unit (one buyer, currently one seller).
-- shipment = logistics unit: one per vendor inside an order. For the MVP there is
--   exactly one shipment per order (orders are single-seller today), but the model
--   is forward-compatible with true multi-vendor orders and future delivery batches.
--
-- Logistic state lives on the SHIPMENT, not the order. The order's commercial status
-- (payment, etc.) stays on public.order.

create table if not exists public.shipment (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.order(id) on delete cascade,
  store_id uuid not null references public.store(id) on delete restrict,

  -- Logistic state machine (see lib/admin/engines/fulfillment-engine.ts).
  status text not null default 'pending',

  -- Delivery method resolved at checkout (pickup / own_delivery / mj_delivery).
  delivery_method text,

  -- Scheduled pickup/delivery window, e.g. { "date": "2026-06-01", "start": "08:00", "end": "11:00" }.
  scheduled_window jsonb,

  -- Sustainability snapshot (haversine estimate; see sustainability-engine.ts).
  distance_km numeric,
  carbon_level text,

  -- Future multi-vendor batching (FK constraint added in the delivery_batch migration).
  batch_id uuid,

  -- Position of this shipment within its order (1-based).
  sequence integer not null default 1,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shipment
  drop constraint if exists shipment_status_check;

alter table public.shipment
  add constraint shipment_status_check
  check (
    status in (
      'pending',
      'preparing',
      'ready_for_pickup',
      'in_transit',
      'delivered',
      'cancelled',
      'incident'
    )
  );

create index if not exists shipment_order_id_idx on public.shipment (order_id);
create index if not exists shipment_store_id_idx on public.shipment (store_id);
create index if not exists shipment_status_idx on public.shipment (status);
create index if not exists shipment_batch_id_idx on public.shipment (batch_id) where batch_id is not null;
create unique index if not exists shipment_order_sequence_key on public.shipment (order_id, sequence);

alter table public.shipment enable row level security;

-- Vendor sees and manages shipments for their own store.
create policy "Vendors can view own shipments"
  on public.shipment
  for select
  using (store_id = auth.uid());

create policy "Vendors can update own shipments"
  on public.shipment
  for update
  using (store_id = auth.uid())
  with check (store_id = auth.uid());

-- Buyer sees shipments belonging to their orders.
create policy "Buyers can view shipments for their orders"
  on public.shipment
  for select
  using (
    exists (
      select 1 from public.order o
      where o.id = shipment.order_id
        and o.buyer_id = auth.uid()
    )
  );

-- Platform staff have full cross-vendor read visibility.
create policy "Staff can view all shipments"
  on public.shipment
  for select
  using (public.is_staff());

create trigger shipment_set_updated_at
  before update on public.shipment
  for each row execute function public.handle_updated_at();

-- Backfill: one shipment per existing order (MVP single-vendor mapping).
insert into public.shipment (order_id, store_id, status, sequence, created_at)
select
  o.id,
  o.seller_id,
  case
    when o.status in ('pending', 'preparing', 'ready_for_pickup', 'in_transit', 'delivered', 'cancelled', 'incident')
      then o.status
    when o.status = 'completed' then 'delivered'
    when o.status = 'canceled' then 'cancelled'
    else 'pending'
  end,
  1,
  o.created_at
from public.order o
where not exists (
  select 1 from public.shipment s where s.order_id = o.id
);
