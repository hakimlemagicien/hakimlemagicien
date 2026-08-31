-- Payments V1 P6 — member billing history + admin operational read models.
-- STAGING-first. No provider webhook. No manual PSP truth mutation.

-- ---------------------------------------------------------------------------
-- Member payment history (read-only, no provider payloads)
-- ---------------------------------------------------------------------------

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
    COALESCE(p.tier, pl.name, 'unknown') AS tier,
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

-- ---------------------------------------------------------------------------
-- Admin member subscriptions (operational visibility)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_list_member_subscriptions(
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 25,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  tier TEXT,
  subscription_status TEXT,
  billing_period_months SMALLINT,
  price_amount NUMERIC,
  currency TEXT,
  auto_renew BOOLEAN,
  cancel_at_period_end BOOLEAN,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  next_renewal_at TIMESTAMPTZ,
  paid_period_end TIMESTAMPTZ,
  provider TEXT,
  is_active BOOLEAN,
  last_payment_status TEXT,
  last_payment_at TIMESTAMPTZ,
  exception_state TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 25), 1), 50);
  v_offset INTEGER := GREATEST(COALESCE(p_offset, 0), 0);
  v_search TEXT := NULLIF(btrim(COALESCE(p_search, '')), '');
BEGIN
  PERFORM public._require_admin();

  RETURN QUERY
  WITH latest_payment AS (
    SELECT DISTINCT ON (pay.user_id)
      pay.user_id,
      pay.status::text AS payment_status,
      COALESCE(pay.paid_at, pay.created_at) AS payment_at
    FROM public.payments pay
    ORDER BY pay.user_id, COALESCE(pay.paid_at, pay.created_at) DESC, pay.id DESC
  )
  SELECT
    m.user_id,
    u.email::text,
    COALESCE(pr.full_name, u.raw_user_meta_data ->> 'full_name')::text AS full_name,
    m.tier::text,
    COALESCE(m.subscription_status::text, CASE WHEN m.is_active THEN 'active' ELSE 'inactive' END) AS subscription_status,
    m.billing_period_months,
    m.price_amount,
    m.currency,
    m.auto_renew,
    m.cancel_at_period_end,
    m.current_period_start,
    COALESCE(m.current_period_end, m.paid_period_end, m.ends_at) AS current_period_end,
    m.next_renewal_at,
    COALESCE(m.paid_period_end, m.ends_at) AS paid_period_end,
    m.provider,
    m.is_active,
    lp.payment_status,
    lp.payment_at,
    CASE
      WHEN m.subscription_status = 'past_due' THEN 'past_due'
      WHEN m.cancel_at_period_end AND m.auto_renew = false THEN 'cancel_at_period_end'
      WHEN m.subscription_status = 'refunded' THEN 'refunded'
      WHEN NOT m.is_active AND m.tier <> 'free' THEN 'expired_or_inactive'
      ELSE NULL
    END::text AS exception_state
  FROM public.memberships m
  JOIN auth.users u ON u.id = m.user_id
  LEFT JOIN public.profiles pr ON pr.id = m.user_id
  LEFT JOIN latest_payment lp ON lp.user_id = m.user_id
  WHERE m.tier <> 'free'
    AND (
      v_search IS NULL
      OR u.email ILIKE '%' || v_search || '%'
      OR COALESCE(pr.full_name, '') ILIKE '%' || v_search || '%'
      OR m.tier::text ILIKE '%' || v_search || '%'
    )
  ORDER BY m.updated_at DESC NULLS LAST, m.starts_at DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

-- ---------------------------------------------------------------------------
-- Admin PSP / subscription payments (excludes legacy bank-transfer queue)
-- ---------------------------------------------------------------------------

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
    COALESCE(p.tier, pl.name) AS tier,
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

-- ---------------------------------------------------------------------------
-- Admin provider events (operational fields only — no raw payload)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_list_payment_provider_events(
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 25,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  provider TEXT,
  provider_event_id TEXT,
  event_type TEXT,
  processing_status TEXT,
  user_id UUID,
  email TEXT,
  received_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  error_code TEXT,
  error_summary TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 25), 1), 50);
  v_offset INTEGER := GREATEST(COALESCE(p_offset, 0), 0);
  v_status TEXT := NULLIF(btrim(COALESCE(p_status, '')), '');
BEGIN
  PERFORM public._require_admin();

  IF v_status IS NOT NULL AND v_status NOT IN ('received', 'processing', 'processed', 'failed', 'skipped') THEN
    RAISE EXCEPTION 'invalid_status' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT
    e.id,
    e.provider,
    e.provider_event_id,
    e.event_type,
    e.processing_status,
    e.user_id,
    u.email::text,
    e.received_at,
    e.processed_at,
    e.error_code,
    LEFT(COALESCE(e.error_message, ''), 240) AS error_summary
  FROM public.payment_provider_events e
  LEFT JOIN auth.users u ON u.id = e.user_id
  WHERE v_status IS NULL OR e.processing_status = v_status
  ORDER BY e.received_at DESC, e.id DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

