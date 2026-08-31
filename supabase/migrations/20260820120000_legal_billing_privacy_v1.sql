-- MAAKFIT Legal, Pricing, Billing, Privacy & Support V1
-- Additive contract. No payment-provider integration. No invented legal entity.
-- Do not store full card numbers or CVV.

-- ---------------------------------------------------------------------------
-- 1. Membership billing + lifecycle (provider-neutral)
-- ---------------------------------------------------------------------------

ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS billing_period_months SMALLINT,
  ADD COLUMN IF NOT EXISTS price_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS next_renewal_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_succeeded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_activated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS premium_access_granted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS personal_program_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS personal_program_delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_renewal_reminder_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspended_by UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_billing_period_months_chk'
  ) THEN
    ALTER TABLE public.memberships
      ADD CONSTRAINT memberships_billing_period_months_chk
      CHECK (billing_period_months IS NULL OR billing_period_months IN (3, 6));
  END IF;
END $$;

UPDATE public.memberships
SET paid_period_end = COALESCE(paid_period_end, ends_at)
WHERE paid_period_end IS NULL AND ends_at IS NOT NULL;

-- Essential: program + tracking, no coaching chat.
-- Premium: coaching chat + biweekly review.
-- VIP: coaching chat + priority daily support (not 24/7).
UPDATE public.membership_tiers
SET
  features = CASE tier
    WHEN 'free' THEN '{"platform_access":true,"workout_program":false,"nutrition_plan":false,"progress_tracking":false,"free_content":true,"periodic_reviews":false,"limited_coach_contact":false,"personal_followup":false,"program_adjustments":false,"priority_contact":false}'::jsonb
    WHEN 'essential' THEN '{"platform_access":true,"workout_program":true,"nutrition_plan":true,"progress_tracking":true,"free_content":true,"periodic_reviews":false,"limited_coach_contact":false,"personal_followup":false,"program_adjustments":false,"priority_contact":false}'::jsonb
    WHEN 'premium' THEN '{"platform_access":true,"workout_program":true,"nutrition_plan":true,"progress_tracking":true,"free_content":true,"periodic_reviews":true,"limited_coach_contact":true,"personal_followup":true,"program_adjustments":true,"priority_contact":false}'::jsonb
    WHEN 'vip' THEN '{"platform_access":true,"workout_program":true,"nutrition_plan":true,"progress_tracking":true,"free_content":true,"periodic_reviews":true,"limited_coach_contact":true,"personal_followup":true,"program_adjustments":true,"priority_contact":true}'::jsonb
    ELSE features
  END,
  updated_at = now()
WHERE tier IN ('free', 'essential', 'premium', 'vip');

CREATE OR REPLACE FUNCTION public.member_can_use_coach_chat(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR COALESCE((
      SELECT m.tier IN ('premium', 'vip')
      FROM public.memberships m
      WHERE m.user_id = _user_id AND m.is_active = true
      ORDER BY m.starts_at DESC
      LIMIT 1
    ), false);
$$;

-- ---------------------------------------------------------------------------
-- 2. Consent / policy versions (append-only)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.policy_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  policy TEXT NOT NULL,
  version TEXT NOT NULL,
  language TEXT,
  plan TEXT,
  billing_period_months SMALLINT,
  amount NUMERIC(10,2),
  currency TEXT,
  consent_text TEXT,
  checkout_disclosure_version TEXT,
  renewal_disclosure_version TEXT,
  source TEXT NOT NULL DEFAULT 'app',
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS policy_acceptances_user_idx
  ON public.policy_acceptances (user_id, policy, accepted_at DESC);

ALTER TABLE public.policy_acceptances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_acceptances_select_own ON public.policy_acceptances;
CREATE POLICY policy_acceptances_select_own ON public.policy_acceptances
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS policy_acceptances_insert_own ON public.policy_acceptances;
CREATE POLICY policy_acceptances_insert_own ON public.policy_acceptances
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

REVOKE UPDATE, DELETE ON public.policy_acceptances FROM authenticated, anon;
GRANT SELECT, INSERT ON public.policy_acceptances TO authenticated;
GRANT ALL ON public.policy_acceptances TO service_role;

CREATE TABLE IF NOT EXISTS public.media_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  asset_ids TEXT[],
  version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_consents_user_idx ON public.media_consents (user_id, created_at DESC);

ALTER TABLE public.media_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS media_consents_own ON public.media_consents;
CREATE POLICY media_consents_select_own ON public.media_consents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY media_consents_insert_own ON public.media_consents
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

REVOKE UPDATE, DELETE ON public.media_consents FROM authenticated, anon;
GRANT SELECT, INSERT ON public.media_consents TO authenticated;
GRANT ALL ON public.media_consents TO service_role;

-- ---------------------------------------------------------------------------
-- 3. Support tickets (all plans, including Free/Essential)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_code TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  display_name TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'account', 'subscription_billing', 'refund', 'technical', 'privacy', 'other'
  )),
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN (
    'received', 'in_review', 'resolved', 'closed'
  )),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  language TEXT,
  assigned_role TEXT,
  assigned_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_tickets_user_idx ON public.support_tickets (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_category_idx ON public.support_tickets (category, status);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS support_tickets_select_own ON public.support_tickets;
CREATE POLICY support_tickets_select_own ON public.support_tickets
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      public.has_role(auth.uid(), 'admin')
      AND (
        category NOT IN ('privacy', 'refund')
        OR public.has_role(auth.uid(), 'admin')
      )
    )
  );

