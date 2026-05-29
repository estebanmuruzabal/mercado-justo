-- Delivery batches: group shipments from MULTIPLE vendors into a single logistics
-- run (fewer trips, better efficiency, lower carbon footprint).
--
-- Schema + RLS land now so the architecture is ready; the batching UI and automatic
-- grouping are Phase 2. For the MVP shipments are not auto-batched (batch_id stays null).

create table if not exists public.delivery_batch (
  id uuid primary key default gen_random_uuid(),

  -- Human-readable batch code, e.g. "BATCH-41".
  code text not null unique,

  status text not null default 'open',

  -- Planned window for the whole batch.
  scheduled_window jsonb,

  -- Staff member who created/owns the batch.
  created_by uuid references auth.users(id) on delete set null,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.delivery_batch
  drop constraint if exists delivery_batch_status_check;

alter table public.delivery_batch
  add constraint delivery_batch_status_check
  check (status in ('open', 'assigned', 'in_progress', 'completed', 'cancelled'));

create index if not exists delivery_batch_status_idx on public.delivery_batch (status);

alter table public.delivery_batch enable row level security;

-- Batches are a staff-only concept (no vendor/buyer visibility for now).
create policy "Staff can view delivery batches"
  on public.delivery_batch
  for select
  using (public.is_staff());

create trigger delivery_batch_set_updated_at
  before update on public.delivery_batch
  for each row execute function public.handle_updated_at();

-- Wire shipment.batch_id to delivery_batch now that the table exists.
alter table public.shipment
  drop constraint if exists shipment_batch_id_fkey;

alter table public.shipment
  add constraint shipment_batch_id_fkey
  foreign key (batch_id) references public.delivery_batch(id) on delete set null;
