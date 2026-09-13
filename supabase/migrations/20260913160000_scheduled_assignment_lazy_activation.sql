-- SCHEDULED → ACTIVE lazy activation at safe runtime boundary
-- Prefer reuse of client_get_my_training_runtime + admin_get_client_overview (no cron).
-- starts_on is the effective calendar date (assignment has no separate effective_at column).

BEGIN;

CREATE OR REPLACE FUNCTION public.activate_due_client_program_assignment(p_client_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_scheduled public.client_program_assignments%ROWTYPE;
  v_active public.client_program_assignments%ROWTYPE;
  v_in_progress UUID;
  v_auto_sourced BOOLEAN := false;
BEGIN
  IF p_client_id IS NULL THEN
    RAISE EXCEPTION 'invalid_client' USING ERRCODE = '22023';
  END IF;

  -- Client may activate own; admin/service may activate any
  IF v_uid IS DISTINCT FROM p_client_id
     AND NOT public.has_role(v_uid, 'admin')
     AND auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_scheduled
  FROM public.client_program_assignments
  WHERE client_id = p_client_id
    AND status = 'scheduled'
    AND starts_on IS NOT NULL
    AND starts_on <= CURRENT_DATE
  ORDER BY assigned_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'noop',
      'activated', false,
      'reason', 'no_due_scheduled'
    );
  END IF;

  -- Protect in-progress workout: keep current active snapshot for this session
  SELECT id INTO v_in_progress
  FROM public.workout_sessions
  WHERE user_id = p_client_id
    AND status = 'IN_PROGRESS'
  LIMIT 1;

  IF v_in_progress IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'deferred_in_progress',
      'activated', false,
      'reason', 'active_workout_in_progress',
      'workout_session_id', v_in_progress,
      'scheduled_assignment_id', v_scheduled.id
    );
  END IF;

  SELECT * INTO v_active
  FROM public.client_program_assignments
  WHERE client_id = p_client_id
    AND status = 'active'
  LIMIT 1;

  -- Coach override protection: do not silently activate AUTO/RECONCILE scheduled over COACH_MANAGED
  IF v_active.id IS NOT NULL AND v_active.progression_strategy = 'COACH_MANAGED' THEN
    IF to_regclass('public.training_assignment_reviews') IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1
        FROM public.training_assignment_reviews r
        WHERE r.client_id = p_client_id
          AND r.assignment_id = v_scheduled.id
          AND r.assignment_source IN ('AUTO', 'RECONCILE')
      ) INTO v_auto_sourced;
    ELSE
      v_auto_sourced := false;
    END IF;

    IF v_auto_sourced THEN
      RETURN jsonb_build_object(
        'status', 'skipped_coach_override',
        'activated', false,
        'reason', 'coach_override_protected',
        'active_assignment_id', v_active.id,
        'scheduled_assignment_id', v_scheduled.id
      );
    END IF;
  END IF;

  -- Flip: previous active → replaced (immutable history); scheduled → active
  IF v_active.id IS NOT NULL THEN
    UPDATE public.client_program_assignments
    SET
      status = 'replaced',
      ended_at = COALESCE(ended_at, now()),
      archived_at = COALESCE(archived_at, now())
    WHERE id = v_active.id
      AND status = 'active';
  END IF;

  UPDATE public.client_program_assignments
  SET status = 'active'
  WHERE id = v_scheduled.id
    AND status = 'scheduled';

  -- Cancel any other stray scheduled rows for this client (should be at most one by unique index)
  UPDATE public.client_program_assignments
  SET
    status = 'cancelled',
    ended_at = COALESCE(ended_at, now()),
    archived_at = COALESCE(archived_at, now())
  WHERE client_id = p_client_id
    AND status = 'scheduled'
    AND id IS DISTINCT FROM v_scheduled.id;

  RETURN jsonb_build_object(
    'status', 'activated',
    'activated', true,
    'previous_assignment_id', v_active.id,
    'active_assignment_id', v_scheduled.id,
    'starts_on', v_scheduled.starts_on
  );
END;
$$;

