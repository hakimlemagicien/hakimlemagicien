-- Admin Exercise Library: published-template/gender filters, variant-safe media,
-- and server-side external-id suggestions. Existing exercise identity is unchanged.

ALTER TABLE public.exercise_media_versions
  ADD COLUMN IF NOT EXISTS media_variant TEXT NOT NULL DEFAULT 'STANDARD';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.exercise_media_versions'::regclass
      AND conname = 'exercise_media_versions_media_variant_check'
  ) THEN
    ALTER TABLE public.exercise_media_versions
      ADD CONSTRAINT exercise_media_versions_media_variant_check
      CHECK (media_variant IN ('STANDARD', 'FEMALE'));
  END IF;
END $$;

DROP INDEX IF EXISTS public.exercise_media_versions_one_draft_idx;
DROP INDEX IF EXISTS public.exercise_media_versions_one_published_idx;
DROP INDEX IF EXISTS public.exercise_media_versions_one_previous_idx;
CREATE UNIQUE INDEX exercise_media_versions_one_draft_idx
  ON public.exercise_media_versions(exercise_id, media_variant) WHERE state = 'draft';
CREATE UNIQUE INDEX exercise_media_versions_one_published_idx
  ON public.exercise_media_versions(exercise_id, media_variant) WHERE state = 'published';
CREATE UNIQUE INDEX exercise_media_versions_one_previous_idx
  ON public.exercise_media_versions(exercise_id, media_variant) WHERE state = 'previous';

