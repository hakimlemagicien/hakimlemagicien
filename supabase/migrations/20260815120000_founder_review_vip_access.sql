-- Founder app-review account: full VIP features + admin role for Hakimlemagicien@gmail.com

CREATE OR REPLACE FUNCTION public.is_founder_review_email(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(trim(coalesce(p_email, ''))) = lower('Hakimlemagicien@gmail.com');
$$;

CREATE OR REPLACE FUNCTION public.grant_founder_review_access(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  IF NOT public.is_founder_review_email(v_email) THEN
    RETURN;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.memberships
  SET is_active = false, updated_at = now()
  WHERE user_id = p_user_id AND tier <> 'vip';

  INSERT INTO public.memberships (user_id, tier, is_active, source, starts_at, ends_at)
  VALUES (
    p_user_id,
    'vip',
    true,
    'founder_review',
    now(),
    now() + interval '10 years'
  )
  ON CONFLICT (user_id, tier) DO UPDATE SET
    is_active = true,
    source = 'founder_review',
    starts_at = COALESCE(public.memberships.starts_at, now()),
    ends_at = now() + interval '10 years',
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'phone')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  PERFORM public.grant_founder_review_access(NEW.id);

  RETURN NEW;
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
  v_email TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'tier', 'free', 'is_free', true, 'is_paid', false, 'is_active', true,
      'subscription_id', NULL, 'starts_at', NULL, 'ends_at', NULL, 'days_remaining', 0,
      'features', (SELECT features FROM public.membership_tiers WHERE tier = 'free')
    );
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  IF public.is_founder_review_email(v_email) THEN
    PERFORM public.grant_founder_review_access(v_user_id);
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

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower('Hakimlemagicien@gmail.com')
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    PERFORM public.grant_founder_review_access(v_user_id);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.is_founder_review_email(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.grant_founder_review_access(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_founder_review_access(UUID) TO service_role;
