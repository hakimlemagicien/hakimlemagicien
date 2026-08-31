-- MAAKFIT Payments V1 — P3 Database, Membership & Entitlements Foundation
-- Provider-neutral. Staging-first. No Paddle integration. Additive only.

-- ---------------------------------------------------------------------------
-- 1. Subscription status vocabulary (provider-neutral)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  CREATE TYPE public.subscription_status AS ENUM (
    'active',
    'past_due',
    'cancel_at_period_end',
    'cancelled',
    'expired',
    'refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Extend memberships (provider + lifecycle read model)
-- ---------------------------------------------------------------------------

ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS provider_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status public.subscription_status,
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS memberships_provider_subscription_idx
  ON public.memberships (provider, provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS memberships_user_active_idx
  ON public.memberships (user_id, is_active, starts_at DESC);

-- ---------------------------------------------------------------------------
-- 3. Extend payments ledger (subscription transactions)
-- ---------------------------------------------------------------------------

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS membership_id UUID REFERENCES public.memberships(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tier TEXT,
  ADD COLUMN IF NOT EXISTS billing_period_months SMALLINT,
  ADD COLUMN IF NOT EXISTS provider_event_id TEXT,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payments_billing_period_months_chk'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_billing_period_months_chk
      CHECK (billing_period_months IS NULL OR billing_period_months IN (3, 6));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS payments_user_created_idx
  ON public.payments (user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_event_unique_idx
  ON public.payments (provider, provider_event_id)
  WHERE provider_event_id IS NOT NULL AND provider IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. Provider event ledger (idempotency)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.payment_provider_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'received'
    CHECK (processing_status IN ('received', 'processing', 'processed', 'failed', 'skipped')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payload_hash TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_code TEXT,
  error_message TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  UNIQUE (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS payment_provider_events_user_idx
  ON public.payment_provider_events (user_id, received_at DESC);

CREATE INDEX IF NOT EXISTS payment_provider_events_status_idx
  ON public.payment_provider_events (processing_status, received_at DESC);

ALTER TABLE public.payment_provider_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payment_provider_events_admin_select ON public.payment_provider_events;
CREATE POLICY payment_provider_events_admin_select ON public.payment_provider_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

REVOKE INSERT, UPDATE, DELETE ON public.payment_provider_events FROM anon, authenticated;
GRANT SELECT ON public.payment_provider_events TO authenticated;
GRANT ALL ON public.payment_provider_events TO service_role;

-- ---------------------------------------------------------------------------
-- 5. Provider product map (server-only; no public VIP mapping)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.provider_product_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('essential', 'premium')),
  term_months SMALLINT NOT NULL CHECK (term_months IN (3, 6)),
  provider_product_id TEXT,
  provider_price_id TEXT,
  is_public_sale BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, tier, term_months)
);

ALTER TABLE public.provider_product_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS provider_product_map_admin_select ON public.provider_product_map;
CREATE POLICY provider_product_map_admin_select ON public.provider_product_map
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

REVOKE INSERT, UPDATE, DELETE ON public.provider_product_map FROM anon, authenticated;
GRANT SELECT ON public.provider_product_map TO authenticated;
GRANT ALL ON public.provider_product_map TO service_role;

INSERT INTO public.provider_product_map (provider, tier, term_months, is_public_sale)
VALUES
  ('paddle', 'essential', 3, true),
  ('paddle', 'essential', 6, true),
  ('paddle', 'premium', 3, true),
  ('paddle', 'premium', 6, true)
ON CONFLICT (provider, tier, term_months) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. Essential daily meal swap tracking (server-enforced)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.nutrition_meal_swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  swap_date DATE NOT NULL,
  from_meal_id UUID,
  to_meal_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nutrition_meal_swaps_user_date_idx
  ON public.nutrition_meal_swaps (user_id, swap_date DESC);

ALTER TABLE public.nutrition_meal_swaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS nutrition_meal_swaps_own_select ON public.nutrition_meal_swaps;
CREATE POLICY nutrition_meal_swaps_own_select ON public.nutrition_meal_swaps
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

REVOKE INSERT, UPDATE, DELETE ON public.nutrition_meal_swaps FROM anon, authenticated;
GRANT SELECT ON public.nutrition_meal_swaps TO authenticated;
GRANT ALL ON public.nutrition_meal_swaps TO service_role;

-- ---------------------------------------------------------------------------
-- 7. Stable entitlement capability keys on membership_tiers
-- ---------------------------------------------------------------------------

UPDATE public.membership_tiers
SET features = CASE tier
  WHEN 'free' THEN '{
    "platform_access": true,
    "progress_tracking": true,
    "free_content": true,
    "workout_program": false,
    "nutrition_plan": false,
    "training_access": true,
    "training_full_session": false,
    "training_allowed_exercises_per_session": 1,
    "training_preview_exercises": true,
    "nutrition_access": true,
    "nutrition_full_day": false,
    "nutrition_allowed_meals_per_day": 1,
    "nutrition_daily_swap_limit": 0,
    "nutrition_multiple_alternatives": false,
    "advanced_training_features": false,
    "advanced_nutrition_features": false,
    "coach_chat": false,
    "limited_coach_contact": false,
    "personal_followup": false,
    "program_adjustments": false,
    "priority_contact": false,
    "periodic_reviews": false
  }'::jsonb
  WHEN 'essential' THEN '{
    "platform_access": true,
    "progress_tracking": true,
    "free_content": true,
    "workout_program": true,
    "nutrition_plan": true,
    "training_access": true,
    "training_full_session": true,
    "training_allowed_exercises_per_session": null,
    "training_preview_exercises": false,
    "nutrition_access": true,
    "nutrition_full_day": true,
    "nutrition_allowed_meals_per_day": null,
    "nutrition_daily_swap_limit": 1,
    "nutrition_multiple_alternatives": false,
    "advanced_training_features": false,
    "advanced_nutrition_features": false,
    "coach_chat": false,
    "limited_coach_contact": false,
    "personal_followup": false,
    "program_adjustments": false,
    "priority_contact": false,
    "periodic_reviews": false
  }'::jsonb
  WHEN 'premium' THEN '{
    "platform_access": true,
    "progress_tracking": true,
    "free_content": true,
    "workout_program": true,
    "nutrition_plan": true,
    "training_access": true,
    "training_full_session": true,
    "training_allowed_exercises_per_session": null,
    "training_preview_exercises": false,
    "nutrition_access": true,
    "nutrition_full_day": true,
    "nutrition_allowed_meals_per_day": null,
    "nutrition_daily_swap_limit": null,
    "nutrition_multiple_alternatives": true,
    "advanced_training_features": true,
    "advanced_nutrition_features": true,
    "coach_chat": false,
    "limited_coach_contact": false,
    "personal_followup": false,
    "program_adjustments": true,
    "priority_contact": false,
    "periodic_reviews": true
  }'::jsonb
  WHEN 'vip' THEN '{
    "platform_access": true,
    "progress_tracking": true,
    "free_content": true,
    "workout_program": true,
    "nutrition_plan": true,
    "training_access": true,
    "training_full_session": true,
    "training_allowed_exercises_per_session": null,
    "training_preview_exercises": false,
    "nutrition_access": true,
    "nutrition_full_day": true,
    "nutrition_allowed_meals_per_day": null,
    "nutrition_daily_swap_limit": null,
    "nutrition_multiple_alternatives": true,
    "advanced_training_features": true,
    "advanced_nutrition_features": true,
    "coach_chat": true,
    "limited_coach_contact": true,
    "personal_followup": true,
    "program_adjustments": true,
    "priority_contact": true,
    "periodic_reviews": true
  }'::jsonb
  ELSE features
