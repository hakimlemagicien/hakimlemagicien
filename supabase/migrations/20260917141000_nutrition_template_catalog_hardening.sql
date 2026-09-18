-- Nutrition Template Catalog V1 hardening: official mapping + 7x6 curated slot safety.
BEGIN;

CREATE OR REPLACE FUNCTION public._nutrition_template_guard_row()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
DECLARE v_goal TEXT;
BEGIN
  PERFORM public._validate_nutrition_template_goals(NEW.mapped_goals);
  FOREACH v_goal IN ARRAY NEW.mapped_goals LOOP
    IF (v_goal='FAT_LOSS' AND NEW.strategy_bucket<>'FAT_LOSS')
      OR (v_goal='MUSCLE_GAIN' AND NEW.strategy_bucket<>'MUSCLE_GAIN')
      OR (v_goal='GLUTE_GROWTH' AND NEW.strategy_bucket<>'MUSCLE_GAIN')
      OR (v_goal='BODY_RECOMPOSITION' AND NEW.strategy_bucket<>'MAINTENANCE')
      OR (v_goal IN ('MOBILITY_RECOVERY','POSTURE_BACK_HEALTH') AND NEW.strategy_bucket<>'MAINTENANCE')
      OR (v_goal IN ('WAIST_DEFINITION','FITNESS_ENDURANCE','GENERAL_HEALTH_FITNESS') AND NEW.strategy_bucket NOT IN ('FAT_LOSS','MAINTENANCE'))
      OR (v_goal IN ('UPPER_BODY_DEFINITION','FEMININE_BALANCED_BODY','STRENGTH_PERFORMANCE') AND NEW.strategy_bucket NOT IN ('MUSCLE_GAIN','MAINTENANCE')) THEN
      RAISE EXCEPTION 'goal_strategy_bucket_mismatch:%:%',v_goal,NEW.strategy_bucket USING ERRCODE='22023';
    END IF;
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_nutrition_templates_official_mapping ON public.nutrition_templates;
CREATE TRIGGER trg_nutrition_templates_official_mapping
  BEFORE INSERT OR UPDATE OF strategy_bucket,mapped_goals ON public.nutrition_templates
  FOR EACH ROW EXECUTE FUNCTION public._nutrition_template_guard_row();

CREATE OR REPLACE FUNCTION public._nutrition_template_validate_curated_plan(p_plan JSONB)
RETURNS VOID LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_day JSONB; v_slots JSONB; v_slot_key TEXT; v_meal JSONB; v_normalized JSONB; v_day_numbers INT[]:='{}';
BEGIN
  IF jsonb_typeof(COALESCE(p_plan,'[]'::jsonb))<>'array' OR jsonb_array_length(p_plan)<>7 THEN
    RAISE EXCEPTION 'seven_day_curated_plan_required' USING ERRCODE='22023';
  END IF;
  FOR v_day IN SELECT * FROM jsonb_array_elements(p_plan) LOOP
    IF COALESCE((v_day->>'day')::INT,0) NOT BETWEEN 1 AND 7 OR (v_day->>'day')::INT=ANY(v_day_numbers) THEN
      RAISE EXCEPTION 'unique_day_1_to_7_required' USING ERRCODE='22023';
    END IF;
    v_day_numbers:=array_append(v_day_numbers,(v_day->>'day')::INT);
    v_slots:=v_day->'slots';
    IF jsonb_typeof(v_slots)<>'object' OR (SELECT count(*) FROM jsonb_object_keys(v_slots))<>6 THEN
      RAISE EXCEPTION 'six_slots_per_day_required' USING ERRCODE='22023';
    END IF;
    v_normalized:='[]'::jsonb;
    FOREACH v_slot_key IN ARRAY ARRAY['breakfast','lunch','snack','dinner','pre_workout','post_workout'] LOOP
      v_meal:=v_slots->v_slot_key;
      IF v_meal IS NULL OR COALESCE(v_meal->>'external_id',v_meal->>'source_external_id','')='' THEN
        RAISE EXCEPTION 'curated_slot_meal_required:%',v_slot_key USING ERRCODE='22023';
      END IF;
      v_normalized:=v_normalized||jsonb_build_array(jsonb_build_object('slot_key',v_slot_key,'source_external_id',COALESCE(v_meal->>'external_id',v_meal->>'source_external_id')));
    END LOOP;
    PERFORM public._nutrition_template_validate_slots(v_normalized);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.admin_publish_nutrition_template(p_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_admin UUID; v_row public.nutrition_templates%ROWTYPE;
BEGIN
  v_admin:=public._require_admin();
  SELECT * INTO v_row FROM public.nutrition_templates WHERE id=p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='P0002'; END IF;
  IF v_row.status<>'draft' THEN RAISE EXCEPTION 'template_not_draft' USING ERRCODE='22023'; END IF;
  IF jsonb_array_length(v_row.slot_structure)<>6 THEN RAISE EXCEPTION 'six_slots_required' USING ERRCODE='22023'; END IF;
  IF v_row.selection_mode='curated' THEN PERFORM public._nutrition_template_validate_curated_plan(v_row.curated_plan); END IF;
  IF v_row.is_default THEN UPDATE public.nutrition_templates SET is_default=false,updated_by=v_admin WHERE strategy_bucket=v_row.strategy_bucket AND status='published' AND is_default; END IF;
  UPDATE public.nutrition_templates SET status='published',published_at=now(),updated_by=v_admin WHERE id=p_id RETURNING * INTO v_row;
  PERFORM public._write_audit_event(v_admin,v_admin,'nutrition_template_published',jsonb_build_object('template_id',p_id,'template_key',v_row.template_key,'version',v_row.version,'selection_mode',v_row.selection_mode));
  RETURN to_jsonb(v_row);
END $$;

REVOKE ALL ON FUNCTION public._nutrition_template_guard_row() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public._nutrition_template_validate_curated_plan(JSONB) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_publish_nutrition_template(UUID) TO authenticated,service_role;

COMMIT;
