-- Client assignment Draft ≠ Publish (Training + Nutrition).
-- Published/active snapshots stay immutable for prescription edits.
-- Admin creates a draft version, edits it, then publishes → becomes active.

ALTER TABLE public.client_program_assignments
  ADD COLUMN IF NOT EXISTS draft_meta JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.client_program_assignments.draft_meta IS
  'Draft/publish lineage for client assignment editions (not template metadata).';

ALTER TABLE public.client_nutrition_assignments
  ADD COLUMN IF NOT EXISTS draft_meta JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- 1. Status: allow draft
-- ---------------------------------------------------------------------------

ALTER TABLE public.client_program_assignments
  DROP CONSTRAINT IF EXISTS client_program_assignments_status_check;
ALTER TABLE public.client_program_assignments
  ADD CONSTRAINT client_program_assignments_status_check
  CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'replaced', 'cancelled', 'archived'));

CREATE UNIQUE INDEX IF NOT EXISTS client_program_assignments_one_draft
  ON public.client_program_assignments (client_id)
  WHERE status = 'draft';

ALTER TABLE public.client_nutrition_assignments
  DROP CONSTRAINT IF EXISTS client_nutrition_assignments_status_check;
ALTER TABLE public.client_nutrition_assignments
  ADD CONSTRAINT client_nutrition_assignments_status_check
  CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'replaced', 'cancelled'));

CREATE UNIQUE INDEX IF NOT EXISTS client_nutrition_assignments_one_draft
  ON public.client_nutrition_assignments (client_id)
  WHERE status = 'draft';

-- Also drop inline table check if still named differently (no-op when already dropped).
DO $$
BEGIN
  NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Client RLS: never expose draft trees to the member app
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS client_program_weeks_own_select ON public.client_program_weeks;
CREATE POLICY client_program_weeks_own_select
  ON public.client_program_weeks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_program_assignments a
      WHERE a.id = assignment_id
        AND a.client_id = auth.uid()
        AND a.status IN ('active', 'scheduled')
    )
  );

DROP POLICY IF EXISTS client_program_days_own_select ON public.client_program_days;
CREATE POLICY client_program_days_own_select
  ON public.client_program_days FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.client_program_weeks w
      JOIN public.client_program_assignments a ON a.id = w.assignment_id
      WHERE w.id = week_id
        AND a.client_id = auth.uid()
        AND a.status IN ('active', 'scheduled')
    )
  );

DROP POLICY IF EXISTS client_program_exercises_own_select ON public.client_program_exercises;
CREATE POLICY client_program_exercises_own_select
  ON public.client_program_exercises FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.client_program_days d
      JOIN public.client_program_weeks w ON w.id = d.week_id
      JOIN public.client_program_assignments a ON a.id = w.assignment_id
      WHERE d.id = day_id
        AND a.client_id = auth.uid()
        AND a.status IN ('active', 'scheduled')
    )
  );

