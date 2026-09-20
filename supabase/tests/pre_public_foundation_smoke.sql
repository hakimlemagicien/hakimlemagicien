-- PRE-PUBLIC FOUNDATION — local/data-bearing smoke checks.
-- Run only against a disposable local or staging database.
\set ON_ERROR_STOP on
\pset pager off

BEGIN;

DO $$
DECLARE
  v_admin UUID := '10000000-0000-0000-0000-000000000001';
  v_client UUID := '10000000-0000-0000-0000-000000000002';
  v_meal JSONB;
  v_provider JSONB;
  v_count INTEGER;
BEGIN
  INSERT INTO auth.users (id, email, aud, role)
  VALUES
    (v_admin, 'foundation-admin@example.test', 'authenticated', 'authenticated'),
    (v_client, 'foundation-client@example.test', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, email, goal)
  VALUES
    (v_admin, 'foundation-admin@example.test', 'fitness'),
    (v_client, 'foundation-client@example.test', 'bulk')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_admin, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

  PERFORM set_config('request.jwt.claim.sub', v_admin::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('role', 'authenticated', true);

  v_meal := public.admin_save_meal(
    jsonb_build_object(
      'external_id', 'FOUNDATION-MEAL-001',
      'name_ar', 'وجبة اختبار الإطلاق',
      'name_en', 'Launch foundation test meal',
      'meal_type', 'breakfast',
      'suitable_goals', jsonb_build_array('muscle_gain'),
      'dietary_tags', '[]'::jsonb,
      'allergens', jsonb_build_array('milk'),
      'calories', 420,
      'protein_g', 30,
      'carbs_g', 45,
      'fat_g', 12,
      'serving_size', 1,
      'serving_unit', 'serving',
      'ingredients', jsonb_build_array(
        jsonb_build_object(
          'ingredient_key', 'greek_yogurt',
          'name_ar', 'زبادي يوناني',
          'name_en', 'Greek yogurt',
          'quantity', 200,
          'unit', 'g',
          'kcal', 180,
          'protein_g', 20,
          'carbs_g', 8,
          'fat_g', 5
        )
      )
    ),
    NULL
  );

  IF v_meal->>'id' IS NULL THEN
    RAISE EXCEPTION 'admin_save_meal did not return a saved meal';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.meal_ingredients
  WHERE meal_id = (v_meal->>'id')::UUID;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'meal ingredient snapshot mismatch: %', v_count;
  END IF;

  RESET ROLE;

  v_provider := public.apply_provider_subscription_event(jsonb_build_object(
    'provider', 'paddle',
    'event_id', 'foundation-provider-event-001',
    'event_type', 'subscription.activated',
    'user_id', v_client::text,
    'tier', 'essential',
    'term_months', 3,
    'amount', 87,
    'currency', 'USD',
    'period_end', (now() + interval '90 days')::text
  ));

  IF v_provider->>'status' <> 'processed' THEN
    RAISE EXCEPTION 'provider activation failed: %', v_provider;
  END IF;

  v_provider := public.apply_provider_subscription_event(jsonb_build_object(
    'provider', 'paddle',
    'event_id', 'foundation-provider-event-001',
    'event_type', 'subscription.activated',
    'user_id', v_client::text,
    'tier', 'essential',
    'term_months', 3,
    'amount', 87,
    'currency', 'USD'
  ));

  IF v_provider->>'status' <> 'skipped' THEN
    RAISE EXCEPTION 'provider idempotency failed: %', v_provider;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.payments
  WHERE provider_event_id = 'foundation-provider-event-001';
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'provider payment duplication detected: %', v_count;
  END IF;

  RAISE NOTICE 'PRE-PUBLIC FOUNDATION DATA-BEARING SMOKE PASS';
END;
$$;

ROLLBACK;
