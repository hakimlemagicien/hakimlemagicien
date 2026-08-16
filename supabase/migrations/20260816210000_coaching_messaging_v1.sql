-- Coaching Messaging V1
-- Private 1:1 member ↔ coach inbox. Additive. RLS before production use.

CREATE TYPE public.coaching_conversation_status AS ENUM (
  'new',
  'waiting_for_reply',
  'replied',
  'closed'
);

CREATE TYPE public.coaching_message_kind AS ENUM (
  'text',
  'image',
  'voice',
  'video'
);

CREATE TYPE public.coaching_actor AS ENUM (
  'member',
  'coach'
);

CREATE TABLE public.coaching_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.coaching_conversation_status NOT NULL DEFAULT 'new',
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  last_message_kind public.coaching_message_kind,
  last_actor public.coaching_actor,
  member_last_read_at TIMESTAMPTZ,
  coach_last_read_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (member_id)
);

CREATE TABLE public.coaching_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.coaching_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor public.coaching_actor NOT NULL,
  kind public.coaching_message_kind NOT NULL,
  body TEXT,
  client_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT coaching_messages_body_required CHECK (
    kind <> 'text' OR (body IS NOT NULL AND length(btrim(body)) > 0)
  )
);

CREATE UNIQUE INDEX coaching_messages_client_id_idx
  ON public.coaching_messages (conversation_id, client_id)
  WHERE client_id IS NOT NULL;

CREATE INDEX coaching_messages_thread_idx
  ON public.coaching_messages (conversation_id, created_at DESC, id DESC);

CREATE TABLE public.coaching_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.coaching_messages(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.coaching_conversations(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'voice', 'video')),
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  duration_ms INTEGER,
  byte_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (message_id)
);

CREATE TABLE public.coaching_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.coaching_conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.coaching_messages(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('member_message', 'coach_reply')),
  title TEXT NOT NULL,
  body TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX coaching_conversations_inbox_idx
  ON public.coaching_conversations (status, last_message_at DESC NULLS LAST);

CREATE INDEX coaching_notifications_user_idx
  ON public.coaching_notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

ALTER TABLE public.coaching_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_notifications ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.coaching_conversations TO authenticated;
GRANT SELECT ON public.coaching_messages TO authenticated;
GRANT SELECT ON public.coaching_attachments TO authenticated;
GRANT SELECT ON public.coaching_notifications TO authenticated;

