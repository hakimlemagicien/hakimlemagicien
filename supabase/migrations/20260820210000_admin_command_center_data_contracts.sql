-- MAAKFIT Command Center Phase 3 — data contracts, permissions, audit.
-- Additive. No production apply in this phase. No pricing/legal/domain changes.
-- Reuses profiles, memberships, coaching_*, leads, support_tickets, audit_events, program_templates.

-- ---------------------------------------------------------------------------
-- 1. Privilege-escalation defense in depth (does not block SECURITY DEFINER backends)
-- ---------------------------------------------------------------------------

REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon;

CREATE OR REPLACE FUNCTION public.prevent_self_admin_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NEW.role = 'admin'::public.app_role
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_admin_escalation ON public.user_roles;
CREATE TRIGGER trg_prevent_self_admin_escalation
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_admin_escalation();

-- Archive-first: authenticated admins should not hard-delete catalog rows used in history.
REVOKE DELETE ON public.exercises FROM authenticated;
REVOKE DELETE ON public.meals FROM authenticated;
REVOKE DELETE ON public.program_templates FROM authenticated;

-- ---------------------------------------------------------------------------
-- 2. Program template version + client assignment snapshot pointer
--    TEMPLATE ≠ live client prescription. Assignments freeze template_version.
-- ---------------------------------------------------------------------------

ALTER TABLE public.program_templates
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE public.program_templates
  DROP CONSTRAINT IF EXISTS program_templates_version_check;
ALTER TABLE public.program_templates
  ADD CONSTRAINT program_templates_version_check CHECK (version >= 1);

CREATE TABLE IF NOT EXISTS public.client_program_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_template_id UUID NOT NULL REFERENCES public.program_templates(id) ON DELETE RESTRICT,
  template_version INTEGER NOT NULL CHECK (template_version >= 1),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS client_program_assignments_one_active
  ON public.client_program_assignments (client_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS client_program_assignments_client_idx
  ON public.client_program_assignments (client_id, assigned_at DESC);

CREATE OR REPLACE FUNCTION public.protect_client_program_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND (
       NEW.source_template_id IS DISTINCT FROM OLD.source_template_id
       OR NEW.template_version IS DISTINCT FROM OLD.template_version
       OR NEW.client_id IS DISTINCT FROM OLD.client_id
     ) THEN
    RAISE EXCEPTION 'assignment_immutable' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_client_program_assignment ON public.client_program_assignments;
CREATE TRIGGER trg_protect_client_program_assignment
  BEFORE UPDATE ON public.client_program_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_client_program_assignment();

DROP TRIGGER IF EXISTS trg_client_program_assignments_updated_at ON public.client_program_assignments;
CREATE TRIGGER trg_client_program_assignments_updated_at
  BEFORE UPDATE ON public.client_program_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.client_program_assignments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.client_program_assignments FROM anon, authenticated;
GRANT SELECT ON public.client_program_assignments TO authenticated;
GRANT ALL ON public.client_program_assignments TO service_role;

DROP POLICY IF EXISTS client_program_assignments_own_select ON public.client_program_assignments;
DROP POLICY IF EXISTS client_program_assignments_admin_select ON public.client_program_assignments;
CREATE POLICY client_program_assignments_own_select
  ON public.client_program_assignments
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());
CREATE POLICY client_program_assignments_admin_select
  ON public.client_program_assignments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 3. Coach notes (staff-only, never client-visible)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.coach_client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  body TEXT NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 8000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS coach_client_notes_client_idx
  ON public.coach_client_notes (client_id, created_at DESC)
  WHERE archived_at IS NULL;

DROP TRIGGER IF EXISTS trg_coach_client_notes_updated_at ON public.coach_client_notes;
CREATE TRIGGER trg_coach_client_notes_updated_at
  BEFORE UPDATE ON public.coach_client_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.coach_client_notes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.coach_client_notes FROM anon, authenticated;
GRANT SELECT ON public.coach_client_notes TO authenticated;
GRANT ALL ON public.coach_client_notes TO service_role;

