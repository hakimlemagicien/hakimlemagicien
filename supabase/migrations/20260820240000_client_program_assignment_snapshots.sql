-- MAAKFIT Command Center Phase 6 — client assignment snapshots + training review.
-- Additive. No production apply. Template edits must not mutate client snapshots.

-- ---------------------------------------------------------------------------
-- 1. Assignment lifecycle + snapshot metadata
-- ---------------------------------------------------------------------------

ALTER TABLE public.client_program_assignments
  ADD COLUMN IF NOT EXISTS starts_on DATE,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS name_ar TEXT,
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS goal TEXT,
  ADD COLUMN IF NOT EXISTS level TEXT,
  ADD COLUMN IF NOT EXISTS duration_weeks INTEGER,
  ADD COLUMN IF NOT EXISTS days_per_week INTEGER;

ALTER TABLE public.client_program_assignments
  DROP CONSTRAINT IF EXISTS client_program_assignments_status_check;
ALTER TABLE public.client_program_assignments
  ADD CONSTRAINT client_program_assignments_status_check
  CHECK (status IN ('scheduled', 'active', 'completed', 'replaced', 'cancelled', 'archived'));

ALTER TABLE public.client_program_assignments
  DROP CONSTRAINT IF EXISTS client_program_assignments_duration_check;
ALTER TABLE public.client_program_assignments
  ADD CONSTRAINT client_program_assignments_duration_check
  CHECK (duration_weeks IS NULL OR duration_weeks > 0);

CREATE UNIQUE INDEX IF NOT EXISTS client_program_assignments_one_scheduled
  ON public.client_program_assignments (client_id)
  WHERE status = 'scheduled';

-- ---------------------------------------------------------------------------
-- 2. Frozen client program tree (independent of program_template_* rows)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.client_program_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.client_program_assignments(id) ON DELETE CASCADE,
  week_number INT NOT NULL CHECK (week_number > 0),
  title_ar TEXT,
  notes_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, week_number)
);

CREATE TABLE IF NOT EXISTS public.client_program_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES public.client_program_weeks(id) ON DELETE CASCADE,
  day_number INT NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  day_type public.program_day_type NOT NULL DEFAULT 'workout',
  title_ar TEXT NOT NULL,
  muscle_focus TEXT,
  estimated_minutes INT,
  estimated_calories INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (week_id, day_number)
);

CREATE TABLE IF NOT EXISTS public.client_program_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.client_program_days(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  exercise_external_id TEXT NOT NULL,
  exercise_name_ar TEXT NOT NULL,
  exercise_name_en TEXT,
  sort_order INT NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  sets INT NOT NULL DEFAULT 3 CHECK (sets > 0),
  reps_min INT,
  reps_max INT,
  reps_label TEXT,
  rest_seconds INT NOT NULL DEFAULT 60 CHECK (rest_seconds >= 0),
  suggested_weight_kg NUMERIC(6, 2),
  notes_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (day_id, sort_order)
);

DROP TRIGGER IF EXISTS trg_client_program_weeks_updated_at ON public.client_program_weeks;
CREATE TRIGGER trg_client_program_weeks_updated_at
  BEFORE UPDATE ON public.client_program_weeks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_client_program_days_updated_at ON public.client_program_days;
CREATE TRIGGER trg_client_program_days_updated_at
  BEFORE UPDATE ON public.client_program_days
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_client_program_exercises_updated_at ON public.client_program_exercises;
CREATE TRIGGER trg_client_program_exercises_updated_at
  BEFORE UPDATE ON public.client_program_exercises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.client_program_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_program_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_program_exercises ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.client_program_weeks FROM anon, authenticated;
REVOKE ALL ON public.client_program_days FROM anon, authenticated;
REVOKE ALL ON public.client_program_exercises FROM anon, authenticated;
GRANT SELECT ON public.client_program_weeks TO authenticated;
GRANT SELECT ON public.client_program_days TO authenticated;
GRANT SELECT ON public.client_program_exercises TO authenticated;
GRANT ALL ON public.client_program_weeks TO service_role;
GRANT ALL ON public.client_program_days TO service_role;
GRANT ALL ON public.client_program_exercises TO service_role;

