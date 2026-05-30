-- Public storage bucket for vendor branding (banner + logo).
-- Files live under "<user_id>/..." so a user can only write to their own folder.

insert into storage.buckets (id, name, public)
values ('store-assets', 'store-assets', true)
on conflict (id) do nothing;

create policy "Public can read store assets"
  on storage.objects
  for select
  using (bucket_id = 'store-assets');

create policy "Users can upload own store assets"
  on storage.objects
  for insert
  with check (
    bucket_id = 'store-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own store assets"
  on storage.objects
  for update
  using (
    bucket_id = 'store-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own store assets"
  on storage.objects
  for delete
  using (
    bucket_id = 'store-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