DROP POLICY IF EXISTS coach_client_notes_admin_select ON public.coach_client_notes;
CREATE POLICY coach_client_notes_admin_select
  ON public.coach_client_notes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 4. Justified indexes for admin list/search
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON public.profiles (created_at DESC);
CREATE INDEX IF NOT EXISTS profiles_email_lower_idx ON public.profiles (lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS memberships_user_active_idx ON public.memberships (user_id, starts_at DESC) WHERE is_active;
CREATE INDEX IF NOT EXISTS audit_events_created_at_idx ON public.audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_created_at_idx ON public.support_tickets (created_at DESC);

-- ---------------------------------------------------------------------------
-- 5. Shared admin gate
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public._require_admin()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public._require_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._require_admin() TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. Client list + overview
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_list_clients(
  p_query TEXT DEFAULT NULL,
  p_plan TEXT DEFAULT NULL,
  p_onboarding TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 25,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_path TEXT,
  goal TEXT,
  city TEXT,
  membership_plan TEXT,
  membership_active BOOLEAN,
  onboarding_completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  unread_coaching_count INTEGER,
  waiting_coaching BOOLEAN,
  created_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 25), 1), 25);
  v_offset INTEGER := GREATEST(COALESCE(p_offset, 0), 0);
  v_raw TEXT := NULLIF(btrim(COALESCE(p_query, '')), '');
  v_q TEXT := NULL;
  v_plan TEXT := NULLIF(lower(btrim(COALESCE(p_plan, ''))), '');
  v_onb TEXT := NULLIF(lower(btrim(COALESCE(p_onboarding, ''))), '');
