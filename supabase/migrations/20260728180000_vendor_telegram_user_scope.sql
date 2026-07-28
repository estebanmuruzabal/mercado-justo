-- Generalize vendor_telegram from store-scoped to user-scoped account linking.
-- Existing rows keep working because store.id === auth.uid() for vendors.

-- Drop old store FK and RLS policies keyed on store_id.
ALTER TABLE public.vendor_telegram
  DROP CONSTRAINT IF EXISTS vendor_telegram_store_id_fkey;

DROP POLICY IF EXISTS "Vendors can view own telegram settings" ON public.vendor_telegram;
DROP POLICY IF EXISTS "Vendors can insert own telegram settings" ON public.vendor_telegram;
DROP POLICY IF EXISTS "Vendors can update own telegram settings" ON public.vendor_telegram;

DROP INDEX IF EXISTS vendor_telegram_link_token_key;
DROP INDEX IF EXISTS vendor_telegram_chat_id_key;

-- Rename PK column store_id → user_id and re-point FK to public.user.
ALTER TABLE public.vendor_telegram
  RENAME COLUMN store_id TO user_id;

ALTER TABLE public.vendor_telegram
  ADD CONSTRAINT vendor_telegram_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;

-- Connection metadata for end-user linking.
ALTER TABLE public.vendor_telegram
  ADD COLUMN IF NOT EXISTS telegram_user_id text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS status text;

ALTER TABLE public.vendor_telegram
  DROP CONSTRAINT IF EXISTS vendor_telegram_status_check;

ALTER TABLE public.vendor_telegram
  ADD CONSTRAINT vendor_telegram_status_check
  CHECK (status IS NULL OR status IN ('pending', 'connected', 'expired'));

-- Backfill status from existing connection / token state.
UPDATE public.vendor_telegram
SET status = CASE
  WHEN chat_id IS NOT NULL THEN 'connected'
  WHEN link_token IS NOT NULL
    AND link_token_expires_at IS NOT NULL
    AND link_token_expires_at > now() THEN 'pending'
  WHEN link_token IS NOT NULL THEN 'expired'
  ELSE 'expired'
END
WHERE status IS NULL;

ALTER TABLE public.vendor_telegram
  ALTER COLUMN status SET DEFAULT 'pending';

UPDATE public.vendor_telegram
SET status = 'pending'
WHERE status IS NULL;

ALTER TABLE public.vendor_telegram
  ALTER COLUMN status SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS vendor_telegram_link_token_key
  ON public.vendor_telegram (link_token)
  WHERE link_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS vendor_telegram_chat_id_key
  ON public.vendor_telegram (chat_id)
  WHERE chat_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS vendor_telegram_telegram_user_id_key
  ON public.vendor_telegram (telegram_user_id)
  WHERE telegram_user_id IS NOT NULL;

-- RLS: any authenticated user manages only their own row.
CREATE POLICY "Users can view own telegram settings"
  ON public.vendor_telegram
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own telegram settings"
  ON public.vendor_telegram
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own telegram settings"
  ON public.vendor_telegram
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all telegram settings"
  ON public.vendor_telegram
  FOR SELECT
  USING (public.is_staff());

COMMENT ON TABLE public.vendor_telegram IS
  'User-scoped Telegram account linking (historically vendor-only). PK user_id = auth.uid(). Vendor notification prefs remain on the same row.';
COMMENT ON COLUMN public.vendor_telegram.user_id IS
  'Mercado Justo user id (was store_id; for vendors store.id = user.id).';
COMMENT ON COLUMN public.vendor_telegram.status IS
  'pending | connected | expired — connect-token lifecycle.';
