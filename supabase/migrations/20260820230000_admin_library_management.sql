-- MAAKFIT Command Center Phase 5 — library management contracts.
-- Additive. No production apply. No parallel admin_* catalog tables.
-- Admin UI → authorized RPC → existing exercises / meals / program_templates / discover_content.

-- ---------------------------------------------------------------------------
-- 1. Hard-delete protection + meal member visibility
-- ---------------------------------------------------------------------------

REVOKE DELETE ON public.discover_content FROM authenticated;
REVOKE DELETE ON public.discover_categories FROM authenticated;
REVOKE DELETE ON public.meal_ingredients FROM authenticated;

DROP POLICY IF EXISTS meals_select_active ON public.meals;
CREATE POLICY meals_select_published
  ON public.meals
  FOR SELECT
  TO authenticated
  USING (is_active = true AND status = 'published');

DROP POLICY IF EXISTS meal_ingredients_select_active ON public.meal_ingredients;
CREATE POLICY meal_ingredients_select_published
  ON public.meal_ingredients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.meals m
      WHERE m.id = meal_id
        AND m.is_active = true
        AND m.status = 'published'
    )
  );

CREATE INDEX IF NOT EXISTS meals_external_id_idx ON public.meals (external_id);
CREATE INDEX IF NOT EXISTS meals_status_active_idx ON public.meals (status, is_active, updated_at DESC);
CREATE INDEX IF NOT EXISTS exercises_search_updated_idx ON public.exercises (updated_at DESC);
CREATE INDEX IF NOT EXISTS program_templates_updated_idx ON public.program_templates (updated_at DESC);
CREATE INDEX IF NOT EXISTS discover_content_updated_idx ON public.discover_content (updated_at DESC);

