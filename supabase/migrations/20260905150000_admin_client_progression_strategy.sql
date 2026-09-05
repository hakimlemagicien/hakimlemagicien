-- Smart Progression V1: assignment-scoped progression strategy.
-- Local-only. Do not apply to Staging or Production from this task.
-- TEMPLATE catalog rows stay untouched. Client assignment is the source of truth.

ALTER TABLE public.client_program_assignments
  ADD COLUMN IF NOT EXISTS progression_strategy TEXT NOT NULL DEFAULT 'MATRIX_MANAGED_PROGRESSION',
  ADD COLUMN IF NOT EXISTS progression_status TEXT NOT NULL DEFAULT 'WAITING_FOR_DATA',
  ADD COLUMN IF NOT EXISTS last_progression_evaluation_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS progression_state JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.client_program_assignments
  DROP CONSTRAINT IF EXISTS client_program_assignments_progression_strategy_check;
ALTER TABLE public.client_program_assignments
  ADD CONSTRAINT client_program_assignments_progression_strategy_check
  CHECK (progression_strategy IN (
    'SMART_PROGRESSION_EXERCISE_LOCKED',
    'MATRIX_MANAGED_PROGRESSION',
    'COACH_MANAGED'
  ));

ALTER TABLE public.client_program_assignments
  DROP CONSTRAINT IF EXISTS client_program_assignments_progression_status_check;
ALTER TABLE public.client_program_assignments
  ADD CONSTRAINT client_program_assignments_progression_status_check
  CHECK (progression_status IN ('ACTIVE', 'WAITING_FOR_DATA', 'REVIEW_REQUIRED', 'PAUSED'));

COMMENT ON COLUMN public.client_program_assignments.progression_strategy IS
  'How this client assignment progresses. Independent of generation_source / template.';
COMMENT ON COLUMN public.client_program_assignments.progression_state IS
  'Reviews, kept decisions, and last evaluation snapshot. Not workout history.';

