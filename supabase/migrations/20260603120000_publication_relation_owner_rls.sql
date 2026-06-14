-- R3.4: Owner-aware SELECT policies for publication_relation.
--
-- BASELINE (pre-R3.4 — publication_relation):
--   publication_relation_select_public  → visibility IN ('public', 'inherit')
--
-- BASELINE (publication — unchanged by this migration; referenced by EXISTS):
--   publication_select_published, publication_select_owner_store,
--   publication_select_owner_user, publication_update_owner_*,
--   publication_insert_authenticated
--
-- NEW POLICIES (additive PERMISSIVE OR):
--   publication_relation_select_private_source_owner → private edges for source owner
--   publication_relation_select_staff                  → all rows for platform staff
--
-- service_role bypasses RLS natively (not expressible as a policy).

CREATE POLICY "publication_relation_select_private_source_owner"
  ON public.publication_relation
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'private'
    AND EXISTS (
      SELECT 1
      FROM public.publication src
      WHERE src.id = publication_relation.source_publication_id
        AND (
          (src.owner_type = 'store' AND src.owner_id = auth.uid())
          OR (src.owner_type = 'user' AND src.owner_id = auth.uid())
        )
    )
  );

COMMENT ON POLICY "publication_relation_select_private_source_owner"
  ON public.publication_relation IS
  'R3.4: Authenticated source publication owner may read private relation edges. '
  'Mirrors application auth (isStoreOwner/isUserOwner on source). '
  'Nested publication RLS applies inside EXISTS subquery.';

CREATE POLICY "publication_relation_select_staff"
  ON public.publication_relation
  FOR SELECT
  TO authenticated
  USING (public.is_staff());

COMMENT ON POLICY "publication_relation_select_staff"
  ON public.publication_relation IS
  'R3.4: Platform staff (is_staff) may read all relation edges. '
  'Aligns with admin-read pattern on listing/order. '
  'Application isAdmin flag should be set when user is staff.';

-- ROLLBACK (manual — revert R3.4 publication_relation owner policies only):
-- DROP POLICY IF EXISTS publication_relation_select_private_source_owner ON public.publication_relation;
-- DROP POLICY IF EXISTS publication_relation_select_staff ON public.publication_relation;
