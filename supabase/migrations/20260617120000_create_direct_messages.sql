-- Direct messages MVP: 1:1 conversations between users.

ALTER TABLE public."user"
  ADD COLUMN IF NOT EXISTS allow_direct_messages boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public."user".allow_direct_messages IS
  'When true, other users may start new direct conversations with this user.';

CREATE TABLE IF NOT EXISTS public.conversation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_participant (
  conversation_id uuid NOT NULL REFERENCES public.conversation(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.conversation_direct_pair (
  conversation_id uuid PRIMARY KEY REFERENCES public.conversation(id) ON DELETE CASCADE,
  user_low uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_high uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  CHECK (user_low < user_high),
  UNIQUE (user_low, user_high)
);

CREATE TABLE IF NOT EXISTS public.message (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversation(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(trim(body)) > 0 AND char_length(body) <= 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversation_last_message_at_idx
  ON public.conversation (last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS conversation_participant_user_id_idx
  ON public.conversation_participant (user_id);

CREATE INDEX IF NOT EXISTS message_conversation_created_at_idx
  ON public.message (conversation_id, created_at ASC);

ALTER TABLE public.conversation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participant ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_direct_pair ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participant cp
    WHERE cp.conversation_id = p_conversation_id
      AND cp.user_id = p_user_id
  );
$$;

CREATE POLICY conversation_select_participant ON public.conversation
  FOR SELECT
  USING (public.is_conversation_participant(id, auth.uid()));

CREATE POLICY conversation_participant_select_own ON public.conversation_participant
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY conversation_participant_update_own ON public.conversation_participant
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY message_select_participant ON public.message
  FOR SELECT
  USING (public.is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY message_insert_participant ON public.message
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_conversation_participant(conversation_id, auth.uid())
  );

CREATE OR REPLACE FUNCTION public.truncate_message_preview(p_body text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN char_length(p_body) <= 120 THEN p_body
    ELSE left(p_body, 117) || '...'
  END;
$$;

CREATE OR REPLACE FUNCTION public.touch_conversation_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversation
  SET
    last_message_at = NEW.created_at,
    last_message_preview = public.truncate_message_preview(NEW.body),
    updated_at = now()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_conversation_on_message ON public.message;
CREATE TRIGGER trg_touch_conversation_on_message
  AFTER INSERT ON public.message
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_conversation_on_message();

CREATE OR REPLACE FUNCTION public.format_user_location_label(
  p_visibility boolean,
  p_city text,
  p_province text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN NOT COALESCE(p_visibility, false) THEN NULL
    WHEN nullif(trim(p_city), '') IS NOT NULL AND nullif(trim(p_province), '') IS NOT NULL
      THEN trim(p_city) || ', ' || trim(p_province)
    WHEN nullif(trim(p_city), '') IS NOT NULL THEN trim(p_city)
    WHEN nullif(trim(p_province), '') IS NOT NULL THEN trim(p_province)
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.search_messageable_users(p_query text, p_limit int DEFAULT 20)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  location_label text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_query text := trim(coalesce(p_query, ''));
  v_limit int := greatest(1, least(coalesce(p_limit, 20), 50));
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF char_length(v_query) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    coalesce(nullif(trim(u.full_name), ''), nullif(trim(u.username), ''), 'Usuario') AS full_name,
    u.avatar_url,
    public.format_user_location_label(u.location_visibility, u.location_city, u.location_province) AS location_label
  FROM public."user" u
  WHERE u.id <> v_actor
    AND u.allow_direct_messages = true
    AND u.status = 'active'
    AND (
      coalesce(u.full_name, '') ILIKE '%' || v_query || '%'
      OR coalesce(u.username, '') ILIKE '%' || v_query || '%'
    )
  ORDER BY u.full_name NULLS LAST, u.username NULLS LAST
  LIMIT v_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(p_other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_low uuid;
  v_high uuid;
  v_conversation_id uuid;
  v_other_allows boolean;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_other_user_id IS NULL OR p_other_user_id = v_actor THEN
    RAISE EXCEPTION 'Invalid recipient';
  END IF;

  SELECT u.allow_direct_messages
  INTO v_other_allows
  FROM public."user" u
  WHERE u.id = p_other_user_id
    AND u.status = 'active';

  IF NOT COALESCE(v_other_allows, false) THEN
    RAISE EXCEPTION 'User does not accept direct messages';
  END IF;

  IF v_actor < p_other_user_id THEN
    v_low := v_actor;
    v_high := p_other_user_id;
  ELSE
    v_low := p_other_user_id;
    v_high := v_actor;
  END IF;

  SELECT cdp.conversation_id
  INTO v_conversation_id
  FROM public.conversation_direct_pair cdp
  WHERE cdp.user_low = v_low
    AND cdp.user_high = v_high;

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  INSERT INTO public.conversation DEFAULT VALUES
  RETURNING id INTO v_conversation_id;

  INSERT INTO public.conversation_participant (conversation_id, user_id)
  VALUES
    (v_conversation_id, v_actor),
    (v_conversation_id, p_other_user_id);

  INSERT INTO public.conversation_direct_pair (conversation_id, user_low, user_high)
  VALUES (v_conversation_id, v_low, v_high);

  RETURN v_conversation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_messageable_users(text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(uuid) TO authenticated;

-- Allow reading basic profile of users who share a direct conversation with the actor.
CREATE POLICY user_select_conversation_counterpart ON public."user"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversation_participant cp_self
      JOIN public.conversation_participant cp_other
        ON cp_self.conversation_id = cp_other.conversation_id
      WHERE cp_self.user_id = auth.uid()
        AND cp_other.user_id = public."user".id
        AND cp_other.user_id <> cp_self.user_id
    )
  );
