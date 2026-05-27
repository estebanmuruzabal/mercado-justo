-- Add public Instagram handle/URL to seller store profile.
alter table public.store
add column if not exists instagram text;

