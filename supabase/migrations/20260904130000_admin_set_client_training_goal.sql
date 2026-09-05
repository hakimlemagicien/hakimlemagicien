-- Coach/admin can set a client's official training goal so Strategy Matrix can generate.
-- Writes profiles.goal and, when present, training_profiles.goal + answers.goalId.
-- Does not assign or regenerate a program.

CREATE OR REPLACE FUNCTION public.admin_set_client_training_goal(
  p_client_id UUID,
  p_goal TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_goal TEXT := btrim(COALESCE(p_goal, ''));
  v_reason TEXT := btrim(COALESCE(p_reason, ''));
  v_before TEXT;
  v_answers JSONB;
BEGIN
  v_admin := public._require_staff_permission('training.manage');

  IF p_client_id IS NULL THEN
    RAISE EXCEPTION 'invalid_client' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_client_id) THEN
    RAISE EXCEPTION 'invalid_client' USING ERRCODE = '22023';
  END IF;
  IF v_goal NOT IN (
    'GLUTE_GROWTH',
    'SLIM_TONED_WAIST',
    'TONED_ARMS_UPPER_BODY',
    'FEMININE_BALANCED_BODY',
    'FAT_LOSS',
    'POSTURE_TONED_BACK',
    'MUSCLE_GROWTH',
    'FITNESS_ENERGY',
    'ATHLETIC_PHYSIQUE',
    'BODY_RESHAPE',
    'HEALTHY_WEIGHT_GAIN'
  ) THEN
    RAISE EXCEPTION 'invalid_training_goal' USING ERRCODE = '22023';
  END IF;
  IF char_length(v_reason) < 5 THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE = '22023';
  END IF;

  SELECT goal INTO v_before FROM public.profiles WHERE id = p_client_id;

  UPDATE public.profiles
  SET goal = v_goal, updated_at = now()
  WHERE id = p_client_id;

  UPDATE public.training_profiles
  SET
    goal = v_goal,
    answers = COALESCE(answers, '{}'::jsonb) || jsonb_build_object('goalId', v_goal, 'goal_id', v_goal),
    updated_at = now()
  WHERE user_id = p_client_id;

  PERFORM public._write_audit_event(
    v_admin,
    p_client_id,
    'client_training_goal_updated',
    jsonb_build_object(
      'before', v_before,
      'after', v_goal,
      'reason', v_reason
    )
  );

  SELECT answers INTO v_answers FROM public.training_profiles WHERE user_id = p_client_id LIMIT 1;

  RETURN jsonb_build_object(
    'client_id', p_client_id,
    'goal', v_goal,
    'before', v_before,
    'training_profile_updated', v_answers IS NOT NULL
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_client_training_goal(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_client_training_goal(UUID, TEXT, TEXT) TO authenticated, service_role;

COMMENT ON FUNCTION public.admin_set_client_training_goal(UUID, TEXT, TEXT)
  IS 'Sets an official Strategy Matrix goal for a client. Does not assign or regenerate a program.';