INSERT INTO public.discover_categories (slug, name_ar, icon, sort_order, status)
VALUES
  ('exercises', 'تمارين', 'dumbbell', 1, 'active'),
  ('nutrition', 'تغذية', 'utensils', 2, 'active'),
  ('fat-loss', 'خسارة الدهون', 'flame', 3, 'active'),
  ('muscle', 'بناء العضلات', 'biceps', 4, 'active'),
  ('mindset', 'العقلية', 'brain', 5, 'active'),
  ('sleep', 'النوم', 'moon', 6, 'active'),
  ('hydration', 'الترطيب', 'droplet', 7, 'active'),
  ('health', 'الصحة', 'heart', 8, 'active'),
  ('cardio', 'الكارديو', 'activity', 9, 'active'),
  ('recipes', 'وصفات', 'salad', 10, 'active')
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Client overlay exclusions (archive/unpublish hides seed copies)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.client_list_hidden_library_keys()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'meal_external_ids', COALESCE((
      SELECT jsonb_agg(m.external_id ORDER BY m.external_id)
      FROM public.meals m
      WHERE m.is_active = false OR m.status = 'archived'::public.meal_library_status
    ), '[]'::jsonb),
    'discover_slugs', COALESCE((
      SELECT jsonb_agg(c.slug ORDER BY c.slug)
      FROM public.discover_content c
      WHERE c.status IN (
        'unpublished'::public.discover_content_status,
        'archived'::public.discover_content_status
      )
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.client_list_hidden_library_keys() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.client_list_hidden_library_keys() TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Exercise library
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_exercise_filter_options()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._require_admin();
  RETURN jsonb_build_object(
    'muscles', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', g.id,
        'code', g.code,
        'name_ar', g.name_ar,
        'name_en', g.name_en
      ) ORDER BY g.sort_order, g.name_ar)
      FROM public.exercise_muscle_groups g
      WHERE g.is_active = true
    ), '[]'::jsonb),
    'equipment', COALESCE((
      SELECT jsonb_agg(DISTINCT e.equipment ORDER BY e.equipment)
      FROM public.exercises e
      WHERE e.equipment IS NOT NULL AND btrim(e.equipment) <> ''
    ), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_exercises(
  p_query TEXT DEFAULT NULL,
  p_muscle TEXT DEFAULT NULL,
  p_equipment TEXT DEFAULT NULL,
  p_difficulty TEXT DEFAULT NULL,
  p_type TEXT DEFAULT NULL,
  p_active BOOLEAN DEFAULT NULL,
  p_limit INTEGER DEFAULT 25,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  external_id TEXT,
  slug TEXT,
  name_ar TEXT,
  name_en TEXT,
  equipment TEXT,
  difficulty public.exercise_difficulty,
  exercise_type public.exercise_type,
  primary_muscle TEXT,
  is_active BOOLEAN,
  video_status public.exercise_media_status,
  instructions_status public.exercise_media_status,
  thumbnail_path TEXT,
  muscle_group_name_ar TEXT,
  updated_at TIMESTAMPTZ,
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
  v_q TEXT := NULLIF(btrim(COALESCE(p_query, '')), '');
BEGIN
  PERFORM public._require_admin();

  RETURN QUERY
  SELECT
    e.id,
    e.external_id,
    e.slug,
    e.name_ar,
    e.name_en,
    e.equipment,
    e.difficulty,
    e.exercise_type,
    e.primary_muscle,
    e.is_active,
    e.video_status,
    e.instructions_status,
    e.thumbnail_path,
    g.name_ar,
    e.updated_at,
    count(*) OVER ()::BIGINT
  FROM public.exercises e
  JOIN public.exercise_muscle_groups g ON g.id = e.muscle_group_id
  WHERE (p_active IS NULL OR e.is_active = p_active)
    AND (p_muscle IS NULL OR e.muscle_group_id::TEXT = p_muscle OR g.code = p_muscle)
    AND (p_equipment IS NULL OR e.equipment = p_equipment)
    AND (p_difficulty IS NULL OR e.difficulty::TEXT = p_difficulty)
    AND (p_type IS NULL OR e.exercise_type::TEXT = p_type)
    AND (
      v_q IS NULL
      OR e.name_ar ILIKE '%' || v_q || '%'
      OR e.name_en ILIKE '%' || v_q || '%'
      OR e.external_id ILIKE '%' || v_q || '%'
      OR e.slug ILIKE '%' || v_q || '%'
    )
  ORDER BY e.updated_at DESC, e.sort_order, e.name_ar
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_exercise(p_id UUID)
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
  SELECT to_jsonb(e) || jsonb_build_object(
    'muscle_group', to_jsonb(g)
  )
  INTO v_row
  FROM public.exercises e
  JOIN public.exercise_muscle_groups g ON g.id = e.muscle_group_id
  WHERE e.id = p_id;

  IF v_row IS NULL THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_save_exercise(
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
  v_id UUID;
  v_existing public.exercises%ROWTYPE;
  v_name_ar TEXT;
  v_name_en TEXT;
  v_external TEXT;
  v_slug TEXT;
  v_group UUID;
  v_type TEXT;
  v_diff TEXT;
BEGIN
  v_admin := public._require_admin();
  v_id := NULLIF(p_payload->>'id', '')::UUID;
  v_name_ar := NULLIF(btrim(COALESCE(p_payload->>'name_ar', '')), '');
  v_name_en := NULLIF(btrim(COALESCE(p_payload->>'name_en', '')), '');
  v_external := NULLIF(btrim(COALESCE(p_payload->>'external_id', '')), '');
  v_slug := NULLIF(btrim(COALESCE(p_payload->>'slug', '')), '');
  v_group := NULLIF(p_payload->>'muscle_group_id', '')::UUID;
  v_type := COALESCE(NULLIF(p_payload->>'exercise_type', ''), 'strength');
  v_diff := NULLIF(p_payload->>'difficulty', '');

  IF v_name_ar IS NULL OR v_name_en IS NULL THEN
    RAISE EXCEPTION 'name_required' USING ERRCODE = '22023';
  END IF;
  IF v_group IS NULL THEN
    RAISE EXCEPTION 'muscle_group_required' USING ERRCODE = '22023';
  END IF;
  IF v_type NOT IN ('strength', 'cardio', 'mobility', 'warmup', 'other') THEN
    RAISE EXCEPTION 'invalid_exercise_type' USING ERRCODE = '22023';
  END IF;
  IF v_diff IS NOT NULL AND v_diff NOT IN ('beginner', 'intermediate', 'advanced') THEN
    RAISE EXCEPTION 'invalid_difficulty' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exercise_muscle_groups g WHERE g.id = v_group) THEN
    RAISE EXCEPTION 'muscle_group_required' USING ERRCODE = '22023';
  END IF;

  IF v_slug IS NULL THEN
    v_slug := lower(regexp_replace(v_name_en, '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := trim(BOTH '-' FROM v_slug);
  END IF;
  IF v_slug IS NULL OR v_slug = '' THEN
    RAISE EXCEPTION 'slug_required' USING ERRCODE = '22023';
  END IF;
  IF v_external IS NULL THEN
    v_external := 'EX-' || substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 8);
  END IF;

  IF v_id IS NOT NULL THEN
    SELECT * INTO v_existing FROM public.exercises WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
    END IF;
    IF p_expected_updated_at IS NOT NULL AND v_existing.updated_at IS DISTINCT FROM p_expected_updated_at THEN
      RAISE EXCEPTION 'stale_update' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.exercises e
      WHERE e.id <> v_id AND (e.external_id = v_external OR e.slug = v_slug)
    ) THEN
      RAISE EXCEPTION 'duplicate_exercise' USING ERRCODE = '23505';
    END IF;

    UPDATE public.exercises SET
      external_id = v_external,
      slug = v_slug,
      muscle_group_id = v_group,
      name_ar = v_name_ar,
      name_en = v_name_en,
      equipment = NULLIF(btrim(COALESCE(p_payload->>'equipment', '')), ''),
      difficulty = v_diff::public.exercise_difficulty,
      exercise_type = v_type::public.exercise_type,
      primary_muscle = NULLIF(btrim(COALESCE(p_payload->>'primary_muscle', '')), ''),
      secondary_muscles = COALESCE(
        ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'secondary_muscles', '[]'::jsonb))),
        '{}'::text[]
      ),
      coach_notes = NULLIF(p_payload->>'coach_notes', ''),
      duration_seconds = GREATEST(COALESCE((p_payload->>'duration_seconds')::INT, 30), 1),
      youtube_url = NULLIF(btrim(COALESCE(p_payload->>'youtube_url', '')), ''),
      video_path = NULLIF(p_payload->>'video_path', ''),
      instructions_video_path = NULLIF(p_payload->>'instructions_video_path', ''),
      thumbnail_path = NULLIF(p_payload->>'thumbnail_path', ''),
      video_status = COALESCE(NULLIF(p_payload->>'video_status', ''), v_existing.video_status::TEXT)::public.exercise_media_status,
      instructions_status = COALESCE(NULLIF(p_payload->>'instructions_status', ''), v_existing.instructions_status::TEXT)::public.exercise_media_status,
      sort_order = COALESCE((p_payload->>'sort_order')::INT, v_existing.sort_order)
    WHERE id = v_id;
  ELSE
    IF EXISTS (SELECT 1 FROM public.exercises e WHERE e.external_id = v_external OR e.slug = v_slug) THEN
      RAISE EXCEPTION 'duplicate_exercise' USING ERRCODE = '23505';
    END IF;
    INSERT INTO public.exercises (
      external_id, slug, muscle_group_id, name_ar, name_en, equipment, difficulty,
      exercise_type, primary_muscle, secondary_muscles, coach_notes, duration_seconds,
      youtube_url, video_path, instructions_video_path, thumbnail_path, is_active
    ) VALUES (
      v_external, v_slug, v_group, v_name_ar, v_name_en,
      NULLIF(btrim(COALESCE(p_payload->>'equipment', '')), ''),
      v_diff::public.exercise_difficulty,
      v_type::public.exercise_type,
      NULLIF(btrim(COALESCE(p_payload->>'primary_muscle', '')), ''),
      COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'secondary_muscles', '[]'::jsonb))), '{}'::text[]),
      NULLIF(p_payload->>'coach_notes', ''),
      GREATEST(COALESCE((p_payload->>'duration_seconds')::INT, 30), 1),
      NULLIF(btrim(COALESCE(p_payload->>'youtube_url', '')), ''),
      NULLIF(p_payload->>'video_path', ''),
      NULLIF(p_payload->>'instructions_video_path', ''),
      NULLIF(p_payload->>'thumbnail_path', ''),
      COALESCE((p_payload->>'is_active')::BOOLEAN, false)
    )
    RETURNING id INTO v_id;
  END IF;

  RETURN public.admin_get_exercise(v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_exercise_active(
  p_id UUID,
  p_active BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_existing public.exercises%ROWTYPE;
BEGIN
  v_admin := public._require_admin();
  SELECT * INTO v_existing FROM public.exercises WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.exercises SET is_active = p_active WHERE id = p_id;

  PERFORM public._write_audit_event(
    v_admin,
    v_admin,
    CASE WHEN p_active THEN 'exercise_published' ELSE 'exercise_archived' END,
    jsonb_build_object('exercise_id', p_id, 'external_id', v_existing.external_id)
  );

  RETURN public.admin_get_exercise(p_id);
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Nutrition / meals
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_list_meals(
  p_query TEXT DEFAULT NULL,
  p_type TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 25,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  external_id TEXT,
  name_ar TEXT,
  name_en TEXT,
  meal_type public.meal_type,
  calories NUMERIC,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  status public.meal_library_status,
  review_status TEXT,
  is_active BOOLEAN,
  image_thumb_path TEXT,
  image_status public.meal_image_status,
  updated_at TIMESTAMPTZ,
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
  v_q TEXT := NULLIF(btrim(COALESCE(p_query, '')), '');
BEGIN
  PERFORM public._require_admin();

  RETURN QUERY
  SELECT
    m.id,
    m.external_id,
    m.name_ar,
    m.name_en,
    m.meal_type,
    m.calories,
    m.protein_g,
    m.carbs_g,
    m.fat_g,
    m.status,
    m.review_status,
    m.is_active,
    m.image_thumb_path,
    m.image_status,
    m.updated_at,
    count(*) OVER ()::BIGINT
  FROM public.meals m
  WHERE (p_type IS NULL OR m.meal_type::TEXT = p_type)
    AND (p_status IS NULL OR m.status::TEXT = p_status)
    AND (
      v_q IS NULL
      OR m.external_id ILIKE '%' || v_q || '%'
      OR m.name_ar ILIKE '%' || v_q || '%'
      OR m.name_en ILIKE '%' || v_q || '%'
    )
  ORDER BY m.updated_at DESC, m.sort_order, m.external_id
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_meal(p_id UUID)
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
  SELECT to_jsonb(m) || jsonb_build_object(
    'ingredients', COALESCE((
      SELECT jsonb_agg(to_jsonb(i) ORDER BY i.ingredient_order)
      FROM public.meal_ingredients i
      WHERE i.meal_id = m.id
    ), '[]'::jsonb)
  )
  INTO v_row
  FROM public.meals m
  WHERE m.id = p_id;

  IF v_row IS NULL THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_save_meal(
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
  v_id UUID;
  v_existing public.meals%ROWTYPE;
  v_name_ar TEXT;
  v_name_en TEXT;
  v_external TEXT;
  v_type TEXT;
  v_ing JSONB;
  v_item JSONB;
  v_order INT := 0;
  v_keys TEXT[] := '{}';
  v_old_fp TEXT;
  v_new_fp TEXT;
  v_review TEXT;
BEGIN
  v_admin := public._require_admin();
  v_id := NULLIF(p_payload->>'id', '')::UUID;
  v_name_ar := NULLIF(btrim(COALESCE(p_payload->>'name_ar', '')), '');
  v_name_en := NULLIF(btrim(COALESCE(p_payload->>'name_en', '')), '');
  v_external := NULLIF(btrim(COALESCE(p_payload->>'external_id', '')), '');
  v_type := COALESCE(p_payload->>'meal_type', 'lunch');
  v_ing := COALESCE(p_payload->'ingredients', '[]'::jsonb);
  v_review := NULLIF(btrim(COALESCE(p_payload->>'review_status', '')), '');

  IF v_name_ar IS NULL OR v_name_en IS NULL THEN
    RAISE EXCEPTION 'name_required' USING ERRCODE = '22023';
  END IF;
  IF v_external IS NULL THEN
    RAISE EXCEPTION 'external_id_required' USING ERRCODE = '22023';
  END IF;
  IF v_type NOT IN ('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout') THEN
    RAISE EXCEPTION 'invalid_meal_type' USING ERRCODE = '22023';
  END IF;
  IF COALESCE((p_payload->>'calories')::NUMERIC, -1) < 0
     OR COALESCE((p_payload->>'protein_g')::NUMERIC, -1) < 0
     OR COALESCE((p_payload->>'carbs_g')::NUMERIC, -1) < 0
     OR COALESCE((p_payload->>'fat_g')::NUMERIC, -1) < 0 THEN
    RAISE EXCEPTION 'invalid_macros' USING ERRCODE = '22023';
  END IF;
  IF COALESCE((p_payload->>'serving_size')::NUMERIC, 0) <= 0 THEN
    RAISE EXCEPTION 'invalid_serving' USING ERRCODE = '22023';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_ing)
  LOOP
    v_order := v_order + 1;
    IF NULLIF(btrim(COALESCE(v_item->>'ingredient_key', '')), '') IS NULL
       OR NULLIF(btrim(COALESCE(v_item->>'name_ar', '')), '') IS NULL
       OR NULLIF(btrim(COALESCE(v_item->>'name_en', '')), '') IS NULL THEN
      RAISE EXCEPTION 'ingredient_required' USING ERRCODE = '22023';
    END IF;
    IF COALESCE((v_item->>'quantity')::NUMERIC, 0) <= 0 THEN
      RAISE EXCEPTION 'invalid_quantity' USING ERRCODE = '22023';
    END IF;
    IF NULLIF(btrim(COALESCE(v_item->>'unit', '')), '') IS NULL THEN
      RAISE EXCEPTION 'invalid_unit' USING ERRCODE = '22023';
    END IF;
    IF v_item->>'ingredient_key' = ANY (v_keys) THEN
      RAISE EXCEPTION 'duplicate_ingredient' USING ERRCODE = '22023';
    END IF;
    v_keys := array_append(v_keys, v_item->>'ingredient_key');
  END LOOP;

  v_new_fp := (
    SELECT string_agg(
      COALESCE(i->>'ingredient_key', '') || ':' || COALESCE(i->>'quantity', '') || ':' || COALESCE(i->>'unit', ''),
      '|' ORDER BY i->>'ingredient_key'
    )
    FROM jsonb_array_elements(v_ing) i
  );

  IF v_id IS NOT NULL THEN
    SELECT * INTO v_existing FROM public.meals WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
    END IF;
    IF p_expected_updated_at IS NOT NULL AND v_existing.updated_at IS DISTINCT FROM p_expected_updated_at THEN
      RAISE EXCEPTION 'stale_update' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (SELECT 1 FROM public.meals m WHERE m.id <> v_id AND m.external_id = v_external) THEN
      RAISE EXCEPTION 'duplicate_external_id' USING ERRCODE = '23505';
    END IF;

    SELECT string_agg(i.ingredient_key || ':' || i.quantity::TEXT || ':' || i.unit, '|' ORDER BY i.ingredient_key)
    INTO v_old_fp
    FROM public.meal_ingredients i
    WHERE i.meal_id = v_id;

    IF v_old_fp IS DISTINCT FROM v_new_fp AND COALESCE((p_payload->>'allergens_confirmed')::BOOLEAN, false) IS NOT TRUE THEN
      RAISE EXCEPTION 'allergens_review_required' USING ERRCODE = '22023';
    END IF;

    IF v_old_fp IS DISTINCT FROM v_new_fp AND (v_review IS NULL OR v_review = 'approved') THEN
      v_review := 'edited';
    END IF;

    UPDATE public.meals SET
      external_id = v_external,
      name_ar = v_name_ar,
      name_en = v_name_en,
      description_ar = NULLIF(p_payload->>'description_ar', ''),
      description_en = NULLIF(p_payload->>'description_en', ''),
      meal_type = v_type::public.meal_type,
      suitable_goals = COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'suitable_goals', '[]'::jsonb))), '{}'::text[]),
      dietary_tags = COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'dietary_tags', '[]'::jsonb))), '{}'::text[]),
      allergens = COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'allergens', '[]'::jsonb))), '{}'::text[]),
      calories = (p_payload->>'calories')::NUMERIC,
      protein_g = (p_payload->>'protein_g')::NUMERIC,
      carbs_g = (p_payload->>'carbs_g')::NUMERIC,
      fat_g = (p_payload->>'fat_g')::NUMERIC,
      serving_size = (p_payload->>'serving_size')::NUMERIC,
      serving_unit = COALESCE(NULLIF(p_payload->>'serving_unit', ''), 'g'),
      yield_servings = COALESCE((p_payload->>'yield_servings')::NUMERIC, 1),
      preparation_steps_ar = COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'preparation_steps_ar', '[]'::jsonb))), '{}'::text[]),
      preparation_steps_en = COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'preparation_steps_en', '[]'::jsonb))), '{}'::text[]),
      preparation_time_minutes = NULLIF(p_payload->>'preparation_time_minutes', '')::INT,
      image_path = NULLIF(p_payload->>'image_path', ''),
      image_thumb_path = NULLIF(p_payload->>'image_thumb_path', ''),
      image_master_path = NULLIF(p_payload->>'image_master_path', ''),
      image_status = COALESCE(NULLIF(p_payload->>'image_status', ''), v_existing.image_status::TEXT)::public.meal_image_status,
      image_alt_ar = NULLIF(p_payload->>'image_alt_ar', ''),
      image_alt_en = NULLIF(p_payload->>'image_alt_en', ''),
      notes = NULLIF(p_payload->>'notes', ''),
      substitution_profile = COALESCE(p_payload->'substitution_profile', v_existing.substitution_profile),
      review_status = v_review,
      sort_order = COALESCE((p_payload->>'sort_order')::INT, v_existing.sort_order)
    WHERE id = v_id;
  ELSE
    IF EXISTS (SELECT 1 FROM public.meals m WHERE m.external_id = v_external) THEN
      RAISE EXCEPTION 'duplicate_external_id' USING ERRCODE = '23505';
    END IF;
    INSERT INTO public.meals (
      external_id, name_ar, name_en, description_ar, description_en, meal_type,
      suitable_goals, dietary_tags, allergens, calories, protein_g, carbs_g, fat_g,
      serving_size, serving_unit, yield_servings, preparation_steps_ar, preparation_steps_en,
      preparation_time_minutes, image_path, image_thumb_path, image_master_path, image_status,
      image_alt_ar, image_alt_en, notes, substitution_profile, review_status, status, is_active
    ) VALUES (
      v_external, v_name_ar, v_name_en,
      NULLIF(p_payload->>'description_ar', ''),
      NULLIF(p_payload->>'description_en', ''),
      v_type::public.meal_type,
      COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'suitable_goals', '[]'::jsonb))), '{}'::text[]),
      COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'dietary_tags', '[]'::jsonb))), '{}'::text[]),
      COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'allergens', '[]'::jsonb))), '{}'::text[]),
      (p_payload->>'calories')::NUMERIC,
      (p_payload->>'protein_g')::NUMERIC,
      (p_payload->>'carbs_g')::NUMERIC,
      (p_payload->>'fat_g')::NUMERIC,
      (p_payload->>'serving_size')::NUMERIC,
      COALESCE(NULLIF(p_payload->>'serving_unit', ''), 'g'),
      COALESCE((p_payload->>'yield_servings')::NUMERIC, 1),
      COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'preparation_steps_ar', '[]'::jsonb))), '{}'::text[]),
      COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'preparation_steps_en', '[]'::jsonb))), '{}'::text[]),
      NULLIF(p_payload->>'preparation_time_minutes', '')::INT,
      NULLIF(p_payload->>'image_path', ''),
      NULLIF(p_payload->>'image_thumb_path', ''),
      NULLIF(p_payload->>'image_master_path', ''),
      COALESCE(NULLIF(p_payload->>'image_status', ''), 'placeholder')::public.meal_image_status,
      NULLIF(p_payload->>'image_alt_ar', ''),
      NULLIF(p_payload->>'image_alt_en', ''),
      NULLIF(p_payload->>'notes', ''),
      COALESCE(p_payload->'substitution_profile', '{}'::jsonb),
      COALESCE(v_review, 'edited'),
      'pilot',
      true
    )
    RETURNING id INTO v_id;
  END IF;

  DELETE FROM public.meal_ingredients WHERE meal_id = v_id;
  v_order := 0;
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_ing)
  LOOP
    v_order := v_order + 1;
    INSERT INTO public.meal_ingredients (
      meal_id, ingredient_order, ingredient_key, name_en, name_ar, quantity, unit,
      kcal, protein_g, carbs_g, fat_g, source, source_query_url
    ) VALUES (
      v_id,
      v_order,
      btrim(v_item->>'ingredient_key'),
      btrim(v_item->>'name_en'),
      btrim(v_item->>'name_ar'),
      (v_item->>'quantity')::NUMERIC,
      btrim(v_item->>'unit'),
      NULLIF(v_item->>'kcal', '')::NUMERIC,
      NULLIF(v_item->>'protein_g', '')::NUMERIC,
      NULLIF(v_item->>'carbs_g', '')::NUMERIC,
      NULLIF(v_item->>'fat_g', '')::NUMERIC,
      NULLIF(v_item->>'source', ''),
      NULLIF(v_item->>'source_query_url', '')
    );
  END LOOP;

  RETURN public.admin_get_meal(v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_meal_status(
  p_id UUID,
  p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_existing public.meals%ROWTYPE;
BEGIN
  v_admin := public._require_admin();
  IF p_status NOT IN ('pilot', 'published', 'archived') THEN
    RAISE EXCEPTION 'invalid_meal_status' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_existing FROM public.meals WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
  IF p_status = 'published' AND (v_existing.name_ar IS NULL OR v_existing.external_id IS NULL) THEN
    RAISE EXCEPTION 'name_required' USING ERRCODE = '22023';
  END IF;

  UPDATE public.meals SET
    status = p_status::public.meal_library_status,
    is_active = (p_status <> 'archived')
  WHERE id = p_id;

  PERFORM public._write_audit_event(
    v_admin,
    v_admin,
    CASE p_status
      WHEN 'published' THEN 'meal_published'
      WHEN 'archived' THEN 'meal_archived'
      ELSE 'meal_status_changed'
    END,
    jsonb_build_object('meal_id', p_id, 'external_id', v_existing.external_id, 'status', p_status)
  );

  RETURN public.admin_get_meal(p_id);
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. Program templates (template ≠ client assignment)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_list_program_templates(
  p_query TEXT DEFAULT NULL,
  p_goal TEXT DEFAULT NULL,
  p_level TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 25,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  name_ar TEXT,
  name_en TEXT,
  goal public.program_goal,
  level public.program_level,
  duration_weeks INT,
  days_per_week INT,
  version INT,
  is_published BOOLEAN,
  archived_at TIMESTAMPTZ,
  assignment_count BIGINT,
  updated_at TIMESTAMPTZ,
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
  v_q TEXT := NULLIF(btrim(COALESCE(p_query, '')), '');
BEGIN
  PERFORM public._require_admin();

  RETURN QUERY
  SELECT
    t.id,
    t.slug,
    t.name_ar,
    t.name_en,
    t.goal,
    t.level,
    t.duration_weeks,
    t.days_per_week,
    t.version,
    t.is_published,
    t.archived_at,
    (
      SELECT count(*)::BIGINT
      FROM public.client_program_assignments a
      WHERE a.source_template_id = t.id AND a.status = 'active'
    ) AS assignment_count,
    t.updated_at,
    count(*) OVER ()::BIGINT
  FROM public.program_templates t
  WHERE (p_goal IS NULL OR t.goal::TEXT = p_goal)
    AND (p_level IS NULL OR t.level::TEXT = p_level)
    AND (
      p_status IS NULL
      OR (p_status = 'published' AND t.is_published AND t.archived_at IS NULL)
      OR (p_status = 'draft' AND NOT t.is_published AND t.archived_at IS NULL)
      OR (p_status = 'archived' AND t.archived_at IS NOT NULL)
    )
    AND (
      v_q IS NULL
      OR t.name_ar ILIKE '%' || v_q || '%'
      OR COALESCE(t.name_en, '') ILIKE '%' || v_q || '%'
      OR t.slug ILIKE '%' || v_q || '%'
    )
  ORDER BY t.updated_at DESC, t.name_ar
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_program_template(p_id UUID)
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
  SELECT to_jsonb(t) || jsonb_build_object(
    'assignment_count', (
      SELECT count(*) FROM public.client_program_assignments a
      WHERE a.source_template_id = t.id AND a.status = 'active'
    ),
    'versioning_complete', false,
    'weeks', COALESCE((
      SELECT jsonb_agg(
        to_jsonb(w) || jsonb_build_object(
          'days', COALESCE((
            SELECT jsonb_agg(
              to_jsonb(d) || jsonb_build_object(
                'exercises', COALESCE((
                  SELECT jsonb_agg(
                    to_jsonb(x) || jsonb_build_object(
                      'exercise_name_ar', e.name_ar,
                      'exercise_name_en', e.name_en,
                      'exercise_external_id', e.external_id
                    ) ORDER BY x.sort_order
                  )
                  FROM public.program_template_exercises x
                  JOIN public.exercises e ON e.id = x.exercise_id
                  WHERE x.day_id = d.id
                ), '[]'::jsonb)
              ) ORDER BY d.day_number
            )
            FROM public.program_template_days d
            WHERE d.week_id = w.id
          ), '[]'::jsonb)
        ) ORDER BY w.week_number
      )
      FROM public.program_template_weeks w
      WHERE w.template_id = t.id
    ), '[]'::jsonb)
  )
  INTO v_row
  FROM public.program_templates t
  WHERE t.id = p_id;

  IF v_row IS NULL THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_save_program_template(
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
  v_id UUID;
  v_existing public.program_templates%ROWTYPE;
  v_name_ar TEXT;
  v_slug TEXT;
  v_goal TEXT;
  v_level TEXT;
  v_week JSONB;
  v_day JSONB;
  v_ex JSONB;
  v_week_id UUID;
  v_day_id UUID;
  v_sort INT;
  v_was_published BOOLEAN := false;
BEGIN
  v_admin := public._require_admin();
  v_id := NULLIF(p_payload->>'id', '')::UUID;
  v_name_ar := NULLIF(btrim(COALESCE(p_payload->>'name_ar', '')), '');
  v_slug := NULLIF(btrim(COALESCE(p_payload->>'slug', '')), '');
  v_goal := NULLIF(p_payload->>'goal', '');
  v_level := NULLIF(p_payload->>'level', '');

  IF v_name_ar IS NULL THEN
    RAISE EXCEPTION 'name_required' USING ERRCODE = '22023';
  END IF;
  IF v_slug IS NULL THEN
    v_slug := lower(regexp_replace(v_name_ar, '[^a-zA-Z0-9\u0600-\u06FF]+', '-', 'g'));
    v_slug := trim(BOTH '-' FROM v_slug);
  END IF;
  IF v_slug IS NULL OR v_slug = '' THEN
    RAISE EXCEPTION 'slug_required' USING ERRCODE = '22023';
  END IF;
  IF v_goal IS NOT NULL AND v_goal NOT IN ('cut', 'bulk', 'fitness', 'recomp') THEN
    RAISE EXCEPTION 'invalid_goal' USING ERRCODE = '22023';
  END IF;
  IF v_level IS NOT NULL AND v_level NOT IN ('beginner', 'intermediate', 'advanced') THEN
    RAISE EXCEPTION 'invalid_level' USING ERRCODE = '22023';
  END IF;

  IF v_id IS NOT NULL THEN
    SELECT * INTO v_existing FROM public.program_templates WHERE id = v_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
    END IF;
    IF v_existing.archived_at IS NOT NULL THEN
      RAISE EXCEPTION 'template_archived' USING ERRCODE = '22023';
    END IF;
    IF p_expected_updated_at IS NOT NULL AND v_existing.updated_at IS DISTINCT FROM p_expected_updated_at THEN
      RAISE EXCEPTION 'stale_update' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (SELECT 1 FROM public.program_templates t WHERE t.id <> v_id AND t.slug = v_slug) THEN
      RAISE EXCEPTION 'duplicate_slug' USING ERRCODE = '23505';
    END IF;
    v_was_published := v_existing.is_published;

    UPDATE public.program_templates SET
      slug = v_slug,
      name_ar = v_name_ar,
      name_en = NULLIF(p_payload->>'name_en', ''),
      description_ar = NULLIF(p_payload->>'description_ar', ''),
      goal = v_goal::public.program_goal,
      level = v_level::public.program_level,
      duration_weeks = GREATEST(COALESCE((p_payload->>'duration_weeks')::INT, 12), 1),
      days_per_week = LEAST(GREATEST(COALESCE((p_payload->>'days_per_week')::INT, 4), 1), 7),
      version = CASE WHEN v_was_published THEN v_existing.version + 1 ELSE v_existing.version END
    WHERE id = v_id;
  ELSE
    IF EXISTS (SELECT 1 FROM public.program_templates t WHERE t.slug = v_slug) THEN
      RAISE EXCEPTION 'duplicate_slug' USING ERRCODE = '23505';
    END IF;
    INSERT INTO public.program_templates (
      slug, name_ar, name_en, description_ar, goal, level, duration_weeks, days_per_week, is_published, version
    ) VALUES (
      v_slug, v_name_ar, NULLIF(p_payload->>'name_en', ''), NULLIF(p_payload->>'description_ar', ''),
      v_goal::public.program_goal, v_level::public.program_level,
      GREATEST(COALESCE((p_payload->>'duration_weeks')::INT, 12), 1),
      LEAST(GREATEST(COALESCE((p_payload->>'days_per_week')::INT, 4), 1), 7),
      false,
      1
    )
    RETURNING id INTO v_id;
  END IF;

  DELETE FROM public.program_template_weeks WHERE template_id = v_id;

  FOR v_week IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'weeks', '[]'::jsonb))
  LOOP
    INSERT INTO public.program_template_weeks (template_id, week_number, title_ar, notes_ar)
    VALUES (
      v_id,
      GREATEST(COALESCE((v_week->>'week_number')::INT, 1), 1),
      NULLIF(v_week->>'title_ar', ''),
      NULLIF(v_week->>'notes_ar', '')
    )
    RETURNING id INTO v_week_id;

    FOR v_day IN SELECT * FROM jsonb_array_elements(COALESCE(v_week->'days', '[]'::jsonb))
    LOOP
      INSERT INTO public.program_template_days (
        week_id, day_number, day_type, title_ar, muscle_focus, estimated_minutes, estimated_calories
      ) VALUES (
        v_week_id,
        LEAST(GREATEST(COALESCE((v_day->>'day_number')::INT, 1), 1), 7),
        COALESCE(NULLIF(v_day->>'day_type', ''), 'workout')::public.program_day_type,
        COALESCE(NULLIF(btrim(COALESCE(v_day->>'title_ar', '')), ''), 'يوم تدريب'),
        NULLIF(v_day->>'muscle_focus', ''),
        NULLIF(v_day->>'estimated_minutes', '')::INT,
        NULLIF(v_day->>'estimated_calories', '')::INT
      )
      RETURNING id INTO v_day_id;

      v_sort := 0;
      FOR v_ex IN SELECT * FROM jsonb_array_elements(COALESCE(v_day->'exercises', '[]'::jsonb))
      LOOP
        IF NULLIF(v_ex->>'exercise_id', '') IS NULL THEN
          RAISE EXCEPTION 'exercise_required' USING ERRCODE = '22023';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM public.exercises e WHERE e.id = (v_ex->>'exercise_id')::UUID) THEN
          RAISE EXCEPTION 'exercise_required' USING ERRCODE = '22023';
        END IF;
        INSERT INTO public.program_template_exercises (
          day_id, exercise_id, sort_order, sets, reps_min, reps_max, reps_label,
          rest_seconds, suggested_weight_kg, notes_ar
        ) VALUES (
          v_day_id,
          (v_ex->>'exercise_id')::UUID,
          v_sort,
          GREATEST(COALESCE((v_ex->>'sets')::INT, 3), 1),
          NULLIF(v_ex->>'reps_min', '')::INT,
          NULLIF(v_ex->>'reps_max', '')::INT,
          NULLIF(v_ex->>'reps_label', ''),
          GREATEST(COALESCE((v_ex->>'rest_seconds')::INT, 60), 0),
          NULLIF(v_ex->>'suggested_weight_kg', '')::NUMERIC,
          NULLIF(v_ex->>'notes_ar', '')
        );
        v_sort := v_sort + 1;
      END LOOP;
    END LOOP;
  END LOOP;

  RETURN public.admin_get_program_template(v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_publish_program_template(p_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_existing public.program_templates%ROWTYPE;
BEGIN
  v_admin := public._require_admin();
  SELECT * INTO v_existing FROM public.program_templates WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_existing.archived_at IS NOT NULL THEN
    RAISE EXCEPTION 'template_archived' USING ERRCODE = '22023';
  END IF;
  IF NULLIF(btrim(v_existing.name_ar), '') IS NULL THEN
    RAISE EXCEPTION 'name_required' USING ERRCODE = '22023';
  END IF;

  UPDATE public.program_templates SET
    is_published = true,
    version = CASE WHEN v_existing.is_published THEN v_existing.version + 1 ELSE v_existing.version END
  WHERE id = p_id;

  PERFORM public._write_audit_event(
    v_admin,
    v_admin,
    'program_template_published',
    jsonb_build_object(
      'template_id', p_id,
      'version', (SELECT version FROM public.program_templates WHERE id = p_id),
      'versioning_complete', false
    )
  );

  RETURN public.admin_get_program_template(p_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_archive_program_template(p_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_count BIGINT;
BEGIN
  v_admin := public._require_admin();
  IF NOT EXISTS (SELECT 1 FROM public.program_templates WHERE id = p_id) THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.client_program_assignments
  WHERE source_template_id = p_id AND status = 'active';

  UPDATE public.program_templates SET
    archived_at = now(),
    is_published = false
  WHERE id = p_id;

  PERFORM public._write_audit_event(
    v_admin,
    v_admin,
    'program_template_archived',
    jsonb_build_object('template_id', p_id, 'active_assignments', v_count)
  );

  RETURN public.admin_get_program_template(p_id);
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. Discover CMS
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_list_discover_categories()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._require_admin();
  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(c) ORDER BY c.sort_order, c.name_ar)
    FROM public.discover_categories c
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_discover_content(
  p_query TEXT DEFAULT NULL,
  p_type TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 25,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  content_type public.discover_content_type,
  status public.discover_content_status,
  author_name TEXT,
  publish_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  featured BOOLEAN,
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
  v_q TEXT := NULLIF(btrim(COALESCE(p_query, '')), '');
BEGIN
  PERFORM public._require_admin();

  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.slug,
    c.content_type,
    c.status,
    c.author_name,
    c.publish_at,
    c.updated_at,
    c.featured,
    count(*) OVER ()::BIGINT
  FROM public.discover_content c
  WHERE (p_type IS NULL OR c.content_type::TEXT = p_type)
    AND (p_status IS NULL OR c.status::TEXT = p_status)
    AND (
      v_q IS NULL
      OR c.title ILIKE '%' || v_q || '%'
      OR c.slug ILIKE '%' || v_q || '%'
      OR COALESCE(c.author_name, '') ILIKE '%' || v_q || '%'
    )
  ORDER BY c.updated_at DESC, c.title
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_discover_content(p_id UUID)
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
  SELECT to_jsonb(c) INTO v_row FROM public.discover_content c WHERE c.id = p_id;
  IF v_row IS NULL THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_save_discover_content(
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
  v_id UUID;
  v_existing public.discover_content%ROWTYPE;
  v_title TEXT;
  v_slug TEXT;
  v_type TEXT;
  v_status TEXT;
BEGIN
  v_admin := public._require_admin();
  v_id := NULLIF(p_payload->>'id', '')::UUID;
  v_title := NULLIF(btrim(COALESCE(p_payload->>'title', '')), '');
  v_slug := NULLIF(btrim(COALESCE(p_payload->>'slug', '')), '');
  v_type := COALESCE(NULLIF(p_payload->>'content_type', ''), 'article');
  v_status := COALESCE(NULLIF(p_payload->>'status', ''), 'draft');

  IF v_title IS NULL THEN
    RAISE EXCEPTION 'title_required' USING ERRCODE = '22023';
  END IF;
  IF v_slug IS NULL THEN
    v_slug := lower(regexp_replace(v_title, '[^a-zA-Z0-9\u0600-\u06FF]+', '-', 'g'));
    v_slug := trim(BOTH '-' FROM v_slug);
  END IF;
  IF v_slug IS NULL OR v_slug = '' THEN
    RAISE EXCEPTION 'slug_required' USING ERRCODE = '22023';
  END IF;
  IF v_type NOT IN ('article', 'video', 'recipe', 'success_story', 'challenge', 'daily_tip', 'platform_update', 'promotional') THEN
    RAISE EXCEPTION 'invalid_content_type' USING ERRCODE = '22023';
  END IF;
  IF v_status NOT IN ('draft', 'scheduled', 'published', 'unpublished', 'archived') THEN
    RAISE EXCEPTION 'invalid_content_status' USING ERRCODE = '22023';
  END IF;
  IF v_status IN ('published', 'scheduled') AND NULLIF(btrim(COALESCE(p_payload->>'short_description', '')), '') IS NULL THEN
    RAISE EXCEPTION 'summary_required' USING ERRCODE = '22023';
  END IF;
  IF v_status = 'scheduled' AND NULLIF(p_payload->>'publish_at', '') IS NULL THEN
    RAISE EXCEPTION 'schedule_required' USING ERRCODE = '22023';
  END IF;

  IF v_id IS NOT NULL THEN
    SELECT * INTO v_existing FROM public.discover_content WHERE id = v_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
    END IF;
    IF p_expected_updated_at IS NOT NULL AND v_existing.updated_at IS DISTINCT FROM p_expected_updated_at THEN
      RAISE EXCEPTION 'stale_update' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (SELECT 1 FROM public.discover_content c WHERE c.id <> v_id AND c.slug = v_slug) THEN
      RAISE EXCEPTION 'duplicate_slug' USING ERRCODE = '23505';
    END IF;

    UPDATE public.discover_content SET
      content_type = v_type::public.discover_content_type,
      title = v_title,
      slug = v_slug,
      short_description = COALESCE(p_payload->>'short_description', ''),
      body = COALESCE(p_payload->>'body', ''),
      category_id = NULLIF(p_payload->>'category_id', '')::UUID,
      cover_image_path = NULLIF(p_payload->>'cover_image_path', ''),
      author_name = COALESCE(NULLIF(p_payload->>'author_name', ''), 'Coach Hakim'),
      publish_at = NULLIF(p_payload->>'publish_at', '')::TIMESTAMPTZ,
      featured = COALESCE((p_payload->>'featured')::BOOLEAN, false),
      access_level = COALESCE(NULLIF(p_payload->>'access_level', ''), 'free')::public.discover_access_level,
      status = v_status::public.discover_content_status,
      reading_time_minutes = NULLIF(p_payload->>'reading_time_minutes', '')::INT,
      video_duration_seconds = NULLIF(p_payload->>'video_duration_seconds', '')::INT,
      video_source = NULLIF(p_payload->>'video_source', ''),
      tags = COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'tags', '[]'::jsonb))), '{}'::text[]),
      sort_priority = COALESCE((p_payload->>'sort_priority')::INT, 0),
      type_payload = COALESCE(p_payload->'type_payload', '{}'::jsonb),
      updated_by = v_admin,
      published_by = CASE WHEN v_status = 'published' THEN v_admin ELSE published_by END
    WHERE id = v_id;
  ELSE
    IF EXISTS (SELECT 1 FROM public.discover_content c WHERE c.slug = v_slug) THEN
      RAISE EXCEPTION 'duplicate_slug' USING ERRCODE = '23505';
    END IF;
    INSERT INTO public.discover_content (
      content_type, title, slug, short_description, body, category_id, cover_image_path,
      author_name, publish_at, featured, access_level, status, reading_time_minutes,
      video_duration_seconds, video_source, tags, sort_priority, type_payload, created_by, updated_by
    ) VALUES (
      v_type::public.discover_content_type,
      v_title,
      v_slug,
      COALESCE(p_payload->>'short_description', ''),
      COALESCE(p_payload->>'body', ''),
      NULLIF(p_payload->>'category_id', '')::UUID,
      NULLIF(p_payload->>'cover_image_path', ''),
      COALESCE(NULLIF(p_payload->>'author_name', ''), 'Coach Hakim'),
      NULLIF(p_payload->>'publish_at', '')::TIMESTAMPTZ,
      COALESCE((p_payload->>'featured')::BOOLEAN, false),
      COALESCE(NULLIF(p_payload->>'access_level', ''), 'free')::public.discover_access_level,
      'draft'::public.discover_content_status,
      NULLIF(p_payload->>'reading_time_minutes', '')::INT,
      NULLIF(p_payload->>'video_duration_seconds', '')::INT,
      NULLIF(p_payload->>'video_source', ''),
      COALESCE(ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_payload->'tags', '[]'::jsonb))), '{}'::text[]),
      COALESCE((p_payload->>'sort_priority')::INT, 0),
      COALESCE(p_payload->'type_payload', '{}'::jsonb),
      v_admin,
      v_admin
    )
    RETURNING id INTO v_id;
  END IF;

  RETURN public.admin_get_discover_content(v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_discover_content_status(
  p_id UUID,
  p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_existing public.discover_content%ROWTYPE;
BEGIN
  v_admin := public._require_admin();
  IF p_status NOT IN ('draft', 'scheduled', 'published', 'unpublished', 'archived') THEN
    RAISE EXCEPTION 'invalid_content_status' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_existing FROM public.discover_content WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;
  IF p_status IN ('published', 'scheduled') AND (
    NULLIF(btrim(v_existing.title), '') IS NULL
    OR NULLIF(btrim(v_existing.short_description), '') IS NULL
  ) THEN
    RAISE EXCEPTION 'summary_required' USING ERRCODE = '22023';
  END IF;
  IF p_status = 'scheduled' AND v_existing.publish_at IS NULL THEN
    RAISE EXCEPTION 'schedule_required' USING ERRCODE = '22023';
  END IF;

  UPDATE public.discover_content SET
    status = p_status::public.discover_content_status,
    published_by = CASE WHEN p_status = 'published' THEN v_admin ELSE published_by END,
    publish_at = CASE
      WHEN p_status = 'published' THEN COALESCE(publish_at, now())
      ELSE publish_at
    END,
    updated_by = v_admin
  WHERE id = p_id;

  PERFORM public._write_audit_event(
    v_admin,
    v_admin,
    CASE p_status
      WHEN 'published' THEN 'discover_content_published'
      WHEN 'unpublished' THEN 'discover_content_unpublished'
      WHEN 'archived' THEN 'discover_content_archived'
      ELSE 'discover_content_status_changed'
    END,
    jsonb_build_object('content_id', p_id, 'slug', v_existing.slug, 'status', p_status)
  );

  RETURN public.admin_get_discover_content(p_id);
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. Grants
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.admin_exercise_filter_options() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_exercises(TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_exercise(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_save_exercise(JSONB, TIMESTAMPTZ) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_exercise_active(UUID, BOOLEAN) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_meals(TEXT, TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_meal(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_save_meal(JSONB, TIMESTAMPTZ) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_meal_status(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_program_templates(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_program_template(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_save_program_template(JSONB, TIMESTAMPTZ) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_publish_program_template(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_archive_program_template(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_discover_categories() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_discover_content(TEXT, TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_discover_content(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_save_discover_content(JSONB, TIMESTAMPTZ) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_discover_content_status(UUID, TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_exercise_filter_options() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_exercises(TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_exercise(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_save_exercise(JSONB, TIMESTAMPTZ) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_exercise_active(UUID, BOOLEAN) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_meals(TEXT, TEXT, TEXT, INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_meal(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_save_meal(JSONB, TIMESTAMPTZ) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_meal_status(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_program_templates(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_program_template(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_save_program_template(JSONB, TIMESTAMPTZ) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_publish_program_template(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_archive_program_template(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_discover_categories() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_discover_content(TEXT, TEXT, TEXT, INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_discover_content(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_save_discover_content(JSONB, TIMESTAMPTZ) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_discover_content_status(UUID, TEXT) TO authenticated, service_role;
