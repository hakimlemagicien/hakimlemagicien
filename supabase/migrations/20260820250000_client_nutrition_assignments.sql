-- MAAKFIT Command Center Phase 7 — client nutrition assignment snapshots.
-- Additive. No production apply. Meal library edits must not mutate client snapshots.

-- ---------------------------------------------------------------------------
-- 1. Assignment + frozen slots
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.client_nutrition_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('scheduled', 'active', 'completed', 'replaced', 'cancelled')),
  name_ar TEXT,
  starts_on DATE,
  ended_at TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID,
  watch_allergens TEXT[] NOT NULL DEFAULT '{}',
  notes_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS client_nutrition_assignments_one_active
  ON public.client_nutrition_assignments (client_id)
  WHERE status = 'active';
CREATE UNIQUE INDEX IF NOT EXISTS client_nutrition_assignments_one_scheduled
  ON public.client_nutrition_assignments (client_id)
  WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS client_nutrition_assignments_client_idx
  ON public.client_nutrition_assignments (client_id, assigned_at DESC);

CREATE TABLE IF NOT EXISTS public.client_nutrition_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.client_nutrition_assignments(id) ON DELETE CASCADE,
  slot_key TEXT NOT NULL CHECK (slot_key IN ('breakfast', 'snack', 'lunch', 'dinner')),
  slot_label TEXT NOT NULL,
  time_label TEXT NOT NULL,
  hour INT NOT NULL CHECK (hour BETWEEN 0 AND 23),
  minute INT NOT NULL CHECK (minute BETWEEN 0 AND 59),
  sort_order INT NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  source_meal_id UUID REFERENCES public.meals(id) ON DELETE SET NULL,
  source_external_id TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  meal_type TEXT,
  calories NUMERIC NOT NULL DEFAULT 0,
  protein_g NUMERIC NOT NULL DEFAULT 0,
  carbs_g NUMERIC NOT NULL DEFAULT 0,
  fat_g NUMERIC NOT NULL DEFAULT 0,
  serving_size NUMERIC,
  serving_unit TEXT,
  servings NUMERIC NOT NULL DEFAULT 1 CHECK (servings > 0),
  allergens TEXT[] NOT NULL DEFAULT '{}',
  notes_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, slot_key)
);

CREATE INDEX IF NOT EXISTS client_nutrition_slots_assignment_idx
  ON public.client_nutrition_slots (assignment_id, sort_order);

CREATE TABLE IF NOT EXISTS public.client_nutrition_meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.client_nutrition_assignments(id) ON DELETE SET NULL,
  slot_id UUID REFERENCES public.client_nutrition_slots(id) ON DELETE SET NULL,
  slot_key TEXT NOT NULL,
  source_external_id TEXT NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('completed', 'skipped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, session_date, slot_key)
);

CREATE INDEX IF NOT EXISTS client_nutrition_meal_logs_user_date_idx
  ON public.client_nutrition_meal_logs (user_id, session_date DESC);
CREATE INDEX IF NOT EXISTS client_nutrition_meal_logs_assignment_idx
  ON public.client_nutrition_meal_logs (assignment_id, session_date DESC)
  WHERE assignment_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_client_nutrition_assignments_updated_at ON public.client_nutrition_assignments;
CREATE TRIGGER trg_client_nutrition_assignments_updated_at
  BEFORE UPDATE ON public.client_nutrition_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_client_nutrition_slots_updated_at ON public.client_nutrition_slots;
CREATE TRIGGER trg_client_nutrition_slots_updated_at
  BEFORE UPDATE ON public.client_nutrition_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_client_nutrition_meal_logs_updated_at ON public.client_nutrition_meal_logs;
CREATE TRIGGER trg_client_nutrition_meal_logs_updated_at
  BEFORE UPDATE ON public.client_nutrition_meal_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.client_nutrition_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_nutrition_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_nutrition_meal_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.client_nutrition_assignments FROM anon, authenticated;
