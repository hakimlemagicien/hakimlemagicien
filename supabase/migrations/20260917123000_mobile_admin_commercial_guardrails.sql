-- Commercial V1 guardrails: fail closed on empty campaign scopes and enforce
-- the "new clients only" promo-code contract in the shared server resolver.

BEGIN;

ALTER TABLE public.promo_codes
  ADD CONSTRAINT promo_codes_plans_nonempty CHECK (cardinality(plans) > 0),
  ADD CONSTRAINT promo_codes_terms_nonempty CHECK (cardinality(terms) > 0),
  ADD CONSTRAINT promo_codes_plans_supported CHECK (plans <@ ARRAY['essential','premium','vip']::TEXT[]),
  ADD CONSTRAINT promo_codes_terms_supported CHECK (terms <@ ARRAY[3,6]::INTEGER[]),
  ADD CONSTRAINT promo_codes_percent_valid CHECK (discount_type <> 'percent' OR discount_value <= 100);

CREATE OR REPLACE FUNCTION public.resolve_public_offer(p_plan TEXT,p_term_months INTEGER,p_code TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_settings public.product_runtime_settings%ROWTYPE;
  v_base NUMERIC;
  v_final NUMERIC;
  v_promo public.product_promotions%ROWTYPE;
  v_code public.promo_codes%ROWTYPE;
  v_uses BIGINT;
  v_client_uses BIGINT;
  v_user UUID:=auth.uid();
  v_existing_paid BOOLEAN:=false;
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
    IF v_user IS NOT NULL AND v_code.one_use_per_client THEN
      SELECT count(*) INTO v_client_uses FROM public.promo_code_redemptions WHERE promo_code_id=v_code.id AND client_id=v_user;
      IF v_client_uses>0 THEN RETURN jsonb_build_object('ok',false,'code','PROMO_CODE_ALREADY_USED','base_amount',v_base,'final_amount',v_final); END IF;
    END IF;
    IF v_code.new_clients_only THEN
      IF v_user IS NULL THEN RETURN jsonb_build_object('ok',false,'code','PROMO_CODE_LOGIN_REQUIRED','base_amount',v_base,'final_amount',v_final); END IF;
      SELECT EXISTS(
        SELECT 1 FROM public.memberships m
        WHERE m.user_id=v_user AND lower(COALESCE(m.tier::TEXT,'free'))<>'free'
      ) INTO v_existing_paid;
      IF v_existing_paid THEN RETURN jsonb_build_object('ok',false,'code','PROMO_CODE_NEW_CLIENTS_ONLY','base_amount',v_base,'final_amount',v_final); END IF;
    END IF;
    IF v_code.discount_type='percent' THEN v_final:=round(v_final*(1-v_code.discount_value/100),2); ELSE v_final:=GREATEST(0,v_final-v_code.discount_value); END IF;
  END IF;
  RETURN jsonb_build_object('ok',true,'code','OFFER_VALID','plan',lower(p_plan),'term_months',p_term_months,'currency','USD','base_amount',v_base,'final_amount',v_final,'promotion',CASE WHEN v_promo.id IS NULL THEN NULL ELSE jsonb_build_object('id',v_promo.id,'name',v_promo.name,'ends_at',v_promo.ends_at) END,'promo_code',CASE WHEN v_code.id IS NULL THEN NULL ELSE jsonb_build_object('id',v_code.id,'code',v_code.code,'discount_type',v_code.discount_type,'discount_value',v_code.discount_value) END,'validated_at',now());
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_public_offer(TEXT,INTEGER,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_public_offer(TEXT,INTEGER,TEXT) TO anon,authenticated,service_role;

COMMIT;
