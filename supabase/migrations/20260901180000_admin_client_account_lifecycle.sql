-- MAAKFIT Admin V1 — Client account lifecycle (suspend / archive / safe deletion).
-- Staging-first. Does not rewrite Matrix, Core 100, payments ledger, or provider truth.
-- Does not CASCADE-delete client graphs. Auth users are banned, not deleted.

-- ---------------------------------------------------------------------------
-- Ownership classification (audit, not CASCADE policy)
-- A DELETE/ANONYMIZE: profiles PII (name, email, phone, avatar)
-- B ANONYMIZE: quiz_answers.answers PII keys if present
-- C RETAIN: memberships, payments, payment_provider_events, audit_events,
--           workout_set_logs, client_program_assignments + snapshots,
--           client_nutrition_assignments + logs, coach_client_notes,
--           coaching_conversations/messages, support_tickets, leads
-- D BLOCK UNTIL RESOLVED: paid active / past_due membership, provider cancel
--           pending, submitted legacy lead, failed provider events for user
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS account_status_reason TEXT,
  ADD COLUMN IF NOT EXISTS account_status_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS account_status_changed_by UUID,
  ADD COLUMN IF NOT EXISTS account_deleted_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_account_status_chk'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_account_status_chk
      CHECK (account_status IN ('active', 'suspended', 'archived', 'deletion_pending'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS profiles_account_status_idx
  ON public.profiles (account_status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.client_account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id),
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  confirmation_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'blocked', 'executed')),
  idempotency_key TEXT NOT NULL,
  block_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS client_account_deletion_idempotency_idx
  ON public.client_account_deletion_requests (idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS client_account_deletion_open_idx
  ON public.client_account_deletion_requests (client_id)
  WHERE status IN ('pending', 'executed');

ALTER TABLE public.client_account_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_account_deletion_requests_admin_select ON public.client_account_deletion_requests;
CREATE POLICY client_account_deletion_requests_admin_select
  ON public.client_account_deletion_requests
  FOR SELECT TO authenticated
  USING (public.has_staff_portal_access(auth.uid()));

REVOKE INSERT, UPDATE, DELETE ON public.client_account_deletion_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.client_account_deletion_requests TO authenticated;
GRANT ALL ON public.client_account_deletion_requests TO service_role;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.client_account_deletion_blockers(p_client_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_codes TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.user_id = p_client_id
      AND m.is_active = true
      AND lower(COALESCE(m.tier, 'free')) NOT IN ('free', '')
      AND COALESCE(m.subscription_status::text, 'active') IN ('active', 'past_due', 'cancel_at_period_end')
  ) THEN
    v_codes := array_append(v_codes, 'active_paid_subscription');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.user_id = p_client_id
      AND m.is_active = true
      AND m.cancel_at_period_end = true
      AND COALESCE(m.auto_renew, true) = false
  ) THEN
    v_codes := array_append(v_codes, 'provider_confirmation_pending');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.user_id = p_client_id
      AND m.subscription_status = 'past_due'
  ) THEN
    v_codes := array_append(v_codes, 'payment_exception');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.leads l
    WHERE l.user_id = p_client_id
      AND l.payment_status = 'submitted'
  ) THEN
    v_codes := array_append(v_codes, 'legacy_payment_pending');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.payment_provider_events e
    WHERE e.user_id = p_client_id
      AND e.processing_status = 'failed'
  ) THEN
    v_codes := array_append(v_codes, 'provider_event_failed');
  END IF;

  RETURN to_jsonb(ARRAY(SELECT DISTINCT unnest(v_codes)));
END;
$$;

