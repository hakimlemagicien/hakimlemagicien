-- Onboarding SQL/RLS Test Plan
-- This script is intended for a non-production Supabase environment.
-- It validates RPC contracts, draft token behavior, idempotent finalization,
-- free membership/profile uniqueness, and first-login state.

DO $$
DECLARE
  v_user_a UUID := gen_random_uuid();
  v_user_b UUID := gen_random_uuid();
  v_admin UUID := gen_random_uuid();
  v_instance_id UUID;
  v_draft JSONB;
  v_updated JSONB;
  v_finalized JSONB;
  v_finalized_again JSONB;
  v_state JSONB;
  v_membership JSONB;
  v_seen JSONB;
  v_token TEXT;
  v_expired_token TEXT;
  v_count INT;
BEGIN
  SELECT instance_id INTO v_instance_id FROM auth.users LIMIT 1;
  IF v_instance_id IS NULL THEN
    RAISE EXCEPTION 'auth.users instance_id unavailable for test setup';
  END IF;

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES
    (v_user_a, v_instance_id, 'authenticated', 'authenticated', 'onboarding-a@example.test', crypt('password123', gen_salt('bf')), now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    (v_user_b, v_instance_id, 'authenticated', 'authenticated', 'onboarding-b@example.test', crypt('password123', gen_salt('bf')), now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    (v_admin, v_instance_id, 'authenticated', 'authenticated', 'onboarding-admin@example.test', crypt('password123', gen_salt('bf')), now(), '{}'::jsonb, '{}'::jsonb, now(), now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_admin, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

  PERFORM set_config('role', 'anon', true);
  v_draft := public.create_onboarding_draft('{"email":"onboarding-a@example.test","full_name":"Client A","goal":"fat_loss","answers":{"height":180}}'::jsonb);
  v_token := v_draft->>'draft_token';
  IF v_token IS NULL OR length(v_token) < 32 THEN
    RAISE EXCEPTION 'create_onboarding_draft failed: %', v_draft;
  END IF;

  -- Correct token update.
  v_updated := public.update_onboarding_draft(v_token, '{"phone":"+971500000000","city":"Dubai","training_type":"gym"}'::jsonb);
  IF v_updated->>'status' <> 'draft' THEN
    RAISE EXCEPTION 'update_onboarding_draft failed: %', v_updated;
  END IF;

  -- Wrong token must fail.
  BEGIN
    PERFORM public.update_onboarding_draft('wrong-token', '{}'::jsonb);
    RAISE EXCEPTION 'wrong draft token unexpectedly accepted';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  -- Expired draft must fail.
  v_draft := public.create_onboarding_draft('{"email":"expired@example.test","expires_at":"2000-01-01T00:00:00Z"}'::jsonb);
  v_expired_token := v_draft->>'draft_token';
  BEGIN
    PERFORM public.update_onboarding_draft(v_expired_token, '{"city":"Rabat"}'::jsonb);
    RAISE EXCEPTION 'expired draft unexpectedly accepted';
  EXCEPTION WHEN invalid_parameter_value THEN
    NULL;
  END;

  -- Authenticated finalization.
  PERFORM set_config('request.jwt.claim.sub', v_user_a::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('role', 'authenticated', true);
  v_finalized := public.finalize_onboarding(v_token);
  IF (v_finalized->>'tier') <> 'free' THEN
    RAISE EXCEPTION 'finalize_onboarding did not create free tier: %', v_finalized;
  END IF;

  -- Idempotent finalization: no duplicate free membership/profile.
  v_finalized_again := public.finalize_onboarding(v_token);

  SELECT COUNT(*) INTO v_count FROM public.memberships WHERE user_id = v_user_a AND tier = 'free';
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'duplicate free membership detected: %', v_count;
  END IF;

  SELECT COUNT(*) INTO v_count FROM public.training_profiles WHERE user_id = v_user_a;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'duplicate training profile detected: %', v_count;
  END IF;

  v_state := public.get_my_onboarding_state();
  IF COALESCE((v_state->>'has_training_profile')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'get_my_onboarding_state failed: %', v_state;
  END IF;

  v_seen := public.mark_first_login_seen();
  IF COALESCE((v_seen->>'first_login_seen')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'mark_first_login_seen failed: %', v_seen;
  END IF;

  v_membership := public.get_my_membership();
  IF v_membership->>'tier' <> 'free' OR COALESCE((v_membership->>'is_active')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'get_my_membership failed: %', v_membership;
  END IF;

  -- Other user has isolated onboarding state.
  PERFORM set_config('request.jwt.claim.sub', v_user_b::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('role', 'authenticated', true);
  v_state := public.get_my_onboarding_state();
  IF COALESCE((v_state->>'has_training_profile')::boolean, false) IS TRUE THEN
    RAISE EXCEPTION 'RLS/state isolation failed for other user: %', v_state;
  END IF;

  -- Cleanup is best-effort; auth.users is managed by Supabase Auth.
  BEGIN
    DELETE FROM public.onboarding_drafts WHERE email IN ('onboarding-a@example.test', 'expired@example.test');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RAISE NOTICE 'onboarding_sql_rls_test_plan passed';
END $$;
