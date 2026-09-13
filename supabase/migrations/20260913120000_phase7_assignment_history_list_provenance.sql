-- Phase 7: expose provenance + progression on assignment history list (local only).
-- Reason: Admin Assignment History UI needs generation_source and progression_strategy
-- without N+1 detail fetches. Prefer extending existing RPC over a second history system.
--
-- Postgres cannot change OUT columns via CREATE OR REPLACE — drop then recreate.

DROP FUNCTION IF EXISTS public.admin_list_client_assignments(UUID, INTEGER, INTEGER);

CREATE FUNCTION public.admin_list_client_assignments(
  p_client_id UUID,
  p_limit INTEGER DEFAULT 25,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  source_template_id UUID,
  template_version INT,
  status TEXT,
  name_ar TEXT,
  starts_on DATE,
  assigned_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  snapshot_complete BOOLEAN,
  generation_source TEXT,
  progression_strategy TEXT,
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
BEGIN
  PERFORM public._require_admin();
  RETURN QUERY
  SELECT
    a.id,
    a.source_template_id,
    a.template_version,
    a.status,
    a.name_ar,
    a.starts_on,
    a.assigned_at,
    a.ended_at,
    EXISTS (SELECT 1 FROM public.client_program_weeks w WHERE w.assignment_id = a.id),
    a.generation_source,
    a.progression_strategy,
    count(*) OVER ()::BIGINT
  FROM public.client_program_assignments a
  WHERE a.client_id = p_client_id
  ORDER BY a.assigned_at DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_client_assignments(UUID, INTEGER, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_client_assignments(UUID, INTEGER, INTEGER) TO authenticated, service_role;

COMMENT ON FUNCTION public.admin_list_client_assignments(UUID, INTEGER, INTEGER) IS
  'Admin assignment history for one client — includes frozen template_version, generation_source, progression_strategy.';
