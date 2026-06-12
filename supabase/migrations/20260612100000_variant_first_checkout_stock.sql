-- Variant-first checkout stock handling.
-- The source of truth for purchasable inventory is listing_variant.stock.
-- listing.stock is kept as a legacy aggregate via trigger for compatibility only.

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
  UPDATE public.listing_variant lv
  SET stock = lv.stock - p_quantity
  WHERE lv.id = p_listing_id
    AND lv.stock >= p_quantity
  RETURNING lv.id, lv.stock;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_listing_stock_from_variants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing_id uuid;
BEGIN
  v_listing_id := COALESCE(NEW.listing_id, OLD.listing_id);

  UPDATE public.listing l
  SET stock = COALESCE(
    (
      SELECT SUM(lv.stock)
      FROM public.listing_variant lv
      WHERE lv.listing_id = v_listing_id
    ),
    0
  )
  WHERE l.id = v_listing_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_listing_stock_from_variants ON public.listing_variant;
CREATE TRIGGER trg_sync_listing_stock_from_variants
  AFTER INSERT OR UPDATE OR DELETE ON public.listing_variant
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_listing_stock_from_variants();

CREATE OR REPLACE FUNCTION public.create_orders_from_cart(
  p_buyer_id uuid,
  p_lines jsonb
)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lines jsonb := COALESCE(p_lines, '[]'::jsonb);
  v_seller_id uuid;
  v_order_id uuid;
  v_order_ids uuid[] := ARRAY[]::uuid[];
  v_subtotal numeric;
  v_line record;
  v_stock_after integer;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_buyer_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF jsonb_typeof(v_lines) <> 'array' OR jsonb_array_length(v_lines) = 0 THEN
    RAISE EXCEPTION 'Cart is empty.';
  END IF;

  FOR v_seller_id IN
    SELECT DISTINCT l.store_id
    FROM jsonb_to_recordset(v_lines) AS line(
      listing_id uuid,
      variant_id uuid,
      quantity integer
    )
    JOIN public.listing l ON l.id = line.listing_id
    JOIN public.listing_variant lv ON lv.id = line.variant_id AND lv.listing_id = line.listing_id
  LOOP
    IF v_seller_id = p_buyer_id THEN
      RAISE EXCEPTION 'No podés comprar tus propios productos.';
    END IF;

    SELECT COALESCE(SUM(line.quantity * line.unit_price), 0)
    INTO v_subtotal
    FROM jsonb_to_recordset(v_lines) AS line(
      listing_id uuid,
      variant_id uuid,
      quantity integer,
      unit_price numeric
    )
    JOIN public.listing l ON l.id = line.listing_id
    JOIN public.listing_variant lv ON lv.id = line.variant_id AND lv.listing_id = line.listing_id
    WHERE l.store_id = v_seller_id;

    INSERT INTO public."order" (
      buyer_id,
      seller_id,
      status,
      payment_status,
      subtotal,
      delivery_price,
      total
    )
    VALUES (
      p_buyer_id,
      v_seller_id,
      'pending',
      'unpaid',
      v_subtotal,
      0,
      v_subtotal
    )
    RETURNING id INTO v_order_id;

    v_order_ids := array_append(v_order_ids, v_order_id);

    FOR v_line IN
      SELECT
        line.listing_id,
        line.variant_id,
        line.quantity,
        line.unit_price,
        line.title_snapshot,
        line.variant_snapshot,
        l.title AS listing_title
      FROM jsonb_to_recordset(v_lines) AS line(
        listing_id uuid,
        variant_id uuid,
        quantity integer,
        unit_price numeric,
        title_snapshot text,
        variant_snapshot jsonb
      )
      JOIN public.listing l ON l.id = line.listing_id
      JOIN public.listing_variant lv ON lv.id = line.variant_id AND lv.listing_id = line.listing_id
      WHERE l.store_id = v_seller_id
    LOOP
      UPDATE public.listing_variant lv
      SET stock = lv.stock - v_line.quantity
      WHERE lv.id = v_line.variant_id
        AND lv.stock >= v_line.quantity
      RETURNING lv.stock INTO v_stock_after;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Stock insuficiente para %.', COALESCE(v_line.title_snapshot, v_line.listing_title, v_line.variant_id::text);
      END IF;

      INSERT INTO public.order_item (
        order_id,
        listing_id,
        variant_id,
        quantity,
        title_snapshot,
        variant_snapshot,
        price_snapshot
      )
      VALUES (
        v_order_id,
        v_line.listing_id,
        v_line.variant_id,
        v_line.quantity,
        v_line.title_snapshot,
        COALESCE(v_line.variant_snapshot, '{}'::jsonb),
        v_line.unit_price
      );
    END LOOP;
  END LOOP;

  IF array_length(v_order_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'No se pudo crear la orden.';
  END IF;

  RETURN v_order_ids;
END;
$$;

REVOKE ALL ON FUNCTION public.create_orders_from_cart(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_orders_from_cart(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_orders_from_cart(uuid, jsonb) TO service_role;

COMMENT ON FUNCTION public.create_orders_from_cart(uuid, jsonb) IS
  'Creates one order per vendor from checkout lines and atomically decrements listing_variant.stock.';

-- ROLLBACK (manual):
-- DROP TRIGGER IF EXISTS trg_sync_listing_stock_from_variants ON public.listing_variant;
-- DROP FUNCTION IF EXISTS public.sync_listing_stock_from_variants();
-- DROP FUNCTION IF EXISTS public.create_orders_from_cart(uuid, jsonb);
