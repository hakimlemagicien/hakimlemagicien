-- Training Engine V2 Phase 3 — Exercise Library compatibility.
-- Additive. Upgrades public.exercises in place. No exercises_v2 table.
-- Does not change prescriptions, goals, progression, volume, or media identity.

-- ---------------------------------------------------------------------------
-- 1. Additive V2 metadata columns (legacy fields kept)
-- ---------------------------------------------------------------------------

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS v2_metadata_status TEXT NOT NULL DEFAULT 'UNREVIEWED',
  ADD COLUMN IF NOT EXISTS primary_muscle_canonical TEXT,
  ADD COLUMN IF NOT EXISTS secondary_muscles_canonical TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS muscle_contributions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS primary_movement_role TEXT,
  ADD COLUMN IF NOT EXISTS secondary_movement_roles TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS substitution_group TEXT,
  ADD COLUMN IF NOT EXISTS mechanics TEXT,
  ADD COLUMN IF NOT EXISTS loading_type TEXT,
  ADD COLUMN IF NOT EXISTS required_equipment TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS equipment_state TEXT NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN IF NOT EXISTS location_compatibility TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS is_bodyweight BOOLEAN,
  ADD COLUMN IF NOT EXISTS is_unilateral BOOLEAN,
  ADD COLUMN IF NOT EXISTS execution_sides TEXT,
  ADD COLUMN IF NOT EXISTS supports_timed_prescription BOOLEAN,
  ADD COLUMN IF NOT EXISTS prescription_mode TEXT,
  ADD COLUMN IF NOT EXISTS conditioning_class TEXT,
  ADD COLUMN IF NOT EXISTS complexity TEXT,
  ADD COLUMN IF NOT EXISTS beginner_eligible BOOLEAN;

