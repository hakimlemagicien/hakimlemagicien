-- Admin program template operations: metadata, clone/version, published immutability.
-- Template catalog rows remain distinct from client_program_assignments snapshots.

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
  v_metadata JSONB;
BEGIN
  v_admin := public._require_admin();
  v_id := NULLIF(p_payload->>'id', '')::UUID;
  v_name_ar := NULLIF(btrim(COALESCE(p_payload->>'name_ar', '')), '');
  v_slug := NULLIF(btrim(COALESCE(p_payload->>'slug', '')), '');
  v_goal := NULLIF(p_payload->>'goal', '');
  v_level := NULLIF(p_payload->>'level', '');
  v_metadata := COALESCE(p_payload->'metadata', '{}'::jsonb);

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
    IF v_existing.is_published AND p_payload ? 'weeks' THEN
      RAISE EXCEPTION 'published_template_immutable' USING ERRCODE = '22023';
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
      metadata = v_existing.metadata || v_metadata,
      version = CASE WHEN v_was_published THEN v_existing.version + 1 ELSE v_existing.version END
    WHERE id = v_id;
  ELSE
    IF EXISTS (SELECT 1 FROM public.program_templates t WHERE t.slug = v_slug) THEN
      RAISE EXCEPTION 'duplicate_slug' USING ERRCODE = '23505';
    END IF;
    INSERT INTO public.program_templates (
      slug, name_ar, name_en, description_ar, goal, level, duration_weeks, days_per_week, is_published, version, metadata
    ) VALUES (
      v_slug, v_name_ar, NULLIF(p_payload->>'name_en', ''), NULLIF(p_payload->>'description_ar', ''),
      v_goal::public.program_goal, v_level::public.program_level,
      GREATEST(COALESCE((p_payload->>'duration_weeks')::INT, 12), 1),
      LEAST(GREATEST(COALESCE((p_payload->>'days_per_week')::INT, 4), 1), 7),
      false,
      1,
      v_metadata
    )
    RETURNING id INTO v_id;
  END IF;

  IF p_payload ? 'weeks' THEN
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
  END IF;

  RETURN public.admin_get_program_template(v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_clone_program_template(
  p_id UUID,
  p_mode TEXT DEFAULT 'duplicate'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_src public.program_templates%ROWTYPE;
  v_new UUID;
  v_mode TEXT := lower(btrim(COALESCE(p_mode, 'duplicate')));
  v_slug TEXT;
  v_name TEXT;
  v_version INT;
  v_group TEXT;
  v_week RECORD;
  v_day RECORD;
  v_new_week UUID;
  v_new_day UUID;
BEGIN
  v_admin := public._require_admin();
  IF v_mode NOT IN ('duplicate', 'new_version') THEN
    RAISE EXCEPTION 'invalid_clone_mode' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_src FROM public.program_templates WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;

  v_group := COALESCE(v_src.metadata->>'version_group_id', v_src.id::text);
  IF v_mode = 'duplicate' THEN
    v_slug := v_src.slug || '-copy-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
    v_name := v_src.name_ar || ' — نسخة';
    v_version := 1;
  ELSE
    v_slug := v_src.slug || '-v' || (v_src.version + 1)::text || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
    v_name := v_src.name_ar;
    v_version := v_src.version + 1;
  END IF;

  INSERT INTO public.program_templates (
    slug, name_ar, name_en, description_ar, goal, level, duration_weeks, days_per_week,
    is_published, version, metadata
  ) VALUES (
    v_slug, v_name, v_src.name_en, v_src.description_ar, v_src.goal, v_src.level,
    v_src.duration_weeks, v_src.days_per_week, false, v_version,
    (v_src.metadata || jsonb_build_object(
      'version_group_id', v_group,
      'cloned_from', v_src.id,
      'clone_mode', v_mode
    ))
  )
  RETURNING id INTO v_new;

  IF v_mode = 'new_version' AND (v_src.metadata->>'version_group_id') IS NULL THEN
    UPDATE public.program_templates
    SET metadata = metadata || jsonb_build_object('version_group_id', v_group)
    WHERE id = v_src.id;
  END IF;

  FOR v_week IN
    SELECT * FROM public.program_template_weeks WHERE template_id = v_src.id ORDER BY week_number
  LOOP
    INSERT INTO public.program_template_weeks (template_id, week_number, title_ar, notes_ar)
    VALUES (v_new, v_week.week_number, v_week.title_ar, v_week.notes_ar)
    RETURNING id INTO v_new_week;

    FOR v_day IN
      SELECT * FROM public.program_template_days WHERE week_id = v_week.id ORDER BY day_number
    LOOP
      INSERT INTO public.program_template_days (
        week_id, day_number, day_type, title_ar, muscle_focus, estimated_minutes, estimated_calories
      ) VALUES (
        v_new_week, v_day.day_number, v_day.day_type, v_day.title_ar, v_day.muscle_focus,
        v_day.estimated_minutes, v_day.estimated_calories
      )
      RETURNING id INTO v_new_day;

      INSERT INTO public.program_template_exercises (
        day_id, exercise_id, sort_order, sets, reps_min, reps_max, reps_label,
        rest_seconds, suggested_weight_kg, notes_ar
      )
      SELECT
        v_new_day, exercise_id, sort_order, sets, reps_min, reps_max, reps_label,
        rest_seconds, suggested_weight_kg, notes_ar
      FROM public.program_template_exercises
      WHERE day_id = v_day.id
      ORDER BY sort_order;
    END LOOP;
  END LOOP;

  PERFORM public._write_audit_event(
    v_admin,
    v_admin,
    CASE WHEN v_mode = 'new_version' THEN 'program_template_versioned' ELSE 'program_template_duplicated' END,
    jsonb_build_object(
      'source_template_id', v_src.id,
      'new_template_id', v_new,
      'mode', v_mode,
      'version', v_version
    )
  );

  RETURN public.admin_get_program_template(v_new);
END;
$$;

DROP FUNCTION IF EXISTS public.admin_list_program_templates(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER);

CREATE FUNCTION public.admin_list_program_templates(
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
  training_location TEXT,
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
    NULLIF(upper(t.metadata->>'training_location'), '') AS training_location,
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

REVOKE ALL ON FUNCTION public.admin_clone_program_template(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_clone_program_template(UUID, TEXT) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.admin_list_program_templates(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_program_templates(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.admin_save_program_template(JSONB, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_save_program_template(JSONB, TIMESTAMPTZ) TO authenticated, service_role;

COMMENT ON FUNCTION public.admin_clone_program_template(UUID, TEXT)
  IS 'Copies a program template into an independent draft. new_version keeps version lineage without mutating assigned snapshots.';
