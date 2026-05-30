-- Scalable RBAC foundation for the Super Admin Panel.
--
-- Roles live in public."user".role (app reads them there, not from auth.* metadata).
-- This migration:
--   1. Constrains role to the known set (forward-compatible with future staff roles).
--   2. Adds SECURITY DEFINER helpers used by admin-read RLS policies so admins get
--      efficient cross-vendor visibility WITHOUT bypassing the existing owner policies.
--
-- Role convention is hyphenated (matches types/roles.ts):
--   user, seller, seller-admin, property-admin, super-admin,
--   logistics-admin, moderator, support
--
-- "Staff" = platform operators (super-admin, logistics-admin, moderator, support).
-- seller-admin / property-admin remain vendor-side roles, NOT platform staff.

-- 1. Constrain the role column to the known set.
alter table public."user"
  drop constraint if exists user_role_check;

alter table public."user"
  add constraint user_role_check
  check (
    role in (
      'user',
      'seller',
      'seller-admin',
      'property-admin',
      'super-admin',
      'logistics-admin',
      'moderator',
      'support'
    )
  );

-- 2. Role helpers (SECURITY DEFINER so RLS policies can read public."user"
--    regardless of the caller's own row-level visibility).

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.role
  from public."user" u
  where u.id = auth.uid();
$$;

create or replace function public.has_role(target_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public."user" u
    where u.id = auth.uid()
      and u.role = target_role
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('super-admin');
$$;

-- Platform staff: anyone allowed into the admin panel.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public."user" u
    where u.id = auth.uid()
      and u.role in ('super-admin', 'logistics-admin', 'moderator', 'support')
  );
$$;
