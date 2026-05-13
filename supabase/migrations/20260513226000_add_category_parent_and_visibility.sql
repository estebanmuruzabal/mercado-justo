-- Ensure category hierarchy + visibility exist.

alter table public.category
  add column if not exists parent_id uuid references public.category(id) on delete set null,
  add column if not exists is_visible boolean not null default true;

alter table public.category enable row level security;

-- Minimal RLS write access for authenticated users (UI handles admin gating).
create policy "Authenticated can insert categories" on public.category
  for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated can update categories" on public.category
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated can delete categories" on public.category
  for delete
  using (auth.role() = 'authenticated');

