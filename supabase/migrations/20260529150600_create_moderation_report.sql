-- User-submitted moderation reports across entity types (listings, vendors,
-- reviews, public profiles). Feeds the admin Moderation queue (Phase 2 UI).
--
-- entity_type: listing | vendor | review | profile
-- status:      open | reviewing | resolved | dismissed

create table if not exists public.moderation_report (
  id uuid primary key default gen_random_uuid(),

  entity_type text not null,
  entity_id uuid not null,

  reporter_id uuid references auth.users(id) on delete set null,
  reason text not null,
  details text,

  status text not null default 'open',
  resolution text,
  assigned_to uuid references auth.users(id) on delete set null,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.moderation_report
  drop constraint if exists moderation_report_entity_type_check;

alter table public.moderation_report
  add constraint moderation_report_entity_type_check
  check (entity_type in ('listing', 'vendor', 'review', 'profile'));

alter table public.moderation_report
  drop constraint if exists moderation_report_status_check;

alter table public.moderation_report
  add constraint moderation_report_status_check
  check (status in ('open', 'reviewing', 'resolved', 'dismissed'));

create index if not exists moderation_report_status_idx
  on public.moderation_report (status);
create index if not exists moderation_report_entity_idx
  on public.moderation_report (entity_type, entity_id);

alter table public.moderation_report enable row level security;

-- Any authenticated user can file a report (and read the ones they filed).
create policy "Users can create moderation reports"
  on public.moderation_report
  for insert
  with check (reporter_id = auth.uid());

create policy "Users can view own moderation reports"
  on public.moderation_report
  for select
  using (reporter_id = auth.uid());

-- Staff have full read visibility over the queue. Resolution writes go through
-- audited service-role actions.
create policy "Staff can view all moderation reports"
  on public.moderation_report
  for select
  using (public.is_staff());

create trigger moderation_report_set_updated_at
  before update on public.moderation_report
  for each row execute function public.handle_updated_at();
