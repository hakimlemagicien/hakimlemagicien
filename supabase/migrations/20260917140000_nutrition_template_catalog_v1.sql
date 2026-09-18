-- Nutrition Template Catalog V1
-- Master template -> immutable client snapshot -> client-only override.

BEGIN;

CREATE TABLE IF NOT EXISTS public.nutrition_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description_ar TEXT,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  parent_version_id UUID REFERENCES public.nutrition_templates(id) ON DELETE SET NULL,
  strategy_bucket TEXT NOT NULL CHECK (strategy_bucket IN ('FAT_LOSS','MUSCLE_GAIN','MAINTENANCE')),
  mapped_goals TEXT[] NOT NULL DEFAULT '{}',
  gender_scope TEXT NOT NULL DEFAULT 'all' CHECK (gender_scope IN ('all','male','female')),
  selection_mode TEXT NOT NULL DEFAULT 'calculated' CHECK (selection_mode IN ('calculated','curated')),
  cycle_days INTEGER NOT NULL DEFAULT 7 CHECK (cycle_days = 7),
  meals_per_day INTEGER NOT NULL DEFAULT 6 CHECK (meals_per_day = 6),
  slot_structure JSONB NOT NULL DEFAULT '[]'::jsonb,
  selection_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  curated_plan JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  UNIQUE (template_key, version),
  CHECK (template_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CHECK (cardinality(mapped_goals) > 0),
  CHECK (jsonb_typeof(slot_structure) = 'array'),
  CHECK (jsonb_typeof(selection_rules) = 'object'),
  CHECK (jsonb_typeof(curated_plan) = 'array')
);

CREATE UNIQUE INDEX IF NOT EXISTS nutrition_templates_one_draft_per_key
  ON public.nutrition_templates(template_key) WHERE status = 'draft';
CREATE UNIQUE INDEX IF NOT EXISTS nutrition_templates_one_default_per_bucket
  ON public.nutrition_templates(strategy_bucket) WHERE status = 'published' AND is_active AND is_default;
CREATE INDEX IF NOT EXISTS nutrition_templates_status_idx
  ON public.nutrition_templates(status, strategy_bucket, updated_at DESC);

DROP TRIGGER IF EXISTS trg_nutrition_templates_updated_at ON public.nutrition_templates;
CREATE TRIGGER trg_nutrition_templates_updated_at
  BEFORE UPDATE ON public.nutrition_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.nutrition_templates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.nutrition_templates FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.nutrition_templates TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.nutrition_templates TO authenticated;

DROP POLICY IF EXISTS nutrition_templates_admin_all ON public.nutrition_templates;
CREATE POLICY nutrition_templates_admin_all ON public.nutrition_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.client_nutrition_assignments
  ADD COLUMN IF NOT EXISTS source_nutrition_template_id UUID REFERENCES public.nutrition_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_nutrition_template_version INTEGER,
  ADD COLUMN IF NOT EXISTS nutrition_template_snapshot JSONB;

CREATE INDEX IF NOT EXISTS client_nutrition_assignments_template_idx
  ON public.client_nutrition_assignments(source_nutrition_template_id);

CREATE OR REPLACE FUNCTION public._nutrition_template_slot_structure()
RETURNS JSONB LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_build_array(
    jsonb_build_object('slot_key','breakfast','label_ar','الفطور','allowed_types',jsonb_build_array('breakfast')),
    jsonb_build_object('slot_key','lunch','label_ar','وجبة رئيسية 1','allowed_types',jsonb_build_array('lunch')),
    jsonb_build_object('slot_key','snack','label_ar','وجبة رئيسية / سناك','allowed_types',jsonb_build_array('snack')),
    jsonb_build_object('slot_key','dinner','label_ar','وجبة رئيسية 2','allowed_types',jsonb_build_array('dinner')),
    jsonb_build_object('slot_key','pre_workout','label_ar','قبل التمرين','allowed_types',jsonb_build_array('pre_workout'),'conservative',true),
    jsonb_build_object('slot_key','post_workout','label_ar','بعد التمرين','allowed_types',jsonb_build_array('post_workout'),'conservative',true)
  )
$$;