CREATE OR REPLACE FUNCTION public.admin_set_client_progression_strategy(
  p_assignment_id UUID,
  p_strategy TEXT,
  p_expected_updated_at TIMESTAMPTZ DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_row public.client_program_assignments%ROWTYPE;
  v_before TEXT;
BEGIN
  v_admin := public._require_admin();
  IF p_strategy NOT IN (
    'SMART_PROGRESSION_EXERCISE_LOCKED',
    'MATRIX_MANAGED_PROGRESSION',
    'COACH_MANAGED'
  ) THEN
    RAISE EXCEPTION 'invalid_progression_strategy' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_row FROM public.client_program_assignments WHERE id = p_assignment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
  IF p_expected_updated_at IS NOT NULL AND v_row.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RAISE EXCEPTION 'stale_update' USING ERRCODE = '22023';
  END IF;
  v_before := v_row.progression_strategy;
  UPDATE public.client_program_assignments
  SET
    progression_strategy = p_strategy,
    progression_status = CASE
      WHEN p_strategy = 'COACH_MANAGED' THEN 'ACTIVE'
      ELSE progression_status
    END,
    updated_at = now()
  WHERE id = p_assignment_id
  RETURNING * INTO v_row;

  INSERT INTO public.audit_events (actor_id, subject_user_id, event_type, metadata)
  VALUES (
    v_admin,
    v_row.client_id,
    'progression_strategy_set',
    jsonb_build_object(
      'who', 'COACH',
      'assignment_id', v_row.id,
      'before', v_before,
      'after', p_strategy,
      'reason', NULLIF(btrim(COALESCE(p_reason, '')), '')
    )
  );

  RETURN to_jsonb(v_row);
END;
$$;

DROP FUNCTION IF EXISTS public.admin_resolve_progression_review(UUID, TEXT, TIMESTAMPTZ, TEXT);

CREATE OR REPLACE FUNCTION public.admin_resolve_progression_review(
  p_assignment_id UUID,
  p_exercise_external_id TEXT,
  p_expected_updated_at TIMESTAMPTZ DEFAULT NULL,
  p_action TEXT DEFAULT 'keep',
  p_reason_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_row public.client_program_assignments%ROWTYPE;
  v_state JSONB;
  v_reviews JSONB;
  v_kept JSONB;
BEGIN
  v_admin := public._require_admin();
  IF p_action <> 'keep' THEN
    RAISE EXCEPTION 'invalid_review_action' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_row FROM public.client_program_assignments WHERE id = p_assignment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
  IF p_expected_updated_at IS NOT NULL AND v_row.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RAISE EXCEPTION 'stale_update' USING ERRCODE = '22023';
  END IF;

  v_state := COALESCE(v_row.progression_state, '{}'::jsonb);
  v_reviews := COALESCE(v_state->'reviews', '[]'::jsonb);
  v_reviews := (
    SELECT COALESCE(jsonb_agg(
      CASE
        WHEN item->>'exercise_external_id' = p_exercise_external_id THEN item || jsonb_build_object('status', 'kept')
        ELSE item
      END
    ), '[]'::jsonb)
    FROM jsonb_array_elements(v_reviews) AS item
  );
  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_reviews) item
    WHERE item->>'exercise_external_id' = p_exercise_external_id
  ) THEN
    v_reviews := v_reviews || jsonb_build_array(jsonb_build_object(
      'exercise_external_id', p_exercise_external_id,
      'status', 'kept',
      'reason_code', COALESCE(NULLIF(btrim(COALESCE(p_reason_code, '')), ''), 'EXERCISE_REVIEW_RECOMMENDED')
    ));
  END IF;

  v_kept := COALESCE(v_state->'kept', '{}'::jsonb) || jsonb_build_object(
    p_exercise_external_id,
    jsonb_build_object(
      'at', now(),
      'reason_code', COALESCE(
        NULLIF(btrim(COALESCE(p_reason_code, '')), ''),
        (
          SELECT item->>'reason_code'
          FROM jsonb_array_elements(v_reviews) item
          WHERE item->>'exercise_external_id' = p_exercise_external_id
          LIMIT 1
        ),
        'EXERCISE_REVIEW_RECOMMENDED'
      )
    )
  );
  v_state := v_state || jsonb_build_object('reviews', v_reviews, 'kept', v_kept);

  UPDATE public.client_program_assignments
  SET
    progression_state = v_state,
    progression_status = CASE
      WHEN EXISTS (
        SELECT 1 FROM jsonb_array_elements(v_reviews) item WHERE item->>'status' = 'open'
      ) THEN 'REVIEW_REQUIRED'
      ELSE 'ACTIVE'
    END,
    updated_at = now()
  WHERE id = p_assignment_id
  RETURNING * INTO v_row;

  INSERT INTO public.audit_events (actor_id, subject_user_id, event_type, metadata)
  VALUES (
    v_admin,
    v_row.client_id,
    'progression_exercise_kept',
    jsonb_build_object(
      'who', 'COACH',
      'assignment_id', v_row.id,
      'exercise_external_id', p_exercise_external_id,
      'result', 'kept'
    )
  );

  RETURN to_jsonb(v_row);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_client_progression_strategy(UUID, TEXT, TIMESTAMPTZ, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_client_progression_strategy(UUID, TEXT, TIMESTAMPTZ, TEXT) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.admin_resolve_progression_review(UUID, TEXT, TIMESTAMPTZ, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_resolve_progression_review(UUID, TEXT, TIMESTAMPTZ, TEXT, TEXT) TO authenticated, service_role;

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
  v_nutrition JSONB;
  v_last_workout TIMESTAMPTZ;
  v_last_nutrition TIMESTAMPTZ;
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
    'notes_count', v_notes_count, 'open_support_count', v_open_support
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_client_overview(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_client_overview(UUID) TO authenticated, service_role;
