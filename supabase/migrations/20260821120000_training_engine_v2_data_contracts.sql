-- Training Engine V2 Phase 2 — data contracts only.
-- Additive. Non-destructive. No adaptive engine logic.
-- Does not replace exercises, program_templates, client_program_*, workout_set_logs, or readiness.

-- ---------------------------------------------------------------------------
-- 1. Workout sessions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.client_program_assignments(id) ON DELETE SET NULL,
  assignment_day_id UUID REFERENCES public.client_program_days(id) ON DELETE SET NULL,
  program_template_id UUID REFERENCES public.program_templates(id) ON DELETE SET NULL,
  session_key TEXT NOT NULL,
  session_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'READY'
    CHECK (status IN (
      'READY',
      'IN_PROGRESS',
      'PARTIALLY_COMPLETED',
      'COMPLETED',
      'INTERRUPTED',
      'CANCELLED'
    )),
  prescribed_exercise_count INT CHECK (prescribed_exercise_count IS NULL OR prescribed_exercise_count >= 0),
  completed_exercise_count INT CHECK (completed_exercise_count IS NULL OR completed_exercise_count >= 0),
  prescribed_working_sets INT CHECK (prescribed_working_sets IS NULL OR prescribed_working_sets >= 0),
  completed_working_sets INT CHECK (completed_working_sets IS NULL OR completed_working_sets >= 0),
  counters_authority TEXT NOT NULL DEFAULT 'derived_from_set_logs'
    CHECK (counters_authority IN ('derived_from_set_logs', 'cached')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, session_key)
);

COMMENT ON TABLE public.workout_sessions IS
  'V2 canonical workout attempt. Counters are cached/non-authoritative; set logs are the volume source of truth.';
COMMENT ON COLUMN public.workout_sessions.counters_authority IS
  'derived_from_set_logs = compute volume from logs; cached values are hints only.';

CREATE INDEX IF NOT EXISTS workout_sessions_user_started_idx
  ON public.workout_sessions (user_id, started_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS workout_sessions_user_active_idx
  ON public.workout_sessions (user_id, last_activity_at DESC)
  WHERE status IN ('READY', 'IN_PROGRESS', 'PARTIALLY_COMPLETED', 'INTERRUPTED');

CREATE TRIGGER trg_workout_sessions_updated_at
  BEFORE UPDATE ON public.workout_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.workout_sessions FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.workout_sessions TO authenticated;
GRANT ALL ON public.workout_sessions TO service_role;

CREATE POLICY workout_sessions_own_select ON public.workout_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY workout_sessions_own_insert ON public.workout_sessions
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
  );

CREATE POLICY workout_sessions_own_update ON public.workout_sessions
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
  );

CREATE POLICY workout_sessions_admin_select ON public.workout_sessions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 2. Extend workout_set_logs (keep legacy columns and unique key)
-- ---------------------------------------------------------------------------

ALTER TABLE public.workout_set_logs
  ADD COLUMN IF NOT EXISTS workout_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS set_type TEXT,
  ADD COLUMN IF NOT EXISTS prescribed_load NUMERIC(6, 2),
  ADD COLUMN IF NOT EXISTS actual_load NUMERIC(6, 2),
  ADD COLUMN IF NOT EXISTS prescribed_reps_min INT,
  ADD COLUMN IF NOT EXISTS prescribed_reps_max INT,
  ADD COLUMN IF NOT EXISTS actual_reps INT,
  ADD COLUMN IF NOT EXISTS prescribed_duration_seconds INT,
  ADD COLUMN IF NOT EXISTS actual_duration_seconds INT,
  ADD COLUMN IF NOT EXISTS prescribed_rest_seconds INT,
  ADD COLUMN IF NOT EXISTS actual_rest_seconds INT,
  ADD COLUMN IF NOT EXISTS effort_v2 TEXT,
  ADD COLUMN IF NOT EXISTS set_completed BOOLEAN,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rest_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rest_completed_at TIMESTAMPTZ;

ALTER TABLE public.workout_set_logs
  DROP CONSTRAINT IF EXISTS workout_set_logs_set_type_check;
ALTER TABLE public.workout_set_logs
  ADD CONSTRAINT workout_set_logs_set_type_check
  CHECK (set_type IS NULL OR set_type IN ('WARMUP', 'WORKING', 'RAMP', 'BACKOFF', 'TOP'));

