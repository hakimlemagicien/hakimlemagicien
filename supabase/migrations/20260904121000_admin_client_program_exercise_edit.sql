-- Client-specific program edits: add/remove exercises on the active assignment snapshot.
-- Does not rewrite completed workouts or set logs. Optimistic concurrency via updated_at.
-- Template catalog rows remain untouched.

CREATE OR REPLACE FUNCTION public.admin_save_client_assignment_exercises(
  p_assignment_id UUID,
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
  v_row public.client_program_assignments%ROWTYPE;
  v_item JSONB;
  v_id UUID;
  v_day_id UUID;
  v_ex public.exercises%ROWTYPE;
  v_old UUID;
  v_remove UUID;
  v_sort INT;
  v_reason TEXT;
BEGIN
  v_admin := public._require_admin();
  v_reason := NULLIF(btrim(COALESCE(p_payload->>'reason', '')), '');
  SELECT * INTO v_row FROM public.client_program_assignments WHERE id = p_assignment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_row.status NOT IN ('active', 'scheduled') THEN
    RAISE EXCEPTION 'assignment_not_editable' USING ERRCODE = '22023';
  END IF;
  IF p_expected_updated_at IS NOT NULL AND v_row.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RAISE EXCEPTION 'stale_update' USING ERRCODE = '22023';
  END IF;

  -- Avoid unique (day_id, sort_order) collisions while reordering.
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'exercises', '[]'::jsonb))
  LOOP
    v_id := NULLIF(v_item->>'id', '')::UUID;
    IF v_id IS NOT NULL THEN
      UPDATE public.client_program_exercises
      SET sort_order = -1 * (sort_order + 1)
      WHERE id = v_id
        AND EXISTS (
          SELECT 1
          FROM public.client_program_days d
          JOIN public.client_program_weeks w ON w.id = d.week_id
          WHERE d.id = client_program_exercises.day_id AND w.assignment_id = p_assignment_id
        );
    END IF;
  END LOOP;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'exercises', '[]'::jsonb))
  LOOP
    v_id := NULLIF(v_item->>'id', '')::UUID;
    IF v_id IS NULL THEN
      CONTINUE;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.client_program_exercises x
      JOIN public.client_program_days d ON d.id = x.day_id
      JOIN public.client_program_weeks w ON w.id = d.week_id
      WHERE x.id = v_id AND w.assignment_id = p_assignment_id
    ) THEN
      RAISE EXCEPTION 'exercise_required' USING ERRCODE = '22023';
    END IF;

    SELECT exercise_id INTO v_old FROM public.client_program_exercises WHERE id = v_id;

    IF NULLIF(v_item->>'exercise_id', '') IS NOT NULL AND (v_item->>'exercise_id')::UUID IS DISTINCT FROM v_old THEN
      SELECT * INTO v_ex FROM public.exercises WHERE id = (v_item->>'exercise_id')::UUID;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'exercise_required' USING ERRCODE = '22023';
      END IF;
      UPDATE public.client_program_exercises SET
        exercise_id = v_ex.id,
        exercise_external_id = v_ex.external_id,
        exercise_name_ar = v_ex.name_ar,
        exercise_name_en = v_ex.name_en
      WHERE id = v_id;
      PERFORM public._write_audit_event(
        v_admin,
        v_row.client_id,
        'client_program_exercise_replaced',
        jsonb_build_object(
          'assignment_id', p_assignment_id,
          'client_exercise_id', v_id,
          'old_exercise_id', v_old,
          'new_exercise_id', v_ex.id,
          'reason', v_reason
        )
      );
    END IF;

    IF COALESCE((v_item->>'sets')::INT, 0) < 1 THEN
      RAISE EXCEPTION 'invalid_sets' USING ERRCODE = '22023';
    END IF;
    IF COALESCE((v_item->>'rest_seconds')::INT, 0) < 0 THEN
      RAISE EXCEPTION 'invalid_rest' USING ERRCODE = '22023';
    END IF;

    UPDATE public.client_program_exercises SET
      sort_order = COALESCE((v_item->>'sort_order')::INT, sort_order),
      sets = (v_item->>'sets')::INT,
      reps_min = NULLIF(v_item->>'reps_min', '')::INT,
      reps_max = NULLIF(v_item->>'reps_max', '')::INT,
      reps_label = NULLIF(v_item->>'reps_label', ''),
      rest_seconds = COALESCE((v_item->>'rest_seconds')::INT, rest_seconds),
      suggested_weight_kg = NULLIF(v_item->>'suggested_weight_kg', '')::NUMERIC,
      notes_ar = NULLIF(v_item->>'notes_ar', '')
    WHERE id = v_id;
  END LOOP;

  FOR v_remove IN
    SELECT NULLIF(value #>> '{}', '')::UUID
    FROM jsonb_array_elements(COALESCE(p_payload->'remove_ids', '[]'::jsonb))
  LOOP
    IF v_remove IS NULL THEN
      CONTINUE;
    END IF;
    IF NOT EXISTS (
      SELECT 1
      FROM public.client_program_exercises x
      JOIN public.client_program_days d ON d.id = x.day_id
      JOIN public.client_program_weeks w ON w.id = d.week_id
      WHERE x.id = v_remove AND w.assignment_id = p_assignment_id
    ) THEN
      CONTINUE;
    END IF;
    DELETE FROM public.client_program_exercises WHERE id = v_remove;
    PERFORM public._write_audit_event(
      v_admin,
      v_row.client_id,
      'client_program_exercise_removed',
      jsonb_build_object(
        'assignment_id', p_assignment_id,
        'client_exercise_id', v_remove,
        'reason', v_reason
      )
    );
  END LOOP;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'exercises', '[]'::jsonb))
  LOOP
    IF NULLIF(v_item->>'id', '') IS NOT NULL THEN
      CONTINUE;
    END IF;
    v_day_id := NULLIF(v_item->>'day_id', '')::UUID;
    IF v_day_id IS NULL OR NULLIF(v_item->>'exercise_id', '') IS NULL THEN
      RAISE EXCEPTION 'exercise_required' USING ERRCODE = '22023';
    END IF;
    IF NOT EXISTS (
      SELECT 1
      FROM public.client_program_days d
      JOIN public.client_program_weeks w ON w.id = d.week_id
      WHERE d.id = v_day_id AND w.assignment_id = p_assignment_id
    ) THEN
      RAISE EXCEPTION 'exercise_required' USING ERRCODE = '22023';
    END IF;
    SELECT * INTO v_ex FROM public.exercises WHERE id = (v_item->>'exercise_id')::UUID;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'exercise_required' USING ERRCODE = '22023';
    END IF;
    IF COALESCE((v_item->>'sets')::INT, 0) < 1 THEN
      RAISE EXCEPTION 'invalid_sets' USING ERRCODE = '22023';
    END IF;
    IF COALESCE((v_item->>'rest_seconds')::INT, 0) < 0 THEN
      RAISE EXCEPTION 'invalid_rest' USING ERRCODE = '22023';
    END IF;
    SELECT COALESCE(MAX(sort_order), -1) + 1 INTO v_sort
    FROM public.client_program_exercises
    WHERE day_id = v_day_id AND sort_order >= 0;
    INSERT INTO public.client_program_exercises (
      day_id, exercise_id, exercise_external_id, exercise_name_ar, exercise_name_en,
      sort_order, sets, reps_min, reps_max, reps_label, rest_seconds, suggested_weight_kg, notes_ar
    ) VALUES (
      v_day_id,
      v_ex.id,
      v_ex.external_id,
      v_ex.name_ar,
      v_ex.name_en,
      GREATEST(COALESCE((v_item->>'sort_order')::INT, v_sort), 0),
      (v_item->>'sets')::INT,
      NULLIF(v_item->>'reps_min', '')::INT,
      NULLIF(v_item->>'reps_max', '')::INT,
      NULLIF(v_item->>'reps_label', ''),
      COALESCE((v_item->>'rest_seconds')::INT, 60),
      NULLIF(v_item->>'suggested_weight_kg', '')::NUMERIC,
      NULLIF(v_item->>'notes_ar', '')
    );
    PERFORM public._write_audit_event(
      v_admin,
      v_row.client_id,
      'client_program_exercise_added',
      jsonb_build_object(
        'assignment_id', p_assignment_id,
        'day_id', v_day_id,
        'exercise_id', v_ex.id,
        'reason', v_reason
      )
    );
  END LOOP;

  UPDATE public.client_program_assignments SET updated_at = now() WHERE id = p_assignment_id;

  PERFORM public._write_audit_event(
    v_admin,
    v_row.client_id,
    'client_program_prescription_updated',
    jsonb_build_object(
      'assignment_id', p_assignment_id,
      'reason', v_reason
    )
  );

  RETURN public._assignment_tree(p_assignment_id);
END;
$$;
