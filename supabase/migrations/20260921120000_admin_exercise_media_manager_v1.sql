-- Admin Exercise Media Manager V1
-- Draft/preview/publish is intentionally separate from exercise identity.

CREATE TABLE IF NOT EXISTS public.exercise_media_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version > 0),
  state TEXT NOT NULL CHECK (state IN ('draft', 'published', 'previous')),
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  UNIQUE (exercise_id, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS exercise_media_versions_one_draft_idx
  ON public.exercise_media_versions(exercise_id) WHERE state = 'draft';
CREATE UNIQUE INDEX IF NOT EXISTS exercise_media_versions_one_published_idx
  ON public.exercise_media_versions(exercise_id) WHERE state = 'published';
CREATE UNIQUE INDEX IF NOT EXISTS exercise_media_versions_one_previous_idx
  ON public.exercise_media_versions(exercise_id) WHERE state = 'previous';
CREATE INDEX IF NOT EXISTS exercise_media_versions_exercise_idx
  ON public.exercise_media_versions(exercise_id, version DESC);

ALTER TABLE public.exercise_media_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.exercise_media_versions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_media_versions TO service_role;

CREATE OR REPLACE FUNCTION public._exercise_media_admin_allowed(p_user UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p_user IS NOT NULL AND (
    public.has_role(p_user, 'admin') OR
    public.staff_has_permission(p_user, 'exercise.content_edit')
  );
$$;
REVOKE ALL ON FUNCTION public._exercise_media_admin_allowed(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public._exercise_media_admin_allowed(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public._exercise_media_admin_allowed(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public._exercise_media_snapshot(p_exercise public.exercises)
RETURNS JSONB LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT jsonb_build_object(
    'video_path', p_exercise.video_path,
    'instructions_video_path', p_exercise.instructions_video_path,
    'thumbnail_path', p_exercise.thumbnail_path,
    'instructional_images', COALESCE(p_exercise.metadata->'instructional_images', '[]'::jsonb),
    'anatomy_image_path', p_exercise.metadata->>'anatomy_image_path',
    'technical', COALESCE(p_exercise.metadata->'media_technical', '{}'::jsonb)
  );
$$;
REVOKE ALL ON FUNCTION public._exercise_media_snapshot(public.exercises)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._exercise_media_snapshot(public.exercises)
  TO service_role;

CREATE OR REPLACE FUNCTION public.admin_get_exercise_media_manager(p_exercise_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, storage AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_exercise public.exercises%ROWTYPE;
  v_current public.exercise_media_versions%ROWTYPE;
  v_draft public.exercise_media_versions%ROWTYPE;
  v_previous public.exercise_media_versions%ROWTYPE;
  v_snapshot JSONB;
  v_templates JSONB := '[]'::jsonb;
  v_launch_ids UUID[] := ARRAY[]::UUID[];
  v_launch_count INT := 0;
  v_ready_count INT := 0;
  v_missing_count INT := 0;
  v_placeholder_count INT := 0;
  v_active_bytes BIGINT := 0;
  v_current_bytes BIGINT := 0;
  v_readiness TEXT;
BEGIN
  IF NOT public._exercise_media_admin_allowed(v_actor) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_exercise FROM public.exercises WHERE id = p_exercise_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='P0002'; END IF;
  v_snapshot := public._exercise_media_snapshot(v_exercise);

  SELECT * INTO v_current FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id AND state='published';
  IF NOT FOUND THEN
    INSERT INTO public.exercise_media_versions(exercise_id,version,state,snapshot,created_by,published_at)
    VALUES(p_exercise_id,1,'published',v_snapshot,v_actor,now()) RETURNING * INTO v_current;
  END IF;
  SELECT * INTO v_draft FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id AND state='draft';
  SELECT * INTO v_previous FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id AND state='previous';

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object('id',templates.id,'name_ar',templates.name_ar,'version',NULL)
      ORDER BY templates.name_ar,templates.id
    ),
    '[]'::jsonb
  )
  INTO v_templates
  FROM (
    SELECT DISTINCT pt.id,pt.name_ar
    FROM public.program_template_exercises pte
    JOIN public.program_template_days ptd ON ptd.id=pte.day_id
    JOIN public.program_template_weeks ptw ON ptw.id=ptd.week_id
    JOIN public.program_templates pt ON pt.id=ptw.template_id
    WHERE pte.exercise_id=p_exercise_id
  ) AS templates;

  SELECT COALESCE(array_agg(DISTINCT pte.exercise_id),'{}'::uuid[]) INTO v_launch_ids
  FROM public.program_template_exercises pte
  JOIN public.program_template_days ptd ON ptd.id=pte.day_id
  JOIN public.program_template_weeks ptw ON ptw.id=ptd.week_id
  JOIN public.program_templates pt ON pt.id=ptw.template_id
  WHERE pt.is_published=true;
  SELECT count(*),
         count(*) FILTER(WHERE e.video_status='ready' AND e.thumbnail_path IS NOT NULL),
         count(*) FILTER(WHERE e.video_status='missing' OR e.video_path IS NULL),
         count(*) FILTER(WHERE e.video_status='placeholder')
  INTO v_launch_count,v_ready_count,v_missing_count,v_placeholder_count
  FROM public.exercises e WHERE e.id=ANY(v_launch_ids);

  SELECT COALESCE(sum((o.metadata->>'size')::bigint),0) INTO v_active_bytes
  FROM storage.objects o
  JOIN public.exercises e ON e.video_path=o.name
  WHERE o.bucket_id='exercise-media' AND e.id=ANY(v_launch_ids) AND e.video_status='ready';
  SELECT COALESCE((metadata->>'size')::bigint,0) INTO v_current_bytes
  FROM storage.objects WHERE bucket_id='exercise-media' AND name=v_exercise.video_path LIMIT 1;

  v_readiness := CASE
    WHEN v_exercise.video_status::text='placeholder' THEN 'PLACEHOLDER'
    WHEN v_exercise.video_status::text IN ('review_required','rejected') THEN 'NEEDS_REVIEW'
    WHEN v_exercise.video_path IS NULL OR v_exercise.video_status::text='missing' THEN 'VIDEO_MISSING'
    WHEN v_exercise.thumbnail_path IS NULL THEN 'THUMBNAIL_MISSING'
    WHEN jsonb_array_length(COALESCE(v_snapshot->'instructional_images','[]'::jsonb))=0 THEN 'IMAGE_MISSING'
    ELSE 'READY' END;

  RETURN jsonb_build_object(
    'exercise_id',v_exercise.id,'db_id',v_exercise.id,'external_id',v_exercise.external_id,'readiness',v_readiness,
    'current',jsonb_build_object('id',v_current.id,'version',v_current.version,'state',v_current.state,'snapshot',v_current.snapshot,'created_at',v_current.created_at,'published_at',v_current.published_at),
    'draft',CASE WHEN v_draft.id IS NULL THEN NULL ELSE jsonb_build_object('id',v_draft.id,'version',v_draft.version,'state',v_draft.state,'snapshot',v_draft.snapshot,'created_at',v_draft.created_at,'published_at',v_draft.published_at) END,
    'previous',CASE WHEN v_previous.id IS NULL THEN NULL ELSE jsonb_build_object('id',v_previous.id,'version',v_previous.version,'state',v_previous.state,'snapshot',v_previous.snapshot,'created_at',v_previous.created_at,'published_at',v_previous.published_at) END,
    'templates',v_templates,
    'launch',jsonb_build_object('is_launch_exercise',v_exercise.id=ANY(v_launch_ids),'exercise_count',v_launch_count,'ready_count',v_ready_count,'video_missing_count',v_missing_count,'placeholder_count',v_placeholder_count),
    'storage',jsonb_build_object('active_video_bytes',v_active_bytes,'current_exercise_video_bytes',v_current_bytes)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_stage_exercise_media(p_exercise_id UUID,p_asset TEXT,p_path TEXT,p_technical JSONB DEFAULT '{}')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_actor UUID:=auth.uid(); v_exercise public.exercises%ROWTYPE; v_draft public.exercise_media_versions%ROWTYPE; v_snapshot JSONB; v_version INT; v_images JSONB;
BEGIN
  IF NOT public._exercise_media_admin_allowed(v_actor) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  IF p_asset NOT IN ('exercise_video','instructions_video','thumbnail','stage_a','stage_b','stage_c','anatomy') THEN RAISE EXCEPTION 'invalid_asset' USING ERRCODE='22023'; END IF;
  SELECT * INTO v_exercise FROM public.exercises WHERE id=p_exercise_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  IF p_path IS NOT NULL AND (p_path ~ '[.]{2}' OR p_path !~ ('^exercises/'||v_exercise.external_id||'/')) THEN RAISE EXCEPTION 'invalid_media_path'; END IF;
  SELECT * INTO v_draft FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id AND state='draft' FOR UPDATE;
  IF NOT FOUND THEN
    SELECT COALESCE(max(version),0)+1 INTO v_version FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id;
    INSERT INTO public.exercise_media_versions(exercise_id,version,state,snapshot,created_by)
    VALUES(p_exercise_id,v_version,'draft',public._exercise_media_snapshot(v_exercise),v_actor) RETURNING * INTO v_draft;
  END IF;
  v_snapshot:=v_draft.snapshot;
  IF p_asset='exercise_video' THEN v_snapshot:=jsonb_set(v_snapshot,'{video_path}',COALESCE(to_jsonb(p_path),'null'::jsonb),true);
  ELSIF p_asset='instructions_video' THEN v_snapshot:=jsonb_set(v_snapshot,'{instructions_video_path}',COALESCE(to_jsonb(p_path),'null'::jsonb),true);
  ELSIF p_asset='thumbnail' THEN v_snapshot:=jsonb_set(v_snapshot,'{thumbnail_path}',COALESCE(to_jsonb(p_path),'null'::jsonb),true);
  ELSIF p_asset='anatomy' THEN v_snapshot:=jsonb_set(v_snapshot,'{anatomy_image_path}',COALESCE(to_jsonb(p_path),'null'::jsonb),true);
  ELSE
    v_images:=COALESCE(v_snapshot->'instructional_images','[null,null,null]'::jsonb);
    WHILE jsonb_array_length(v_images)<3 LOOP v_images:=v_images||'null'::jsonb; END LOOP;
    v_images:=jsonb_set(v_images,ARRAY[(CASE p_asset WHEN 'stage_a' THEN 0 WHEN 'stage_b' THEN 1 ELSE 2 END)::text],COALESCE(to_jsonb(p_path),'null'::jsonb),true);
    v_snapshot:=jsonb_set(v_snapshot,'{instructional_images}',v_images,true);
  END IF;
  v_snapshot:=jsonb_set(v_snapshot,ARRAY['technical',p_asset],COALESCE(p_technical,'{}'::jsonb),true);
  UPDATE public.exercise_media_versions SET snapshot=v_snapshot WHERE id=v_draft.id;
  PERFORM public._write_audit_event(v_actor,v_actor,'EXERCISE_MEDIA_DRAFT_CHANGED',jsonb_build_object('exercise_id',p_exercise_id,'external_id',v_exercise.external_id,'asset',p_asset));
  RETURN public.admin_get_exercise_media_manager(p_exercise_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_publish_exercise_media(p_exercise_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,storage AS $$
DECLARE v_actor UUID:=auth.uid(); v_exercise public.exercises%ROWTYPE; v_draft public.exercise_media_versions%ROWTYPE; v_current public.exercise_media_versions%ROWTYPE; v_missing INT;
BEGIN
  IF NOT public._exercise_media_admin_allowed(v_actor) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_exercise FROM public.exercises WHERE id=p_exercise_id FOR UPDATE;
  SELECT * INTO v_draft FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id AND state='draft' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'draft_missing'; END IF;
  SELECT count(*) INTO v_missing FROM jsonb_array_elements_text(jsonb_build_array(v_draft.snapshot->>'video_path',v_draft.snapshot->>'instructions_video_path',v_draft.snapshot->>'thumbnail_path')) p(path)
  WHERE p.path IS NOT NULL AND p.path LIKE '%/versions/%' AND NOT EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='exercise-media' AND o.name=p.path);
  v_missing := v_missing + (SELECT count(*) FROM jsonb_array_elements_text(COALESCE(v_draft.snapshot->'instructional_images','[]'::jsonb)) p(path)
    WHERE p.path IS NOT NULL AND p.path LIKE '%/versions/%' AND NOT EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='exercise-media' AND o.name=p.path));
  IF COALESCE(v_draft.snapshot->>'anatomy_image_path','') LIKE '%/versions/%' AND NOT EXISTS(
    SELECT 1 FROM storage.objects o WHERE o.bucket_id='exercise-media' AND o.name=v_draft.snapshot->>'anatomy_image_path'
  ) THEN v_missing:=v_missing+1; END IF;
  IF v_missing>0 THEN RAISE EXCEPTION 'draft_asset_missing'; END IF;
  SELECT * INTO v_current FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id AND state='published' FOR UPDATE;
  DELETE FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id AND state='previous';
  IF v_current.id IS NOT NULL THEN UPDATE public.exercise_media_versions SET state='previous' WHERE id=v_current.id; END IF;
  UPDATE public.exercise_media_versions SET state='published',published_at=now() WHERE id=v_draft.id;
  UPDATE public.exercises SET
    video_path=v_draft.snapshot->>'video_path', instructions_video_path=v_draft.snapshot->>'instructions_video_path', thumbnail_path=v_draft.snapshot->>'thumbnail_path',
    video_status=CASE WHEN NULLIF(v_draft.snapshot->>'video_path','') IS NULL THEN 'missing' ELSE 'ready' END::public.exercise_media_status,
    instructions_status=CASE WHEN NULLIF(v_draft.snapshot->>'instructions_video_path','') IS NULL THEN 'missing' ELSE 'ready' END::public.exercise_media_status,
    metadata=(metadata-'instructional_images'-'anatomy_image_path'-'media_technical')||jsonb_build_object('instructional_images',COALESCE(v_draft.snapshot->'instructional_images','[]'::jsonb),'anatomy_image_path',v_draft.snapshot->'anatomy_image_path','media_technical',COALESCE(v_draft.snapshot->'technical','{}'::jsonb))
  WHERE id=p_exercise_id AND external_id=v_exercise.external_id;
  PERFORM public._write_audit_event(v_actor,v_actor,'EXERCISE_MEDIA_PUBLISHED',jsonb_build_object('exercise_id',p_exercise_id,'external_id',v_exercise.external_id,'version',v_draft.version));
  RETURN public.admin_get_exercise_media_manager(p_exercise_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_restore_previous_exercise_media(p_exercise_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_actor UUID:=auth.uid(); v_previous public.exercise_media_versions%ROWTYPE; v_version INT;
BEGIN
  IF NOT public._exercise_media_admin_allowed(v_actor) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_previous FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id AND state='previous';
  IF NOT FOUND THEN RAISE EXCEPTION 'previous_missing'; END IF;
  DELETE FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id AND state='draft';
  SELECT max(version)+1 INTO v_version FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id;
  INSERT INTO public.exercise_media_versions(exercise_id,version,state,snapshot,created_by) VALUES(p_exercise_id,v_version,'draft',v_previous.snapshot,v_actor);
  RETURN public.admin_publish_exercise_media(p_exercise_id);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_exercise_media_manager(UUID) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_stage_exercise_media(UUID,TEXT,TEXT,JSONB) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_publish_exercise_media(UUID) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.admin_restore_previous_exercise_media(UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_get_exercise_media_manager(UUID),public.admin_stage_exercise_media(UUID,TEXT,TEXT,JSONB),public.admin_publish_exercise_media(UUID),public.admin_restore_previous_exercise_media(UUID) TO authenticated,service_role;

DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='exercise_media_staff_insert') THEN
    CREATE POLICY exercise_media_staff_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='exercise-media' AND public.staff_has_permission(auth.uid(),'exercise.content_edit'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='exercise_media_staff_update') THEN
    CREATE POLICY exercise_media_staff_update ON storage.objects FOR UPDATE TO authenticated
      USING(bucket_id='exercise-media' AND public.staff_has_permission(auth.uid(),'exercise.content_edit'))
      WITH CHECK(bucket_id='exercise-media' AND public.staff_has_permission(auth.uid(),'exercise.content_edit'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.admin_list_exercise_media_catalog(p_filters JSONB DEFAULT '{}')
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_actor UUID:=auth.uid(); v_limit INT:=LEAST(GREATEST(COALESCE((p_filters->>'limit')::int,25),1),50); v_offset INT:=GREATEST(COALESCE((p_filters->>'offset')::int,0),0); v_result JSONB;
BEGIN
  IF NOT public._exercise_media_admin_allowed(v_actor) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  WITH launch AS (
    SELECT DISTINCT pte.exercise_id FROM public.program_template_exercises pte
    JOIN public.program_template_days d ON d.id=pte.day_id JOIN public.program_template_weeks w ON w.id=d.week_id
    JOIN public.program_templates t ON t.id=w.template_id WHERE t.is_published=true
  ), classified AS (
    SELECT e.*,g.name_ar AS muscle_group_name_ar,(l.exercise_id IS NOT NULL) AS is_launch_exercise,
      CASE WHEN e.video_status::text='placeholder' THEN 'PLACEHOLDER'
        WHEN e.video_status::text IN ('review_required','rejected') THEN 'NEEDS_REVIEW'
        WHEN e.video_path IS NULL OR e.video_status::text='missing' THEN 'VIDEO_MISSING'
        WHEN e.thumbnail_path IS NULL THEN 'THUMBNAIL_MISSING'
        WHEN jsonb_array_length(COALESCE(e.metadata->'instructional_images','[]'::jsonb))=0 THEN 'IMAGE_MISSING'
        ELSE 'READY' END AS media_readiness
    FROM public.exercises e JOIN public.exercise_muscle_groups g ON g.id=e.muscle_group_id LEFT JOIN launch l ON l.exercise_id=e.id
  ), filtered AS (
    SELECT * FROM classified c WHERE
      (NULLIF(p_filters->>'query','') IS NULL OR c.name_ar ILIKE '%'||(p_filters->>'query')||'%' OR c.name_en ILIKE '%'||(p_filters->>'query')||'%' OR c.external_id ILIKE '%'||(p_filters->>'query')||'%') AND
      (NULLIF(p_filters->>'muscle','') IS NULL OR c.muscle_group_id::text=p_filters->>'muscle') AND
      (NULLIF(p_filters->>'equipment','') IS NULL OR c.equipment=p_filters->>'equipment') AND
      (NULLIF(p_filters->>'difficulty','') IS NULL OR c.difficulty::text=p_filters->>'difficulty') AND
      (NULLIF(p_filters->>'type','') IS NULL OR c.exercise_type::text=p_filters->>'type') AND
      (NULLIF(p_filters->>'active','') IS NULL OR c.is_active=(p_filters->>'active')::boolean) AND
      (NULLIF(p_filters->>'media_status','') IS NULL OR c.media_readiness=p_filters->>'media_status') AND
      (COALESCE((p_filters->>'launch_only')::boolean,false)=false OR c.is_launch_exercise)
  ), page AS (SELECT * FROM filtered ORDER BY updated_at DESC,sort_order,name_ar LIMIT v_limit OFFSET v_offset)
  SELECT jsonb_build_object('total_count',(SELECT count(*) FROM filtered),'rows',COALESCE(jsonb_agg(jsonb_build_object(
    'id',p.id,'external_id',p.external_id,'slug',p.slug,'name_ar',p.name_ar,'name_en',p.name_en,'equipment',p.equipment,
    'difficulty',p.difficulty,'exercise_type',p.exercise_type,'primary_muscle',p.primary_muscle,'is_active',p.is_active,
    'video_status',p.video_status,'instructions_status',p.instructions_status,'thumbnail_path',p.thumbnail_path,
    'muscle_group_name_ar',p.muscle_group_name_ar,'updated_at',p.updated_at,'v2_metadata_status',p.v2_metadata_status,
    'media_readiness',p.media_readiness,'is_launch_exercise',p.is_launch_exercise)),'[]'::jsonb)) INTO v_result FROM page p;
  RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_exercise_media_catalog(JSONB) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_list_exercise_media_catalog(JSONB) TO authenticated,service_role;

COMMENT ON TABLE public.exercise_media_versions IS 'Two-version media publication state; identity and training references remain on exercises.id.';
