-- Follow system: a user can follow many stores. Counts are denormalized onto
-- public.store.follower_count via trigger so the public profile reads are O(1).

create table if not exists public.vendor_follower (
  follower_id uuid not null references auth.users(id) on delete cascade,
  store_id uuid not null references public.store(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, store_id)
);

create index if not exists vendor_follower_store_id_idx on public.vendor_follower (store_id);

alter table public.vendor_follower enable row level security;

-- A user can only see / manage their own follow rows. Public follower totals are
-- exposed through store.follower_count, never through raw follower ids.
create policy "Users can view own follows" on public.vendor_follower
  for select using (auth.uid() = follower_id);

create policy "Users can follow stores" on public.vendor_follower
  for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow stores" on public.vendor_follower
  for delete using (auth.uid() = follower_id);

create or replace function public.sync_store_follower_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.store
      set follower_count = follower_count + 1
      where id = new.store_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.store
      set follower_count = greatest(follower_count - 1, 0)
      where id = old.store_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger vendor_follower_count_trigger
  after insert or delete on public.vendor_follower
  for each row execute function public.sync_store_follower_count();
