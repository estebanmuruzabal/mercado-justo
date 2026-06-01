-- R6.0bc stock audit: public marketplace stock = assigned units at regional vendors only.

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
    AND u.status = 'assigned'
    AND u.assigned_vendor_id IS NOT NULL
  GROUP BY u.product_id;
$$;

COMMENT ON FUNCTION public.ditto_bot_public_stock_by_product IS
  'R6.0bc audit: Public sellable stock — assigned units with regional vendor only (excludes warehouse available).';

-- ROLLBACK (manual): restore prior definition from 20260607131000 or:
-- CREATE OR REPLACE FUNCTION public.ditto_bot_public_stock_by_product(p_product_ids uuid[])
-- RETURNS TABLE(product_id uuid, stock_count bigint)
-- LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
-- AS $$
--   SELECT u.product_id, COUNT(*)::bigint AS stock_count
--   FROM public.ditto_bot_inventory_unit u
--   WHERE u.product_id = ANY(p_product_ids)
--     AND u.status IN ('available', 'assigned')
--   GROUP BY u.product_id;
-- $$;
