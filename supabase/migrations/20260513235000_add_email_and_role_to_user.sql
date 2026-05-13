-- Add role/email fields to the app user mirror table.
-- The app reads roles from public."user" (not from auth.* metadata).

alter table public."user"
  add column if not exists email text,
  add column if not exists role text not null default 'user';

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public."user" (id, email, role, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

