-- Complete exercise media editing: A/B/C + mistake images for every media variant,
-- reliable publish validation, and real-video list thumbnails. Identity is unchanged.

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
    RETURN public._exercise_media_snapshot(p_exercise) || jsonb_build_object(
      'mistake_images', COALESCE(p_exercise.metadata->'mistake_images', '[]'::jsonb)
    );
  END IF;
  RETURN jsonb_build_object(
    'video_path', p_exercise.metadata#>>'{media_variants,FEMALE,VIDEO,path}',
    'instructions_video_path', p_exercise.metadata#>>'{media_variants,FEMALE,INSTRUCTIONS_VIDEO,path}',
    'thumbnail_path', p_exercise.metadata#>>'{media_variants,FEMALE,IMAGE,path}',
    'instructional_images', COALESCE(p_exercise.metadata#>'{media_variants,FEMALE,INSTRUCTIONAL_IMAGES}', '[]'::jsonb),
    'mistake_images', COALESCE(p_exercise.metadata#>'{media_variants,FEMALE,MISTAKE_IMAGES}', '[]'::jsonb),
    'anatomy_image_path', p_exercise.metadata#>>'{media_variants,FEMALE,ANATOMY_IMAGE,path}',
    'technical', COALESCE(p_exercise.metadata#>'{media_variant_technical,FEMALE}', '{}'::jsonb)
  );
END;
$$;
REVOKE ALL ON FUNCTION public._exercise_media_variant_snapshot(public.exercises,TEXT) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public._exercise_media_variant_snapshot(public.exercises,TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_stage_exercise_media_v2(p_exercise_id UUID,p_variant TEXT,p_asset TEXT,p_path TEXT,p_technical JSONB DEFAULT '{}')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_actor UUID:=auth.uid(); v_variant TEXT:=upper(COALESCE(NULLIF(p_variant,''),'STANDARD')); v_exercise public.exercises%ROWTYPE;
  v_draft public.exercise_media_versions%ROWTYPE; v_snapshot JSONB; v_version INT; v_images JSONB;
BEGIN
  IF NOT public._exercise_media_admin_allowed(v_actor) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  IF v_variant NOT IN ('STANDARD','FEMALE') THEN RAISE EXCEPTION 'invalid_media_variant' USING ERRCODE='22023'; END IF;
  IF p_asset NOT IN ('exercise_video','instructions_video','thumbnail','stage_a','stage_b','stage_c','mistake_01','mistake_02','anatomy') THEN RAISE EXCEPTION 'invalid_asset' USING ERRCODE='22023'; END IF;
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
  ELSIF p_asset IN ('mistake_01','mistake_02') THEN
    v_images:=COALESCE(v_snapshot->'mistake_images','[null,null]'::jsonb);
    WHILE jsonb_array_length(v_images)<2 LOOP v_images:=v_images||'null'::jsonb; END LOOP;
    v_images:=jsonb_set(v_images,ARRAY[(CASE p_asset WHEN 'mistake_01' THEN 0 ELSE 1 END)::text],COALESCE(to_jsonb(p_path),'null'::jsonb),true);
    v_snapshot:=jsonb_set(v_snapshot,'{mistake_images}',v_images,true);
  ELSE
    v_images:=COALESCE(v_snapshot->'instructional_images','[null,null,null]'::jsonb);
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
  SELECT count(*) INTO v_missing FROM (
    SELECT value AS path FROM jsonb_array_elements_text(jsonb_build_array(v_draft.snapshot->>'video_path',v_draft.snapshot->>'instructions_video_path',v_draft.snapshot->>'thumbnail_path',v_draft.snapshot->>'anatomy_image_path'))
    UNION ALL SELECT value FROM jsonb_array_elements_text(COALESCE(v_draft.snapshot->'instructional_images','[]'::jsonb))
    UNION ALL SELECT value FROM jsonb_array_elements_text(COALESCE(v_draft.snapshot->'mistake_images','[]'::jsonb))
  ) p WHERE p.path IS NOT NULL AND p.path<>'' AND p.path LIKE '%/versions/%' AND NOT EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='exercise-media' AND o.name=p.path);
  IF v_missing>0 THEN RAISE EXCEPTION 'draft_asset_missing'; END IF;
  SELECT * INTO v_current FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id AND media_variant=v_variant AND state='published' FOR UPDATE;
  DELETE FROM public.exercise_media_versions WHERE exercise_id=p_exercise_id AND media_variant=v_variant AND state='previous';
  IF v_current.id IS NOT NULL THEN UPDATE public.exercise_media_versions SET state='previous' WHERE id=v_current.id; END IF;
  UPDATE public.exercise_media_versions SET state='published',published_at=now() WHERE id=v_draft.id;
  IF v_variant='STANDARD' THEN
    UPDATE public.exercises SET video_path=v_draft.snapshot->>'video_path',instructions_video_path=v_draft.snapshot->>'instructions_video_path',thumbnail_path=v_draft.snapshot->>'thumbnail_path',
      video_status=CASE WHEN NULLIF(v_draft.snapshot->>'video_path','') IS NULL THEN 'missing' ELSE 'ready' END::public.exercise_media_status,
      instructions_status=CASE WHEN NULLIF(v_draft.snapshot->>'instructions_video_path','') IS NULL THEN 'missing' ELSE 'ready' END::public.exercise_media_status,
      metadata=(metadata-'instructional_images'-'mistake_images'-'anatomy_image_path'-'media_technical')||jsonb_build_object(
        'instructional_images',COALESCE(v_draft.snapshot->'instructional_images','[]'::jsonb),
        'mistake_images',COALESCE(v_draft.snapshot->'mistake_images','[]'::jsonb),
        'anatomy_image_path',v_draft.snapshot->'anatomy_image_path','media_technical',COALESCE(v_draft.snapshot->'technical','{}'::jsonb))
    WHERE id=p_exercise_id;
  ELSE
    v_metadata:=COALESCE(v_exercise.metadata,'{}'::jsonb);
    v_metadata:=jsonb_set(v_metadata,'{media_variants}',COALESCE(v_metadata->'media_variants','{}'::jsonb),true);
    v_metadata:=jsonb_set(v_metadata,'{media_variants,FEMALE}',COALESCE(v_metadata#>'{media_variants,FEMALE}','{}'::jsonb),true);
    v_metadata:=jsonb_set(v_metadata,'{media_variants,FEMALE,VIDEO}',jsonb_build_object('media_type','VIDEO','status',CASE WHEN NULLIF(v_draft.snapshot->>'video_path','') IS NULL THEN 'MISSING' ELSE 'READY' END,'path',v_draft.snapshot->'video_path','version',v_draft.version,'updated_at',v_now),true);
    v_metadata:=jsonb_set(v_metadata,'{media_variants,FEMALE,INSTRUCTIONS_VIDEO}',jsonb_build_object('media_type','VIDEO','status',CASE WHEN NULLIF(v_draft.snapshot->>'instructions_video_path','') IS NULL THEN 'MISSING' ELSE 'READY' END,'path',v_draft.snapshot->'instructions_video_path','version',v_draft.version,'updated_at',v_now),true);
    v_metadata:=jsonb_set(v_metadata,'{media_variants,FEMALE,IMAGE}',jsonb_build_object('media_type','IMAGE','status',CASE WHEN NULLIF(v_draft.snapshot->>'thumbnail_path','') IS NULL THEN 'MISSING' ELSE 'READY' END,'path',v_draft.snapshot->'thumbnail_path','version',v_draft.version,'updated_at',v_now),true);
    v_metadata:=jsonb_set(v_metadata,'{media_variants,FEMALE,INSTRUCTIONAL_IMAGES}',COALESCE(v_draft.snapshot->'instructional_images','[]'::jsonb),true);
    v_metadata:=jsonb_set(v_metadata,'{media_variants,FEMALE,MISTAKE_IMAGES}',COALESCE(v_draft.snapshot->'mistake_images','[]'::jsonb),true);
    v_metadata:=jsonb_set(v_metadata,'{media_variants,FEMALE,ANATOMY_IMAGE}',jsonb_build_object('media_type','IMAGE','status',CASE WHEN NULLIF(v_draft.snapshot->>'anatomy_image_path','') IS NULL THEN 'MISSING' ELSE 'READY' END,'path',v_draft.snapshot->'anatomy_image_path','version',v_draft.version,'updated_at',v_now),true);
    v_metadata:=jsonb_set(v_metadata,'{media_variant_technical}',COALESCE(v_metadata->'media_variant_technical','{}'::jsonb),true);
    v_metadata:=jsonb_set(v_metadata,'{media_variant_technical,FEMALE}',COALESCE(v_draft.snapshot->'technical','{}'::jsonb),true);
    UPDATE public.exercises SET metadata=v_metadata WHERE id=p_exercise_id;
  END IF;
  PERFORM public._write_audit_event(v_actor,v_actor,'EXERCISE_MEDIA_PUBLISHED',jsonb_build_object('exercise_id',p_exercise_id,'external_id',v_exercise.external_id,'version',v_draft.version,'media_variant',v_variant));
  RETURN public.admin_get_exercise_media_manager_v2(p_exercise_id,v_variant);
END;
$$;

-- Keep old clients working through the STANDARD wrapper after the function replacement.
CREATE OR REPLACE FUNCTION public.admin_stage_exercise_media(p_exercise_id UUID,p_asset TEXT,p_path TEXT,p_technical JSONB DEFAULT '{}') RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ SELECT public.admin_stage_exercise_media_v2(p_exercise_id,'STANDARD',p_asset,p_path,p_technical) $$;
CREATE OR REPLACE FUNCTION public.admin_publish_exercise_media(p_exercise_id UUID) RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$ SELECT public.admin_publish_exercise_media_v2(p_exercise_id,'STANDARD') $$;

REVOKE ALL ON FUNCTION public.admin_stage_exercise_media_v2(UUID,TEXT,TEXT,TEXT,JSONB),public.admin_publish_exercise_media_v2(UUID,TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_stage_exercise_media_v2(UUID,TEXT,TEXT,TEXT,JSONB),public.admin_publish_exercise_media_v2(UUID,TEXT) TO authenticated,service_role;

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
      CASE WHEN v_variant='FEMALE' THEN e.metadata#>>'{media_variants,FEMALE,VIDEO,path}' ELSE e.video_path END AS display_video_path,
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
    'exercise_type',p.exercise_type,'primary_muscle',p.primary_muscle,'is_active',p.is_active,'video_status',p.video_status,'video_path',p.display_video_path,'instructions_status',p.instructions_status,
    'thumbnail_path',p.display_thumbnail_path,'muscle_group_name_ar',p.muscle_group_name_ar,'updated_at',p.updated_at,'v2_metadata_status',p.v2_metadata_status,
    'media_readiness',p.media_readiness,'is_launch_exercise',p.is_launch_exercise,'media_variant',v_variant)),'[]'::jsonb)) INTO v_result FROM page p;
  RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_exercise_media_catalog(JSONB) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_list_exercise_media_catalog(JSONB) TO authenticated,service_role;
