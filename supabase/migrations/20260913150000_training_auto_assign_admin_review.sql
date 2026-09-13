-- TRAINING AUTO-ASSIGN + ADMIN REVIEW INBOX (LOCAL first)
-- Decision provenance lives on reviews table (not mutating immutable assignment snapshot fields).
-- Coach override protection: progression_strategy = COACH_MANAGED → never auto-overwrite.

BEGIN;

CREATE TABLE IF NOT EXISTS public.training_assignment_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_kind TEXT NOT NULL DEFAULT 'EXISTING'
    CHECK (client_kind IN ('NEW', 'EXISTING')),
  decision_state TEXT NOT NULL
    CHECK (decision_state IN (
      'AUTO_ASSIGNED',
      'AUTO_UPDATED',
      'NO_CHANGE_REQUIRED',
      'REVIEW_REQUIRED',
      'COACH_OVERRIDE_ACTIVE',
      'BLOCKED_NO_EXACT_MATCH'
    )),
  quiz_goal TEXT,
  mapped_training_goal TEXT,
  training_level TEXT,
  training_environment TEXT,
  days_per_week INTEGER,
  equipment_summary TEXT,
  previous_template_id UUID REFERENCES public.program_templates(id) ON DELETE SET NULL,
  previous_template_slug TEXT,
  previous_assignment_id UUID REFERENCES public.client_program_assignments(id) ON DELETE SET NULL,
  recommended_template_id UUID REFERENCES public.program_templates(id) ON DELETE SET NULL,
  recommended_template_slug TEXT,
  assigned_template_id UUID REFERENCES public.program_templates(id) ON DELETE SET NULL,
  assigned_template_slug TEXT,
  assignment_id UUID REFERENCES public.client_program_assignments(id) ON DELETE SET NULL,
  assignment_source TEXT NOT NULL DEFAULT 'AUTO'
    CHECK (assignment_source IN ('AUTO', 'COACH', 'RECONCILE', 'SYSTEM')),
  reason_code TEXT,
  reason_summary TEXT,
  resolver_trace JSONB NOT NULL DEFAULT '{}'::jsonb,
  client_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_reviewed BOOLEAN NOT NULL DEFAULT false,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  effective_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS training_assignment_reviews_inbox_idx
  ON public.training_assignment_reviews (is_reviewed, created_at DESC);

CREATE INDEX IF NOT EXISTS training_assignment_reviews_client_idx
  ON public.training_assignment_reviews (client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS training_assignment_reviews_state_idx
  ON public.training_assignment_reviews (decision_state, created_at DESC);

ALTER TABLE public.training_assignment_reviews ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.training_assignment_reviews FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.training_assignment_reviews TO authenticated;
GRANT ALL ON public.training_assignment_reviews TO service_role;

CREATE POLICY training_assignment_reviews_admin_all ON public.training_assignment_reviews
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY training_assignment_reviews_own_select ON public.training_assignment_reviews
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());

CREATE OR REPLACE FUNCTION public.trg_training_assignment_reviews_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_training_assignment_reviews_updated_at ON public.training_assignment_reviews;
CREATE TRIGGER trg_training_assignment_reviews_updated_at
  BEFORE UPDATE ON public.training_assignment_reviews
  FOR EACH ROW EXECUTE FUNCTION public.trg_training_assignment_reviews_updated_at();

