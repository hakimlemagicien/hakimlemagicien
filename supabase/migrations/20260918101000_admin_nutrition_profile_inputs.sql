-- Let admins complete the minimum client inputs required by Nutrition Strategy V1.

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_set_client_nutrition_profile_inputs(
  p_client_id UUID,
  p_inputs JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID := public._require_admin();
  v_gender TEXT := lower(COALESCE(p_inputs->>'gender', ''));
  v_age INT := NULLIF(p_inputs->>'age', '')::int;
  v_height NUMERIC := NULLIF(p_inputs->>'heightCm', '')::numeric;
  v_weight NUMERIC := NULLIF(p_inputs->>'weightKg', '')::numeric;
  v_activity TEXT := lower(COALESCE(p_inputs->>'activityLevel', ''));
  v_body_type TEXT := lower(COALESCE(p_inputs->>'bodyType', 'average'));
  v_goal TEXT := NULLIF(p_inputs->>'goalId', '');
  v_normalized JSONB;
BEGIN
  IF p_client_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_client_id) THEN RAISE EXCEPTION 'invalid_client' USING ERRCODE='22023'; END IF;
  IF v_gender NOT IN ('male', 'female') THEN RAISE EXCEPTION 'nutrition_gender_required' USING ERRCODE='22023'; END IF;
  IF v_age IS NULL OR v_age NOT BETWEEN 13 AND 90 THEN RAISE EXCEPTION 'nutrition_age_invalid' USING ERRCODE='22023'; END IF;
  IF v_height IS NULL OR v_height NOT BETWEEN 120 AND 230 THEN RAISE EXCEPTION 'nutrition_height_invalid' USING ERRCODE='22023'; END IF;
  IF v_weight IS NULL OR v_weight NOT BETWEEN 35 AND 300 THEN RAISE EXCEPTION 'nutrition_weight_invalid' USING ERRCODE='22023'; END IF;
  IF v_activity NOT IN ('sedentary','light','moderate','high','veryhigh','athlete') THEN RAISE EXCEPTION 'nutrition_activity_invalid' USING ERRCODE='22023'; END IF;
  IF v_body_type NOT IN ('overweight','curvy','average','hourglass','slim','athletic') THEN RAISE EXCEPTION 'nutrition_body_type_invalid' USING ERRCODE='22023'; END IF;

  v_normalized := jsonb_build_object(
    'gender', v_gender,
    'age', v_age,
    'heightCm', v_height,
    'weightKg', v_weight,
    'activityLevel', v_activity,
    'bodyType', v_body_type
  ) || CASE WHEN v_goal IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('goalId', v_goal) END;

  INSERT INTO public.training_profiles AS training_profile (user_id, full_name, goal, answers, completed_at, updated_at)
  SELECT p_client_id, profile.full_name, v_goal, v_normalized, now(), now()
  FROM public.profiles AS profile WHERE profile.id = p_client_id
  ON CONFLICT (user_id) DO UPDATE SET
    goal = COALESCE(training_profile.goal, v_goal),
    answers = COALESCE(training_profile.answers, '{}'::jsonb) || v_normalized,
    updated_at = now();

  PERFORM public._write_audit_event(v_admin, p_client_id, 'client_nutrition_profile_inputs_updated', v_normalized - 'age' - 'heightCm' - 'weightKg');
  RETURN v_normalized;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_client_nutrition_profile_inputs(UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_client_nutrition_profile_inputs(UUID, JSONB) TO authenticated, service_role;

COMMIT;
