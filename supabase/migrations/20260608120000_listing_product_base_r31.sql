-- R3.1: connect seller listings to Product Base templates.

ALTER TABLE public.listing
  ADD COLUMN IF NOT EXISTS product_base_id uuid REFERENCES public.product_base(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.listing
  DROP CONSTRAINT IF EXISTS listing_images_is_array,
  ADD CONSTRAINT listing_images_is_array CHECK (jsonb_typeof(images) = 'array');

CREATE INDEX IF NOT EXISTS listing_product_base_id_idx
  ON public.listing (product_base_id);

CREATE INDEX IF NOT EXISTS listing_store_product_base_idx
  ON public.listing (store_id, product_base_id);

COMMENT ON COLUMN public.listing.product_base_id IS
  'R3.1: Product Base template used to render seller listing attributes.';

COMMENT ON COLUMN public.listing.images IS
  'R3.1: Listing-owned image URLs. Does not include Product Base base_image_url.';

-- Seller listing images live under store-assets/{store_id}/listings/*.
-- In this schema public.store.id is the owner auth.users.id.
CREATE POLICY "Store owners can upload listing assets"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'store-assets'
    AND (storage.foldername(name))[2] = 'listings'
    AND EXISTS (
      SELECT 1
      FROM public.store s
      WHERE s.id::text = (storage.foldername(name))[1]
        AND s.id = auth.uid()
    )
  );

CREATE POLICY "Store owners can update listing assets"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'store-assets'
    AND (storage.foldername(name))[2] = 'listings'
    AND EXISTS (
      SELECT 1
      FROM public.store s
      WHERE s.id::text = (storage.foldername(name))[1]
        AND s.id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'store-assets'
    AND (storage.foldername(name))[2] = 'listings'
    AND EXISTS (
      SELECT 1
      FROM public.store s
      WHERE s.id::text = (storage.foldername(name))[1]
        AND s.id = auth.uid()
    )
  );

CREATE POLICY "Store owners can delete listing assets"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'store-assets'
    AND (storage.foldername(name))[2] = 'listings'
    AND EXISTS (
      SELECT 1
      FROM public.store s
      WHERE s.id::text = (storage.foldername(name))[1]
        AND s.id = auth.uid()
    )
  );
