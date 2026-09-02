-- Founder/admin review account: keep admin role, switch entitlement from VIP to Premium.
-- Hakimlemagicien@gmail.com must not be re-forced to VIP on get_my_membership().

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
  WHERE user_id = p_user_id AND tier <> 'premium';

  INSERT INTO public.memberships (user_id, tier, is_active, source, starts_at, ends_at)
  VALUES (
    p_user_id,
    'premium',
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

REVOKE ALL ON FUNCTION public.grant_founder_review_access(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grant_founder_review_access(UUID) TO service_role;
