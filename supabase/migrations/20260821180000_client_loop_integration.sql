-- Training Engine V2 — client loop integration persistence.
-- Additive. No production apply. Engines remain TypeScript; this stores decisions and assigns validated snapshots.

ALTER TABLE public.adaptive_decision_logs
  ADD COLUMN IF NOT EXISTS evaluation_key TEXT,
  ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES public.client_program_assignments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS program_version INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS adaptive_decision_logs_eval_uidx
  ON public.adaptive_decision_logs (user_id, decision_type, evaluation_key);

CREATE INDEX IF NOT EXISTS adaptive_decision_logs_assignment_idx
  ON public.adaptive_decision_logs (assignment_id, created_at DESC)
  WHERE assignment_id IS NOT NULL;

ALTER TABLE public.client_program_assignments
  ALTER COLUMN source_template_id DROP NOT NULL;

ALTER TABLE public.client_program_assignments
  ADD COLUMN IF NOT EXISTS generation_source TEXT NOT NULL DEFAULT 'template'
    CHECK (generation_source IN ('template', 'v2_generator'));

COMMENT ON COLUMN public.client_program_assignments.generation_source IS
  'template = copied from program_templates. v2_generator = validated Phase 10 candidate snapshot.';

CREATE OR REPLACE FUNCTION public.client_upsert_adaptive_decision(
  p_decision_type TEXT,
  p_evaluation_key TEXT,
  p_reason_code TEXT,
  p_confidence TEXT,
  p_input_snapshot JSONB,
  p_assignment_id UUID DEFAULT NULL,
  p_program_version INTEGER DEFAULT NULL,
  p_workout_session_id UUID DEFAULT NULL,
  p_exercise_external_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_row public.adaptive_decision_logs;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_decision_type NOT IN ('WEEKLY_VOLUME', 'GOAL_RESPONSE', 'PROGRAM_GENERATION', 'PROGRAM_VALIDATION_BLOCKED') THEN
    RAISE EXCEPTION 'invalid_decision_type' USING ERRCODE = '22023';
  END IF;
  IF p_evaluation_key IS NULL OR length(trim(p_evaluation_key)) < 3 THEN
    RAISE EXCEPTION 'invalid_evaluation_key' USING ERRCODE = '22023';
  END IF;
  IF p_confidence IS NOT NULL AND p_confidence NOT IN ('LOW', 'MODERATE', 'HIGH') THEN
    RAISE EXCEPTION 'invalid_confidence' USING ERRCODE = '22023';
  END IF;
  IF p_assignment_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.client_program_assignments a
    WHERE a.id = p_assignment_id AND a.client_id = v_user
  ) THEN
    RAISE EXCEPTION 'assignment_not_found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.adaptive_decision_logs (
    user_id, decision_type, evaluation_key, reason_code, confidence, input_snapshot,
    assignment_id, program_version, workout_session_id, exercise_external_id
  ) VALUES (
    v_user, p_decision_type, trim(p_evaluation_key), p_reason_code, p_confidence,
    COALESCE(p_input_snapshot, '{}'::jsonb),
    p_assignment_id, p_program_version, p_workout_session_id, p_exercise_external_id
  )
  ON CONFLICT (user_id, decision_type, evaluation_key)
  DO UPDATE SET
    reason_code = EXCLUDED.reason_code,
    confidence = EXCLUDED.confidence,
    input_snapshot = EXCLUDED.input_snapshot,
    assignment_id = EXCLUDED.assignment_id,
    program_version = EXCLUDED.program_version,
    workout_session_id = EXCLUDED.workout_session_id,
    exercise_external_id = EXCLUDED.exercise_external_id
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'id', v_row.id,
    'decision_type', v_row.decision_type,
    'evaluation_key', v_row.evaluation_key,
    'reason_code', v_row.reason_code,
    'confidence', v_row.confidence,
    'assignment_id', v_row.assignment_id,
    'program_version', v_row.program_version,
    'created_at', v_row.created_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.client_list_own_adaptive_decisions(
  p_decision_types TEXT[] DEFAULT ARRAY['WEEKLY_VOLUME', 'GOAL_RESPONSE'],
  p_limit INTEGER DEFAULT 12
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 12), 1), 40);
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC)
    FROM (
      SELECT id, decision_type, evaluation_key, reason_code, confidence, input_snapshot,
             assignment_id, program_version, created_at
      FROM public.adaptive_decision_logs
      WHERE user_id = v_user
        AND decision_type = ANY (COALESCE(p_decision_types, ARRAY['WEEKLY_VOLUME', 'GOAL_RESPONSE']))
      ORDER BY created_at DESC
      LIMIT v_limit
    ) x
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_client_adaptive_decisions(
  p_client_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50);
