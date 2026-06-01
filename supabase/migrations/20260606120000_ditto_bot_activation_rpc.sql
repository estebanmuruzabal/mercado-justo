-- Pre-R5.4 audit P1: activation via SECURITY DEFINER RPC; remove broad SELECT/UPDATE activation policies.

CREATE OR REPLACE FUNCTION public.activate_ditto_bot_unit(
  p_serial_number text,
  p_activation_code text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_unit public.ditto_bot_inventory_unit%ROWTYPE;
  v_user_lat numeric(10, 7);
  v_user_lng numeric(10, 7);
  v_user_region text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED: Debés iniciar sesión para activar un DittoBot.';
  END IF;

  SELECT * INTO v_unit
  FROM public.ditto_bot_inventory_unit
  WHERE serial_number = upper(trim(p_serial_number));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: No se encontró un dispositivo con ese número de serie.';
  END IF;

  IF v_unit.owner_user_id IS NOT NULL OR v_unit.status = 'activated' THEN
    RAISE EXCEPTION 'ALREADY_ACTIVATED: Este dispositivo ya fue activado.';
  END IF;

  IF v_unit.status NOT IN ('available', 'sold') THEN
    RAISE EXCEPTION 'INVALID_STATUS: Este dispositivo no está disponible para activación.';
  END IF;

  IF upper(trim(p_activation_code)) <> upper(trim(v_unit.activation_code)) THEN
    RAISE EXCEPTION 'INVALID_CODE: El código de activación no es válido.';
  END IF;

  SELECT location_lat, location_lng, location_region
  INTO v_user_lat, v_user_lng, v_user_region
  FROM public."user"
  WHERE id = v_user_id;

  UPDATE public.ditto_bot_inventory_unit
  SET
    owner_user_id = v_user_id,
    status = 'activated',
    activated_at = now(),
    location_lat = CASE
      WHEN inherits_user_location THEN v_user_lat
      ELSE location_lat
    END,
    location_lng = CASE
      WHEN inherits_user_location THEN v_user_lng
      ELSE location_lng
    END,
    location_region = CASE
      WHEN inherits_user_location THEN v_user_region
      ELSE location_region
    END,
    updated_at = now()
  WHERE id = v_unit.id
    AND owner_user_id IS NULL
    AND status IN ('available', 'sold');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ALREADY_ACTIVATED: Este dispositivo ya fue activado.';
  END IF;

  RETURN v_unit.id;
END;
$$;

COMMENT ON FUNCTION public.activate_ditto_bot_unit(text, text) IS
  'R5.4a: Atomically validate serial/code and claim DittoBot inventory unit for auth.uid().';

REVOKE ALL ON FUNCTION public.activate_ditto_bot_unit(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_ditto_bot_unit(text, text) TO authenticated;

-- Remove policies that exposed unowned rows or allowed code-less activation.
DROP POLICY IF EXISTS "ditto_bot_select_for_activation" ON public.ditto_bot_inventory_unit;
DROP POLICY IF EXISTS "ditto_bot_activate" ON public.ditto_bot_inventory_unit;

-- ROLLBACK (manual):
-- DROP FUNCTION IF EXISTS public.activate_ditto_bot_unit(text, text);
-- Recreate ditto_bot_select_for_activation and ditto_bot_activate from 20260605120000.