DO $$
BEGIN
  ALTER TABLE public.exercises
    ADD CONSTRAINT exercises_v2_metadata_status_check
      CHECK (v2_metadata_status IN ('UNREVIEWED', 'REVIEW_REQUIRED', 'APPROVED', 'BLOCKED'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.exercises
    ADD CONSTRAINT exercises_v2_mechanics_check
      CHECK (mechanics IS NULL OR mechanics IN ('COMPOUND', 'ISOLATION', 'NOT_APPLICABLE'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.exercises
    ADD CONSTRAINT exercises_v2_loading_type_check
      CHECK (loading_type IS NULL OR loading_type IN (
        'BARBELL', 'DUMBBELL', 'MACHINE', 'CABLE', 'BODYWEIGHT', 'BAND', 'KETTLEBELL',
        'PLATE_LOADED_MACHINE', 'SELECTORIZED_MACHINE', 'SMITH_MACHINE', 'CARDIO_MACHINE', 'OTHER'
      ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.exercises
    ADD CONSTRAINT exercises_v2_equipment_state_check
      CHECK (equipment_state IN ('NO_EQUIPMENT', 'HAS_EQUIPMENT', 'UNKNOWN'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.exercises
    ADD CONSTRAINT exercises_v2_execution_sides_check
      CHECK (execution_sides IS NULL OR execution_sides IN ('BILATERAL', 'ALTERNATING', 'LEFT_RIGHT_SEPARATE'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.exercises
    ADD CONSTRAINT exercises_v2_prescription_mode_check
      CHECK (prescription_mode IS NULL OR prescription_mode IN ('REPS', 'DURATION', 'DISTANCE', 'INTERVAL', 'OTHER'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.exercises
    ADD CONSTRAINT exercises_v2_conditioning_class_check
      CHECK (conditioning_class IS NULL OR conditioning_class IN (
        'STEADY_CARDIO', 'CYCLICAL_CONDITIONING', 'BODYWEIGHT_CONDITIONING', 'CIRCUIT_CAPABLE', 'INTERVAL_CAPABLE'
      ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.exercises
    ADD CONSTRAINT exercises_v2_complexity_check
      CHECK (complexity IS NULL OR complexity IN ('LOW', 'MODERATE', 'HIGH'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.exercises
    ADD CONSTRAINT exercises_v2_contributions_array_check
      CHECK (jsonb_typeof(muscle_contributions) = 'array');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN public.exercises.v2_metadata_status IS
  'Training-metadata review lifecycle. Independent from video_status / instructions_status.';
COMMENT ON COLUMN public.exercises.equipment_state IS
  'NO_EQUIPMENT is explicit none. UNKNOWN is unresolved. Never use empty string.';
COMMENT ON COLUMN public.exercises.muscle_contributions IS
  'Semantic contribution roles only (DIRECT_PRIMARY / DIRECT_SECONDARY / INDIRECT_MEANINGFUL / MINOR_STABILIZER). No numeric volume coefficients.';
COMMENT ON COLUMN public.exercises.external_id IS
  'Stable exercise identity. Immutable after insert. Display names are labels only.';

CREATE INDEX IF NOT EXISTS exercises_v2_metadata_status_idx
  ON public.exercises (v2_metadata_status)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS exercises_v2_primary_role_idx
  ON public.exercises (primary_movement_role)
  WHERE is_active = true AND v2_metadata_status = 'APPROVED';

CREATE INDEX IF NOT EXISTS exercises_v2_primary_muscle_idx
  ON public.exercises (primary_muscle_canonical)
  WHERE is_active = true AND v2_metadata_status = 'APPROVED';

-- ---------------------------------------------------------------------------
-- 2. Identity protection
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.exercises_protect_external_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.external_id IS DISTINCT FROM OLD.external_id THEN
    RAISE EXCEPTION 'external_id_immutable' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_exercises_protect_external_id ON public.exercises;
CREATE TRIGGER trg_exercises_protect_external_id
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.exercises_protect_external_id();

-- ---------------------------------------------------------------------------
-- 3. Eligibility helper (no ranking)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.exercise_v2_is_eligible(e public.exercises)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT
    e.is_active
    AND e.v2_metadata_status = 'APPROVED'
    AND e.external_id ~ '^[A-Z]{2}-[0-9]{3}$'
    AND e.primary_muscle_canonical IS NOT NULL
    AND btrim(e.primary_muscle_canonical) <> ''
    AND e.primary_movement_role IS NOT NULL
    AND btrim(e.primary_movement_role) <> ''
    AND e.equipment_state IN ('NO_EQUIPMENT', 'HAS_EQUIPMENT')
    AND e.mechanics IS NOT NULL
    AND e.is_bodyweight IS NOT NULL
    AND e.is_unilateral IS NOT NULL
    AND e.prescription_mode IS NOT NULL
    AND (
      e.equipment_state <> 'HAS_EQUIPMENT'
      OR coalesce(array_length(e.required_equipment, 1), 0) > 0
    )
    AND (
      e.equipment_state <> 'NO_EQUIPMENT'
      OR coalesce(array_length(e.required_equipment, 1), 0) = 0
    )
    AND (
      e.prescription_mode <> 'DURATION'
      OR e.supports_timed_prescription IS TRUE
    );
$$;

CREATE OR REPLACE FUNCTION public.exercise_v2_validate_row(e public.exercises)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF e.v2_metadata_status = 'APPROVED' AND NOT public.exercise_v2_is_eligible(e) THEN
    RAISE EXCEPTION 'invalid_v2_metadata' USING ERRCODE = '22023';
  END IF;
  IF e.prescription_mode = 'DURATION' AND e.supports_timed_prescription IS NOT TRUE THEN
    RAISE EXCEPTION 'duration_requires_timed' USING ERRCODE = '22023';
  END IF;
  IF e.equipment_state = 'NO_EQUIPMENT' AND coalesce(array_length(e.required_equipment, 1), 0) > 0 THEN
    RAISE EXCEPTION 'no_equipment_with_requirements' USING ERRCODE = '22023';
  END IF;
  IF e.equipment_state = 'HAS_EQUIPMENT' AND coalesce(array_length(e.required_equipment, 1), 0) = 0 THEN
    RAISE EXCEPTION 'has_equipment_without_requirements' USING ERRCODE = '22023';
  END IF;
  IF e.is_bodyweight IS TRUE AND e.loading_type IN (
    'BARBELL', 'DUMBBELL', 'CABLE', 'SELECTORIZED_MACHINE', 'SMITH_MACHINE', 'PLATE_LOADED_MACHINE'
  ) THEN
    RAISE EXCEPTION 'bodyweight_loading_conflict' USING ERRCODE = '22023';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.exercises_v2_validate_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.exercise_v2_validate_row(NEW);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_exercises_v2_validate ON public.exercises;
CREATE TRIGGER trg_exercises_v2_validate
  BEFORE INSERT OR UPDATE ON public.exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.exercises_v2_validate_trigger();

-- ---------------------------------------------------------------------------
-- 4. Admin save: freeze external_id, persist V2 fields
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_save_exercise(
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
  v_existing public.exercises%ROWTYPE;
  v_name_ar TEXT;
  v_name_en TEXT;
  v_external TEXT;
  v_slug TEXT;
  v_group UUID;
  v_type TEXT;
  v_diff TEXT;
  v_status TEXT;
BEGIN
  v_admin := public._require_admin();
  v_id := NULLIF(p_payload->>'id', '')::UUID;
  v_name_ar := NULLIF(btrim(COALESCE(p_payload->>'name_ar', '')), '');
  v_name_en := NULLIF(btrim(COALESCE(p_payload->>'name_en', '')), '');
  v_external := NULLIF(btrim(COALESCE(p_payload->>'external_id', '')), '');
  v_slug := NULLIF(btrim(COALESCE(p_payload->>'slug', '')), '');
  v_group := NULLIF(p_payload->>'muscle_group_id', '')::UUID;
  v_type := COALESCE(NULLIF(p_payload->>'exercise_type', ''), 'strength');
  v_diff := NULLIF(p_payload->>'difficulty', '');
  v_status := COALESCE(NULLIF(p_payload->>'v2_metadata_status', ''), 'UNREVIEWED');

  IF v_name_ar IS NULL OR v_name_en IS NULL THEN
    RAISE EXCEPTION 'name_required' USING ERRCODE = '22023';
  END IF;
  IF v_group IS NULL THEN
    RAISE EXCEPTION 'muscle_group_required' USING ERRCODE = '22023';
  END IF;
  IF v_type NOT IN ('strength', 'cardio', 'mobility', 'warmup', 'other') THEN
    RAISE EXCEPTION 'invalid_exercise_type' USING ERRCODE = '22023';
  END IF;
  IF v_diff IS NOT NULL AND v_diff NOT IN ('beginner', 'intermediate', 'advanced') THEN
    RAISE EXCEPTION 'invalid_difficulty' USING ERRCODE = '22023';
  END IF;
  IF v_status NOT IN ('UNREVIEWED', 'REVIEW_REQUIRED', 'APPROVED', 'BLOCKED') THEN
    RAISE EXCEPTION 'invalid_v2_metadata' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_muscle_groups g WHERE g.id = v_group) THEN
    RAISE EXCEPTION 'muscle_group_required' USING ERRCODE = '22023';
  END IF;

  IF v_slug IS NULL THEN
    v_slug := lower(regexp_replace(v_name_en, '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := trim(BOTH '-' FROM v_slug);
  END IF;
  IF v_slug IS NULL OR v_slug = '' THEN
    RAISE EXCEPTION 'slug_required' USING ERRCODE = '22023';
  END IF;

  IF v_id IS NOT NULL THEN
    SELECT * INTO v_existing FROM public.exercises WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
    END IF;
    IF p_expected_updated_at IS NOT NULL AND v_existing.updated_at IS DISTINCT FROM p_expected_updated_at THEN
      RAISE EXCEPTION 'stale_update' USING ERRCODE = '22023';
    END IF;
    IF v_external IS NOT NULL AND v_external IS DISTINCT FROM v_existing.external_id THEN
      RAISE EXCEPTION 'external_id_immutable' USING ERRCODE = '22023';
    END IF;
    v_external := v_existing.external_id;
    IF EXISTS (
      SELECT 1 FROM public.exercises e
      WHERE e.id <> v_id AND e.slug = v_slug
    ) THEN
      RAISE EXCEPTION 'duplicate_exercise' USING ERRCODE = '23505';
    END IF;

    UPDATE public.exercises SET
      slug = v_slug,
      muscle_group_id = v_group,
      name_ar = v_name_ar,
      name_en = v_name_en,
      equipment = NULLIF(btrim(COALESCE(p_payload->>'equipment', '')), ''),
      difficulty = v_diff::public.exercise_difficulty,
      exercise_type = v_type::public.exercise_type,
      primary_muscle = NULLIF(btrim(COALESCE(p_payload->>'primary_muscle', '')), ''),
      secondary_muscles = COALESCE(
        ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'secondary_muscles', '[]'::jsonb))),
        '{}'::text[]
      ),
      coach_notes = NULLIF(p_payload->>'coach_notes', ''),
      duration_seconds = GREATEST(COALESCE((p_payload->>'duration_seconds')::INT, 30), 1),
      youtube_url = NULLIF(btrim(COALESCE(p_payload->>'youtube_url', '')), ''),
      video_path = NULLIF(p_payload->>'video_path', ''),
      instructions_video_path = NULLIF(p_payload->>'instructions_video_path', ''),
      thumbnail_path = NULLIF(p_payload->>'thumbnail_path', ''),
      video_status = COALESCE(NULLIF(p_payload->>'video_status', ''), v_existing.video_status::TEXT)::public.exercise_media_status,
      instructions_status = COALESCE(NULLIF(p_payload->>'instructions_status', ''), v_existing.instructions_status::TEXT)::public.exercise_media_status,
      sort_order = COALESCE((p_payload->>'sort_order')::INT, v_existing.sort_order),
      v2_metadata_status = v_status,
      primary_muscle_canonical = NULLIF(btrim(COALESCE(p_payload->>'primary_muscle_canonical', v_existing.primary_muscle_canonical, '')), ''),
      secondary_muscles_canonical = CASE WHEN p_payload ? 'secondary_muscles_canonical'
        THEN ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'secondary_muscles_canonical', '[]'::jsonb)))
        ELSE v_existing.secondary_muscles_canonical END,
      muscle_contributions = CASE WHEN p_payload ? 'muscle_contributions'
        THEN COALESCE(p_payload->'muscle_contributions', '[]'::jsonb)
        ELSE v_existing.muscle_contributions END,
      primary_movement_role = CASE WHEN p_payload ? 'primary_movement_role'
        THEN NULLIF(btrim(COALESCE(p_payload->>'primary_movement_role', '')), '')
        ELSE v_existing.primary_movement_role END,
      secondary_movement_roles = CASE WHEN p_payload ? 'secondary_movement_roles'
        THEN ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'secondary_movement_roles', '[]'::jsonb)))
        ELSE v_existing.secondary_movement_roles END,
      substitution_group = CASE WHEN p_payload ? 'substitution_group'
        THEN NULLIF(btrim(COALESCE(p_payload->>'substitution_group', '')), '')
        ELSE v_existing.substitution_group END,
      mechanics = CASE WHEN p_payload ? 'mechanics'
        THEN NULLIF(btrim(COALESCE(p_payload->>'mechanics', '')), '')
        ELSE v_existing.mechanics END,
      loading_type = CASE WHEN p_payload ? 'loading_type'
        THEN NULLIF(btrim(COALESCE(p_payload->>'loading_type', '')), '')
        ELSE v_existing.loading_type END,
      required_equipment = CASE WHEN p_payload ? 'required_equipment'
        THEN ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'required_equipment', '[]'::jsonb)))
        ELSE v_existing.required_equipment END,
      equipment_state = COALESCE(NULLIF(p_payload->>'equipment_state', ''), v_existing.equipment_state),
      location_compatibility = CASE WHEN p_payload ? 'location_compatibility'
        THEN ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'location_compatibility', '[]'::jsonb)))
        ELSE v_existing.location_compatibility END,
      is_bodyweight = CASE WHEN p_payload ? 'is_bodyweight'
        THEN NULLIF(p_payload->>'is_bodyweight', '')::BOOLEAN
        ELSE v_existing.is_bodyweight END,
      is_unilateral = CASE WHEN p_payload ? 'is_unilateral'
        THEN NULLIF(p_payload->>'is_unilateral', '')::BOOLEAN
        ELSE v_existing.is_unilateral END,
      execution_sides = CASE WHEN p_payload ? 'execution_sides'
        THEN NULLIF(btrim(COALESCE(p_payload->>'execution_sides', '')), '')
        ELSE v_existing.execution_sides END,
      supports_timed_prescription = CASE WHEN p_payload ? 'supports_timed_prescription'
        THEN NULLIF(p_payload->>'supports_timed_prescription', '')::BOOLEAN
        ELSE v_existing.supports_timed_prescription END,
      prescription_mode = CASE WHEN p_payload ? 'prescription_mode'
        THEN NULLIF(btrim(COALESCE(p_payload->>'prescription_mode', '')), '')
        ELSE v_existing.prescription_mode END,
      conditioning_class = CASE WHEN p_payload ? 'conditioning_class'
        THEN NULLIF(btrim(COALESCE(p_payload->>'conditioning_class', '')), '')
        ELSE v_existing.conditioning_class END,
      complexity = CASE WHEN p_payload ? 'complexity'
        THEN NULLIF(btrim(COALESCE(p_payload->>'complexity', '')), '')
        ELSE v_existing.complexity END,
      beginner_eligible = CASE WHEN p_payload ? 'beginner_eligible'
        THEN NULLIF(p_payload->>'beginner_eligible', '')::BOOLEAN
        ELSE v_existing.beginner_eligible END
    WHERE id = v_id;
  ELSE
    IF v_external IS NULL THEN
      RAISE EXCEPTION 'external_id_required' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (SELECT 1 FROM public.exercises e WHERE e.external_id = v_external OR e.slug = v_slug) THEN
      RAISE EXCEPTION 'duplicate_exercise' USING ERRCODE = '23505';
    END IF;
    INSERT INTO public.exercises (
      external_id, slug, muscle_group_id, name_ar, name_en, equipment, difficulty,
      exercise_type, primary_muscle, secondary_muscles, coach_notes, duration_seconds,
      youtube_url, video_path, instructions_video_path, thumbnail_path, is_active,
      v2_metadata_status
    ) VALUES (
      v_external, v_slug, v_group, v_name_ar, v_name_en,
      NULLIF(btrim(COALESCE(p_payload->>'equipment', '')), ''),
      v_diff::public.exercise_difficulty,
      v_type::public.exercise_type,
      NULLIF(btrim(COALESCE(p_payload->>'primary_muscle', '')), ''),
      COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'secondary_muscles', '[]'::jsonb))), '{}'::text[]),
      NULLIF(p_payload->>'coach_notes', ''),
      GREATEST(COALESCE((p_payload->>'duration_seconds')::INT, 30), 1),
      NULLIF(btrim(COALESCE(p_payload->>'youtube_url', '')), ''),
      NULLIF(p_payload->>'video_path', ''),
      NULLIF(p_payload->>'instructions_video_path', ''),
      NULLIF(p_payload->>'thumbnail_path', ''),
      COALESCE((p_payload->>'is_active')::BOOLEAN, false),
      v_status
    )
    RETURNING id INTO v_id;
  END IF;

  SELECT * INTO v_existing FROM public.exercises WHERE id = v_id;
  PERFORM public.exercise_v2_validate_row(v_existing);

  RETURN public.admin_get_exercise(v_id);