END,
updated_at = now()
WHERE tier IN ('free', 'essential', 'premium', 'vip');

-- ---------------------------------------------------------------------------
-- 8. Entitlement helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public._resolve_active_membership(_user_id UUID)
RETURNS public.memberships
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.*
  FROM public.memberships m
  WHERE m.user_id = _user_id AND m.is_active = true
  ORDER BY
    CASE WHEN m.tier IN ('vip', 'premium', 'essential') THEN 0 ELSE 1 END,
    m.starts_at DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public._tier_capability_features(_tier TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT features FROM public.membership_tiers WHERE tier = _tier),
    (SELECT features FROM public.membership_tiers WHERE tier = 'free'),
    '{}'::jsonb
  );
$$;

CREATE OR REPLACE FUNCTION public._utc_membership_day()
RETURNS DATE
LANGUAGE sql
STABLE
AS $$
  SELECT (timezone('UTC', now()))::date;
$$;

-- Premium public V1: coach chat is VIP/legacy only — not Premium.
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
      SELECT
        m.tier = 'vip'
        OR COALESCE((mt.features->>'coach_chat')::boolean, false)
      FROM public.memberships m
      JOIN public.membership_tiers mt ON mt.tier = m.tier
      WHERE m.user_id = _user_id AND m.is_active = true
      ORDER BY m.starts_at DESC
      LIMIT 1
    ), false);
