-- Vendor lifecycle status for admin moderation (approve / suspend / disable).
--
-- Status transitions are performed by audited service-role server actions, never
-- by the vendor themselves. We DO NOT add a public write policy here.

alter table public.store
  add column if not exists status text not null default 'active',
  add column if not exists suspended_at timestamptz,
  add column if not exists suspension_reason text,
  add column if not exists last_active_at timestamptz;

alter table public.store
  drop constraint if exists store_status_check;

alter table public.store
  add constraint store_status_check
  check (status in ('active', 'pending', 'suspended', 'disabled'));

-- Filter vendors by status in the admin table.
create index if not exists store_status_idx on public.store (status);
