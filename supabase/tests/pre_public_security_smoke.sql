-- PRE-PUBLIC SECURITY — disposable local/staging verification only.
\set ON_ERROR_STOP on
\pset pager off

BEGIN;

DO $$
DECLARE
  v_client UUID := '20000000-0000-0000-0000-000000000002';
  v_allowed BOOLEAN := false;
BEGIN
  IF has_function_privilege('anon', 'public.has_role(uuid,public.app_role)', 'execute') THEN
    RAISE EXCEPTION 'anon can execute has_role(uuid, app_role)';
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.has_role(uuid,public.app_role)', 'execute') THEN
    RAISE EXCEPTION 'authenticated cannot execute required has_role(uuid, app_role)';
  END IF;

  IF to_regprocedure('public.has_role(uuid,text)') IS NOT NULL THEN
    IF has_function_privilege('anon', 'public.has_role(uuid,text)', 'execute') THEN
      RAISE EXCEPTION 'anon can execute has_role(uuid, text)';
    END IF;
    IF NOT has_function_privilege('authenticated', 'public.has_role(uuid,text)', 'execute') THEN
      RAISE EXCEPTION 'authenticated cannot execute required has_role(uuid, text)';
    END IF;
  END IF;

  IF has_function_privilege('anon', 'public.apply_provider_subscription_event(jsonb)', 'execute')
     OR has_function_privilege('authenticated', 'public.apply_provider_subscription_event(jsonb)', 'execute') THEN
    RAISE EXCEPTION 'provider webhook RPC is exposed to an untrusted role';
  END IF;
  IF NOT has_function_privilege('service_role', 'public.apply_provider_subscription_event(jsonb)', 'execute') THEN
    RAISE EXCEPTION 'service_role cannot execute provider webhook RPC';
  END IF;

  IF to_regprocedure('public.client_auto_assign_my_nutrition(jsonb)') IS NULL THEN
    RAISE EXCEPTION 'client nutrition auto-assign RPC is missing';
  END IF;
  IF has_function_privilege('anon', 'public.client_auto_assign_my_nutrition(jsonb)', 'execute')
     OR NOT has_function_privilege('authenticated', 'public.client_auto_assign_my_nutrition(jsonb)', 'execute') THEN
    RAISE EXCEPTION 'client nutrition auto-assign RPC grants are incorrect';
  END IF;
  IF has_function_privilege('anon', 'public._record_nutrition_auto_assign_failure(uuid,text,jsonb)', 'execute')
     OR has_function_privilege('authenticated', 'public._record_nutrition_auto_assign_failure(uuid,text,jsonb)', 'execute')
     OR NOT has_function_privilege('service_role', 'public._record_nutrition_auto_assign_failure(uuid,text,jsonb)', 'execute') THEN
    RAISE EXCEPTION 'nutrition auto-assign failure trace grants are incorrect';
  END IF;

  IF has_table_privilege('anon', 'public.product_runtime_settings', 'select')
     OR has_table_privilege('authenticated', 'public.product_runtime_settings', 'select') THEN
    RAISE EXCEPTION 'runtime settings table is directly readable by an untrusted role';
  END IF;

  INSERT INTO auth.users (id, email, aud, role)
  VALUES (v_client, 'security-client@example.test', 'authenticated', 'authenticated')
  ON CONFLICT (id) DO NOTHING;

  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_client::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  BEGIN
    PERFORM public.admin_save_runtime_settings(jsonb_build_object('checkout_paused', true));
    v_allowed := true;
  EXCEPTION
    WHEN insufficient_privilege THEN v_allowed := false;
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%permission denied%' OR SQLERRM LIKE '%admin_required%' THEN
        v_allowed := false;
      ELSE
        RAISE;
      END IF;
  END;
  RESET ROLE;

  IF v_allowed THEN
    RAISE EXCEPTION 'normal authenticated user executed admin_save_runtime_settings';
  END IF;

  RAISE NOTICE 'PRE-PUBLIC SECURITY SMOKE PASS';
END;
$$;

ROLLBACK;
