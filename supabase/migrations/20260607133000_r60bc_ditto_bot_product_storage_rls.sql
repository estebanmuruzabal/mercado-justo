-- R6.0bc: Allow SuperAdmin to upload DittoBot catalog images under official vendor store folder.
-- Existing store-assets policies require auth.uid() = first path segment (vendor user id).
-- DittoBot product images use "{official_store_id}/ditto-products/..." instead.

CREATE POLICY "Super admin can upload ditto product assets"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'store-assets'
    AND public.is_super_admin()
    AND (storage.foldername(name))[2] = 'ditto-products'
    AND EXISTS (
      SELECT 1
      FROM public.store s
      WHERE s.id::text = (storage.foldername(name))[1]
        AND s.is_official_ditto_bot_vendor = true
    )
  );

CREATE POLICY "Super admin can update ditto product assets"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'store-assets'
    AND public.is_super_admin()
    AND (storage.foldername(name))[2] = 'ditto-products'
    AND EXISTS (
      SELECT 1
      FROM public.store s
      WHERE s.id::text = (storage.foldername(name))[1]
        AND s.is_official_ditto_bot_vendor = true
    )
  );

CREATE POLICY "Super admin can delete ditto product assets"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'store-assets'
    AND public.is_super_admin()
    AND (storage.foldername(name))[2] = 'ditto-products'
    AND EXISTS (
      SELECT 1
      FROM public.store s
      WHERE s.id::text = (storage.foldername(name))[1]
        AND s.is_official_ditto_bot_vendor = true
    )
  );

-- ROLLBACK (manual):
-- DROP POLICY IF EXISTS "Super admin can upload ditto product assets" ON storage.objects;
-- DROP POLICY IF EXISTS "Super admin can update ditto product assets" ON storage.objects;
-- DROP POLICY IF EXISTS "Super admin can delete ditto product assets" ON storage.objects;