DROP POLICY IF EXISTS client_program_weeks_own_select ON public.client_program_weeks;
DROP POLICY IF EXISTS client_program_weeks_admin_select ON public.client_program_weeks;
CREATE POLICY client_program_weeks_own_select
  ON public.client_program_weeks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_program_assignments a
      WHERE a.id = assignment_id AND a.client_id = auth.uid()
    )
  );
CREATE POLICY client_program_weeks_admin_select
  ON public.client_program_weeks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS client_program_days_own_select ON public.client_program_days;
DROP POLICY IF EXISTS client_program_days_admin_select ON public.client_program_days;
CREATE POLICY client_program_days_own_select
  ON public.client_program_days FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.client_program_weeks w
      JOIN public.client_program_assignments a ON a.id = w.assignment_id
      WHERE w.id = week_id AND a.client_id = auth.uid()
    )
  );
CREATE POLICY client_program_days_admin_select
  ON public.client_program_days FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS client_program_exercises_own_select ON public.client_program_exercises;
DROP POLICY IF EXISTS client_program_exercises_admin_select ON public.client_program_exercises;
CREATE POLICY client_program_exercises_own_select
  ON public.client_program_exercises FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.client_program_days d
      JOIN public.client_program_weeks w ON w.id = d.week_id
      JOIN public.client_program_assignments a ON a.id = w.assignment_id
      WHERE d.id = day_id AND a.client_id = auth.uid()
    )
  );
CREATE POLICY client_program_exercises_admin_select
  ON public.client_program_exercises FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 3. Workout log assignment context (nullable for legacy rows)
-- ---------------------------------------------------------------------------

ALTER TABLE public.workout_set_logs
  ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES public.client_program_assignments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assignment_exercise_id UUID REFERENCES public.client_program_exercises(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS workout_set_logs_assignment_idx
  ON public.workout_set_logs (assignment_id, session_date DESC)
  WHERE assignment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS workout_set_logs_user_exercise_idx
  ON public.workout_set_logs (user_id, exercise_id, session_date DESC);
CREATE INDEX IF NOT EXISTS client_program_weeks_assignment_idx
  ON public.client_program_weeks (assignment_id, week_number);
CREATE INDEX IF NOT EXISTS client_program_days_week_idx
  ON public.client_program_days (week_id, day_number);
CREATE INDEX IF NOT EXISTS client_program_exercises_day_idx
  ON public.client_program_exercises (day_id, sort_order);

DROP POLICY IF EXISTS wsl_own_insert ON public.workout_set_logs;
CREATE POLICY wsl_own_insert ON public.workout_set_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      assignment_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.client_program_assignments a
        WHERE a.id = assignment_id AND a.client_id = auth.uid()
      )
    )
    AND (
      assignment_exercise_id IS NULL
      OR (
        assignment_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.client_program_exercises x
          JOIN public.client_program_days d ON d.id = x.day_id
          JOIN public.client_program_weeks w ON w.id = d.week_id
          WHERE x.id = assignment_exercise_id AND w.assignment_id = assignment_id
        )
      )
    )
  );

