-- R6.0bc fix: storage RLS referenced store.name instead of objects.name inside EXISTS.
-- Symptom: super-admin uploads still fail with "new row violates row-level security policy".
-- Use IN subquery so foldername(name) is evaluated in policy scope (objects.name).

DROP POLICY IF EXISTS "Super admin can upload ditto product assets" ON storage.objects;
DROP POLICY IF EXISTS "Super admin can update ditto product assets" ON storage.objects;
DROP POLICY IF EXISTS "Super admin can delete ditto product assets" ON storage.objects;

CREATE POLICY "Super admin can upload ditto product assets"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'store-assets'
    AND public.is_super_admin()
    AND (storage.foldername(name))[2] = 'ditto-products'
    AND (storage.foldername(name))[1] IN (
      SELECT s.id::text
      FROM public.store s
      WHERE s.is_official_ditto_bot_vendor = true
    )
  );

CREATE POLICY "Super admin can update ditto product assets"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'store-assets'
    AND public.is_super_admin()
    AND (storage.foldername(name))[2] = 'ditto-products'
    AND (storage.foldername(name))[1] IN (
      SELECT s.id::text
      FROM public.store s
      WHERE s.is_official_ditto_bot_vendor = true
    )
  )
  WITH CHECK (
    bucket_id = 'store-assets'
    AND public.is_super_admin()
    AND (storage.foldername(name))[2] = 'ditto-products'
    AND (storage.foldername(name))[1] IN (
      SELECT s.id::text
      FROM public.store s
      WHERE s.is_official_ditto_bot_vendor = true
    )
  );

CREATE POLICY "Super admin can delete ditto product assets"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'store-assets'
    AND public.is_super_admin()
    AND (storage.foldername(name))[2] = 'ditto-products'
    AND (storage.foldername(name))[1] IN (
      SELECT s.id::text
      FROM public.store s
      WHERE s.is_official_ditto_bot_vendor = true
    )
  );
