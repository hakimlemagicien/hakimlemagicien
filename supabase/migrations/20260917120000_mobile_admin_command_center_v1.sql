-- MAAKFIT Mobile Admin Command Center V1
-- Operational control plane: pricing, campaigns, promo codes, deterministic
-- template mapping, notifications, safe runtime settings, alerts and preview.
-- Additive only. Apply to a safe test environment before Production.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Commercial source of truth
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan TEXT NOT NULL CHECK (plan IN ('essential', 'premium', 'vip')),
  term_months INTEGER NOT NULL CHECK (term_months IN (3, 6)),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  published_at TIMESTAMPTZ,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plan, term_months, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS product_prices_one_published
  ON public.product_prices (plan, term_months) WHERE status = 'published';

INSERT INTO public.product_prices (plan, term_months, amount, status, version, published_at)
VALUES
  ('essential', 3, 87, 'published', 1, now()),
  ('essential', 6, 149, 'published', 1, now()),
  ('premium', 3, 147, 'published', 1, now()),
  ('premium', 6, 249, 'published', 1, now()),
  ('vip', 3, 397, 'published', 1, now()),
  ('vip', 6, 647, 'published', 1, now())
ON CONFLICT (plan, term_months, version) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.product_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 120),
  plan TEXT NOT NULL CHECK (plan IN ('essential', 'premium', 'vip')),
  term_months INTEGER NOT NULL CHECK (term_months IN (3, 6)),
  promotional_price NUMERIC(10,2) NOT NULL CHECK (promotional_price >= 0),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'ended')),
  created_by UUID,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS product_promotions_lookup_idx
  ON public.product_promotions (plan, term_months, status, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  plans TEXT[] NOT NULL DEFAULT ARRAY['essential','premium']::TEXT[],
  terms INTEGER[] NOT NULL DEFAULT ARRAY[3,6]::INTEGER[],
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  max_total_uses INTEGER CHECK (max_total_uses IS NULL OR max_total_uses > 0),
  one_use_per_client BOOLEAN NOT NULL DEFAULT true,
  new_clients_only BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'ended')),
  created_by UUID,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (expires_at IS NULL OR expires_at > starts_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS promo_codes_upper_unique ON public.promo_codes (upper(code));

CREATE TABLE IF NOT EXISTS public.promo_code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  plan TEXT NOT NULL,
  term_months INTEGER NOT NULL,
  original_amount NUMERIC(10,2) NOT NULL,
  final_amount NUMERIC(10,2) NOT NULL,
  checkout_reference TEXT,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS promo_redemptions_code_idx
  ON public.promo_code_redemptions (promo_code_id, redeemed_at DESC);

-- ---------------------------------------------------------------------------
-- 2. Deterministic automation: master → auto assign → client copy → override
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.program_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  goal TEXT NOT NULL CHECK (goal IN ('cut', 'bulk', 'recomp', 'fitness')),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  training_days INTEGER NOT NULL CHECK (training_days BETWEEN 2 AND 6),
  training_template_id UUID NOT NULL REFERENCES public.program_templates(id) ON DELETE RESTRICT,
  nutrition_blueprint JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority INTEGER NOT NULL DEFAULT 100,
  is_fallback BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (goal, gender, level, training_days, priority)
);

CREATE INDEX IF NOT EXISTS automation_rules_match_idx
  ON public.program_automation_rules (gender, goal, level, training_days, priority)
  WHERE is_active;