CREATE OR REPLACE FUNCTION public._nutrition_template_selection_rules()
RETURNS JSONB LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_build_object(
    'deterministic',true,
    'target_source','nutrition-strategy-v1',
    'breakfast',jsonb_build_object('meal_type','breakfast'),
    'main',jsonb_build_object('meal_types',jsonb_build_array('lunch','dinner')),
    'pre_workout',jsonb_build_object('meal_type','pre_workout','min_carbs_g',20,'max_fat_g',15,'max_fiber_g',10,'max_calories',500,'max_serving_size',600),
    'post_workout',jsonb_build_object('meal_type','post_workout','min_protein_g',20,'min_carbs_g',20,'max_fat_g',20,'max_calories',700,'max_serving_size',700),
    'fallback','FAIL_CLOSED_SAME_SLOT_ONLY',
    'avoid_consecutive_repeat',true
  )
$$;

INSERT INTO public.nutrition_templates (
  template_key,name_ar,description_ar,version,strategy_bucket,mapped_goals,selection_mode,
  cycle_days,meals_per_day,slot_structure,selection_rules,status,is_active,is_default,published_at
) VALUES
  ('fat-loss-v1','قالب خسارة الدهون V1','قالب محسوب؛ العجز والبروتين من Nutrition Strategy V1.',1,'FAT_LOSS',ARRAY['FAT_LOSS','WAIST_DEFINITION'],'calculated',7,6,public._nutrition_template_slot_structure(),public._nutrition_template_selection_rules(),'published',true,true,now()),
  ('muscle-gain-v1','قالب بناء العضلات V1','قالب محسوب؛ فائض مضبوط ودعم كربوهيدرات حول التدريب.',1,'MUSCLE_GAIN',ARRAY['MUSCLE_GAIN','GLUTE_GROWTH','UPPER_BODY_DEFINITION','FEMININE_BALANCED_BODY','STRENGTH_PERFORMANCE'],'calculated',7,6,public._nutrition_template_slot_structure(),public._nutrition_template_selection_rules(),'published',true,true,now()),
  ('maintenance-v1','قالب الثبات والصحة العامة V1','قالب محسوب للثبات والأداء والتعافي وإعادة التركيب.',1,'MAINTENANCE',ARRAY['BODY_RECOMPOSITION','WAIST_DEFINITION','UPPER_BODY_DEFINITION','FEMININE_BALANCED_BODY','STRENGTH_PERFORMANCE','FITNESS_ENDURANCE','MOBILITY_RECOVERY','POSTURE_BACK_HEALTH','GENERAL_HEALTH_FITNESS'],'calculated',7,6,public._nutrition_template_slot_structure(),public._nutrition_template_selection_rules(),'published',true,true,now())
ON CONFLICT (template_key,version) DO NOTHING;

CREATE OR REPLACE FUNCTION public._validate_nutrition_template_goals(p_goals TEXT[])
RETURNS VOID LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE v_goal TEXT;
BEGIN
  IF p_goals IS NULL OR cardinality(p_goals)=0 THEN RAISE EXCEPTION 'mapped_goals_required' USING ERRCODE='22023'; END IF;
  FOREACH v_goal IN ARRAY p_goals LOOP
    IF v_goal NOT IN ('FAT_LOSS','MUSCLE_GAIN','BODY_RECOMPOSITION','GLUTE_GROWTH','WAIST_DEFINITION','UPPER_BODY_DEFINITION','FEMININE_BALANCED_BODY','STRENGTH_PERFORMANCE','FITNESS_ENDURANCE','MOBILITY_RECOVERY','POSTURE_BACK_HEALTH','GENERAL_HEALTH_FITNESS') THEN
      RAISE EXCEPTION 'invalid_mapped_goal' USING ERRCODE='22023';
    END IF;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.admin_list_nutrition_templates()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  PERFORM public._require_admin();
  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(t) || jsonb_build_object(
      'assigned_clients',(SELECT count(DISTINCT a.client_id) FROM public.client_nutrition_assignments a WHERE a.source_nutrition_template_id=t.id AND a.status IN ('active','scheduled'))
    ) ORDER BY CASE t.status WHEN 'draft' THEN 0 WHEN 'published' THEN 1 ELSE 2 END,t.updated_at DESC)
    FROM public.nutrition_templates t
  ),'[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.admin_get_nutrition_template(p_id UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v JSONB;