CREATE OR REPLACE FUNCTION public.member_can_use_coach_chat(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR COALESCE((
      SELECT
        COALESCE((mt.features->>'limited_coach_contact')::boolean, false)
        OR COALESCE((mt.features->>'personal_followup')::boolean, false)
      FROM public.memberships m
      JOIN public.membership_tiers mt ON mt.tier = m.tier
      WHERE m.user_id = _user_id AND m.is_active = true
      ORDER BY m.starts_at DESC
      LIMIT 1
    ), false);
$$;

CREATE OR REPLACE FUNCTION public.can_access_coaching_conversation(_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.coaching_conversations c
    WHERE c.id = _conversation_id
      AND (
        c.member_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
      )
  );
$$;

REVOKE ALL ON FUNCTION public.member_can_use_coach_chat(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_access_coaching_conversation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.member_can_use_coach_chat(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_coaching_conversation(UUID) TO authenticated;

CREATE POLICY coaching_conversations_select ON public.coaching_conversations
  FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY coaching_messages_select ON public.coaching_messages
  FOR SELECT TO authenticated
  USING (public.can_access_coaching_conversation(conversation_id));

CREATE POLICY coaching_attachments_select ON public.coaching_attachments
  FOR SELECT TO authenticated
  USING (public.can_access_coaching_conversation(conversation_id));

CREATE POLICY coaching_notifications_select ON public.coaching_notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.ensure_my_coaching_conversation()
RETURNS public.coaching_conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_row public.coaching_conversations;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  IF NOT public.member_can_use_coach_chat(v_user_id) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_row
  FROM public.coaching_conversations
  WHERE member_id = v_user_id;

  IF FOUND THEN
    RETURN v_row;
  END IF;

  INSERT INTO public.coaching_conversations (member_id, status)
  VALUES (v_user_id, 'new')
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_coaching_message(
  p_conversation_id UUID,
  p_kind public.coaching_message_kind,
  p_body TEXT DEFAULT NULL,
  p_client_id TEXT DEFAULT NULL,
  p_message_id UUID DEFAULT NULL,
  p_attachment_kind TEXT DEFAULT NULL,
  p_storage_path TEXT DEFAULT NULL,
  p_mime_type TEXT DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL,
  p_byte_size INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_admin BOOLEAN;
  v_actor public.coaching_actor;
  v_conversation public.coaching_conversations;
  v_message public.coaching_messages;
  v_preview TEXT;
  v_status public.coaching_conversation_status;
  v_title TEXT;
  v_notify_kind TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  IF p_kind = 'video' THEN
    RAISE EXCEPTION 'video_not_supported_in_v1';
  END IF;

  v_is_admin := public.has_role(v_user_id, 'admin');

  SELECT * INTO v_conversation
  FROM public.coaching_conversations
  WHERE id = p_conversation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'conversation_not_found';
  END IF;

  IF v_is_admin THEN
    v_actor := 'coach';
  ELSE
    IF v_conversation.member_id <> v_user_id THEN
      RAISE EXCEPTION 'forbidden';
    END IF;
    IF NOT public.member_can_use_coach_chat(v_user_id) THEN
      RAISE EXCEPTION 'forbidden';
    END IF;
    v_actor := 'member';
  END IF;

  IF p_kind = 'text' AND length(btrim(COALESCE(p_body, ''))) = 0 THEN
    RAISE EXCEPTION 'empty_message';
  END IF;
  IF p_kind IN ('image', 'voice') AND (p_storage_path IS NULL OR p_attachment_kind IS NULL) THEN
    RAISE EXCEPTION 'attachment_required';
  END IF;
  IF p_kind = 'voice' AND COALESCE(p_duration_ms, 0) > 60000 THEN
    RAISE EXCEPTION 'voice_too_long';
  END IF;
  IF p_storage_path IS NOT NULL AND split_part(p_storage_path, '/', 1) <> p_conversation_id::text THEN
    RAISE EXCEPTION 'invalid_storage_path';
  END IF;

  IF p_client_id IS NOT NULL THEN
    SELECT * INTO v_message
    FROM public.coaching_messages
    WHERE conversation_id = p_conversation_id AND client_id = p_client_id;
    IF FOUND THEN
      RETURN jsonb_build_object('message', to_jsonb(v_message), 'duplicate', true);
    END IF;
  END IF;

  INSERT INTO public.coaching_messages (
    id, conversation_id, sender_id, actor, kind, body, client_id
  )
  VALUES (
    COALESCE(p_message_id, gen_random_uuid()),
    p_conversation_id,
    v_user_id,
    v_actor,
    p_kind,
    NULLIF(btrim(COALESCE(p_body, '')), ''),
    NULLIF(p_client_id, '')
  )
  RETURNING * INTO v_message;

  IF p_storage_path IS NOT NULL THEN
    INSERT INTO public.coaching_attachments (
      message_id, conversation_id, kind, storage_path, mime_type, duration_ms, byte_size
    )
    VALUES (
      v_message.id,
      p_conversation_id,
      p_attachment_kind,
      p_storage_path,
      p_mime_type,
      p_duration_ms,
      p_byte_size
    );
  END IF;

  v_preview := CASE
    WHEN p_kind = 'image' THEN 'صورة'
    WHEN p_kind = 'voice' THEN 'رسالة صوتية'
    ELSE left(btrim(COALESCE(p_body, '')), 140)
  END;

  v_status := CASE
    WHEN v_conversation.status = 'closed' AND v_actor = 'coach' THEN 'replied'::public.coaching_conversation_status
    WHEN v_conversation.status = 'closed' THEN 'waiting_for_reply'::public.coaching_conversation_status
    WHEN v_actor = 'member' THEN 'waiting_for_reply'::public.coaching_conversation_status
    ELSE 'replied'::public.coaching_conversation_status
  END;

  UPDATE public.coaching_conversations
  SET
    status = v_status,
    last_message_at = v_message.created_at,
    last_message_preview = v_preview,
    last_message_kind = p_kind,
    last_actor = v_actor,
    closed_at = CASE WHEN v_status = 'closed' THEN closed_at ELSE NULL END,
    closed_by = CASE WHEN v_status = 'closed' THEN closed_by ELSE NULL END,
    updated_at = now()
  WHERE id = p_conversation_id;

  IF v_actor = 'member' THEN
    v_title := 'رسالة جديدة من عميل';
    v_notify_kind := 'member_message';
    INSERT INTO public.coaching_notifications (user_id, conversation_id, message_id, kind, title, body)
    SELECT ur.user_id, p_conversation_id, v_message.id, v_notify_kind, v_title, v_preview
    FROM public.user_roles ur
    WHERE ur.role = 'admin';
  ELSE
    v_title := 'رد من الكوتش حكيم';
    v_notify_kind := 'coach_reply';
    INSERT INTO public.coaching_notifications (user_id, conversation_id, message_id, kind, title, body)
    VALUES (v_conversation.member_id, p_conversation_id, v_message.id, v_notify_kind, v_title, v_preview);
  END IF;

  RETURN jsonb_build_object('message', to_jsonb(v_message), 'duplicate', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_coaching_conversation_read(p_conversation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_admin BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  IF NOT public.can_access_coaching_conversation(p_conversation_id) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  v_is_admin := public.has_role(v_user_id, 'admin');

  IF v_is_admin THEN
    UPDATE public.coaching_conversations
    SET coach_last_read_at = now(), updated_at = now()
    WHERE id = p_conversation_id;
    UPDATE public.coaching_notifications
    SET read_at = now()
    WHERE user_id = v_user_id
      AND conversation_id = p_conversation_id
      AND read_at IS NULL;
  ELSE
    UPDATE public.coaching_conversations
    SET member_last_read_at = now(), updated_at = now()
    WHERE id = p_conversation_id AND member_id = v_user_id;
    UPDATE public.coaching_notifications
    SET read_at = now()
    WHERE user_id = v_user_id
      AND conversation_id = p_conversation_id
      AND read_at IS NULL;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_coaching_conversation_status(
  p_conversation_id UUID,
  p_status public.coaching_conversation_status
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.coaching_conversations
  SET
    status = p_status,
    closed_at = CASE WHEN p_status = 'closed' THEN now() ELSE NULL END,
    closed_by = CASE WHEN p_status = 'closed' THEN auth.uid() ELSE NULL END,
    updated_at = now()
  WHERE id = p_conversation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'conversation_not_found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_coaching_inbox(
  p_search TEXT DEFAULT NULL,
  p_status public.coaching_conversation_status DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  member_id UUID,
  member_name TEXT,
  member_email TEXT,
  member_avatar_path TEXT,
  member_goal TEXT,
  membership_tier TEXT,
  status public.coaching_conversation_status,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  last_message_kind public.coaching_message_kind,
  last_actor public.coaching_actor,
  unread_count INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_q TEXT := NULLIF(btrim(COALESCE(p_search, '')), '');
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.member_id,
    COALESCE(NULLIF(p.full_name, ''), split_part(COALESCE(p.email, ''), '@', 1), 'عميل') AS member_name,
    p.email,
    p.avatar_path,
    p.goal,
    m.tier,
    c.status,
    c.last_message_at,
    c.last_message_preview,
    c.last_message_kind,
    c.last_actor,
    (
      SELECT COUNT(*)::int
      FROM public.coaching_messages msg
      WHERE msg.conversation_id = c.id
        AND msg.actor = 'member'
        AND (c.coach_last_read_at IS NULL OR msg.created_at > c.coach_last_read_at)
    ) AS unread_count,
    c.created_at
  FROM public.coaching_conversations c
  LEFT JOIN public.profiles p ON p.id = c.member_id
  LEFT JOIN LATERAL (
    SELECT mem.tier
    FROM public.memberships mem
    WHERE mem.user_id = c.member_id AND mem.is_active = true
    ORDER BY mem.starts_at DESC
    LIMIT 1
  ) m ON true
  WHERE (p_status IS NULL OR c.status = p_status)
    AND (
      v_q IS NULL
      OR p.full_name ILIKE '%' || v_q || '%'
      OR p.email ILIKE '%' || v_q || '%'
      OR c.last_message_preview ILIKE '%' || v_q || '%'
    )
  ORDER BY
    CASE WHEN c.status IN ('new', 'waiting_for_reply') THEN 0 ELSE 1 END,
    c.last_message_at DESC NULLS LAST,
    c.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_coaching_messages(
  p_conversation_id UUID,
  p_before TIMESTAMPTZ DEFAULT NULL,
  p_before_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 40
)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  sender_id UUID,
  actor public.coaching_actor,
  kind public.coaching_message_kind,
  body TEXT,
  created_at TIMESTAMPTZ,
  attachment_kind TEXT,
  storage_path TEXT,
  mime_type TEXT,
  duration_ms INTEGER,
  byte_size INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  IF NOT public.can_access_coaching_conversation(p_conversation_id) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.conversation_id,
    m.sender_id,
    m.actor,
    m.kind,
    m.body,
    m.created_at,
    a.kind,
    a.storage_path,
    a.mime_type,
    a.duration_ms,
    a.byte_size
  FROM public.coaching_messages m
  LEFT JOIN public.coaching_attachments a ON a.message_id = m.id
  WHERE m.conversation_id = p_conversation_id
    AND (
      p_before IS NULL
      OR m.created_at < p_before
      OR (m.created_at = p_before AND p_before_id IS NOT NULL AND m.id < p_before_id)
    )
  ORDER BY m.created_at DESC, m.id DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 40), 100));
END;
$$;

CREATE OR REPLACE FUNCTION public.list_my_coaching_notifications(p_limit INTEGER DEFAULT 30)
RETURNS SETOF public.coaching_notifications
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  RETURN QUERY
  SELECT n.*
  FROM public.coaching_notifications n
  WHERE n.user_id = auth.uid()
  ORDER BY n.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 30), 100));
END;
$$;

CREATE OR REPLACE FUNCTION public.coaching_unread_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.coaching_notifications
  WHERE user_id = auth.uid() AND read_at IS NULL;
$$;

REVOKE ALL ON FUNCTION public.ensure_my_coaching_conversation() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.send_coaching_message(UUID, public.coaching_message_kind, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_coaching_conversation_read(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_coaching_conversation_status(UUID, public.coaching_conversation_status) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_coaching_inbox(TEXT, public.coaching_conversation_status) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_coaching_messages(UUID, TIMESTAMPTZ, UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_my_coaching_notifications(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.coaching_unread_count() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.ensure_my_coaching_conversation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_coaching_message(UUID, public.coaching_message_kind, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_coaching_conversation_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_coaching_conversation_status(UUID, public.coaching_conversation_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_coaching_inbox(TEXT, public.coaching_conversation_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_coaching_messages(UUID, TIMESTAMPTZ, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_coaching_notifications(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.coaching_unread_count() TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'coaching-chat',
  'coaching-chat',
  false,
  8388608,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
    'audio/ogg',
    'audio/aac'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 8388608,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
    'audio/ogg',
    'audio/aac'
  ]::text[],
  updated_at = now();

CREATE OR REPLACE FUNCTION public.is_coaching_chat_path(p_path TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT public.can_access_coaching_conversation(
    NULLIF((storage.foldername(p_path))[1], '')::uuid
  )
  WHERE (storage.foldername(p_path))[1] ~* '^[0-9a-f-]{36}$';
$$;

REVOKE ALL ON FUNCTION public.is_coaching_chat_path(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_coaching_chat_path(TEXT) TO authenticated;

DROP POLICY IF EXISTS coaching_chat_select ON storage.objects;
DROP POLICY IF EXISTS coaching_chat_insert ON storage.objects;
DROP POLICY IF EXISTS coaching_chat_update ON storage.objects;
DROP POLICY IF EXISTS coaching_chat_delete ON storage.objects;

CREATE POLICY coaching_chat_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'coaching-chat' AND public.is_coaching_chat_path(name));

CREATE POLICY coaching_chat_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'coaching-chat' AND public.is_coaching_chat_path(name));

CREATE POLICY coaching_chat_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'coaching-chat' AND public.is_coaching_chat_path(name))
  WITH CHECK (bucket_id = 'coaching-chat' AND public.is_coaching_chat_path(name));

CREATE POLICY coaching_chat_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'coaching-chat' AND public.is_coaching_chat_path(name));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.coaching_conversations;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.coaching_messages;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.coaching_notifications;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;
