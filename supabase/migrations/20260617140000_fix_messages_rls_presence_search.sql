-- Fix DM visibility (participant RLS), email search, last_seen_at presence.

ALTER TABLE public."user"
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

COMMENT ON COLUMN public."user".last_seen_at IS
  'Last activity timestamp for basic presence in direct messages.';

DROP POLICY IF EXISTS conversation_participant_select_own ON public.conversation_participant;

CREATE POLICY conversation_participant_select_shared ON public.conversation_participant
  FOR SELECT
  USING (public.is_conversation_participant(conversation_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_user_last_seen()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  UPDATE public."user"
  SET last_seen_at = now()
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.touch_user_last_seen() TO authenticated;

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
    coalesce(nullif(trim(u.full_name), ''), nullif(trim(u.username), ''), split_part(u.email, '@', 1), 'Usuario') AS full_name,
    u.avatar_url,
    public.format_user_location_label(u.location_visibility, u.location_city, u.location_province) AS location_label
  FROM public."user" u
  WHERE u.id <> v_actor
    AND u.allow_direct_messages = true
    AND u.status = 'active'
    AND (
      coalesce(u.full_name, '') ILIKE '%' || v_query || '%'
      OR coalesce(u.username, '') ILIKE '%' || v_query || '%'
      OR coalesce(u.email, '') ILIKE '%' || v_query || '%'
    )
  ORDER BY u.full_name NULLS LAST, u.username NULLS LAST, u.email NULLS LAST
  LIMIT v_limit;
END;
$$;
