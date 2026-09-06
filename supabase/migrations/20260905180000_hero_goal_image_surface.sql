-- Isolate workout goal-card CMS images from home hero images.

ALTER TABLE public.platform_hero_goal_images
  ADD COLUMN IF NOT EXISTS surface TEXT NOT NULL DEFAULT 'workout';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'platform_hero_goal_images_surface_check'
  ) THEN
    ALTER TABLE public.platform_hero_goal_images
      ADD CONSTRAINT platform_hero_goal_images_surface_check
      CHECK (surface IN ('home', 'workout'));
  END IF;
END $$;

UPDATE public.platform_hero_goal_images
SET surface = 'workout'
WHERE surface IS NULL OR btrim(surface) = '';

DROP INDEX IF EXISTS public.idx_platform_hero_goal_images_lookup;
CREATE INDEX IF NOT EXISTS idx_platform_hero_goal_images_lookup
  ON public.platform_hero_goal_images (surface, gender, goal_id, sort_order);

-- Drop legacy overloads so PostgREST binds the surface-aware signatures.
DROP FUNCTION IF EXISTS public.admin_save_hero_goal_image(TEXT, TEXT, TEXT, TEXT, TEXT, INT);
DROP FUNCTION IF EXISTS public.admin_clear_hero_goal_images(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public._hero_goal_images_payload()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_images JSONB := '{}'::jsonb;
  v_row RECORD;
  v_key TEXT;
  v_list JSONB;
BEGIN
  FOR v_row IN
    SELECT surface, gender, goal_id,
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'url', image_url,
          'fileName', CASE WHEN btrim(file_name) = '' THEN storage_path ELSE file_name END,
          'storagePath', storage_path,
          'sortOrder', sort_order,
          'surface', surface
        )
        ORDER BY sort_order ASC, updated_at ASC
      ) AS items
    FROM public.platform_hero_goal_images
    GROUP BY surface, gender, goal_id
  LOOP
    v_key := v_row.surface || ':' || v_row.gender || ':' || v_row.goal_id;
    v_list := COALESCE(v_row.items, '[]'::jsonb);
    v_images := v_images || jsonb_build_object(v_key, v_list);
  END LOOP;
  RETURN v_images;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_save_hero_goal_image(
  p_gender TEXT,
  p_goal_id TEXT,
  p_image_url TEXT,
  p_storage_path TEXT,
  p_file_name TEXT DEFAULT '',
  p_sort_order INT DEFAULT NULL,
  p_surface TEXT DEFAULT 'workout'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_gender TEXT := lower(btrim(COALESCE(p_gender, '')));
  v_goal TEXT := btrim(COALESCE(p_goal_id, ''));
  v_url TEXT := btrim(COALESCE(p_image_url, ''));
  v_path TEXT := btrim(COALESCE(p_storage_path, ''));
  v_name TEXT := btrim(COALESCE(p_file_name, ''));
  v_surface TEXT := lower(btrim(COALESCE(p_surface, 'workout')));
  v_order INT;
  v_id UUID;
BEGIN
  v_admin := public._require_admin();
  IF v_gender NOT IN ('male', 'female') THEN
    RAISE EXCEPTION 'invalid_gender' USING ERRCODE = '22023';
  END IF;
  IF v_surface NOT IN ('home', 'workout') THEN
    RAISE EXCEPTION 'invalid_surface' USING ERRCODE = '22023';
  END IF;
  IF v_goal = '' THEN
    RAISE EXCEPTION 'goal_required' USING ERRCODE = '22023';
  END IF;
  IF v_url = '' OR v_path = '' THEN
    RAISE EXCEPTION 'image_required' USING ERRCODE = '22023';
  END IF;
  IF v_name = '' THEN
    v_name := regexp_replace(v_path, '^.*/', '');
  END IF;

  IF p_sort_order IS NULL THEN
    SELECT COALESCE(MAX(sort_order), -1) + 1 INTO v_order
    FROM public.platform_hero_goal_images
    WHERE surface = v_surface AND gender = v_gender AND goal_id = v_goal;
  ELSE
    v_order := GREATEST(p_sort_order, 0);
  END IF;

  INSERT INTO public.platform_hero_goal_images (
    surface, gender, goal_id, sort_order, image_url, storage_path, file_name, updated_by
  ) VALUES (
    v_surface, v_gender, v_goal, v_order, v_url, v_path, v_name, v_admin
  )
  RETURNING id INTO v_id;

  PERFORM public._write_audit_event(
    v_admin,
    v_admin,
    'hero_goal_image_saved',
    jsonb_build_object(
      'id', v_id,
      'surface', v_surface,
      'gender', v_gender,
      'goal_id', v_goal,
      'path', v_path
    )
  );

  RETURN jsonb_build_object(
    'id', v_id,
    'surface', v_surface,
    'gender', v_gender,
    'goal_id', v_goal,
    'url', v_url,
    'fileName', v_name,
    'storagePath', v_path,
    'sortOrder', v_order
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_clear_hero_goal_images(
  p_gender TEXT,
  p_goal_id TEXT,
  p_surface TEXT DEFAULT 'workout'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_gender TEXT := lower(btrim(COALESCE(p_gender, '')));
  v_goal TEXT := btrim(COALESCE(p_goal_id, ''));
  v_surface TEXT := lower(btrim(COALESCE(p_surface, 'workout')));
  v_paths TEXT[];
  v_count INT := 0;
BEGIN
  v_admin := public._require_admin();
  IF v_gender NOT IN ('male', 'female') THEN
    RAISE EXCEPTION 'invalid_gender' USING ERRCODE = '22023';
  END IF;
  IF v_surface NOT IN ('home', 'workout') THEN
    RAISE EXCEPTION 'invalid_surface' USING ERRCODE = '22023';
  END IF;
  IF v_goal = '' THEN
    RAISE EXCEPTION 'goal_required' USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(array_agg(storage_path), ARRAY[]::TEXT[]), COUNT(*)
  INTO v_paths, v_count
  FROM public.platform_hero_goal_images
  WHERE surface = v_surface AND gender = v_gender AND goal_id = v_goal;

  DELETE FROM public.platform_hero_goal_images
  WHERE surface = v_surface AND gender = v_gender AND goal_id = v_goal;

  PERFORM public._write_audit_event(
    v_admin,
    v_admin,
    'hero_goal_images_cleared',
    jsonb_build_object(
      'surface', v_surface,
      'gender', v_gender,
      'goal_id', v_goal,
      'count', v_count
    )
  );

  RETURN jsonb_build_object(
    'surface', v_surface,
    'gender', v_gender,
    'goal_id', v_goal,
    'deleted', v_count,
    'storagePaths', COALESCE(v_paths, ARRAY[]::TEXT[])
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_save_hero_goal_image(TEXT, TEXT, TEXT, TEXT, TEXT, INT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_clear_hero_goal_images(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_save_hero_goal_image(TEXT, TEXT, TEXT, TEXT, TEXT, INT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_clear_hero_goal_images(TEXT, TEXT, TEXT) TO authenticated, service_role;