-- Use explicit owner-authored rules for new-client training assignment. This
-- preserves the proven legacy resolver until the owner publishes at least one
-- rule for the same gender/goal/level. Once managed rules exist, matching is
-- fail-closed: only an exact-day rule or an explicitly marked same-demographic
-- fallback can be used.
CREATE OR REPLACE FUNCTION public._finalize_customer_journey(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_journey public.client_customer_journeys%ROWTYPE;
  v_answers JSONB := '{}'::jsonb;
  v_profile_goal TEXT;
  v_gender TEXT;
  v_goal TEXT;
  v_level TEXT;
  v_template_id UUID;
  v_assignment_id UUID;
  v_has_managed_rules BOOLEAN := false;
  v_requested_days INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));
  SELECT * INTO v_journey FROM public.client_customer_journeys WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_journey.status = 'ready' OR v_journey.preferred_training_days IS NULL THEN RETURN; END IF;

  SELECT id INTO v_assignment_id FROM public.client_program_assignments
  WHERE client_id = p_user_id AND status IN ('active','scheduled')
  ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, assigned_at DESC LIMIT 1;
  IF v_assignment_id IS NOT NULL THEN
    UPDATE public.client_customer_journeys SET status='ready', assignment_id=v_assignment_id,
      completed_at=COALESCE(completed_at,now()), failure_code=NULL WHERE user_id=p_user_id;
    RETURN;
  END IF;

  SELECT tp.goal, COALESCE(tp.answers, '{}'::jsonb)
  INTO v_profile_goal, v_answers FROM public.training_profiles tp WHERE tp.user_id = p_user_id;
  v_gender := lower(COALESCE(v_answers->>'gender',''));
  v_level := lower(COALESCE(v_answers->>'trainingLevel', v_answers->>'training_level',
    v_answers->>'experienceLevel', v_answers->>'experience_level',
    CASE lower(COALESCE(v_answers->>'activityLevel',v_answers->>'activity_level',''))
      WHEN 'high' THEN 'intermediate' WHEN 'veryhigh' THEN 'intermediate'
      WHEN 'athlete' THEN 'intermediate' ELSE 'beginner' END));
  IF v_level NOT IN ('beginner','intermediate','advanced') THEN v_level := 'beginner'; END IF;
  v_goal := CASE lower(COALESCE(v_profile_goal,v_answers->>'goalId',v_answers->>'goal_id',''))
    WHEN 'fat' THEN 'cut' WHEN 'waist' THEN 'cut' WHEN 'cut' THEN 'cut' WHEN 'fat_loss' THEN 'cut'
    WHEN 'muscle' THEN 'bulk' WHEN 'gain' THEN 'bulk' WHEN 'muscle_gain' THEN 'bulk'
    WHEN 'glutes' THEN 'bulk' WHEN 'tone' THEN 'bulk' WHEN 'bulk' THEN 'bulk'
    WHEN 'recomp' THEN 'recomp' WHEN 'body_recomposition' THEN 'recomp'
    WHEN 'fitness' THEN 'fitness' WHEN 'fit' THEN 'fitness' WHEN 'athletic' THEN 'fitness'
    WHEN 'shape' THEN 'fitness' WHEN 'body' THEN 'fitness' ELSE NULL END;
  IF v_gender NOT IN ('male','female') OR v_goal IS NULL THEN
    UPDATE public.client_customer_journeys SET status='complete_setup',
      failure_code=CASE WHEN v_gender NOT IN ('male','female') THEN 'missing_profile_gender' ELSE 'missing_profile_goal' END
    WHERE user_id=p_user_id;
    RETURN;
  END IF;

  v_requested_days := COALESCE(v_journey.preferred_training_days, v_journey.normalized_training_days);
  SELECT EXISTS(
    SELECT 1 FROM public.program_automation_rules r
    WHERE r.is_active AND r.gender=v_gender AND r.goal=v_goal AND r.level=v_level
  ) INTO v_has_managed_rules;

  IF v_has_managed_rules THEN
    SELECT r.training_template_id INTO v_template_id
    FROM public.program_automation_rules r
    JOIN public.program_templates t ON t.id=r.training_template_id
    WHERE r.is_active AND r.gender=v_gender AND r.goal=v_goal AND r.level=v_level
      AND (r.training_days=v_requested_days OR r.is_fallback)
      AND t.is_published IS TRUE AND t.archived_at IS NULL
      AND EXISTS (SELECT 1 FROM public.program_template_weeks w WHERE w.template_id=t.id)
    ORDER BY CASE WHEN r.training_days=v_requested_days THEN 0 ELSE 1 END,
      r.priority ASC, abs(r.training_days-v_requested_days), t.version DESC, r.id
    LIMIT 1;
    IF v_template_id IS NULL THEN
      UPDATE public.client_customer_journeys SET status='failed',failure_code='automation_mapping_missing' WHERE user_id=p_user_id;
      RETURN;
    END IF;
  ELSE
    SELECT t.id INTO v_template_id FROM public.program_templates t
    WHERE t.is_published IS TRUE AND t.archived_at IS NULL AND t.goal::text=v_goal
      AND (t.level IS NULL OR t.level::text=v_level)
      AND NOT (v_goal='bulk' AND t.name_ar ILIKE '%خسارة الدهون%')
      AND NOT (v_goal='cut' AND (t.name_ar ILIKE '%بناء العضلات%' OR t.name_ar ILIKE '%تضخيم%'))
      AND lower(COALESCE(NULLIF(t.metadata->>'target_gender',''),
        NULLIF(t.metadata->'template_contract'->>'target_gender',''),
        NULLIF(t.metadata->>'audience_gender',''), NULLIF(t.metadata->>'gender',''), '')) IN (v_gender,'all')
      AND EXISTS (SELECT 1 FROM public.program_template_weeks w WHERE w.template_id=t.id)
    ORDER BY abs(t.days_per_week-v_journey.normalized_training_days),
      CASE WHEN t.days_per_week>v_journey.normalized_training_days THEN 1 ELSE 0 END,
      CASE WHEN lower(COALESCE(t.metadata->>'target_gender',t.metadata->'template_contract'->>'target_gender',t.metadata->>'audience_gender',t.metadata->>'gender',''))=v_gender THEN 0 ELSE 1 END,
      CASE WHEN t.level::text=v_level THEN 0 ELSE 1 END, t.version DESC, t.id
    LIMIT 1;
  END IF;

  IF v_template_id IS NULL THEN
    UPDATE public.client_customer_journeys SET status='failed',failure_code='no_compatible_template' WHERE user_id=p_user_id;
    RETURN;
  END IF;

  PERFORM public.client_auto_assign_program_template(v_template_id, CURRENT_DATE, false);
  SELECT id INTO v_assignment_id FROM public.client_program_assignments
  WHERE client_id=p_user_id AND status='active' ORDER BY assigned_at DESC LIMIT 1;
  UPDATE public.client_customer_journeys SET status='ready', matched_template_id=v_template_id,
    assignment_id=v_assignment_id, completed_at=now(), failure_code=NULL WHERE user_id=p_user_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Product/admin notifications and safe operator preferences
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.product_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audience_type TEXT NOT NULL CHECK (audience_type IN ('client', 'membership', 'all', 'admin')),
  audience_value TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('critical', 'important', 'info')),
  category TEXT NOT NULL,
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 2 AND 140),
  body TEXT NOT NULL CHECK (char_length(btrim(body)) BETWEEN 2 AND 4000),
  entity_type TEXT,
  entity_id TEXT,
  deep_link TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  read_by UUID[] NOT NULL DEFAULT '{}',
  created_by UUID,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_notifications_admin_idx
  ON public.product_notifications (status, severity, created_at DESC);

