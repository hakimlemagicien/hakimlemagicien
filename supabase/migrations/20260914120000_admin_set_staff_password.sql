-- Allow super_admin (staff.manage) to set passwords for active staff accounts from Command Center.

CREATE OR REPLACE FUNCTION public.admin_set_staff_password(
  p_user_id UUID,
  p_new_password TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_admin UUID;
  v_reason TEXT := NULLIF(btrim(COALESCE(p_reason, '')), '');
  v_password TEXT := COALESCE(p_new_password, '');
  v_staff_status TEXT;
BEGIN
  v_admin := public._require_staff_permission('staff.manage');

  IF char_length(v_password) < 8 THEN
    RAISE EXCEPTION 'password_too_short' USING ERRCODE = '22023';
  END IF;

  IF char_length(v_password) > 128 THEN
    RAISE EXCEPTION 'password_too_long' USING ERRCODE = '22023';
  END IF;

  IF v_reason IS NULL OR char_length(v_reason) < 5 THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE = '22023';
  END IF;

  SELECT sm.status INTO v_staff_status
  FROM public.staff_members sm
  WHERE sm.user_id = p_user_id;

  IF v_staff_status IS NULL THEN
    RAISE EXCEPTION 'not_staff' USING ERRCODE = 'P0002';
  END IF;

  IF v_staff_status <> 'active' THEN
    RAISE EXCEPTION 'staff_inactive' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p_user_id) THEN
    RAISE EXCEPTION 'user_not_found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE auth.users
  SET
    encrypted_password = crypt(v_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = p_user_id;

  -- Resetting someone else's password ends their sessions.
  -- Self-change keeps the current browser session so the admin is not kicked mid-save.
  IF v_admin <> p_user_id THEN
    DELETE FROM auth.sessions WHERE user_id = p_user_id;
    DELETE FROM auth.refresh_tokens WHERE user_id = p_user_id::text;
  END IF;

  PERFORM public._write_audit_event(
    v_admin,
    p_user_id,
    'staff_password_changed',
    jsonb_build_object(
      'reason', v_reason,
      'self', v_admin = p_user_id
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_staff_password(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_staff_password(UUID, TEXT, TEXT) TO authenticated, service_role;

COMMENT ON FUNCTION public.admin_set_staff_password(UUID, TEXT, TEXT) IS
  'Sets auth password for an active staff_members account. Requires staff.manage. Audited.';
