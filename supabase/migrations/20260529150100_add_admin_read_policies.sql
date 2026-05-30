-- Hybrid admin access (part 1 of 2): cross-vendor READ visibility via RLS.
--
-- These policies are ADDITIVE: they grant platform staff (is_staff()) SELECT access
-- across all rows. Existing owner/public policies are left untouched, so vendor
-- isolation (auth.uid() = id / store_id) and public storefront reads still apply.
--
-- Sensitive WRITES are NOT granted here; those go through audited service-role
-- server actions (see server/admin/*).

-- Stores / vendors (already public-select, but explicit staff policy documents intent
-- and keeps admin reads working even if the public policy is tightened later).
drop policy if exists "Staff can view all stores" on public.store;
create policy "Staff can view all stores"
  on public.store
  for select
  using (public.is_staff());

-- Listings (owner + published-public today; staff sees every listing in any status).
drop policy if exists "Staff can view all listings" on public.listing;
create policy "Staff can view all listings"
  on public.listing
  for select
  using (public.is_staff());

-- Orders.
drop policy if exists "Staff can view all orders" on public.order;
create policy "Staff can view all orders"
  on public.order
  for select
  using (public.is_staff());

-- Order items.
drop policy if exists "Staff can view all order items" on public.order_item;
create policy "Staff can view all order items"
  on public.order_item
  for select
  using (public.is_staff());

-- Store reviews.
drop policy if exists "Staff can view all store reviews" on public.store_review;
create policy "Staff can view all store reviews"
  on public.store_review
  for select
  using (public.is_staff());

-- Notifications (staff can read any user's notifications for the ops alert center).
drop policy if exists "Staff can view all notifications" on public.notification;
create policy "Staff can view all notifications"
  on public.notification
  for select
  using (public.is_staff());

-- App users (staff need this for "new users" KPI and vendor owner lookups).
drop policy if exists "Staff can view all users" on public."user";
create policy "Staff can view all users"
  on public."user"
  for select
  using (public.is_staff());