ALTER TABLE public.workout_set_logs
  DROP CONSTRAINT IF EXISTS workout_set_logs_effort_v2_check;
ALTER TABLE public.workout_set_logs
  ADD CONSTRAINT workout_set_logs_effort_v2_check
  CHECK (effort_v2 IS NULL OR effort_v2 IN ('EASY', 'IDEAL', 'VERY_HARD', 'FAILURE'));

ALTER TABLE public.workout_set_logs
  DROP CONSTRAINT IF EXISTS workout_set_logs_skip_completed_check;
ALTER TABLE public.workout_set_logs
  ADD CONSTRAINT workout_set_logs_skip_completed_check
  CHECK (NOT (skipped IS TRUE AND set_completed IS TRUE));

CREATE INDEX IF NOT EXISTS workout_set_logs_session_idx
  ON public.workout_set_logs (workout_session_id)
  WHERE workout_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS workout_set_logs_session_set_uidx
  ON public.workout_set_logs (workout_session_id, exercise_external_id, set_number)
  WHERE workout_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS workout_set_logs_user_external_created_idx
  ON public.workout_set_logs (user_id, exercise_external_id, created_at DESC);

-- Historical rows: current player only logged prescription working sets.
-- Unknown remaining V2 fields stay NULL (no fabricated rest/timestamps/FAILURE).
UPDATE public.workout_set_logs
SET
  set_type = COALESCE(set_type, 'WORKING'),
  effort_v2 = CASE
    WHEN effort_v2 IS NOT NULL THEN effort_v2
    WHEN effort = 'easy' THEN 'EASY'
    WHEN effort = 'medium' THEN 'IDEAL'
    WHEN effort = 'hard' THEN 'VERY_HARD'
    ELSE NULL
  END,
  actual_load = COALESCE(actual_load, weight_kg),
  actual_reps = COALESCE(actual_reps, reps)
WHERE set_type IS NULL
   OR effort_v2 IS NULL
   OR (actual_load IS NULL AND weight_kg IS NOT NULL)
   OR (actual_reps IS NULL AND reps IS NOT NULL);

-- set_completed left NULL for history: skipped=false does not prove a completed working set.

CREATE OR REPLACE FUNCTION public.map_legacy_effort_to_v2(p_effort public.workout_effort_level)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_effort
    WHEN 'easy' THEN 'EASY'
    WHEN 'medium' THEN 'IDEAL'
    WHEN 'hard' THEN 'VERY_HARD'
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.workout_set_logs_v2_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.workout_session_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.workout_sessions s
      WHERE s.id = NEW.workout_session_id AND s.user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'workout_session_user_mismatch' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF NEW.effort_v2 IS NULL AND NEW.effort IS NOT NULL THEN
    NEW.effort_v2 := public.map_legacy_effort_to_v2(NEW.effort);
  END IF;

  IF NEW.actual_load IS NULL AND NEW.weight_kg IS NOT NULL THEN
    NEW.actual_load := NEW.weight_kg;
  END IF;

  IF NEW.actual_reps IS NULL AND NEW.reps IS NOT NULL THEN
    NEW.actual_reps := NEW.reps;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.set_type IS NULL THEN
    NEW.set_type := 'WORKING';
  END IF;

  IF TG_OP = 'INSERT' AND NEW.set_completed IS NULL THEN
    NEW.set_completed := NOT COALESCE(NEW.skipped, false);
  END IF;

  IF NEW.skipped IS TRUE THEN
    NEW.set_completed := false;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_workout_set_logs_v2_defaults ON public.workout_set_logs;