-- ---------------------------------------------------------------------------
-- Admin payment exceptions (real operational states only)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_list_payment_exceptions()
RETURNS TABLE (
  exception_id TEXT,
  exception_type TEXT,
  priority TEXT,
  subject_label TEXT,
  detail TEXT,
  occurred_at TIMESTAMPTZ,
  href TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._require_admin();

  RETURN QUERY
  SELECT * FROM (
    SELECT
      ('legacy:' || l.id::text) AS exception_id,
      'legacy_bank_pending'::text AS exception_type,
      'high'::text AS priority,
      COALESCE(l.full_name, l.email, 'تحويل بنكي')::text AS subject_label,
      'تحويل بنكي بانتظار المراجعة'::text AS detail,
      l.created_at AS occurred_at,
      '/admin/payments?section=legacy'::text AS href
    FROM public.leads l
    WHERE l.payment_status = 'submitted'

    UNION ALL

    SELECT
      ('past_due:' || m.id::text),
      'subscription_past_due',
      'high',
      COALESCE(u.email, m.user_id::text),
      'اشتراك متأخر — يلزم متابعة مزود الدفع',
      m.updated_at,
      '/admin/memberships'
    FROM public.memberships m
    JOIN auth.users u ON u.id = m.user_id
    WHERE m.subscription_status = 'past_due'

    UNION ALL

    SELECT
      ('cancel_pending:' || m.id::text),
      'cancel_provider_pending',
      'normal',
      COALESCE(u.email, m.user_id::text),
      'طلب إيقاف تجديد بانتظار تأكيد المزود',
      m.updated_at,
      '/admin/memberships'
    FROM public.memberships m
    JOIN auth.users u ON u.id = m.user_id
    WHERE m.cancel_at_period_end = true
      AND m.auto_renew = false
      AND m.is_active = true

    UNION ALL

    SELECT
      ('provider_failed:' || e.id::text),
      'provider_event_failed',
      'high',
      COALESCE(e.event_type, e.provider),
      COALESCE(LEFT(e.error_message, 180), 'حدث مزود فشل في المعالجة'),
      e.received_at,
      '/admin/payments?section=provider-events'
    FROM public.payment_provider_events e
    WHERE e.processing_status = 'failed'

    UNION ALL

    SELECT
      ('refunded:' || m.id::text),
      'subscription_refunded',
      'normal',
      COALESCE(u.email, m.user_id::text),
      'اشتراك بحالة مسترد — للمراجعة التشغيلية',
      m.updated_at,
      '/admin/memberships'
    FROM public.memberships m
    JOIN auth.users u ON u.id = m.user_id
    WHERE m.subscription_status = 'refunded'
  ) q
  ORDER BY
    CASE q.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,
    q.occurred_at ASC NULLS LAST;
END;
$$;

-- ---------------------------------------------------------------------------
-- Command Center snapshot — extend with PSP/legacy separation
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_get_operations_snapshot()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._require_admin();
  RETURN jsonb_build_object(
    'unread_threads', (
      SELECT COUNT(*)::int
      FROM public.coaching_conversations c
      WHERE EXISTS (
        SELECT 1
        FROM public.coaching_messages msg
        WHERE msg.conversation_id = c.id
          AND msg.actor = 'member'
          AND (c.coach_last_read_at IS NULL OR msg.created_at > c.coach_last_read_at)
      )
    ),
    'waiting_threads', (
      SELECT COUNT(*)::int
      FROM public.coaching_conversations
      WHERE status = 'waiting_for_reply'
    ),
    'pending_payments', (
      SELECT COUNT(*)::int
      FROM public.leads
      WHERE payment_status = 'submitted'
    ),
    'legacy_pending_payments', (
      SELECT COUNT(*)::int
      FROM public.leads
      WHERE payment_status = 'submitted'
    ),
    'psp_failed_events', (
      SELECT COUNT(*)::int
      FROM public.payment_provider_events
      WHERE processing_status = 'failed'
    ),
    'subscription_attention', (
      SELECT COUNT(*)::int
      FROM public.memberships
      WHERE subscription_status = 'past_due'
         OR (cancel_at_period_end = true AND auto_renew = false AND is_active = true)
         OR subscription_status = 'refunded'
    ),
    'open_support', (
      SELECT COUNT(*)::int
      FROM public.support_tickets
      WHERE status IN ('received', 'in_review')
    )
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.get_my_payment_history(INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_member_subscriptions(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_psp_payments(INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_payment_provider_events(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_payment_exceptions() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_my_payment_history(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_member_subscriptions(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_psp_payments(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_payment_provider_events(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_payment_exceptions() TO authenticated;

COMMENT ON FUNCTION public.get_my_payment_history(INTEGER) IS 'Member read-only payment ledger. No provider payloads.';
COMMENT ON FUNCTION public.admin_list_member_subscriptions(TEXT, INTEGER, INTEGER) IS 'Admin operational subscription visibility. Read-only.';
COMMENT ON FUNCTION public.admin_list_psp_payments(INTEGER, INTEGER) IS 'PSP/subscription payments only. Legacy bank queue excluded.';
COMMENT ON FUNCTION public.admin_list_payment_provider_events(TEXT, INTEGER, INTEGER) IS 'Admin provider event operational view. Payload excluded.';
COMMENT ON FUNCTION public.admin_list_payment_exceptions() IS 'Exception queue from real data only. No invented incidents.';
