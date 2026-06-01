-- R6.0bc UX: public DittoBot sellable stock counts from inventory (not listing.stock).

CREATE OR REPLACE FUNCTION public.ditto_bot_public_stock_by_product(p_product_ids uuid[])
RETURNS TABLE(product_id uuid, stock_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.product_id, COUNT(*)::bigint AS stock_count
  FROM public.ditto_bot_inventory_unit u
  WHERE u.product_id = ANY(p_product_ids)
    AND u.status IN ('available', 'assigned')
  GROUP BY u.product_id;
$$;

REVOKE ALL ON FUNCTION public.ditto_bot_public_stock_by_product(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ditto_bot_public_stock_by_product(uuid[]) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.ditto_bot_public_stock_by_product IS
  'R6.0bc: Public sellable stock for DittoBot products — physical units (available + assigned), not listing.stock.';

-- ROLLBACK (manual):
-- DROP FUNCTION IF EXISTS public.ditto_bot_public_stock_by_product(uuid[]);
