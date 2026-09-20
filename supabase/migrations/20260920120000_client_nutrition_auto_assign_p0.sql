-- P0: automatic, idempotent client nutrition assignment after Customer Journey readiness.
-- The client computes the deterministic Strategy V1 payload from the live meal catalog;
-- this RPC binds it to auth.uid() and revalidates all security/safety invariants in DB.

BEGIN;

CREATE OR REPLACE FUNCTION public._record_nutrition_auto_assign_failure(
  p_client_id UUID,
  p_failure_reason TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.nutrition_decision_traces(
    client_id, reason, strategy_version, actor_id, actor_role, summary, metadata
  ) VALUES (
    p_client_id,
    'ASSIGNMENT_FAILED',
    'nutrition-strategy-v1',
    p_client_id,
    'system',
    'Automatic nutrition assignment blocked: ' || p_failure_reason,
    jsonb_build_object(
      'trigger', 'customer_journey_ready',
      'failure_reason', p_failure_reason
    ) || COALESCE(p_metadata, '{}'::jsonb)
  );

  RETURN jsonb_build_object('created', false, 'reason', p_failure_reason)
    || COALESCE(p_metadata, '{}'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public._record_nutrition_auto_assign_failure(UUID, TEXT, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._record_nutrition_auto_assign_failure(UUID, TEXT, JSONB)
  TO service_role;

CREATE OR REPLACE FUNCTION public.client_auto_assign_my_nutrition(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_existing public.client_nutrition_assignments%ROWTYPE;
  v_journey public.client_customer_journeys%ROWTYPE;
  v_profile public.client_nutrition_profiles%ROWTYPE;
  v_template public.nutrition_templates%ROWTYPE;
  v_answers JSONB := '{}'::jsonb;
  v_raw_goal TEXT;
  v_goal TEXT;
  v_objective TEXT;
  v_bucket TEXT;
  v_target_id UUID;
  v_target_version INTEGER;
  v_assignment_id UUID;
  v_assignment_version INTEGER;
  v_trace_id UUID;
  v_item JSONB;
  v_meal public.meals%ROWTYPE;
  v_slot_key TEXT;
  v_error TEXT;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(COALESCE(p_payload, '{}'::jsonb)) <> 'object' THEN
    RAISE EXCEPTION 'invalid_assignment_payload' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('nutrition-auto:' || v_user::text));

  SELECT * INTO v_existing
  FROM public.client_nutrition_assignments
  WHERE client_id = v_user AND status IN ('active', 'scheduled', 'draft')
  ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'scheduled' THEN 1 ELSE 2 END, assigned_at DESC
  LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'created', false,
      'reason', 'already_assigned',
      'assignment_id', v_existing.id,
      'assignment_status', v_existing.status
    );
  END IF;

  SELECT * INTO v_journey
  FROM public.client_customer_journeys
  WHERE user_id = v_user;
  IF NOT FOUND OR v_journey.status <> 'ready' THEN
    RETURN public._record_nutrition_auto_assign_failure(
      v_user,
      'CUSTOMER_JOURNEY_NOT_READY',
      jsonb_build_object('journey_status', v_journey.status)
    );
  END IF;
  IF v_journey.training_meal_window IS NULL THEN
    RETURN public._record_nutrition_auto_assign_failure(v_user, 'TRAINING_TIME_REQUIRED');
  END IF;

  SELECT * INTO v_profile
  FROM public.client_nutrition_profiles
  WHERE client_id = v_user;
  IF NOT FOUND OR v_profile.allergy_status::text = 'UNKNOWN' THEN
    RETURN public._record_nutrition_auto_assign_failure(v_user, 'ALLERGY_STATUS_REQUIRED');
  END IF;

  SELECT lower(COALESCE(tp.goal, tp.answers->>'goalId', tp.answers->>'goal_id', '')),
         COALESCE(tp.answers, '{}'::jsonb)
  INTO v_raw_goal, v_answers
  FROM public.training_profiles tp
  WHERE tp.user_id = v_user;

  v_goal := CASE v_raw_goal
    WHEN 'fat' THEN 'FAT_LOSS' WHEN 'fat_loss' THEN 'FAT_LOSS'
    WHEN 'muscle' THEN 'MUSCLE_GAIN' WHEN 'gain' THEN 'MUSCLE_GAIN'
    WHEN 'muscle_gain' THEN 'MUSCLE_GAIN' WHEN 'muscle_growth' THEN 'MUSCLE_GAIN'
    WHEN 'healthy_weight_gain' THEN 'MUSCLE_GAIN'
    WHEN 'glutes' THEN 'GLUTE_GROWTH' WHEN 'glute_growth' THEN 'GLUTE_GROWTH'
    WHEN 'waist' THEN 'WAIST_DEFINITION' WHEN 'slim_toned_waist' THEN 'WAIST_DEFINITION'
    WHEN 'tone' THEN 'UPPER_BODY_DEFINITION' WHEN 'toned_arms_upper_body' THEN 'UPPER_BODY_DEFINITION'
    WHEN 'body' THEN 'FEMININE_BALANCED_BODY' WHEN 'feminine_balanced_body' THEN 'FEMININE_BALANCED_BODY'
    WHEN 'shape' THEN 'BODY_RECOMPOSITION' WHEN 'body_recomposition' THEN 'BODY_RECOMPOSITION'
    WHEN 'body_reshape' THEN 'BODY_RECOMPOSITION'
    WHEN 'fitness' THEN 'FITNESS_ENDURANCE' WHEN 'fitness_energy' THEN 'FITNESS_ENDURANCE'
    WHEN 'athletic' THEN 'GENERAL_HEALTH_FITNESS' WHEN 'athletic_physique' THEN 'GENERAL_HEALTH_FITNESS'
    WHEN 'posture_toned_back' THEN 'POSTURE_BACK_HEALTH'
    ELSE NULL
  END;
  IF v_goal IS NULL OR p_payload->'target'->>'goal_context' IS DISTINCT FROM v_goal THEN
    RETURN public._record_nutrition_auto_assign_failure(
      v_user,
      'NUTRITION_GOAL_MISMATCH',
      jsonb_build_object('profile_goal', v_goal, 'payload_goal', p_payload->'target'->>'goal_context')
    );
  END IF;

  v_objective := p_payload->'target'->>'nutrition_objective';
  v_bucket := CASE
    WHEN v_objective = 'FAT_LOSS' THEN 'FAT_LOSS'
    WHEN v_objective = 'MUSCLE_GAIN' THEN 'MUSCLE_GAIN'
    WHEN v_objective IN ('MAINTENANCE', 'BODY_RECOMPOSITION', 'PERFORMANCE_MAINTENANCE') THEN 'MAINTENANCE'
    ELSE NULL
  END;
  IF v_bucket IS NULL THEN
    RETURN public._record_nutrition_auto_assign_failure(
      v_user,
      'NUTRITION_STRATEGY_MISMATCH',
      jsonb_build_object('nutrition_objective', v_objective)
    );
  END IF;

  SELECT * INTO v_template
  FROM public.nutrition_templates
  WHERE status = 'published' AND is_active AND is_default
    AND strategy_bucket = v_bucket AND v_goal = ANY(mapped_goals)
  ORDER BY version DESC, published_at DESC NULLS LAST
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN public._record_nutrition_auto_assign_failure(
      v_user,
      'DEFAULT_NUTRITION_TEMPLATE_MISSING',
      jsonb_build_object('goal', v_goal, 'strategy_bucket', v_bucket)
    );
  END IF;

  IF COALESCE((p_payload->'target'->>'calories')::numeric, 0) NOT BETWEEN 1000 AND 6000
     OR COALESCE((p_payload->'target'->>'protein_g')::numeric, 0) NOT BETWEEN 30 AND 400
     OR COALESCE((p_payload->'target'->>'carbs_g')::numeric, 0) NOT BETWEEN 30 AND 1000
     OR COALESCE((p_payload->'target'->>'fat_g')::numeric, 0) NOT BETWEEN 20 AND 300 THEN
    RETURN public._record_nutrition_auto_assign_failure(
      v_user,
      'NUTRITION_TARGET_OUT_OF_RANGE',
      jsonb_build_object('calculated_target', p_payload->'target')
    );
  END IF;

  -- Add slot/id/type detail before the shared validator so failures are actionable.
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'slots', '[]'::jsonb)) LOOP
    v_slot_key := v_item->>'slot_key';
    SELECT * INTO v_meal FROM public.meals
    WHERE external_id = v_item->>'source_external_id' AND status = 'published' AND is_active
    LIMIT 1;
    IF NOT FOUND THEN
      RETURN public._record_nutrition_auto_assign_failure(
        v_user,
        'meal_not_assignable',
        jsonb_build_object('failed_slot', v_slot_key, 'failed_meal_id', v_item->>'source_external_id')
      );
    END IF;
    IF (v_slot_key IN ('breakfast','lunch','dinner','snack') AND v_meal.meal_type::text <> v_slot_key) THEN
      RETURN public._record_nutrition_auto_assign_failure(
        v_user,
        'unsafe_slot_meal',
        jsonb_build_object(
          'failed_slot', v_slot_key,
          'failed_meal_id', v_meal.external_id,
          'failed_meal_type', v_meal.meal_type::text
        )
      );
    END IF;
    IF v_profile.allergy_status::text = 'KNOWN_ALLERGIES'
       AND public._allergen_overlap(v_profile.known_allergens, COALESCE(v_meal.allergens, '{}'::text[])) THEN
      RETURN public._record_nutrition_auto_assign_failure(
        v_user,
        'allergen_conflict',
        jsonb_build_object('failed_slot', v_slot_key, 'failed_meal_id', v_meal.external_id)
      );
    END IF;
    IF EXISTS (
      SELECT 1 FROM unnest(COALESCE(v_profile.disliked_foods, '{}'::text[])) disliked(value)
      WHERE btrim(disliked.value) <> ''
        AND (v_meal.name_ar ILIKE '%' || disliked.value || '%' OR v_meal.name_en ILIKE '%' || disliked.value || '%')
    ) THEN
      RETURN public._record_nutrition_auto_assign_failure(
        v_user,
        'disliked_food_conflict',
        jsonb_build_object('failed_slot', v_slot_key, 'failed_meal_id', v_meal.external_id)
      );
    END IF;
  END LOOP;

  BEGIN
    PERFORM public._nutrition_template_validate_slots(p_payload->'slots');

    SELECT COALESCE(max(version), 0) + 1 INTO v_target_version
    FROM public.client_nutrition_targets WHERE client_id = v_user;
    INSERT INTO public.client_nutrition_targets(
      client_id, version, nutrition_objective, goal_context, calories, protein_g, carbs_g, fat_g,
      reference_weight_kg, reference_weight_source, target_source, strategy_version,
      target_reason, status, created_by
    ) VALUES (
      v_user, v_target_version, v_objective, p_payload->'target'->>'goal_context',
      (p_payload->'target'->>'calories')::numeric, (p_payload->'target'->>'protein_g')::numeric,
      (p_payload->'target'->>'carbs_g')::numeric, (p_payload->'target'->>'fat_g')::numeric,
      NULLIF(p_payload->'target'->>'reference_weight_kg','')::numeric,
      COALESCE(NULLIF(p_payload->'target'->>'reference_weight_source',''), 'profile_measurement'),
      'ENGINE_APPROVED', COALESCE(p_payload->>'strategy_version','nutrition-strategy-v1'),
      'Automatic assignment after preparation completion', 'active', v_user
    ) RETURNING id INTO v_target_id;

    SELECT COALESCE(max(assignment_version), 0) + 1 INTO v_assignment_version
    FROM public.client_nutrition_assignments WHERE client_id = v_user;
    INSERT INTO public.nutrition_decision_traces(
      client_id, reason, strategy_version, target_id, actor_id, actor_role, summary, metadata
    ) VALUES (
      v_user, 'INITIAL_ASSIGNMENT', COALESCE(p_payload->>'strategy_version','nutrition-strategy-v1'),
      v_target_id, v_user, 'system', 'Automatic nutrition assignment after preparation completion',
      COALESCE(p_payload->'decision_trace'->'metadata','{}'::jsonb) || jsonb_build_object(
        'trigger','customer_journey_ready', 'goal',v_goal, 'strategy_bucket',v_bucket,
        'template_id',v_template.id, 'template_key',v_template.template_key,
        'template_version',v_template.version, 'training_meal_window',v_journey.training_meal_window,
        'calculated_target',p_payload->'target', 'candidate_pool','live_database_slot_safe',
        'fallback_used',false
      )
    ) RETURNING id INTO v_trace_id;

    INSERT INTO public.client_nutrition_assignments(
      client_id,status,name_ar,starts_on,assigned_by,schema_version,assignment_version,target_id,
      strategy_version,library_version,resolved_snapshot,validation_status,decision_trace_id,draft_meta,
      source_nutrition_template_id,source_nutrition_template_version,nutrition_template_snapshot
    ) VALUES (
      v_user,'active',COALESCE(NULLIF(p_payload->>'name_ar',''),v_template.name_ar),CURRENT_DATE,v_user,
      'STRATEGY_V1_DYNAMIC',v_assignment_version,v_target_id,
      COALESCE(p_payload->>'strategy_version','nutrition-strategy-v1'),NULLIF(p_payload->>'library_version',''),
      COALESCE(p_payload->'resolved_snapshot','{}'::jsonb),COALESCE(p_payload->>'validation_status','REVIEW_REQUIRED'),
      v_trace_id,jsonb_build_object('auto_assigned',true,'trigger','customer_journey_ready','published_at',now()),
      v_template.id,v_template.version,to_jsonb(v_template)
    ) RETURNING id INTO v_assignment_id;

    PERFORM public._nutrition_insert_slots_from_payload(v_assignment_id,p_payload->'slots');
    UPDATE public.nutrition_decision_traces SET assignment_id=v_assignment_id WHERE id=v_trace_id;
    PERFORM public._write_audit_event(v_user,v_user,'client_nutrition_auto_assigned',jsonb_build_object(
      'assignment_id',v_assignment_id,'template_id',v_template.id,'template_version',v_template.version,
      'strategy_bucket',v_bucket,'trigger','customer_journey_ready'
    ));
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
    INSERT INTO public.nutrition_decision_traces(
      client_id,reason,strategy_version,actor_id,actor_role,summary,metadata
    ) VALUES (
      v_user,'ASSIGNMENT_FAILED',COALESCE(p_payload->>'strategy_version','nutrition-strategy-v1'),
      v_user,'system','Automatic nutrition assignment failed',jsonb_build_object(
        'trigger','customer_journey_ready','error',v_error,'goal',v_goal,'strategy_bucket',v_bucket,
        'template_id',v_template.id,'training_meal_window',v_journey.training_meal_window
      )
    );
    RETURN jsonb_build_object('created',false,'reason',v_error);
  END;

  RETURN jsonb_build_object(
    'created',true,'reason','assigned','assignment_id',v_assignment_id,'assignment_status','active',
    'template_id',v_template.id,'template_version',v_template.version,'strategy_bucket',v_bucket,
    'meal_count',(SELECT count(*) FROM public.client_nutrition_slots WHERE assignment_id=v_assignment_id)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.client_auto_assign_my_nutrition(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.client_auto_assign_my_nutrition(JSONB) TO authenticated, service_role;

COMMENT ON FUNCTION public.client_auto_assign_my_nutrition(JSONB) IS
  'Idempotent self-only nutrition auto assignment after Customer Journey readiness; validates live DB meals and safety inputs.';

COMMENT ON FUNCTION public._record_nutrition_auto_assign_failure(UUID, TEXT, JSONB) IS
  'Internal-only failure trace for client nutrition auto assignment; never granted to clients.';

COMMIT;