BEGIN
  PERFORM public._require_admin();
  SELECT to_jsonb(t) || jsonb_build_object(
    'assigned_clients',(SELECT count(DISTINCT a.client_id) FROM public.client_nutrition_assignments a WHERE a.source_nutrition_template_id=t.id AND a.status IN ('active','scheduled'))
  ) INTO v FROM public.nutrition_templates t WHERE t.id=p_id;
  IF v IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='P0002'; END IF;
  RETURN v;
END $$;

CREATE OR REPLACE FUNCTION public.admin_save_nutrition_template(p_payload JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_admin UUID; v_id UUID; v_goals TEXT[]; v_row public.nutrition_templates%ROWTYPE; v_key TEXT; v_bucket TEXT;
BEGIN
  v_admin:=public._require_admin();
  v_id:=NULLIF(p_payload->>'id','')::UUID;
  v_key:=lower(btrim(COALESCE(p_payload->>'template_key','')));
  v_bucket:=upper(btrim(COALESCE(p_payload->>'strategy_bucket','')));
  v_goals:=ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'mapped_goals','[]'::jsonb)));
  PERFORM public._validate_nutrition_template_goals(v_goals);
  IF v_key !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' OR btrim(COALESCE(p_payload->>'name_ar',''))='' OR v_bucket NOT IN ('FAT_LOSS','MUSCLE_GAIN','MAINTENANCE') THEN
    RAISE EXCEPTION 'invalid_template_payload' USING ERRCODE='22023';
  END IF;
  IF v_id IS NULL THEN
    INSERT INTO public.nutrition_templates(template_key,name_ar,description_ar,strategy_bucket,mapped_goals,gender_scope,selection_mode,cycle_days,meals_per_day,slot_structure,selection_rules,curated_plan,notes,status,is_active,is_default,created_by,updated_by)
    VALUES(v_key,btrim(p_payload->>'name_ar'),NULLIF(p_payload->>'description_ar',''),v_bucket,v_goals,COALESCE(NULLIF(p_payload->>'gender_scope',''),'all'),COALESCE(NULLIF(p_payload->>'selection_mode',''),'calculated'),7,6,COALESCE(p_payload->'slot_structure',public._nutrition_template_slot_structure()),COALESCE(p_payload->'selection_rules',public._nutrition_template_selection_rules()),COALESCE(p_payload->'curated_plan','[]'::jsonb),NULLIF(p_payload->>'notes',''),'draft',COALESCE((p_payload->>'is_active')::BOOLEAN,true),COALESCE((p_payload->>'is_default')::BOOLEAN,false),v_admin,v_admin)
    RETURNING * INTO v_row;
  ELSE
    SELECT * INTO v_row FROM public.nutrition_templates WHERE id=v_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='P0002'; END IF;
    IF v_row.status<>'draft' THEN RAISE EXCEPTION 'published_template_immutable' USING ERRCODE='22023'; END IF;
    UPDATE public.nutrition_templates SET template_key=v_key,name_ar=btrim(p_payload->>'name_ar'),description_ar=NULLIF(p_payload->>'description_ar',''),strategy_bucket=v_bucket,mapped_goals=v_goals,gender_scope=COALESCE(NULLIF(p_payload->>'gender_scope',''),'all'),selection_mode=COALESCE(NULLIF(p_payload->>'selection_mode',''),'calculated'),slot_structure=COALESCE(p_payload->'slot_structure',slot_structure),selection_rules=COALESCE(p_payload->'selection_rules',selection_rules),curated_plan=COALESCE(p_payload->'curated_plan',curated_plan),notes=NULLIF(p_payload->>'notes',''),is_active=COALESCE((p_payload->>'is_active')::BOOLEAN,is_active),is_default=COALESCE((p_payload->>'is_default')::BOOLEAN,is_default),updated_by=v_admin
    WHERE id=v_id RETURNING * INTO v_row;
  END IF;
  PERFORM public._write_audit_event(v_admin,v_admin,'nutrition_template_saved',jsonb_build_object('template_id',v_row.id,'template_key',v_row.template_key,'version',v_row.version,'status',v_row.status));
  RETURN to_jsonb(v_row);
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
  IF v_row.selection_mode='curated' AND jsonb_array_length(v_row.curated_plan)<>7 THEN RAISE EXCEPTION 'seven_day_curated_plan_required' USING ERRCODE='22023'; END IF;
  IF v_row.is_default THEN UPDATE public.nutrition_templates SET is_default=false,updated_by=v_admin WHERE strategy_bucket=v_row.strategy_bucket AND status='published' AND is_default; END IF;
  UPDATE public.nutrition_templates SET status='published',published_at=now(),updated_by=v_admin WHERE id=p_id RETURNING * INTO v_row;
  PERFORM public._write_audit_event(v_admin,v_admin,'nutrition_template_published',jsonb_build_object('template_id',p_id,'template_key',v_row.template_key,'version',v_row.version));
  RETURN to_jsonb(v_row);
