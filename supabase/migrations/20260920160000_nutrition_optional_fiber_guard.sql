-- Keep the conservative pre-workout screen aligned with the managed meal
-- catalog: fiber is optional catalog metadata. Enforce <= 10g when present,
-- reject invalid stored types, and retain all other hard slot constraints.

BEGIN;

CREATE OR REPLACE FUNCTION public._nutrition_template_validate_slots(p_slots JSONB)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_meal public.meals%ROWTYPE;
  v_key TEXT;
  v_fiber_is_manageable BOOLEAN;
BEGIN
  IF jsonb_array_length(COALESCE(p_slots, '[]'::jsonb)) <> 6
     OR (SELECT count(DISTINCT x->>'slot_key') FROM jsonb_array_elements(p_slots) x) <> 6 THEN
    RAISE EXCEPTION 'six_unique_slots_required' USING ERRCODE = '22023';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_slots) LOOP
    v_key := v_item->>'slot_key';
    SELECT * INTO v_meal
    FROM public.meals
    WHERE external_id = v_item->>'source_external_id'
      AND status = 'published'
      AND is_active
    LIMIT 1;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'meal_not_assignable' USING ERRCODE = '22023';
    END IF;

    IF (v_key = 'breakfast' AND v_meal.meal_type::text <> 'breakfast')
       OR (v_key = 'lunch' AND v_meal.meal_type::text <> 'lunch')
       OR (v_key = 'dinner' AND v_meal.meal_type::text <> 'dinner')
       OR (v_key = 'snack' AND v_meal.meal_type::text <> 'snack') THEN
      RAISE EXCEPTION 'unsafe_slot_meal' USING ERRCODE = '22023';
    END IF;

    v_fiber_is_manageable := CASE
      WHEN jsonb_typeof(COALESCE(v_meal.qa, '{}'::jsonb)->'derived_fiber_g') IS NULL THEN true
      WHEN jsonb_typeof(v_meal.qa->'derived_fiber_g') = 'null' THEN true
      WHEN jsonb_typeof(v_meal.qa->'derived_fiber_g') = 'number'
        THEN (v_meal.qa->>'derived_fiber_g')::numeric <= 10
      ELSE false
    END;

    IF v_key = 'pre_workout' AND NOT (
      v_meal.meal_type::text = 'pre_workout'
      AND v_meal.carbs_g >= 20
      AND v_meal.fat_g <= 15
      AND v_fiber_is_manageable
      AND v_meal.calories <= 500
      AND v_meal.serving_size <= 600
    ) THEN
      RAISE EXCEPTION 'unsafe_pre_workout_meal' USING ERRCODE = '22023';
    END IF;

    IF v_key = 'post_workout' AND NOT (
      v_meal.meal_type::text = 'post_workout'
      AND v_meal.protein_g >= 20
      AND v_meal.carbs_g >= 20
      AND v_meal.fat_g <= 20
      AND v_meal.calories <= 700
      AND v_meal.serving_size <= 700
    ) THEN
      RAISE EXCEPTION 'unsafe_post_workout_meal' USING ERRCODE = '22023';
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public._nutrition_template_validate_slots(JSONB)
  FROM PUBLIC, anon, authenticated;

COMMIT;