REVOKE INSERT, UPDATE, DELETE ON public.support_tickets FROM anon, authenticated;
GRANT SELECT ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;

-- ---------------------------------------------------------------------------
-- 4. Account deletion requests + audit events
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_deletion_select_own ON public.account_deletion_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

REVOKE INSERT, UPDATE, DELETE ON public.account_deletion_requests FROM anon, authenticated;
GRANT SELECT ON public.account_deletion_requests TO authenticated;
GRANT ALL ON public.account_deletion_requests TO service_role;

CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  subject_user_id UUID,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_events_subject_idx ON public.audit_events (subject_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_type_idx ON public.audit_events (event_type, created_at DESC);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_events_admin_read ON public.audit_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR actor_id = auth.uid() OR subject_user_id = auth.uid());

REVOKE INSERT, UPDATE, DELETE ON public.audit_events FROM anon, authenticated;
GRANT SELECT ON public.audit_events TO authenticated;
GRANT ALL ON public.audit_events TO service_role;

CREATE TABLE IF NOT EXISTS public.renewal_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'in_app')),
  planned_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  plan TEXT,
  renewal_at TIMESTAMPTZ,
  expected_amount NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (membership_id, channel, planned_for)
);

ALTER TABLE public.renewal_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY renewal_reminders_own ON public.renewal_reminders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

REVOKE INSERT, UPDATE, DELETE ON public.renewal_reminders FROM anon, authenticated;
GRANT SELECT ON public.renewal_reminders TO authenticated;
GRANT ALL ON public.renewal_reminders TO service_role;

