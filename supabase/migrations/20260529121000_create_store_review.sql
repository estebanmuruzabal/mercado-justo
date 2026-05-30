-- Reviews with comments for vendor stores. One review per user per store.
-- Author display name/avatar are denormalized because public."user" RLS only
-- allows reading your own profile row. rating_avg + review_count on store are
-- kept in sync via trigger.

create table if not exists public.store_review (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.store(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text,
  author_avatar_url text,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, author_id)
);

create index if not exists store_review_store_id_idx on public.store_review (store_id);
create index if not exists store_review_created_at_idx on public.store_review (store_id, created_at desc);

alter table public.store_review enable row level security;

-- Reviews are public content.
create policy "Anyone can read reviews" on public.store_review
  for select using (true);

create policy "Users can create own review" on public.store_review
  for insert with check (auth.uid() = author_id);

create policy "Users can update own review" on public.store_review
  for update using (auth.uid() = author_id);

create policy "Users can delete own review" on public.store_review
  for delete using (auth.uid() = author_id);

create trigger store_review_set_updated_at
  before update on public.store_review
  for each row execute function public.handle_updated_at();

create or replace function public.sync_store_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_store uuid := coalesce(new.store_id, old.store_id);
begin
  update public.store s
  set
    review_count = agg.cnt,
    rating_avg = coalesce(agg.avg, 0)
  from (
    select
      count(*) as cnt,
      round(avg(rating)::numeric, 2) as avg
    from public.store_review
    where store_id = target_store
  ) agg
  where s.id = target_store;

  return coalesce(new, old);
end;
$$;

create trigger store_review_rating_trigger
  after insert or update or delete on public.store_review
  for each row execute function public.sync_store_rating();
