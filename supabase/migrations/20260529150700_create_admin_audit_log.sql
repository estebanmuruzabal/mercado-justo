-- Append-only audit trail for sensitive admin actions (suspend vendor, moderation
-- decisions, forced status overrides, logistics reassignment, refunds, etc.).
--
-- Rows are written exclusively by the service-role client from audited server
-- actions (see server/admin/audit.ts). There is intentionally NO insert policy:
-- the service role bypasses RLS, and no other client may write here.

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),

  actor_id uuid references auth.users(id) on delete set null,
  actor_role text,

  action text not null,
  entity_type text not null,
  entity_id text,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx
  on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_entity_idx
  on public.admin_audit_log (entity_type, entity_id);
create index if not exists admin_audit_log_actor_idx
  on public.admin_audit_log (actor_id);

alter table public.admin_audit_log enable row level security;

-- Staff can read the audit trail. Writes are service-role only (no insert policy).
create policy "Staff can view audit log"
  on public.admin_audit_log
  for select
  using (public.is_staff());