-- ---------------------------------------------------------------------------
-- 5. RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public._write_audit_event(
  p_actor UUID,
  p_subject UUID,
  p_type TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.audit_events (actor_id, subject_user_id, event_type, metadata)
  VALUES (p_actor, p_subject, p_type, COALESCE(p_metadata, '{}'::jsonb));
$$;

CREATE OR REPLACE FUNCTION public.create_support_ticket(
  p_category TEXT,
  p_subject TEXT,
  p_message TEXT,
  p_email TEXT DEFAULT NULL,
  p_name TEXT DEFAULT NULL,
  p_language TEXT DEFAULT 'ar'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_id UUID := gen_random_uuid();
  v_code TEXT;
  v_recent INT;
BEGIN
  IF p_category NOT IN ('account', 'subscription_billing', 'refund', 'technical', 'privacy', 'other') THEN
    RAISE EXCEPTION 'invalid_category';
  END IF;
  IF length(btrim(p_subject)) < 3 OR length(btrim(p_message)) < 8 THEN
    RAISE EXCEPTION 'missing_fields';
  END IF;
  IF p_message ~* '(cvv|cvc|card\s*number|password|رقم\s*البطاقة|كلمة\s*المرور)' THEN
    RAISE EXCEPTION 'forbidden_sensitive_data';
  END IF;

  SELECT count(*) INTO v_recent
  FROM public.support_tickets
  WHERE created_at > now() - interval '10 minutes'
    AND (
      (v_user IS NOT NULL AND user_id = v_user)
      OR (p_email IS NOT NULL AND lower(email) = lower(p_email))
    );
  IF v_recent >= 5 THEN
    RAISE EXCEPTION 'rate_limited';
  END IF;

  v_code := 'MF-' || upper(substr(replace(v_id::text, '-', ''), 1, 8));

  INSERT INTO public.support_tickets (
    id, ticket_code, user_id, email, display_name, category, subject, message, language, status
  ) VALUES (
    v_id, v_code, v_user, p_email, p_name, p_category, btrim(p_subject), btrim(p_message), p_language, 'received'
  );

  PERFORM public._write_audit_event(v_user, v_user, 'support_ticket_created', jsonb_build_object(
    'ticket_id', v_id, 'category', p_category
  ));

  RETURN jsonb_build_object(
    'ticket_id', v_code,
    'id', v_id,
    'status', 'received',
    'created_at', now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_checkout_policies(
  p_plan TEXT,
  p_billing_period_months INT,
  p_amount NUMERIC,
  p_currency TEXT,
  p_terms_version TEXT,
  p_refund_policy_version TEXT,
  p_privacy_version TEXT,
  p_checkout_disclosure_version TEXT,
  p_renewal_disclosure_version TEXT,
  p_consent_text TEXT,
  p_policy_version TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  IF p_billing_period_months NOT IN (3, 6) THEN
    RAISE EXCEPTION 'invalid_billing_period';
  END IF;

  INSERT INTO public.policy_acceptances (
    user_id, policy, version, language, plan, billing_period_months, amount, currency,
    consent_text, checkout_disclosure_version, renewal_disclosure_version, source
  )
  VALUES
    (v_user, 'terms', p_terms_version, 'ar', p_plan, p_billing_period_months, p_amount, p_currency, p_consent_text, p_checkout_disclosure_version, p_renewal_disclosure_version, 'checkout'),
    (v_user, 'refund', p_refund_policy_version, 'ar', p_plan, p_billing_period_months, p_amount, p_currency, p_consent_text, p_checkout_disclosure_version, p_renewal_disclosure_version, 'checkout'),
    (v_user, 'privacy', p_privacy_version, 'ar', p_plan, p_billing_period_months, p_amount, p_currency, p_consent_text, p_checkout_disclosure_version, p_renewal_disclosure_version, 'checkout'),
    (v_user, 'checkout_disclosure', p_checkout_disclosure_version, 'ar', p_plan, p_billing_period_months, p_amount, p_currency, p_consent_text, p_checkout_disclosure_version, p_renewal_disclosure_version, 'checkout'),
    (v_user, 'renewal_disclosure', p_renewal_disclosure_version, 'ar', p_plan, p_billing_period_months, p_amount, p_currency, p_consent_text, p_checkout_disclosure_version, p_renewal_disclosure_version, 'checkout');

  PERFORM public._write_audit_event(v_user, v_user, 'checkout_consent', jsonb_build_object(
    'plan', p_plan, 'period', p_billing_period_months, 'amount', p_amount, 'policy_version', p_policy_version
  ));

  RETURN jsonb_build_object('ok', true, 'accepted_at', now());
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_policy_version(
  p_policy TEXT,
  p_version TEXT,
  p_language TEXT DEFAULT 'ar'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  INSERT INTO public.policy_acceptances (user_id, policy, version, language, source)
  VALUES (v_user, p_policy, p_version, p_language, 'reconsent');
  PERFORM public._write_audit_event(v_user, v_user, 'policy_acceptance', jsonb_build_object(
    'policy', p_policy, 'version', p_version
  ));
  RETURN jsonb_build_object('ok', true, 'accepted_at', now());
END;
$$;

CREATE OR REPLACE FUNCTION public.record_media_consent(
  p_granted BOOLEAN,
  p_scope TEXT,
  p_asset_ids TEXT[] DEFAULT NULL,
  p_version TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;
  INSERT INTO public.media_consents (user_id, scope, granted, asset_ids, version)
  VALUES (v_user, p_scope, p_granted, p_asset_ids, p_version);
  PERFORM public._write_audit_event(v_user, v_user, 'media_consent', jsonb_build_object(
    'scope', p_scope, 'granted', p_granted
  ));
  RETURN jsonb_build_object('ok', true, 'granted', p_granted, 'created_at', now());
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_my_renewal()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_row public.memberships;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  SELECT * INTO v_row
  FROM public.memberships
  WHERE user_id = v_user AND is_active = true
  ORDER BY starts_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'no_active_membership';
  END IF;

  UPDATE public.memberships
  SET
    auto_renew = false,
    cancel_at_period_end = true,
    next_renewal_at = NULL,
    updated_at = now()
  WHERE id = v_row.id;

  PERFORM public._write_audit_event(v_user, v_user, 'cancel_renewal', jsonb_build_object(
    'membership_id', v_row.id,
    'paid_period_end', COALESCE(v_row.paid_period_end, v_row.ends_at)
  ));

  RETURN jsonb_build_object(
    'ok', true,
    'cancel_at_period_end', true,
    'paid_period_end', COALESCE(v_row.paid_period_end, v_row.ends_at)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.request_account_deletion(p_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_id UUID;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  INSERT INTO public.account_deletion_requests (user_id, reason, status)
  VALUES (v_user, p_reason, 'received')
  RETURNING id INTO v_id;

  PERFORM public._write_audit_event(v_user, v_user, 'account_deletion_requested', jsonb_build_object(
    'request_id', v_id
  ));

  RETURN jsonb_build_object('ok', true, 'request_id', v_id, 'status', 'received');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_billing()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_row public.memberships;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('plan', 'free', 'status', 'free');
  END IF;

  SELECT * INTO v_row
  FROM public.memberships
  WHERE user_id = v_user AND is_active = true
  ORDER BY starts_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('plan', 'free', 'status', 'free', 'auto_renew', false, 'cancel_at_period_end', false);
  END IF;

  RETURN jsonb_build_object(
    'plan', v_row.tier,
    'tier', v_row.tier,
    'billing_period_months', v_row.billing_period_months,
    'price_amount', v_row.price_amount,
    'currency', v_row.currency,
    'status', CASE
      WHEN v_row.suspended_at IS NOT NULL THEN 'suspended'
      WHEN v_row.cancel_at_period_end THEN 'cancel_at_period_end'
      WHEN v_row.is_active THEN 'active'
      ELSE 'inactive'
    END,
    'auto_renew', v_row.auto_renew,
    'cancel_at_period_end', v_row.cancel_at_period_end,
    'next_renewal_at', v_row.next_renewal_at,
    'paid_period_end', COALESCE(v_row.paid_period_end, v_row.ends_at),
    'ends_at', v_row.ends_at,
    'payment_succeeded_at', v_row.payment_succeeded_at,
    'subscription_activated_at', v_row.subscription_activated_at,
    'premium_access_granted_at', v_row.premium_access_granted_at,
    'personal_program_started_at', v_row.personal_program_started_at,
    'personal_program_delivered_at', v_row.personal_program_delivered_at
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
    'paid_period_end', COALESCE(v_membership.paid_period_end, v_membership.ends_at),
    'billing_period_months', v_membership.billing_period_months,
    'price_amount', v_membership.price_amount,
    'currency', v_membership.currency,
    'auto_renew', v_membership.auto_renew,
    'cancel_at_period_end', v_membership.cancel_at_period_end,
    'next_renewal_at', v_membership.next_renewal_at,
    'days_remaining', CASE
      WHEN COALESCE(v_membership.paid_period_end, v_membership.ends_at) IS NULL THEN 0
      ELSE GREATEST(0, CEIL(EXTRACT(EPOCH FROM (COALESCE(v_membership.paid_period_end, v_membership.ends_at) - now())) / 86400)::int)
    END,
    'features', COALESCE(v_tier.features, '{}'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_support_ticket(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_checkout_policies(TEXT, INT, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_policy_version(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_media_consent(BOOLEAN, TEXT, TEXT[], TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_my_renewal() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_account_deletion(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_billing() FROM PUBLIC;
REVOKE ALL ON FUNCTION public._write_audit_event(UUID, UUID, TEXT, JSONB) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_support_ticket(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_checkout_policies(TEXT, INT, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_policy_version(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_media_consent(BOOLEAN, TEXT, TEXT[], TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_my_renewal() TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_account_deletion(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_billing() TO authenticated;
GRANT EXECUTE ON FUNCTION public._write_audit_event(UUID, UUID, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.member_can_use_coach_chat(UUID) TO authenticated;

COMMENT ON TABLE public.policy_acceptances IS 'Append-only policy/checkout consent history. Never overwrite prior acceptances.';
COMMENT ON TABLE public.support_tickets IS 'Account/billing/refund/privacy/technical tickets. Not coaching chat.';
COMMENT ON TABLE public.renewal_reminders IS 'Architecture for >=7 day renewal reminders. Delivery waits payment-provider + email job.';
COMMENT ON COLUMN public.memberships.auto_renew IS 'Provider-neutral auto-renew flag. No PSP integration in this migration.';
