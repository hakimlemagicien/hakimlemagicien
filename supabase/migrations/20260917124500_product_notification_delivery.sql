-- Deliver Admin-authored product notifications to eligible clients in-app.

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_send_product_notification(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin UUID; v_row public.product_notifications%ROWTYPE; v_audience TEXT; v_deep_link TEXT;
BEGIN
  v_admin := public._require_admin();
  v_audience := COALESCE(p_payload->>'audience_type','admin');
  v_deep_link := NULLIF(btrim(p_payload->>'deep_link'),'');
  IF v_audience NOT IN ('client','membership','all','admin') THEN RAISE EXCEPTION 'invalid_notification_audience' USING ERRCODE='22023'; END IF;
  IF v_audience='client' AND NULLIF(btrim(p_payload->>'audience_value'),'') IS NULL THEN RAISE EXCEPTION 'client_id_required' USING ERRCODE='22023'; END IF;
  IF v_audience='membership' AND lower(COALESCE(p_payload->>'audience_value','')) NOT IN ('free','essential','plus','premium','pro','vip') THEN RAISE EXCEPTION 'membership_segment_required' USING ERRCODE='22023'; END IF;
  IF v_deep_link IS NOT NULL AND ((v_audience='admin' AND v_deep_link NOT LIKE '/admin%') OR (v_audience<>'admin' AND v_deep_link NOT LIKE '/app%')) THEN RAISE EXCEPTION 'unsafe_notification_deep_link' USING ERRCODE='22023'; END IF;
  INSERT INTO public.product_notifications(audience_type,audience_value,severity,category,title,body,entity_type,entity_id,deep_link,status,created_by,published_at)
  VALUES(v_audience,NULLIF(p_payload->>'audience_value',''),COALESCE(p_payload->>'severity','info'),COALESCE(p_payload->>'category','general'),btrim(p_payload->>'title'),btrim(p_payload->>'body'),NULLIF(p_payload->>'entity_type',''),NULLIF(p_payload->>'entity_id',''),v_deep_link,COALESCE(p_payload->>'status','published'),v_admin,CASE WHEN COALESCE(p_payload->>'status','published')='published' THEN now() END)
  RETURNING * INTO v_row;
  PERFORM public._write_audit_event(v_admin,v_admin,'product_notification_sent',jsonb_build_object('id',v_row.id,'audience_type',v_row.audience_type,'audience_value',v_row.audience_value,'severity',v_row.severity));
  RETURN to_jsonb(v_row);
END;
$$;

CREATE OR REPLACE FUNCTION public.client_list_product_notifications(p_limit INTEGER DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID:=auth.uid(); v_tier TEXT:='free';
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'authentication_required' USING ERRCODE='42501'; END IF;
  SELECT lower(COALESCE(m.tier::TEXT,'free')) INTO v_tier FROM public.memberships m
  WHERE m.user_id=v_user AND COALESCE(m.is_active,false)=true ORDER BY m.starts_at DESC NULLS LAST LIMIT 1;
  v_tier:=COALESCE(v_tier,'free');
  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(n) || jsonb_build_object('is_read',v_user=ANY(n.read_by)) ORDER BY n.created_at DESC)
    FROM (SELECT * FROM public.product_notifications n
      WHERE n.status='published' AND n.published_at<=now() AND (
        n.audience_type='all'
        OR (n.audience_type='client' AND n.audience_value=v_user::TEXT)
        OR (n.audience_type='membership' AND CASE lower(COALESCE(n.audience_value,'')) WHEN 'plus' THEN 'essential' WHEN 'pro' THEN 'premium' ELSE lower(COALESCE(n.audience_value,'')) END=v_tier)
      ) ORDER BY n.created_at DESC LIMIT LEAST(GREATEST(COALESCE(p_limit,30),1),50)
    ) n
  ),'[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.client_mark_product_notification_read(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID:=auth.uid(); v_tier TEXT:='free';
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'authentication_required' USING ERRCODE='42501'; END IF;
  SELECT lower(COALESCE(m.tier::TEXT,'free')) INTO v_tier FROM public.memberships m
  WHERE m.user_id=v_user AND COALESCE(m.is_active,false)=true ORDER BY m.starts_at DESC NULLS LAST LIMIT 1;
  v_tier:=COALESCE(v_tier,'free');
  UPDATE public.product_notifications n SET read_by=array_append(n.read_by,v_user)
  WHERE n.id=p_id AND n.status='published' AND NOT v_user=ANY(n.read_by) AND (
    n.audience_type='all'
    OR (n.audience_type='client' AND n.audience_value=v_user::TEXT)
    OR (n.audience_type='membership' AND CASE lower(COALESCE(n.audience_value,'')) WHEN 'plus' THEN 'essential' WHEN 'pro' THEN 'premium' ELSE lower(COALESCE(n.audience_value,'')) END=v_tier)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.client_list_product_notifications(INTEGER) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.client_mark_product_notification_read(UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.client_list_product_notifications(INTEGER) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.client_mark_product_notification_read(UUID) TO authenticated,service_role;

COMMIT;
