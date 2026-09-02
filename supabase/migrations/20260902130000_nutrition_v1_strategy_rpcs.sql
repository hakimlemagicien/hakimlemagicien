-- MAAKFIT Nutrition Strategy V1 — RPC orchestration (additive, LOCAL_ONLY).
-- See docs/NUTRITION_V1_DATABASE_CHANGE_REQUEST.md MIGRATION_4.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public._nutrition_strategy_guard_allergy(p_client_id UUID)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
BEGIN
  SELECT allergy_status INTO v_status
  FROM public.client_nutrition_profiles
  WHERE client_id = p_client_id;

  IF v_status IS NULL OR v_status = 'UNKNOWN' THEN
    RAISE EXCEPTION 'allergy_status_required' USING ERRCODE = '22023';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public._nutrition_planned_totals(p_assignment_id UUID)
RETURNS TABLE (
  calories NUMERIC,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(sum(s.calories * COALESCE(s.planned_servings, s.servings)), 0),
    COALESCE(sum(s.protein_g * COALESCE(s.planned_servings, s.servings)), 0),
    COALESCE(sum(s.carbs_g * COALESCE(s.planned_servings, s.servings)), 0),
    COALESCE(sum(s.fat_g * COALESCE(s.planned_servings, s.servings)), 0)
  FROM public.client_nutrition_slots s
  WHERE s.assignment_id = p_assignment_id
    AND COALESCE(s.counts_toward_day_totals, true) = true
    AND COALESCE(s.slot_state, 'ACTIVE') NOT IN ('NOT_REQUIRED', 'SATISFIED_BY_OTHER_MEAL');
$$;

CREATE OR REPLACE FUNCTION public._nutrition_insert_slots_from_payload(
  p_assignment_id UUID,
  p_slots JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_meal public.meals%ROWTYPE;
  v_key TEXT;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_slots, '[]'::jsonb))
  LOOP
    v_key := v_item->>'slot_key';
    SELECT * INTO v_meal
    FROM public.meals
    WHERE external_id = v_item->>'source_external_id'
      AND status = 'published'
      AND is_active IS TRUE
    LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'meal_not_assignable' USING ERRCODE = '22023';
    END IF;
    IF COALESCE((v_item->>'servings')::NUMERIC, 1) <= 0 THEN
      RAISE EXCEPTION 'invalid_servings' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.client_nutrition_slots (
      assignment_id, slot_key, slot_label, time_label, hour, minute, sort_order, display_order,
      source_meal_id, source_external_id, name_ar, name_en, meal_type,
      calories, protein_g, carbs_g, fat_g, serving_size, serving_unit,
      servings, planned_servings, allergens,
      slot_state, slot_role, satisfied_by_slot_key, serving_policy, counts_toward_day_totals
    ) VALUES (
      p_assignment_id,
      v_key,
      COALESCE(v_item->>'slot_label', v_key),
      COALESCE(v_item->>'time_label', ''),
      COALESCE((v_item->>'hour')::INT, 8),
      COALESCE((v_item->>'minute')::INT, 0),
      COALESCE((v_item->>'sort_order')::INT, 0),
      COALESCE((v_item->>'display_order')::INT, (v_item->>'sort_order')::INT, 0),
      v_meal.id, v_meal.external_id, v_meal.name_ar, v_meal.name_en, v_meal.meal_type::TEXT,
      v_meal.calories, v_meal.protein_g, v_meal.carbs_g, v_meal.fat_g,
      v_meal.serving_size, v_meal.serving_unit,
      COALESCE((v_item->>'servings')::NUMERIC, 1),
      COALESCE((v_item->>'planned_servings')::NUMERIC, (v_item->>'servings')::NUMERIC, 1),
      COALESCE(v_meal.allergens, '{}'),
      COALESCE(v_item->>'slot_state', 'ACTIVE'),
      NULLIF(v_item->>'slot_role', ''),
      NULLIF(v_item->>'satisfied_by_slot_key', ''),
      NULLIF(v_item->>'serving_policy', ''),
      COALESCE((v_item->>'counts_toward_day_totals')::BOOLEAN, true)
    );
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- nutrition_create_target
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.nutrition_create_target(
  p_client_id UUID,
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_prev public.client_nutrition_targets%ROWTYPE;
  v_version INT;
  v_id UUID;
BEGIN
  v_admin := public._require_admin();
  IF p_client_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_client_id) THEN
    RAISE EXCEPTION 'invalid_client' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_prev
  FROM public.client_nutrition_targets
  WHERE client_id = p_client_id AND status = 'active'
  FOR UPDATE;

  v_version := COALESCE(v_prev.version, 0) + 1;

  IF v_prev.id IS NOT NULL THEN
    UPDATE public.client_nutrition_targets
    SET status = 'superseded', superseded_at = now()
    WHERE id = v_prev.id;
  END IF;

  INSERT INTO public.client_nutrition_targets (
    client_id, version, previous_target_id,
    nutrition_objective, goal_context,
    calories, protein_g, carbs_g, fat_g,
    reference_weight_kg, reference_weight_source,
    target_source, strategy_version, target_reason,
    created_by
  ) VALUES (
    p_client_id, v_version, v_prev.id,
    p_payload->>'nutrition_objective',
    p_payload->>'goal_context',
    (p_payload->>'calories')::NUMERIC,
    (p_payload->>'protein_g')::NUMERIC,
    (p_payload->>'carbs_g')::NUMERIC,
    (p_payload->>'fat_g')::NUMERIC,
    NULLIF(p_payload->>'reference_weight_kg', '')::NUMERIC,
    NULLIF(p_payload->>'reference_weight_source', ''),
    COALESCE(p_payload->>'target_source', 'ENGINE_APPROVED'),
    COALESCE(p_payload->>'strategy_version', 'nutrition-strategy-v1'),
    COALESCE(p_payload->>'target_reason', 'ENGINE_INITIAL_TARGET'),
    v_admin
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('target_id', v_id, 'version', v_version);
END;
$$;

-- ---------------------------------------------------------------------------
-- admin_generate_client_nutrition — Strategy V1 persistence (TS validates first)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_generate_client_nutrition(
  p_client_id UUID,
  p_payload JSONB,
  p_starts_on DATE DEFAULT CURRENT_DATE,
  p_replace BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_status TEXT;
  v_id UUID;
  v_active UUID;
  v_scheduled UUID;
  v_target_id UUID;
  v_trace_id UUID;
  v_version INT;
  v_prev_assignment_version INT;
  v_validation TEXT;
BEGIN
  v_admin := public._require_admin();
  IF p_client_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_client_id) THEN
    RAISE EXCEPTION 'invalid_client' USING ERRCODE = '22023';
  END IF;

  PERFORM public._nutrition_strategy_guard_allergy(p_client_id);

  v_validation := COALESCE(p_payload->>'validation_status', 'INVALID');
  IF v_validation = 'INVALID' THEN
    RAISE EXCEPTION 'nutrition_plan_invalid' USING ERRCODE = '22023';
  END IF;

  IF jsonb_array_length(COALESCE(p_payload->'slots', '[]'::jsonb)) < 1 THEN
    RAISE EXCEPTION 'slots_required' USING ERRCODE = '22023';
  END IF;

  v_status := CASE WHEN p_starts_on IS NOT NULL AND p_starts_on > CURRENT_DATE THEN 'scheduled' ELSE 'active' END;

  SELECT id INTO v_active FROM public.client_nutrition_assignments
  WHERE client_id = p_client_id AND status = 'active';
  SELECT id INTO v_scheduled FROM public.client_nutrition_assignments
  WHERE client_id = p_client_id AND status = 'scheduled';

  IF v_status = 'active' AND v_active IS NOT NULL THEN
    IF p_replace IS NOT TRUE THEN
      RAISE EXCEPTION 'active_nutrition_exists' USING ERRCODE = '22023';
    END IF;
    UPDATE public.client_nutrition_assignments
    SET status = 'replaced', ended_at = now()
    WHERE id = v_active;
  END IF;
  IF v_status = 'scheduled' AND v_scheduled IS NOT NULL THEN
    IF p_replace IS NOT TRUE THEN
      RAISE EXCEPTION 'scheduled_nutrition_exists' USING ERRCODE = '22023';
    END IF;
    UPDATE public.client_nutrition_assignments
    SET status = 'cancelled', ended_at = now()
    WHERE id = v_scheduled;
  END IF;

  SELECT COALESCE(max(assignment_version), 0) INTO v_prev_assignment_version
  FROM public.client_nutrition_assignments WHERE client_id = p_client_id;

  v_target_id := (public.nutrition_create_target(
    p_client_id,
    COALESCE(p_payload->'target', '{}'::jsonb) || jsonb_build_object(
      'strategy_version', COALESCE(p_payload->>'strategy_version', 'nutrition-strategy-v1')
    )
  )->>'target_id')::UUID;

  INSERT INTO public.nutrition_decision_traces (
    client_id, reason, strategy_version, target_id, actor_id, actor_role, summary, metadata
  ) VALUES (
    p_client_id,
    COALESCE(p_payload->'decision_trace'->>'reason', 'INITIAL_ASSIGNMENT'),
    COALESCE(p_payload->>'strategy_version', 'nutrition-strategy-v1'),
    v_target_id, v_admin, 'admin',
    COALESCE(p_payload->'decision_trace'->>'summary', 'Strategy V1 assignment generated'),
    COALESCE(p_payload->'decision_trace'->'metadata', '{}'::jsonb)
  )
  RETURNING id INTO v_trace_id;

  INSERT INTO public.client_nutrition_assignments (
    client_id, status, name_ar, starts_on, assigned_by,
    schema_version, assignment_version, target_id,
    strategy_version, library_version,
    replaces_assignment_id, resolved_snapshot, validation_status, decision_trace_id
  ) VALUES (
    p_client_id, v_status,
    COALESCE(NULLIF(p_payload->>'name_ar', ''), 'خطة تغذية'),
    COALESCE(p_starts_on, CURRENT_DATE),
    v_admin,
    'STRATEGY_V1_DYNAMIC',
    v_prev_assignment_version + 1,
    v_target_id,
    COALESCE(p_payload->>'strategy_version', 'nutrition-strategy-v1'),
    NULLIF(p_payload->>'library_version', ''),
    CASE WHEN p_replace AND v_active IS NOT NULL THEN v_active ELSE NULL END,
    COALESCE(p_payload->'resolved_snapshot', '{}'::jsonb),
    v_validation,
    v_trace_id
  )
  RETURNING id INTO v_id;

  PERFORM public._nutrition_insert_slots_from_payload(v_id, p_payload->'slots');

  UPDATE public.nutrition_decision_traces
  SET assignment_id = v_id
  WHERE id = v_trace_id;

  PERFORM public._write_audit_event(
    v_admin, p_client_id, 'client_nutrition_assigned',
    jsonb_build_object(
      'assignment_id', v_id,
      'schema_version', 'STRATEGY_V1_DYNAMIC',
      'replaced_assignment_id', v_active,
      'target_id', v_target_id
    )
  );

  RETURN public._nutrition_tree(v_id);
END;
$$;

-- ---------------------------------------------------------------------------
-- nutrition_apply_swap — atomic swap persistence (TS validates whole day first)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.nutrition_apply_swap(
  p_slot_id UUID,
  p_payload JSONB,
  p_session_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_slot public.client_nutrition_slots%ROWTYPE;
  v_assignment public.client_nutrition_assignments%ROWTYPE;
  v_meal public.meals%ROWTYPE;
  v_item JSONB;
  v_trace_id UUID;
  v_swap_allowed BOOLEAN;
  v_entitlements JSONB;
  v_event_slot_id UUID;
  v_swapped_slot_key TEXT;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF COALESCE(p_payload->>'validation_status', 'INVALID') = 'INVALID' THEN
    RAISE EXCEPTION 'swap_not_allowed' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_slot FROM public.client_nutrition_slots WHERE id = p_slot_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_slot' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_assignment FROM public.client_nutrition_assignments WHERE id = v_slot.assignment_id;
  IF v_assignment.client_id IS DISTINCT FROM v_user OR v_assignment.status <> 'active' THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  v_swapped_slot_key := v_slot.slot_key;
  v_event_slot_id := v_slot.id;

  SELECT public.get_my_entitlements() INTO v_entitlements;
  v_swap_allowed := COALESCE((v_entitlements->'nutrition'->>'full_day')::BOOLEAN, false);
  IF NOT v_swap_allowed THEN
    RAISE EXCEPTION 'nutrition_not_entitled' USING ERRCODE = '22023';
  END IF;

  IF COALESCE(v_assignment.schema_version, 'LEGACY_4_SLOT') = 'STRATEGY_V1_DYNAMIC' THEN
    SELECT * INTO v_meal FROM public.meals
    WHERE external_id = COALESCE(p_payload->>'to_external_id', p_payload->>'source_external_id')
      AND status = 'published' AND is_active IS TRUE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'meal_not_assignable' USING ERRCODE = '22023';
    END IF;

    DELETE FROM public.client_nutrition_slots WHERE assignment_id = v_assignment.id;
    PERFORM public._nutrition_insert_slots_from_payload(v_assignment.id, p_payload->'slots');

    SELECT s.id INTO v_event_slot_id
    FROM public.client_nutrition_slots s
    WHERE s.assignment_id = v_assignment.id
      AND s.slot_key = v_swapped_slot_key
    LIMIT 1;
    IF v_event_slot_id IS NULL THEN
      RAISE EXCEPTION 'invalid_slot' USING ERRCODE = '22023';
    END IF;

    UPDATE public.client_nutrition_assignments
    SET resolved_snapshot = COALESCE(p_payload->'resolved_snapshot', resolved_snapshot),
        validation_status = COALESCE(p_payload->>'validation_status', validation_status),
        updated_at = now()
    WHERE id = v_assignment.id;
  ELSE
    SELECT * INTO v_meal FROM public.meals
    WHERE external_id = p_payload->>'to_external_id'
      AND status = 'published' AND is_active IS TRUE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'meal_not_assignable' USING ERRCODE = '22023';
    END IF;
    UPDATE public.client_nutrition_slots SET
      source_meal_id = v_meal.id,
      source_external_id = v_meal.external_id,
      name_ar = v_meal.name_ar,
      name_en = v_meal.name_en,
      meal_type = v_meal.meal_type::TEXT,
      calories = v_meal.calories,
      protein_g = v_meal.protein_g,
      carbs_g = v_meal.carbs_g,
      fat_g = v_meal.fat_g,
      serving_size = v_meal.serving_size,
      serving_unit = v_meal.serving_unit,
      allergens = COALESCE(v_meal.allergens, '{}')
    WHERE id = p_slot_id;
  END IF;

  PERFORM public.record_nutrition_meal_swap(v_event_slot_id, v_meal.id, p_session_date);

  INSERT INTO public.nutrition_decision_traces (
    client_id, reason, strategy_version, assignment_id, actor_id, actor_role, summary, metadata
  ) VALUES (
    v_user, 'SWAP_REQUEST',
    COALESCE(v_assignment.strategy_version, 'nutrition-strategy-v1'),
    v_assignment.id, v_user, 'client',
    COALESCE(p_payload->'decision_trace'->>'summary', 'Client meal swap'),
    COALESCE(p_payload->'decision_trace'->'metadata', '{}'::jsonb)
  )
  RETURNING id INTO v_trace_id;

  INSERT INTO public.client_nutrition_consumption_events (
    user_id, assignment_id, slot_id, slot_key, session_date,
    event_type, status, planned_servings, consumed_servings,
    source_external_id, macros_consumed
  ) VALUES (
    v_user, v_assignment.id, v_event_slot_id, v_swapped_slot_key, p_session_date,
    'swapped', 'SWAPPED',
    COALESCE((p_payload->>'servings')::NUMERIC, v_slot.servings),
    0,
    v_meal.external_id,
    COALESCE(p_payload->'macros_consumed', '{}'::jsonb)
  );

  RETURN jsonb_build_object(
    'ok', true,
    'assignment_id', v_assignment.id,
    'decision_trace_id', v_trace_id,
    'runtime', public.client_get_my_nutrition_runtime()
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Extend _nutrition_tree for Strategy V1 fields
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public._nutrition_tree(p_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row JSONB;
  v_planned RECORD;
  v_target JSONB;
BEGIN
  SELECT to_jsonb(a) || jsonb_build_object(
    'snapshot_complete', EXISTS (
      SELECT 1 FROM public.client_nutrition_slots s WHERE s.assignment_id = a.id
    ),
    'allergen_conflict', EXISTS (
      SELECT 1 FROM public.client_nutrition_slots s
      WHERE s.assignment_id = a.id
        AND public._allergen_overlap(a.watch_allergens, s.allergens)
    ),
    'library_allergen_review', EXISTS (
      SELECT 1
      FROM public.client_nutrition_slots s
      JOIN public.meals m ON m.id = s.source_meal_id
      WHERE s.assignment_id = a.id
        AND public._allergen_overlap(a.watch_allergens, m.allergens)
        AND NOT public._allergen_overlap(a.watch_allergens, s.allergens)
    ),
    'planned_calories', pt.calories,
    'planned_protein_g', pt.protein_g,
    'planned_carbs_g', pt.carbs_g,
    'planned_fat_g', pt.fat_g,
    'target', (
      SELECT to_jsonb(t) FROM public.client_nutrition_targets t WHERE t.id = a.target_id
    ),
    'slots', COALESCE((
      SELECT jsonb_agg(to_jsonb(s) ORDER BY COALESCE(s.display_order, s.sort_order))
      FROM public.client_nutrition_slots s
      WHERE s.assignment_id = a.id
    ), '[]'::jsonb)
  )
  INTO v_row
  FROM public.client_nutrition_assignments a
  LEFT JOIN LATERAL public._nutrition_planned_totals(a.id) pt ON true
  WHERE a.id = p_id;
  RETURN v_row;
END;
$$;

-- ---------------------------------------------------------------------------
-- Block in-place edit on STRATEGY_V1 assignments
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_save_client_nutrition_slots(
  p_assignment_id UUID,
  p_payload JSONB,
  p_expected_updated_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_row public.client_nutrition_assignments%ROWTYPE;
BEGIN
  v_admin := public._require_admin();
  SELECT * INTO v_row FROM public.client_nutrition_assignments WHERE id = p_assignment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
  IF COALESCE(v_row.schema_version, 'LEGACY_4_SLOT') = 'STRATEGY_V1_DYNAMIC' THEN
    RAISE EXCEPTION 'assignment_not_editable' USING ERRCODE = '22023';
  END IF;

  -- delegate to legacy body via dynamic SQL is unsafe; inline legacy logic below
  IF v_row.status NOT IN ('active', 'scheduled') THEN
    RAISE EXCEPTION 'assignment_not_editable' USING ERRCODE = '22023';
  END IF;
  IF p_expected_updated_at IS NOT NULL AND v_row.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RAISE EXCEPTION 'stale_update' USING ERRCODE = '22023';
  END IF;

  IF p_payload ? 'watch_allergens' THEN
    UPDATE public.client_nutrition_assignments
    SET watch_allergens = COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'watch_allergens', '[]'::jsonb))), '{}'),
        name_ar = COALESCE(NULLIF(p_payload->>'name_ar', ''), name_ar),
        notes_ar = COALESCE(NULLIF(p_payload->>'notes_ar', ''), notes_ar)
    WHERE id = p_assignment_id;
  END IF;

  PERFORM public._admin_save_client_nutrition_slots_legacy(p_assignment_id, p_payload, v_admin, v_row.client_id);
  UPDATE public.client_nutrition_assignments SET updated_at = now() WHERE id = p_assignment_id;
  RETURN public._nutrition_tree(p_assignment_id);
END;
$$;

CREATE OR REPLACE FUNCTION public._admin_save_client_nutrition_slots_legacy(
  p_assignment_id UUID,
  p_payload JSONB,
  p_admin UUID,
  p_client_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_id UUID;
  v_meal public.meals%ROWTYPE;
  v_old UUID;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'slots', '[]'::jsonb))
  LOOP
    v_id := NULLIF(v_item->>'id', '')::UUID;
    IF v_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.client_nutrition_slots s WHERE s.id = v_id AND s.assignment_id = p_assignment_id
    ) THEN
      RAISE EXCEPTION 'invalid_slot' USING ERRCODE = '22023';
    END IF;
    IF COALESCE((v_item->>'servings')::NUMERIC, 0) <= 0 THEN
      RAISE EXCEPTION 'invalid_servings' USING ERRCODE = '22023';
    END IF;

    SELECT source_meal_id INTO v_old FROM public.client_nutrition_slots WHERE id = v_id;
    IF NULLIF(v_item->>'source_meal_id', '') IS NOT NULL AND (v_item->>'source_meal_id')::UUID IS DISTINCT FROM v_old THEN
      SELECT * INTO v_meal FROM public.meals WHERE id = (v_item->>'source_meal_id')::UUID;
      IF NOT FOUND OR v_meal.status <> 'published' OR v_meal.is_active IS NOT TRUE THEN
        RAISE EXCEPTION 'meal_not_assignable' USING ERRCODE = '22023';
      END IF;
      UPDATE public.client_nutrition_slots SET
        source_meal_id = v_meal.id,
        source_external_id = v_meal.external_id,
        name_ar = v_meal.name_ar,
        name_en = v_meal.name_en,
        meal_type = v_meal.meal_type::TEXT,
        calories = v_meal.calories,
        protein_g = v_meal.protein_g,
        carbs_g = v_meal.carbs_g,
        fat_g = v_meal.fat_g,
        serving_size = v_meal.serving_size,
        serving_unit = v_meal.serving_unit,
        allergens = COALESCE(v_meal.allergens, '{}')
      WHERE id = v_id;
      PERFORM public._write_audit_event(
        p_admin, p_client_id, 'client_meal_replaced',
        jsonb_build_object('assignment_id', p_assignment_id, 'slot_id', v_id, 'old_meal_id', v_old, 'new_meal_id', v_meal.id)
      );
    END IF;

    UPDATE public.client_nutrition_slots SET
      servings = (v_item->>'servings')::NUMERIC,
      notes_ar = NULLIF(v_item->>'notes_ar', '')
    WHERE id = v_id;
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Extended client runtime
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.client_get_my_nutrition_runtime()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_row public.client_nutrition_assignments%ROWTYPE;
  v_reason TEXT;
  v_target JSONB;
  v_planned RECORD;
  v_consumed RECORD;
  v_schema TEXT;
  v_snapshot JSONB;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_row
  FROM public.client_nutrition_assignments
  WHERE client_id = v_user AND status IN ('active', 'scheduled')
  ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, assigned_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('reason', 'no_program', 'assignment', NULL, 'slots', '[]'::jsonb, 'today_logs', '[]'::jsonb);
  END IF;

  v_schema := COALESCE(v_row.schema_version, 'LEGACY_4_SLOT');

  IF NOT EXISTS (SELECT 1 FROM public.client_nutrition_slots s WHERE s.assignment_id = v_row.id) THEN
    RETURN jsonb_build_object(
      'reason', 'legacy_incomplete',
      'schema', v_schema,
      'assignment', jsonb_build_object(
        'id', v_row.id, 'status', v_row.status, 'name_ar', v_row.name_ar,
        'starts_on', v_row.starts_on, 'watch_allergens', v_row.watch_allergens,
        'schema_version', v_schema, 'strategy_version', v_row.strategy_version,
        'target_id', v_row.target_id, 'resolved_snapshot', v_row.resolved_snapshot
      ),
      'target', NULL,
      'planned', NULL,
      'consumed', NULL,
      'slots', '[]'::jsonb,
      'today_logs', '[]'::jsonb
    );
  END IF;

  IF v_row.status = 'scheduled' AND v_row.starts_on IS NOT NULL AND v_row.starts_on > CURRENT_DATE THEN
    v_reason := 'scheduled';
  ELSE
    v_reason := 'ok';
  END IF;

  SELECT to_jsonb(t) INTO v_target
  FROM public.client_nutrition_targets t
  WHERE t.id = v_row.target_id;

  SELECT * INTO v_planned FROM public._nutrition_planned_totals(v_row.id);

  SELECT
    COALESCE(sum(COALESCE((l.macros_consumed->>'calories')::NUMERIC,
      CASE WHEN l.status = 'completed' THEN s.calories * COALESCE(l.consumed_servings, l.planned_servings, s.servings)
           WHEN l.status = 'partial' THEN s.calories * l.consumed_servings
           ELSE 0 END)), 0) AS calories,
    COALESCE(sum(COALESCE((l.macros_consumed->>'protein_g')::NUMERIC,
      CASE WHEN l.status = 'completed' THEN s.protein_g * COALESCE(l.consumed_servings, l.planned_servings, s.servings)
           WHEN l.status = 'partial' THEN s.protein_g * l.consumed_servings
           ELSE 0 END)), 0) AS protein_g,
    COALESCE(sum(COALESCE((l.macros_consumed->>'carbs_g')::NUMERIC,
      CASE WHEN l.status = 'completed' THEN s.carbs_g * COALESCE(l.consumed_servings, l.planned_servings, s.servings)
           WHEN l.status = 'partial' THEN s.carbs_g * l.consumed_servings
           ELSE 0 END)), 0) AS carbs_g,
    COALESCE(sum(COALESCE((l.macros_consumed->>'fat_g')::NUMERIC,
      CASE WHEN l.status = 'completed' THEN s.fat_g * COALESCE(l.consumed_servings, l.planned_servings, s.servings)
           WHEN l.status = 'partial' THEN s.fat_g * l.consumed_servings
           ELSE 0 END)), 0) AS fat_g
  INTO v_consumed
  FROM public.client_nutrition_meal_logs l
  LEFT JOIN public.client_nutrition_slots s ON s.id = l.slot_id
  WHERE l.user_id = v_user AND l.session_date = CURRENT_DATE;

  v_snapshot := COALESCE(v_row.resolved_snapshot, '{}'::jsonb);

  RETURN jsonb_build_object(
    'reason', v_reason,
    'schema', v_schema,
    'assignment', jsonb_build_object(
      'id', v_row.id, 'status', v_row.status, 'name_ar', v_row.name_ar,
      'starts_on', v_row.starts_on, 'watch_allergens', v_row.watch_allergens,
      'schema_version', v_schema, 'strategy_version', v_row.strategy_version,
      'library_version', v_row.library_version, 'target_id', v_row.target_id,
      'validation_status', v_row.validation_status, 'resolved_snapshot', v_row.resolved_snapshot,
      'assignment_version', v_row.assignment_version
    ),
    'target', CASE WHEN v_target IS NULL THEN NULL ELSE jsonb_build_object(
      'calories', v_target->'calories', 'protein_g', v_target->'protein_g',
      'carbs_g', v_target->'carbs_g', 'fat_g', v_target->'fat_g',
      'nutrition_objective', v_target->'nutrition_objective', 'goal_context', v_target->'goal_context',
      'target_source', v_target->'target_source', 'strategy_version', v_target->'strategy_version'
    ) END,
    'planned', jsonb_build_object(
      'calories', v_planned.calories, 'protein_g', v_planned.protein_g,
      'carbs_g', v_planned.carbs_g, 'fat_g', v_planned.fat_g
    ),
    'consumed', jsonb_build_object(
      'calories', COALESCE(v_consumed.calories, 0),
      'protein_g', COALESCE(v_consumed.protein_g, 0),
      'carbs_g', COALESCE(v_consumed.carbs_g, 0),
      'fat_g', COALESCE(v_consumed.fat_g, 0)
    ),
    'day_type', v_snapshot->'training_context'->>'day_type',
    'ordered_slot_keys', v_snapshot->'ordered_slot_keys',
    'slot_states', v_snapshot->'slot_states',
    'slot_roles', v_snapshot->'slot_roles',
    'validation_result', v_snapshot->'validation_result',
    'slots', COALESCE((
      SELECT jsonb_agg(
        to_jsonb(s) || jsonb_build_object(
          'slot_label', s.slot_label,
          'time_label', s.time_label
        )
        ORDER BY COALESCE(s.display_order, s.sort_order)
      )
      FROM public.client_nutrition_slots s
      WHERE s.assignment_id = v_row.id
    ), '[]'::jsonb),
    'today_logs', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'slot_key', l.slot_key,
        'status', l.status,
        'assignment_id', l.assignment_id,
        'consumed_servings', l.consumed_servings,
        'planned_servings', l.planned_servings,
        'consumption_state', l.consumption_state
      ))
      FROM public.client_nutrition_meal_logs l
      WHERE l.user_id = v_user AND l.session_date = CURRENT_DATE
    ), '[]'::jsonb)
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Extended client meal log (partial + consumption events)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.client_log_nutrition_meal(
  p_slot_id UUID,
  p_status TEXT,
  p_session_date DATE DEFAULT CURRENT_DATE,
  p_consumed_servings NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_slot public.client_nutrition_slots%ROWTYPE;
  v_assignment public.client_nutrition_assignments%ROWTYPE;
  v_planned NUMERIC;
  v_consumed NUMERIC;
  v_macros JSONB;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_status NOT IN ('completed', 'skipped', 'partial', 'swapped') THEN
    RAISE EXCEPTION 'invalid_assignment_status' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_slot FROM public.client_nutrition_slots WHERE id = p_slot_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_slot' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_assignment FROM public.client_nutrition_assignments WHERE id = v_slot.assignment_id;
  IF v_assignment.client_id IS DISTINCT FROM v_user OR v_assignment.status <> 'active' THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  v_planned := COALESCE(v_slot.planned_servings, v_slot.servings, 1);
  v_consumed := CASE
    WHEN p_status = 'completed' THEN v_planned
    WHEN p_status = 'skipped' THEN 0
    WHEN p_status = 'partial' THEN COALESCE(p_consumed_servings, 0)
    ELSE 0
  END;

  IF p_status = 'partial' AND (v_consumed <= 0 OR v_consumed >= v_planned) THEN
    RAISE EXCEPTION 'invalid_servings' USING ERRCODE = '22023';
  END IF;

  v_macros := jsonb_build_object(
    'calories', round((v_slot.calories * v_consumed)::numeric, 0),
    'protein_g', round((v_slot.protein_g * v_consumed)::numeric, 1),
    'carbs_g', round((v_slot.carbs_g * v_consumed)::numeric, 1),
    'fat_g', round((v_slot.fat_g * v_consumed)::numeric, 1)
  );

  INSERT INTO public.client_nutrition_meal_logs (
    user_id, assignment_id, slot_id, slot_key, source_external_id, session_date,
    status, planned_servings, consumed_servings, macros_consumed, consumption_state
  ) VALUES (
    v_user, v_assignment.id, v_slot.id, v_slot.slot_key, v_slot.source_external_id,
    COALESCE(p_session_date, CURRENT_DATE), p_status,
    v_planned, v_consumed, v_macros, 'LOGGED'
  )
  ON CONFLICT (user_id, session_date, slot_key)
  DO UPDATE SET
    status = EXCLUDED.status,
    assignment_id = EXCLUDED.assignment_id,
    slot_id = EXCLUDED.slot_id,
    source_external_id = EXCLUDED.source_external_id,
    planned_servings = EXCLUDED.planned_servings,
    consumed_servings = EXCLUDED.consumed_servings,
    macros_consumed = EXCLUDED.macros_consumed,
    consumption_state = 'LOGGED',
    updated_at = now();

  INSERT INTO public.client_nutrition_consumption_events (
    user_id, assignment_id, slot_id, slot_key, session_date,
    event_type, status, planned_servings, consumed_servings,
    source_external_id, macros_consumed
  ) VALUES (
    v_user, v_assignment.id, v_slot.id, v_slot.slot_key, COALESCE(p_session_date, CURRENT_DATE),
    'logged',
    upper(p_status),
    v_planned, v_consumed,
    v_slot.source_external_id, v_macros
  );

  RETURN jsonb_build_object('ok', true, 'macros_consumed', v_macros);
END;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public._nutrition_strategy_guard_allergy(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._nutrition_planned_totals(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._nutrition_insert_slots_from_payload(UUID, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._admin_save_client_nutrition_slots_legacy(UUID, JSONB, UUID, UUID) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.nutrition_create_target(UUID, JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_generate_client_nutrition(UUID, JSONB, DATE, BOOLEAN) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.nutrition_apply_swap(UUID, JSONB, DATE) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.nutrition_create_target(UUID, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_generate_client_nutrition(UUID, JSONB, DATE, BOOLEAN) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.nutrition_apply_swap(UUID, JSONB, DATE) TO authenticated, service_role;
