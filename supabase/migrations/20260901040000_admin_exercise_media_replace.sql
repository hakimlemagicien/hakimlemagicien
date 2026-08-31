-- Admin exercise media replace: updates media columns only. Never mutates identity,
-- Core 100, Matrix, or assignment snapshots.

CREATE OR REPLACE FUNCTION public.admin_replace_exercise_media(
  p_id UUID,
  p_asset TEXT,
  p_path TEXT,
  p_expected_updated_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID := auth.uid();
  v_existing public.exercises%ROWTYPE;
  v_path TEXT;
  v_event TEXT;
  v_before JSONB;
  v_after JSONB;
BEGIN
  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF NOT (public.has_role(v_admin, 'admin') OR public.staff_has_permission(v_admin, 'exercise.content_edit')) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_asset NOT IN ('exercise_video', 'instructions_video', 'thumbnail') THEN
    RAISE EXCEPTION 'invalid_media_asset' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_existing FROM public.exercises WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;

  IF p_expected_updated_at IS NOT NULL AND v_existing.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RAISE EXCEPTION 'stale_update' USING ERRCODE = '22023';
  END IF;

  v_path := btrim(COALESCE(p_path, ''));
  IF v_path = '' OR v_path ~* '[.]{2}|^/|exercise-media/' THEN
    RAISE EXCEPTION 'invalid_media_path' USING ERRCODE = '22023';
  END IF;

  IF p_asset = 'exercise_video' AND v_path IS DISTINCT FROM ('exercises/' || v_existing.external_id || '/exercise.mp4') THEN
    RAISE EXCEPTION 'invalid_media_path' USING ERRCODE = '22023';
  END IF;
  IF p_asset = 'instructions_video' AND v_path IS DISTINCT FROM ('exercises/' || v_existing.external_id || '/instructions.mp4') THEN
    RAISE EXCEPTION 'invalid_media_path' USING ERRCODE = '22023';
  END IF;
  IF p_asset = 'thumbnail' AND v_path !~ ('^exercises/' || v_existing.external_id || '/thumbnail\.(webp|jpg|png)$') THEN
    RAISE EXCEPTION 'invalid_media_path' USING ERRCODE = '22023';
  END IF;

  v_before := jsonb_build_object(
    'video_path', v_existing.video_path,
    'video_status', v_existing.video_status,
    'instructions_video_path', v_existing.instructions_video_path,
    'instructions_status', v_existing.instructions_status,
    'thumbnail_path', v_existing.thumbnail_path
  );

  IF p_asset = 'exercise_video' THEN
    UPDATE public.exercises
    SET video_path = v_path,
        video_status = 'ready'::public.exercise_media_status
    WHERE id = p_id
      AND external_id = v_existing.external_id
      AND name_ar = v_existing.name_ar
      AND name_en = v_existing.name_en;
    v_event := 'EXERCISE_VIDEO_REPLACED';
  ELSIF p_asset = 'instructions_video' THEN
    UPDATE public.exercises
    SET instructions_video_path = v_path,
        instructions_status = 'ready'::public.exercise_media_status
    WHERE id = p_id
      AND external_id = v_existing.external_id
      AND name_ar = v_existing.name_ar
      AND name_en = v_existing.name_en;
    v_event := 'EXERCISE_INSTRUCTIONS_VIDEO_REPLACED';
  ELSE
    UPDATE public.exercises
    SET thumbnail_path = v_path
    WHERE id = p_id
      AND external_id = v_existing.external_id
      AND name_ar = v_existing.name_ar
      AND name_en = v_existing.name_en;
    v_event := 'EXERCISE_THUMBNAIL_REPLACED';
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'identity_guard_failed' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_existing FROM public.exercises WHERE id = p_id;
  v_after := jsonb_build_object(
    'video_path', v_existing.video_path,
    'video_status', v_existing.video_status,
    'instructions_video_path', v_existing.instructions_video_path,
    'instructions_status', v_existing.instructions_status,
    'thumbnail_path', v_existing.thumbnail_path
  );

  PERFORM public._write_audit_event(
    v_admin,
    v_admin,
    v_event,
    jsonb_build_object(
      'exercise_id', p_id,
      'external_id', v_existing.external_id,
      'asset', p_asset,
      'before', v_before,
      'after', v_after
    )
  );

  RETURN public.admin_get_exercise(p_id);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_replace_exercise_media(UUID, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_replace_exercise_media(UUID, TEXT, TEXT, TIMESTAMPTZ) TO authenticated, service_role;

COMMENT ON FUNCTION public.admin_replace_exercise_media(UUID, TEXT, TEXT, TIMESTAMPTZ) IS
  'Media-only update. Never changes external_id, names, Matrix, or assignments.';