BEGIN
  PERFORM public._require_admin();
  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC)
    FROM (
      SELECT id, user_id, decision_type, evaluation_key, reason_code, confidence, input_snapshot,
             assignment_id, program_version, created_at
      FROM public.adaptive_decision_logs
      WHERE user_id = p_client_id
      ORDER BY created_at DESC
      LIMIT v_limit
    ) x
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_assign_generated_v2_program(
  p_client_id UUID,
  p_starts_on DATE,
  p_replace BOOLEAN,
  p_generation_status TEXT,
  p_validation_status TEXT,
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_id UUID;
  v_active UUID;
  v_status TEXT;
  v_session JSONB;
  v_exercise JSONB;
  v_week_id UUID;
  v_day_id UUID;
  v_ex RECORD;
  v_goal TEXT;
  v_days INT;
  v_version INT;
  v_name TEXT;
  v_in_progress UUID;
  v_sort INT;
BEGIN
  v_admin := public._require_admin();
  IF p_client_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_client_id) THEN
    RAISE EXCEPTION 'invalid_client' USING ERRCODE = '22023';
  END IF;
  IF p_generation_status IS DISTINCT FROM 'READY' THEN
    RAISE EXCEPTION 'program_generation_blocked' USING ERRCODE = '22023';
  END IF;
  IF p_validation_status NOT IN ('VALID', 'VALID_WITH_WARNINGS') THEN
    RAISE EXCEPTION 'program_invalid' USING ERRCODE = '22023';
  END IF;
  IF p_payload IS NULL OR jsonb_typeof(p_payload -> 'sessions') <> 'array' OR jsonb_array_length(p_payload -> 'sessions') < 1 THEN
    RAISE EXCEPTION 'program_invalid' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_in_progress
  FROM public.workout_sessions
  WHERE user_id = p_client_id AND status = 'IN_PROGRESS'
  LIMIT 1;
  IF v_in_progress IS NOT NULL THEN
    RAISE EXCEPTION 'active_workout_in_progress' USING ERRCODE = '22023';
  END IF;

  v_goal := COALESCE(p_payload ->> 'goal_id', 'FAT_LOSS');
  v_days := COALESCE((p_payload ->> 'days_per_week')::INT, jsonb_array_length(p_payload -> 'sessions'));
  v_version := COALESCE((p_payload ->> 'version')::INT, 1);
  v_name := COALESCE(p_payload ->> 'name_ar', 'برنامج تكيّفي');
  v_status := CASE WHEN p_starts_on IS NOT NULL AND p_starts_on > CURRENT_DATE THEN 'scheduled' ELSE 'active' END;

  SELECT id INTO v_active FROM public.client_program_assignments
  WHERE client_id = p_client_id AND status = 'active';
  IF v_status = 'active' AND v_active IS NOT NULL THEN
    IF p_replace IS NOT TRUE THEN
      RAISE EXCEPTION 'active_assignment_exists' USING ERRCODE = '22023';
    END IF;
    UPDATE public.client_program_assignments
    SET status = 'replaced', ended_at = now(), archived_at = now()
    WHERE id = v_active;
  END IF;

  INSERT INTO public.client_program_assignments (
    client_id, source_template_id, template_version, status, assigned_by, starts_on,
    name_ar, name_en, goal, level, duration_weeks, days_per_week, generation_source
  ) VALUES (
    p_client_id, NULL, v_version, v_status, v_admin, COALESCE(p_starts_on, CURRENT_DATE),
    v_name, NULL, v_goal, 'custom', 4, v_days, 'v2_generator'
  )
  RETURNING id INTO v_id;

  INSERT INTO public.client_program_weeks (assignment_id, week_number, title_ar, notes_ar)
  VALUES (v_id, 1, 'الأسبوع التكيّفي', 'لقطة مولَّدة ومُصادَقة — لا تُعاد توليدها عند فتح التطبيق')
  RETURNING id INTO v_week_id;

  FOR v_session IN SELECT value FROM jsonb_array_elements(p_payload -> 'sessions')
  LOOP
    INSERT INTO public.client_program_days (
      week_id, day_number, day_type, title_ar, muscle_focus, estimated_minutes, estimated_calories
    ) VALUES (
      v_week_id,
      LEAST(7, GREATEST(1, COALESCE((v_session ->> 'sequence_index')::INT, 0) + 1)),
      'workout',
      COALESCE(v_session ->> 'title', 'حصة'),
      COALESCE(v_session -> 'primary_regions' ->> 0, NULL),
      COALESCE((v_session ->> 'estimated_minutes')::INT, 45),
      NULL
    )
    RETURNING id INTO v_day_id;

    v_sort := 0;
    FOR v_exercise IN SELECT value FROM jsonb_array_elements(COALESCE(v_session -> 'exercises', '[]'::jsonb))
    LOOP
      IF v_exercise ->> 'suggested_weight_kg' IS NOT NULL AND v_exercise ->> 'suggested_weight_kg' <> 'null' THEN
        RAISE EXCEPTION 'program_invalid' USING ERRCODE = '22023';
      END IF;
      SELECT e.id, e.external_id, e.name_ar, e.name_en
      INTO v_ex
      FROM public.exercises e
      WHERE e.external_id = v_exercise ->> 'external_id';
      IF NOT FOUND THEN
        RAISE EXCEPTION 'unknown_exercise' USING ERRCODE = '22023';
      END IF;
      INSERT INTO public.client_program_exercises (
        day_id, exercise_id, exercise_external_id, exercise_name_ar, exercise_name_en,
        sort_order, sets, reps_min, reps_max, reps_label, rest_seconds, suggested_weight_kg, notes_ar
      ) VALUES (
        v_day_id, v_ex.id, v_ex.external_id, v_ex.name_ar, v_ex.name_en,
        v_sort,
        GREATEST(1, COALESCE((v_exercise ->> 'sets')::INT, 3)),
        NULLIF(v_exercise ->> 'reps_min', '')::INT,
        NULLIF(v_exercise ->> 'reps_max', '')::INT,
        CASE
          WHEN v_exercise ->> 'reps_min' IS NOT NULL AND v_exercise ->> 'reps_max' IS NOT NULL
            THEN (v_exercise ->> 'reps_min') || '-' || (v_exercise ->> 'reps_max')
          ELSE NULL
        END,
        GREATEST(0, COALESCE((v_exercise ->> 'rest_seconds')::INT, 90)),
        NULL,
        NULL
      );
      v_sort := v_sort + 1;
    END LOOP;
  END LOOP;

  INSERT INTO public.adaptive_decision_logs (
    user_id, decision_type, evaluation_key, reason_code, confidence, input_snapshot,
    assignment_id, program_version
  ) VALUES (
    p_client_id,
    'PROGRAM_GENERATION',
    'program:' || v_id::TEXT || ':' || v_version::TEXT,
    COALESCE(p_payload ->> 'generation_reason', 'INITIAL_PROGRAM_GENERATION'),
    'HIGH',
    jsonb_build_object(
      'generation_status', p_generation_status,
      'validation_status', p_validation_status,
      'replaced_assignment_id', v_active,
      'goal_id', v_goal,
      'days_per_week', v_days
    ),
    v_id,
    v_version
  );

  PERFORM public._write_audit_event(
    v_admin,
    p_client_id,
    CASE WHEN v_active IS NOT NULL AND v_status = 'active' THEN 'client_program_replaced' ELSE 'client_program_assigned' END,
    jsonb_build_object(
      'assignment_id', v_id,
      'generation_source', 'v2_generator',
      'replaced_assignment_id', v_active,
      'status', v_status
    )
  );

  RETURN public._assignment_tree(v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_record_adaptive_decision(
  p_client_id UUID,
  p_decision_type TEXT,
  p_evaluation_key TEXT,
  p_reason_code TEXT,
  p_confidence TEXT,
  p_input_snapshot JSONB,
  p_assignment_id UUID DEFAULT NULL,
  p_program_version INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.adaptive_decision_logs;
BEGIN
  PERFORM public._require_admin();
  IF p_client_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_client_id) THEN
    RAISE EXCEPTION 'invalid_client' USING ERRCODE = '22023';
  END IF;
  IF p_decision_type NOT IN ('WEEKLY_VOLUME', 'GOAL_RESPONSE', 'PROGRAM_GENERATION', 'PROGRAM_VALIDATION_BLOCKED') THEN
    RAISE EXCEPTION 'invalid_decision_type' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.adaptive_decision_logs (
    user_id, decision_type, evaluation_key, reason_code, confidence, input_snapshot,
    assignment_id, program_version
  ) VALUES (
    p_client_id, p_decision_type, trim(p_evaluation_key), p_reason_code, p_confidence,
    COALESCE(p_input_snapshot, '{}'::jsonb), p_assignment_id, p_program_version
  )
  ON CONFLICT (user_id, decision_type, evaluation_key)
  DO UPDATE SET
    reason_code = EXCLUDED.reason_code,
    confidence = EXCLUDED.confidence,
    input_snapshot = EXCLUDED.input_snapshot,
    assignment_id = EXCLUDED.assignment_id,
    program_version = EXCLUDED.program_version
  RETURNING * INTO v_row;
  RETURN jsonb_build_object('id', v_row.id, 'decision_type', v_row.decision_type, 'evaluation_key', v_row.evaluation_key);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_record_adaptive_decision(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, UUID, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.client_upsert_adaptive_decision(TEXT, TEXT, TEXT, TEXT, JSONB, UUID, INTEGER, UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.client_list_own_adaptive_decisions(TEXT[], INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_client_adaptive_decisions(UUID, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_assign_generated_v2_program(UUID, DATE, BOOLEAN, TEXT, TEXT, JSONB) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.client_upsert_adaptive_decision(TEXT, TEXT, TEXT, TEXT, JSONB, UUID, INTEGER, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_list_own_adaptive_decisions(TEXT[], INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_client_adaptive_decisions(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_assign_generated_v2_program(UUID, DATE, BOOLEAN, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_upsert_adaptive_decision(TEXT, TEXT, TEXT, TEXT, JSONB, UUID, INTEGER, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.client_list_own_adaptive_decisions(TEXT[], INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_client_adaptive_decisions(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_assign_generated_v2_program(UUID, DATE, BOOLEAN, TEXT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_record_adaptive_decision(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, UUID, INTEGER) TO authenticated, service_role;
