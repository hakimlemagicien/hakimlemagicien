-- Onboarding RPC contract. Public draft RPCs use a draft token; user RPCs use auth.uid().

CREATE OR REPLACE FUNCTION public.read_onboarding_draft_by_token(p_draft_token TEXT)
RETURNS public.onboarding_drafts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draft public.onboarding_drafts;
BEGIN
  IF p_draft_token IS NULL OR length(trim(p_draft_token)) = 0 THEN
    RAISE EXCEPTION 'invalid_draft_token' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_draft
  FROM public.onboarding_drafts
  WHERE draft_token = p_draft_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_draft_token' USING ERRCODE = '42501';
  END IF;

  IF v_draft.status = 'draft' AND v_draft.expires_at <= now() THEN
    UPDATE public.onboarding_drafts
    SET status = 'expired', updated_at = now()
    WHERE id = v_draft.id
    RETURNING * INTO v_draft;
  END IF;

  IF v_draft.status = 'expired' THEN
    RAISE EXCEPTION 'draft_expired' USING ERRCODE = '22023';
  END IF;

  RETURN v_draft;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_onboarding_draft(p_payload JSONB DEFAULT '{}'::jsonb)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_draft public.onboarding_drafts;
BEGIN
  INSERT INTO public.onboarding_drafts (
    email, full_name, phone, country, city, goal, training_type, location_preference, answers, avatar_path, expires_at
  ) VALUES (
    lower(NULLIF(trim(p_payload->>'email'), '')),
    NULLIF(trim(p_payload->>'full_name'), ''),
    NULLIF(trim(p_payload->>'phone'), ''),
    NULLIF(trim(p_payload->>'country'), ''),
    NULLIF(trim(p_payload->>'city'), ''),
    NULLIF(trim(p_payload->>'goal'), ''),
    NULLIF(trim(p_payload->>'training_type'), ''),
    NULLIF(trim(p_payload->>'location_preference'), ''),
    COALESCE(p_payload->'answers', '{}'::jsonb),
    NULLIF(trim(p_payload->>'avatar_path'), ''),
    COALESCE(NULLIF(p_payload->>'expires_at', '')::timestamptz, now() + interval '24 hours')
  )
  RETURNING * INTO v_draft;

  RETURN jsonb_build_object(
    'draft_id', v_draft.id,
    'draft_token', v_draft.draft_token,
    'expires_at', v_draft.expires_at,
    'status', v_draft.status
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_onboarding_draft(
  p_draft_token TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draft public.onboarding_drafts;
BEGIN
  v_draft := public.read_onboarding_draft_by_token(p_draft_token);

  IF v_draft.status <> 'draft' THEN
    RAISE EXCEPTION 'draft_not_editable' USING ERRCODE = '22023';
  END IF;

  UPDATE public.onboarding_drafts
  SET
    email = COALESCE(lower(NULLIF(trim(p_payload->>'email'), '')), email),
    full_name = COALESCE(NULLIF(trim(p_payload->>'full_name'), ''), full_name),
    phone = COALESCE(NULLIF(trim(p_payload->>'phone'), ''), phone),
    country = COALESCE(NULLIF(trim(p_payload->>'country'), ''), country),
    city = COALESCE(NULLIF(trim(p_payload->>'city'), ''), city),
    goal = COALESCE(NULLIF(trim(p_payload->>'goal'), ''), goal),
    training_type = COALESCE(NULLIF(trim(p_payload->>'training_type'), ''), training_type),
    location_preference = COALESCE(NULLIF(trim(p_payload->>'location_preference'), ''), location_preference),
    avatar_path = COALESCE(NULLIF(trim(p_payload->>'avatar_path'), ''), avatar_path),
    answers = COALESCE(p_payload->'answers', answers),
    updated_at = now()
  WHERE id = v_draft.id
  RETURNING * INTO v_draft;

  RETURN jsonb_build_object(
    'draft_id', v_draft.id,
    'draft_token', v_draft.draft_token,
    'email', v_draft.email,
    'status', v_draft.status,
    'expires_at', v_draft.expires_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_onboarding(p_draft_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_draft public.onboarding_drafts;
  v_profile_id UUID;
  v_membership_id UUID;
  v_profile_inserted BOOLEAN := false;
  v_membership_inserted BOOLEAN := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  v_draft := public.read_onboarding_draft_by_token(p_draft_token);

  INSERT INTO public.training_profiles (
    user_id, onboarding_draft_id, full_name, phone, country, city, goal, training_type,
    location_preference, avatar_path, answers, completed_at
  ) VALUES (
    v_user_id, v_draft.id, v_draft.full_name, v_draft.phone, v_draft.country, v_draft.city,
    v_draft.goal, v_draft.training_type, v_draft.location_preference, v_draft.avatar_path,
    v_draft.answers, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    onboarding_draft_id = COALESCE(public.training_profiles.onboarding_draft_id, EXCLUDED.onboarding_draft_id),
    full_name = COALESCE(public.training_profiles.full_name, EXCLUDED.full_name),
    phone = COALESCE(public.training_profiles.phone, EXCLUDED.phone),
    country = COALESCE(public.training_profiles.country, EXCLUDED.country),
    city = COALESCE(public.training_profiles.city, EXCLUDED.city),
    goal = COALESCE(public.training_profiles.goal, EXCLUDED.goal),
    training_type = COALESCE(public.training_profiles.training_type, EXCLUDED.training_type),
    location_preference = COALESCE(public.training_profiles.location_preference, EXCLUDED.location_preference),
    avatar_path = COALESCE(public.training_profiles.avatar_path, EXCLUDED.avatar_path),
    answers = CASE WHEN public.training_profiles.answers = '{}'::jsonb THEN EXCLUDED.answers ELSE public.training_profiles.answers END,
    updated_at = now()
  RETURNING id, (xmax = 0) INTO v_profile_id, v_profile_inserted;

  INSERT INTO public.memberships (user_id, tier, is_active, source, starts_at)
  VALUES (v_user_id, 'free', true, 'onboarding', now())
  ON CONFLICT (user_id, tier) DO UPDATE SET
    is_active = public.memberships.is_active,
    updated_at = public.memberships.updated_at
  RETURNING id, (xmax = 0) INTO v_membership_id, v_membership_inserted;

  INSERT INTO public.profiles (
    id, email, full_name, phone, country, city, goal, training_type, location_preference,
    avatar_path, onboarding_completed_at
  ) VALUES (
    v_user_id, v_draft.email, v_draft.full_name, v_draft.phone, v_draft.country, v_draft.city,
    v_draft.goal, v_draft.training_type, v_draft.location_preference, v_draft.avatar_path, now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(public.profiles.email, EXCLUDED.email),
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
    country = COALESCE(public.profiles.country, EXCLUDED.country),
    city = COALESCE(public.profiles.city, EXCLUDED.city),
    goal = COALESCE(public.profiles.goal, EXCLUDED.goal),
    training_type = COALESCE(public.profiles.training_type, EXCLUDED.training_type),
    location_preference = COALESCE(public.profiles.location_preference, EXCLUDED.location_preference),
    avatar_path = COALESCE(public.profiles.avatar_path, EXCLUDED.avatar_path),
    onboarding_completed_at = COALESCE(public.profiles.onboarding_completed_at, EXCLUDED.onboarding_completed_at),
    updated_at = now();

  UPDATE public.onboarding_drafts
  SET status = 'finalized', finalized_user_id = v_user_id, finalized_at = COALESCE(finalized_at, now()), updated_at = now()
  WHERE id = v_draft.id;

  RETURN jsonb_build_object(
    'user_id', v_user_id,
    'training_profile_id', v_profile_id,
    'membership_id', v_membership_id,
    'tier', 'free',
    'is_new_training_profile', v_profile_inserted,
    'is_new_membership', v_membership_inserted
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_membership()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_membership public.memberships;
  v_tier public.membership_tiers;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'tier', 'free', 'is_free', true, 'is_paid', false, 'is_active', true,
      'subscription_id', NULL, 'starts_at', NULL, 'ends_at', NULL, 'days_remaining', 0,
      'features', (SELECT features FROM public.membership_tiers WHERE tier = 'free')
    );
  END IF;

  SELECT * INTO v_membership
  FROM public.memberships
  WHERE user_id = v_user_id AND is_active = true
  ORDER BY starts_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    SELECT * INTO v_tier FROM public.membership_tiers WHERE tier = 'free';
    RETURN jsonb_build_object(
      'tier', 'free', 'is_free', true, 'is_paid', false, 'is_active', true,
      'subscription_id', NULL, 'starts_at', NULL, 'ends_at', NULL, 'days_remaining', 0,
      'features', COALESCE(v_tier.features, '{}'::jsonb)
    );
  END IF;

  SELECT * INTO v_tier FROM public.membership_tiers WHERE tier = v_membership.tier;

  RETURN jsonb_build_object(
    'tier', v_membership.tier,
    'is_free', COALESCE(v_tier.is_free, v_membership.tier = 'free'),
    'is_paid', NOT COALESCE(v_tier.is_free, v_membership.tier = 'free'),
    'is_active', v_membership.is_active,
    'subscription_id', v_membership.id,
    'starts_at', v_membership.starts_at,
    'ends_at', v_membership.ends_at,
    'days_remaining', CASE
      WHEN v_membership.ends_at IS NULL THEN 0
      ELSE GREATEST(0, CEIL(EXTRACT(EPOCH FROM (v_membership.ends_at - now())) / 86400)::int)
    END,
    'features', COALESCE(v_tier.features, '{}'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_onboarding_state()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_profile public.training_profiles;
  v_seen_at TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_profile FROM public.training_profiles WHERE user_id = v_user_id;
  SELECT first_login_seen_at INTO v_seen_at FROM public.profiles WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'has_training_profile', v_profile.id IS NOT NULL,
    'training_profile_id', v_profile.id,
    'onboarding_completed', v_profile.id IS NOT NULL,
    'first_login_seen', v_seen_at IS NOT NULL,
    'first_login_seen_at', v_seen_at,
    'avatar_path', COALESCE(v_profile.avatar_path, (SELECT avatar_path FROM public.profiles WHERE id = v_user_id))
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_first_login_seen()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_seen_at TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.profiles (id, first_login_seen_at)
  VALUES (v_user_id, now())
  ON CONFLICT (id) DO UPDATE SET
    first_login_seen_at = COALESCE(public.profiles.first_login_seen_at, EXCLUDED.first_login_seen_at),
    updated_at = now()
  RETURNING first_login_seen_at INTO v_seen_at;

  RETURN jsonb_build_object('first_login_seen', true, 'first_login_seen_at', v_seen_at);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.read_onboarding_draft_by_token(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_onboarding_draft(JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_onboarding_draft(TEXT, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.finalize_onboarding(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_membership() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_onboarding_state() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_first_login_seen() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_onboarding_draft(JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_onboarding_draft(TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_onboarding(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_membership() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_onboarding_state() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_first_login_seen() TO authenticated;
