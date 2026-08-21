-- Phase 6: expose duration fields on targeted exercise history (additive).
-- Algorithm remains in application domain, not SQL.

CREATE OR REPLACE FUNCTION public.client_list_exercise_set_history(p_external_id TEXT, p_limit INT DEFAULT 20)
RETURNS JSONB
LANGUAGE plpgsql
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
        l.prescribed_duration_seconds,
        l.actual_duration_seconds,
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

REVOKE ALL ON FUNCTION public.client_list_exercise_set_history(TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.client_list_exercise_set_history(TEXT, INT) TO authenticated;

COMMENT ON FUNCTION public.client_list_exercise_set_history(TEXT, INT) IS
  'Phase 2/6 targeted history. Working sets only. Duration fields additive. No progression algorithm.';
