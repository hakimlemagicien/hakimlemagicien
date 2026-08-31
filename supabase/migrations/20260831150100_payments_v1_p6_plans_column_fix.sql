-- P6 hotfix: plans table uses tier_name, not name (Staging dxerwrdpcflpnjvsnrjq only chain)

CREATE OR REPLACE FUNCTION public.get_my_payment_history(p_limit INTEGER DEFAULT 25)
RETURNS TABLE (
  id UUID,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  tier TEXT,
  billing_period_months SMALLINT,
  amount NUMERIC,
  currency TEXT,
  status TEXT,
  provider TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 25), 1), 50);
BEGIN
  IF v_user IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.paid_at,
    p.created_at,
    COALESCE(p.tier, pl.tier_name, pl.tier_id, 'unknown') AS tier,
    p.billing_period_months,
    p.amount,
    p.currency,
    p.status::text,
    p.provider
  FROM public.payments p
  LEFT JOIN public.plans pl ON pl.id = p.plan_id
  WHERE p.user_id = v_user
  ORDER BY COALESCE(p.paid_at, p.created_at) DESC, p.id DESC
  LIMIT v_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_psp_payments(
  p_limit INTEGER DEFAULT 25,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  tier TEXT,
  billing_period_months SMALLINT,
  amount NUMERIC,
  currency TEXT,
  status TEXT,
  provider TEXT,
  provider_payment_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 25), 1), 50);
  v_offset INTEGER := GREATEST(COALESCE(p_offset, 0), 0);
BEGIN
  PERFORM public._require_admin();

  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    u.email::text,
    COALESCE(p.tier, pl.tier_name, pl.tier_id) AS tier,
    p.billing_period_months,
    p.amount,
    p.currency,
    p.status::text,
    p.provider,
    p.provider_payment_id,
    p.paid_at,
    p.created_at,
    p.refunded_at
  FROM public.payments p
  JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN public.plans pl ON pl.id = p.plan_id
  WHERE COALESCE(p.provider, '') NOT IN ('', 'manual')
    OR p.tier IS NOT NULL
    OR p.membership_id IS NOT NULL
  ORDER BY COALESCE(p.paid_at, p.created_at) DESC, p.id DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;
