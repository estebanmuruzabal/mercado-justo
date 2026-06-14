-- R5.4: Recipe protocol grower library RLS + taxonomy seed.

-- Ensure recipe type is persistable and labeled for Grower ecosystem.
UPDATE public.publication_type_definition
SET
  display_name = 'Protocolos',
  ecosystem = 'bots',
  is_persistable = true
WHERE code = 'recipe';

-- Grower membership helper (activated DittoBot ownership).
CREATE OR REPLACE FUNCTION public.has_active_ditto_bot(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.ditto_bot_inventory_unit
    WHERE owner_user_id = p_user_id
      AND status = 'activated'
  );
$$;

COMMENT ON FUNCTION public.has_active_ditto_bot IS
  'R5.4: True when user owns at least one activated DittoBot inventory unit.';

-- Grower community library: approved published public recipe protocols.
CREATE POLICY "publication_select_recipe_grower_library"
  ON public.publication
  FOR SELECT
  TO authenticated
  USING (
    publication_type = 'recipe'
    AND lifecycle_state = 'published'
    AND moderation_status = 'approved'
    AND visibility = 'public'
    AND public.has_active_ditto_bot(auth.uid())
  );

COMMENT ON POLICY "publication_select_recipe_grower_library" ON public.publication IS
  'R5.4: Grower members may read approved community protocol library.';

-- Protocol taxonomy node (Grower ecosystem).
INSERT INTO public.taxonomy_node (id, slug, name, allowed_types, is_visible, sort_order)
SELECT
  gen_random_uuid(),
  'protocolos',
  'Protocolos',
  ARRAY['recipe'],
  false,
  900
WHERE NOT EXISTS (
  SELECT 1 FROM public.taxonomy_node WHERE slug = 'protocolos'
);

-- ROLLBACK (manual):
-- DROP POLICY IF EXISTS publication_select_recipe_grower_library ON public.publication;
-- DROP FUNCTION IF EXISTS public.has_active_ditto_bot(uuid);
