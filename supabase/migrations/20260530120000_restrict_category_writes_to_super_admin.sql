-- Restrict category mutations to platform super-admins only.
-- Public SELECT remains unchanged for marketplace browsing and listing pickers.

drop policy if exists "Authenticated can insert categories" on public.category;
drop policy if exists "Authenticated can update categories" on public.category;
drop policy if exists "Authenticated can delete categories" on public.category;

create policy "Super admin can insert categories" on public.category
  for insert
  with check (public.is_super_admin());

create policy "Super admin can update categories" on public.category
  for update
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Super admin can delete categories" on public.category
  for delete
  using (public.is_super_admin());

create index if not exists category_parent_id_idx on public.category (parent_id);
