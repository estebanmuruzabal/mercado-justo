-- Vendor-owned pickup/delivery windows with day-of-week scheduling.
--
-- Platform templates keep vendor_id NULL. Vendor-created windows are scoped to
-- store.id and include day_of_week (ISO: 1 = Monday … 7 = Sunday).

alter table public.pickup_windows
  add column if not exists vendor_id uuid references public.store(id) on delete cascade,
  add column if not exists day_of_week smallint;

alter table public.delivery_windows
  add column if not exists vendor_id uuid references public.store(id) on delete cascade,
  add column if not exists day_of_week smallint;

alter table public.pickup_windows
  drop constraint if exists pickup_windows_day_of_week_check;

alter table public.pickup_windows
  add constraint pickup_windows_day_of_week_check
  check (day_of_week is null or (day_of_week >= 1 and day_of_week <= 7));

alter table public.delivery_windows
  drop constraint if exists delivery_windows_day_of_week_check;

alter table public.delivery_windows
  add constraint delivery_windows_day_of_week_check
  check (day_of_week is null or (day_of_week >= 1 and day_of_week <= 7));

alter table public.pickup_windows
  drop constraint if exists pickup_windows_vendor_schedule_check;

alter table public.pickup_windows
  add constraint pickup_windows_vendor_schedule_check
  check (
    (vendor_id is null and day_of_week is null)
    or (vendor_id is not null and day_of_week is not null)
  );

alter table public.delivery_windows
  drop constraint if exists delivery_windows_vendor_schedule_check;

alter table public.delivery_windows
  add constraint delivery_windows_vendor_schedule_check
  check (
    (vendor_id is null and day_of_week is null)
    or (vendor_id is not null and day_of_week is not null)
  );

alter table public.pickup_windows drop constraint if exists pickup_windows_code_key;
alter table public.delivery_windows drop constraint if exists delivery_windows_code_key;

create unique index if not exists pickup_windows_platform_code_key
  on public.pickup_windows (code)
  where vendor_id is null;

create unique index if not exists delivery_windows_platform_code_key
  on public.delivery_windows (code)
  where vendor_id is null;

create unique index if not exists pickup_windows_vendor_schedule_key
  on public.pickup_windows (vendor_id, day_of_week, start_time, end_time)
  where vendor_id is not null;

create unique index if not exists delivery_windows_vendor_schedule_key
  on public.delivery_windows (vendor_id, day_of_week, start_time, end_time)
  where vendor_id is not null;

create index if not exists pickup_windows_vendor_id_idx
  on public.pickup_windows (vendor_id)
  where vendor_id is not null;

create index if not exists delivery_windows_vendor_id_idx
  on public.delivery_windows (vendor_id)
  where vendor_id is not null;

-- Vendor CRUD on own windows.
create policy "Vendors can view own pickup windows"
  on public.pickup_windows
  for select
  using (vendor_id = auth.uid());

create policy "Vendors can insert own pickup windows"
  on public.pickup_windows
  for insert
  with check (vendor_id = auth.uid());

create policy "Vendors can update own pickup windows"
  on public.pickup_windows
  for update
  using (vendor_id = auth.uid())
  with check (vendor_id = auth.uid());

create policy "Vendors can view own delivery windows"
  on public.delivery_windows
  for select
  using (vendor_id = auth.uid());

create policy "Vendors can insert own delivery windows"
  on public.delivery_windows
  for insert
  with check (vendor_id = auth.uid());

create policy "Vendors can update own delivery windows"
  on public.delivery_windows
  for update
  using (vendor_id = auth.uid())
  with check (vendor_id = auth.uid());

create policy "Staff can view all pickup windows"
  on public.pickup_windows
  for select
  using (public.is_staff());

create policy "Staff can view all delivery windows"
  on public.delivery_windows
  for select
  using (public.is_staff());
