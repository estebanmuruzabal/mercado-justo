-- R3.0: allow super-admin uploads for Product Base images under admin/product-bases/.
-- Existing store-assets policies only allow auth.uid() = first folder segment (vendor)
-- or official-vendor ditto-products paths.

CREATE POLICY "Super admin can upload product base assets"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'store-assets'
    AND public.is_super_admin()
    AND (storage.foldername(name))[1] = 'admin'
    AND (storage.foldername(name))[2] = 'product-bases'
  );

CREATE POLICY "Super admin can update product base assets"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'store-assets'
    AND public.is_super_admin()
    AND (storage.foldername(name))[1] = 'admin'
    AND (storage.foldername(name))[2] = 'product-bases'
  )
  WITH CHECK (
    bucket_id = 'store-assets'
    AND public.is_super_admin()
    AND (storage.foldername(name))[1] = 'admin'
    AND (storage.foldername(name))[2] = 'product-bases'
  );

CREATE POLICY "Super admin can delete product base assets"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'store-assets'
    AND public.is_super_admin()
    AND (storage.foldername(name))[1] = 'admin'
    AND (storage.foldername(name))[2] = 'product-bases'
  );

-- ROLLBACK (manual):
-- DROP POLICY IF EXISTS "Super admin can upload product base assets" ON storage.objects;
-- DROP POLICY IF EXISTS "Super admin can update product base assets" ON storage.objects;
-- DROP POLICY IF EXISTS "Super admin can delete product base assets" ON storage.objects;
