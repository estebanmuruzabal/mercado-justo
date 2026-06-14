-- R5.4: DittoBot inventory unit table with device geolocation and RLS.

CREATE TABLE IF NOT EXISTS public.ditto_bot_inventory_unit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number text NOT NULL UNIQUE,
  activation_code text NOT NULL,
  model text NOT NULL,
  subtype text,
  status text NOT NULL CHECK (status IN ('available', 'sold', 'activated', 'retired')),
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  activated_at timestamptz,
  location_lat numeric(10, 7),
  location_lng numeric(10, 7),
  location_region text,
  inherits_user_location boolean NOT NULL DEFAULT true,
  is_public_on_map boolean NOT NULL DEFAULT false,
  friendly_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ditto_bot_inventory_serial_idx
  ON public.ditto_bot_inventory_unit (serial_number);

CREATE INDEX IF NOT EXISTS ditto_bot_inventory_owner_idx
  ON public.ditto_bot_inventory_unit (owner_user_id)
  WHERE owner_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ditto_bot_inventory_status_idx
  ON public.ditto_bot_inventory_unit (status);

CREATE INDEX IF NOT EXISTS ditto_bot_inventory_public_map_idx
  ON public.ditto_bot_inventory_unit (is_public_on_map)
  WHERE is_public_on_map = true;

ALTER TABLE public.ditto_bot_inventory_unit ENABLE ROW LEVEL SECURITY;

-- Owner reads own devices (activation_code hidden at application layer for user queries).
CREATE POLICY "ditto_bot_select_own"
  ON public.ditto_bot_inventory_unit
  FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());

-- Pre-activation lookup for activation flow (serial + code validated in app).
CREATE POLICY "ditto_bot_select_for_activation"
  ON public.ditto_bot_inventory_unit
  FOR SELECT
  TO authenticated
  USING (
    status IN ('available', 'sold')
    AND owner_user_id IS NULL
  );

-- Initial activation: claim unowned unit.
CREATE POLICY "ditto_bot_activate"
  ON public.ditto_bot_inventory_unit
  FOR UPDATE
  TO authenticated
  USING (
    status IN ('available', 'sold')
    AND owner_user_id IS NULL
  )
  WITH CHECK (
    owner_user_id = auth.uid()
    AND status = 'activated'
  );

-- Owner updates device settings on activated units (not serial/status/owner/activation_code).
CREATE POLICY "ditto_bot_update_own_settings"
  ON public.ditto_bot_inventory_unit
  FOR UPDATE
  TO authenticated
  USING (
    owner_user_id = auth.uid()
    AND status = 'activated'
  )
  WITH CHECK (
    owner_user_id = auth.uid()
    AND status = 'activated'
  );

COMMENT ON TABLE public.ditto_bot_inventory_unit IS
  'R5.4: DittoBot hardware inventory. Location is device-owned; admin writes via service role.';

-- ROLLBACK (manual):
-- DROP TABLE IF EXISTS public.ditto_bot_inventory_unit;
