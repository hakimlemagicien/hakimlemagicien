-- Coach hard priority: admin template assignment always freezes COACH_MANAGED.
-- Auto-assign / reconcile must not overwrite coach-assigned programs.

CREATE OR REPLACE FUNCTION public.admin_assign_client_program(
  p_client_id UUID,
  p_template_id UUID,
  p_starts_on DATE DEFAULT CURRENT_DATE,
  p_replace BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_template public.program_templates%ROWTYPE;
  v_status TEXT;
  v_id UUID;
  v_active UUID;
  v_scheduled UUID;
  v_week_count INT;
  v_progression TEXT;
  v_media_variant TEXT;
BEGIN
  v_admin := public._require_admin();

  IF p_client_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_client_id) THEN
    RAISE EXCEPTION 'invalid_client' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_template FROM public.program_templates WHERE id = p_template_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'template_not_found' USING ERRCODE = 'P0002';
  END IF;
  IF v_template.archived_at IS NOT NULL OR v_template.is_published IS NOT TRUE THEN
    RAISE EXCEPTION 'template_not_assignable' USING ERRCODE = '22023';
  END IF;

  SELECT count(*) INTO v_week_count FROM public.program_template_weeks WHERE template_id = p_template_id;
  IF v_week_count < 1 THEN
    RAISE EXCEPTION 'template_empty' USING ERRCODE = '22023';
  END IF;

  v_status := CASE WHEN p_starts_on IS NOT NULL AND p_starts_on > CURRENT_DATE THEN 'scheduled' ELSE 'active' END;

  SELECT id INTO v_active FROM public.client_program_assignments
  WHERE client_id = p_client_id AND status = 'active';
  SELECT id INTO v_scheduled FROM public.client_program_assignments
  WHERE client_id = p_client_id AND status = 'scheduled';

  IF v_status = 'active' AND v_active IS NOT NULL THEN
    IF p_replace IS NOT TRUE THEN
      RAISE EXCEPTION 'active_assignment_exists' USING ERRCODE = '22023';
    END IF;
    UPDATE public.client_program_assignments
    SET status = 'replaced', ended_at = now(), archived_at = now()
    WHERE id = v_active;
  END IF;

  IF v_status = 'scheduled' AND v_scheduled IS NOT NULL THEN
    IF p_replace IS NOT TRUE THEN
      RAISE EXCEPTION 'scheduled_assignment_exists' USING ERRCODE = '22023';
    END IF;
    UPDATE public.client_program_assignments
    SET status = 'cancelled', ended_at = now(), archived_at = now()
    WHERE id = v_scheduled;
  END IF;

  -- Hard coach priority: manual admin assign always COACH_MANAGED.
  v_progression := 'COACH_MANAGED';

  v_media_variant := upper(NULLIF(trim(v_template.metadata->'template_contract'->'media_preference'->>'preferred_media_variant'), ''));
  IF v_media_variant IS DISTINCT FROM 'FEMALE' THEN
    v_media_variant := 'STANDARD';
  END IF;

  INSERT INTO public.client_program_assignments (
    client_id, source_template_id, template_version, status, assigned_by, starts_on,
    name_ar, name_en, goal, level, duration_weeks, days_per_week,
    generation_source, progression_strategy, preferred_media_variant
  ) VALUES (
    p_client_id, p_template_id, v_template.version, v_status, v_admin, COALESCE(p_starts_on, CURRENT_DATE),
    v_template.name_ar, v_template.name_en, v_template.goal::TEXT, v_template.level::TEXT,
    v_template.duration_weeks, v_template.days_per_week,
    'template', v_progression, v_media_variant
  )
  RETURNING id INTO v_id;

  PERFORM public._copy_template_to_assignment(v_id, p_template_id);

  PERFORM public._write_audit_event(
    v_admin,
    p_client_id,
    CASE WHEN v_active IS NOT NULL AND v_status = 'active' THEN 'client_program_replaced' ELSE 'client_program_assigned' END,
    jsonb_build_object(
      'assignment_id', v_id,
      'template_id', p_template_id,
      'template_version', v_template.version,
      'replaced_assignment_id', v_active,
      'status', v_status,
      'progression_strategy', v_progression,
      'preferred_media_variant', v_media_variant,
      'coach_priority', true
    )
  );

  RETURN public._assignment_tree(v_id);
END;
$$;

COMMENT ON FUNCTION public.admin_assign_client_program(UUID, UUID, DATE, BOOLEAN) IS
  'Admin assigns a published program template snapshot to a client. Always freezes progression_strategy=COACH_MANAGED (coach hard priority).';