END $$;

CREATE OR REPLACE FUNCTION public.admin_create_nutrition_template_version(p_source_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_admin UUID; v_src public.nutrition_templates%ROWTYPE; v_row public.nutrition_templates%ROWTYPE; v_version INT;
BEGIN
  v_admin:=public._require_admin();
  SELECT * INTO v_src FROM public.nutrition_templates WHERE id=p_source_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='P0002'; END IF;
  IF EXISTS(SELECT 1 FROM public.nutrition_templates WHERE template_key=v_src.template_key AND status='draft') THEN RAISE EXCEPTION 'draft_exists' USING ERRCODE='22023'; END IF;
  SELECT COALESCE(max(version),0)+1 INTO v_version FROM public.nutrition_templates WHERE template_key=v_src.template_key;
  INSERT INTO public.nutrition_templates(template_key,name_ar,description_ar,version,parent_version_id,strategy_bucket,mapped_goals,gender_scope,selection_mode,cycle_days,meals_per_day,slot_structure,selection_rules,curated_plan,notes,status,is_active,is_default,created_by,updated_by)
  SELECT template_key,name_ar||' — مسودة V'||v_version,description_ar,v_version,id,strategy_bucket,mapped_goals,gender_scope,selection_mode,cycle_days,meals_per_day,slot_structure,selection_rules,curated_plan,notes,'draft',true,false,v_admin,v_admin FROM public.nutrition_templates WHERE id=p_source_id
  RETURNING * INTO v_row;
  PERFORM public._write_audit_event(v_admin,v_admin,'nutrition_template_version_created',jsonb_build_object('template_id',v_row.id,'source_id',p_source_id,'version',v_version));
  RETURN to_jsonb(v_row);
END $$;

CREATE OR REPLACE FUNCTION public.admin_duplicate_nutrition_template(p_source_id UUID,p_template_key TEXT,p_name_ar TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_admin UUID; v_row public.nutrition_templates%ROWTYPE;
BEGIN
  v_admin:=public._require_admin();
  IF lower(btrim(p_template_key)) !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' THEN RAISE EXCEPTION 'invalid_template_key' USING ERRCODE='22023'; END IF;
  INSERT INTO public.nutrition_templates(template_key,name_ar,description_ar,version,strategy_bucket,mapped_goals,gender_scope,selection_mode,cycle_days,meals_per_day,slot_structure,selection_rules,curated_plan,notes,status,is_active,is_default,created_by,updated_by)
  SELECT lower(btrim(p_template_key)),btrim(p_name_ar),description_ar,1,strategy_bucket,mapped_goals,gender_scope,selection_mode,cycle_days,meals_per_day,slot_structure,selection_rules,curated_plan,notes,'draft',true,false,v_admin,v_admin FROM public.nutrition_templates WHERE id=p_source_id
  RETURNING * INTO v_row;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='P0002'; END IF;
  PERFORM public._write_audit_event(v_admin,v_admin,'nutrition_template_duplicated',jsonb_build_object('template_id',v_row.id,'source_id',p_source_id));
  RETURN to_jsonb(v_row);
END $$;

CREATE OR REPLACE FUNCTION public.admin_archive_nutrition_template(p_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_admin UUID; v_row public.nutrition_templates%ROWTYPE;
BEGIN
  v_admin:=public._require_admin();
  UPDATE public.nutrition_templates SET status='archived',is_active=false,is_default=false,archived_at=now(),updated_by=v_admin WHERE id=p_id AND status<>'archived' RETURNING * INTO v_row;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'not_found_or_archived' USING ERRCODE='P0002'; END IF;
  PERFORM public._write_audit_event(v_admin,v_admin,'nutrition_template_archived',jsonb_build_object('template_id',p_id,'template_key',v_row.template_key,'version',v_row.version));
  RETURN to_jsonb(v_row);
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_default_nutrition_template(p_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_admin UUID; v_row public.nutrition_templates%ROWTYPE;
BEGIN
  v_admin:=public._require_admin();
  SELECT * INTO v_row FROM public.nutrition_templates WHERE id=p_id AND status='published' AND is_active FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'published_template_required' USING ERRCODE='22023'; END IF;
  UPDATE public.nutrition_templates SET is_default=false,updated_by=v_admin WHERE strategy_bucket=v_row.strategy_bucket AND is_default;
  UPDATE public.nutrition_templates SET is_default=true,updated_by=v_admin WHERE id=p_id RETURNING * INTO v_row;
  PERFORM public._write_audit_event(v_admin,v_admin,'nutrition_template_default_changed',jsonb_build_object('template_id',p_id,'strategy_bucket',v_row.strategy_bucket));
  RETURN to_jsonb(v_row);
END $$;

CREATE OR REPLACE FUNCTION public._nutrition_template_validate_slots(p_slots JSONB)
RETURNS VOID LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_item JSONB; v_meal public.meals%ROWTYPE; v_key TEXT;
BEGIN
  IF jsonb_array_length(COALESCE(p_slots,'[]'::jsonb))<>6 OR (SELECT count(DISTINCT x->>'slot_key') FROM jsonb_array_elements(p_slots)x)<>6 THEN RAISE EXCEPTION 'six_unique_slots_required' USING ERRCODE='22023'; END IF;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_slots) LOOP
    v_key:=v_item->>'slot_key';
    SELECT * INTO v_meal FROM public.meals WHERE external_id=v_item->>'source_external_id' AND status='published' AND is_active LIMIT 1;
    IF NOT FOUND THEN RAISE EXCEPTION 'meal_not_assignable' USING ERRCODE='22023'; END IF;
    IF (v_key='breakfast' AND v_meal.meal_type::text<>'breakfast') OR (v_key='lunch' AND v_meal.meal_type::text<>'lunch') OR (v_key='dinner' AND v_meal.meal_type::text<>'dinner') OR (v_key='snack' AND v_meal.meal_type::text<>'snack') THEN RAISE EXCEPTION 'unsafe_slot_meal' USING ERRCODE='22023'; END IF;
    IF v_key='pre_workout' AND NOT (v_meal.meal_type::text='pre_workout' AND v_meal.carbs_g>=20 AND v_meal.fat_g<=15 AND COALESCE((v_meal.qa->>'derived_fiber_g')::numeric,999)<=10 AND v_meal.calories<=500 AND v_meal.serving_size<=600) THEN RAISE EXCEPTION 'unsafe_pre_workout_meal' USING ERRCODE='22023'; END IF;
    IF v_key='post_workout' AND NOT (v_meal.meal_type::text='post_workout' AND v_meal.protein_g>=20 AND v_meal.carbs_g>=20 AND v_meal.fat_g<=20 AND v_meal.calories<=700 AND v_meal.serving_size<=700) THEN RAISE EXCEPTION 'unsafe_post_workout_meal' USING ERRCODE='22023'; END IF;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.admin_assign_nutrition_template(p_client_id UUID,p_template_id UUID,p_payload JSONB,p_starts_on DATE DEFAULT CURRENT_DATE,p_publish BOOLEAN DEFAULT false)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_admin UUID; v_template public.nutrition_templates%ROWTYPE; v_id UUID; v_target_id UUID; v_target_version INT; v_assignment_version INT; v_trace_id UUID; v_result JSONB; v_window TEXT; v_objective TEXT;
BEGIN
  v_admin:=public._require_admin();
  SELECT * INTO v_template FROM public.nutrition_templates WHERE id=p_template_id AND status='published' AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'published_template_required' USING ERRCODE='22023'; END IF;
  SELECT training_meal_window INTO v_window FROM public.client_customer_journeys WHERE user_id=p_client_id;
  IF v_window IS NULL THEN RAISE EXCEPTION 'TRAINING_TIME_REQUIRED' USING ERRCODE='22023'; END IF;
  PERFORM public._nutrition_strategy_guard_allergy(p_client_id);
  PERFORM public._nutrition_template_validate_slots(p_payload->'slots');
  v_objective:=p_payload->'target'->>'nutrition_objective';
  IF (v_template.strategy_bucket='FAT_LOSS' AND v_objective<>'FAT_LOSS') OR (v_template.strategy_bucket='MUSCLE_GAIN' AND v_objective<>'MUSCLE_GAIN') OR (v_template.strategy_bucket='MAINTENANCE' AND v_objective IN ('FAT_LOSS','MUSCLE_GAIN')) THEN RAISE EXCEPTION 'template_strategy_mismatch' USING ERRCODE='22023'; END IF;
  IF EXISTS(SELECT 1 FROM public.client_nutrition_assignments WHERE client_id=p_client_id AND status='draft') THEN RAISE EXCEPTION 'draft_exists' USING ERRCODE='22023'; END IF;
  SELECT COALESCE(max(version),0)+1 INTO v_target_version FROM public.client_nutrition_targets WHERE client_id=p_client_id;
  INSERT INTO public.client_nutrition_targets(client_id,version,nutrition_objective,goal_context,calories,protein_g,carbs_g,fat_g,reference_weight_kg,reference_weight_source,target_source,strategy_version,target_reason,status,created_by)
  VALUES(p_client_id,v_target_version,v_objective,p_payload->'target'->>'goal_context',(p_payload->'target'->>'calories')::numeric,(p_payload->'target'->>'protein_g')::numeric,(p_payload->'target'->>'carbs_g')::numeric,(p_payload->'target'->>'fat_g')::numeric,NULLIF(p_payload->'target'->>'reference_weight_kg','')::numeric,NULLIF(p_payload->'target'->>'reference_weight_source',''),COALESCE(p_payload->'target'->>'target_source','ENGINE_APPROVED'),COALESCE(p_payload->>'strategy_version','nutrition-strategy-v1'),COALESCE(p_payload->'target'->>'target_reason','TEMPLATE_ASSIGNMENT_DRAFT'),'archived',v_admin) RETURNING id INTO v_target_id;
  SELECT COALESCE(max(assignment_version),0)+1 INTO v_assignment_version FROM public.client_nutrition_assignments WHERE client_id=p_client_id;
  INSERT INTO public.nutrition_decision_traces(client_id,reason,strategy_version,target_id,actor_id,actor_role,summary,metadata)
  VALUES(p_client_id,'TEMPLATE_ASSIGNMENT',COALESCE(p_payload->>'strategy_version','nutrition-strategy-v1'),v_target_id,v_admin,'admin','Nutrition template generated as client snapshot',COALESCE(p_payload->'decision_trace'->'metadata','{}'::jsonb)||jsonb_build_object('template_id',v_template.id,'template_key',v_template.template_key,'template_version',v_template.version,'training_meal_window',v_window,'candidate_pool','slot-safe conservative','fallback_used',false)) RETURNING id INTO v_trace_id;
  INSERT INTO public.client_nutrition_assignments(client_id,status,name_ar,starts_on,assigned_by,schema_version,assignment_version,target_id,strategy_version,library_version,resolved_snapshot,validation_status,decision_trace_id,draft_meta,source_nutrition_template_id,source_nutrition_template_version,nutrition_template_snapshot)
  VALUES(p_client_id,'draft',COALESCE(NULLIF(p_payload->>'name_ar',''),v_template.name_ar)||' (مسودة)',COALESCE(p_starts_on,CURRENT_DATE),v_admin,'STRATEGY_V1_DYNAMIC',v_assignment_version,v_target_id,COALESCE(p_payload->>'strategy_version','nutrition-strategy-v1'),NULLIF(p_payload->>'library_version',''),COALESCE(p_payload->'resolved_snapshot','{}'::jsonb),COALESCE(p_payload->>'validation_status','REVIEW_REQUIRED'),v_trace_id,jsonb_build_object('assignment_edition',v_assignment_version,'template_assignment',true,'draft_created_at',now()),v_template.id,v_template.version,to_jsonb(v_template)) RETURNING id INTO v_id;
  PERFORM public._nutrition_insert_slots_from_payload(v_id,p_payload->'slots');
  UPDATE public.nutrition_decision_traces SET assignment_id=v_id WHERE id=v_trace_id;
  PERFORM public._write_audit_event(v_admin,p_client_id,'nutrition_template_client_assigned',jsonb_build_object('assignment_id',v_id,'template_id',v_template.id,'template_version',v_template.version,'status','draft'));
  IF p_publish THEN
    v_result:=public.admin_publish_client_nutrition_draft(v_id,p_starts_on);
    RETURN v_result;
  END IF;
  RETURN public._nutrition_tree(v_id);
END $$;

-- Publishing a template-created draft activates its staged target atomically.
CREATE OR REPLACE FUNCTION public.admin_publish_client_nutrition_draft(p_draft_assignment_id UUID,p_starts_on DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_admin UUID; v_draft public.client_nutrition_assignments%ROWTYPE; v_active UUID; v_scheduled UUID; v_status TEXT; v_current_target UUID;
BEGIN
  v_admin:=public._require_admin();
  SELECT * INTO v_draft FROM public.client_nutrition_assignments WHERE id=p_draft_assignment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='P0002'; END IF;
  IF v_draft.status<>'draft' THEN RAISE EXCEPTION 'invalid_assignment_status' USING ERRCODE='22023'; END IF;
  v_status:=CASE WHEN COALESCE(p_starts_on,v_draft.starts_on,CURRENT_DATE)>CURRENT_DATE THEN 'scheduled' ELSE 'active' END;
  SELECT id INTO v_active FROM public.client_nutrition_assignments WHERE client_id=v_draft.client_id AND status='active';
  SELECT id INTO v_scheduled FROM public.client_nutrition_assignments WHERE client_id=v_draft.client_id AND status='scheduled';
  IF v_status='active' AND v_active IS NOT NULL THEN UPDATE public.client_nutrition_assignments SET status='replaced',ended_at=now() WHERE id=v_active; END IF;
  IF v_status='scheduled' AND v_scheduled IS NOT NULL THEN UPDATE public.client_nutrition_assignments SET status='cancelled',ended_at=now() WHERE id=v_scheduled; END IF;
  IF v_draft.target_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.client_nutrition_targets WHERE id=v_draft.target_id AND status='archived') THEN
    SELECT id INTO v_current_target FROM public.client_nutrition_targets WHERE client_id=v_draft.client_id AND status='active' FOR UPDATE;
    IF v_current_target IS NOT NULL THEN UPDATE public.client_nutrition_targets SET status='superseded',superseded_at=now() WHERE id=v_current_target; END IF;
    UPDATE public.client_nutrition_targets SET status='active',previous_target_id=v_current_target WHERE id=v_draft.target_id;
  END IF;
  UPDATE public.client_nutrition_assignments SET status=v_status,starts_on=COALESCE(p_starts_on,starts_on,CURRENT_DATE),name_ar=regexp_replace(COALESCE(name_ar,'خطة تغذية'),'\s*\(مسودة\)\s*$',''),assigned_at=now(),assigned_by=v_admin,updated_at=now(),draft_meta=COALESCE(draft_meta,'{}'::jsonb)||jsonb_build_object('published_at',now()) WHERE id=p_draft_assignment_id;
  PERFORM public._write_audit_event(v_admin,v_draft.client_id,'client_nutrition_draft_published',jsonb_build_object('draft_id',p_draft_assignment_id,'status',v_status,'replaced_active_id',v_active,'template_id',v_draft.source_nutrition_template_id,'template_version',v_draft.source_nutrition_template_version));
  RETURN public._nutrition_tree(p_draft_assignment_id);
END $$;

REVOKE ALL ON FUNCTION public._nutrition_template_slot_structure() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public._nutrition_template_selection_rules() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public._validate_nutrition_template_goals(TEXT[]) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public._nutrition_template_validate_slots(JSONB) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.admin_list_nutrition_templates() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_get_nutrition_template(UUID) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_save_nutrition_template(JSONB) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_publish_nutrition_template(UUID) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_create_nutrition_template_version(UUID) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_duplicate_nutrition_template(UUID,TEXT,TEXT) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_archive_nutrition_template(UUID) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_set_default_nutrition_template(UUID) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_assign_nutrition_template(UUID,UUID,JSONB,DATE,BOOLEAN) FROM PUBLIC,anon;

GRANT EXECUTE ON FUNCTION public.admin_list_nutrition_templates() TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_nutrition_template(UUID) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_save_nutrition_template(JSONB) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_publish_nutrition_template(UUID) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_create_nutrition_template_version(UUID) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_duplicate_nutrition_template(UUID,TEXT,TEXT) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_archive_nutrition_template(UUID) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_default_nutrition_template(UUID) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.admin_assign_nutrition_template(UUID,UUID,JSONB,DATE,BOOLEAN) TO authenticated,service_role;

COMMIT;