REVOKE ALL ON FUNCTION public.activate_due_client_program_assignment(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_due_client_program_assignment(UUID) TO authenticated, service_role;

COMMENT ON FUNCTION public.activate_due_client_program_assignment(UUID) IS
  'Lazy promote due scheduled assignment to active at safe boundary. Skips when workout IN_PROGRESS or AUTO scheduled over COACH_MANAGED. Idempotent.';

-- Client runtime: activate then resolve (must be VOLATILE for writes)
CREATE OR REPLACE FUNCTION public.client_get_my_training_runtime()
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_row public.client_program_assignments%ROWTYPE;
  v_complete BOOLEAN;
  v_reason TEXT;
  v_week INT;
  v_elapsed INT;
  v_activation JSONB;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  v_activation := public.activate_due_client_program_assignment(v_user);

  SELECT * INTO v_row
  FROM public.client_program_assignments
  WHERE client_id = v_user AND status IN ('active', 'scheduled')
  ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, assigned_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'reason', 'no_program',
      'assignment', NULL,
      'days', '[]'::jsonb,
      'activation', v_activation
    );
  END IF;

  v_complete := EXISTS (SELECT 1 FROM public.client_program_weeks w WHERE w.assignment_id = v_row.id);
  IF NOT v_complete THEN
    RETURN jsonb_build_object(
      'reason', 'legacy_incomplete',
      'assignment', to_jsonb(v_row),
      'snapshot_complete', false,
      'days', '[]'::jsonb,
      'activation', v_activation
    );
  END IF;

  IF v_row.status = 'scheduled' AND v_row.starts_on IS NOT NULL AND v_row.starts_on > CURRENT_DATE THEN
    v_reason := 'scheduled';
    v_week := 1;
  ELSIF v_row.starts_on IS NOT NULL THEN
    v_elapsed := (CURRENT_DATE - v_row.starts_on);
    IF v_elapsed < 0 THEN
      v_reason := 'scheduled';
      v_week := 1;
    ELSIF v_row.duration_weeks IS NOT NULL AND v_elapsed >= (v_row.duration_weeks * 7) THEN
      v_reason := 'ended';
      v_week := v_row.duration_weeks;
    ELSE
      v_reason := 'ok';
      v_week := LEAST(GREATEST((v_elapsed / 7) + 1, 1), COALESCE(v_row.duration_weeks, 1));
    END IF;
  ELSE
    v_reason := 'ok';
    v_week := 1;
  END IF;

  RETURN jsonb_build_object(
    'reason', v_reason,
    'snapshot_complete', true,
    'current_week_number', v_week,
    'assignment', to_jsonb(v_row),
    'activation', v_activation,
    'days', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'day_id', d.id,
          'day_number', d.day_number,
          'day_type', d.day_type,
          'title_ar', d.title_ar,
          'muscle_focus', d.muscle_focus,
          'estimated_minutes', d.estimated_minutes,
          'estimated_calories', d.estimated_calories,
          'exercises', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
              'id', x.id,
              'exercise_id', x.exercise_id,
              'external_id', x.exercise_external_id,
              'name_ar', x.exercise_name_ar,
              'sets', x.sets,
              'reps_min', x.reps_min,
              'reps_max', x.reps_max,
              'reps_label', x.reps_label,
              'rest_seconds', x.rest_seconds,
              'suggested_weight_kg', x.suggested_weight_kg,
              'notes_ar', x.notes_ar,
              'activity_role', x.activity_role
            ) ORDER BY x.sort_order)
            FROM public.client_program_exercises x
            WHERE x.day_id = d.id
          ), '[]'::jsonb)
        ) ORDER BY d.day_number
      )
      FROM public.client_program_days d
      JOIN public.client_program_weeks w ON w.id = d.week_id
      WHERE w.assignment_id = v_row.id AND w.week_number = v_week
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.client_get_my_training_runtime() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.client_get_my_training_runtime() TO authenticated, service_role;