DROP POLICY IF EXISTS wsl_own_update ON public.workout_set_logs;
CREATE POLICY wsl_own_update ON public.workout_set_logs
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      assignment_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.client_program_assignments a
        WHERE a.id = assignment_id AND a.client_id = auth.uid()
      )
    )
    AND (
      assignment_exercise_id IS NULL
      OR (
        assignment_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.client_program_exercises x
          JOIN public.client_program_days d ON d.id = x.day_id
          JOIN public.client_program_weeks w ON w.id = d.week_id
          WHERE x.id = assignment_exercise_id AND w.assignment_id = assignment_id
        )
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Snapshot copy helper
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
          sort_order, sets, reps_min, reps_max, reps_label, rest_seconds, suggested_weight_kg, notes_ar
        ) VALUES (
          v_day_id, v_ex.exercise_id, v_ex.external_id, v_ex.name_ar, v_ex.name_en,
          v_ex.sort_order, v_ex.sets, v_ex.reps_min, v_ex.reps_max, v_ex.reps_label,
          v_ex.rest_seconds, v_ex.suggested_weight_kg, v_ex.notes_ar
        );
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public._copy_template_to_assignment(UUID, UUID) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public._assignment_tree(p_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row JSONB;
BEGIN
  SELECT to_jsonb(a) || jsonb_build_object(
    'snapshot_complete', EXISTS (
      SELECT 1 FROM public.client_program_weeks w WHERE w.assignment_id = a.id
    ),
    'exercise_count', (
      SELECT count(*) FROM public.client_program_exercises x
      JOIN public.client_program_days d ON d.id = x.day_id
      JOIN public.client_program_weeks w ON w.id = d.week_id
      WHERE w.assignment_id = a.id
    ),
    'weeks', COALESCE((
      SELECT jsonb_agg(
        to_jsonb(w) || jsonb_build_object(
          'days', COALESCE((
            SELECT jsonb_agg(
              to_jsonb(d) || jsonb_build_object(
                'exercises', COALESCE((
                  SELECT jsonb_agg(to_jsonb(x) ORDER BY x.sort_order)
                  FROM public.client_program_exercises x
                  WHERE x.day_id = d.id
                ), '[]'::jsonb)
              ) ORDER BY d.day_number
            )
            FROM public.client_program_days d
            WHERE d.week_id = w.id
          ), '[]'::jsonb)
        ) ORDER BY w.week_number
      )
      FROM public.client_program_weeks w
      WHERE w.assignment_id = a.id
    ), '[]'::jsonb)
  )
  INTO v_row
  FROM public.client_program_assignments a
  WHERE a.id = p_id;
  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public._assignment_tree(UUID) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Admin assignment RPCs
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

  INSERT INTO public.client_program_assignments (
    client_id, source_template_id, template_version, status, assigned_by, starts_on,
    name_ar, name_en, goal, level, duration_weeks, days_per_week
  ) VALUES (
    p_client_id, p_template_id, v_template.version, v_status, v_admin, COALESCE(p_starts_on, CURRENT_DATE),
    v_template.name_ar, v_template.name_en, v_template.goal::TEXT, v_template.level::TEXT,
    v_template.duration_weeks, v_template.days_per_week
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
      'status', v_status
    )
  );

  RETURN public._assignment_tree(v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_client_assignment(p_assignment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row JSONB;
BEGIN
  PERFORM public._require_admin();
  v_row := public._assignment_tree(p_assignment_id);
  IF v_row IS NULL THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_client_assignments(
  p_client_id UUID,
  p_limit INTEGER DEFAULT 25,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  source_template_id UUID,
  template_version INT,
  status TEXT,
  name_ar TEXT,
  starts_on DATE,
  assigned_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  snapshot_complete BOOLEAN,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 25), 1), 50);
  v_offset INTEGER := GREATEST(COALESCE(p_offset, 0), 0);
BEGIN
  PERFORM public._require_admin();
  RETURN QUERY
  SELECT
    a.id,
    a.source_template_id,
    a.template_version,
    a.status,
    a.name_ar,
    a.starts_on,
    a.assigned_at,
    a.ended_at,
    EXISTS (SELECT 1 FROM public.client_program_weeks w WHERE w.assignment_id = a.id),
    count(*) OVER ()::BIGINT
  FROM public.client_program_assignments a
  WHERE a.client_id = p_client_id
  ORDER BY a.assigned_at DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_end_client_program(
  p_assignment_id UUID,
  p_status TEXT DEFAULT 'completed'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_row public.client_program_assignments%ROWTYPE;
BEGIN
  v_admin := public._require_admin();
  IF p_status NOT IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'invalid_assignment_status' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_row FROM public.client_program_assignments WHERE id = p_assignment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_row.status NOT IN ('active', 'scheduled') THEN
    RAISE EXCEPTION 'invalid_assignment_status' USING ERRCODE = '22023';
  END IF;

  UPDATE public.client_program_assignments
  SET status = p_status, ended_at = now(), archived_at = now()
  WHERE id = p_assignment_id;

  PERFORM public._write_audit_event(
    v_admin,
    v_row.client_id,
    'client_program_ended',
    jsonb_build_object('assignment_id', p_assignment_id, 'status', p_status)
  );

  RETURN public._assignment_tree(p_assignment_id);
END;
$$;

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
  v_ex public.exercises%ROWTYPE;
  v_old UUID;
BEGIN
  v_admin := public._require_admin();
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
      RAISE EXCEPTION 'exercise_required' USING ERRCODE = '22023';
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
          'new_exercise_id', v_ex.id
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

  UPDATE public.client_program_assignments SET updated_at = now() WHERE id = p_assignment_id;

  PERFORM public._write_audit_event(
    v_admin,
    v_row.client_id,
    'client_program_prescription_updated',
    jsonb_build_object('assignment_id', p_assignment_id)
  );

  RETURN public._assignment_tree(p_assignment_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_client_set_logs(
  p_client_id UUID,
  p_exercise_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 25,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  exercise_id UUID,
  exercise_external_id TEXT,
  session_date DATE,
  set_number INT,
  weight_kg NUMERIC,
  reps INT,
  effort public.workout_effort_level,
  skipped BOOLEAN,
  assignment_id UUID,
  created_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 25), 1), 50);
  v_offset INTEGER := GREATEST(COALESCE(p_offset, 0), 0);
