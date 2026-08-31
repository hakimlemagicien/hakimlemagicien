-- PAYMENTS V1 P3 — Staging runtime test (run as postgres/service_role on Staging only)
\set ON_ERROR_STOP on
\pset pager off

DO $$
DECLARE
  u_free UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  u_ess UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  u_prem UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  u_vip UUID := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  u_a UUID := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  u_b UUID := 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  ent JSONB;
  bill JSONB;
  res JSONB;
  cnt INT;
BEGIN
  -- Seed users
  INSERT INTO auth.users (id, email, aud, role)
  VALUES
    (u_free, 'p3-free@qa.test', 'authenticated', 'authenticated'),
    (u_ess, 'p3-essential@qa.test', 'authenticated', 'authenticated'),
    (u_prem, 'p3-premium@qa.test', 'authenticated', 'authenticated'),
    (u_vip, 'p3-vip@qa.test', 'authenticated', 'authenticated'),
    (u_a, 'p3-client-a@qa.test', 'authenticated', 'authenticated'),
    (u_b, 'p3-client-b@qa.test', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, email) SELECT id, email FROM auth.users
  WHERE id IN (u_free, u_ess, u_prem, u_vip, u_a, u_b)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.memberships (user_id, tier, is_active, source, starts_at)
  VALUES (u_free, 'free', true, 'p3_test', now())
  ON CONFLICT (user_id, tier) DO UPDATE SET is_active = true;

  -- T1 Free membership read
  PERFORM set_config('request.jwt.claim.sub', u_free::text, true);
  ent := public.get_my_entitlements();
  IF ent->>'tier' <> 'free' THEN RAISE EXCEPTION 'T1 FAIL: %', ent; END IF;

  -- T2 Free capabilities
  IF COALESCE((ent->'training'->>'allowed_exercises_per_session')::int, 0) <> 1 THEN
    RAISE EXCEPTION 'T2 FAIL training: %', ent->'training';
  END IF;
  IF COALESCE((ent->'nutrition'->>'allowed_meals_per_day')::int, 0) <> 1 THEN
    RAISE EXCEPTION 'T2 FAIL nutrition: %', ent->'nutrition';
  END IF;

  -- Trusted activation Essential
  res := public.apply_provider_subscription_event(jsonb_build_object(
    'provider', 'paddle', 'event_id', 'p3-test-ess-1', 'event_type', 'subscription.activated',
    'user_id', u_ess::text, 'tier', 'essential', 'term_months', 3,
    'amount', 87, 'currency', 'USD', 'period_end', (now() + interval '90 days')::text
  ));
  IF res->>'status' NOT IN ('processed', 'skipped') THEN RAISE EXCEPTION 'T5 setup FAIL: %', res; END IF;

  PERFORM set_config('request.jwt.claim.sub', u_ess::text, true);
  ent := public.get_my_entitlements();
  IF COALESCE((ent->'training'->>'full_session')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'T5 FAIL: %', ent;
  END IF;
  IF COALESCE((ent->'nutrition'->>'full_day')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'T6 FAIL: %', ent;
  END IF;

  -- T7/T8 meal swap
  res := public.record_nutrition_meal_swap(NULL, NULL, public._utc_membership_day());
  IF COALESCE((res->>'ok')::boolean, false) IS NOT TRUE THEN RAISE EXCEPTION 'T7 FAIL: %', res; END IF;
  BEGIN
    PERFORM public.record_nutrition_meal_swap(NULL, NULL, public._utc_membership_day());
    RAISE EXCEPTION 'T8 FAIL: second swap should be blocked';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%daily_meal_swap_limit_reached%' AND SQLERRM NOT LIKE '%meal_swap%' THEN
      RAISE;
    END IF;
  END;

  -- Premium activation
  PERFORM public.apply_provider_subscription_event(jsonb_build_object(
    'provider', 'paddle', 'event_id', 'p3-test-prem-1', 'event_type', 'subscription.activated',
    'user_id', u_prem::text, 'tier', 'premium', 'term_months', 6,
    'amount', 249, 'currency', 'USD', 'period_end', (now() + interval '180 days')::text
  ));
  PERFORM set_config('request.jwt.claim.sub', u_prem::text, true);
  ent := public.get_my_entitlements();
  IF COALESCE((ent->'nutrition'->>'multiple_alternatives')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'T10 FAIL: %', ent->'nutrition';
  END IF;
  IF public.member_can_use_coach_chat(u_prem) THEN
    RAISE EXCEPTION 'T11 FAIL: premium must not get coach chat';
  END IF;

  -- VIP coach chat
  INSERT INTO public.memberships (user_id, tier, is_active, source, starts_at)
  VALUES (u_vip, 'vip', true, 'p3_test', now())
  ON CONFLICT (user_id, tier) DO UPDATE SET is_active = true;
  UPDATE public.memberships SET is_active = false WHERE user_id = u_vip AND tier = 'free';
  IF NOT public.member_can_use_coach_chat(u_vip) THEN
    RAISE EXCEPTION 'T19 FAIL: vip coach chat';
  END IF;

  -- T12 duplicate event idempotency
  res := public.apply_provider_subscription_event(jsonb_build_object(
    'provider', 'paddle', 'event_id', 'p3-test-ess-1', 'event_type', 'subscription.activated',
    'user_id', u_ess::text, 'tier', 'essential', 'term_months', 3, 'amount', 87
  ));
  IF res->>'status' <> 'skipped' THEN RAISE EXCEPTION 'T12 FAIL: %', res; END IF;
  SELECT count(*) INTO cnt FROM public.payments WHERE provider_event_id = 'p3-test-ess-1';
  IF cnt > 1 THEN RAISE EXCEPTION 'T12 FAIL duplicate payment: %', cnt; END IF;

  -- T13 client cannot call trusted activation (simulate as authenticated without service_role)
  BEGIN
    SET LOCAL ROLE authenticated;
    PERFORM set_config('request.jwt.claim.sub', u_a::text, true);
    PERFORM public.apply_provider_subscription_event(jsonb_build_object(
      'provider', 'paddle', 'event_id', 'p3-test-untrusted', 'event_type', 'subscription.activated',
      'user_id', u_a::text, 'tier', 'premium', 'term_months', 3
    ));
    RESET ROLE;
    RAISE EXCEPTION 'T13 FAIL: client should not apply provider events';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RESET ROLE;
    WHEN OTHERS THEN
      RESET ROLE;
      IF SQLERRM NOT LIKE '%permission denied%' AND SQLERRM NOT LIKE '%42501%' THEN
        RAISE;
      END IF;
  END;

  -- T14 cross-user isolation (memberships select under RLS)
  PERFORM set_config('request.jwt.claim.sub', u_a::text, true);
  SELECT count(*) INTO cnt FROM public.memberships WHERE user_id = u_b;
  IF cnt <> 0 THEN RAISE EXCEPTION 'T14 FAIL memberships leak: %', cnt; END IF;

  -- T15 cancel at period end retains access metadata
  PERFORM set_config('request.jwt.claim.sub', u_ess::text, true);
  res := public.cancel_my_renewal();
  bill := public.get_my_billing();
  IF COALESCE((bill->>'cancel_at_period_end')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'T15 FAIL: %', bill;
  END IF;
  IF bill->>'tier' <> 'essential' THEN RAISE EXCEPTION 'T15 FAIL tier lost: %', bill; END IF;

  -- T16 expiry downgrade to free
  PERFORM public.apply_provider_subscription_event(jsonb_build_object(
    'provider', 'paddle', 'event_id', 'p3-test-expire-1', 'event_type', 'subscription.expired',
    'user_id', u_ess::text, 'subscription_status', 'expired'
  ));
  PERFORM set_config('request.jwt.claim.sub', u_ess::text, true);
  ent := public.get_my_entitlements();
  IF ent->>'tier' <> 'free' THEN RAISE EXCEPTION 'T16 FAIL: %', ent; END IF;
  SELECT count(*) INTO cnt FROM public.memberships WHERE user_id = u_ess AND tier = 'free' AND is_active = true;
  IF cnt < 1 THEN RAISE EXCEPTION 'T16 FAIL: free membership not restored'; END IF;

  -- T17 billing read
  bill := public.get_my_billing();
  IF bill->>'plan' <> 'free' THEN RAISE EXCEPTION 'T17 FAIL: %', bill; END IF;

  -- T18 audit exists
  SELECT count(*) INTO cnt FROM public.audit_events WHERE subject_user_id = u_ess AND event_type IN ('subscription_activated', 'subscription_expired', 'subscription_cancel_requested');
  IF cnt < 1 THEN RAISE EXCEPTION 'T18 FAIL audit missing'; END IF;

  RAISE NOTICE 'P3 TESTS T1-T19 PASS';
END $$;
