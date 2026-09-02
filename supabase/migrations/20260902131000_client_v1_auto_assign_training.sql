-- V1 Product Closure: client paid auto-assign + shared assignment core (no Matrix rule changes).

CREATE OR REPLACE FUNCTION public._assign_generated_v2_program_snapshot(
  p_client_id UUID,
  p_assigned_by UUID,
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
    p_client_id, NULL, v_version, v_status, p_assigned_by, COALESCE(p_starts_on, CURRENT_DATE),
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

  IF p_assigned_by IS NOT NULL THEN
    PERFORM public._write_audit_event(
      p_assigned_by,
      p_client_id,
      CASE WHEN v_active IS NOT NULL AND v_status = 'active' THEN 'client_program_replaced' ELSE 'client_program_assigned' END,
      jsonb_build_object(
        'assignment_id', v_id,
        'generation_source', 'v2_generator',
        'replaced_assignment_id', v_active,
        'status', v_status
      )
    );
  END IF;

  RETURN public._assignment_tree(v_id);
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
BEGIN
  v_admin := public._require_admin();
  RETURN public._assign_generated_v2_program_snapshot(
    p_client_id,
    v_admin,
    p_starts_on,
    p_replace,
    p_generation_status,
    p_validation_status,
    p_payload
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.client_assign_generated_v2_program(
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
  v_user UUID := auth.uid();
  v_ent JSONB;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  v_ent := public.get_my_entitlements();
  IF COALESCE((v_ent -> 'capabilities' ->> 'workout_program')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'workout_not_entitled' USING ERRCODE = '42501';
  END IF;

  RETURN public._assign_generated_v2_program_snapshot(
    v_user,
    v_user,
    p_starts_on,
    p_replace,
    p_generation_status,
    p_validation_status,
    p_payload
  );
END;
$$;

REVOKE ALL ON FUNCTION public._assign_generated_v2_program_snapshot(UUID, UUID, DATE, BOOLEAN, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._assign_generated_v2_program_snapshot(UUID, UUID, DATE, BOOLEAN, TEXT, TEXT, JSONB) TO service_role;

REVOKE ALL ON FUNCTION public.client_assign_generated_v2_program(DATE, BOOLEAN, TEXT, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.client_assign_generated_v2_program(DATE, BOOLEAN, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_assign_generated_v2_program(DATE, BOOLEAN, TEXT, TEXT, JSONB) TO service_role;

COMMENT ON FUNCTION public.client_assign_generated_v2_program IS
  'V1 paid auto-assign: validated V2 generator snapshot for entitled member (auth.uid).';
