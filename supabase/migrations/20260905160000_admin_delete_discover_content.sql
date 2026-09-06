-- Permanent discover content delete + minimal slug suppression (hide seed without keeping fat rows).

CREATE TABLE IF NOT EXISTS public.discover_suppressed_slugs (
  slug TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL
);

ALTER TABLE public.discover_suppressed_slugs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "discover_suppressed_admin_all" ON public.discover_suppressed_slugs;
CREATE POLICY "discover_suppressed_admin_all"
  ON public.discover_suppressed_slugs
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, DELETE ON public.discover_suppressed_slugs TO authenticated;

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
      SELECT jsonb_agg(slug ORDER BY slug)
      FROM (
        SELECT c.slug
        FROM public.discover_content c
        WHERE c.status IN (
          'unpublished'::public.discover_content_status,
          'archived'::public.discover_content_status
        )
        UNION
        SELECT s.slug
        FROM public.discover_suppressed_slugs s
      ) hidden
    ), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_count_discover_content()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._require_admin();
  RETURN jsonb_build_object(
    'total', (SELECT count(*)::INT FROM public.discover_content),
    'published', (SELECT count(*)::INT FROM public.discover_content WHERE status = 'published'),
    'archived', (SELECT count(*)::INT FROM public.discover_content WHERE status = 'archived'),
    'draft', (SELECT count(*)::INT FROM public.discover_content WHERE status = 'draft'),
    'scheduled', (SELECT count(*)::INT FROM public.discover_content WHERE status = 'scheduled'),
    'unpublished', (SELECT count(*)::INT FROM public.discover_content WHERE status = 'unpublished'),
    'suppressed', (SELECT count(*)::INT FROM public.discover_suppressed_slugs)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_discover_content(p_id UUID)
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
  SELECT * INTO v_existing FROM public.discover_content WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.discover_suppressed_slugs (slug, created_by)
  VALUES (v_existing.slug, v_admin)
  ON CONFLICT (slug) DO NOTHING;

  DELETE FROM public.discover_content WHERE id = p_id;

  PERFORM public._write_audit_event(
    v_admin,
    v_admin,
    'discover_content_deleted',
    jsonb_build_object('content_id', p_id, 'slug', v_existing.slug, 'title', v_existing.title)
  );

  RETURN jsonb_build_object('ok', true, 'id', p_id, 'slug', v_existing.slug);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_suppress_discover_slug(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_slug TEXT := NULLIF(btrim(COALESCE(p_slug, '')), '');
BEGIN
  v_admin := public._require_admin();
  IF v_slug IS NULL THEN
    RAISE EXCEPTION 'slug_required' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.discover_suppressed_slugs (slug, created_by)
  VALUES (v_slug, v_admin)
  ON CONFLICT (slug) DO NOTHING;

  DELETE FROM public.discover_content WHERE slug = v_slug;

  RETURN jsonb_build_object('ok', true, 'slug', v_slug);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_suppressed_discover_slugs()
RETURNS TEXT[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._require_admin();
  RETURN COALESCE((
    SELECT array_agg(s.slug ORDER BY s.slug)
    FROM public.discover_suppressed_slugs s
  ), '{}'::text[]);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_count_discover_content() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_discover_content(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_suppress_discover_slug(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_suppressed_discover_slugs() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_count_discover_content() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_discover_content(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_suppress_discover_slug(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_suppressed_discover_slugs() TO authenticated, service_role;
