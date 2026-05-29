-- Add product listing coordinates (used for distance/radio searches later).
alter table public.listing
add column if not exists latitude numeric,
add column if not exists longitude numeric;

