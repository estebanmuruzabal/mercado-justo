-- Seed dev authentication users for local development.
-- Ensures fixed credentials + correct roles in `public."user"`.

create extension if not exists "pgcrypto";

do $$
declare
  v_instance_id uuid;
begin
  select id into v_instance_id from auth.instances limit 1;

  -- Super admin
  if not exists (select 1 from auth.users where email = 'estebanmuruzabal@gmail.com') then
    insert into auth.users (
      instance_id,
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      raw_app_meta_data,
      created_at,
      updated_at
    )
    values (
      v_instance_id,
      gen_random_uuid(),
      'estebanmuruzabal@gmail.com',
      crypt('123456', gen_salt('bf')),
      now(),
      jsonb_build_object(
        'role', 'super-admin',
        'full_name', 'Esteban Muruzabal',
        'avatar_url', ''
      ),
      '{}'::jsonb,
      now(),
      now()
    );
  end if;

  -- Seller
  if not exists (select 1 from auth.users where email = 'vendor@gmail.com') then
    insert into auth.users (
      instance_id,
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      raw_app_meta_data,
      created_at,
      updated_at
    )
    values (
      v_instance_id,
      gen_random_uuid(),
      'vendor@gmail.com',
      crypt('123456', gen_salt('bf')),
      now(),
      jsonb_build_object(
        'role', 'seller',
        'full_name', 'Seller',
        'avatar_url', ''
      ),
      '{}'::jsonb,
      now(),
      now()
    );
  end if;
end $$;

-- Ensure mirror rows in `public."user"` always have the expected roles,
-- even if the auth user already existed.

insert into public."user" (id, email, role, full_name, avatar_url)
select
  u.id,
  u.email,
  'super-admin'::text,
  'Esteban Muruzabal'::text,
  ''::text
from auth.users u
where u.email = 'estebanmuruzabal@gmail.com'
on conflict (id) do update
set
  role = excluded.role,
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url;

insert into public."user" (id, email, role, full_name, avatar_url)
select
  u.id,
  u.email,
  'seller'::text,
  'Seller'::text,
  ''::text
from auth.users u
where u.email = 'vendor@gmail.com'
on conflict (id) do update
set
  role = excluded.role,
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url;