CREATE OR REPLACE FUNCTION public._exercise_media_variant_snapshot(
  p_exercise public.exercises,
  p_variant TEXT
)
RETURNS JSONB LANGUAGE plpgsql STABLE SET search_path = public AS $$
DECLARE v_variant TEXT := upper(COALESCE(NULLIF(p_variant, ''), 'STANDARD'));
BEGIN
  IF v_variant NOT IN ('STANDARD', 'FEMALE') THEN
    RAISE EXCEPTION 'invalid_media_variant' USING ERRCODE='22023';
  END IF;
  IF v_variant = 'STANDARD' THEN
    RETURN public._exercise_media_snapshot(p_exercise);
  END IF;
  RETURN jsonb_build_object(
    'video_path', p_exercise.metadata#>>'{media_variants,FEMALE,VIDEO,path}',
    'instructions_video_path', NULL,
    'thumbnail_path', p_exercise.metadata#>>'{media_variants,FEMALE,IMAGE,path}',
    'instructional_images', '[]'::jsonb,
    'anatomy_image_path', NULL,
    'technical', COALESCE(p_exercise.metadata#>'{media_variant_technical,FEMALE}', '{}'::jsonb)
  );
END;
$$;
REVOKE ALL ON FUNCTION public._exercise_media_variant_snapshot(public.exercises,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public._exercise_media_variant_snapshot(public.exercises,TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_get_exercise_media_manager_v2(p_exercise_id UUID,p_variant TEXT DEFAULT 'STANDARD')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, storage AS $$
DECLARE
  v_actor UUID := auth.uid(); v_variant TEXT := upper(COALESCE(NULLIF(p_variant,''),'STANDARD'));
  v_exercise public.exercises%ROWTYPE; v_current public.exercise_media_versions%ROWTYPE;
  v_draft public.exercise_media_versions%ROWTYPE; v_previous public.exercise_media_versions%ROWTYPE;
  v_snapshot JSONB; v_templates JSONB := '[]'::jsonb; v_launch_ids UUID[] := ARRAY[]::UUID[];
  v_launch_count INT := 0; v_ready_count INT := 0; v_missing_count INT := 0; v_placeholder_count INT := 0;
  v_active_bytes BIGINT := 0; v_current_bytes BIGINT := 0; v_readiness TEXT;
BEGIN
  IF NOT public._exercise_media_admin_allowed(v_actor) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  IF v_variant NOT IN ('STANDARD','FEMALE') THEN RAISE EXCEPTION 'invalid_media_variant' USING ERRCODE='22023'; END IF;
  SELECT * INTO v_exercise FROM public.exercises WHERE id=p_exercise_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='P0002'; END IF;
  v_snapshot := public._exercise_media_variant_snapshot(v_exercise,v_variant);
  SELECT * INTO v_current FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id AND media_variant=v_variant AND state='published';
  IF NOT FOUND THEN
    SELECT COALESCE(max(version),0)+1 INTO v_launch_count FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id;
    INSERT INTO public.exercise_media_versions(exercise_id,version,state,snapshot,created_by,published_at,media_variant)
    VALUES(p_exercise_id,v_launch_count,'published',v_snapshot,v_actor,now(),v_variant) RETURNING * INTO v_current;
  END IF;
  SELECT * INTO v_draft FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id AND media_variant=v_variant AND state='draft';
  SELECT * INTO v_previous FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id AND media_variant=v_variant AND state='previous';

  SELECT COALESCE(jsonb_agg(jsonb_build_object('id',x.id,'name_ar',x.name_ar,'version',x.version) ORDER BY x.name_ar,x.id),'[]'::jsonb)
    INTO v_templates FROM (
      SELECT DISTINCT pt.id,pt.name_ar,pt.version FROM public.program_template_exercises pte
      JOIN public.program_template_days d ON d.id=pte.day_id JOIN public.program_template_weeks w ON w.id=d.week_id
      JOIN public.program_templates pt ON pt.id=w.template_id
      WHERE pte.exercise_id=p_exercise_id AND pt.is_published=true AND
        (CASE WHEN pt.metadata#>>'{template_contract,media_preference,preferred_media_variant}'='FEMALE' THEN 'FEMALE' ELSE 'STANDARD' END)=v_variant
    ) x;
  SELECT COALESCE(array_agg(DISTINCT pte.exercise_id),'{}'::uuid[]) INTO v_launch_ids
  FROM public.program_template_exercises pte JOIN public.program_template_days d ON d.id=pte.day_id
  JOIN public.program_template_weeks w ON w.id=d.week_id JOIN public.program_templates pt ON pt.id=w.template_id
  WHERE pt.is_published=true AND (CASE WHEN pt.metadata#>>'{template_contract,media_preference,preferred_media_variant}'='FEMALE' THEN 'FEMALE' ELSE 'STANDARD' END)=v_variant;

  SELECT count(*),count(*) FILTER(WHERE NULLIF((public._exercise_media_variant_snapshot(e,v_variant)->>'video_path'),'') IS NOT NULL),
    count(*) FILTER(WHERE NULLIF((public._exercise_media_variant_snapshot(e,v_variant)->>'video_path'),'') IS NULL),0
  INTO v_launch_count,v_ready_count,v_missing_count,v_placeholder_count FROM public.exercises e WHERE e.id=ANY(v_launch_ids);
  SELECT COALESCE(sum((o.metadata->>'size')::bigint),0) INTO v_active_bytes FROM storage.objects o
  JOIN public.exercises e ON o.name=public._exercise_media_variant_snapshot(e,v_variant)->>'video_path'
  WHERE o.bucket_id='exercise-media' AND e.id=ANY(v_launch_ids);
  SELECT COALESCE((metadata->>'size')::bigint,0) INTO v_current_bytes FROM storage.objects
  WHERE bucket_id='exercise-media' AND name=v_snapshot->>'video_path' LIMIT 1;
  v_readiness := CASE WHEN NULLIF(v_snapshot->>'video_path','') IS NULL THEN 'VIDEO_MISSING'
    WHEN NULLIF(v_snapshot->>'thumbnail_path','') IS NULL THEN 'THUMBNAIL_MISSING'
    WHEN v_variant='STANDARD' AND jsonb_array_length(COALESCE(v_snapshot->'instructional_images','[]'::jsonb))=0 THEN 'IMAGE_MISSING'
    ELSE 'READY' END;
  RETURN jsonb_build_object('exercise_id',v_exercise.id,'db_id',v_exercise.id,'external_id',v_exercise.external_id,
    'media_variant',v_variant,'readiness',v_readiness,
    'current',jsonb_build_object('id',v_current.id,'version',v_current.version,'state',v_current.state,'snapshot',v_current.snapshot,'created_at',v_current.created_at,'published_at',v_current.published_at),
    'draft',CASE WHEN v_draft.id IS NULL THEN NULL ELSE jsonb_build_object('id',v_draft.id,'version',v_draft.version,'state',v_draft.state,'snapshot',v_draft.snapshot,'created_at',v_draft.created_at,'published_at',v_draft.published_at) END,
    'previous',CASE WHEN v_previous.id IS NULL THEN NULL ELSE jsonb_build_object('id',v_previous.id,'version',v_previous.version,'state',v_previous.state,'snapshot',v_previous.snapshot,'created_at',v_previous.created_at,'published_at',v_previous.published_at) END,
    'templates',v_templates,'launch',jsonb_build_object('is_launch_exercise',v_exercise.id=ANY(v_launch_ids),'exercise_count',v_launch_count,'ready_count',v_ready_count,'video_missing_count',v_missing_count,'placeholder_count',v_placeholder_count),
    'storage',jsonb_build_object('active_video_bytes',v_active_bytes,'current_exercise_video_bytes',v_current_bytes));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_stage_exercise_media_v2(p_exercise_id UUID,p_variant TEXT,p_asset TEXT,p_path TEXT,p_technical JSONB DEFAULT '{}')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_actor UUID:=auth.uid(); v_variant TEXT:=upper(COALESCE(NULLIF(p_variant,''),'STANDARD')); v_exercise public.exercises%ROWTYPE;
  v_draft public.exercise_media_versions%ROWTYPE; v_snapshot JSONB; v_version INT; v_images JSONB;
BEGIN
  IF NOT public._exercise_media_admin_allowed(v_actor) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  IF v_variant NOT IN ('STANDARD','FEMALE') THEN RAISE EXCEPTION 'invalid_media_variant' USING ERRCODE='22023'; END IF;
  IF p_asset NOT IN ('exercise_video','instructions_video','thumbnail','stage_a','stage_b','stage_c','anatomy') THEN RAISE EXCEPTION 'invalid_asset' USING ERRCODE='22023'; END IF;
  IF v_variant='FEMALE' AND p_asset NOT IN ('exercise_video','thumbnail') THEN RAISE EXCEPTION 'variant_asset_not_supported' USING ERRCODE='22023'; END IF;
  SELECT * INTO v_exercise FROM public.exercises WHERE id=p_exercise_id FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  IF p_path IS NOT NULL AND (p_path ~ '[.]{2}' OR p_path !~ ('^exercises/'||v_exercise.external_id||'/'||(CASE WHEN v_variant='FEMALE' THEN 'female/' ELSE '' END))) THEN RAISE EXCEPTION 'invalid_media_path'; END IF;
  SELECT * INTO v_draft FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id AND media_variant=v_variant AND state='draft' FOR UPDATE;
  IF NOT FOUND THEN
    SELECT COALESCE(max(version),0)+1 INTO v_version FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id;
    INSERT INTO public.exercise_media_versions(exercise_id,version,state,snapshot,created_by,media_variant)
    VALUES(p_exercise_id,v_version,'draft',public._exercise_media_variant_snapshot(v_exercise,v_variant),v_actor,v_variant) RETURNING * INTO v_draft;
  END IF;
  v_snapshot:=v_draft.snapshot;
  IF p_asset='exercise_video' THEN v_snapshot:=jsonb_set(v_snapshot,'{video_path}',COALESCE(to_jsonb(p_path),'null'::jsonb),true);
  ELSIF p_asset='instructions_video' THEN v_snapshot:=jsonb_set(v_snapshot,'{instructions_video_path}',COALESCE(to_jsonb(p_path),'null'::jsonb),true);
  ELSIF p_asset='thumbnail' THEN v_snapshot:=jsonb_set(v_snapshot,'{thumbnail_path}',COALESCE(to_jsonb(p_path),'null'::jsonb),true);
  ELSIF p_asset='anatomy' THEN v_snapshot:=jsonb_set(v_snapshot,'{anatomy_image_path}',COALESCE(to_jsonb(p_path),'null'::jsonb),true);
  ELSE v_images:=COALESCE(v_snapshot->'instructional_images','[null,null,null]'::jsonb);
    WHILE jsonb_array_length(v_images)<3 LOOP v_images:=v_images||'null'::jsonb; END LOOP;
    v_images:=jsonb_set(v_images,ARRAY[(CASE p_asset WHEN 'stage_a' THEN 0 WHEN 'stage_b' THEN 1 ELSE 2 END)::text],COALESCE(to_jsonb(p_path),'null'::jsonb),true);
    v_snapshot:=jsonb_set(v_snapshot,'{instructional_images}',v_images,true);
  END IF;
  v_snapshot:=jsonb_set(v_snapshot,ARRAY['technical',p_asset],COALESCE(p_technical,'{}'::jsonb),true);
  UPDATE public.exercise_media_versions SET snapshot=v_snapshot WHERE id=v_draft.id;
  PERFORM public._write_audit_event(v_actor,v_actor,'EXERCISE_MEDIA_DRAFT_CHANGED',jsonb_build_object('exercise_id',p_exercise_id,'external_id',v_exercise.external_id,'asset',p_asset,'media_variant',v_variant));
  RETURN public.admin_get_exercise_media_manager_v2(p_exercise_id,v_variant);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_publish_exercise_media_v2(p_exercise_id UUID,p_variant TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,storage AS $$
DECLARE v_actor UUID:=auth.uid(); v_variant TEXT:=upper(COALESCE(NULLIF(p_variant,''),'STANDARD')); v_exercise public.exercises%ROWTYPE;
  v_draft public.exercise_media_versions%ROWTYPE; v_current public.exercise_media_versions%ROWTYPE; v_missing INT; v_metadata JSONB; v_now TEXT:=now()::text;
BEGIN
  IF NOT public._exercise_media_admin_allowed(v_actor) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  IF v_variant NOT IN ('STANDARD','FEMALE') THEN RAISE EXCEPTION 'invalid_media_variant' USING ERRCODE='22023'; END IF;
  SELECT * INTO v_exercise FROM public.exercises WHERE id=p_exercise_id FOR UPDATE;
  SELECT * INTO v_draft FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id AND media_variant=v_variant AND state='draft' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'draft_missing'; END IF;
  SELECT count(*) INTO v_missing FROM jsonb_array_elements_text(jsonb_build_array(v_draft.snapshot->>'video_path',v_draft.snapshot->>'instructions_video_path',v_draft.snapshot->>'thumbnail_path')) p(path)
  WHERE p.path IS NOT NULL AND p.path LIKE '%/versions/%' AND NOT EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='exercise-media' AND o.name=p.path);
  IF v_missing>0 THEN RAISE EXCEPTION 'draft_asset_missing'; END IF;
  SELECT * INTO v_current FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id AND media_variant=v_variant AND state='published' FOR UPDATE;
  DELETE FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id AND media_variant=v_variant AND state='previous';
  IF v_current.id IS NOT NULL THEN UPDATE public.exercise_media_versions SET state='previous' WHERE id=v_current.id; END IF;
  UPDATE public.exercise_media_versions SET state='published',published_at=now() WHERE id=v_draft.id;
  IF v_variant='STANDARD' THEN
    UPDATE public.exercises SET video_path=v_draft.snapshot->>'video_path',instructions_video_path=v_draft.snapshot->>'instructions_video_path',thumbnail_path=v_draft.snapshot->>'thumbnail_path',
      video_status=CASE WHEN NULLIF(v_draft.snapshot->>'video_path','') IS NULL THEN 'missing' ELSE 'ready' END::public.exercise_media_status,
      instructions_status=CASE WHEN NULLIF(v_draft.snapshot->>'instructions_video_path','') IS NULL THEN 'missing' ELSE 'ready' END::public.exercise_media_status,
      metadata=(metadata-'instructional_images'-'anatomy_image_path'-'media_technical')||jsonb_build_object('instructional_images',COALESCE(v_draft.snapshot->'instructional_images','[]'::jsonb),'anatomy_image_path',v_draft.snapshot->'anatomy_image_path','media_technical',COALESCE(v_draft.snapshot->'technical','{}'::jsonb))
    WHERE id=p_exercise_id;
  ELSE
    v_metadata:=COALESCE(v_exercise.metadata,'{}'::jsonb);
    v_metadata:=jsonb_set(v_metadata,'{media_variants}',COALESCE(v_metadata->'media_variants','{}'::jsonb),true);
    v_metadata:=jsonb_set(v_metadata,'{media_variants,FEMALE}',COALESCE(v_metadata#>'{media_variants,FEMALE}','{}'::jsonb),true);
    v_metadata:=jsonb_set(v_metadata,'{media_variants,FEMALE,VIDEO}',jsonb_build_object('media_type','VIDEO','status',CASE WHEN NULLIF(v_draft.snapshot->>'video_path','') IS NULL THEN 'MISSING' ELSE 'READY' END,'path',v_draft.snapshot->'video_path','version',v_draft.version,'updated_at',v_now),true);
    v_metadata:=jsonb_set(v_metadata,'{media_variants,FEMALE,IMAGE}',jsonb_build_object('media_type','IMAGE','status',CASE WHEN NULLIF(v_draft.snapshot->>'thumbnail_path','') IS NULL THEN 'MISSING' ELSE 'READY' END,'path',v_draft.snapshot->'thumbnail_path','version',v_draft.version,'updated_at',v_now),true);
    v_metadata:=jsonb_set(v_metadata,'{media_variant_technical}',COALESCE(v_metadata->'media_variant_technical','{}'::jsonb),true);
    v_metadata:=jsonb_set(v_metadata,'{media_variant_technical,FEMALE}',COALESCE(v_draft.snapshot->'technical','{}'::jsonb),true);
    UPDATE public.exercises SET metadata=v_metadata WHERE id=p_exercise_id;
  END IF;
  PERFORM public._write_audit_event(v_actor,v_actor,'EXERCISE_MEDIA_PUBLISHED',jsonb_build_object('exercise_id',p_exercise_id,'external_id',v_exercise.external_id,'version',v_draft.version,'media_variant',v_variant));
  RETURN public.admin_get_exercise_media_manager_v2(p_exercise_id,v_variant);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_restore_previous_exercise_media_v2(p_exercise_id UUID,p_variant TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_actor UUID:=auth.uid(); v_variant TEXT:=upper(COALESCE(NULLIF(p_variant,''),'STANDARD')); v_previous public.exercise_media_versions%ROWTYPE; v_version INT;
BEGIN
  IF NOT public._exercise_media_admin_allowed(v_actor) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_previous FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id AND media_variant=v_variant AND state='previous';
  IF NOT FOUND THEN RAISE EXCEPTION 'previous_missing'; END IF;
  DELETE FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id AND media_variant=v_variant AND state='draft';
  SELECT COALESCE(max(version),0)+1 INTO v_version FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id;
  INSERT INTO public.exercise_media_versions(exercise_id,version,state,snapshot,created_by,media_variant) VALUES(p_exercise_id,v_version,'draft',v_previous.snapshot,v_actor,v_variant);
  RETURN public.admin_publish_exercise_media_v2(p_exercise_id,v_variant);
END;
$$;

-- Backward-compatible STANDARD wrappers protect clients during rolling deployment.
CREATE OR REPLACE FUNCTION public.admin_get_exercise_media_manager(p_exercise_id UUID) RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ SELECT public.admin_get_exercise_media_manager_v2(p_exercise_id,'STANDARD') $$;
CREATE OR REPLACE FUNCTION public.admin_stage_exercise_media(p_exercise_id UUID,p_asset TEXT,p_path TEXT,p_technical JSONB DEFAULT '{}') RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ SELECT public.admin_stage_exercise_media_v2(p_exercise_id,'STANDARD',p_asset,p_path,p_technical) $$;
CREATE OR REPLACE FUNCTION public.admin_publish_exercise_media(p_exercise_id UUID) RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ SELECT public.admin_publish_exercise_media_v2(p_exercise_id,'STANDARD') $$;
CREATE OR REPLACE FUNCTION public.admin_restore_previous_exercise_media(p_exercise_id UUID) RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ SELECT public.admin_restore_previous_exercise_media_v2(p_exercise_id,'STANDARD') $$;

CREATE OR REPLACE FUNCTION public.admin_suggest_exercise_external_id(p_muscle_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_actor UUID:=auth.uid(); v_code TEXT; v_prefix TEXT; v_next INT;
BEGIN
  IF NOT public._exercise_media_admin_allowed(v_actor) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  SELECT code INTO v_code FROM public.exercise_muscle_groups WHERE id=p_muscle_group_id AND is_active=true;
  IF NOT FOUND THEN RAISE EXCEPTION 'muscle_group_required' USING ERRCODE='22023'; END IF;
  v_prefix:=CASE v_code WHEN 'chest' THEN 'CH' WHEN 'back' THEN 'BA' WHEN 'warm_up' THEN 'WU' WHEN 'mobility' THEN 'MO'
    WHEN 'shoulders' THEN 'SH' WHEN 'biceps' THEN 'BI' WHEN 'triceps' THEN 'TR' WHEN 'forearms' THEN 'FO'
    WHEN 'legs' THEN 'LE' WHEN 'glutes' THEN 'GL' WHEN 'calves' THEN 'CA' WHEN 'abs' THEN 'AB' WHEN 'cardio' THEN 'CR' ELSE 'EX' END;
  SELECT COALESCE(max((regexp_match(external_id,'^[A-Z]+-([0-9]+)$'))[1]::int),0)+1 INTO v_next
  FROM public.exercises WHERE external_id ~ ('^'||v_prefix||'-[0-9]+$');
  RETURN jsonb_build_object('external_id',v_prefix||'-'||lpad(v_next::text,3,'0'),'prefix',v_prefix,'next_number',v_next,'muscle_code',v_code);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_exercise_media_catalog(p_filters JSONB DEFAULT '{}')
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_actor UUID:=auth.uid(); v_limit INT:=LEAST(GREATEST(COALESCE((p_filters->>'limit')::int,25),1),50); v_offset INT:=GREATEST(COALESCE((p_filters->>'offset')::int,0),0); v_result JSONB; v_variant TEXT:=upper(NULLIF(p_filters->>'media_variant',''));
BEGIN
  IF NOT public._exercise_media_admin_allowed(v_actor) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  IF v_variant IS NOT NULL AND v_variant NOT IN ('STANDARD','FEMALE') THEN RAISE EXCEPTION 'invalid_media_variant' USING ERRCODE='22023'; END IF;
  WITH published_usage AS (
    SELECT DISTINCT pte.exercise_id,t.id AS template_id,CASE WHEN t.metadata#>>'{template_contract,media_preference,preferred_media_variant}'='FEMALE' THEN 'FEMALE' ELSE 'STANDARD' END AS media_variant
    FROM public.program_template_exercises pte JOIN public.program_template_days d ON d.id=pte.day_id
    JOIN public.program_template_weeks w ON w.id=d.week_id JOIN public.program_templates t ON t.id=w.template_id WHERE t.is_published=true
  ), classified AS (
    SELECT e.*,g.name_ar AS muscle_group_name_ar,EXISTS(SELECT 1 FROM published_usage u WHERE u.exercise_id=e.id) AS is_launch_exercise,
      CASE WHEN v_variant='FEMALE' THEN e.metadata#>>'{media_variants,FEMALE,IMAGE,path}' ELSE e.thumbnail_path END AS display_thumbnail_path,
      CASE WHEN v_variant='FEMALE' THEN
        CASE WHEN NULLIF(e.metadata#>>'{media_variants,FEMALE,VIDEO,path}','') IS NULL THEN 'VIDEO_MISSING' WHEN NULLIF(e.metadata#>>'{media_variants,FEMALE,IMAGE,path}','') IS NULL THEN 'THUMBNAIL_MISSING' ELSE 'READY' END
      ELSE CASE WHEN e.video_status::text='placeholder' THEN 'PLACEHOLDER' WHEN e.video_status::text IN ('review_required','rejected') THEN 'NEEDS_REVIEW'
        WHEN e.video_path IS NULL OR e.video_status::text='missing' THEN 'VIDEO_MISSING' WHEN e.thumbnail_path IS NULL THEN 'THUMBNAIL_MISSING'
        WHEN jsonb_array_length(COALESCE(e.metadata->'instructional_images','[]'::jsonb))=0 THEN 'IMAGE_MISSING' ELSE 'READY' END END AS media_readiness
    FROM public.exercises e JOIN public.exercise_muscle_groups g ON g.id=e.muscle_group_id
  ), filtered AS (
    SELECT * FROM classified c WHERE
      (NULLIF(p_filters->>'query','') IS NULL OR c.name_ar ILIKE '%'||(p_filters->>'query')||'%' OR c.name_en ILIKE '%'||(p_filters->>'query')||'%' OR c.external_id ILIKE '%'||(p_filters->>'query')||'%') AND
      (NULLIF(p_filters->>'muscle','') IS NULL OR c.muscle_group_id::text=p_filters->>'muscle') AND (NULLIF(p_filters->>'equipment','') IS NULL OR c.equipment=p_filters->>'equipment') AND
      (NULLIF(p_filters->>'difficulty','') IS NULL OR c.difficulty::text=p_filters->>'difficulty') AND (NULLIF(p_filters->>'type','') IS NULL OR c.exercise_type::text=p_filters->>'type') AND
      (NULLIF(p_filters->>'active','') IS NULL OR c.is_active=(p_filters->>'active')::boolean) AND (NULLIF(p_filters->>'media_status','') IS NULL OR c.media_readiness=p_filters->>'media_status') AND
      (COALESCE((p_filters->>'launch_only')::boolean,false)=false OR c.is_launch_exercise) AND
      (NULLIF(p_filters->>'template_id','') IS NULL OR EXISTS(SELECT 1 FROM published_usage u WHERE u.exercise_id=c.id AND u.template_id=(p_filters->>'template_id')::uuid)) AND
      (v_variant IS NULL OR EXISTS(SELECT 1 FROM published_usage u WHERE u.exercise_id=c.id AND u.media_variant=v_variant))
  ), page AS (SELECT * FROM filtered ORDER BY updated_at DESC,sort_order,name_ar LIMIT v_limit OFFSET v_offset)
  SELECT jsonb_build_object('total_count',(SELECT count(*) FROM filtered),'rows',COALESCE(jsonb_agg(jsonb_build_object(
    'id',p.id,'external_id',p.external_id,'slug',p.slug,'name_ar',p.name_ar,'name_en',p.name_en,'equipment',p.equipment,'difficulty',p.difficulty,
    'exercise_type',p.exercise_type,'primary_muscle',p.primary_muscle,'is_active',p.is_active,'video_status',p.video_status,'instructions_status',p.instructions_status,
    'thumbnail_path',p.display_thumbnail_path,'muscle_group_name_ar',p.muscle_group_name_ar,'updated_at',p.updated_at,'v2_metadata_status',p.v2_metadata_status,
    'media_readiness',p.media_readiness,'is_launch_exercise',p.is_launch_exercise,'media_variant',v_variant)),'[]'::jsonb)) INTO v_result FROM page p;
  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_exercise_media_manager_v2(UUID,TEXT),public.admin_stage_exercise_media_v2(UUID,TEXT,TEXT,TEXT,JSONB),public.admin_publish_exercise_media_v2(UUID,TEXT),public.admin_restore_previous_exercise_media_v2(UUID,TEXT),public.admin_suggest_exercise_external_id(UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_get_exercise_media_manager_v2(UUID,TEXT),public.admin_stage_exercise_media_v2(UUID,TEXT,TEXT,TEXT,JSONB),public.admin_publish_exercise_media_v2(UUID,TEXT),public.admin_restore_previous_exercise_media_v2(UUID,TEXT),public.admin_suggest_exercise_external_id(UUID) TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.admin_list_exercise_media_catalog(JSONB) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_list_exercise_media_catalog(JSONB) TO authenticated,service_role;

COMMENT ON COLUMN public.exercise_media_versions.media_variant IS 'STANDARD (male/default) and FEMALE media publish histories are isolated.';
