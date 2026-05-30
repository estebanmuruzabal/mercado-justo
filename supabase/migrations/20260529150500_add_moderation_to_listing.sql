-- Product/listing moderation state, independent from the publish lifecycle
-- (listing_status: draft|published). Moderation decisions are made by staff via
-- audited service-role actions and drive the admin Listings moderation queue.
--
-- moderation_status:
--   pending  - awaiting review (default for new listings)
--   approved - reviewed and allowed
--   rejected - reviewed and denied
--   hidden   - taken down by a moderator

alter table public.listing
  add column if not exists moderation_status text not null default 'pending',
  add column if not exists moderation_reason text,
  add column if not exists moderated_by uuid references auth.users(id) on delete set null,
  add column if not exists moderated_at timestamptz;

alter table public.listing
  drop constraint if exists listing_moderation_status_check;

alter table public.listing
  add constraint listing_moderation_status_check
  check (moderation_status in ('pending', 'approved', 'rejected', 'hidden'));

create index if not exists listing_moderation_status_idx
  on public.listing (moderation_status);
