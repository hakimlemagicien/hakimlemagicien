-- Customer journey program matching v2 + exercise safety pass.
--
-- Problems found in the new-client test (2026-11-28):
--   * glutes / tone goals were mapped to "bulk" → women asking for glutes got muscle-gain programs;
--   * home vs gym was ignored → home clients got machine/cable exercises;
--   * reported injuries were ignored → knee injury still got squats and lunges.
--
-- v2 (fallback path, used when the admin has no active program_automation_rules for the bucket):
--   1. goal → primary training strategy (same mapping as the app's template resolver);
--   2. HARD rules: a HOME client never gets a GYM template; never a level above the client's;
--   3. ranking: same strategy > related strategy; then closest days; then lower level;
--      then (for GYM clients only) a HOME template.
-- After any assignment is created, `_apply_assignment_safety` replaces exercises that are unsafe for
-- the client's injuries or not doable in their training place with a safe alternative from the
-- exercise library (same muscle first), or removes them when no safe alternative exists.

BEGIN;

-- ---------------------------------------------------------------------------
-- Injury → blocked movement roles / muscles (mirrors MAAKFIT_EXERCISE_SAFETY_V1, caution = blocked)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._injury_blocked_roles(p_injuries TEXT[])
RETURNS TEXT[] LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(array_agg(DISTINCT r), '{}')
  FROM unnest(COALESCE(p_injuries, '{}')) i
  CROSS JOIN LATERAL unnest(CASE lower(i)
    WHEN 'knee' THEN ARRAY['SQUAT','KNEE_EXTENSION','LOCOMOTION','HINGE','KNEE_FLEXION']
    WHEN 'shoulder' THEN ARRAY['VERTICAL_PUSH','SHOULDER_ABDUCTION','SHOULDER_FLEXION','HORIZONTAL_PUSH']
    WHEN 'lower_back' THEN ARRAY['HINGE','HIP_EXTENSION','SQUAT']
    WHEN 'ankle' THEN ARRAY['LOCOMOTION','CALF_RAISE','SQUAT']
    WHEN 'elbow' THEN ARRAY['ELBOW_FLEXION','ELBOW_EXTENSION','HORIZONTAL_PUSH','HORIZONTAL_PULL']
    ELSE ARRAY[]::TEXT[] END) r;
$$;

CREATE OR REPLACE FUNCTION public._injury_blocked_muscles(p_injuries TEXT[])
RETURNS TEXT[] LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(array_agg(DISTINCT m), '{}')
  FROM unnest(COALESCE(p_injuries, '{}')) i
  CROSS JOIN LATERAL unnest(CASE lower(i)
    WHEN 'knee' THEN ARRAY['QUADRICEPS']
    WHEN 'shoulder' THEN ARRAY['SHOULDERS','ANTERIOR_DELTOID','LATERAL_DELTOID','POSTERIOR_DELTOID']
    WHEN 'elbow' THEN ARRAY['BICEPS','TRICEPS']
    ELSE ARRAY[]::TEXT[] END) m;
$$;

-- High-impact jumping exercises that the role map alone does not catch.
CREATE OR REPLACE FUNCTION public._injury_blocked_external_ids(p_injuries TEXT[])
RETURNS TEXT[] LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(array_agg(DISTINCT x), '{}')
  FROM unnest(COALESCE(p_injuries, '{}')) i
  CROSS JOIN LATERAL unnest(CASE WHEN lower(i) IN ('knee','ankle')
    THEN ARRAY['CR-005','CR-006','CR-010','CR-014','CR-020','WU-004']
    ELSE ARRAY[]::TEXT[] END) x;
$$;

-- Preferred replacement movement roles for a blocked role.
CREATE OR REPLACE FUNCTION public._safety_replacement_roles(p_role TEXT)
RETURNS TEXT[] LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_role
    WHEN 'SQUAT' THEN ARRAY['HIP_EXTENSION','HIP_ABDUCTION']
    WHEN 'LOCOMOTION' THEN ARRAY['HIP_EXTENSION','HIP_ABDUCTION','ANTI_EXTENSION']
    WHEN 'KNEE_EXTENSION' THEN ARRAY['HIP_EXTENSION','HIP_ABDUCTION']
    WHEN 'KNEE_FLEXION' THEN ARRAY['HIP_EXTENSION','HIP_ABDUCTION']
    WHEN 'HINGE' THEN ARRAY['HIP_EXTENSION','HIP_ABDUCTION']
    WHEN 'HIP_EXTENSION' THEN ARRAY['HIP_ABDUCTION','ANTI_EXTENSION']
    WHEN 'CALF_RAISE' THEN ARRAY['HIP_ABDUCTION','ANTI_EXTENSION']
    WHEN 'VERTICAL_PUSH' THEN ARRAY['HORIZONTAL_PULL','SCAPULAR_CONTROL','ANTI_EXTENSION']
    WHEN 'SHOULDER_ABDUCTION' THEN ARRAY['HORIZONTAL_PULL','SCAPULAR_CONTROL','ANTI_EXTENSION']
    WHEN 'SHOULDER_FLEXION' THEN ARRAY['HORIZONTAL_PULL','SCAPULAR_CONTROL','ANTI_EXTENSION']
    WHEN 'HORIZONTAL_PUSH' THEN ARRAY['HORIZONTAL_PULL','ANTI_EXTENSION']
    WHEN 'ELBOW_FLEXION' THEN ARRAY['ANTI_EXTENSION','ANTI_ROTATION','TRUNK_FLEXION']
    WHEN 'ELBOW_EXTENSION' THEN ARRAY['ANTI_EXTENSION','ANTI_ROTATION','TRUNK_FLEXION']
    WHEN 'HORIZONTAL_PULL' THEN ARRAY['ANTI_EXTENSION','ANTI_ROTATION']
    WHEN 'VERTICAL_PULL' THEN ARRAY['HORIZONTAL_PULL','ANTI_EXTENSION']
    WHEN 'INTERVAL_CONDITIONING' THEN ARRAY['STEADY_CARDIO','ANTI_EXTENSION']
    ELSE ARRAY['MOBILITY','ANTI_EXTENSION'] END;
$$;

-- ---------------------------------------------------------------------------
-- Safety + location pass on one assignment snapshot.
-- p_env: 'HOME' | 'GYM' | NULL (no location filter).
-- Returns number of rows replaced or removed.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._apply_assignment_safety(
  p_assignment_id UUID,
  p_injuries TEXT[],
  p_env TEXT
)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_roles TEXT[] := public._injury_blocked_roles(p_injuries);
  v_muscles TEXT[] := public._injury_blocked_muscles(p_injuries);
  v_ids TEXT[] := public._injury_blocked_external_ids(p_injuries);
  v_env TEXT := upper(NULLIF(p_env, ''));
  v_row RECORD;
  v_repl public.exercises%ROWTYPE;
  v_changed INTEGER := 0;
BEGIN
  FOR v_row IN
    SELECT x.id, x.day_id, x.activity_role, e.primary_movement_role AS role,
           e.primary_muscle_canonical AS muscle, e.substitution_group AS grp
    FROM public.client_program_exercises x
    JOIN public.client_program_days d ON d.id = x.day_id
    JOIN public.client_program_weeks w ON w.id = d.week_id
    JOIN public.exercises e ON e.id = x.exercise_id
    WHERE w.assignment_id = p_assignment_id
      AND (
        e.primary_movement_role = ANY (v_roles)
        OR e.primary_muscle_canonical = ANY (v_muscles)
        OR e.external_id = ANY (v_ids)
        OR (v_env IS NOT NULL AND cardinality(COALESCE(e.location_compatibility, '{}')) > 0
            AND NOT (v_env = ANY (e.location_compatibility)))
      )
    ORDER BY d.day_number, x.sort_order
  LOOP
    SELECT c.* INTO v_repl
    FROM public.exercises c
    WHERE c.is_active IS TRUE
      AND COALESCE(c.beginner_eligible, true)
      AND c.external_id NOT LIKE 'EX-%'
      AND NOT (c.primary_movement_role = ANY (v_roles))
      AND NOT (COALESCE(c.primary_muscle_canonical, '') = ANY (v_muscles))
      AND NOT (c.external_id = ANY (v_ids))
      AND (v_env IS NULL OR v_env = ANY (COALESCE(c.location_compatibility, '{}')))
      AND NOT EXISTS (
        SELECT 1 FROM public.client_program_exercises o
        WHERE o.day_id = v_row.day_id AND o.exercise_id = c.id
      )
      AND (
        -- warm-ups stay warm-ups
        (COALESCE(v_row.activity_role, '') IN ('GENERAL_WARM_UP','TARGETED_DYNAMIC_WARM_UP','EXERCISE_SPECIFIC_RAMP_UP')
          AND c.primary_movement_role IN ('WARMUP','MOBILITY'))
        OR (COALESCE(v_row.activity_role, '') NOT IN ('GENERAL_WARM_UP','TARGETED_DYNAMIC_WARM_UP','EXERCISE_SPECIFIC_RAMP_UP')
          AND (
            (v_row.grp IS NOT NULL AND c.substitution_group = v_row.grp)
            OR c.primary_muscle_canonical = v_row.muscle
            OR c.primary_movement_role = ANY (public._safety_replacement_roles(v_row.role))
          ))
      )
    ORDER BY
      CASE WHEN v_row.grp IS NOT NULL AND c.substitution_group = v_row.grp THEN 0
           WHEN c.primary_muscle_canonical = v_row.muscle THEN 1
           ELSE 2 + COALESCE(array_position(public._safety_replacement_roles(v_row.role), c.primary_movement_role), 9) END,
      COALESCE(c.sort_order, 9999), c.external_id
    LIMIT 1;

    IF FOUND THEN
      UPDATE public.client_program_exercises
      SET exercise_id = v_repl.id,
          exercise_external_id = v_repl.external_id,
          exercise_name_ar = v_repl.name_ar,
          exercise_name_en = v_repl.name_en,
          suggested_weight_kg = NULL,
          notes_ar = NULLIF(concat_ws(' · ', NULLIF(notes_ar, ''), 'بديل آمن حسب بياناتك'), ''),
          updated_at = now()
      WHERE id = v_row.id;
    ELSE
      DELETE FROM public.client_program_exercises WHERE id = v_row.id;
    END IF;
    v_changed := v_changed + 1;
  END LOOP;
  RETURN v_changed;
END;
$$;

REVOKE ALL ON FUNCTION public._apply_assignment_safety(UUID, TEXT[], TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._apply_assignment_safety(UUID, TEXT[], TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- Journey finalize v2
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._finalize_customer_journey(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_journey public.client_customer_journeys%ROWTYPE;
  v_answers JSONB := '{}'::jsonb;
  v_profile_goal TEXT;
  v_training_type TEXT;
  v_location_pref TEXT;
  v_gender TEXT;
  v_goal TEXT;
  v_goal_key TEXT;
  v_strategy TEXT;
  v_related TEXT[];
  v_level TEXT;
  v_level_rank INTEGER;
  v_env TEXT;
  v_injuries TEXT[];
  v_template_id UUID;
  v_assignment_id UUID;
  v_has_managed_rules BOOLEAN := false;
  v_requested_days INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));
  SELECT * INTO v_journey FROM public.client_customer_journeys WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_journey.status = 'ready' OR v_journey.preferred_training_days IS NULL THEN RETURN; END IF;

  SELECT id INTO v_assignment_id FROM public.client_program_assignments
  WHERE client_id = p_user_id AND status IN ('active','scheduled')
  ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, assigned_at DESC LIMIT 1;
  IF v_assignment_id IS NOT NULL THEN
    UPDATE public.client_customer_journeys SET status='ready', assignment_id=v_assignment_id,
      completed_at=COALESCE(completed_at,now()), failure_code=NULL WHERE user_id=p_user_id;
    RETURN;
  END IF;

  SELECT tp.goal, tp.training_type, tp.location_preference, COALESCE(tp.answers, '{}'::jsonb)
  INTO v_profile_goal, v_training_type, v_location_pref, v_answers
  FROM public.training_profiles tp WHERE tp.user_id = p_user_id;

  v_gender := lower(COALESCE(v_answers->>'gender',''));
  v_level := lower(COALESCE(v_answers->>'trainingLevel', v_answers->>'training_level',
    v_answers->>'experienceLevel', v_answers->>'experience_level',
    CASE lower(COALESCE(v_answers->>'activityLevel',v_answers->>'activity_level',''))
      WHEN 'high' THEN 'intermediate' WHEN 'veryhigh' THEN 'intermediate'
      WHEN 'athlete' THEN 'intermediate' ELSE 'beginner' END));
  IF v_level NOT IN ('beginner','intermediate','advanced') THEN v_level := 'beginner'; END IF;
  v_level_rank := CASE v_level WHEN 'advanced' THEN 3 WHEN 'intermediate' THEN 2 ELSE 1 END;

  v_goal_key := lower(COALESCE(NULLIF(v_profile_goal,''), v_answers->>'goalId', v_answers->>'goal_id', ''));
  -- Legacy bucket (admin automation rules are keyed by it).
  v_goal := CASE v_goal_key
    WHEN 'fat' THEN 'cut' WHEN 'waist' THEN 'cut' WHEN 'cut' THEN 'cut' WHEN 'fat_loss' THEN 'cut'
    WHEN 'muscle' THEN 'bulk' WHEN 'gain' THEN 'bulk' WHEN 'muscle_gain' THEN 'bulk'
    WHEN 'glutes' THEN 'bulk' WHEN 'tone' THEN 'bulk' WHEN 'bulk' THEN 'bulk'
    WHEN 'recomp' THEN 'recomp' WHEN 'body_recomposition' THEN 'recomp'
    WHEN 'fitness' THEN 'fitness' WHEN 'fit' THEN 'fitness' WHEN 'athletic' THEN 'fitness'
    WHEN 'shape' THEN 'fitness' WHEN 'body' THEN 'fitness' ELSE NULL END;
  -- Primary training strategy (template contract identity).
  v_strategy := CASE v_goal_key
    WHEN 'fat' THEN 'FAT_LOSS' WHEN 'fat_loss' THEN 'FAT_LOSS' WHEN 'cut' THEN 'FAT_LOSS'
    WHEN 'muscle' THEN 'MUSCLE_GAIN' WHEN 'gain' THEN 'MUSCLE_GAIN' WHEN 'muscle_gain' THEN 'MUSCLE_GAIN' WHEN 'bulk' THEN 'MUSCLE_GAIN'
    WHEN 'fitness' THEN 'GENERAL_FITNESS' WHEN 'fit' THEN 'GENERAL_FITNESS'
    WHEN 'athletic' THEN 'ATHLETIC_PERFORMANCE'
    WHEN 'shape' THEN 'BODY_RECOMPOSITION' WHEN 'body' THEN 'BODY_RECOMPOSITION'
    WHEN 'waist' THEN 'BODY_RECOMPOSITION' WHEN 'tone' THEN 'BODY_RECOMPOSITION'
    WHEN 'recomp' THEN 'BODY_RECOMPOSITION' WHEN 'body_recomposition' THEN 'BODY_RECOMPOSITION'
    WHEN 'glutes' THEN 'GLUTE_FOCUS'
    ELSE NULL END;
  v_related := CASE v_strategy
    WHEN 'GLUTE_FOCUS' THEN ARRAY['BODY_RECOMPOSITION','GENERAL_FITNESS']
    WHEN 'BODY_RECOMPOSITION' THEN ARRAY['FAT_LOSS','GENERAL_FITNESS']
    WHEN 'FAT_LOSS' THEN ARRAY['BODY_RECOMPOSITION','GENERAL_FITNESS']
    WHEN 'MUSCLE_GAIN' THEN ARRAY['BODY_RECOMPOSITION','STRENGTH']
    WHEN 'ATHLETIC_PERFORMANCE' THEN ARRAY['GENERAL_FITNESS']
    WHEN 'GENERAL_FITNESS' THEN ARRAY['BODY_RECOMPOSITION']
    ELSE ARRAY[]::TEXT[] END;

  v_env := upper(COALESCE(NULLIF(v_answers->>'trainingEnvironment',''), NULLIF(v_answers->>'trainingType',''),
    NULLIF(v_training_type,''), NULLIF(v_location_pref,''), ''));
  v_env := CASE WHEN v_env IN ('HOME','HOUSE','MANZIL') THEN 'HOME' WHEN v_env IN ('GYM','CLUB') THEN 'GYM' ELSE 'HOME' END;

  SELECT COALESCE(array_agg(lower(x)), '{}') INTO v_injuries
  FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(v_answers->'injuryIds')='array' THEN v_answers->'injuryIds' ELSE '[]'::jsonb END) x
  WHERE lower(x) NOT IN ('none','');

  IF v_gender NOT IN ('male','female') OR v_goal IS NULL OR v_strategy IS NULL THEN
    UPDATE public.client_customer_journeys SET status='complete_setup',
      failure_code=CASE WHEN v_gender NOT IN ('male','female') THEN 'missing_profile_gender' ELSE 'missing_profile_goal' END
    WHERE user_id=p_user_id;
    RETURN;
  END IF;

  v_requested_days := COALESCE(v_journey.preferred_training_days, v_journey.normalized_training_days);
  SELECT EXISTS(
    SELECT 1 FROM public.program_automation_rules r
    WHERE r.is_active AND r.gender=v_gender AND r.goal=v_goal AND r.level=v_level
  ) INTO v_has_managed_rules;

  IF v_has_managed_rules THEN
    -- Admin-managed mapping wins, but still never a GYM template for a HOME client.
    SELECT r.training_template_id INTO v_template_id
    FROM public.program_automation_rules r
    JOIN public.program_templates t ON t.id=r.training_template_id
    WHERE r.is_active AND r.gender=v_gender AND r.goal=v_goal AND r.level=v_level
      AND (r.training_days=v_requested_days OR r.is_fallback)
      AND t.is_published IS TRUE AND t.archived_at IS NULL
      AND NOT (v_env='HOME' AND upper(COALESCE(t.metadata->'template_contract'->'variant'->>'environment', t.metadata->>'training_location', 'HOME'))='GYM')
      AND EXISTS (SELECT 1 FROM public.program_template_weeks w WHERE w.template_id=t.id)
    ORDER BY CASE WHEN r.training_days=v_requested_days THEN 0 ELSE 1 END,
      r.priority ASC, abs(r.training_days-v_requested_days), t.version DESC, r.id
    LIMIT 1;
  END IF;

  IF v_template_id IS NULL THEN
    SELECT t.id INTO v_template_id
    FROM public.program_templates t
    CROSS JOIN LATERAL (
      SELECT
        t.metadata->'template_contract'->>'primary_strategy' AS strategy,
        upper(COALESCE(t.metadata->'template_contract'->'variant'->>'environment', t.metadata->>'training_location', '')) AS env,
        upper(COALESCE(t.metadata->'template_contract'->'variant'->>'level', t.level::text, 'BEGINNER')) AS lvl,
        COALESCE((t.metadata->'template_contract'->'variant'->>'days_per_week')::INT, t.days_per_week) AS days,
        lower(COALESCE(NULLIF(t.metadata->>'target_gender',''), NULLIF(t.metadata->'template_contract'->>'target_gender',''),
          NULLIF(t.metadata->>'audience_gender',''), NULLIF(t.metadata->>'gender',''), 'all')) AS gender
    ) c
    WHERE t.is_published IS TRUE AND t.archived_at IS NULL
      AND EXISTS (SELECT 1 FROM public.program_template_weeks w WHERE w.template_id=t.id)
      AND c.gender IN (v_gender, 'all')
      AND (c.strategy = v_strategy OR c.strategy = ANY (v_related))
      AND NOT (v_env='HOME' AND c.env <> 'HOME')
      AND (CASE c.lvl WHEN 'ADVANCED' THEN 3 WHEN 'INTERMEDIATE' THEN 2 ELSE 1 END) <= v_level_rank
    ORDER BY
      CASE WHEN c.strategy = v_strategy THEN 0 ELSE 1 + array_position(v_related, c.strategy) END,
      abs(c.days - v_requested_days),
      CASE WHEN c.days > v_requested_days THEN 1 ELSE 0 END,
      CASE WHEN c.lvl = upper(v_level) THEN 0 ELSE 1 END,
      CASE WHEN c.env = v_env THEN 0 ELSE 1 END,
      CASE WHEN c.gender = v_gender THEN 0 ELSE 1 END,
      t.version DESC, t.slug
    LIMIT 1;
  END IF;

  IF v_template_id IS NULL THEN
    UPDATE public.client_customer_journeys SET status='failed',
      failure_code=CASE WHEN v_has_managed_rules THEN 'automation_mapping_missing' ELSE 'no_compatible_template' END
    WHERE user_id=p_user_id;
    RETURN;
  END IF;

  PERFORM public.client_auto_assign_program_template(v_template_id, CURRENT_DATE, false);
  SELECT id INTO v_assignment_id FROM public.client_program_assignments
  WHERE client_id=p_user_id AND status='active' ORDER BY assigned_at DESC LIMIT 1;

  IF v_assignment_id IS NOT NULL THEN
    PERFORM public._apply_assignment_safety(v_assignment_id, v_injuries, v_env);
  END IF;

  UPDATE public.client_customer_journeys SET status='ready', matched_template_id=v_template_id,
    assignment_id=v_assignment_id, completed_at=now(), failure_code=NULL WHERE user_id=p_user_id;
END;
$$;

COMMIT;