$$;

CREATE OR REPLACE FUNCTION public.get_my_entitlements()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_membership public.memberships;
  v_features JSONB;
  v_tier TEXT := 'free';
  v_swap_count INT := 0;
  v_today DATE := public._utc_membership_day();
BEGIN
  IF v_user IS NULL THEN
    v_features := public._tier_capability_features('free');
    RETURN jsonb_build_object(
      'tier', 'free',
      'is_paid', false,
      'subscription_status', 'free',
      'capabilities', v_features,
      'training', jsonb_build_object(
        'allowed_exercises_per_session', COALESCE((v_features->>'training_allowed_exercises_per_session')::int, 1),
        'full_session', COALESCE((v_features->>'training_full_session')::boolean, false),
        'preview_exercises', COALESCE((v_features->>'training_preview_exercises')::boolean, true)
      ),
      'nutrition', jsonb_build_object(
        'allowed_meals_per_day', COALESCE((v_features->>'nutrition_allowed_meals_per_day')::int, 1),
        'full_day', COALESCE((v_features->>'nutrition_full_day')::boolean, false),
        'daily_swap_limit', COALESCE((v_features->>'nutrition_daily_swap_limit')::int, 0),
        'swaps_used_today', 0,
        'swaps_remaining_today', 0,
        'multiple_alternatives', false,
        'unlocked_meal_strategy', 'first_of_day'
      )
    );
  END IF;

  SELECT * INTO v_membership FROM public._resolve_active_membership(v_user);
  IF NOT FOUND THEN
    v_features := public._tier_capability_features('free');
    v_tier := 'free';
  ELSE
    v_tier := v_membership.tier;
    v_features := public._tier_capability_features(v_tier);
  END IF;

  SELECT count(*) INTO v_swap_count
  FROM public.nutrition_meal_swaps
  WHERE user_id = v_user AND swap_date = v_today;

  RETURN jsonb_build_object(
    'tier', v_tier,
    'is_paid', v_tier IN ('essential', 'premium', 'vip'),
    'subscription_status', COALESCE(v_membership.subscription_status::text, CASE WHEN v_tier = 'free' THEN 'free' ELSE 'active' END),
    'cancel_at_period_end', COALESCE(v_membership.cancel_at_period_end, false),
    'paid_period_end', COALESCE(v_membership.paid_period_end, v_membership.ends_at),
    'capabilities', v_features,
    'training', jsonb_build_object(
      'allowed_exercises_per_session', v_features->'training_allowed_exercises_per_session',
      'full_session', COALESCE((v_features->>'training_full_session')::boolean, false),
      'preview_exercises', COALESCE((v_features->>'training_preview_exercises')::boolean, false),
      'advanced_features', COALESCE((v_features->>'advanced_training_features')::boolean, false)
    ),
    'nutrition', jsonb_build_object(
      'allowed_meals_per_day', v_features->'nutrition_allowed_meals_per_day',
      'full_day', COALESCE((v_features->>'nutrition_full_day')::boolean, false),
      'daily_swap_limit', v_features->'nutrition_daily_swap_limit',
      'swaps_used_today', v_swap_count,
      'swaps_remaining_today', CASE
        WHEN v_features->'nutrition_daily_swap_limit' IS NULL THEN NULL
        WHEN (v_features->>'nutrition_daily_swap_limit')::int = 0 THEN 0
        ELSE GREATEST(0, (v_features->>'nutrition_daily_swap_limit')::int - v_swap_count)
      END,
      'multiple_alternatives', COALESCE((v_features->>'nutrition_multiple_alternatives')::boolean, false),
      'unlocked_meal_strategy', CASE WHEN v_tier = 'free' THEN 'first_of_day' ELSE 'all_assigned' END,
      'advanced_features', COALESCE((v_features->>'advanced_nutrition_features')::boolean, false)
    ),
    'coach_chat', public.member_can_use_coach_chat(v_user)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_nutrition_meal_swap(
  p_from_meal_id UUID DEFAULT NULL,
  p_to_meal_id UUID DEFAULT NULL,
  p_swap_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_ent JSONB;
  v_limit INT;
  v_used INT;
  v_day DATE := COALESCE(p_swap_date, public._utc_membership_day());
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501';
  END IF;

  v_ent := public.get_my_entitlements();
  IF COALESCE((v_ent->'nutrition'->>'full_day')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'nutrition_not_entitled' USING ERRCODE = '42501';
  END IF;

  IF v_ent->'nutrition'->'daily_swap_limit' IS NULL THEN
    INSERT INTO public.nutrition_meal_swaps (user_id, swap_date, from_meal_id, to_meal_id)
    VALUES (v_user, v_day, p_from_meal_id, p_to_meal_id);
    RETURN jsonb_build_object('ok', true, 'unlimited', true, 'swap_date', v_day);
  END IF;

  v_limit := COALESCE((v_ent->'nutrition'->>'daily_swap_limit')::int, 0);
  IF v_limit <= 0 THEN
    RAISE EXCEPTION 'meal_swap_not_allowed' USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO v_used
  FROM public.nutrition_meal_swaps
  WHERE user_id = v_user AND swap_date = v_day;

  IF v_used >= v_limit THEN
    RAISE EXCEPTION 'daily_meal_swap_limit_reached' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.nutrition_meal_swaps (user_id, swap_date, from_meal_id, to_meal_id)
  VALUES (v_user, v_day, p_from_meal_id, p_to_meal_id);

  RETURN jsonb_build_object(
    'ok', true,
    'swap_date', v_day,
    'swaps_used_today', v_used + 1,
    'swaps_remaining_today', GREATEST(0, v_limit - v_used - 1)
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 9. Trusted provider event application (service_role only)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.apply_provider_subscription_event(p_event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider TEXT := btrim(p_event->>'provider');
  v_event_id TEXT := btrim(p_event->>'event_id');
  v_event_type TEXT := btrim(p_event->>'event_type');
  v_user_id UUID := NULLIF(p_event->>'user_id', '')::uuid;
  v_tier TEXT := lower(btrim(p_event->>'tier'));
  v_term INT := NULLIF(p_event->>'term_months', '')::int;
  v_amount NUMERIC := NULLIF(p_event->>'amount', '')::numeric;
  v_currency TEXT := COALESCE(NULLIF(p_event->>'currency', ''), 'USD');
  v_customer_id TEXT := NULLIF(p_event->>'customer_id', '');
  v_subscription_id TEXT := NULLIF(p_event->>'subscription_id', '');
  v_transaction_id TEXT := NULLIF(p_event->>'transaction_id', '');
  v_period_start TIMESTAMPTZ := NULLIF(p_event->>'period_start', '')::timestamptz;
  v_period_end TIMESTAMPTZ := NULLIF(p_event->>'period_end', '')::timestamptz;
  v_renew_at TIMESTAMPTZ := NULLIF(p_event->>'renew_at', '')::timestamptz;
  v_sub_status public.subscription_status;
  v_existing public.payment_provider_events;
  v_membership_id UUID;
  v_payment_id UUID;
  v_payload_hash TEXT;
BEGIN
  IF v_provider IS NULL OR v_event_id IS NULL OR v_event_type IS NULL THEN
    RAISE EXCEPTION 'invalid_provider_event' USING ERRCODE = '22023';
  END IF;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id_required' USING ERRCODE = '22023';
  END IF;

  v_payload_hash := encode(extensions.digest(convert_to(p_event::text, 'UTF8'), 'sha256'), 'hex');

  SELECT * INTO v_existing
  FROM public.payment_provider_events
  WHERE provider = v_provider AND provider_event_id = v_event_id
  FOR UPDATE;

  IF FOUND AND v_existing.processing_status = 'processed' THEN
    RETURN jsonb_build_object('ok', true, 'status', 'skipped', 'reason', 'already_processed');
  END IF;

  IF NOT FOUND THEN
    INSERT INTO public.payment_provider_events (
      provider, provider_event_id, event_type, processing_status, user_id, payload_hash, payload
    ) VALUES (
      v_provider, v_event_id, v_event_type, 'processing', v_user_id, v_payload_hash, p_event
    )
    RETURNING * INTO v_existing;
  ELSE
    UPDATE public.payment_provider_events
    SET processing_status = 'processing', user_id = COALESCE(user_id, v_user_id)
    WHERE id = v_existing.id;
  END IF;

  v_sub_status := COALESCE(
    NULLIF(p_event->>'subscription_status', '')::public.subscription_status,
    CASE
      WHEN v_event_type ILIKE '%cancel%' AND v_event_type ILIKE '%period%' THEN 'cancel_at_period_end'::public.subscription_status
      WHEN v_event_type ILIKE '%cancel%' THEN 'cancelled'::public.subscription_status
      WHEN v_event_type ILIKE '%expire%' THEN 'expired'::public.subscription_status
      WHEN v_event_type ILIKE '%refund%' THEN 'refunded'::public.subscription_status
      WHEN v_event_type ILIKE '%fail%' OR v_event_type ILIKE '%past_due%' THEN 'past_due'::public.subscription_status
      ELSE 'active'::public.subscription_status
    END
  );

  IF v_event_type ILIKE '%payment%succeeded%'
     OR v_event_type ILIKE '%subscription%activated%'
     OR v_event_type ILIKE '%subscription%renewed%' THEN

    IF v_tier NOT IN ('essential', 'premium') THEN
      RAISE EXCEPTION 'invalid_paid_tier' USING ERRCODE = '22023';
    END IF;
    IF v_term NOT IN (3, 6) THEN
      RAISE EXCEPTION 'invalid_term_months' USING ERRCODE = '22023';
    END IF;

    UPDATE public.memberships
    SET is_active = false, updated_at = now()
    WHERE user_id = v_user_id AND is_active = true;

    INSERT INTO public.memberships (
      user_id, tier, is_active, source, starts_at, ends_at,
      billing_period_months, price_amount, currency, auto_renew,
      provider, provider_customer_id, provider_subscription_id,
      subscription_status, current_period_start, current_period_end,
      paid_period_end, next_renewal_at,
      payment_succeeded_at, subscription_activated_at,
      cancel_at_period_end
    ) VALUES (
      v_user_id, v_tier, true, v_provider, COALESCE(v_period_start, now()),
      v_period_end,
      v_term, v_amount, v_currency, true,
      v_provider, v_customer_id, v_subscription_id,
      'active', v_period_start, v_period_end,
      v_period_end, v_renew_at,
      now(), now(), false
    )
    ON CONFLICT (user_id, tier) DO UPDATE SET
      is_active = true,
      source = EXCLUDED.source,
      starts_at = EXCLUDED.starts_at,
      ends_at = EXCLUDED.ends_at,
      billing_period_months = EXCLUDED.billing_period_months,
      price_amount = EXCLUDED.price_amount,
      currency = EXCLUDED.currency,
      auto_renew = true,
      provider = EXCLUDED.provider,
      provider_customer_id = EXCLUDED.provider_customer_id,
      provider_subscription_id = EXCLUDED.provider_subscription_id,
      subscription_status = 'active',
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      paid_period_end = EXCLUDED.paid_period_end,
      next_renewal_at = EXCLUDED.next_renewal_at,
      payment_succeeded_at = COALESCE(public.memberships.payment_succeeded_at, now()),
      subscription_activated_at = COALESCE(public.memberships.subscription_activated_at, now()),
      cancel_at_period_end = false,
      updated_at = now()
    RETURNING id INTO v_membership_id;

    IF v_amount IS NOT NULL THEN
      INSERT INTO public.payments (
        user_id, membership_id, amount, currency, method, status,
        provider, provider_payment_id, provider_event_id,
        tier, billing_period_months, paid_at
      )
      SELECT
        v_user_id, v_membership_id, v_amount, v_currency, 'other', 'approved',
        v_provider, v_transaction_id, v_event_id,
        v_tier, v_term, now()
      WHERE NOT EXISTS (
        SELECT 1 FROM public.payments p
        WHERE p.provider = v_provider AND p.provider_event_id = v_event_id
      )
      RETURNING id INTO v_payment_id;
    END IF;

    PERFORM public._write_audit_event(
      v_user_id, v_user_id, 'subscription_activated',
      jsonb_build_object(
        'provider', v_provider, 'event_id', v_event_id, 'tier', v_tier,
        'term_months', v_term, 'membership_id', v_membership_id
      )
    );

  ELSIF v_event_type ILIKE '%cancel%period%' OR v_sub_status = 'cancel_at_period_end' THEN
    UPDATE public.memberships
    SET
      auto_renew = false,
      cancel_at_period_end = true,
      subscription_status = 'cancel_at_period_end',
      next_renewal_at = NULL,
      updated_at = now()
    WHERE user_id = v_user_id AND is_active = true AND tier IN ('essential', 'premium', 'vip')
    RETURNING id INTO v_membership_id;

    PERFORM public._write_audit_event(
      v_user_id, v_user_id, 'subscription_cancel_requested',
      jsonb_build_object('provider', v_provider, 'event_id', v_event_id, 'membership_id', v_membership_id)
    );

  ELSIF v_sub_status = 'expired' OR v_event_type ILIKE '%expired%' THEN
    UPDATE public.memberships
    SET
      is_active = false,
      subscription_status = 'expired',
      auto_renew = false,
      updated_at = now()
    WHERE user_id = v_user_id AND is_active = true AND tier IN ('essential', 'premium')
    RETURNING id INTO v_membership_id;

    INSERT INTO public.memberships (user_id, tier, is_active, source, starts_at)
    VALUES (v_user_id, 'free', true, 'downgrade', now())
    ON CONFLICT (user_id, tier) DO UPDATE SET
      is_active = true,
      updated_at = now();

    PERFORM public._write_audit_event(
      v_user_id, v_user_id, 'subscription_expired',
      jsonb_build_object('provider', v_provider, 'event_id', v_event_id, 'membership_id', v_membership_id)
    );

  ELSIF v_sub_status = 'refunded' OR v_event_type ILIKE '%refund%' THEN
    UPDATE public.payments
    SET status = 'refunded', refunded_at = now(), updated_at = now()
    WHERE user_id = v_user_id
      AND provider = v_provider
      AND (provider_event_id = v_event_id OR provider_payment_id = v_transaction_id);

    UPDATE public.memberships
    SET
      is_active = false,
      subscription_status = 'refunded',
      auto_renew = false,
      updated_at = now()
    WHERE user_id = v_user_id AND is_active = true AND tier IN ('essential', 'premium')
    RETURNING id INTO v_membership_id;

    INSERT INTO public.memberships (user_id, tier, is_active, source, starts_at)
    VALUES (v_user_id, 'free', true, 'refund_downgrade', now())
    ON CONFLICT (user_id, tier) DO UPDATE SET is_active = true, updated_at = now();

    PERFORM public._write_audit_event(
      v_user_id, v_user_id, 'payment_refunded',
      jsonb_build_object('provider', v_provider, 'event_id', v_event_id, 'membership_id', v_membership_id)
    );
  END IF;

  UPDATE public.payment_provider_events
  SET processing_status = 'processed', processed_at = now(), user_id = v_user_id
  WHERE id = v_existing.id;

  RETURN jsonb_build_object(
    'ok', true,
    'status', 'processed',
    'provider', v_provider,
    'event_id', v_event_id,
    'membership_id', v_membership_id,
    'payment_id', v_payment_id
  );
EXCEPTION WHEN OTHERS THEN
  UPDATE public.payment_provider_events
  SET
    processing_status = 'failed',
    error_code = SQLSTATE,
    error_message = SQLERRM,
    processed_at = now()
  WHERE provider = v_provider AND provider_event_id = v_event_id;
  RAISE;
END;
$$;

-- ---------------------------------------------------------------------------
-- 10. Billing read model refresh
-- ---------------------------------------------------------------------------

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
    RETURN jsonb_build_object('plan', 'free', 'status', 'free', 'subscription_status', 'free');
  END IF;

  SELECT * INTO v_row FROM public._resolve_active_membership(v_user);

  IF NOT FOUND OR v_row.tier = 'free' THEN
    RETURN jsonb_build_object(
      'plan', 'free', 'tier', 'free', 'status', 'free', 'subscription_status', 'free',
      'auto_renew', false, 'cancel_at_period_end', false
    );
  END IF;

  RETURN jsonb_build_object(
    'plan', v_row.tier,
    'tier', v_row.tier,
    'billing_period_months', v_row.billing_period_months,
    'price_amount', v_row.price_amount,
    'currency', v_row.currency,
    'status', CASE
      WHEN v_row.suspended_at IS NOT NULL THEN 'suspended'
      WHEN v_row.subscription_status = 'past_due' THEN 'past_due'
      WHEN v_row.cancel_at_period_end OR v_row.subscription_status = 'cancel_at_period_end' THEN 'cancel_at_period_end'
      WHEN v_row.is_active THEN 'active'
      ELSE COALESCE(v_row.subscription_status::text, 'inactive')
    END,
    'subscription_status', COALESCE(v_row.subscription_status::text, CASE WHEN v_row.is_active THEN 'active' ELSE 'inactive' END),
    'auto_renew', v_row.auto_renew,
    'cancel_at_period_end', v_row.cancel_at_period_end,
    'next_renewal_at', v_row.next_renewal_at,
    'paid_period_end', COALESCE(v_row.paid_period_end, v_row.ends_at),
    'current_period_start', v_row.current_period_start,
    'current_period_end', COALESCE(v_row.current_period_end, v_row.paid_period_end, v_row.ends_at),
    'ends_at', v_row.ends_at,
    'provider', v_row.provider,
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
  v_ent JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'tier', 'free', 'is_free', true, 'is_paid', false, 'is_active', true,
      'subscription_id', NULL, 'starts_at', NULL, 'ends_at', NULL, 'days_remaining', 0,
      'features', public._tier_capability_features('free')
    );
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  IF public.is_founder_review_email(v_email) THEN
    PERFORM public.grant_founder_review_access(v_user_id);
  END IF;

  SELECT * INTO v_membership FROM public._resolve_active_membership(v_user_id);

  IF NOT FOUND THEN
    SELECT * INTO v_tier FROM public.membership_tiers WHERE tier = 'free';
    RETURN jsonb_build_object(
      'tier', 'free', 'is_free', true, 'is_paid', false, 'is_active', true,
      'subscription_id', NULL, 'starts_at', NULL, 'ends_at', NULL, 'days_remaining', 0,
      'features', COALESCE(v_tier.features, public._tier_capability_features('free'))
    );
  END IF;

  SELECT * INTO v_tier FROM public.membership_tiers WHERE tier = v_membership.tier;
  v_ent := public.get_my_entitlements();

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
    'subscription_status', v_membership.subscription_status,
    'days_remaining', CASE
      WHEN COALESCE(v_membership.paid_period_end, v_membership.ends_at) IS NULL THEN 0
      ELSE GREATEST(0, CEIL(EXTRACT(EPOCH FROM (COALESCE(v_membership.paid_period_end, v_membership.ends_at) - now())) / 86400)::int)
    END,
    'features', COALESCE(v_tier.features, '{}'::jsonb),
    'entitlements', v_ent
  );
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

  SELECT * INTO v_row FROM public._resolve_active_membership(v_user);

  IF NOT FOUND OR v_row.tier = 'free' THEN
    RAISE EXCEPTION 'no_active_membership';
  END IF;

  UPDATE public.memberships
  SET
    auto_renew = false,
    cancel_at_period_end = true,
    subscription_status = 'cancel_at_period_end',
    next_renewal_at = NULL,
    updated_at = now()
  WHERE id = v_row.id;

  PERFORM public._write_audit_event(v_user, v_user, 'subscription_cancel_requested', jsonb_build_object(
    'membership_id', v_row.id,
    'paid_period_end', COALESCE(v_row.paid_period_end, v_row.ends_at),
    'source', 'member_request',
    'provider_confirmation_pending', true
  ));

  RETURN jsonb_build_object(
    'ok', true,
    'cancel_at_period_end', true,
    'paid_period_end', COALESCE(v_row.paid_period_end, v_row.ends_at),
    'provider_confirmation_pending', true
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 11. Grants / revokes
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.apply_provider_subscription_event(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._resolve_active_membership(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._tier_capability_features(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._utc_membership_day() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_my_entitlements() TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_nutrition_meal_swap(UUID, UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_provider_subscription_event(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.member_can_use_coach_chat(UUID) TO authenticated;

COMMENT ON TABLE public.payment_provider_events IS 'Idempotent provider webhook/event ledger. Raw payload stored without card data.';
COMMENT ON TABLE public.provider_product_map IS 'Server-only tier/term to provider product mapping. VIP excluded from public V1.';
COMMENT ON TABLE public.nutrition_meal_swaps IS 'Server-side Essential daily meal swap enforcement (UTC day boundary).';
COMMENT ON FUNCTION public.get_my_entitlements() IS 'Provider-neutral entitlement read model for Training/Nutrition runtime.';
COMMENT ON FUNCTION public.apply_provider_subscription_event(JSONB) IS 'Trusted backend-only subscription lifecycle application. P4/P5 maps provider events here.';
