-- User lifecycle status for admin management.
alter table public."user"
  add column if not exists status text not null default 'active',
  add column if not exists last_access_at timestamptz,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspension_reason text;

alter table public."user"
  drop constraint if exists user_status_check;

alter table public."user"
  add constraint user_status_check
  check (status in ('active', 'suspended', 'banned'));

create index if not exists user_status_idx on public."user" (status);
create index if not exists user_role_idx on public."user" (role);

-- Normalize legacy store statuses to the new vocabulary.
update public.store set status = 'pending_review' where status = 'pending';
update public.store set status = 'suspended' where status = 'disabled';

alter table public.store
  drop constraint if exists store_status_check;

alter table public.store
  add constraint store_status_check
  check (status in ('active', 'suspended', 'pending_review'));

alter table public.store
  add column if not exists is_featured boolean not null default false;

create index if not exists store_is_featured_idx on public.store (is_featured)
  where is_featured = true;

-- Super-admin write access for user and store management (reads remain is_staff()).
drop policy if exists "Super admin can update users" on public."user";
create policy "Super admin can update users"
  on public."user"
  for update
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "Super admin can update stores" on public.store;
create policy "Super admin can update stores"
  on public.store
  for update
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Audit log readable by super-admin only (sensitive user management trail).
drop policy if exists "Staff can view audit log" on public.admin_audit_log;
create policy "Super admin can view audit log"
  on public.admin_audit_log
  for select
  using (public.is_super_admin());
