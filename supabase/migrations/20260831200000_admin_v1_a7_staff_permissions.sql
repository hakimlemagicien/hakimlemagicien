-- MAAKFIT Admin V1 — A7 Staff roles & permissions (additive, staging-first).
-- Maps existing user_roles.admin → super_admin. Does not remove legacy admin contract.

-- ---------------------------------------------------------------------------
-- 1. Staff role enum + members table
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'staff_role') THEN
    CREATE TYPE public.staff_role AS ENUM (
      'super_admin',
      'coach',
      'nutrition',
      'support',
      'finance',
      'read_only'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.staff_members (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_role public.staff_role NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  display_name TEXT,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_members_role_idx ON public.staff_members (staff_role, status);

-- ---------------------------------------------------------------------------
-- 2. Role resolution + permission matrix (before RLS policies)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.resolve_staff_role(p_user_id UUID)
RETURNS public.staff_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT sm.staff_role
      FROM public.staff_members sm
      WHERE sm.user_id = p_user_id
        AND sm.status = 'active'
      LIMIT 1
    ),
    CASE
      WHEN public.has_role(p_user_id, 'admin'::public.app_role) THEN 'super_admin'::public.staff_role
      ELSE NULL
    END
  );
$$;

CREATE OR REPLACE FUNCTION public.has_staff_portal_access(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.resolve_staff_role(p_user_id) IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.staff_has_permission(p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.staff_role;
BEGIN
  v_role := public.resolve_staff_role(p_user_id);
  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_role = 'super_admin' THEN
    RETURN TRUE;
  END IF;

  RETURN CASE p_permission
    WHEN 'clients.read' THEN v_role IN ('coach', 'nutrition', 'support', 'finance', 'read_only')
    WHEN 'clients.basic_read' THEN v_role IN ('support', 'finance', 'read_only')
    WHEN 'clients.write' THEN FALSE
    WHEN 'client_notes.write' THEN v_role IN ('coach', 'nutrition')
    WHEN 'training.manage' THEN v_role = 'coach'
    WHEN 'nutrition.manage' THEN v_role = 'nutrition'
    WHEN 'exercise.read' THEN v_role IN ('coach', 'read_only')
    WHEN 'exercise.content_edit' THEN FALSE
    WHEN 'exercise.safety_edit' THEN FALSE
    WHEN 'meal_library.manage' THEN v_role = 'nutrition'
    WHEN 'meal.safety_edit' THEN v_role = 'nutrition'
    WHEN 'membership.read' THEN v_role IN ('support', 'finance', 'read_only')
    WHEN 'payments.read' THEN v_role IN ('finance', 'read_only')
    WHEN 'legacy_payments.manage' THEN v_role IN ('finance')
    WHEN 'payment_audit.read' THEN v_role IN ('finance', 'read_only')
    WHEN 'content.manage' THEN FALSE
    WHEN 'support.manage' THEN v_role = 'support'
    WHEN 'messages.manage' THEN v_role IN ('coach', 'support')
    WHEN 'progress.read' THEN v_role IN ('coach', 'nutrition', 'read_only')
    WHEN 'audit.read' THEN v_role IN ('finance', 'read_only', 'coach', 'nutrition', 'support')
    WHEN 'staff.manage' THEN FALSE
    ELSE FALSE
  END;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Portal gate + permission gate
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public._require_admin()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL OR NOT public.has_staff_portal_access(v_uid) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN v_uid;
END;
$$;

CREATE OR REPLACE FUNCTION public._require_staff_permission(p_permission TEXT)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
BEGIN
  v_uid := public._require_admin();
  IF NOT public.staff_has_permission(v_uid, p_permission) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN v_uid;
END;
$$;

REVOKE ALL ON FUNCTION public._require_staff_permission(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._require_staff_permission(TEXT) TO authenticated, service_role;

ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_members_admin_select ON public.staff_members;
CREATE POLICY staff_members_admin_select ON public.staff_members
  FOR SELECT TO authenticated
  USING (public.has_staff_portal_access(auth.uid()));

DROP POLICY IF EXISTS staff_members_admin_mutate ON public.staff_members;
CREATE POLICY staff_members_admin_mutate ON public.staff_members
  FOR ALL TO authenticated
  USING (public.staff_has_permission(auth.uid(), 'staff.manage'))
  WITH CHECK (public.staff_has_permission(auth.uid(), 'staff.manage'));

-- Backfill legacy admins → super_admin
INSERT INTO public.staff_members (user_id, staff_role, status, granted_at)
SELECT ur.user_id, 'super_admin'::public.staff_role, 'active', now()
FROM public.user_roles ur
WHERE ur.role = 'admin'::public.app_role
ON CONFLICT (user_id) DO UPDATE
SET staff_role = EXCLUDED.staff_role,
    status = 'active',
    updated_at = now()
WHERE public.staff_members.staff_role IS DISTINCT FROM 'super_admin'::public.staff_role;

-- ---------------------------------------------------------------------------
-- 4. Self-escalation + last super admin protection
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_staff_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_actor_role public.staff_role;
  v_super_admin_count INTEGER;
BEGIN
  IF v_actor IS NULL THEN
    RETURN NEW;
  END IF;

  v_actor_role := public.resolve_staff_role(v_actor);

  -- Block any self role escalation / self role change
  IF NEW.user_id = v_actor AND (TG_OP = 'INSERT' OR NEW.staff_role IS DISTINCT FROM OLD.staff_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  -- Only staff managers can change others
  IF NEW.user_id IS DISTINCT FROM v_actor AND NOT public.staff_has_permission(v_actor, 'staff.manage') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  -- Prevent removing last active super_admin
  IF TG_OP = 'UPDATE' AND OLD.staff_role = 'super_admin' AND NEW.staff_role IS DISTINCT FROM 'super_admin' THEN
    SELECT COUNT(*)::int INTO v_super_admin_count
    FROM public.staff_members
    WHERE staff_role = 'super_admin' AND status = 'active' AND user_id <> OLD.user_id;
    IF v_super_admin_count < 1 THEN
      RAISE EXCEPTION 'last_super_admin' USING ERRCODE = '22023';
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.staff_role = 'super_admin' AND NEW.status = 'inactive' THEN
    SELECT COUNT(*)::int INTO v_super_admin_count
    FROM public.staff_members
    WHERE staff_role = 'super_admin' AND status = 'active' AND user_id <> OLD.user_id;
    IF v_super_admin_count < 1 THEN
      RAISE EXCEPTION 'last_super_admin' USING ERRCODE = '22023';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_staff_role_escalation ON public.staff_members;
CREATE TRIGGER trg_prevent_staff_role_escalation
  BEFORE INSERT OR UPDATE ON public.staff_members
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_staff_role_escalation();

CREATE OR REPLACE FUNCTION public.prevent_self_admin_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NEW.role = 'admin'::public.app_role
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. Staff session + management RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_get_staff_session()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := public._require_admin();
  v_role public.staff_role := public.resolve_staff_role(v_uid);
BEGIN
  RETURN jsonb_build_object(
    'user_id', v_uid,
    'staff_role', v_role::text,
    'permissions', (
      SELECT COALESCE(jsonb_agg(perm ORDER BY perm), '[]'::jsonb)
      FROM (
        SELECT unnest(ARRAY[
          'clients.read', 'clients.basic_read', 'clients.write', 'client_notes.write',
          'training.manage', 'nutrition.manage', 'exercise.read', 'exercise.content_edit',
          'exercise.safety_edit', 'meal_library.manage', 'meal.safety_edit',
          'membership.read', 'payments.read', 'legacy_payments.manage', 'payment_audit.read',
          'content.manage', 'support.manage', 'messages.manage', 'progress.read',
          'audit.read', 'staff.manage'
        ]) AS perm
      ) p
      WHERE public.staff_has_permission(v_uid, p.perm)
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_staff_members()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  staff_role TEXT,
  status TEXT,
  granted_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._require_staff_permission('staff.manage');

  RETURN QUERY
  SELECT
    sm.user_id,
    u.email::text,
    COALESCE(sm.display_name, pr.full_name, u.raw_user_meta_data ->> 'full_name')::text,
    sm.staff_role::text,
    sm.status,
    sm.granted_at,
    u.last_sign_in_at
  FROM public.staff_members sm
  JOIN auth.users u ON u.id = sm.user_id
  LEFT JOIN public.profiles pr ON pr.id = sm.user_id
  ORDER BY sm.granted_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_staff_role(
  p_user_id UUID,
  p_staff_role public.staff_role,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_reason TEXT := NULLIF(btrim(COALESCE(p_reason, '')), '');
  v_before TEXT;
BEGIN
  v_admin := public._require_staff_permission('staff.manage');

  IF v_reason IS NULL OR char_length(v_reason) < 5 THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE = '22023';
  END IF;

  SELECT staff_role::text INTO v_before
  FROM public.staff_members
  WHERE user_id = p_user_id;

  INSERT INTO public.staff_members (user_id, staff_role, status, granted_by, granted_at, updated_at)
  VALUES (p_user_id, p_staff_role, 'active', v_admin, now(), now())
  ON CONFLICT (user_id) DO UPDATE
  SET staff_role = EXCLUDED.staff_role,
      status = 'active',
      granted_by = v_admin,
      updated_at = now();

  PERFORM public._write_audit_event(
    v_admin,
    p_user_id,
    'staff_role_changed',
    jsonb_build_object(
      'before_role', v_before,
      'after_role', p_staff_role::text,
      'reason', v_reason
    )
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 6. Patch high-risk mutation RPCs with permission gates
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_update_lead_payment_status(
  p_lead_id UUID,
  p_payment_status public.payment_status,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_reason TEXT := NULLIF(btrim(COALESCE(p_reason, '')), '');
  v_subject UUID;
BEGIN
  v_admin := public._require_staff_permission('legacy_payments.manage');

  IF p_payment_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'invalid_payment_status' USING ERRCODE = '22023';
  END IF;

  IF p_payment_status = 'rejected' AND (v_reason IS NULL OR char_length(v_reason) < 3) THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE = '22023';
  END IF;

  IF v_reason IS NOT NULL AND char_length(v_reason) > 500 THEN
    RAISE EXCEPTION 'invalid_reason' USING ERRCODE = '22023';
  END IF;

  UPDATE public.leads
  SET
    payment_status = p_payment_status,
    status = CASE
      WHEN p_payment_status = 'approved' THEN 'active'::public.lead_status
      ELSE status
    END,
    updated_at = now()
  WHERE id = p_lead_id
    AND payment_status = 'submitted'
  RETURNING user_id INTO v_subject;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'lead_not_found_or_not_submitted' USING ERRCODE = 'P0002';
  END IF;

  PERFORM public._write_audit_event(
    v_admin,
    v_subject,
    'payment_reviewed',
    jsonb_build_object(
      'lead_id', p_lead_id,
      'decision', p_payment_status,
      'reason', v_reason
    )
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 7. Grants
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.resolve_staff_role(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_staff_portal_access(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.staff_has_permission(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_staff_session() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_staff_members() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_update_staff_role(UUID, public.staff_role, TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.resolve_staff_role(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_staff_portal_access(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.staff_has_permission(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_staff_session() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_staff_members() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_staff_role(UUID, public.staff_role, TEXT) TO authenticated, service_role;

COMMENT ON TABLE public.staff_members IS 'A7 staff RBAC. Legacy user_roles.admin maps to super_admin.';
COMMENT ON FUNCTION public.admin_get_staff_session() IS 'Returns staff role + effective permission list for Admin UI gating.';
