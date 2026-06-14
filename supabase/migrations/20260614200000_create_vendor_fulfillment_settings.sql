-- Vendor fulfillment configuration: per-store logistics capabilities.
--
-- Methods and window catalogs remain platform-owned (fulfillment_methods,
-- pickup_windows, delivery_windows). Vendors enable subsets via
-- vendor_fulfillment_settings.

create table if not exists public.delivery_windows (
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

create table if not exists public.vendor_fulfillment_settings (
  vendor_id uuid primary key references public.store(id) on delete cascade,
  enabled_method_codes text[] not null default '{}',
  enabled_pickup_window_ids uuid[] not null default '{}',
  enabled_delivery_window_ids uuid[] not null default '{}',
  delivery_radius_km numeric,
  pickup_address text,
  default_method_code text references public.fulfillment_methods(code) on delete set null,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vendor_fulfillment_settings_delivery_radius_check check (
    delivery_radius_km is null or delivery_radius_km >= 0
  )
);

create index if not exists delivery_windows_active_sort_idx
  on public.delivery_windows (is_active, sort_order);

create index if not exists vendor_fulfillment_settings_default_method_idx
  on public.vendor_fulfillment_settings (default_method_code)
  where default_method_code is not null;

alter table public.delivery_windows enable row level security;
alter table public.vendor_fulfillment_settings enable row level security;

-- Catalog read access for authenticated users (vendor dashboard + future checkout).
create policy "Authenticated can view active fulfillment methods"
  on public.fulfillment_methods
  for select
  using (is_active = true and auth.uid() is not null);

create policy "Authenticated can view active pickup windows"
  on public.pickup_windows
  for select
  using (is_active = true and auth.uid() is not null);

create policy "Authenticated can view active delivery windows"
  on public.delivery_windows
  for select
  using (is_active = true and auth.uid() is not null);

create policy "Vendors can view own fulfillment settings"
  on public.vendor_fulfillment_settings
  for select
  using (vendor_id = auth.uid());

create policy "Vendors can insert own fulfillment settings"
  on public.vendor_fulfillment_settings
  for insert
  with check (vendor_id = auth.uid());

create policy "Vendors can update own fulfillment settings"
  on public.vendor_fulfillment_settings
  for update
  using (vendor_id = auth.uid())
  with check (vendor_id = auth.uid());

create policy "Staff can view vendor fulfillment settings"
  on public.vendor_fulfillment_settings
  for select
  using (public.is_staff());

create trigger delivery_windows_set_updated_at
  before update on public.delivery_windows
  for each row execute function public.handle_updated_at();

create trigger vendor_fulfillment_settings_set_updated_at
  before update on public.vendor_fulfillment_settings
  for each row execute function public.handle_updated_at();

insert into public.delivery_windows (code, label, start_time, end_time, timezone, sort_order, is_active)
values
  ('morning', 'Mañana', '09:00', '12:00', 'America/Argentina/Buenos_Aires', 1, true),
  ('afternoon', 'Tarde', '14:00', '18:00', 'America/Argentina/Buenos_Aires', 2, true),
  ('evening', 'Noche', '18:00', '21:00', 'America/Argentina/Buenos_Aires', 3, true)
on conflict (code) do update set
  label = excluded.label,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  timezone = excluded.timezone,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

-- Default empty settings row for existing stores (pickup address falls back to store.address in app).
insert into public.vendor_fulfillment_settings (vendor_id, pickup_address)
select s.id, s.address
from public.store s
on conflict (vendor_id) do nothing;
