-- MAAKFIT Admin — audited internal membership override.
-- Grants app entitlement only. Never writes payment/provider truth.

CREATE OR REPLACE FUNCTION public.admin_get_staff_session()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := public._require_admin();
  v_role public.staff_role := public.resolve_staff_role(v_uid);
BEGIN
  RETURN jsonb_build_object(
    'user_id', v_uid,
    'staff_role', v_role::text,
    'permissions', (
      SELECT COALESCE(jsonb_agg(perm ORDER BY perm), '[]'::jsonb)
      FROM (
        SELECT unnest(ARRAY[
          'clients.read', 'clients.basic_read', 'clients.write', 'client_notes.write',
          'training.manage', 'nutrition.manage', 'exercise.read', 'exercise.content_edit',
          'exercise.safety_edit', 'meal_library.manage', 'meal.safety_edit',
          'membership.read', 'memberships.manage', 'payments.read',
          'legacy_payments.manage', 'payment_audit.read', 'content.manage',
          'support.manage', 'messages.manage', 'progress.read', 'audit.read',
          'staff.manage'
        ]) AS perm
      ) p
      WHERE public.staff_has_permission(v_uid, p.perm)
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_apply_membership_override(
  p_client_id UUID,
  p_tier TEXT,
  p_billing_period_months SMALLINT DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_tier TEXT := lower(btrim(COALESCE(p_tier, '')));
  v_reason TEXT := btrim(COALESCE(p_reason, ''));
  v_current public.memberships%ROWTYPE;
  v_target public.memberships%ROWTYPE;
  v_result public.memberships%ROWTYPE;
  v_end TIMESTAMPTZ;
BEGIN
  v_admin := public._require_staff_permission('memberships.manage');

  IF p_client_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_client_id
  ) THEN
    RAISE EXCEPTION 'invalid_client' USING ERRCODE = '22023';
  END IF;

  IF v_tier NOT IN ('free', 'essential', 'premium', 'vip') THEN
    RAISE EXCEPTION 'invalid_membership_tier' USING ERRCODE = '22023';
  END IF;

  IF char_length(v_reason) < 5 THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE = '22023';
  END IF;

  IF v_tier <> 'free' AND COALESCE(p_billing_period_months, 0) NOT IN (3, 6) THEN
    RAISE EXCEPTION 'invalid_billing_period' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_current
  FROM public.memberships
  WHERE user_id = p_client_id AND is_active = true
  ORDER BY starts_at DESC
  LIMIT 1
  FOR UPDATE;

  IF FOUND AND (
    v_current.provider_subscription_id IS NOT NULL
    OR (
      v_current.provider IS NOT NULL
      AND lower(v_current.provider) NOT IN ('admin_override', 'manual', 'legacy', 'founder_review')
    )
  ) THEN
    RAISE EXCEPTION 'active_psp_subscription' USING ERRCODE = '55000';
  END IF;

  SELECT *
  INTO v_target
  FROM public.memberships
  WHERE user_id = p_client_id AND tier = v_tier
  FOR UPDATE;

  IF FOUND AND (
    v_target.provider_subscription_id IS NOT NULL
    OR v_target.provider_customer_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'provider_history_conflict' USING ERRCODE = '55000';
  END IF;

  v_end := CASE
    WHEN v_tier = 'free' THEN NULL
    ELSE now() + make_interval(months => p_billing_period_months)
  END;

  UPDATE public.memberships
  SET is_active = false, updated_at = now()
  WHERE user_id = p_client_id AND is_active = true;

  INSERT INTO public.memberships (
    user_id,
    tier,
    is_active,
    source,
    starts_at,
    ends_at,
    billing_period_months,
    price_amount,
    currency,
    auto_renew,
    cancel_at_period_end,
    next_renewal_at,
    paid_period_end,
    payment_succeeded_at,
    subscription_activated_at,
    premium_access_granted_at,
    provider,
    provider_customer_id,
    provider_subscription_id,
    subscription_status,
    current_period_start,
    current_period_end,
    updated_at
  )
  VALUES (
    p_client_id,
    v_tier,
    true,
    'admin_override',
    now(),
    v_end,
    CASE WHEN v_tier = 'free' THEN NULL ELSE p_billing_period_months END,
    NULL,
    'USD',
    false,
    false,
    NULL,
    v_end,
    NULL,
    NULL,
    CASE WHEN v_tier IN ('premium', 'vip') THEN now() ELSE NULL END,
    NULL,
    NULL,
    NULL,
    CASE WHEN v_tier = 'free' THEN NULL ELSE 'active'::public.subscription_status END,
    CASE WHEN v_tier = 'free' THEN NULL ELSE now() END,
    v_end,
    now()
  )
  ON CONFLICT (user_id, tier) DO UPDATE
  SET
    is_active = true,
    source = 'admin_override',
    starts_at = now(),
    ends_at = EXCLUDED.ends_at,
    billing_period_months = EXCLUDED.billing_period_months,
    price_amount = NULL,
    currency = 'USD',
    auto_renew = false,
    cancel_at_period_end = false,
    next_renewal_at = NULL,
    paid_period_end = EXCLUDED.paid_period_end,
    payment_succeeded_at = NULL,
    subscription_activated_at = NULL,
    premium_access_granted_at = EXCLUDED.premium_access_granted_at,
    provider = NULL,
    provider_customer_id = NULL,
    provider_subscription_id = NULL,
    subscription_status = EXCLUDED.subscription_status,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    suspended_at = NULL,
    suspension_reason = NULL,
    suspended_by = NULL,
    updated_at = now()
  RETURNING * INTO v_result;

  PERFORM public._write_audit_event(
    v_admin,
    p_client_id,
    'membership_admin_override',
    jsonb_build_object(
      'membership_id', v_result.id,
      'before_tier', v_current.tier,
      'after_tier', v_result.tier,
      'before_ends_at', v_current.ends_at,
      'after_ends_at', v_result.ends_at,
      'billing_period_months', v_result.billing_period_months,
      'source', 'admin_override',
      'payment_truth', 'not_psp',
      'reason', left(v_reason, 1000)
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'client_id', p_client_id,
    'membership_id', v_result.id,
    'previous_tier', v_current.tier,
    'tier', v_result.tier,
    'ends_at', v_result.ends_at,
    'billing_period_months', v_result.billing_period_months,
    'source', v_result.source
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_apply_membership_override(UUID, TEXT, SMALLINT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_apply_membership_override(UUID, TEXT, SMALLINT, TEXT)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.admin_apply_membership_override(UUID, TEXT, SMALLINT, TEXT)
  IS 'Super-admin-only audited internal entitlement override. Does not create payments or edit PSP truth.';
