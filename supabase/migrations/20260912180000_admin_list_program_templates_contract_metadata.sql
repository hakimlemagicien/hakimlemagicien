-- Phase 5 (LOCAL ONLY): expose template_contract projection on program template list.
-- Do NOT apply to Staging or Production in Phase 5.
-- Closes Phase 4 list RPC gap so Admin cards can render real Pilot metadata without legacy fallback.

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
  template_contract JSONB,
  primary_strategy TEXT,
  library_readiness TEXT,
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
    NULLIF(upper(COALESCE(t.metadata->>'training_location', t.metadata->'template_contract'->'variant'->>'environment')), '') AS training_location,
    CASE
      WHEN jsonb_typeof(t.metadata->'template_contract') = 'object' THEN t.metadata->'template_contract'
      ELSE NULL
    END AS template_contract,
    NULLIF(t.metadata->'template_contract'->>'primary_strategy', '') AS primary_strategy,
    NULLIF(t.metadata->'template_contract'->'library_readiness'->>'state', '') AS library_readiness,
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

REVOKE ALL ON FUNCTION public.admin_list_program_templates(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_program_templates(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER) TO authenticated, service_role;

COMMENT ON FUNCTION public.admin_list_program_templates(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER)
  IS 'Admin program template list with optional template_contract projection (Phase 5). LOCAL migration — not applied to Staging/Production in Phase 5.';
