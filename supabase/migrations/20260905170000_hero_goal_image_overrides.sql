-- Hero goal card images: admin upload/replace/delete; client reads live overrides.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hero-goal-covers',
  'hero-goal-covers',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "hero_goal_covers_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "hero_goal_covers_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "hero_goal_covers_admin_delete" ON storage.objects;
DROP POLICY IF EXISTS "hero_goal_covers_public_select" ON storage.objects;

CREATE POLICY "hero_goal_covers_admin_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'hero-goal-covers'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "hero_goal_covers_admin_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'hero-goal-covers'
    AND public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    bucket_id = 'hero-goal-covers'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "hero_goal_covers_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'hero-goal-covers'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "hero_goal_covers_public_select"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'hero-goal-covers');

CREATE TABLE IF NOT EXISTS public.platform_hero_goal_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  goal_id TEXT NOT NULL CHECK (char_length(btrim(goal_id)) > 0 AND char_length(goal_id) <= 64),
  sort_order INT NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL CHECK (char_length(btrim(image_url)) > 0),
  storage_path TEXT NOT NULL CHECK (char_length(btrim(storage_path)) > 0),
  file_name TEXT NOT NULL DEFAULT '' CHECK (char_length(file_name) <= 255),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_platform_hero_goal_images_lookup
  ON public.platform_hero_goal_images (gender, goal_id, sort_order);

ALTER TABLE public.platform_hero_goal_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hero_goal_images_admin_all" ON public.platform_hero_goal_images;
CREATE POLICY "hero_goal_images_admin_all"
  ON public.platform_hero_goal_images
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "hero_goal_images_auth_select" ON public.platform_hero_goal_images;
CREATE POLICY "hero_goal_images_auth_select"
  ON public.platform_hero_goal_images
  FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT ON public.platform_hero_goal_images TO authenticated;
GRANT ALL ON public.platform_hero_goal_images TO authenticated;

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
    SELECT gender, goal_id,
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'url', image_url,
          'fileName', CASE WHEN btrim(file_name) = '' THEN storage_path ELSE file_name END,
          'storagePath', storage_path,
          'sortOrder', sort_order
        )
        ORDER BY sort_order ASC, updated_at ASC
      ) AS items
    FROM public.platform_hero_goal_images
    GROUP BY gender, goal_id
  LOOP
    v_key := v_row.gender || ':' || v_row.goal_id;
    v_list := COALESCE(v_row.items, '[]'::jsonb);
    v_images := v_images || jsonb_build_object(v_key, v_list);
  END LOOP;
  RETURN v_images;
END;
$$;

CREATE OR REPLACE FUNCTION public.client_get_hero_goal_settings()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_framing JSONB := '{}'::jsonb;
  v_card_themes JSONB := '{}'::jsonb;
  v_row RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  FOR v_row IN
    SELECT setting_kind, gender, goal_id, asset_file_name, payload
    FROM public.platform_hero_goal_settings
  LOOP
    IF v_row.setting_kind = 'framing' THEN
      v_framing := v_framing || jsonb_build_object(
        public._hero_goal_framing_key(v_row.gender, v_row.goal_id, v_row.asset_file_name),
        v_row.payload
      );
    ELSE
      v_card_themes := v_card_themes || jsonb_build_object(
        public._hero_goal_card_theme_key(v_row.gender, v_row.goal_id),
        v_row.payload
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'framing', v_framing,
    'card_themes', v_card_themes,
    'images', public._hero_goal_images_payload()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_save_hero_goal_image(
  p_gender TEXT,
  p_goal_id TEXT,
  p_image_url TEXT,
  p_storage_path TEXT,
  p_file_name TEXT DEFAULT '',
  p_sort_order INT DEFAULT NULL
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
  v_order INT;
  v_id UUID;
BEGIN
  v_admin := public._require_admin();
  IF v_gender NOT IN ('male', 'female') THEN
    RAISE EXCEPTION 'invalid_gender' USING ERRCODE = '22023';
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
    WHERE gender = v_gender AND goal_id = v_goal;
  ELSE
    v_order := GREATEST(p_sort_order, 0);
  END IF;

  INSERT INTO public.platform_hero_goal_images (
    gender, goal_id, sort_order, image_url, storage_path, file_name, updated_by
  ) VALUES (
    v_gender, v_goal, v_order, v_url, v_path, v_name, v_admin
  )
  RETURNING id INTO v_id;

  PERFORM public._write_audit_event(
    v_admin,
    v_admin,
    'hero_goal_image_saved',
    jsonb_build_object('id', v_id, 'gender', v_gender, 'goal_id', v_goal, 'path', v_path)
  );

  RETURN jsonb_build_object(
    'id', v_id,
    'gender', v_gender,
    'goal_id', v_goal,
    'url', v_url,
    'fileName', v_name,
    'storagePath', v_path,
    'sortOrder', v_order
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_hero_goal_image(p_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_existing public.platform_hero_goal_images%ROWTYPE;
BEGIN
  v_admin := public._require_admin();
  SELECT * INTO v_existing FROM public.platform_hero_goal_images WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM public.platform_hero_goal_images WHERE id = p_id;

  PERFORM public._write_audit_event(
    v_admin,
    v_admin,
    'hero_goal_image_deleted',
    jsonb_build_object(
      'id', p_id,
      'gender', v_existing.gender,
      'goal_id', v_existing.goal_id,
      'path', v_existing.storage_path
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'id', p_id,
    'storagePath', v_existing.storage_path
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_clear_hero_goal_images(
  p_gender TEXT,
  p_goal_id TEXT
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
  v_paths TEXT[];
  v_count INT;
BEGIN
  v_admin := public._require_admin();
  IF v_gender NOT IN ('male', 'female') THEN
    RAISE EXCEPTION 'invalid_gender' USING ERRCODE = '22023';
  END IF;
  IF v_goal = '' THEN
    RAISE EXCEPTION 'goal_required' USING ERRCODE = '22023';
  END IF;

  SELECT array_agg(storage_path), count(*)::INT
  INTO v_paths, v_count
  FROM public.platform_hero_goal_images
  WHERE gender = v_gender AND goal_id = v_goal;

  DELETE FROM public.platform_hero_goal_images
  WHERE gender = v_gender AND goal_id = v_goal;

  PERFORM public._write_audit_event(
    v_admin,
    v_admin,
    'hero_goal_images_cleared',
    jsonb_build_object('gender', v_gender, 'goal_id', v_goal, 'count', COALESCE(v_count, 0))
  );

  RETURN jsonb_build_object(
    'ok', true,
    'count', COALESCE(v_count, 0),
    'storagePaths', COALESCE(to_jsonb(v_paths), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_save_hero_goal_image(TEXT, TEXT, TEXT, TEXT, TEXT, INT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_hero_goal_image(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_clear_hero_goal_images(TEXT, TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_save_hero_goal_image(TEXT, TEXT, TEXT, TEXT, TEXT, INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_hero_goal_image(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_clear_hero_goal_images(TEXT, TEXT) TO authenticated, service_role;
