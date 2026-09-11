-- Prefer quiz/onboarding draft full_name over existing OAuth (Google/Apple) profile name.

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
    full_name = COALESCE(NULLIF(btrim(EXCLUDED.full_name), ''), public.training_profiles.full_name),
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
    full_name = COALESCE(NULLIF(btrim(EXCLUDED.full_name), ''), public.profiles.full_name),
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
