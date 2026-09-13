-- Phase 6 (LOCAL ONLY): persist activity_role on template + assignment exercises,
-- copy into snapshots, expose on client runtime, and set progression_strategy from contract.
-- Do NOT apply to Staging or Production in Phase 6.

ALTER TABLE public.program_template_exercises
  ADD COLUMN IF NOT EXISTS activity_role TEXT;

ALTER TABLE public.client_program_exercises
  ADD COLUMN IF NOT EXISTS activity_role TEXT;

COMMENT ON COLUMN public.program_template_exercises.activity_role IS
  'Phase 2/6 activity role (GENERAL_WARM_UP, MAIN_RESISTANCE, POST_WORKOUT_CARDIO, EXERCISE_SPECIFIC_RAMP_UP, POWER_SKILL_BLOCK, …).';

COMMENT ON COLUMN public.client_program_exercises.activity_role IS
  'Frozen activity role copied from program_template_exercises at assignment time.';

-- ---------------------------------------------------------------------------
-- Copy path: include activity_role
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._copy_template_to_assignment(p_assignment_id UUID, p_template_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week RECORD;
  v_day RECORD;
  v_ex RECORD;
  v_week_id UUID;
  v_day_id UUID;
BEGIN
  FOR v_week IN
    SELECT * FROM public.program_template_weeks WHERE template_id = p_template_id ORDER BY week_number
  LOOP
    INSERT INTO public.client_program_weeks (assignment_id, week_number, title_ar, notes_ar)
    VALUES (p_assignment_id, v_week.week_number, v_week.title_ar, v_week.notes_ar)
    RETURNING id INTO v_week_id;

    FOR v_day IN
      SELECT * FROM public.program_template_days WHERE week_id = v_week.id ORDER BY day_number
    LOOP
      INSERT INTO public.client_program_days (
        week_id, day_number, day_type, title_ar, muscle_focus, estimated_minutes, estimated_calories
      ) VALUES (
        v_week_id, v_day.day_number, v_day.day_type, v_day.title_ar, v_day.muscle_focus,
        v_day.estimated_minutes, v_day.estimated_calories
      )
      RETURNING id INTO v_day_id;

      FOR v_ex IN
        SELECT x.*, e.external_id, e.name_ar, e.name_en
        FROM public.program_template_exercises x
        JOIN public.exercises e ON e.id = x.exercise_id
        WHERE x.day_id = v_day.id
        ORDER BY x.sort_order
      LOOP
        INSERT INTO public.client_program_exercises (
          day_id, exercise_id, exercise_external_id, exercise_name_ar, exercise_name_en,
          sort_order, sets, reps_min, reps_max, reps_label, rest_seconds, suggested_weight_kg, notes_ar,
          activity_role
        ) VALUES (
          v_day_id, v_ex.exercise_id, v_ex.external_id, v_ex.name_ar, v_ex.name_en,
          v_ex.sort_order, v_ex.sets, v_ex.reps_min, v_ex.reps_max, v_ex.reps_label,
          v_ex.rest_seconds, v_ex.suggested_weight_kg, v_ex.notes_ar,
          NULLIF(v_ex.activity_role, '')
        );
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public._copy_template_to_assignment(UUID, UUID) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- admin_save: persist activity_role from exercise payload
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_save_program_template(
  p_payload JSONB,
  p_expected_updated_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_id UUID;
  v_existing public.program_templates%ROWTYPE;
  v_name_ar TEXT;
  v_slug TEXT;
  v_goal TEXT;
  v_level TEXT;
  v_week JSONB;
  v_day JSONB;
  v_ex JSONB;
  v_week_id UUID;
  v_day_id UUID;
  v_sort INT;
  v_was_published BOOLEAN := false;
  v_metadata JSONB;
BEGIN
  v_admin := public._require_admin();
  v_id := NULLIF(p_payload->>'id', '')::UUID;
  v_name_ar := NULLIF(btrim(COALESCE(p_payload->>'name_ar', '')), '');
  v_slug := NULLIF(btrim(COALESCE(p_payload->>'slug', '')), '');
  v_goal := NULLIF(p_payload->>'goal', '');
  v_level := NULLIF(p_payload->>'level', '');
  v_metadata := COALESCE(p_payload->'metadata', '{}'::jsonb);

  IF v_name_ar IS NULL THEN
    RAISE EXCEPTION 'name_required' USING ERRCODE = '22023';
  END IF;
  IF v_slug IS NULL THEN
    v_slug := lower(regexp_replace(v_name_ar, '[^a-zA-Z0-9\u0600-\u06FF]+', '-', 'g'));
    v_slug := trim(BOTH '-' FROM v_slug);
  END IF;
  IF v_slug IS NULL OR v_slug = '' THEN
    RAISE EXCEPTION 'slug_required' USING ERRCODE = '22023';
  END IF;
  IF v_goal IS NOT NULL AND v_goal NOT IN ('cut', 'bulk', 'fitness', 'recomp') THEN
    RAISE EXCEPTION 'invalid_goal' USING ERRCODE = '22023';
  END IF;
  IF v_level IS NOT NULL AND v_level NOT IN ('beginner', 'intermediate', 'advanced') THEN
    RAISE EXCEPTION 'invalid_level' USING ERRCODE = '22023';
  END IF;

  IF v_id IS NOT NULL THEN
    SELECT * INTO v_existing FROM public.program_templates WHERE id = v_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
    END IF;
    IF v_existing.archived_at IS NOT NULL THEN
      RAISE EXCEPTION 'template_archived' USING ERRCODE = '22023';
    END IF;
    IF p_expected_updated_at IS NOT NULL AND v_existing.updated_at IS DISTINCT FROM p_expected_updated_at THEN
      RAISE EXCEPTION 'stale_update' USING ERRCODE = '22023';
    END IF;
    IF v_existing.is_published AND p_payload ? 'weeks' THEN
      RAISE EXCEPTION 'published_template_immutable' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (SELECT 1 FROM public.program_templates t WHERE t.id <> v_id AND t.slug = v_slug) THEN
      RAISE EXCEPTION 'duplicate_slug' USING ERRCODE = '23505';
    END IF;
    v_was_published := v_existing.is_published;

    UPDATE public.program_templates SET
      slug = v_slug,
      name_ar = v_name_ar,
      name_en = NULLIF(p_payload->>'name_en', ''),
      description_ar = NULLIF(p_payload->>'description_ar', ''),
      goal = v_goal::public.program_goal,
      level = v_level::public.program_level,
      duration_weeks = GREATEST(COALESCE((p_payload->>'duration_weeks')::INT, v_existing.duration_weeks), 1),
      days_per_week = LEAST(GREATEST(COALESCE((p_payload->>'days_per_week')::INT, v_existing.days_per_week), 1), 7),
      metadata = v_existing.metadata || v_metadata,
      version = CASE WHEN v_was_published THEN v_existing.version + 1 ELSE v_existing.version END
    WHERE id = v_id;
  ELSE
    IF EXISTS (SELECT 1 FROM public.program_templates t WHERE t.slug = v_slug) THEN
      RAISE EXCEPTION 'duplicate_slug' USING ERRCODE = '23505';
    END IF;
    INSERT INTO public.program_templates (
      slug, name_ar, name_en, description_ar, goal, level, duration_weeks, days_per_week, metadata, is_published, version
    ) VALUES (
      v_slug,
      v_name_ar,
      NULLIF(p_payload->>'name_en', ''),
      NULLIF(p_payload->>'description_ar', ''),
      v_goal::public.program_goal,
      v_level::public.program_level,
      GREATEST(COALESCE((p_payload->>'duration_weeks')::INT, 12), 1),
      LEAST(GREATEST(COALESCE((p_payload->>'days_per_week')::INT, 4), 1), 7),
      v_metadata,
      false,
      1
    )
    RETURNING id INTO v_id;
  END IF;

  IF p_payload ? 'weeks' THEN
    DELETE FROM public.program_template_weeks WHERE template_id = v_id;
    FOR v_week IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'weeks', '[]'::jsonb))
    LOOP
      INSERT INTO public.program_template_weeks (template_id, week_number, title_ar, notes_ar)
      VALUES (
        v_id,
        GREATEST(COALESCE((v_week->>'week_number')::INT, 1), 1),
        NULLIF(v_week->>'title_ar', ''),
        NULLIF(v_week->>'notes_ar', '')
      )
      RETURNING id INTO v_week_id;

      FOR v_day IN SELECT * FROM jsonb_array_elements(COALESCE(v_week->'days', '[]'::jsonb))
      LOOP
        INSERT INTO public.program_template_days (
          week_id, day_number, day_type, title_ar, muscle_focus, estimated_minutes, estimated_calories
        ) VALUES (
          v_week_id,
          LEAST(GREATEST(COALESCE((v_day->>'day_number')::INT, 1), 1), 7),
          COALESCE(NULLIF(v_day->>'day_type', ''), 'workout')::public.program_day_type,
          COALESCE(NULLIF(btrim(COALESCE(v_day->>'title_ar', '')), ''), 'يوم تدريب'),
          NULLIF(v_day->>'muscle_focus', ''),
          NULLIF(v_day->>'estimated_minutes', '')::INT,
          NULLIF(v_day->>'estimated_calories', '')::INT
        )
        RETURNING id INTO v_day_id;

        v_sort := 0;
        FOR v_ex IN SELECT * FROM jsonb_array_elements(COALESCE(v_day->'exercises', '[]'::jsonb))
        LOOP
          IF NULLIF(v_ex->>'exercise_id', '') IS NULL THEN
            RAISE EXCEPTION 'exercise_required' USING ERRCODE = '22023';
          END IF;
          IF NOT EXISTS (SELECT 1 FROM public.exercises e WHERE e.id = (v_ex->>'exercise_id')::UUID) THEN
            RAISE EXCEPTION 'exercise_required' USING ERRCODE = '22023';
          END IF;
          INSERT INTO public.program_template_exercises (
            day_id, exercise_id, sort_order, sets, reps_min, reps_max, reps_label,
            rest_seconds, suggested_weight_kg, notes_ar, activity_role
          ) VALUES (
            v_day_id,
            (v_ex->>'exercise_id')::UUID,
            v_sort,
            GREATEST(COALESCE((v_ex->>'sets')::INT, 3), 1),
            NULLIF(v_ex->>'reps_min', '')::INT,
            NULLIF(v_ex->>'reps_max', '')::INT,
            NULLIF(v_ex->>'reps_label', ''),
            GREATEST(COALESCE((v_ex->>'rest_seconds')::INT, 60), 0),
            NULLIF(v_ex->>'suggested_weight_kg', '')::NUMERIC,
            NULLIF(v_ex->>'notes_ar', ''),
            NULLIF(v_ex->>'activity_role', '')
          );
          v_sort := v_sort + 1;
        END LOOP;
      END LOOP;
    END LOOP;
  END IF;

  RETURN public.admin_get_program_template(v_id);
