-- Pre-R5.4 audit P1: defense-in-depth — recipe protocol INSERT requires Grower membership.

CREATE POLICY "publication_insert_recipe_requires_grower"
  ON public.publication
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    publication_type <> 'recipe'
    OR public.has_active_ditto_bot(auth.uid())
    OR public.is_super_admin()
  );

COMMENT ON POLICY "publication_insert_recipe_requires_grower" ON public.publication IS
  'R5.4a: Only Growers (activated DittoBot) or super-admin may INSERT recipe protocols.';

-- ROLLBACK (manual):
-- DROP POLICY IF EXISTS publication_insert_recipe_requires_grower ON public.publication;