BEGIN
  PERFORM public._require_admin();
  RETURN QUERY
  SELECT
    l.id,
    l.exercise_id,
    l.exercise_external_id,
    l.session_date,
    l.set_number,
    l.weight_kg,
    l.reps,
    l.effort,
    l.skipped,
    l.assignment_id,
    l.created_at,
    count(*) OVER ()::BIGINT
  FROM public.workout_set_logs l
  WHERE l.user_id = p_client_id
    AND (p_exercise_id IS NULL OR l.exercise_id = p_exercise_id)
  ORDER BY l.session_date DESC, l.created_at DESC, l.set_number
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. Client runtime read
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
              'notes_ar', x.notes_ar
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

-- ---------------------------------------------------------------------------
-- 7. Overview assignment summary (keep Phase 4 fields)
-- ---------------------------------------------------------------------------

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
    'id', a.id,
    'source_template_id', a.source_template_id,
    'template_version', a.template_version,
    'status', a.status,
    'assigned_at', a.assigned_at,
    'starts_on', a.starts_on,
    'name_ar', a.name_ar,
    'duration_weeks', a.duration_weeks,
    'snapshot_complete', EXISTS (SELECT 1 FROM public.client_program_weeks w WHERE w.assignment_id = a.id)
  )
  INTO v_assignment
  FROM public.client_program_assignments a
  WHERE a.client_id = p_client_id AND a.status IN ('active', 'scheduled')
  ORDER BY CASE a.status WHEN 'active' THEN 0 ELSE 1 END
  LIMIT 1;

  SELECT MAX(wsl.created_at) INTO v_last_workout
  FROM public.workout_set_logs wsl
  WHERE wsl.user_id = p_client_id;

  SELECT COUNT(*)::int INTO v_notes_count
  FROM public.coach_client_notes n
  WHERE n.client_id = p_client_id AND n.archived_at IS NULL;

  SELECT COUNT(*)::int INTO v_open_support
  FROM public.support_tickets t
  WHERE t.user_id = p_client_id AND t.status IN ('received', 'in_review');

  RETURN jsonb_build_object(
    'id', v_profile.id, 'full_name', v_profile.full_name, 'email', v_profile.email,
    'phone', v_profile.phone, 'avatar_path', v_profile.avatar_path, 'goal', v_profile.goal,
    'city', v_profile.city, 'training_type', v_profile.training_type,
    'program_start_date', v_profile.program_start_date,
    'onboarding_completed_at', v_profile.onboarding_completed_at, 'created_at', v_profile.created_at,
    'membership', v_membership, 'coaching', v_coaching, 'assignment', v_assignment,
    'last_workout_at', v_last_workout, 'notes_count', v_notes_count, 'open_support_count', v_open_support
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. Grants
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.admin_assign_client_program(UUID, UUID, DATE, BOOLEAN) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_client_assignment(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_client_assignments(UUID, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_end_client_program(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_save_client_assignment_exercises(UUID, JSONB, TIMESTAMPTZ) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_client_set_logs(UUID, UUID, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.client_get_my_training_runtime() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_assign_client_program(UUID, UUID, DATE, BOOLEAN) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_client_assignment(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_client_assignments(UUID, INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_end_client_program(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_save_client_assignment_exercises(UUID, JSONB, TIMESTAMPTZ) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_client_set_logs(UUID, UUID, INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.client_get_my_training_runtime() TO authenticated, service_role;
