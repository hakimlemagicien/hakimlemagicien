-- Let admins safely complete the meal timing input required by Nutrition Strategy V1.

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_get_client_nutrition_training_window(
  p_client_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window TEXT;
BEGIN
  PERFORM public._require_admin();
  IF p_client_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_client_id) THEN
    RAISE EXCEPTION 'invalid_client' USING ERRCODE = '22023';
  END IF;

  SELECT training_meal_window
  INTO v_window
  FROM public.client_customer_journeys
  WHERE user_id = p_client_id;

  RETURN v_window;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_client_nutrition_training_window(
  p_client_id UUID,
  p_window TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID := public._require_admin();
BEGIN
  IF p_client_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_client_id) THEN
    RAISE EXCEPTION 'invalid_client' USING ERRCODE = '22023';
  END IF;
  IF p_window NOT IN (
    'before_breakfast', 'after_breakfast', 'before_lunch', 'after_lunch',
    'before_evening_meal', 'after_evening_meal', 'before_dinner', 'after_dinner'
  ) THEN
    RAISE EXCEPTION 'invalid_training_meal_window' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.client_customer_journeys (
    user_id,
    status,
    preparation_started_at,
    preparation_ready_at,
    training_meal_window,
    grandfathered
  )
  VALUES (p_client_id, 'complete_setup', now(), now(), p_window, true)
  ON CONFLICT (user_id) DO UPDATE
  SET training_meal_window = EXCLUDED.training_meal_window,
      failure_code = CASE
        WHEN client_customer_journeys.failure_code = 'TRAINING_TIME_REQUIRED' THEN NULL
        ELSE client_customer_journeys.failure_code
      END;

  PERFORM public._write_audit_event(
    v_admin,
    p_client_id,
    'client_nutrition_training_window_updated',
    jsonb_build_object('training_meal_window', p_window)
  );
  RETURN p_window;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_client_nutrition_training_window(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_client_nutrition_training_window(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_client_nutrition_training_window(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_client_nutrition_training_window(UUID, TEXT) TO authenticated, service_role;

COMMIT;