REVOKE ALL ON public.client_nutrition_slots FROM anon, authenticated;
REVOKE ALL ON public.client_nutrition_meal_logs FROM anon, authenticated;
GRANT SELECT ON public.client_nutrition_assignments TO authenticated;
GRANT SELECT ON public.client_nutrition_slots TO authenticated;
GRANT SELECT ON public.client_nutrition_meal_logs TO authenticated;
GRANT ALL ON public.client_nutrition_assignments TO service_role;
GRANT ALL ON public.client_nutrition_slots TO service_role;
GRANT ALL ON public.client_nutrition_meal_logs TO service_role;

DROP POLICY IF EXISTS client_nutrition_assignments_own_select ON public.client_nutrition_assignments;
DROP POLICY IF EXISTS client_nutrition_assignments_admin_select ON public.client_nutrition_assignments;
CREATE POLICY client_nutrition_assignments_own_select
  ON public.client_nutrition_assignments FOR SELECT TO authenticated
  USING (client_id = auth.uid());
CREATE POLICY client_nutrition_assignments_admin_select
  ON public.client_nutrition_assignments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS client_nutrition_slots_own_select ON public.client_nutrition_slots;
DROP POLICY IF EXISTS client_nutrition_slots_admin_select ON public.client_nutrition_slots;
CREATE POLICY client_nutrition_slots_own_select
  ON public.client_nutrition_slots FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_nutrition_assignments a
      WHERE a.id = assignment_id AND a.client_id = auth.uid()
    )
  );
CREATE POLICY client_nutrition_slots_admin_select
  ON public.client_nutrition_slots FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS client_nutrition_logs_own_select ON public.client_nutrition_meal_logs;
DROP POLICY IF EXISTS client_nutrition_logs_own_insert ON public.client_nutrition_meal_logs;
DROP POLICY IF EXISTS client_nutrition_logs_own_update ON public.client_nutrition_meal_logs;
DROP POLICY IF EXISTS client_nutrition_logs_admin_select ON public.client_nutrition_meal_logs;
CREATE POLICY client_nutrition_logs_own_select
  ON public.client_nutrition_meal_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY client_nutrition_logs_admin_select
  ON public.client_nutrition_meal_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY client_nutrition_logs_own_insert
  ON public.client_nutrition_meal_logs FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      assignment_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.client_nutrition_assignments a
        WHERE a.id = assignment_id AND a.client_id = auth.uid()
      )
    )
  );
CREATE POLICY client_nutrition_logs_own_update
  ON public.client_nutrition_meal_logs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public._allergen_overlap(p_left TEXT[], p_right TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM unnest(COALESCE(p_left, '{}')) AS l(val)
    JOIN unnest(COALESCE(p_right, '{}')) AS r(val)
      ON lower(btrim(l.val)) = lower(btrim(r.val))
     AND btrim(l.val) <> ''
  );
$$;

CREATE OR REPLACE FUNCTION public._nutrition_slot_meta(p_key TEXT)
RETURNS TABLE (slot_label TEXT, time_label TEXT, hour INT, minute INT, sort_order INT)
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT x.slot_label, x.time_label, x.hour, x.minute, x.sort_order
  FROM (
    VALUES
      ('breakfast', 'الفطور', '8:00 ص', 8, 0, 0),
      ('snack', 'سناك', '11:00 ص', 11, 0, 1),
      ('lunch', 'الغداء', '2:00 م', 14, 0, 2),
      ('dinner', 'العشاء', '8:00 م', 20, 0, 3)
  ) AS x(slot_key, slot_label, time_label, hour, minute, sort_order)
  WHERE x.slot_key = p_key;
$$;

