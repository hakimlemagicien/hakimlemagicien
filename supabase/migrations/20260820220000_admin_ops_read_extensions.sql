-- MAAKFIT Command Center Phase 4 — additive read-contract extensions.
-- No production apply. Depends on 20260820210000_admin_command_center_data_contracts.

-- Support list: category + client filter (dashboard list still omits message body).
DROP FUNCTION IF EXISTS public.admin_list_support_tickets(TEXT, INTEGER, INTEGER);

CREATE FUNCTION public.admin_list_support_tickets(
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 25,
  p_offset INTEGER DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
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
  v_category TEXT := NULLIF(btrim(COALESCE(p_category, '')), '');
BEGIN
  PERFORM public._require_admin();
  IF v_status IS NOT NULL AND v_status NOT IN ('received', 'in_review', 'resolved', 'closed') THEN
    RAISE EXCEPTION 'invalid_status' USING ERRCODE = '22023';
  END IF;
  IF v_category IS NOT NULL AND v_category NOT IN (
    'account', 'subscription_billing', 'refund', 'technical', 'privacy', 'other'
  ) THEN
    RAISE EXCEPTION 'invalid_category' USING ERRCODE = '22023';
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
  WHERE (v_status IS NULL OR t.status = v_status)
    AND (v_category IS NULL OR t.category = v_category)
    AND (p_user_id IS NULL OR t.user_id = p_user_id)
  ORDER BY t.created_at ASC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_support_tickets(TEXT, INTEGER, INTEGER, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_support_tickets(TEXT, INTEGER, INTEGER, TEXT, UUID) TO authenticated;

-- Audit: filter by client/subject for Client 360 history.
DROP FUNCTION IF EXISTS public.admin_list_audit_events(TEXT, INTEGER, INTEGER);

CREATE FUNCTION public.admin_list_audit_events(
  p_event_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_subject_user_id UUID DEFAULT NULL
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
  WHERE (v_type IS NULL OR e.event_type = v_type)
    AND (p_subject_user_id IS NULL OR e.subject_user_id = p_subject_user_id)
  ORDER BY e.created_at DESC, e.id DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_audit_events(TEXT, INTEGER, INTEGER, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_audit_events(TEXT, INTEGER, INTEGER, UUID) TO authenticated;

-- Notes: optional archived rows for operational review (hidden by default).
DROP FUNCTION IF EXISTS public.admin_list_client_notes(UUID, INTEGER, INTEGER);

CREATE FUNCTION public.admin_list_client_notes(
  p_client_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_include_archived BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  client_id UUID,
  author_id UUID,
  body TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
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
  SELECT n.id, n.client_id, n.author_id, n.body, n.created_at, n.updated_at, n.archived_at
  FROM public.coach_client_notes n
  WHERE n.client_id = p_client_id
    AND (COALESCE(p_include_archived, false) OR n.archived_at IS NULL)
  ORDER BY n.created_at DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_client_notes(UUID, INTEGER, INTEGER, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_client_notes(UUID, INTEGER, INTEGER, BOOLEAN) TO authenticated;

-- Richer membership + support count on the existing overview contract (same signature).
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
  v_open_support INTEGER;
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
    'ends_at', mem.ends_at,
    'billing_period_months', mem.billing_period_months,
    'paid_period_end', mem.paid_period_end,
    'auto_renew', mem.auto_renew,
    'cancel_at_period_end', mem.cancel_at_period_end,
    'next_renewal_at', mem.next_renewal_at
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

  SELECT COUNT(*)::int INTO v_open_support
  FROM public.support_tickets t
  WHERE t.user_id = p_client_id
    AND t.status IN ('received', 'in_review');

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
    'notes_count', v_notes_count,
    'open_support_count', v_open_support
  );
END;
$$;