CREATE TABLE IF NOT EXISTS public.admin_operator_preferences (
  admin_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  critical_sound_enabled BOOLEAN NOT NULL DEFAULT true,
  important_sound_enabled BOOLEAN NOT NULL DEFAULT true,
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TIME NOT NULL DEFAULT '22:00',
  quiet_hours_end TIME NOT NULL DEFAULT '07:00',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_runtime_settings
  ADD COLUMN IF NOT EXISTS checkout_paused BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS signups_paused BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS promotions_paused BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS free_promo_video_url TEXT,
  ADD COLUMN IF NOT EXISTS primary_cta_text TEXT NOT NULL DEFAULT 'فعّل برنامجك الآن';

-- ---------------------------------------------------------------------------
-- 4. RLS: no direct writes; RPCs remain authoritative
-- ---------------------------------------------------------------------------

ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_operator_preferences ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.product_prices, public.product_promotions, public.promo_codes,
  public.promo_code_redemptions, public.program_automation_rules,
  public.product_notifications, public.admin_operator_preferences FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.product_prices, public.product_promotions, public.promo_codes,
  public.promo_code_redemptions, public.program_automation_rules,
  public.product_notifications, public.admin_operator_preferences TO service_role;

-- ---------------------------------------------------------------------------
-- 5. Admin read model
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_get_mobile_command_center()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin UUID;
BEGIN
  v_admin := public._require_admin();
  RETURN jsonb_build_object(
    'prices', COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.plan, p.term_months, p.version DESC) FROM public.product_prices p WHERE p.status <> 'archived'), '[]'::jsonb),
    'promotions', COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.created_at DESC) FROM public.product_promotions p), '[]'::jsonb),
    'promo_codes', COALESCE((SELECT jsonb_agg(to_jsonb(c) || jsonb_build_object('uses', (SELECT count(*) FROM public.promo_code_redemptions r WHERE r.promo_code_id=c.id)) ORDER BY c.created_at DESC) FROM public.promo_codes c), '[]'::jsonb),
    'automation_rules', COALESCE((SELECT jsonb_agg(to_jsonb(r) || jsonb_build_object('training_template_name', t.name_ar, 'training_template_version', t.version) ORDER BY r.priority, r.created_at DESC) FROM public.program_automation_rules r JOIN public.program_templates t ON t.id=r.training_template_id), '[]'::jsonb),
    'settings', (SELECT to_jsonb(s) FROM public.product_runtime_settings s WHERE singleton=true),
    'preferences', COALESCE((SELECT to_jsonb(p) FROM public.admin_operator_preferences p WHERE p.admin_id=v_admin), jsonb_build_object('sound_enabled',true,'critical_sound_enabled',true,'important_sound_enabled',true,'quiet_hours_enabled',false,'quiet_hours_start','22:00','quiet_hours_end','07:00'))
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_save_base_price(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin UUID; v_plan TEXT; v_term INT; v_amount NUMERIC; v_status TEXT; v_version INT; v_id UUID;
BEGIN
  v_admin := public._require_admin();
  v_plan := lower(btrim(COALESCE(p_payload->>'plan','')));
  v_term := NULLIF(p_payload->>'term_months','')::INT;
  v_amount := NULLIF(p_payload->>'amount','')::NUMERIC;
  v_status := COALESCE(NULLIF(p_payload->>'status',''),'draft');
  IF v_plan NOT IN ('essential','premium','vip') OR v_term NOT IN (3,6) OR v_amount IS NULL OR v_amount < 0 OR v_status NOT IN ('draft','published') THEN
    RAISE EXCEPTION 'invalid_price_payload' USING ERRCODE='22023';
  END IF;
  SELECT COALESCE(max(version),0)+1 INTO v_version FROM public.product_prices WHERE plan=v_plan AND term_months=v_term;
  IF v_status='published' THEN UPDATE public.product_prices SET status='archived',updated_at=now() WHERE plan=v_plan AND term_months=v_term AND status='published'; END IF;
  INSERT INTO public.product_prices(plan,term_months,amount,status,version,published_at,updated_by)
  VALUES(v_plan,v_term,v_amount,v_status,v_version,CASE WHEN v_status='published' THEN now() END,v_admin) RETURNING id INTO v_id;
  PERFORM public._write_audit_event(v_admin,v_admin,'base_price_changed',jsonb_build_object('id',v_id,'plan',v_plan,'term_months',v_term,'amount',v_amount,'status',v_status,'version',v_version));
  RETURN (SELECT to_jsonb(p) FROM public.product_prices p WHERE p.id=v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_save_promotion(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin UUID; v_id UUID; v_row public.product_promotions%ROWTYPE;
BEGIN
  v_admin := public._require_admin();
  v_id := NULLIF(p_payload->>'id','')::UUID;
  INSERT INTO public.product_promotions(id,name,plan,term_months,promotional_price,starts_at,ends_at,status,created_by,published_at)
  VALUES(COALESCE(v_id,gen_random_uuid()),btrim(p_payload->>'name'),lower(p_payload->>'plan'),(p_payload->>'term_months')::INT,(p_payload->>'promotional_price')::NUMERIC,(p_payload->>'starts_at')::TIMESTAMPTZ,(p_payload->>'ends_at')::TIMESTAMPTZ,COALESCE(p_payload->>'status','draft'),v_admin,CASE WHEN p_payload->>'status'='active' THEN now() END)
  ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,plan=EXCLUDED.plan,term_months=EXCLUDED.term_months,promotional_price=EXCLUDED.promotional_price,starts_at=EXCLUDED.starts_at,ends_at=EXCLUDED.ends_at,status=EXCLUDED.status,published_at=CASE WHEN EXCLUDED.status='active' THEN COALESCE(public.product_promotions.published_at,now()) ELSE public.product_promotions.published_at END,updated_at=now()
  RETURNING * INTO v_row;
  PERFORM public._write_audit_event(v_admin,v_admin,'promotion_saved',jsonb_build_object('id',v_row.id,'name',v_row.name,'status',v_row.status));
  RETURN to_jsonb(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_save_promo_code(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin UUID; v_id UUID; v_row public.promo_codes%ROWTYPE;
BEGIN
  v_admin := public._require_admin();
  v_id := NULLIF(p_payload->>'id','')::UUID;
  INSERT INTO public.promo_codes(id,code,discount_type,discount_value,plans,terms,starts_at,expires_at,max_total_uses,one_use_per_client,new_clients_only,status,created_by,published_at)
  VALUES(COALESCE(v_id,gen_random_uuid()),upper(regexp_replace(btrim(p_payload->>'code'),'\s+','','g')),COALESCE(p_payload->>'discount_type','percent'),(p_payload->>'discount_value')::NUMERIC,COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_payload->'plans')),ARRAY['essential','premium']::TEXT[]),COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_payload->'terms'))::INT[],ARRAY[3,6]::INT[]),(p_payload->>'starts_at')::TIMESTAMPTZ,NULLIF(p_payload->>'expires_at','')::TIMESTAMPTZ,NULLIF(p_payload->>'max_total_uses','')::INT,COALESCE((p_payload->>'one_use_per_client')::BOOLEAN,true),COALESCE((p_payload->>'new_clients_only')::BOOLEAN,false),COALESCE(p_payload->>'status','draft'),v_admin,CASE WHEN p_payload->>'status'='active' THEN now() END)
  ON CONFLICT(id) DO UPDATE SET code=EXCLUDED.code,discount_type=EXCLUDED.discount_type,discount_value=EXCLUDED.discount_value,plans=EXCLUDED.plans,terms=EXCLUDED.terms,starts_at=EXCLUDED.starts_at,expires_at=EXCLUDED.expires_at,max_total_uses=EXCLUDED.max_total_uses,one_use_per_client=EXCLUDED.one_use_per_client,new_clients_only=EXCLUDED.new_clients_only,status=EXCLUDED.status,published_at=CASE WHEN EXCLUDED.status='active' THEN COALESCE(public.promo_codes.published_at,now()) ELSE public.promo_codes.published_at END,updated_at=now()
  RETURNING * INTO v_row;
  IF v_row.discount_type='percent' AND v_row.discount_value>100 THEN RAISE EXCEPTION 'invalid_discount' USING ERRCODE='22023'; END IF;
  PERFORM public._write_audit_event(v_admin,v_admin,'promo_code_saved',jsonb_build_object('id',v_row.id,'code',v_row.code,'status',v_row.status));
  RETURN to_jsonb(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_save_automation_rule(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin UUID; v_id UUID; v_row public.program_automation_rules%ROWTYPE; v_template public.program_templates%ROWTYPE; v_target_gender TEXT;
BEGIN
  v_admin := public._require_admin();
  v_id := NULLIF(p_payload->>'id','')::UUID;
  SELECT * INTO v_template FROM public.program_templates WHERE id=(p_payload->>'training_template_id')::UUID;
  IF NOT FOUND OR v_template.is_published IS NOT TRUE OR v_template.archived_at IS NOT NULL THEN
    RAISE EXCEPTION 'template_not_assignable' USING ERRCODE='22023';
  END IF;
  IF v_template.goal::TEXT IS DISTINCT FROM lower(p_payload->>'goal') THEN
    RAISE EXCEPTION 'template_goal_mismatch' USING ERRCODE='22023';
  END IF;
  v_target_gender := lower(COALESCE(NULLIF(v_template.metadata->>'target_gender',''),NULLIF(v_template.metadata->'template_contract'->>'target_gender',''),NULLIF(v_template.metadata->>'audience_gender',''),NULLIF(v_template.metadata->>'gender',''),''));
  IF v_target_gender NOT IN (lower(p_payload->>'gender'),'all') THEN
    RAISE EXCEPTION 'template_gender_mismatch' USING ERRCODE='22023';
  END IF;
  INSERT INTO public.program_automation_rules(id,name,goal,gender,level,training_days,training_template_id,nutrition_blueprint,priority,is_fallback,is_active,created_by)
  VALUES(COALESCE(v_id,gen_random_uuid()),btrim(p_payload->>'name'),lower(p_payload->>'goal'),lower(p_payload->>'gender'),lower(p_payload->>'level'),(p_payload->>'training_days')::INT,(p_payload->>'training_template_id')::UUID,COALESCE(p_payload->'nutrition_blueprint','{}'::jsonb),COALESCE((p_payload->>'priority')::INT,100),COALESCE((p_payload->>'is_fallback')::BOOLEAN,false),COALESCE((p_payload->>'is_active')::BOOLEAN,true),v_admin)
  ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,goal=EXCLUDED.goal,gender=EXCLUDED.gender,level=EXCLUDED.level,training_days=EXCLUDED.training_days,training_template_id=EXCLUDED.training_template_id,nutrition_blueprint=EXCLUDED.nutrition_blueprint,priority=EXCLUDED.priority,is_fallback=EXCLUDED.is_fallback,is_active=EXCLUDED.is_active,updated_at=now()
  RETURNING * INTO v_row;
  PERFORM public._write_audit_event(v_admin,v_admin,'automation_rule_saved',jsonb_build_object('id',v_row.id,'goal',v_row.goal,'gender',v_row.gender,'level',v_row.level,'training_days',v_row.training_days));
  RETURN to_jsonb(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_save_runtime_settings(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin UUID; v_row public.product_runtime_settings%ROWTYPE;
BEGIN
  v_admin := public._require_admin();
  UPDATE public.product_runtime_settings SET
    first_app_preparation_minutes=LEAST(GREATEST(COALESCE((p_payload->>'first_app_preparation_minutes')::INT,first_app_preparation_minutes),1),1440),
    missing_input_window_minutes=LEAST(GREATEST(COALESCE((p_payload->>'missing_input_window_minutes')::INT,missing_input_window_minutes),1),120),
    checkout_paused=COALESCE((p_payload->>'checkout_paused')::BOOLEAN,checkout_paused),
    signups_paused=COALESCE((p_payload->>'signups_paused')::BOOLEAN,signups_paused),
    promotions_paused=COALESCE((p_payload->>'promotions_paused')::BOOLEAN,promotions_paused),
    free_promo_video_url=COALESCE(p_payload->>'free_promo_video_url',free_promo_video_url),
    primary_cta_text=COALESCE(NULLIF(btrim(p_payload->>'primary_cta_text'),''),primary_cta_text),updated_at=now()
  WHERE singleton=true RETURNING * INTO v_row;
  PERFORM public._write_audit_event(v_admin,v_admin,'product_runtime_settings_changed',p_payload);
  RETURN to_jsonb(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_save_operator_preferences(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin UUID; v_row public.admin_operator_preferences%ROWTYPE;
BEGIN
  v_admin := public._require_admin();
  INSERT INTO public.admin_operator_preferences(admin_id,sound_enabled,critical_sound_enabled,important_sound_enabled,quiet_hours_enabled,quiet_hours_start,quiet_hours_end)
  VALUES(v_admin,COALESCE((p_payload->>'sound_enabled')::BOOLEAN,true),COALESCE((p_payload->>'critical_sound_enabled')::BOOLEAN,true),COALESCE((p_payload->>'important_sound_enabled')::BOOLEAN,true),COALESCE((p_payload->>'quiet_hours_enabled')::BOOLEAN,false),COALESCE(NULLIF(p_payload->>'quiet_hours_start','')::TIME,'22:00'),COALESCE(NULLIF(p_payload->>'quiet_hours_end','')::TIME,'07:00'))
  ON CONFLICT(admin_id) DO UPDATE SET sound_enabled=EXCLUDED.sound_enabled,critical_sound_enabled=EXCLUDED.critical_sound_enabled,important_sound_enabled=EXCLUDED.important_sound_enabled,quiet_hours_enabled=EXCLUDED.quiet_hours_enabled,quiet_hours_start=EXCLUDED.quiet_hours_start,quiet_hours_end=EXCLUDED.quiet_hours_end,updated_at=now()
  RETURNING * INTO v_row;
  RETURN to_jsonb(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_send_product_notification(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin UUID; v_row public.product_notifications%ROWTYPE;
BEGIN
  v_admin := public._require_admin();
  INSERT INTO public.product_notifications(audience_type,audience_value,severity,category,title,body,entity_type,entity_id,deep_link,status,created_by,published_at)
  VALUES(COALESCE(p_payload->>'audience_type','admin'),NULLIF(p_payload->>'audience_value',''),COALESCE(p_payload->>'severity','info'),COALESCE(p_payload->>'category','general'),btrim(p_payload->>'title'),btrim(p_payload->>'body'),NULLIF(p_payload->>'entity_type',''),NULLIF(p_payload->>'entity_id',''),NULLIF(p_payload->>'deep_link',''),COALESCE(p_payload->>'status','published'),v_admin,CASE WHEN COALESCE(p_payload->>'status','published')='published' THEN now() END)
  RETURNING * INTO v_row;
  PERFORM public._write_audit_event(v_admin,v_admin,'product_notification_sent',jsonb_build_object('id',v_row.id,'audience_type',v_row.audience_type,'severity',v_row.severity));
  RETURN to_jsonb(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_product_notifications(p_limit INTEGER DEFAULT 50)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin UUID;
BEGIN
  v_admin := public._require_admin();
  RETURN COALESCE((SELECT jsonb_agg(to_jsonb(n) || jsonb_build_object('is_read',v_admin=ANY(n.read_by)) ORDER BY n.created_at DESC) FROM (SELECT * FROM public.product_notifications WHERE status='published' ORDER BY created_at DESC LIMIT LEAST(GREATEST(COALESCE(p_limit,50),1),100)) n),'[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_mark_product_notification_read(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin UUID;
BEGIN
  v_admin := public._require_admin();
  UPDATE public.product_notifications SET read_by=array_append(read_by,v_admin) WHERE id=p_id AND NOT v_admin=ANY(read_by);
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. Shared promotion validation: UI and checkout call the same contract
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.resolve_public_offer(p_plan TEXT,p_term_months INTEGER,p_code TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_settings public.product_runtime_settings%ROWTYPE; v_base NUMERIC; v_final NUMERIC; v_promo public.product_promotions%ROWTYPE; v_code public.promo_codes%ROWTYPE; v_uses BIGINT; v_client_uses BIGINT; v_user UUID:=auth.uid();
BEGIN
  SELECT * INTO v_settings FROM public.product_runtime_settings WHERE singleton=true;
  IF v_settings.checkout_paused THEN RETURN jsonb_build_object('ok',false,'code','CHECKOUT_PAUSED'); END IF;
  SELECT amount INTO v_base FROM public.product_prices WHERE plan=lower(p_plan) AND term_months=p_term_months AND status='published' ORDER BY version DESC LIMIT 1;
  IF v_base IS NULL THEN RETURN jsonb_build_object('ok',false,'code','PRICE_NOT_FOUND'); END IF;
  v_final:=v_base;
  IF NOT v_settings.promotions_paused THEN
    SELECT * INTO v_promo FROM public.product_promotions WHERE plan=lower(p_plan) AND term_months=p_term_months AND status='active' AND now()>=starts_at AND now()<ends_at ORDER BY promotional_price ASC,created_at DESC LIMIT 1;
    IF FOUND THEN v_final:=LEAST(v_final,v_promo.promotional_price); END IF;
  END IF;
  IF NULLIF(btrim(COALESCE(p_code,'')),'') IS NOT NULL THEN
    SELECT * INTO v_code FROM public.promo_codes WHERE upper(code)=upper(btrim(p_code)) AND status='active' AND now()>=starts_at AND (expires_at IS NULL OR now()<expires_at) LIMIT 1;
    IF NOT FOUND OR NOT lower(p_plan)=ANY(v_code.plans) OR NOT p_term_months=ANY(v_code.terms) THEN RETURN jsonb_build_object('ok',false,'code','PROMO_CODE_INVALID','base_amount',v_base,'final_amount',v_final); END IF;
    SELECT count(*) INTO v_uses FROM public.promo_code_redemptions WHERE promo_code_id=v_code.id;
    IF v_code.max_total_uses IS NOT NULL AND v_uses>=v_code.max_total_uses THEN RETURN jsonb_build_object('ok',false,'code','PROMO_CODE_LIMIT_REACHED','base_amount',v_base,'final_amount',v_final); END IF;
    IF v_user IS NOT NULL AND v_code.one_use_per_client THEN SELECT count(*) INTO v_client_uses FROM public.promo_code_redemptions WHERE promo_code_id=v_code.id AND client_id=v_user; IF v_client_uses>0 THEN RETURN jsonb_build_object('ok',false,'code','PROMO_CODE_ALREADY_USED','base_amount',v_base,'final_amount',v_final); END IF; END IF;
    IF v_code.discount_type='percent' THEN v_final:=round(v_final*(1-v_code.discount_value/100),2); ELSE v_final:=GREATEST(0,v_final-v_code.discount_value); END IF;
  END IF;
  RETURN jsonb_build_object('ok',true,'code','OFFER_VALID','plan',lower(p_plan),'term_months',p_term_months,'currency','USD','base_amount',v_base,'final_amount',v_final,'promotion',CASE WHEN v_promo.id IS NULL THEN NULL ELSE jsonb_build_object('id',v_promo.id,'name',v_promo.name,'ends_at',v_promo.ends_at) END,'promo_code',CASE WHEN v_code.id IS NULL THEN NULL ELSE jsonb_build_object('id',v_code.id,'code',v_code.code,'discount_type',v_code.discount_type,'discount_value',v_code.discount_value) END,'validated_at',now());
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. Read-only client experience preview and operational alerts
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_get_client_experience_preview(p_client_id UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_profile public.profiles%ROWTYPE; v_answers JSONB:='{}'::jsonb; v_assignment UUID; v_nutrition UUID;
BEGIN
  PERFORM public._require_admin();
  SELECT * INTO v_profile FROM public.profiles WHERE id=p_client_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT COALESCE(answers,'{}'::jsonb) INTO v_answers FROM public.training_profiles WHERE user_id=p_client_id;
  SELECT id INTO v_assignment FROM public.client_program_assignments WHERE client_id=p_client_id AND status IN ('active','scheduled') ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END,assigned_at DESC LIMIT 1;
  SELECT id INTO v_nutrition FROM public.client_nutrition_assignments WHERE client_id=p_client_id AND status IN ('active','scheduled') ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END,assigned_at DESC LIMIT 1;
  RETURN jsonb_build_object('client',jsonb_build_object('id',v_profile.id,'name',v_profile.full_name,'avatar_path',v_profile.avatar_path,'goal',v_profile.goal,'gender',v_answers->>'gender','level',COALESCE(v_answers->>'trainingLevel',v_answers->>'experienceLevel'),'training_days',COALESCE(v_answers->>'preferredTrainingDays',v_answers->>'trainingDaysPerWeek')),'membership',(SELECT to_jsonb(m) FROM public.memberships m WHERE m.user_id=p_client_id AND m.is_active=true ORDER BY m.starts_at DESC LIMIT 1),'training',CASE WHEN v_assignment IS NULL THEN NULL ELSE public._assignment_tree(v_assignment) END,'nutrition',CASE WHEN v_nutrition IS NULL THEN NULL ELSE public._nutrition_tree(v_nutrition) END,'locks',jsonb_build_object('training_locked',v_assignment IS NULL,'nutrition_locked',v_nutrition IS NULL));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_operational_alerts()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._require_admin();
  RETURN COALESCE((
    WITH alerts AS (
      SELECT 'missing_training:'||p.id AS id,'important' AS severity,'program_missing' AS category,p.id AS client_id,p.full_name AS client_name,'عميل بدون برنامج تدريبي' AS title,'/admin/clients/'||p.id||'?tab=training' AS deep_link,p.created_at
      FROM public.profiles p WHERE COALESCE(p.account_status,'active')='active' AND NOT EXISTS(SELECT 1 FROM public.client_program_assignments a WHERE a.client_id=p.id AND a.status IN ('active','scheduled','draft'))
      UNION ALL
      SELECT 'missing_nutrition:'||p.id,'important','nutrition_missing',p.id,p.full_name,'عميل بدون خطة تغذية','/admin/clients/'||p.id||'?tab=nutrition',p.created_at
      FROM public.profiles p WHERE COALESCE(p.account_status,'active')='active' AND NOT EXISTS(SELECT 1 FROM public.client_nutrition_assignments a WHERE a.client_id=p.id AND a.status IN ('active','scheduled','draft'))
      UNION ALL
      SELECT 'journey_failed:'||j.user_id,'critical','assignment_failed',j.user_id,p.full_name,'فشل التعيين التلقائي: '||COALESCE(j.failure_code,'unknown'),'/admin/clients/'||j.user_id||'?tab=training',j.updated_at
      FROM public.client_customer_journeys j JOIN public.profiles p ON p.id=j.user_id WHERE j.status='failed'
      UNION ALL
      SELECT 'promotion_invalid:'||x.id,'critical','promotion_configuration',NULL,NULL,'عرض نشط خارج نطاقه الزمني','/admin/commercial',x.updated_at
      FROM public.product_promotions x WHERE x.status='active' AND (x.ends_at<=x.starts_at OR x.ends_at<=now())
    ) SELECT jsonb_agg(to_jsonb(alerts) ORDER BY CASE severity WHEN 'critical' THEN 0 ELSE 1 END,created_at DESC) FROM alerts
  ),'[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_mobile_command_center() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_save_base_price(JSONB) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_save_promotion(JSONB) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_save_promo_code(JSONB) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_save_automation_rule(JSONB) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_save_runtime_settings(JSONB) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_save_operator_preferences(JSONB) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_send_product_notification(JSONB) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_list_product_notifications(INTEGER) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_mark_product_notification_read(UUID) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_get_client_experience_preview(UUID) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_list_operational_alerts() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.resolve_public_offer(TEXT,INTEGER,TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_get_mobile_command_center() TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_save_base_price(JSONB) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_save_promotion(JSONB) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_save_promo_code(JSONB) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_save_automation_rule(JSONB) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_save_runtime_settings(JSONB) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_save_operator_preferences(JSONB) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_send_product_notification(JSONB) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_product_notifications(INTEGER) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_mark_product_notification_read(UUID) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_client_experience_preview(UUID) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_operational_alerts() TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.resolve_public_offer(TEXT,INTEGER,TEXT) TO anon,authenticated,service_role;

COMMIT;