CREATE OR REPLACE FUNCTION public._nutrition_tree(p_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row JSONB;
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
    'planned_calories', (
      SELECT COALESCE(sum(s.calories * s.servings), 0)
      FROM public.client_nutrition_slots s WHERE s.assignment_id = a.id
    ),
    'planned_protein_g', (
      SELECT COALESCE(sum(s.protein_g * s.servings), 0)
      FROM public.client_nutrition_slots s WHERE s.assignment_id = a.id
    ),
    'planned_carbs_g', (
      SELECT COALESCE(sum(s.carbs_g * s.servings), 0)
      FROM public.client_nutrition_slots s WHERE s.assignment_id = a.id
    ),
    'planned_fat_g', (
      SELECT COALESCE(sum(s.fat_g * s.servings), 0)
      FROM public.client_nutrition_slots s WHERE s.assignment_id = a.id
    ),
    'slots', COALESCE((
      SELECT jsonb_agg(to_jsonb(s) ORDER BY s.sort_order)
      FROM public.client_nutrition_slots s
      WHERE s.assignment_id = a.id
    ), '[]'::jsonb)
  )
  INTO v_row
  FROM public.client_nutrition_assignments a
  WHERE a.id = p_id;
  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public._nutrition_tree(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._nutrition_slot_meta(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._allergen_overlap(TEXT[], TEXT[]) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public._copy_meals_to_nutrition_assignment(p_assignment_id UUID, p_slots JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_meal public.meals%ROWTYPE;
  v_meta RECORD;
  v_key TEXT;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_slots, '[]'::jsonb))
  LOOP
    v_key := v_item->>'slot_key';
    SELECT * INTO v_meta FROM public._nutrition_slot_meta(v_key);
    IF v_meta IS NULL THEN
      RAISE EXCEPTION 'invalid_slot' USING ERRCODE = '22023';
    END IF;
    SELECT * INTO v_meal FROM public.meals WHERE id = NULLIF(v_item->>'meal_id', '')::UUID;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'meal_required' USING ERRCODE = '22023';
    END IF;
    IF v_meal.status <> 'published' OR v_meal.is_active IS NOT TRUE THEN
      RAISE EXCEPTION 'meal_not_assignable' USING ERRCODE = '22023';
    END IF;
    IF COALESCE((v_item->>'servings')::NUMERIC, 1) <= 0 THEN
      RAISE EXCEPTION 'invalid_servings' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.client_nutrition_slots (
      assignment_id, slot_key, slot_label, time_label, hour, minute, sort_order,
      source_meal_id, source_external_id, name_ar, name_en, meal_type,
      calories, protein_g, carbs_g, fat_g, serving_size, serving_unit, servings,
      allergens, notes_ar
    ) VALUES (
      p_assignment_id, v_key, v_meta.slot_label, v_meta.time_label, v_meta.hour, v_meta.minute, v_meta.sort_order,
      v_meal.id, v_meal.external_id, v_meal.name_ar, v_meal.name_en, v_meal.meal_type::TEXT,
      v_meal.calories, v_meal.protein_g, v_meal.carbs_g, v_meal.fat_g, v_meal.serving_size, v_meal.serving_unit,
      COALESCE((v_item->>'servings')::NUMERIC, 1),
      COALESCE(v_meal.allergens, '{}'), NULLIF(v_item->>'notes_ar', '')
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public._copy_meals_to_nutrition_assignment(UUID, JSONB) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Admin RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_assign_client_nutrition(
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
  v_slots JSONB;
  v_keys TEXT[];
BEGIN
  v_admin := public._require_admin();
  IF p_client_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_client_id) THEN
    RAISE EXCEPTION 'invalid_client' USING ERRCODE = '22023';
  END IF;

  v_slots := COALESCE(p_payload->'slots', '[]'::jsonb);
  IF jsonb_array_length(v_slots) <> 4 THEN
    RAISE EXCEPTION 'slots_required' USING ERRCODE = '22023';
  END IF;
  SELECT array_agg(x->>'slot_key') INTO v_keys FROM jsonb_array_elements(v_slots) x;
  IF (SELECT count(DISTINCT k) FROM unnest(v_keys) k) <> 4 THEN
    RAISE EXCEPTION 'invalid_slot' USING ERRCODE = '22023';
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

  INSERT INTO public.client_nutrition_assignments (
    client_id, status, name_ar, starts_on, assigned_by, watch_allergens, notes_ar
  ) VALUES (
    p_client_id, v_status,
    COALESCE(NULLIF(p_payload->>'name_ar', ''), 'خطة تغذية'),
    COALESCE(p_starts_on, CURRENT_DATE),
    v_admin,
    COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'watch_allergens', '[]'::jsonb))), '{}'),
    NULLIF(p_payload->>'notes_ar', '')
  )
  RETURNING id INTO v_id;

  PERFORM public._copy_meals_to_nutrition_assignment(v_id, v_slots);

  PERFORM public._write_audit_event(
    v_admin, p_client_id,
    CASE WHEN v_active IS NOT NULL AND v_status = 'active' THEN 'client_nutrition_replaced' ELSE 'client_nutrition_assigned' END,
    jsonb_build_object('assignment_id', v_id, 'replaced_assignment_id', v_active, 'status', v_status)
  );

  RETURN public._nutrition_tree(v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_client_nutrition_assignment(p_assignment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row JSONB;
BEGIN
  PERFORM public._require_admin();
  v_row := public._nutrition_tree(p_assignment_id);
  IF v_row IS NULL THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_client_nutrition_assignments(
  p_client_id UUID,
  p_limit INTEGER DEFAULT 25,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  status TEXT,
  name_ar TEXT,
  starts_on DATE,
  assigned_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  snapshot_complete BOOLEAN,
  allergen_conflict BOOLEAN,
  total_count BIGINT
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
    a.id, a.status, a.name_ar, a.starts_on, a.assigned_at, a.ended_at,
    EXISTS (SELECT 1 FROM public.client_nutrition_slots s WHERE s.assignment_id = a.id),
    EXISTS (
      SELECT 1 FROM public.client_nutrition_slots s
      WHERE s.assignment_id = a.id AND public._allergen_overlap(a.watch_allergens, s.allergens)
    ),
    count(*) OVER ()::BIGINT
  FROM public.client_nutrition_assignments a
  WHERE a.client_id = p_client_id
  ORDER BY a.assigned_at DESC
  LIMIT v_limit OFFSET v_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_end_client_nutrition(
  p_assignment_id UUID,
  p_status TEXT DEFAULT 'completed'
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
  IF p_status NOT IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'invalid_assignment_status' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_row FROM public.client_nutrition_assignments WHERE id = p_assignment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_row.status NOT IN ('active', 'scheduled') THEN
    RAISE EXCEPTION 'invalid_assignment_status' USING ERRCODE = '22023';
  END IF;
  UPDATE public.client_nutrition_assignments
  SET status = p_status, ended_at = now()
  WHERE id = p_assignment_id;
  PERFORM public._write_audit_event(
    v_admin, v_row.client_id, 'client_nutrition_ended',
    jsonb_build_object('assignment_id', p_assignment_id, 'status', p_status)
  );
  RETURN public._nutrition_tree(p_assignment_id);
END;
$$;

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
  v_item JSONB;
  v_id UUID;
  v_meal public.meals%ROWTYPE;
  v_old UUID;
BEGIN
  v_admin := public._require_admin();
  SELECT * INTO v_row FROM public.client_nutrition_assignments WHERE id = p_assignment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
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
        v_admin, v_row.client_id, 'client_meal_replaced',
        jsonb_build_object(
          'assignment_id', p_assignment_id, 'slot_id', v_id,
          'old_meal_id', v_old, 'new_meal_id', v_meal.id
        )
      );
    END IF;

    UPDATE public.client_nutrition_slots SET
      servings = (v_item->>'servings')::NUMERIC,
      notes_ar = NULLIF(v_item->>'notes_ar', '')
    WHERE id = v_id;
  END LOOP;

  UPDATE public.client_nutrition_assignments SET updated_at = now() WHERE id = p_assignment_id;
  PERFORM public._write_audit_event(
    v_admin, v_row.client_id, 'client_meal_portion_updated',
    jsonb_build_object('assignment_id', p_assignment_id)
  );
  RETURN public._nutrition_tree(p_assignment_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_client_nutrition_logs(
  p_client_id UUID,
  p_limit INTEGER DEFAULT 25,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  slot_key TEXT,
  source_external_id TEXT,
  session_date DATE,
  status TEXT,
  assignment_id UUID,
  created_at TIMESTAMPTZ,
  total_count BIGINT
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
  SELECT l.id, l.slot_key, l.source_external_id, l.session_date, l.status, l.assignment_id, l.created_at,
         count(*) OVER ()::BIGINT
  FROM public.client_nutrition_meal_logs l
  WHERE l.user_id = p_client_id
  ORDER BY l.session_date DESC, l.created_at DESC
  LIMIT v_limit OFFSET v_offset;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Client runtime
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

  IF NOT EXISTS (SELECT 1 FROM public.client_nutrition_slots s WHERE s.assignment_id = v_row.id) THEN
    RETURN jsonb_build_object(
      'reason', 'legacy_incomplete',
      'assignment', jsonb_build_object(
        'id', v_row.id,
        'status', v_row.status,
        'name_ar', v_row.name_ar,
        'starts_on', v_row.starts_on,
        'watch_allergens', v_row.watch_allergens
      ),
      'slots', '[]'::jsonb,
      'today_logs', '[]'::jsonb
    );
  END IF;

  IF v_row.status = 'scheduled' AND v_row.starts_on IS NOT NULL AND v_row.starts_on > CURRENT_DATE THEN
    v_reason := 'scheduled';
  ELSE
    v_reason := 'ok';
  END IF;

    RETURN jsonb_build_object(
    'reason', v_reason,
    'assignment', jsonb_build_object(
      'id', v_row.id,
      'status', v_row.status,
      'name_ar', v_row.name_ar,
      'starts_on', v_row.starts_on,
      'watch_allergens', v_row.watch_allergens
    ),
    'slots', COALESCE((
      SELECT jsonb_agg(to_jsonb(s) ORDER BY s.sort_order)
      FROM public.client_nutrition_slots s
      WHERE s.assignment_id = v_row.id
    ), '[]'::jsonb),
    'today_logs', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'slot_key', l.slot_key, 'status', l.status, 'assignment_id', l.assignment_id
      ))
      FROM public.client_nutrition_meal_logs l
      WHERE l.user_id = v_user AND l.session_date = CURRENT_DATE
    ), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.client_log_nutrition_meal(
  p_slot_id UUID,
  p_status TEXT,
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
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_status NOT IN ('completed', 'skipped') THEN
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

  INSERT INTO public.client_nutrition_meal_logs (
    user_id, assignment_id, slot_id, slot_key, source_external_id, session_date, status
  ) VALUES (
    v_user, v_assignment.id, v_slot.id, v_slot.slot_key, v_slot.source_external_id,
    COALESCE(p_session_date, CURRENT_DATE), p_status
  )
  ON CONFLICT (user_id, session_date, slot_key)
  DO UPDATE SET
    status = EXCLUDED.status,
    assignment_id = EXCLUDED.assignment_id,
    slot_id = EXCLUDED.slot_id,
    source_external_id = client_nutrition_meal_logs.source_external_id,
    updated_at = now();

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. Overview (keep Phase 6 fields)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_get_client_overview(p_client_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_membership JSONB;
  v_coaching JSONB;
  v_assignment JSONB;
  v_nutrition JSONB;
  v_last_workout TIMESTAMPTZ;
  v_last_nutrition TIMESTAMPTZ;
  v_notes_count INTEGER;
  v_open_support INTEGER;
BEGIN
  PERFORM public._require_admin();
  IF p_client_id IS NULL THEN
    RAISE EXCEPTION 'invalid_client' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_client_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'tier', mem.tier, 'is_active', mem.is_active, 'source', mem.source,
    'starts_at', mem.starts_at, 'ends_at', mem.ends_at,
    'billing_period_months', mem.billing_period_months, 'paid_period_end', mem.paid_period_end,
    'auto_renew', mem.auto_renew, 'cancel_at_period_end', mem.cancel_at_period_end,
    'next_renewal_at', mem.next_renewal_at
  )
  INTO v_membership
  FROM public.memberships mem
  WHERE mem.user_id = p_client_id AND mem.is_active = true
  ORDER BY mem.starts_at DESC
  LIMIT 1;

  SELECT jsonb_build_object(
    'conversation_id', conv.id, 'status', conv.status, 'last_message_at', conv.last_message_at,
    'unread_count', (
      SELECT COUNT(*)::int FROM public.coaching_messages msg
      WHERE msg.conversation_id = conv.id AND msg.actor = 'member'
        AND (conv.coach_last_read_at IS NULL OR msg.created_at > conv.coach_last_read_at)
    )
  )
  INTO v_coaching
  FROM public.coaching_conversations conv
  WHERE conv.member_id = p_client_id
  ORDER BY conv.created_at DESC
  LIMIT 1;

  SELECT jsonb_build_object(
    'id', a.id, 'source_template_id', a.source_template_id, 'template_version', a.template_version,
    'status', a.status, 'assigned_at', a.assigned_at, 'starts_on', a.starts_on,
    'name_ar', a.name_ar, 'duration_weeks', a.duration_weeks,
    'snapshot_complete', EXISTS (SELECT 1 FROM public.client_program_weeks w WHERE w.assignment_id = a.id)
  )
  INTO v_assignment
  FROM public.client_program_assignments a
  WHERE a.client_id = p_client_id AND a.status IN ('active', 'scheduled')
  ORDER BY CASE a.status WHEN 'active' THEN 0 ELSE 1 END
  LIMIT 1;

  SELECT jsonb_build_object(
    'id', n.id, 'status', n.status, 'name_ar', n.name_ar, 'starts_on', n.starts_on,
    'assigned_at', n.assigned_at, 'snapshot_complete', EXISTS (
      SELECT 1 FROM public.client_nutrition_slots s WHERE s.assignment_id = n.id
    ),
    'allergen_conflict', EXISTS (
      SELECT 1 FROM public.client_nutrition_slots s
      WHERE s.assignment_id = n.id AND public._allergen_overlap(n.watch_allergens, s.allergens)
    )
  )
  INTO v_nutrition
  FROM public.client_nutrition_assignments n
  WHERE n.client_id = p_client_id AND n.status IN ('active', 'scheduled')
  ORDER BY CASE n.status WHEN 'active' THEN 0 ELSE 1 END
  LIMIT 1;

  SELECT MAX(wsl.created_at) INTO v_last_workout
  FROM public.workout_set_logs wsl WHERE wsl.user_id = p_client_id;
  SELECT MAX(l.created_at) INTO v_last_nutrition
  FROM public.client_nutrition_meal_logs l WHERE l.user_id = p_client_id;
  SELECT COUNT(*)::int INTO v_notes_count
  FROM public.coach_client_notes n WHERE n.client_id = p_client_id AND n.archived_at IS NULL;
  SELECT COUNT(*)::int INTO v_open_support
  FROM public.support_tickets t WHERE t.user_id = p_client_id AND t.status IN ('received', 'in_review');

  RETURN jsonb_build_object(
    'id', v_profile.id, 'full_name', v_profile.full_name, 'email', v_profile.email,
    'phone', v_profile.phone, 'avatar_path', v_profile.avatar_path, 'goal', v_profile.goal,
    'city', v_profile.city, 'training_type', v_profile.training_type,
    'program_start_date', v_profile.program_start_date,
    'onboarding_completed_at', v_profile.onboarding_completed_at, 'created_at', v_profile.created_at,
    'membership', v_membership, 'coaching', v_coaching, 'assignment', v_assignment,
    'nutrition_assignment', v_nutrition,
    'last_workout_at', v_last_workout, 'last_nutrition_at', v_last_nutrition,
    'notes_count', v_notes_count, 'open_support_count', v_open_support
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. Grants
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.admin_assign_client_nutrition(UUID, JSONB, DATE, BOOLEAN) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_client_nutrition_assignment(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_client_nutrition_assignments(UUID, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_end_client_nutrition(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_save_client_nutrition_slots(UUID, JSONB, TIMESTAMPTZ) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_client_nutrition_logs(UUID, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.client_get_my_nutrition_runtime() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.client_log_nutrition_meal(UUID, TEXT, DATE) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_assign_client_nutrition(UUID, JSONB, DATE, BOOLEAN) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_client_nutrition_assignment(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_client_nutrition_assignments(UUID, INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_end_client_nutrition(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_save_client_nutrition_slots(UUID, JSONB, TIMESTAMPTZ) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_client_nutrition_logs(UUID, INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.client_get_my_nutrition_runtime() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.client_log_nutrition_meal(UUID, TEXT, DATE) TO authenticated, service_role;
