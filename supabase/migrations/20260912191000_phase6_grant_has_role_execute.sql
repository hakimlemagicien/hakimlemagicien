-- Phase 6 local fix: authenticated must EXECUTE has_role for RLS policies that reference it.
-- Without this grant, SELECT on user_roles fails for authenticated clients (permission denied
-- while evaluating admin SELECT policies), which blocks Admin portal access checks.

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