END;
$$;

DROP FUNCTION IF EXISTS public.admin_list_exercises(text, text, text, text, text, boolean, integer, integer);

CREATE FUNCTION public.admin_list_exercises(
  p_query TEXT DEFAULT NULL,
  p_muscle TEXT DEFAULT NULL,
  p_equipment TEXT DEFAULT NULL,
  p_difficulty TEXT DEFAULT NULL,
  p_type TEXT DEFAULT NULL,
  p_active BOOLEAN DEFAULT NULL,
  p_limit INTEGER DEFAULT 25,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  external_id TEXT,
  slug TEXT,
  name_ar TEXT,
  name_en TEXT,
  equipment TEXT,
  difficulty public.exercise_difficulty,
  exercise_type public.exercise_type,
  primary_muscle TEXT,
  is_active BOOLEAN,
  video_status public.exercise_media_status,
  instructions_status public.exercise_media_status,
  thumbnail_path TEXT,
  muscle_group_name_ar TEXT,
  updated_at TIMESTAMPTZ,
  v2_metadata_status TEXT,
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
  v_q TEXT := NULLIF(btrim(COALESCE(p_query, '')), '');
BEGIN
  PERFORM public._require_admin();

  RETURN QUERY
  SELECT
    e.id,
    e.external_id,
    e.slug,
    e.name_ar,
    e.name_en,
    e.equipment,
    e.difficulty,
    e.exercise_type,
    e.primary_muscle,
    e.is_active,
    e.video_status,
    e.instructions_status,
    e.thumbnail_path,
    g.name_ar,
    e.updated_at,
    e.v2_metadata_status,
    count(*) OVER ()::BIGINT
  FROM public.exercises e
  JOIN public.exercise_muscle_groups g ON g.id = e.muscle_group_id
  WHERE (p_active IS NULL OR e.is_active = p_active)
    AND (p_muscle IS NULL OR e.muscle_group_id::TEXT = p_muscle OR g.code = p_muscle)
    AND (p_equipment IS NULL OR e.equipment = p_equipment)
    AND (p_difficulty IS NULL OR e.difficulty::TEXT = p_difficulty)
    AND (p_type IS NULL OR e.exercise_type::TEXT = p_type)
    AND (
      v_q IS NULL
      OR e.name_ar ILIKE '%' || v_q || '%'
      OR e.name_en ILIKE '%' || v_q || '%'
      OR e.external_id ILIKE '%' || v_q || '%'
      OR e.slug ILIKE '%' || v_q || '%'
    )
  ORDER BY e.updated_at DESC, e.sort_order, e.name_ar
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_exercises(text, text, text, text, text, boolean, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_exercises(text, text, text, text, text, boolean, integer, integer) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.exercise_v2_is_eligible(public.exercises) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.exercise_v2_is_eligible(public.exercises) TO authenticated, service_role;
