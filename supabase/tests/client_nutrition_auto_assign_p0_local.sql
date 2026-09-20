-- LOCAL / SAFE-CLONE ONLY.
-- Data-bearing replay for the self-service nutrition auto-assignment contract.
-- The entire fixture and every mutation are rolled back.
\set ON_ERROR_STOP on
\pset pager off

BEGIN;

DO $$
DECLARE
  v_user UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_payload JSONB;
  v_unsafe JSONB;
  v_created JSONB;
  v_replay JSONB;
  v_count INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user) THEN
    RAISE EXCEPTION 'local_fixture_user_missing';
  END IF;

  INSERT INTO public.training_profiles(user_id, goal, answers)
  VALUES (
    v_user,
    'muscle',
    '{"gender":"male","goalId":"muscle","weight":72,"height":178,"age":28,"activityLevel":"high"}'::jsonb
  )
  ON CONFLICT (user_id) DO UPDATE
    SET goal = EXCLUDED.goal, answers = EXCLUDED.answers;

  INSERT INTO public.client_customer_journeys(
    user_id, status, preparation_started_at, preparation_ready_at,
    preferred_training_days, normalized_training_days, training_meal_window, completed_at
  ) VALUES (
    v_user, 'ready', now() - interval '3 hours', now() - interval '1 hour',
    5, 5, 'after_evening_meal', now() - interval '1 hour'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    status = 'ready',
    training_meal_window = 'after_evening_meal',
    preferred_training_days = 5,
    normalized_training_days = 5,
    completed_at = now() - interval '1 hour';

  INSERT INTO public.client_nutrition_profiles(
    client_id, allergy_status, known_allergens, confirmed_none_at,
    dietary_restrictions, disliked_foods, updated_by
  ) VALUES (
    v_user, 'CONFIRMED_NONE', '{}', now(), '{}', '{}', v_user
  )
  ON CONFLICT (client_id) DO UPDATE SET
    allergy_status = 'CONFIRMED_NONE',
    known_allergens = '{}',
    confirmed_none_at = now(),
    dietary_restrictions = '{}',
    disliked_foods = '{}',
    updated_by = v_user;

  INSERT INTO public.meals(
    external_id, name_ar, name_en, meal_type, suitable_goals,
    calories, protein_g, carbs_g, fat_g, serving_size, serving_unit,
    status, is_active, image_status, qa
  )
  SELECT
    row_data.external_id,
    'وجبة اختبار آمنة',
    'Safe QA meal',
    row_data.meal_type::public.meal_type,
    ARRAY['MUSCLE_GAIN'],
    400, 30, 40, 12, 300, 'g', 'published', true, 'ready',
    jsonb_build_object('derived_fiber_g', 6)
  FROM (VALUES
    ('QA-AUTO-BREAKFAST', 'breakfast'),
    ('QA-AUTO-LUNCH', 'lunch'),
    ('QA-AUTO-SNACK', 'snack'),
    ('QA-AUTO-DINNER', 'dinner'),
    ('QA-AUTO-PRE', 'pre_workout'),
    ('QA-AUTO-POST', 'post_workout')
  ) AS row_data(external_id, meal_type)
  ON CONFLICT (external_id) DO UPDATE SET
    meal_type = EXCLUDED.meal_type,
    status = 'published',
    is_active = true,
    suitable_goals = EXCLUDED.suitable_goals,
    calories = EXCLUDED.calories,
    protein_g = EXCLUDED.protein_g,
    carbs_g = EXCLUDED.carbs_g,
    fat_g = EXCLUDED.fat_g,
    qa = EXCLUDED.qa;

  DELETE FROM public.client_nutrition_assignments WHERE client_id = v_user;
  DELETE FROM public.client_nutrition_targets WHERE client_id = v_user;
  DELETE FROM public.nutrition_decision_traces WHERE client_id = v_user;

  v_payload := jsonb_build_object(
    'name_ar', 'خطة اختبار الإسناد التلقائي',
    'strategy_version', 'nutrition-strategy-v1',
    'library_version', 'local-live-catalog',
    'validation_status', 'VALID',
    'target', jsonb_build_object(
      'nutrition_objective', 'MUSCLE_GAIN',
      'goal_context', 'MUSCLE_GAIN',
      'calories', 2846,
      'protein_g', 129.6,
      'carbs_g', 386.2,
      'fat_g', 87,
      'reference_weight_kg', 72,
      'reference_weight_source', 'profile_measurement'
    ),
    'decision_trace', jsonb_build_object('metadata', jsonb_build_object('qa', true)),
    'resolved_snapshot', jsonb_build_object('qa', true),
    'slots', jsonb_build_array(
      jsonb_build_object('slot_key','breakfast','slot_label','الفطور','time_label','08:00','hour',8,'minute',0,'sort_order',1,'source_external_id','QA-AUTO-BREAKFAST','servings',1),
      jsonb_build_object('slot_key','lunch','slot_label','وجبة رئيسية 1','time_label','12:00','hour',12,'minute',0,'sort_order',2,'source_external_id','QA-AUTO-LUNCH','servings',1),
      jsonb_build_object('slot_key','snack','slot_label','وجبة رئيسية / سناك','time_label','15:00','hour',15,'minute',0,'sort_order',3,'source_external_id','QA-AUTO-SNACK','servings',1),
      jsonb_build_object('slot_key','dinner','slot_label','وجبة رئيسية 2','time_label','18:00','hour',18,'minute',0,'sort_order',4,'source_external_id','QA-AUTO-DINNER','servings',1),
      jsonb_build_object('slot_key','pre_workout','slot_label','قبل التمرين','time_label','20:00','hour',20,'minute',0,'sort_order',5,'source_external_id','QA-AUTO-PRE','servings',1),
      jsonb_build_object('slot_key','post_workout','slot_label','بعد التمرين','time_label','22:00','hour',22,'minute',0,'sort_order',6,'source_external_id','QA-AUTO-POST','servings',1)
    )
  );

  PERFORM set_config('request.jwt.claim.sub', v_user::text, true);

  v_unsafe := public.client_auto_assign_my_nutrition(
    jsonb_set(v_payload, '{slots,0,source_external_id}', '"QA-AUTO-LUNCH"'::jsonb)
  );
  IF v_unsafe->>'reason' <> 'unsafe_slot_meal'
     OR v_unsafe->>'failed_slot' <> 'breakfast'
     OR v_unsafe->>'failed_meal_id' <> 'QA-AUTO-LUNCH' THEN
    RAISE EXCEPTION 'unsafe slot detail missing: %', v_unsafe;
  END IF;
  SELECT count(*) INTO v_count
  FROM public.nutrition_decision_traces
  WHERE client_id = v_user
    AND reason = 'ASSIGNMENT_FAILED'
    AND metadata->>'failure_reason' = 'unsafe_slot_meal'
    AND metadata->>'failed_slot' = 'breakfast';
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'admin failure trace missing: %', v_count;
  END IF;

  v_created := public.client_auto_assign_my_nutrition(v_payload);
  IF COALESCE((v_created->>'created')::boolean, false) IS NOT TRUE
     OR (v_created->>'meal_count')::integer <> 6 THEN
    RAISE EXCEPTION 'assignment not created: %', v_created;
  END IF;

  v_replay := public.client_auto_assign_my_nutrition(v_payload);
  IF v_replay->>'reason' <> 'already_assigned' THEN
    RAISE EXCEPTION 'idempotency failed: %', v_replay;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.client_nutrition_assignments
  WHERE client_id = v_user AND status IN ('active','scheduled','draft');
  IF v_count <> 1 THEN RAISE EXCEPTION 'assignment duplicate count: %', v_count; END IF;

  SELECT count(*) INTO v_count
  FROM public.client_nutrition_slots
  WHERE assignment_id = (v_created->>'assignment_id')::uuid;
  IF v_count <> 6 THEN RAISE EXCEPTION 'slot count: %', v_count; END IF;

  SELECT count(*) INTO v_count
  FROM public.client_nutrition_slots
  WHERE assignment_id = (v_created->>'assignment_id')::uuid
    AND slot_key IN ('pre_workout','post_workout');
  IF v_count <> 2 THEN RAISE EXCEPTION 'pre/post count: %', v_count; END IF;

  RAISE NOTICE 'AUTO_ASSIGN_P0 PASS created=% replay=% unsafe=%', v_created, v_replay, v_unsafe;
END $$;

ROLLBACK;