CREATE OR REPLACE FUNCTION public.client_account_deletion_impact()
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT jsonb_build_object(
    'will_process', jsonb_build_array(
      'بيانات الحساب',
      'الملف الشخصي الظاهر',
      'البيانات الشخصية القابلة للحذف',
      'تعيينات التشغيل الحالية تُترك دون إعادة كتابة تاريخها'
    ),
    'will_retain', jsonb_build_array(
      'سجل الفوترة والمدفوعات',
      'أحداث مزود الدفع',
      'سجل التدقيق',
      'تاريخ التدريب المكتمل والتعيينات',
      'تاريخ التغذية',
      'الملاحظات الداخلية'
    ),
    'will_not', jsonb_build_array(
      'إلغاء الاشتراك لدى المزود',
      'منح أو إلغاء استرداد',
      'تغيير حالة الدفع يدويًا',
      'إعادة كتابة قرارات المصفوفة'
    )
  );
$$;

-- ---------------------------------------------------------------------------
-- Status transitions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_set_client_account_status(
  p_client_id UUID,
  p_action TEXT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_prev TEXT;
  v_next TEXT;
  v_event TEXT;
  v_reason TEXT := btrim(COALESCE(p_reason, ''));
BEGIN
  v_admin := public._require_staff_permission('clients.write');

  IF p_client_id IS NULL THEN
    RAISE EXCEPTION 'invalid_client' USING ERRCODE = '22023';
  END IF;
  IF char_length(v_reason) < 5 THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE = '22023';
  END IF;
  IF p_action NOT IN ('suspend', 'reactivate', 'archive', 'restore') THEN
    RAISE EXCEPTION 'invalid_action' USING ERRCODE = '22023';
  END IF;

  SELECT account_status INTO v_prev
  FROM public.profiles
  WHERE id = p_client_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_client' USING ERRCODE = '22023';
  END IF;

  IF v_prev = 'deletion_pending' THEN
    RAISE EXCEPTION 'deletion_in_progress' USING ERRCODE = 'P0001';
  END IF;

  IF p_action = 'suspend' THEN
    v_next := 'suspended';
    v_event := 'client_account_suspended';
  ELSIF p_action = 'reactivate' THEN
    IF v_prev NOT IN ('suspended', 'archived') THEN
      RAISE EXCEPTION 'invalid_transition' USING ERRCODE = 'P0001';
    END IF;
    v_next := 'active';
    v_event := CASE WHEN v_prev = 'archived' THEN 'client_account_restored' ELSE 'client_account_reactivated' END;
  ELSIF p_action = 'archive' THEN
    v_next := 'archived';
    v_event := 'client_account_archived';
  ELSE
    IF v_prev <> 'archived' THEN
      RAISE EXCEPTION 'invalid_transition' USING ERRCODE = 'P0001';
    END IF;
    v_next := 'active';
    v_event := 'client_account_restored';
  END IF;

  IF v_prev = v_next THEN
    RETURN jsonb_build_object(
      'ok', true,
      'client_id', p_client_id,
      'previous_status', v_prev,
      'new_status', v_next,
      'unchanged', true
    );
  END IF;

  UPDATE public.profiles
  SET
    account_status = v_next,
    account_status_reason = v_reason,
    account_status_changed_at = now(),
    account_status_changed_by = v_admin,
    updated_at = now()
  WHERE id = p_client_id;

  PERFORM public._write_audit_event(
    v_admin,
    p_client_id,
    v_event,
    jsonb_build_object(
      'action', p_action,
      'previous_status', v_prev,
      'new_status', v_next,
      'reason', left(v_reason, 240)
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'client_id', p_client_id,
    'previous_status', v_prev,
    'new_status', v_next,
    'unchanged', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_preview_client_account_deletion(p_client_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_blockers JSONB;
BEGIN
  PERFORM public._require_staff_permission('staff.manage');
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_client_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_client' USING ERRCODE = '22023';
  END IF;
  v_blockers := public.client_account_deletion_blockers(p_client_id);
  RETURN jsonb_build_object(
    'client_id', p_client_id,
    'email', v_profile.email,
    'full_name', v_profile.full_name,
    'account_status', v_profile.account_status,
    'already_executed', v_profile.account_deleted_at IS NOT NULL,
    'blockers', v_blockers,
    'blocked', jsonb_array_length(v_blockers) > 0,
    'impact', public.client_account_deletion_impact()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_execute_client_account_deletion(
  p_client_id UUID,
  p_reason TEXT,
  p_confirmation_email TEXT,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID;
  v_profile public.profiles%ROWTYPE;
  v_reason TEXT := btrim(COALESCE(p_reason, ''));
  v_email TEXT := lower(btrim(COALESCE(p_confirmation_email, '')));
  v_key TEXT := NULLIF(btrim(COALESCE(p_idempotency_key, '')), '');
  v_blockers JSONB;
  v_existing public.client_account_deletion_requests%ROWTYPE;
  v_request_id UUID;
  v_anon_email TEXT;
BEGIN
  v_admin := public._require_staff_permission('staff.manage');

  IF p_client_id IS NULL OR v_key IS NULL THEN
    RAISE EXCEPTION 'invalid_request' USING ERRCODE = '22023';
  END IF;
  IF p_client_id = v_admin THEN
    RAISE EXCEPTION 'cannot_delete_self' USING ERRCODE = 'P0001';
  END IF;
  IF public.resolve_staff_role(p_client_id) IS NOT NULL THEN
    RAISE EXCEPTION 'cannot_delete_staff' USING ERRCODE = 'P0001';
  END IF;
  IF char_length(v_reason) < 5 THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_existing
  FROM public.client_account_deletion_requests
  WHERE idempotency_key = v_key;
  IF FOUND THEN
    IF v_existing.client_id IS DISTINCT FROM p_client_id THEN
      RAISE EXCEPTION 'idempotency_conflict' USING ERRCODE = 'P0001';
    END IF;
    RETURN jsonb_build_object(
      'ok', v_existing.status = 'executed',
      'duplicate', true,
      'request_id', v_existing.id,
      'status', v_existing.status,
      'blockers', v_existing.block_codes
    );
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_client_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_client' USING ERRCODE = '22023';
  END IF;

  IF v_profile.account_deleted_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'duplicate', true,
      'status', 'executed',
      'client_id', p_client_id
    );
  END IF;

  IF lower(btrim(COALESCE(v_profile.email, ''))) IS DISTINCT FROM v_email OR v_email = '' THEN
    RAISE EXCEPTION 'confirmation_mismatch' USING ERRCODE = '22023';
  END IF;

  v_blockers := public.client_account_deletion_blockers(p_client_id);
  IF jsonb_array_length(v_blockers) > 0 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'blocked', true,
      'blockers', v_blockers,
      'client_id', p_client_id
    );
  END IF;

  v_request_id := gen_random_uuid();

  INSERT INTO public.client_account_deletion_requests (
    id, client_id, requested_by, reason, confirmation_email, status, idempotency_key, block_codes
  ) VALUES (
    v_request_id,
    p_client_id,
    v_admin,
    v_reason,
    v_email,
    'pending',
    v_key,
    v_blockers
  );

  PERFORM public._write_audit_event(
    v_admin,
    p_client_id,
    'client_account_deletion_requested',
    jsonb_build_object(
      'request_id', v_request_id,
      'previous_status', v_profile.account_status,
      'new_status', 'deletion_pending',
      'reason', left(v_reason, 240),
      'blocked', false
    )
  );

  v_anon_email := 'deleted+' || replace(p_client_id::text, '-', '') || '@invalid.local';

  UPDATE public.profiles
  SET
    full_name = 'حساب محذوف',
    email = v_anon_email,
    phone = NULL,
    avatar_path = NULL,
    account_status = 'deletion_pending',
    account_status_reason = v_reason,
    account_status_changed_at = now(),
    account_status_changed_by = v_admin,
    account_deleted_at = now(),
    updated_at = now()
  WHERE id = p_client_id;

  UPDATE public.quiz_answers
  SET
    answers = COALESCE(answers, '{}'::jsonb) - 'fullName' - 'full_name' - 'phone' - 'email',
    updated_at = now()
  WHERE user_id = p_client_id;

  BEGIN
    UPDATE auth.users
    SET
      banned_until = 'infinity'::timestamptz,
      raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('account_deleted', true)
    WHERE id = p_client_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  UPDATE public.client_account_deletion_requests
  SET status = 'executed', executed_at = now(), updated_at = now()
  WHERE id = v_request_id;

  PERFORM public._write_audit_event(
    v_admin,
    p_client_id,
    'client_account_deletion_executed',
    jsonb_build_object(
      'request_id', v_request_id,
      'previous_status', v_profile.account_status,
      'new_status', 'deletion_pending',
      'reason', left(v_reason, 240)
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'request_id', v_request_id,
    'status', 'executed',
    'client_id', p_client_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_account_lifecycle()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_status TEXT := 'active';
  v_deleted TIMESTAMPTZ;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication_required' USING ERRCODE = '42501';
  END IF;
  IF public.has_staff_portal_access(v_uid) THEN
    RETURN jsonb_build_object('status', 'active', 'blocked', false, 'staff', true);
  END IF;
  SELECT account_status, account_deleted_at
  INTO v_status, v_deleted
  FROM public.profiles
  WHERE id = v_uid;
  RETURN jsonb_build_object(
    'status', COALESCE(v_status, 'active'),
    'blocked', COALESCE(v_status, 'active') IN ('suspended', 'deletion_pending'),
    'deleted', v_deleted IS NOT NULL,
    'staff', false
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Directory + overview
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.admin_list_clients(TEXT, TEXT, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.admin_list_clients(
  p_query TEXT DEFAULT NULL,
  p_plan TEXT DEFAULT NULL,
  p_onboarding TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 25,
  p_offset INTEGER DEFAULT 0,
  p_account_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_path TEXT,
  goal TEXT,
  city TEXT,
  membership_plan TEXT,
  membership_active BOOLEAN,
  onboarding_completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  unread_coaching_count INTEGER,
  waiting_coaching BOOLEAN,
  created_at TIMESTAMPTZ,
  account_status TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 25), 1), 25);
  v_offset INTEGER := GREATEST(COALESCE(p_offset, 0), 0);
  v_raw TEXT := NULLIF(btrim(COALESCE(p_query, '')), '');
  v_q TEXT := NULL;
  v_plan TEXT := NULLIF(lower(btrim(COALESCE(p_plan, ''))), '');
  v_onb TEXT := NULLIF(lower(btrim(COALESCE(p_onboarding, ''))), '');
  v_acc TEXT := NULLIF(lower(btrim(COALESCE(p_account_status, ''))), '');
BEGIN
  PERFORM public._require_admin();

  IF v_onb IS NOT NULL AND v_onb NOT IN ('complete', 'incomplete') THEN
    RAISE EXCEPTION 'invalid_onboarding_filter' USING ERRCODE = '22023';
  END IF;
  IF v_acc IS NOT NULL AND v_acc NOT IN ('all', 'active', 'suspended', 'archived', 'deletion_pending') THEN
    RAISE EXCEPTION 'invalid_account_status_filter' USING ERRCODE = '22023';
  END IF;
  IF v_raw IS NOT NULL AND char_length(v_raw) < 2 THEN
    RETURN;
  END IF;
  IF v_raw IS NOT NULL THEN
    v_q := replace(replace(replace(v_raw, '\', '\\'), '%', '\%'), '_', '\_');
  END IF;

  RETURN QUERY
  WITH filtered AS (
    SELECT
      p.id,
      p.full_name,
      p.email,
      p.phone,
      p.avatar_path,
      p.goal,
      p.city,
      p.onboarding_completed_at,
      p.created_at,
      p.account_status,
      m.tier AS membership_plan,
      m.is_active AS membership_active
    FROM public.profiles p
    LEFT JOIN LATERAL (
      SELECT mem.tier, mem.is_active
      FROM public.memberships mem
      WHERE mem.user_id = p.id AND mem.is_active = true
      ORDER BY mem.starts_at DESC
      LIMIT 1
    ) m ON true
    WHERE
      (v_q IS NULL OR (
        p.full_name ILIKE '%' || v_q || '%' ESCAPE '\'
        OR p.email ILIKE '%' || v_q || '%' ESCAPE '\'
        OR p.phone ILIKE '%' || v_q || '%' ESCAPE '\'
      ))
      AND (v_plan IS NULL OR lower(COALESCE(m.tier, '')) = v_plan)
      AND (
        v_onb IS NULL
        OR (v_onb = 'complete' AND p.onboarding_completed_at IS NOT NULL)
        OR (v_onb = 'incomplete' AND p.onboarding_completed_at IS NULL)
      )
      AND (
        (v_acc IS NULL AND p.account_status IN ('active', 'suspended', 'deletion_pending'))
        OR v_acc = 'all'
        OR p.account_status = v_acc
      )
  ),
  counted AS (
    SELECT f.*, COUNT(*) OVER() AS total_count
    FROM filtered f
  ),
  page AS (
    SELECT *
    FROM counted
    ORDER BY created_at DESC
    LIMIT v_limit
    OFFSET v_offset
  )
  SELECT
    pg.id,
    pg.full_name,
    pg.email,
    pg.phone,
    pg.avatar_path,
    pg.goal,
    pg.city,
    pg.membership_plan,
    pg.membership_active,
    pg.onboarding_completed_at,
    GREATEST(w.last_workout_at, c.last_message_at) AS last_activity_at,
    COALESCE(c.unread_count, 0) AS unread_coaching_count,
    COALESCE(c.status = 'waiting_for_reply', false) AS waiting_coaching,
    pg.created_at,
    pg.account_status,
    pg.total_count
  FROM page pg
  LEFT JOIN LATERAL (
    SELECT MAX(wsl.created_at) AS last_workout_at
    FROM public.workout_set_logs wsl
    WHERE wsl.user_id = pg.id
  ) w ON true
  LEFT JOIN LATERAL (
    SELECT
      conv.last_message_at,
      conv.status,
      (
        SELECT COUNT(*)::int
        FROM public.coaching_messages msg
        WHERE msg.conversation_id = conv.id
          AND msg.actor = 'member'
          AND (conv.coach_last_read_at IS NULL OR msg.created_at > conv.coach_last_read_at)
      ) AS unread_count
    FROM public.coaching_conversations conv
    WHERE conv.member_id = pg.id
    ORDER BY conv.created_at DESC
    LIMIT 1
  ) c ON true;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_client_overview(p_client_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_membership JSONB;
  v_coaching JSONB;
  v_assignment JSONB;
  v_nutrition JSONB;
  v_last_workout TIMESTAMPTZ;
  v_last_nutrition TIMESTAMPTZ;
  v_notes_count INTEGER;
  v_open_support INTEGER;
BEGIN
  PERFORM public._require_admin();
  IF p_client_id IS NULL THEN
    RAISE EXCEPTION 'invalid_client' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_client_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'tier', mem.tier, 'is_active', mem.is_active, 'source', mem.source,
    'starts_at', mem.starts_at, 'ends_at', mem.ends_at,
    'billing_period_months', mem.billing_period_months, 'paid_period_end', mem.paid_period_end,
    'auto_renew', mem.auto_renew, 'cancel_at_period_end', mem.cancel_at_period_end,
    'next_renewal_at', mem.next_renewal_at
  )
  INTO v_membership
  FROM public.memberships mem
  WHERE mem.user_id = p_client_id AND mem.is_active = true
  ORDER BY mem.starts_at DESC
  LIMIT 1;

  SELECT jsonb_build_object(
    'conversation_id', conv.id, 'status', conv.status, 'last_message_at', conv.last_message_at,
    'unread_count', (
      SELECT COUNT(*)::int FROM public.coaching_messages msg
      WHERE msg.conversation_id = conv.id AND msg.actor = 'member'
        AND (conv.coach_last_read_at IS NULL OR msg.created_at > conv.coach_last_read_at)
    )
  )
  INTO v_coaching
  FROM public.coaching_conversations conv
  WHERE conv.member_id = p_client_id
  ORDER BY conv.created_at DESC
  LIMIT 1;

  SELECT jsonb_build_object(
    'id', a.id, 'source_template_id', a.source_template_id, 'template_version', a.template_version,
    'status', a.status, 'assigned_at', a.assigned_at, 'starts_on', a.starts_on,
    'name_ar', a.name_ar, 'duration_weeks', a.duration_weeks,
    'snapshot_complete', EXISTS (SELECT 1 FROM public.client_program_weeks w WHERE w.assignment_id = a.id)
  )
  INTO v_assignment
  FROM public.client_program_assignments a
  WHERE a.client_id = p_client_id AND a.status IN ('active', 'scheduled')
  ORDER BY CASE a.status WHEN 'active' THEN 0 ELSE 1 END
  LIMIT 1;

  SELECT jsonb_build_object(
    'id', n.id, 'status', n.status, 'name_ar', n.name_ar, 'starts_on', n.starts_on,
    'assigned_at', n.assigned_at, 'snapshot_complete', EXISTS (
      SELECT 1 FROM public.client_nutrition_slots s WHERE s.assignment_id = n.id
    ),
    'allergen_conflict', EXISTS (
      SELECT 1 FROM public.client_nutrition_slots s
      WHERE s.assignment_id = n.id AND public._allergen_overlap(n.watch_allergens, s.allergens)
    )
  )
  INTO v_nutrition
  FROM public.client_nutrition_assignments n
  WHERE n.client_id = p_client_id AND n.status IN ('active', 'scheduled')
  ORDER BY CASE n.status WHEN 'active' THEN 0 ELSE 1 END
  LIMIT 1;

  SELECT MAX(wsl.created_at) INTO v_last_workout
  FROM public.workout_set_logs wsl WHERE wsl.user_id = p_client_id;
  SELECT MAX(l.created_at) INTO v_last_nutrition
  FROM public.client_nutrition_meal_logs l WHERE l.user_id = p_client_id;
  SELECT COUNT(*)::int INTO v_notes_count
  FROM public.coach_client_notes n WHERE n.client_id = p_client_id AND n.archived_at IS NULL;
  SELECT COUNT(*)::int INTO v_open_support
  FROM public.support_tickets t WHERE t.user_id = p_client_id AND t.status IN ('received', 'in_review');

  RETURN jsonb_build_object(
    'id', v_profile.id, 'full_name', v_profile.full_name, 'email', v_profile.email,
    'phone', v_profile.phone, 'avatar_path', v_profile.avatar_path, 'goal', v_profile.goal,
    'city', v_profile.city, 'training_type', v_profile.training_type,
    'program_start_date', v_profile.program_start_date,
    'onboarding_completed_at', v_profile.onboarding_completed_at, 'created_at', v_profile.created_at,
    'account_status', v_profile.account_status,
    'account_deleted_at', v_profile.account_deleted_at,
    'membership', v_membership, 'coaching', v_coaching, 'assignment', v_assignment,
    'nutrition_assignment', v_nutrition,
    'last_workout_at', v_last_workout, 'last_nutrition_at', v_last_nutrition,
    'notes_count', v_notes_count, 'open_support_count', v_open_support
  );
END;
$$;

REVOKE ALL ON FUNCTION public.client_account_deletion_blockers(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.client_account_deletion_impact() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_client_account_status(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_preview_client_account_deletion(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_execute_client_account_deletion(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_account_lifecycle() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_clients(TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_client_overview(UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.client_account_deletion_blockers(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.client_account_deletion_impact() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_client_account_status(UUID, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_preview_client_account_deletion(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_execute_client_account_deletion(UUID, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_account_lifecycle() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_clients(TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_client_overview(UUID) TO authenticated, service_role;

COMMENT ON FUNCTION public.admin_execute_client_account_deletion(UUID, TEXT, TEXT, TEXT) IS
  'Super-admin only. Anonymizes PII and bans auth login. Retains billing, audit, training, nutrition history. No PSP mutation.';