BEGIN
  PERFORM public._require_admin();

  IF v_onb IS NOT NULL AND v_onb NOT IN ('complete', 'incomplete') THEN
    RAISE EXCEPTION 'invalid_onboarding_filter' USING ERRCODE = '22023';
  END IF;

  IF v_raw IS NOT NULL AND char_length(v_raw) < 2 THEN
    RETURN;
  END IF;

  IF v_raw IS NOT NULL THEN
    v_q := replace(replace(replace(v_raw, '\', '\\'), '%', '\%'), '_', '\_');
  END IF;

  RETURN QUERY
  WITH filtered AS (
    SELECT
      p.id,
      p.full_name,
      p.email,
      p.phone,
      p.avatar_path,
      p.goal,
      p.city,
      p.onboarding_completed_at,
      p.created_at,
      m.tier AS membership_plan,
      m.is_active AS membership_active
    FROM public.profiles p
    LEFT JOIN LATERAL (
      SELECT mem.tier, mem.is_active
      FROM public.memberships mem
      WHERE mem.user_id = p.id AND mem.is_active = true
      ORDER BY mem.starts_at DESC
      LIMIT 1
    ) m ON true
    WHERE
      (v_q IS NULL OR (
        p.full_name ILIKE '%' || v_q || '%' ESCAPE '\'
        OR p.email ILIKE '%' || v_q || '%' ESCAPE '\'
        OR p.phone ILIKE '%' || v_q || '%' ESCAPE '\'
      ))
      AND (v_plan IS NULL OR lower(COALESCE(m.tier, '')) = v_plan)
      AND (
        v_onb IS NULL
        OR (v_onb = 'complete' AND p.onboarding_completed_at IS NOT NULL)
        OR (v_onb = 'incomplete' AND p.onboarding_completed_at IS NULL)
      )
  ),
  counted AS (
    SELECT f.*, COUNT(*) OVER() AS total_count
    FROM filtered f
  ),
  page AS (
    SELECT *
    FROM counted
    ORDER BY created_at DESC
    LIMIT v_limit
    OFFSET v_offset
  )
  SELECT
    pg.id,
    pg.full_name,
    pg.email,
    pg.phone,
    pg.avatar_path,
    pg.goal,
    pg.city,
    pg.membership_plan,
    pg.membership_active,
    pg.onboarding_completed_at,
    GREATEST(w.last_workout_at, c.last_message_at) AS last_activity_at,
    COALESCE(c.unread_count, 0) AS unread_coaching_count,
    COALESCE(c.status = 'waiting_for_reply', false) AS waiting_coaching,
    pg.created_at,
    pg.total_count
  FROM page pg
  LEFT JOIN LATERAL (
    SELECT MAX(wsl.created_at) AS last_workout_at
    FROM public.workout_set_logs wsl
    WHERE wsl.user_id = pg.id
  ) w ON true
  LEFT JOIN LATERAL (
    SELECT
      conv.last_message_at,
      conv.status,
      (
        SELECT COUNT(*)::int
        FROM public.coaching_messages msg
        WHERE msg.conversation_id = conv.id
          AND msg.actor = 'member'
          AND (conv.coach_last_read_at IS NULL OR msg.created_at > conv.coach_last_read_at)
      ) AS unread_count
    FROM public.coaching_conversations conv
    WHERE conv.member_id = pg.id
    ORDER BY conv.created_at DESC
    LIMIT 1
  ) c ON true;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_client_overview(p_client_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_membership JSONB;
  v_coaching JSONB;
  v_assignment JSONB;
  v_last_workout TIMESTAMPTZ;
  v_notes_count INTEGER;
BEGIN
  PERFORM public._require_admin();

  IF p_client_id IS NULL THEN
    RAISE EXCEPTION 'invalid_client' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_client_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'tier', mem.tier,
    'is_active', mem.is_active,
    'source', mem.source,
    'starts_at', mem.starts_at,
    'ends_at', mem.ends_at
  )
  INTO v_membership
  FROM public.memberships mem
  WHERE mem.user_id = p_client_id AND mem.is_active = true
  ORDER BY mem.starts_at DESC
  LIMIT 1;

  SELECT jsonb_build_object(
    'conversation_id', conv.id,
    'status', conv.status,
    'last_message_at', conv.last_message_at,
    'unread_count', (
      SELECT COUNT(*)::int
      FROM public.coaching_messages msg
      WHERE msg.conversation_id = conv.id
        AND msg.actor = 'member'
        AND (conv.coach_last_read_at IS NULL OR msg.created_at > conv.coach_last_read_at)
    )
  )
  INTO v_coaching
  FROM public.coaching_conversations conv
  WHERE conv.member_id = p_client_id
  ORDER BY conv.created_at DESC
  LIMIT 1;

  SELECT jsonb_build_object(
    'id', a.id,
    'source_template_id', a.source_template_id,
    'template_version', a.template_version,
    'status', a.status,
    'assigned_at', a.assigned_at
  )
  INTO v_assignment
  FROM public.client_program_assignments a
  WHERE a.client_id = p_client_id AND a.status = 'active'
  LIMIT 1;

  SELECT MAX(wsl.created_at) INTO v_last_workout
  FROM public.workout_set_logs wsl
  WHERE wsl.user_id = p_client_id;

  SELECT COUNT(*)::int INTO v_notes_count
  FROM public.coach_client_notes n
  WHERE n.client_id = p_client_id AND n.archived_at IS NULL;

  RETURN jsonb_build_object(
    'id', v_profile.id,
    'full_name', v_profile.full_name,
    'email', v_profile.email,
    'phone', v_profile.phone,
    'avatar_path', v_profile.avatar_path,
    'goal', v_profile.goal,
    'city', v_profile.city,
    'training_type', v_profile.training_type,
    'program_start_date', v_profile.program_start_date,
    'onboarding_completed_at', v_profile.onboarding_completed_at,
    'created_at', v_profile.created_at,
    'membership', v_membership,
    'coaching', v_coaching,
    'assignment', v_assignment,
    'last_workout_at', v_last_workout,
    'notes_count', v_notes_count
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. Coach notes RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_list_client_notes(
  p_client_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  client_id UUID,
  author_id UUID,
  body TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 50);
  v_offset INTEGER := GREATEST(COALESCE(p_offset, 0), 0);
BEGIN
  PERFORM public._require_admin();
  IF p_client_id IS NULL THEN
    RAISE EXCEPTION 'invalid_client' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT n.id, n.client_id, n.author_id, n.body, n.created_at, n.updated_at
  FROM public.coach_client_notes n
  WHERE n.client_id = p_client_id
    AND n.archived_at IS NULL
  ORDER BY n.created_at DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_add_client_note(
  p_client_id UUID,
  p_body TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_id UUID;
  v_body TEXT := btrim(COALESCE(p_body, ''));
BEGIN
  v_admin := public._require_admin();
  IF p_client_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_client_id) THEN
    RAISE EXCEPTION 'invalid_client' USING ERRCODE = '22023';
  END IF;
  IF char_length(v_body) < 1 OR char_length(v_body) > 8000 THEN
    RAISE EXCEPTION 'invalid_note' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.coach_client_notes (client_id, author_id, body)
  VALUES (p_client_id, v_admin, v_body)
  RETURNING id INTO v_id;

  PERFORM public._write_audit_event(
    v_admin,
    p_client_id,
    'coach_note_created',
    jsonb_build_object('note_id', v_id)
  );
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_archive_client_note(p_note_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_client UUID;
BEGIN
  v_admin := public._require_admin();
  UPDATE public.coach_client_notes
  SET archived_at = now()
  WHERE id = p_note_id AND archived_at IS NULL
  RETURNING client_id INTO v_client;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'note_not_found' USING ERRCODE = 'P0002';
  END IF;

  PERFORM public._write_audit_event(
    v_admin,
    v_client,
    'coach_note_archived',
    jsonb_build_object('note_id', p_note_id)
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. Audit read + operations snapshot + support
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_list_audit_events(
  p_event_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  actor_id UUID,
  subject_user_id UUID,
  event_type TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 50);
  v_offset INTEGER := GREATEST(COALESCE(p_offset, 0), 0);
  v_type TEXT := NULLIF(btrim(COALESCE(p_event_type, '')), '');
BEGIN
  PERFORM public._require_admin();

  RETURN QUERY
  SELECT e.id, e.actor_id, e.subject_user_id, e.event_type, e.metadata, e.created_at
  FROM public.audit_events e
  WHERE v_type IS NULL OR e.event_type = v_type
  ORDER BY e.created_at DESC, e.id DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_operations_snapshot()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._require_admin();
  RETURN jsonb_build_object(
    'unread_threads', (
      SELECT COUNT(*)::int
      FROM public.coaching_conversations c
      WHERE EXISTS (
        SELECT 1
        FROM public.coaching_messages msg
        WHERE msg.conversation_id = c.id
          AND msg.actor = 'member'
          AND (c.coach_last_read_at IS NULL OR msg.created_at > c.coach_last_read_at)
      )
    ),
    'waiting_threads', (
      SELECT COUNT(*)::int
      FROM public.coaching_conversations
      WHERE status = 'waiting_for_reply'
    ),
    'pending_payments', (
      SELECT COUNT(*)::int
      FROM public.leads
      WHERE payment_status = 'submitted'
    ),
    'open_support', (
      SELECT COUNT(*)::int
      FROM public.support_tickets
      WHERE status IN ('received', 'in_review')
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_support_tickets(
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 25,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  ticket_code TEXT,
  user_id UUID,
  email TEXT,
  display_name TEXT,
  category TEXT,
  status TEXT,
  subject TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 25), 1), 25);
  v_offset INTEGER := GREATEST(COALESCE(p_offset, 0), 0);
  v_status TEXT := NULLIF(btrim(COALESCE(p_status, '')), '');
BEGIN
  PERFORM public._require_admin();
  IF v_status IS NOT NULL AND v_status NOT IN ('received', 'in_review', 'resolved', 'closed') THEN
    RAISE EXCEPTION 'invalid_status' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT
    t.id,
    t.ticket_code,
    t.user_id,
    t.email,
    t.display_name,
    t.category,
    t.status,
    t.subject,
    t.created_at,
    t.updated_at
  FROM public.support_tickets t
  WHERE v_status IS NULL OR t.status = v_status
  ORDER BY t.created_at DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_support_ticket_status(
  p_ticket_id UUID,
  p_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_current TEXT;
  v_user UUID;
BEGIN
  v_admin := public._require_admin();
  IF p_status NOT IN ('received', 'in_review', 'resolved', 'closed') THEN
    RAISE EXCEPTION 'invalid_status' USING ERRCODE = '22023';
  END IF;

  SELECT status, user_id INTO v_current, v_user
  FROM public.support_tickets
  WHERE id = p_ticket_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ticket_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_current = p_status THEN
    RETURN;
  END IF;

  IF NOT (
    (v_current = 'received' AND p_status IN ('in_review', 'closed'))
    OR (v_current = 'in_review' AND p_status IN ('resolved', 'closed'))
    OR (v_current = 'resolved' AND p_status = 'closed')
  ) THEN
    RAISE EXCEPTION 'invalid_transition' USING ERRCODE = '22023';
  END IF;

  UPDATE public.support_tickets
  SET status = p_status, updated_at = now()
  WHERE id = p_ticket_id;

  PERFORM public._write_audit_event(
    v_admin,
    v_user,
    'support_ticket_status_changed',
    jsonb_build_object('ticket_id', p_ticket_id, 'from', v_current, 'to', p_status)
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 9. Payment review reason (additive optional arg; drop 2-arg signature)
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.admin_update_lead_payment_status(UUID, public.payment_status);

CREATE FUNCTION public.admin_update_lead_payment_status(
  p_lead_id UUID,
  p_payment_status public.payment_status,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_reason TEXT := NULLIF(btrim(COALESCE(p_reason, '')), '');
  v_subject UUID;
BEGIN
  v_admin := public._require_admin();

  IF p_payment_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'invalid_payment_status' USING ERRCODE = '22023';
  END IF;

  IF p_payment_status = 'rejected' AND (v_reason IS NULL OR char_length(v_reason) < 3) THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE = '22023';
  END IF;

  IF v_reason IS NOT NULL AND char_length(v_reason) > 500 THEN
    RAISE EXCEPTION 'invalid_reason' USING ERRCODE = '22023';
  END IF;

  UPDATE public.leads
  SET
    payment_status = p_payment_status,
    status = CASE
      WHEN p_payment_status = 'approved' THEN 'active'::public.lead_status
      ELSE status
    END,
    updated_at = now()
  WHERE id = p_lead_id
    AND payment_status = 'submitted'
  RETURNING user_id INTO v_subject;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'lead_not_found_or_not_submitted' USING ERRCODE = 'P0002';
  END IF;

  PERFORM public._write_audit_event(
    v_admin,
    v_subject,
    'payment_reviewed',
    jsonb_build_object(
      'lead_id', p_lead_id,
      'decision', p_payment_status,
      'reason', v_reason
    )
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 10. Grants
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.admin_list_clients(TEXT, TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_client_overview(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_client_notes(UUID, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_add_client_note(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_archive_client_note(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_audit_events(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_operations_snapshot() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_support_tickets(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_support_ticket_status(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_update_lead_payment_status(UUID, public.payment_status, TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_list_clients(TEXT, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_client_overview(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_client_notes(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_add_client_note(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_archive_client_note(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_audit_events(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_operations_snapshot() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_support_tickets(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_support_ticket_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_lead_payment_status(UUID, public.payment_status, TEXT) TO authenticated;

COMMENT ON TABLE public.coach_client_notes IS 'Private staff notes for a client. Never exposed to the member app.';
COMMENT ON TABLE public.client_program_assignments IS 'Frozen pointer to a program template version. Editing templates must not mutate this row.';
COMMENT ON FUNCTION public.admin_list_clients(TEXT, TEXT, TEXT, INTEGER, INTEGER) IS 'Paginated admin client read model. Max 25 rows. No load-all.';