-- Admin overview: same lazy activation so UI matches client
CREATE OR REPLACE FUNCTION public.admin_get_client_overview(p_client_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_membership JSONB;
  v_coaching JSONB;
  v_assignment JSONB;
  v_nutrition JSONB;
  v_last_workout TIMESTAMPTZ;
  v_last_nutrition TIMESTAMPTZ;
  v_notes_count INTEGER;
  v_open_support INTEGER;
  v_activation JSONB;
BEGIN
  PERFORM public._require_admin();
  IF p_client_id IS NULL THEN
    RAISE EXCEPTION 'invalid_client' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_client_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_activation := public.activate_due_client_program_assignment(p_client_id);

  SELECT jsonb_build_object(
    'tier', mem.tier, 'is_active', mem.is_active, 'source', mem.source,
    'starts_at', mem.starts_at, 'ends_at', mem.ends_at,
    'billing_period_months', mem.billing_period_months, 'paid_period_end', mem.paid_period_end,
    'auto_renew', mem.auto_renew, 'cancel_at_period_end', mem.cancel_at_period_end,
    'next_renewal_at', mem.next_renewal_at
  )
  INTO v_membership
  FROM public.memberships mem
  WHERE mem.user_id = p_client_id AND mem.is_active = true
  ORDER BY mem.starts_at DESC
  LIMIT 1;

  SELECT jsonb_build_object(
    'conversation_id', conv.id, 'status', conv.status, 'last_message_at', conv.last_message_at,
    'unread_count', (
      SELECT COUNT(*)::int FROM public.coaching_messages msg
      WHERE msg.conversation_id = conv.id AND msg.actor = 'member'
        AND (conv.coach_last_read_at IS NULL OR msg.created_at > conv.coach_last_read_at)
    )
  )
  INTO v_coaching
  FROM public.coaching_conversations conv
  WHERE conv.member_id = p_client_id
  ORDER BY conv.created_at DESC
  LIMIT 1;

  SELECT jsonb_build_object(
    'id', a.id, 'source_template_id', a.source_template_id, 'template_version', a.template_version,
    'status', a.status, 'assigned_at', a.assigned_at, 'starts_on', a.starts_on,
    'name_ar', a.name_ar, 'duration_weeks', a.duration_weeks,
    'snapshot_complete', EXISTS (SELECT 1 FROM public.client_program_weeks w WHERE w.assignment_id = a.id),
    'progression_status', a.progression_status,
    'progression_strategy', a.progression_strategy
  )
  INTO v_assignment
  FROM public.client_program_assignments a
  WHERE a.client_id = p_client_id AND a.status IN ('active', 'scheduled')
  ORDER BY CASE a.status WHEN 'active' THEN 0 ELSE 1 END
  LIMIT 1;

  SELECT jsonb_build_object(
    'id', n.id, 'status', n.status, 'name_ar', n.name_ar, 'starts_on', n.starts_on,
    'assigned_at', n.assigned_at, 'snapshot_complete', EXISTS (
      SELECT 1 FROM public.client_nutrition_slots s WHERE s.assignment_id = n.id
    ),
    'allergen_conflict', EXISTS (
      SELECT 1 FROM public.client_nutrition_slots s
      WHERE s.assignment_id = n.id AND public._allergen_overlap(n.watch_allergens, s.allergens)
    )
  )
  INTO v_nutrition
  FROM public.client_nutrition_assignments n
  WHERE n.client_id = p_client_id AND n.status IN ('active', 'scheduled')
  ORDER BY CASE n.status WHEN 'active' THEN 0 ELSE 1 END
  LIMIT 1;

  SELECT MAX(wsl.created_at) INTO v_last_workout
  FROM public.workout_set_logs wsl WHERE wsl.user_id = p_client_id;
  SELECT MAX(l.created_at) INTO v_last_nutrition
  FROM public.client_nutrition_meal_logs l WHERE l.user_id = p_client_id;
  SELECT COUNT(*)::int INTO v_notes_count
  FROM public.coach_client_notes n WHERE n.client_id = p_client_id AND n.archived_at IS NULL;
  SELECT COUNT(*)::int INTO v_open_support
  FROM public.support_tickets t WHERE t.user_id = p_client_id AND t.status IN ('received', 'in_review');

  RETURN jsonb_build_object(
    'id', v_profile.id, 'full_name', v_profile.full_name, 'email', v_profile.email,
    'phone', v_profile.phone, 'avatar_path', v_profile.avatar_path, 'goal', v_profile.goal,
    'city', v_profile.city, 'training_type', v_profile.training_type,
    'program_start_date', v_profile.program_start_date,
    'onboarding_completed_at', v_profile.onboarding_completed_at, 'created_at', v_profile.created_at,
    'account_status', v_profile.account_status,
    'account_deleted_at', v_profile.account_deleted_at,
    'membership', v_membership, 'coaching', v_coaching, 'assignment', v_assignment,
    'nutrition_assignment', v_nutrition,
    'last_workout_at', v_last_workout, 'last_nutrition_at', v_last_nutrition,
    'notes_count', v_notes_count, 'open_support_count', v_open_support,
    'activation', v_activation
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_client_overview(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_client_overview(UUID) TO authenticated, service_role;

COMMIT;
