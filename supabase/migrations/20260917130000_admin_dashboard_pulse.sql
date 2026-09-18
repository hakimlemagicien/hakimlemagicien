-- Grounded operational pulse for the mobile Admin home screen.
-- Counts only persisted source-of-truth rows; no synthetic analytics.

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_get_dashboard_pulse()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._require_admin();

  RETURN jsonb_build_object(
    'new_clients_7d', (
      SELECT count(*)
      FROM public.profiles p
      WHERE p.created_at >= now() - interval '7 days'
        AND NOT public.has_role(p.id, 'admin')
    ),
    'missing_training', (
      SELECT count(*)
      FROM public.profiles p
      WHERE COALESCE(p.account_status, 'active') = 'active'
        AND NOT public.has_role(p.id, 'admin')
        AND NOT EXISTS (
          SELECT 1
          FROM public.client_program_assignments a
          WHERE a.client_id = p.id
            AND a.status IN ('active', 'scheduled', 'draft')
        )
    ),
    'missing_nutrition', (
      SELECT count(*)
      FROM public.profiles p
      WHERE COALESCE(p.account_status, 'active') = 'active'
        AND NOT public.has_role(p.id, 'admin')
        AND NOT EXISTS (
          SELECT 1
          FROM public.client_nutrition_assignments a
          WHERE a.client_id = p.id
            AND a.status IN ('active', 'scheduled', 'draft')
        )
    ),
    'training_drafts', (
      SELECT count(*) FROM public.client_program_assignments WHERE status = 'draft'
    ),
    'nutrition_drafts', (
      SELECT count(*) FROM public.client_nutrition_assignments WHERE status = 'draft'
    ),
    'memberships_expiring_14d', (
      SELECT count(*)
      FROM public.memberships
      WHERE is_active = true
        AND ends_at > now()
        AND ends_at <= now() + interval '14 days'
    ),
    'memberships_expired', (
      SELECT count(*)
      FROM public.memberships
      WHERE ends_at IS NOT NULL
        AND ends_at <= now()
    ),
    'active_promotions', (
      SELECT count(*)
      FROM public.product_promotions
      WHERE status = 'active'
        AND starts_at <= now()
        AND ends_at > now()
    ),
    'operational_alerts', jsonb_array_length(public.admin_list_operational_alerts())
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_dashboard_pulse() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_dashboard_pulse() TO authenticated, service_role;

COMMIT;
