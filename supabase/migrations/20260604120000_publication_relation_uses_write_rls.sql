-- R5.2: INSERT-only write policies for publication_relation uses edges.
-- DELETE deferred to R5.2b.
--
-- ROLLBACK (manual):
-- DROP POLICY IF EXISTS publication_relation_insert_uses_source_owner ON public.publication_relation;
-- DROP POLICY IF EXISTS publication_relation_insert_uses_staff ON public.publication_relation;

CREATE POLICY "publication_relation_insert_uses_source_owner"
  ON public.publication_relation
  FOR INSERT
  TO authenticated
  WITH CHECK (
    relation_type = 'uses'
    AND EXISTS (
      SELECT 1
      FROM public.publication src
      WHERE src.id = source_publication_id
        AND src.publication_type = 'recipe'
        AND (
          (src.owner_type = 'store' AND src.owner_id = auth.uid())
          OR (src.owner_type = 'user' AND src.owner_id = auth.uid())
        )
    )
    AND EXISTS (
      SELECT 1
      FROM public.publication tgt
      WHERE tgt.id = target_publication_id
        AND tgt.publication_type = 'product'
    )
  );

COMMENT ON POLICY "publication_relation_insert_uses_source_owner"
  ON public.publication_relation IS
  'R5.2: Recipe source owner may INSERT uses edges to product targets.';

CREATE POLICY "publication_relation_insert_uses_staff"
  ON public.publication_relation
  FOR INSERT
  TO authenticated
  WITH CHECK (
    relation_type = 'uses'
    AND public.is_staff()
    AND EXISTS (
      SELECT 1
      FROM public.publication src
      WHERE src.id = source_publication_id
        AND src.publication_type = 'recipe'
    )
    AND EXISTS (
      SELECT 1
      FROM public.publication tgt
      WHERE tgt.id = target_publication_id
        AND tgt.publication_type = 'product'
    )
  );

COMMENT ON POLICY "publication_relation_insert_uses_staff"
  ON public.publication_relation IS
  'R5.2: Platform staff may INSERT uses edges (recipe → product).';
