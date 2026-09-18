BEGIN;

CREATE OR REPLACE FUNCTION public._nutrition_template_validate_curated_plan(p_plan JSONB)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day JSONB;
  v_slots JSONB;
  v_slot_key TEXT;
  v_meal JSONB;
  v_normalized JSONB;
  v_day_numbers INT[] := ARRAY[]::INT[];
BEGIN
  IF jsonb_typeof(COALESCE(p_plan, '[]'::jsonb)) <> 'array'
     OR jsonb_array_length(p_plan) <> 7 THEN
    RAISE EXCEPTION 'seven_day_curated_plan_required' USING ERRCODE = '22023';
  END IF;

  FOR v_day IN SELECT * FROM jsonb_array_elements(p_plan)
  LOOP
    IF COALESCE((v_day->>'day')::INT, 0) NOT BETWEEN 1 AND 7
       OR (v_day->>'day')::INT = ANY(v_day_numbers) THEN
      RAISE EXCEPTION 'unique_day_1_to_7_required' USING ERRCODE = '22023';
    END IF;
    v_day_numbers := array_append(v_day_numbers, (v_day->>'day')::INT);
    v_slots := v_day->'slots';
    IF jsonb_typeof(v_slots) <> 'object'
       OR (SELECT count(*) FROM jsonb_object_keys(v_slots)) <> 6 THEN
      RAISE EXCEPTION 'six_slots_per_day_required' USING ERRCODE = '22023';
    END IF;

    v_normalized := '[]'::jsonb;
    FOREACH v_slot_key IN ARRAY ARRAY[
      'breakfast',
      'lunch',
      'snack',
      'dinner',
      'pre_workout',
      'post_workout'
    ]
    LOOP
      v_meal := v_slots->v_slot_key;
      IF v_meal IS NULL
         OR COALESCE(v_meal->>'external_id', v_meal->>'source_external_id', '') = '' THEN
        RAISE EXCEPTION 'curated_slot_meal_required:%', v_slot_key USING ERRCODE = '22023';
      END IF;
      v_normalized := v_normalized || jsonb_build_array(
        jsonb_build_object(
          'slot_key', v_slot_key,
          'source_external_id', COALESCE(v_meal->>'external_id', v_meal->>'source_external_id')
        )
      );
    END LOOP;
    PERFORM public._nutrition_template_validate_slots(v_normalized);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public._nutrition_template_validate_curated_plan(JSONB)
FROM PUBLIC, anon, authenticated;

COMMIT;