-- Idempotent upsert for AUTO / RECONCILE decisions
CREATE OR REPLACE FUNCTION public.admin_upsert_training_assignment_review(
  p_client_id UUID,
  p_client_kind TEXT,
  p_decision_state TEXT,
  p_idempotency_key TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS public.training_assignment_reviews
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.training_assignment_reviews;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') AND auth.uid() IS DISTINCT FROM p_client_id THEN
    -- service_role / admin only for other clients; clients may write own review via service path
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
      RAISE EXCEPTION 'not authorized';
    END IF;
  END IF;

  INSERT INTO public.training_assignment_reviews (
    client_id,
    client_kind,
    decision_state,
    quiz_goal,
    mapped_training_goal,
    training_level,
    training_environment,
    days_per_week,
    equipment_summary,
    previous_template_id,
    previous_template_slug,
    previous_assignment_id,
    recommended_template_id,
    recommended_template_slug,
    assigned_template_id,
    assigned_template_slug,
    assignment_id,
    assignment_source,
    reason_code,
    reason_summary,
    resolver_trace,
    client_context,
    idempotency_key,
    actor_id,
    effective_at,
    is_read,
    is_reviewed
  ) VALUES (
    p_client_id,
    COALESCE(NULLIF(p_client_kind, ''), 'EXISTING'),
    p_decision_state,
    p_payload->>'quiz_goal',
    p_payload->>'mapped_training_goal',
    p_payload->>'training_level',
    p_payload->>'training_environment',
    NULLIF(p_payload->>'days_per_week', '')::INTEGER,
    p_payload->>'equipment_summary',
    NULLIF(p_payload->>'previous_template_id', '')::UUID,
    p_payload->>'previous_template_slug',
    NULLIF(p_payload->>'previous_assignment_id', '')::UUID,
    NULLIF(p_payload->>'recommended_template_id', '')::UUID,
    p_payload->>'recommended_template_slug',
    NULLIF(p_payload->>'assigned_template_id', '')::UUID,
    p_payload->>'assigned_template_slug',
    NULLIF(p_payload->>'assignment_id', '')::UUID,
    COALESCE(p_payload->>'assignment_source', 'AUTO'),
    p_payload->>'reason_code',
    p_payload->>'reason_summary',
    COALESCE(p_payload->'resolver_trace', '{}'::jsonb),
    COALESCE(p_payload->'client_context', '{}'::jsonb),
    p_idempotency_key,
    auth.uid(),
    COALESCE(NULLIF(p_payload->>'effective_at', '')::TIMESTAMPTZ, now()),
    false,
    CASE
      WHEN p_decision_state = 'NO_CHANGE_REQUIRED' THEN true
      ELSE false
    END
  )
  ON CONFLICT (client_id, idempotency_key) DO UPDATE SET
    -- Keep existing row for true idempotency (no duplicate noise)
    updated_at = public.training_assignment_reviews.updated_at
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_training_assignment_reviews(
  p_reviewed BOOLEAN DEFAULT NULL,
  p_decision_state TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  client_id UUID,
  client_name TEXT,
  client_kind TEXT,
  decision_state TEXT,
  quiz_goal TEXT,
  mapped_training_goal TEXT,
  training_level TEXT,
  training_environment TEXT,
  days_per_week INTEGER,
  equipment_summary TEXT,
  previous_template_id UUID,
  previous_template_slug TEXT,
  previous_assignment_id UUID,
  recommended_template_id UUID,
  recommended_template_slug TEXT,
  assigned_template_id UUID,
  assigned_template_slug TEXT,
  assignment_id UUID,
  assignment_source TEXT,
  reason_code TEXT,
  reason_summary TEXT,
  resolver_trace JSONB,
  client_context JSONB,
  is_read BOOLEAN,
  is_reviewed BOOLEAN,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  effective_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  RETURN QUERY
  WITH filtered AS (
    SELECT r.*
    FROM public.training_assignment_reviews r
    WHERE (p_reviewed IS NULL OR r.is_reviewed = p_reviewed)
      AND (p_decision_state IS NULL OR r.decision_state = p_decision_state)
      -- Inbox: hide pure NO_CHANGE from default unread queue unless explicitly filtered
      AND (
        p_decision_state IS NOT NULL
        OR r.decision_state <> 'NO_CHANGE_REQUIRED'
      )
    ORDER BY r.created_at DESC
  ),
  counted AS (
    SELECT COUNT(*)::BIGINT AS total FROM filtered
  )
  SELECT
    f.id,
    f.client_id,
    COALESCE(p.full_name, p.email, f.client_id::TEXT) AS client_name,
    f.client_kind,
    f.decision_state,
    f.quiz_goal,
    f.mapped_training_goal,
    f.training_level,
    f.training_environment,
    f.days_per_week,
    f.equipment_summary,
    f.previous_template_id,
    f.previous_template_slug,
    f.previous_assignment_id,
    f.recommended_template_id,
    f.recommended_template_slug,
    f.assigned_template_id,
    f.assigned_template_slug,
    f.assignment_id,
    f.assignment_source,
    f.reason_code,
    f.reason_summary,
    f.resolver_trace,
    f.client_context,
    f.is_read,
    f.is_reviewed,
    f.reviewed_at,
    f.reviewed_by,
    f.effective_at,
    f.created_at,
    c.total
  FROM filtered f
  CROSS JOIN counted c
  LEFT JOIN public.profiles p ON p.id = f.client_id
  ORDER BY f.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 100))
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_mark_training_assignment_review(
  p_review_id UUID,
  p_mark_read BOOLEAN DEFAULT true,
  p_mark_reviewed BOOLEAN DEFAULT true
)
RETURNS public.training_assignment_reviews
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.training_assignment_reviews;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  UPDATE public.training_assignment_reviews
  SET
    is_read = CASE WHEN p_mark_read THEN true ELSE is_read END,
    is_reviewed = CASE WHEN p_mark_reviewed THEN true ELSE is_reviewed END,
    reviewed_at = CASE WHEN p_mark_reviewed THEN now() ELSE reviewed_at END,
    reviewed_by = CASE WHEN p_mark_reviewed THEN auth.uid() ELSE reviewed_by END
  WHERE id = p_review_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'review not found';
  END IF;
  RETURN v_row;
END;
$$;

