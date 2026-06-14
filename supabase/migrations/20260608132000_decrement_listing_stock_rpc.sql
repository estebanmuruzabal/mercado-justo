-- Checkout stock debit: atomic listing stock decrement.

CREATE OR REPLACE FUNCTION public.decrement_listing_stock(
  p_listing_id uuid,
  p_quantity integer
)
RETURNS TABLE(id uuid, stock integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive';
  END IF;

  RETURN QUERY
  UPDATE public.listing l
  SET stock = l.stock - p_quantity
  WHERE l.id = p_listing_id
    AND l.stock >= p_quantity
  RETURNING l.id, l.stock;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_listing_stock(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_listing_stock(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_listing_stock(uuid, integer) TO service_role;

COMMENT ON FUNCTION public.decrement_listing_stock(uuid, integer) IS
  'Atomically decrements listing.stock when enough stock exists. Empty result means insufficient stock or missing listing.';

-- ROLLBACK (manual):
-- DROP FUNCTION IF EXISTS public.decrement_listing_stock(uuid, integer);