CREATE TRIGGER trg_workout_set_logs_v2_defaults
  BEFORE INSERT OR UPDATE ON public.workout_set_logs
  FOR EACH ROW EXECUTE FUNCTION public.workout_set_logs_v2_defaults();

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
    AND (
      workout_session_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.workout_sessions s
        WHERE s.id = workout_session_id AND s.user_id = auth.uid()
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
    AND (
      workout_session_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.workout_sessions s
        WHERE s.id = workout_session_id AND s.user_id = auth.uid()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Optional readiness → session link (nullable, no behavior change)
-- ---------------------------------------------------------------------------

ALTER TABLE public.daily_readiness_checks
  ADD COLUMN IF NOT EXISTS workout_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 4. Client training level + prescription state (engine-owned writes)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.client_training_levels (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  training_level TEXT NOT NULL DEFAULT 'UNASSESSED'
    CHECK (training_level IN ('UNASSESSED', 'BEGINNER', 'INTERMEDIATE')),
  level_confidence TEXT
    CHECK (level_confidence IS NULL OR level_confidence IN ('LOW', 'MODERATE', 'HIGH')),
  prescription_state TEXT
    CHECK (
      prescription_state IS NULL
      OR prescription_state IN (
        'CALIBRATING',
        'NORMAL',
        'RECONDITIONING',
        'RECOVERY_LIMITED',
        'SAFETY_REVIEW'
      )
    ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.client_training_levels.prescription_state IS
  'Nullable until assessed. RECONDITIONING must not reset training_level or history.';

CREATE TRIGGER trg_client_training_levels_updated_at
  BEFORE UPDATE ON public.client_training_levels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.client_training_levels ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.client_training_levels FROM anon, authenticated;
GRANT SELECT ON public.client_training_levels TO authenticated;
GRANT ALL ON public.client_training_levels TO service_role;

CREATE POLICY client_training_levels_own_select ON public.client_training_levels
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY client_training_levels_admin_select ON public.client_training_levels
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 5. Exercise experience (engine-owned writes)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.client_exercise_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  exercise_external_id TEXT NOT NULL,
  experience_state TEXT NOT NULL DEFAULT 'NEW'
    CHECK (experience_state IN ('NEW', 'CALIBRATING', 'FAMILIAR', 'ESTABLISHED')),
  first_exposure_at TIMESTAMPTZ,
  last_exposure_at TIMESTAMPTZ,
  successful_exposure_count INT NOT NULL DEFAULT 0 CHECK (successful_exposure_count >= 0),
  baseline_established_at TIMESTAMPTZ,
  last_calibrated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, exercise_external_id)
);

CREATE INDEX IF NOT EXISTS client_exercise_experience_user_idx
  ON public.client_exercise_experience (user_id, exercise_external_id);

CREATE TRIGGER trg_client_exercise_experience_updated_at
  BEFORE UPDATE ON public.client_exercise_experience
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.client_exercise_experience ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.client_exercise_experience FROM anon, authenticated;
GRANT SELECT ON public.client_exercise_experience TO authenticated;
GRANT ALL ON public.client_exercise_experience TO service_role;

CREATE POLICY client_exercise_experience_own_select ON public.client_exercise_experience
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY client_exercise_experience_admin_select ON public.client_exercise_experience
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 6. Canonical goal mapping (read-only to clients)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.training_goal_profiles (
  canonical_id TEXT PRIMARY KEY,
  label_ar TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'legacy')),
  body_composition_dependency BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_goal_legacy_map (
  legacy_id TEXT PRIMARY KEY,
  canonical_id TEXT REFERENCES public.training_goal_profiles(canonical_id),
  mapping_status TEXT NOT NULL CHECK (mapping_status IN ('MAPPED', 'LEGACY_UNMAPPED')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.training_goal_profiles (canonical_id, label_ar, body_composition_dependency)
VALUES
  ('GLUTE_GROWTH', 'أريد تكبير المؤخرة', false),
  ('SLIM_TONED_WAIST', 'أريد خصرًا أنحف ومشدودًا', true),
  ('TONED_ARMS_UPPER_BODY', 'أريد شد الذراعين والجزء العلوي', false),
  ('FEMININE_BALANCED_BODY', 'أريد جسمًا متناسقًا وأنثويًا', false),
  ('FAT_LOSS', 'أريد خسارة الدهون', true),
  ('POSTURE_TONED_BACK', 'أريد تحسين القوام وشد الظهر', false)
ON CONFLICT (canonical_id) DO NOTHING;

INSERT INTO public.training_goal_legacy_map (legacy_id, canonical_id, mapping_status, notes)
VALUES
  ('fat', 'FAT_LOSS', 'MAPPED', 'quiz fat'),
  ('glutes', 'GLUTE_GROWTH', 'MAPPED', 'quiz glutes'),
  ('waist', 'SLIM_TONED_WAIST', 'MAPPED', 'quiz waist'),
  ('body', 'FEMININE_BALANCED_BODY', 'MAPPED', 'quiz body'),
  ('tone', NULL, 'LEGACY_UNMAPPED', 'chest-shape; not TONED_ARMS_UPPER_BODY'),
  ('fit', NULL, 'LEGACY_UNMAPPED', 'healthy/athletic female; not auto-mapped'),
  ('muscle', NULL, 'LEGACY_UNMAPPED', 'male muscle-building; no V2 six-goal equivalent yet'),
  ('fitness', NULL, 'LEGACY_UNMAPPED', 'male fitness; no V2 six-goal equivalent yet'),
  ('athletic', NULL, 'LEGACY_UNMAPPED', 'male athletic; no V2 six-goal equivalent yet'),
  ('shape', NULL, 'LEGACY_UNMAPPED', 'male body-shape; no V2 six-goal equivalent yet'),
  ('gain', NULL, 'LEGACY_UNMAPPED', 'male healthy weight gain; no V2 six-goal equivalent yet')
ON CONFLICT (legacy_id) DO NOTHING;

ALTER TABLE public.training_goal_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_goal_legacy_map ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.training_goal_profiles FROM anon, authenticated;
REVOKE ALL ON public.training_goal_legacy_map FROM anon, authenticated;
GRANT SELECT ON public.training_goal_profiles TO authenticated;
GRANT SELECT ON public.training_goal_legacy_map TO authenticated;
GRANT ALL ON public.training_goal_profiles TO service_role;
GRANT ALL ON public.training_goal_legacy_map TO service_role;

CREATE POLICY training_goal_profiles_read ON public.training_goal_profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY training_goal_legacy_map_read ON public.training_goal_legacy_map
  FOR SELECT TO authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- 7. Goal history
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.client_goal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  previous_legacy_goal_id TEXT,
  previous_canonical_goal_id TEXT,
  legacy_goal_id TEXT,
  canonical_goal_id TEXT,
  source TEXT NOT NULL DEFAULT 'onboarding'
    CHECK (source IN ('onboarding', 'profile', 'admin', 'system')),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_goal_history_user_idx
  ON public.client_goal_history (user_id, changed_at DESC);

ALTER TABLE public.client_goal_history ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.client_goal_history FROM anon, authenticated;
GRANT SELECT, INSERT ON public.client_goal_history TO authenticated;
GRANT ALL ON public.client_goal_history TO service_role;

CREATE POLICY client_goal_history_own_select ON public.client_goal_history
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY client_goal_history_own_insert ON public.client_goal_history
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY client_goal_history_admin_select ON public.client_goal_history
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------------------
-- 8. Safety signal (not a diagnosis) + decision audit foundation
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.client_training_safety_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
  exercise_external_id TEXT,
  set_log_id UUID REFERENCES public.workout_set_logs(id) ON DELETE SET NULL,
  safety_signal TEXT NOT NULL
    CHECK (safety_signal IN ('pain', 'discomfort', 'unsafe_execution')),
  safety_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_training_safety_signals_user_idx
  ON public.client_training_safety_signals (user_id, created_at DESC);

ALTER TABLE public.client_training_safety_signals ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.client_training_safety_signals FROM anon, authenticated;
GRANT SELECT, INSERT ON public.client_training_safety_signals TO authenticated;
GRANT ALL ON public.client_training_safety_signals TO service_role;

CREATE POLICY client_training_safety_signals_own_select ON public.client_training_safety_signals
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY client_training_safety_signals_own_insert ON public.client_training_safety_signals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY client_training_safety_signals_admin_select ON public.client_training_safety_signals
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.adaptive_decision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
  exercise_external_id TEXT,
  decision_type TEXT NOT NULL,
  reason_code TEXT,
  confidence TEXT CHECK (confidence IS NULL OR confidence IN ('LOW', 'MODERATE', 'HIGH')),
  input_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS adaptive_decision_logs_user_idx
  ON public.adaptive_decision_logs (user_id, created_at DESC);

ALTER TABLE public.adaptive_decision_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.adaptive_decision_logs FROM anon, authenticated;
GRANT SELECT ON public.adaptive_decision_logs TO authenticated;
GRANT ALL ON public.adaptive_decision_logs TO service_role;

CREATE POLICY adaptive_decision_logs_own_select ON public.adaptive_decision_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY adaptive_decision_logs_admin_select ON public.adaptive_decision_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

COMMENT ON TABLE public.adaptive_decision_logs IS
  'Phase 2 persistence only. Engine decisions are not computed in the database.';

-- ---------------------------------------------------------------------------
-- 9. Client RPCs — contracts, not engines
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.client_ensure_training_level()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_row public.client_training_levels;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.client_training_levels (user_id, training_level)
  VALUES (v_user, 'UNASSESSED')
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_row FROM public.client_training_levels WHERE user_id = v_user;

  RETURN jsonb_build_object(
    'user_id', v_row.user_id,
    'training_level', v_row.training_level,
    'level_confidence', v_row.level_confidence,
    'prescription_state', v_row.prescription_state
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.client_ensure_exercise_experience(p_external_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_row public.client_exercise_experience;
  v_exercise UUID;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_external_id IS NULL OR btrim(p_external_id) = '' THEN
    RAISE EXCEPTION 'external_id_required' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_exercise FROM public.exercises WHERE external_id = p_external_id LIMIT 1;

  INSERT INTO public.client_exercise_experience (user_id, exercise_id, exercise_external_id, experience_state)
  VALUES (v_user, v_exercise, p_external_id, 'NEW')
  ON CONFLICT (user_id, exercise_external_id) DO NOTHING;

  SELECT * INTO v_row
  FROM public.client_exercise_experience
  WHERE user_id = v_user AND exercise_external_id = p_external_id;

  RETURN jsonb_build_object(
    'exercise_external_id', v_row.exercise_external_id,
    'experience_state', v_row.experience_state,
    'successful_exposure_count', v_row.successful_exposure_count
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.client_ensure_workout_session(
  p_session_key TEXT,
  p_session_date DATE DEFAULT CURRENT_DATE,
  p_assignment_id UUID DEFAULT NULL,
  p_assignment_day_id UUID DEFAULT NULL,
  p_prescribed_exercise_count INT DEFAULT NULL,
  p_prescribed_working_sets INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_row public.workout_sessions;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_session_key IS NULL OR btrim(p_session_key) = '' THEN
    RAISE EXCEPTION 'session_key_required' USING ERRCODE = '22023';
  END IF;

  IF p_assignment_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.client_program_assignments a
    WHERE a.id = p_assignment_id AND a.client_id = v_user
  ) THEN
    RAISE EXCEPTION 'assignment_forbidden' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.workout_sessions (
    user_id, session_key, session_date, assignment_id, assignment_day_id,
    prescribed_exercise_count, prescribed_working_sets, status, started_at, last_activity_at
  )
  VALUES (
    v_user, p_session_key, p_session_date, p_assignment_id, p_assignment_day_id,
    p_prescribed_exercise_count, p_prescribed_working_sets, 'READY', now(), now()
  )
  ON CONFLICT (user_id, session_key) DO UPDATE
    SET last_activity_at = now(),
        assignment_id = COALESCE(EXCLUDED.assignment_id, public.workout_sessions.assignment_id),
        assignment_day_id = COALESCE(EXCLUDED.assignment_day_id, public.workout_sessions.assignment_day_id),
        prescribed_exercise_count = COALESCE(EXCLUDED.prescribed_exercise_count, public.workout_sessions.prescribed_exercise_count),
        prescribed_working_sets = COALESCE(EXCLUDED.prescribed_working_sets, public.workout_sessions.prescribed_working_sets),
        status = CASE
          WHEN public.workout_sessions.status IN ('COMPLETED', 'CANCELLED') THEN public.workout_sessions.status
          WHEN public.workout_sessions.status = 'READY' THEN 'IN_PROGRESS'
          ELSE public.workout_sessions.status
        END,
        started_at = COALESCE(public.workout_sessions.started_at, now())
  RETURNING * INTO v_row;

  IF v_row.status = 'READY' THEN
    UPDATE public.workout_sessions
    SET status = 'IN_PROGRESS', started_at = COALESCE(started_at, now()), last_activity_at = now()
    WHERE id = v_row.id
    RETURNING * INTO v_row;
  END IF;

  PERFORM public.client_ensure_training_level();

  RETURN jsonb_build_object(
    'id', v_row.id,
    'session_key', v_row.session_key,
    'session_date', v_row.session_date,
    'status', v_row.status,
    'started_at', v_row.started_at,
    'last_activity_at', v_row.last_activity_at,
    'assignment_id', v_row.assignment_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.client_get_active_workout_session()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_row public.workout_sessions;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_row
  FROM public.workout_sessions
  WHERE user_id = v_user
    AND status IN ('READY', 'IN_PROGRESS', 'PARTIALLY_COMPLETED', 'INTERRUPTED')
  ORDER BY last_activity_at DESC
  LIMIT 1;

  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('session', NULL);
  END IF;

  RETURN jsonb_build_object(
    'session', jsonb_build_object(
      'id', v_row.id,
      'session_key', v_row.session_key,
      'session_date', v_row.session_date,
      'status', v_row.status,
      'started_at', v_row.started_at,
      'last_activity_at', v_row.last_activity_at,
      'assignment_id', v_row.assignment_id,
      'assignment_day_id', v_row.assignment_day_id
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.client_update_workout_session_status(
  p_session_id UUID,
  p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_row public.workout_sessions;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_status NOT IN (
    'READY', 'IN_PROGRESS', 'PARTIALLY_COMPLETED', 'COMPLETED', 'INTERRUPTED', 'CANCELLED'
  ) THEN
    RAISE EXCEPTION 'invalid_session_status' USING ERRCODE = '22023';
  END IF;

  UPDATE public.workout_sessions
  SET
    status = p_status,
    last_activity_at = now(),
    completed_at = CASE WHEN p_status = 'COMPLETED' THEN COALESCE(completed_at, now()) ELSE completed_at END
  WHERE id = p_session_id AND user_id = v_user
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'session_not_found' USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object('id', v_row.id, 'status', v_row.status, 'completed_at', v_row.completed_at);
END;
$$;

CREATE OR REPLACE FUNCTION public.client_list_exercise_set_history(
  p_external_id TEXT,
  p_limit INT DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_limit INT := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50);
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_external_id IS NULL OR btrim(p_external_id) = '' THEN
    RAISE EXCEPTION 'external_id_required' USING ERRCODE = '22023';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(x))
    FROM (
      SELECT
        l.id,
        l.workout_session_id,
        l.session_date,
        l.set_number,
        l.set_type,
        l.prescribed_load,
        COALESCE(l.actual_load, l.weight_kg) AS actual_load,
        l.prescribed_reps_min,
        l.prescribed_reps_max,
        COALESCE(l.actual_reps, l.reps) AS actual_reps,
        l.effort,
        l.effort_v2,
        l.skipped,
        l.set_completed,
        l.created_at
      FROM public.workout_set_logs l
      WHERE l.user_id = v_user
        AND l.exercise_external_id = p_external_id
        AND COALESCE(l.set_type, 'WORKING') = 'WORKING'
        AND l.skipped IS NOT TRUE
      ORDER BY l.created_at DESC, l.set_number DESC
      LIMIT v_limit
    ) x
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.client_map_legacy_goal(p_legacy_id TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_build_object(
        'legacy_id', m.legacy_id,
        'canonical_id', m.canonical_id,
        'mapping_status', m.mapping_status,
        'label_ar', p.label_ar,
        'notes', m.notes
      )
      FROM public.training_goal_legacy_map m
      LEFT JOIN public.training_goal_profiles p ON p.canonical_id = m.canonical_id
      WHERE m.legacy_id = p_legacy_id
    ),
    jsonb_build_object(
      'legacy_id', p_legacy_id,
      'canonical_id', NULL,
      'mapping_status', 'LEGACY_UNMAPPED',
      'label_ar', NULL,
      'notes', 'unknown legacy goal'
    )
  );
$$;

REVOKE ALL ON FUNCTION public.client_ensure_training_level() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.client_ensure_exercise_experience(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.client_ensure_workout_session(TEXT, DATE, UUID, UUID, INT, INT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.client_get_active_workout_session() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.client_update_workout_session_status(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.client_list_exercise_set_history(TEXT, INT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.client_map_legacy_goal(TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.client_ensure_training_level() TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_ensure_exercise_experience(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_ensure_workout_session(TEXT, DATE, UUID, UUID, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_get_active_workout_session() TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_update_workout_session_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_list_exercise_set_history(TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_map_legacy_goal(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.map_legacy_effort_to_v2(public.workout_effort_level) TO authenticated;