DROP POLICY IF EXISTS client_nutrition_slots_own_select ON public.client_nutrition_slots;
CREATE POLICY client_nutrition_slots_own_select
  ON public.client_nutrition_slots FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_nutrition_assignments a
      WHERE a.id = assignment_id
        AND a.client_id = auth.uid()
        AND a.status IN ('active', 'scheduled')
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Clone assignment tree (training)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public._copy_client_program_assignment_tree(
  p_source_id UUID,
  p_dest_id UUID
)
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
    SELECT * FROM public.client_program_weeks WHERE assignment_id = p_source_id ORDER BY week_number
  LOOP
    INSERT INTO public.client_program_weeks (assignment_id, week_number, title_ar, notes_ar)
    VALUES (p_dest_id, v_week.week_number, v_week.title_ar, v_week.notes_ar)
    RETURNING id INTO v_week_id;

    FOR v_day IN
      SELECT * FROM public.client_program_days WHERE week_id = v_week.id ORDER BY day_number
    LOOP
      INSERT INTO public.client_program_days (
        week_id, day_number, day_type, title_ar, muscle_focus, estimated_minutes, estimated_calories
      ) VALUES (
        v_week_id, v_day.day_number, v_day.day_type, v_day.title_ar, v_day.muscle_focus,
        v_day.estimated_minutes, v_day.estimated_calories
      )
      RETURNING id INTO v_day_id;

      FOR v_ex IN
        SELECT * FROM public.client_program_exercises WHERE day_id = v_day.id ORDER BY sort_order
      LOOP
        INSERT INTO public.client_program_exercises (
          day_id, exercise_id, exercise_external_id, exercise_name_ar, exercise_name_en,
          sort_order, sets, reps_min, reps_max, reps_label, rest_seconds, suggested_weight_kg, notes_ar
        ) VALUES (
          v_day_id, v_ex.exercise_id, v_ex.exercise_external_id, v_ex.exercise_name_ar, v_ex.exercise_name_en,
          v_ex.sort_order, v_ex.sets, v_ex.reps_min, v_ex.reps_max, v_ex.reps_label,
          v_ex.rest_seconds, v_ex.suggested_weight_kg, v_ex.notes_ar
        );
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public._copy_client_program_assignment_tree(UUID, UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_create_client_program_draft(
  p_source_assignment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_src public.client_program_assignments%ROWTYPE;
  v_existing UUID;
  v_id UUID;
  v_version INT;
BEGIN
  v_admin := public._require_admin();
  SELECT * INTO v_src FROM public.client_program_assignments WHERE id = p_source_assignment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_src.status NOT IN ('active', 'scheduled') THEN
    RAISE EXCEPTION 'invalid_assignment_status' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_existing
  FROM public.client_program_assignments
  WHERE client_id = v_src.client_id AND status = 'draft';
  IF v_existing IS NOT NULL THEN
    RAISE EXCEPTION 'draft_exists' USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(MAX(
    CASE
      WHEN draft_meta ? 'assignment_edition' THEN NULLIF(draft_meta->>'assignment_edition', '')::INT
      ELSE NULL
    END
  ), 0) + 1
  INTO v_version
  FROM public.client_program_assignments
  WHERE client_id = v_src.client_id;

  INSERT INTO public.client_program_assignments (
    client_id, status, starts_on, name_ar, name_en, goal, level, duration_weeks, days_per_week,
    source_template_id, template_version, assigned_by, generation_source, progression_strategy,
    preferred_media_variant, draft_meta
  )
  SELECT
    client_id,
    'draft',
    starts_on,
    COALESCE(name_ar, 'مسودة برنامج') || ' (مسودة)',
    name_en,
    goal,
    level,
    duration_weeks,
    days_per_week,
    source_template_id,
    template_version,
    v_admin,
    generation_source,
    progression_strategy,
    preferred_media_variant,
    jsonb_build_object(
      'assignment_edition', v_version,
      'draft_of', p_source_assignment_id,
      'draft_created_at', now()
    )
  FROM public.client_program_assignments
  WHERE id = p_source_assignment_id
  RETURNING id INTO v_id;

  PERFORM public._copy_client_program_assignment_tree(p_source_assignment_id, v_id);

  PERFORM public._write_audit_event(
    v_admin,
    v_src.client_id,
    'client_program_draft_created',
    jsonb_build_object('draft_id', v_id, 'source_assignment_id', p_source_assignment_id, 'edition', v_version)
  );

  RETURN public._assignment_tree(v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_publish_client_program_draft(
  p_draft_assignment_id UUID,
  p_starts_on DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_draft public.client_program_assignments%ROWTYPE;
  v_active UUID;
  v_scheduled UUID;
  v_status TEXT;
BEGIN
  v_admin := public._require_admin();
  SELECT * INTO v_draft FROM public.client_program_assignments WHERE id = p_draft_assignment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_draft.status <> 'draft' THEN
    RAISE EXCEPTION 'invalid_assignment_status' USING ERRCODE = '22023';
  END IF;

  v_status := CASE
    WHEN COALESCE(p_starts_on, v_draft.starts_on, CURRENT_DATE) > CURRENT_DATE THEN 'scheduled'
    ELSE 'active'
  END;

  SELECT id INTO v_active FROM public.client_program_assignments
  WHERE client_id = v_draft.client_id AND status = 'active';
  SELECT id INTO v_scheduled FROM public.client_program_assignments
  WHERE client_id = v_draft.client_id AND status = 'scheduled';

  IF v_status = 'active' AND v_active IS NOT NULL THEN
    UPDATE public.client_program_assignments
    SET status = 'replaced', ended_at = now()
    WHERE id = v_active;
  END IF;
  IF v_status = 'scheduled' AND v_scheduled IS NOT NULL THEN
    UPDATE public.client_program_assignments
    SET status = 'cancelled', ended_at = now()
    WHERE id = v_scheduled;
  END IF;

  UPDATE public.client_program_assignments
  SET
    status = v_status,
    starts_on = COALESCE(p_starts_on, starts_on, CURRENT_DATE),
    name_ar = regexp_replace(COALESCE(name_ar, 'برنامج'), '\s*\(مسودة\)\s*$', ''),
    assigned_at = now(),
    assigned_by = v_admin,
    updated_at = now(),
    draft_meta = COALESCE(draft_meta, '{}'::jsonb) || jsonb_build_object('published_at', now())
  WHERE id = p_draft_assignment_id;

  PERFORM public._write_audit_event(
    v_admin,
    v_draft.client_id,
    'client_program_draft_published',
    jsonb_build_object(
      'draft_id', p_draft_assignment_id,
      'status', v_status,
      'replaced_active_id', v_active
    )
  );

  RETURN public._assignment_tree(p_draft_assignment_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_discard_client_program_draft(
  p_draft_assignment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_draft public.client_program_assignments%ROWTYPE;
BEGIN
  v_admin := public._require_admin();
  SELECT * INTO v_draft FROM public.client_program_assignments WHERE id = p_draft_assignment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_draft.status <> 'draft' THEN
    RAISE EXCEPTION 'invalid_assignment_status' USING ERRCODE = '22023';
  END IF;

  UPDATE public.client_program_assignments
  SET status = 'cancelled', ended_at = now(), archived_at = now()
  WHERE id = p_draft_assignment_id;

  PERFORM public._write_audit_event(
    v_admin,
    v_draft.client_id,
    'client_program_draft_discarded',
    jsonb_build_object('draft_id', p_draft_assignment_id)
  );

  RETURN jsonb_build_object('ok', true, 'draft_id', p_draft_assignment_id);
END;
$$;

-- Save exercises: DRAFT only (published stays immutable)
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
  IF v_row.status <> 'draft' THEN
    RAISE EXCEPTION 'published_assignment_immutable' USING ERRCODE = '22023';
  END IF;
  IF p_expected_updated_at IS NOT NULL AND v_row.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RAISE EXCEPTION 'stale_update' USING ERRCODE = '22023';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'exercises', '[]'::jsonb))
  LOOP
    v_id := NULLIF(v_item->>'id', '')::UUID;
    IF v_id IS NOT NULL THEN
      -- Park sort_orders above the CHECK (sort_order >= 0) while reordering.
      UPDATE public.client_program_exercises
      SET sort_order = sort_order + 100000
      WHERE id = v_id
        AND sort_order < 100000
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
    'client_program_draft_saved',
    jsonb_build_object('assignment_id', p_assignment_id, 'reason', v_reason)
  );

  RETURN public._assignment_tree(p_assignment_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_save_client_assignment_day(
  p_assignment_id UUID,
  p_day_id UUID,
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
  v_day_type TEXT;
BEGIN
  v_admin := public._require_admin();
  SELECT * INTO v_row FROM public.client_program_assignments WHERE id = p_assignment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_row.status <> 'draft' THEN
    RAISE EXCEPTION 'published_assignment_immutable' USING ERRCODE = '22023';
  END IF;
  IF p_expected_updated_at IS NOT NULL AND v_row.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RAISE EXCEPTION 'stale_update' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.client_program_days d
    JOIN public.client_program_weeks w ON w.id = d.week_id
    WHERE d.id = p_day_id AND w.assignment_id = p_assignment_id
  ) THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;

  v_day_type := COALESCE(NULLIF(p_payload->>'day_type', ''), NULL);
  IF v_day_type IS NOT NULL AND v_day_type NOT IN ('workout', 'rest') THEN
    RAISE EXCEPTION 'invalid_day_type' USING ERRCODE = '22023';
  END IF;

  UPDATE public.client_program_days SET
    day_type = COALESCE(v_day_type::public.program_day_type, day_type),
    title_ar = COALESCE(NULLIF(p_payload->>'title_ar', ''), title_ar),
    estimated_minutes = COALESCE(NULLIF(p_payload->>'estimated_minutes', '')::INT, estimated_minutes),
    muscle_focus = COALESCE(NULLIF(p_payload->>'muscle_focus', ''), muscle_focus),
    updated_at = now()
  WHERE id = p_day_id;

  UPDATE public.client_program_assignments SET updated_at = now() WHERE id = p_assignment_id;

  PERFORM public._write_audit_event(
    v_admin,
    v_row.client_id,
    'client_program_day_updated',
    jsonb_build_object('assignment_id', p_assignment_id, 'day_id', p_day_id)
  );

  RETURN public._assignment_tree(p_assignment_id);
END;
$$;

-- ---------------------------------------------------------------------------
-- Nutrition draft / publish
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS client_nutrition_assignments_own_select ON public.client_nutrition_assignments;
CREATE POLICY client_nutrition_assignments_own_select
  ON public.client_nutrition_assignments FOR SELECT TO authenticated
  USING (client_id = auth.uid() AND status IN ('active', 'scheduled'));

DROP POLICY IF EXISTS client_nutrition_slots_own_select ON public.client_nutrition_slots;
CREATE POLICY client_nutrition_slots_own_select
  ON public.client_nutrition_slots FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_nutrition_assignments a
      WHERE a.id = assignment_id
        AND a.client_id = auth.uid()
        AND a.status IN ('active', 'scheduled')
    )
  );

CREATE OR REPLACE FUNCTION public._copy_client_nutrition_assignment_slots(
  p_source_id UUID,
  p_dest_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.client_nutrition_slots (
    assignment_id, slot_key, slot_label, time_label, hour, minute, sort_order,
    source_meal_id, source_external_id, name_ar, name_en, meal_type,
    calories, protein_g, carbs_g, fat_g, serving_size, serving_unit, servings, allergens, notes_ar,
    slot_state, slot_role, satisfied_by_slot_key, serving_policy, planned_servings, display_order, counts_toward_day_totals
  )
  SELECT
    p_dest_id, slot_key, slot_label, time_label, hour, minute, sort_order,
    source_meal_id, source_external_id, name_ar, name_en, meal_type,
    calories, protein_g, carbs_g, fat_g, serving_size, serving_unit, servings, allergens, notes_ar,
    slot_state, slot_role, satisfied_by_slot_key, serving_policy, planned_servings, display_order, counts_toward_day_totals
  FROM public.client_nutrition_slots
  WHERE assignment_id = p_source_id
  ORDER BY COALESCE(display_order, sort_order), hour, minute;
END;
$$;

REVOKE ALL ON FUNCTION public._copy_client_nutrition_assignment_slots(UUID, UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_create_client_nutrition_draft(
  p_source_assignment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_src public.client_nutrition_assignments%ROWTYPE;
  v_existing UUID;
  v_id UUID;
  v_version INT;
BEGIN
  v_admin := public._require_admin();
  SELECT * INTO v_src FROM public.client_nutrition_assignments WHERE id = p_source_assignment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_src.status NOT IN ('active', 'scheduled') THEN
    RAISE EXCEPTION 'invalid_assignment_status' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_existing
  FROM public.client_nutrition_assignments
  WHERE client_id = v_src.client_id AND status = 'draft';
  IF v_existing IS NOT NULL THEN
    RAISE EXCEPTION 'draft_exists' USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(MAX(NULLIF(draft_meta->>'assignment_edition', '')::INT), 0) + 1
  INTO v_version
  FROM public.client_nutrition_assignments
  WHERE client_id = v_src.client_id;

  INSERT INTO public.client_nutrition_assignments (
    client_id, status, name_ar, starts_on, assigned_by, watch_allergens, notes_ar, draft_meta, schema_version
  ) VALUES (
    v_src.client_id,
    'draft',
    COALESCE(v_src.name_ar, 'مسودة تغذية') || ' (مسودة)',
    v_src.starts_on,
    v_admin,
    v_src.watch_allergens,
    v_src.notes_ar,
    jsonb_build_object(
      'assignment_edition', v_version,
      'draft_of', p_source_assignment_id,
      'draft_created_at', now()
    ),
    COALESCE(v_src.schema_version, 'LEGACY_4_SLOT')
  )
  RETURNING id INTO v_id;

  PERFORM public._copy_client_nutrition_assignment_slots(p_source_assignment_id, v_id);

  PERFORM public._write_audit_event(
    v_admin,
    v_src.client_id,
    'client_nutrition_draft_created',
    jsonb_build_object('draft_id', v_id, 'source_assignment_id', p_source_assignment_id, 'edition', v_version)
  );

  RETURN public._nutrition_tree(v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_publish_client_nutrition_draft(
  p_draft_assignment_id UUID,
  p_starts_on DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_draft public.client_nutrition_assignments%ROWTYPE;
  v_active UUID;
  v_scheduled UUID;
  v_status TEXT;
BEGIN
  v_admin := public._require_admin();
  SELECT * INTO v_draft FROM public.client_nutrition_assignments WHERE id = p_draft_assignment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_draft.status <> 'draft' THEN
    RAISE EXCEPTION 'invalid_assignment_status' USING ERRCODE = '22023';
  END IF;

  v_status := CASE
    WHEN COALESCE(p_starts_on, v_draft.starts_on, CURRENT_DATE) > CURRENT_DATE THEN 'scheduled'
    ELSE 'active'
  END;

  SELECT id INTO v_active FROM public.client_nutrition_assignments
  WHERE client_id = v_draft.client_id AND status = 'active';
  SELECT id INTO v_scheduled FROM public.client_nutrition_assignments
  WHERE client_id = v_draft.client_id AND status = 'scheduled';

  IF v_status = 'active' AND v_active IS NOT NULL THEN
    UPDATE public.client_nutrition_assignments
    SET status = 'replaced', ended_at = now()
    WHERE id = v_active;
  END IF;
  IF v_status = 'scheduled' AND v_scheduled IS NOT NULL THEN
    UPDATE public.client_nutrition_assignments
    SET status = 'cancelled', ended_at = now()
    WHERE id = v_scheduled;
  END IF;

  UPDATE public.client_nutrition_assignments
  SET
    status = v_status,
    starts_on = COALESCE(p_starts_on, starts_on, CURRENT_DATE),
    name_ar = regexp_replace(COALESCE(name_ar, 'خطة تغذية'), '\s*\(مسودة\)\s*$', ''),
    assigned_at = now(),
    assigned_by = v_admin,
    updated_at = now(),
    draft_meta = COALESCE(draft_meta, '{}'::jsonb) || jsonb_build_object('published_at', now())
  WHERE id = p_draft_assignment_id;

  PERFORM public._write_audit_event(
    v_admin,
    v_draft.client_id,
    'client_nutrition_draft_published',
    jsonb_build_object('draft_id', p_draft_assignment_id, 'status', v_status, 'replaced_active_id', v_active)
  );

  RETURN public._nutrition_tree(p_draft_assignment_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_discard_client_nutrition_draft(
  p_draft_assignment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_draft public.client_nutrition_assignments%ROWTYPE;
BEGIN
  v_admin := public._require_admin();
  SELECT * INTO v_draft FROM public.client_nutrition_assignments WHERE id = p_draft_assignment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_draft.status <> 'draft' THEN
    RAISE EXCEPTION 'invalid_assignment_status' USING ERRCODE = '22023';
  END IF;

  UPDATE public.client_nutrition_assignments
  SET status = 'cancelled', ended_at = now()
  WHERE id = p_draft_assignment_id;

  PERFORM public._write_audit_event(
    v_admin,
    v_draft.client_id,
    'client_nutrition_draft_discarded',
    jsonb_build_object('draft_id', p_draft_assignment_id)
  );

  RETURN jsonb_build_object('ok', true, 'draft_id', p_draft_assignment_id);
END;
$$;

-- Gate nutrition slot saves to draft only
CREATE OR REPLACE FUNCTION public.admin_save_client_nutrition_slots(
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
  v_row public.client_nutrition_assignments%ROWTYPE;
BEGIN
  v_admin := public._require_admin();
  SELECT * INTO v_row FROM public.client_nutrition_assignments WHERE id = p_assignment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_row.status <> 'draft' THEN
    RAISE EXCEPTION 'published_assignment_immutable' USING ERRCODE = '22023';
  END IF;
  IF p_expected_updated_at IS NOT NULL AND v_row.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RAISE EXCEPTION 'stale_update' USING ERRCODE = '22023';
  END IF;

  IF p_payload ? 'watch_allergens' THEN
    UPDATE public.client_nutrition_assignments
    SET watch_allergens = COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'watch_allergens', '[]'::jsonb))), '{}'),
        name_ar = COALESCE(NULLIF(p_payload->>'name_ar', ''), name_ar),
        notes_ar = COALESCE(NULLIF(p_payload->>'notes_ar', ''), notes_ar)
    WHERE id = p_assignment_id;
  END IF;

  PERFORM public._admin_save_client_nutrition_slots_legacy(p_assignment_id, p_payload, v_admin, v_row.client_id);
  UPDATE public.client_nutrition_assignments SET updated_at = now() WHERE id = p_assignment_id;
  PERFORM public._write_audit_event(
    v_admin, v_row.client_id, 'client_nutrition_draft_saved',
    jsonb_build_object('assignment_id', p_assignment_id)
  );
  RETURN public._nutrition_tree(p_assignment_id);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_create_client_program_draft(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_publish_client_program_draft(UUID, DATE) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_discard_client_program_draft(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_save_client_assignment_day(UUID, UUID, JSONB, TIMESTAMPTZ) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_create_client_nutrition_draft(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_publish_client_nutrition_draft(UUID, DATE) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_discard_client_nutrition_draft(UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_create_client_program_draft(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_publish_client_program_draft(UUID, DATE) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_discard_client_program_draft(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_save_client_assignment_day(UUID, UUID, JSONB, TIMESTAMPTZ) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_create_client_nutrition_draft(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_publish_client_nutrition_draft(UUID, DATE) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_discard_client_nutrition_draft(UUID) TO authenticated, service_role;