-- Client-callable upsert (own row only) for new-client auto-assign notifications
CREATE OR REPLACE FUNCTION public.client_upsert_training_assignment_review(
  p_decision_state TEXT,
  p_idempotency_key TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS public.training_assignment_reviews
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_row public.training_assignment_reviews;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth required';
  END IF;

  INSERT INTO public.training_assignment_reviews (
    client_id,
    client_kind,
    decision_state,
    quiz_goal,
    mapped_training_goal,
    training_level,
    training_environment,
    days_per_week,
    equipment_summary,
    previous_template_id,
    previous_template_slug,
    previous_assignment_id,
    recommended_template_id,
    recommended_template_slug,
    assigned_template_id,
    assigned_template_slug,
    assignment_id,
    assignment_source,
    reason_code,
    reason_summary,
    resolver_trace,
    client_context,
    idempotency_key,
    actor_id,
    effective_at,
    is_reviewed
  ) VALUES (
    v_uid,
    COALESCE(NULLIF(p_payload->>'client_kind', ''), 'NEW'),
    p_decision_state,
    p_payload->>'quiz_goal',
    p_payload->>'mapped_training_goal',
    p_payload->>'training_level',
    p_payload->>'training_environment',
    NULLIF(p_payload->>'days_per_week', '')::INTEGER,
    p_payload->>'equipment_summary',
    NULLIF(p_payload->>'previous_template_id', '')::UUID,
    p_payload->>'previous_template_slug',
    NULLIF(p_payload->>'previous_assignment_id', '')::UUID,
    NULLIF(p_payload->>'recommended_template_id', '')::UUID,
    p_payload->>'recommended_template_slug',
    NULLIF(p_payload->>'assigned_template_id', '')::UUID,
    p_payload->>'assigned_template_slug',
    NULLIF(p_payload->>'assignment_id', '')::UUID,
    COALESCE(p_payload->>'assignment_source', 'AUTO'),
    p_payload->>'reason_code',
    p_payload->>'reason_summary',
    COALESCE(p_payload->'resolver_trace', '{}'::jsonb),
    COALESCE(p_payload->'client_context', '{}'::jsonb),
    p_idempotency_key,
    v_uid,
    COALESCE(NULLIF(p_payload->>'effective_at', '')::TIMESTAMPTZ, now()),
    CASE WHEN p_decision_state = 'NO_CHANGE_REQUIRED' THEN true ELSE false END
  )
  ON CONFLICT (client_id, idempotency_key) DO UPDATE SET
    updated_at = public.training_assignment_reviews.updated_at
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_upsert_training_assignment_review(UUID, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_training_assignment_reviews(BOOLEAN, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_mark_training_assignment_review(UUID, BOOLEAN, BOOLEAN) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.client_upsert_training_assignment_review(TEXT, TEXT, JSONB) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_upsert_training_assignment_review(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_training_assignment_reviews(BOOLEAN, TEXT, INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_mark_training_assignment_review(UUID, BOOLEAN, BOOLEAN) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.client_upsert_training_assignment_review(TEXT, TEXT, JSONB) TO authenticated, service_role;

-- Client self-assign from published template (AUTO_ASSIGNED only — no admin approval gate)
CREATE OR REPLACE FUNCTION public.client_auto_assign_program_template(
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
  v_uid UUID := auth.uid();
  v_template public.program_templates%ROWTYPE;
  v_status TEXT;
  v_id UUID;
  v_active UUID;
  v_scheduled UUID;
  v_week_count INT;
  v_progression TEXT;
  v_media_variant TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'auth required';
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
  WHERE client_id = v_uid AND status = 'active';
  SELECT id INTO v_scheduled FROM public.client_program_assignments
  WHERE client_id = v_uid AND status = 'scheduled';

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

  v_progression := NULLIF(v_template.metadata->'template_contract'->'progression'->'compatible_strategies'->>0, '');
  IF v_progression IS NULL OR v_progression NOT IN (
    'SMART_PROGRESSION_EXERCISE_LOCKED',
    'MATRIX_MANAGED_PROGRESSION',
    'COACH_MANAGED'
  ) THEN
    v_progression := 'SMART_PROGRESSION_EXERCISE_LOCKED';
  END IF;

  v_media_variant := upper(NULLIF(trim(v_template.metadata->'template_contract'->'media_preference'->>'preferred_media_variant'), ''));
  IF v_media_variant IS DISTINCT FROM 'FEMALE' THEN
    v_media_variant := 'STANDARD';
  END IF;

  INSERT INTO public.client_program_assignments (
    client_id, source_template_id, template_version, status, assigned_by, starts_on,
    name_ar, name_en, goal, level, duration_weeks, days_per_week,
    generation_source, progression_strategy, preferred_media_variant
  ) VALUES (
    v_uid, p_template_id, v_template.version, v_status, v_uid, COALESCE(p_starts_on, CURRENT_DATE),
    v_template.name_ar, v_template.name_en, v_template.goal::TEXT, v_template.level::TEXT,
    v_template.duration_weeks, v_template.days_per_week,
    'template', v_progression, v_media_variant
  )
  RETURNING id INTO v_id;

  PERFORM public._copy_template_to_assignment(v_id, p_template_id);

  RETURN public._assignment_tree(v_id);
END;
$$;

REVOKE ALL ON FUNCTION public.client_auto_assign_program_template(UUID, DATE, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.client_auto_assign_program_template(UUID, DATE, BOOLEAN) TO authenticated, service_role;

COMMENT ON TABLE public.training_assignment_reviews IS
  'Admin Review Inbox for template auto-assign / reconcile. AUTO decisions do not require approval to activate.';

COMMIT;