END;
$$;

-- ---------------------------------------------------------------------------
-- Assign: set progression_strategy from template_contract when present
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_assign_client_program(
  p_client_id UUID,
  p_template_id UUID,
  p_starts_on DATE DEFAULT CURRENT_DATE,
  p_replace BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_template public.program_templates%ROWTYPE;
  v_status TEXT;
  v_id UUID;
  v_active UUID;
  v_scheduled UUID;
  v_week_count INT;
  v_progression TEXT;
BEGIN
  v_admin := public._require_admin();
  IF p_client_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_client_id) THEN
    RAISE EXCEPTION 'invalid_client' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_template FROM public.program_templates WHERE id = p_template_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'template_not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_template.archived_at IS NOT NULL OR v_template.is_published IS NOT TRUE THEN
    RAISE EXCEPTION 'template_not_assignable' USING ERRCODE = '22023';
  END IF;

  SELECT count(*) INTO v_week_count FROM public.program_template_weeks WHERE template_id = p_template_id;
  IF v_week_count < 1 THEN
    RAISE EXCEPTION 'template_empty' USING ERRCODE = '22023';
  END IF;

  v_status := CASE WHEN p_starts_on IS NOT NULL AND p_starts_on > CURRENT_DATE THEN 'scheduled' ELSE 'active' END;

  SELECT id INTO v_active FROM public.client_program_assignments
  WHERE client_id = p_client_id AND status = 'active';
  SELECT id INTO v_scheduled FROM public.client_program_assignments
  WHERE client_id = p_client_id AND status = 'scheduled';

  IF v_status = 'active' AND v_active IS NOT NULL THEN
    IF p_replace IS NOT TRUE THEN
      RAISE EXCEPTION 'active_assignment_exists' USING ERRCODE = '22023';
    END IF;
    UPDATE public.client_program_assignments
    SET status = 'replaced', ended_at = now(), archived_at = now()
    WHERE id = v_active;
  END IF;

  IF v_status = 'scheduled' AND v_scheduled IS NOT NULL THEN
    IF p_replace IS NOT TRUE THEN
      RAISE EXCEPTION 'scheduled_assignment_exists' USING ERRCODE = '22023';
    END IF;
    UPDATE public.client_program_assignments
    SET status = 'cancelled', ended_at = now(), archived_at = now()
    WHERE id = v_scheduled;
  END IF;

  v_progression := NULLIF(v_template.metadata->'template_contract'->'progression'->'compatible_strategies'->>0, '');
  IF v_progression IS NULL OR v_progression NOT IN (
    'SMART_PROGRESSION_EXERCISE_LOCKED',
    'MATRIX_MANAGED_PROGRESSION',
    'COACH_MANAGED'
  ) THEN
    v_progression := 'SMART_PROGRESSION_EXERCISE_LOCKED';
  END IF;

  INSERT INTO public.client_program_assignments (
    client_id, source_template_id, template_version, status, assigned_by, starts_on,
    name_ar, name_en, goal, level, duration_weeks, days_per_week,
    generation_source, progression_strategy
  ) VALUES (
    p_client_id, p_template_id, v_template.version, v_status, v_admin, COALESCE(p_starts_on, CURRENT_DATE),
    v_template.name_ar, v_template.name_en, v_template.goal::TEXT, v_template.level::TEXT,
    v_template.duration_weeks, v_template.days_per_week,
    'template', v_progression
  )
  RETURNING id INTO v_id;

  PERFORM public._copy_template_to_assignment(v_id, p_template_id);

  PERFORM public._write_audit_event(
    v_admin,
    p_client_id,
    CASE WHEN v_active IS NOT NULL AND v_status = 'active' THEN 'client_program_replaced' ELSE 'client_program_assigned' END,
    jsonb_build_object(
      'assignment_id', v_id,
      'template_id', p_template_id,
      'template_version', v_template.version,
      'replaced_assignment_id', v_active,
      'status', v_status,
      'progression_strategy', v_progression
    )
  );

  RETURN public._assignment_tree(v_id);
END;
$$;

-- ---------------------------------------------------------------------------
-- Client runtime: expose activity_role
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.client_get_my_training_runtime()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
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
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_row
  FROM public.client_program_assignments
  WHERE client_id = v_user AND status IN ('active', 'scheduled')
  ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, assigned_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('reason', 'no_program', 'assignment', NULL, 'days', '[]'::jsonb);
  END IF;

  v_complete := EXISTS (SELECT 1 FROM public.client_program_weeks w WHERE w.assignment_id = v_row.id);
  IF NOT v_complete THEN
    RETURN jsonb_build_object(
      'reason', 'legacy_incomplete',
      'assignment', to_jsonb(v_row),
      'snapshot_complete', false,
      'days', '[]'::jsonb
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
