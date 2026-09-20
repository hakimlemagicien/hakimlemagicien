-- Keep role checks callable by authenticated RLS policies without exposing
-- role-enumeration helpers to anonymous callers. The TEXT overload exists in
-- Production as historical drift, so harden it when present as well.

DO $$
BEGIN
  IF to_regprocedure('public.has_role(uuid,public.app_role)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
  END IF;

  IF to_regprocedure('public.has_role(uuid,text)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated, service_role;
  END IF;
END;
$$;
