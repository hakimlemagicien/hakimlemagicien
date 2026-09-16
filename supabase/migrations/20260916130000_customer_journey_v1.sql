-- MAAKFIT Customer Journey V1 — based on main@54be8ba
-- Persistent first-app preparation, deterministic assignment, safe FREE preview.

BEGIN;

CREATE TABLE IF NOT EXISTS public.product_runtime_settings (
  singleton BOOLEAN PRIMARY KEY DEFAULT true CHECK (singleton),
  first_app_preparation_minutes INTEGER NOT NULL DEFAULT 120 CHECK (first_app_preparation_minutes BETWEEN 1 AND 1440),
  missing_input_window_minutes INTEGER NOT NULL DEFAULT 10 CHECK (missing_input_window_minutes BETWEEN 1 AND 120),
  rollout_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.product_runtime_settings (singleton) VALUES (true) ON CONFLICT (singleton) DO NOTHING;
REVOKE ALL ON public.product_runtime_settings FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.product_runtime_settings TO service_role;

CREATE TABLE IF NOT EXISTS public.client_customer_journeys (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('preparing','needs_training_days','complete_setup','ready','failed')),
  preparation_started_at TIMESTAMPTZ NOT NULL,
  preparation_ready_at TIMESTAMPTZ NOT NULL,
  extra_window_ends_at TIMESTAMPTZ,
  preferred_training_days INTEGER CHECK (preferred_training_days BETWEEN 2 AND 6),
  normalized_training_days INTEGER CHECK (normalized_training_days BETWEEN 3 AND 6),
  training_meal_window TEXT CHECK (training_meal_window IN (
    'before_breakfast','after_breakfast','before_lunch','after_lunch',
    'before_evening_meal','after_evening_meal','before_dinner','after_dinner'
  )),
  matched_template_id UUID REFERENCES public.program_templates(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES public.client_program_assignments(id) ON DELETE SET NULL,
  failure_code TEXT,
  grandfathered BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS trg_client_customer_journeys_updated_at ON public.client_customer_journeys;
CREATE TRIGGER trg_client_customer_journeys_updated_at BEFORE UPDATE ON public.client_customer_journeys
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.client_customer_journeys ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.client_customer_journeys FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.client_customer_journeys TO authenticated;
GRANT ALL ON public.client_customer_journeys TO service_role;
DROP POLICY IF EXISTS client_customer_journeys_own_select ON public.client_customer_journeys;
CREATE POLICY client_customer_journeys_own_select ON public.client_customer_journeys
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public._customer_journey_json(p_user_id UUID)
RETURNS JSONB LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'phase', status,
    'preparation_started_at', preparation_started_at,
    'preparation_ready_at', preparation_ready_at,
    'extra_window_ends_at', extra_window_ends_at,
    'preferred_training_days', preferred_training_days,
    'normalized_training_days', normalized_training_days,
    'training_meal_window', training_meal_window,
    'matched_template_id', matched_template_id,
    'assignment_id', assignment_id,
    'failure_code', failure_code,
    'grandfathered', grandfathered
  ) FROM public.client_customer_journeys WHERE user_id = p_user_id
$$;

CREATE OR REPLACE FUNCTION public._finalize_customer_journey(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_journey public.client_customer_journeys%ROWTYPE;
  v_answers JSONB := '{}'::jsonb;
  v_profile_goal TEXT;
  v_gender TEXT;
  v_goal TEXT;
  v_level TEXT;
  v_template_id UUID;
  v_assignment_id UUID;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));
  SELECT * INTO v_journey FROM public.client_customer_journeys WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_journey.status = 'ready' OR v_journey.preferred_training_days IS NULL THEN RETURN; END IF;

  SELECT id INTO v_assignment_id FROM public.client_program_assignments
  WHERE client_id = p_user_id AND status IN ('active','scheduled')
  ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, assigned_at DESC LIMIT 1;
  IF v_assignment_id IS NOT NULL THEN
    UPDATE public.client_customer_journeys SET status='ready', assignment_id=v_assignment_id,
      completed_at=COALESCE(completed_at,now()), failure_code=NULL WHERE user_id=p_user_id;
    RETURN;
  END IF;

  SELECT tp.goal, COALESCE(tp.answers, '{}'::jsonb)
  INTO v_profile_goal, v_answers FROM public.training_profiles tp WHERE tp.user_id = p_user_id;
  v_gender := lower(COALESCE(v_answers->>'gender',''));
  v_level := lower(COALESCE(v_answers->>'trainingLevel', v_answers->>'training_level',
    v_answers->>'experienceLevel', v_answers->>'experience_level',
    CASE lower(COALESCE(v_answers->>'activityLevel',v_answers->>'activity_level',''))
      WHEN 'high' THEN 'intermediate' WHEN 'veryhigh' THEN 'intermediate'
      WHEN 'athlete' THEN 'intermediate' ELSE 'beginner' END));
  IF v_level NOT IN ('beginner','intermediate','advanced') THEN v_level := 'beginner'; END IF;
  v_goal := CASE lower(COALESCE(v_profile_goal,v_answers->>'goalId',v_answers->>'goal_id',''))
    WHEN 'fat' THEN 'cut' WHEN 'waist' THEN 'cut' WHEN 'cut' THEN 'cut' WHEN 'fat_loss' THEN 'cut'
    WHEN 'muscle' THEN 'bulk' WHEN 'gain' THEN 'bulk' WHEN 'muscle_gain' THEN 'bulk'
    WHEN 'glutes' THEN 'bulk' WHEN 'tone' THEN 'bulk' WHEN 'bulk' THEN 'bulk'
    WHEN 'recomp' THEN 'recomp' WHEN 'body_recomposition' THEN 'recomp'
    WHEN 'fitness' THEN 'fitness' WHEN 'fit' THEN 'fitness' WHEN 'athletic' THEN 'fitness'
    WHEN 'shape' THEN 'fitness' WHEN 'body' THEN 'fitness' ELSE NULL END;
  IF v_gender NOT IN ('male','female') OR v_goal IS NULL THEN
    UPDATE public.client_customer_journeys SET status='complete_setup',
      failure_code=CASE WHEN v_gender NOT IN ('male','female') THEN 'missing_profile_gender' ELSE 'missing_profile_goal' END
    WHERE user_id=p_user_id;
    RETURN;
  END IF;

  SELECT t.id INTO v_template_id FROM public.program_templates t
  WHERE t.is_published IS TRUE AND t.archived_at IS NULL AND t.goal::text=v_goal
    AND (t.level IS NULL OR t.level::text=v_level)
    -- Fail closed on explicit presentation contradictions even when legacy taxonomy is wrong.
    AND NOT (v_goal='bulk' AND t.name_ar ILIKE '%خسارة الدهون%')
    AND NOT (v_goal='cut' AND (t.name_ar ILIKE '%بناء العضلات%' OR t.name_ar ILIKE '%تضخيم%'))
    AND lower(COALESCE(NULLIF(t.metadata->>'target_gender',''),
      NULLIF(t.metadata->'template_contract'->>'target_gender',''),
      NULLIF(t.metadata->>'audience_gender',''), NULLIF(t.metadata->>'gender',''), '')) IN (v_gender,'all')
    AND EXISTS (SELECT 1 FROM public.program_template_weeks w WHERE w.template_id=t.id)
  ORDER BY abs(t.days_per_week-v_journey.normalized_training_days),
    CASE WHEN t.days_per_week>v_journey.normalized_training_days THEN 1 ELSE 0 END,
    CASE WHEN lower(COALESCE(t.metadata->>'target_gender',t.metadata->'template_contract'->>'target_gender',t.metadata->>'audience_gender',t.metadata->>'gender',''))=v_gender THEN 0 ELSE 1 END,
    CASE WHEN t.level::text=v_level THEN 0 ELSE 1 END, t.version DESC, t.id
  LIMIT 1;
  IF v_template_id IS NULL THEN
    UPDATE public.client_customer_journeys SET status='failed',failure_code='no_compatible_template' WHERE user_id=p_user_id;
    RETURN;
  END IF;

  PERFORM public.client_auto_assign_program_template(v_template_id, CURRENT_DATE, false);
  SELECT id INTO v_assignment_id FROM public.client_program_assignments
  WHERE client_id=p_user_id AND status='active' ORDER BY assigned_at DESC LIMIT 1;
  UPDATE public.client_customer_journeys SET status='ready', matched_template_id=v_template_id,
    assignment_id=v_assignment_id, completed_at=now(), failure_code=NULL WHERE user_id=p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.client_get_or_start_customer_journey()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_settings public.product_runtime_settings%ROWTYPE;
  v_profile_created TIMESTAMPTZ;
  v_existing BOOLEAN;
  v_has_assignment BOOLEAN;
  v_journey public.client_customer_journeys%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'authentication_required' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_settings FROM public.product_runtime_settings WHERE singleton=true;
  SELECT created_at INTO v_profile_created FROM public.profiles WHERE id=v_user;
  IF v_profile_created IS NULL THEN RAISE EXCEPTION 'profile_required' USING ERRCODE='22023'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.client_program_assignments WHERE client_id=v_user AND status IN ('active','scheduled')) INTO v_has_assignment;
  v_existing := v_profile_created < v_settings.rollout_started_at OR v_has_assignment;
  INSERT INTO public.client_customer_journeys(user_id,status,preparation_started_at,preparation_ready_at,completed_at,grandfathered)
  VALUES(v_user,CASE WHEN v_existing THEN 'ready' ELSE 'preparing' END,now(),
    CASE WHEN v_existing THEN now() ELSE now()+make_interval(mins=>v_settings.first_app_preparation_minutes) END,
    CASE WHEN v_existing THEN now() ELSE NULL END,v_existing)
  ON CONFLICT(user_id) DO NOTHING;
  SELECT * INTO v_journey FROM public.client_customer_journeys WHERE user_id=v_user FOR UPDATE;
  IF v_has_assignment THEN
    UPDATE public.client_customer_journeys SET status='ready',completed_at=COALESCE(completed_at,now()) WHERE user_id=v_user;
  ELSIF v_journey.status<>'ready' AND now()>=v_journey.preparation_ready_at THEN
    IF v_journey.preferred_training_days IS NOT NULL THEN
      PERFORM public._finalize_customer_journey(v_user);
    ELSE
      UPDATE public.client_customer_journeys SET
        extra_window_ends_at=COALESCE(extra_window_ends_at,preparation_ready_at+make_interval(mins=>v_settings.missing_input_window_minutes)),
        status=CASE WHEN now()<COALESCE(extra_window_ends_at,preparation_ready_at+make_interval(mins=>v_settings.missing_input_window_minutes)) THEN 'needs_training_days' ELSE 'complete_setup' END
      WHERE user_id=v_user;
    END IF;
  END IF;
  UPDATE public.profiles SET first_login_seen_at=COALESCE(first_login_seen_at,now()) WHERE id=v_user;
  RETURN public._customer_journey_json(v_user);
END;
$$;

CREATE OR REPLACE FUNCTION public.client_set_preferred_training_days(p_days INTEGER)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID:=auth.uid(); v_journey public.client_customer_journeys%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'authentication_required' USING ERRCODE='42501'; END IF;
  IF p_days IS NULL OR p_days<2 OR p_days>6 THEN RAISE EXCEPTION 'invalid_training_days' USING ERRCODE='22023'; END IF;
  PERFORM public.client_get_or_start_customer_journey();
  UPDATE public.client_customer_journeys SET preferred_training_days=p_days,
    normalized_training_days=GREATEST(3,p_days),failure_code=NULL WHERE user_id=v_user;
  UPDATE public.training_profiles SET answers=jsonb_set(jsonb_set(COALESCE(answers,'{}'::jsonb),'{preferredTrainingDays}',to_jsonb(p_days),true),'{trainingDaysPerWeek}',to_jsonb(p_days),true)
  WHERE user_id=v_user;
  SELECT * INTO v_journey FROM public.client_customer_journeys WHERE user_id=v_user;
  IF v_journey.status<>'ready' AND now()>=v_journey.preparation_ready_at THEN PERFORM public._finalize_customer_journey(v_user); END IF;
  RETURN public._customer_journey_json(v_user);
END;
$$;

CREATE OR REPLACE FUNCTION public.client_set_training_meal_window(p_window TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID:=auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'authentication_required' USING ERRCODE='42501'; END IF;
  IF p_window NOT IN ('before_breakfast','after_breakfast','before_lunch','after_lunch','before_evening_meal','after_evening_meal','before_dinner','after_dinner')
    THEN RAISE EXCEPTION 'invalid_training_meal_window' USING ERRCODE='22023'; END IF;
  PERFORM public.client_get_or_start_customer_journey();
  UPDATE public.client_customer_journeys SET training_meal_window=p_window WHERE user_id=v_user;
  RETURN public._customer_journey_json(v_user);
END;
$$;

CREATE OR REPLACE FUNCTION public.client_get_my_training_preview()
RETURNS JSONB LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID:=auth.uid(); v_row public.client_program_assignments%ROWTYPE; v_week INTEGER:=1; v_elapsed INTEGER;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  PERFORM public.activate_due_client_program_assignment(v_user);
  SELECT * INTO v_row FROM public.client_program_assignments WHERE client_id=v_user AND status IN ('active','scheduled')
  ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END,assigned_at DESC LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('reason','no_program','assignment',NULL,'days','[]'::jsonb); END IF;
  IF v_row.status='scheduled' AND v_row.starts_on>CURRENT_DATE THEN
    RETURN jsonb_build_object('reason','scheduled','assignment',jsonb_build_object('id',v_row.id,'name_ar',v_row.name_ar,'duration_weeks',v_row.duration_weeks,'days_per_week',v_row.days_per_week),'days','[]'::jsonb);
  END IF;
  IF v_row.starts_on IS NOT NULL THEN
    v_elapsed:=CURRENT_DATE-v_row.starts_on;
    v_week:=LEAST(GREATEST((GREATEST(v_elapsed,0)/7)+1,1),COALESCE(v_row.duration_weeks,1));
  END IF;
  RETURN jsonb_build_object('reason','ok','current_week_number',v_week,
    'assignment',jsonb_build_object('id',v_row.id,'name_ar',v_row.name_ar,'duration_weeks',v_row.duration_weeks,'days_per_week',v_row.days_per_week),
    'days',COALESCE((SELECT jsonb_agg(jsonb_build_object('day_number',d.day_number,'day_type',d.day_type,'title_ar',d.title_ar,'estimated_minutes',d.estimated_minutes,'exercise_count',(SELECT count(*) FROM public.client_program_exercises x WHERE x.day_id=d.id)) ORDER BY d.day_number)
      FROM public.client_program_days d JOIN public.client_program_weeks w ON w.id=d.week_id WHERE w.assignment_id=v_row.id AND w.week_number=v_week),'[]'::jsonb));
END;
$$;

-- Preserve the existing paid runtime and put entitlement enforcement at the DB boundary.
DO $$ BEGIN
  IF to_regprocedure('public._client_get_my_training_runtime_entitled()') IS NULL
     AND to_regprocedure('public.client_get_my_training_runtime()') IS NOT NULL THEN
    ALTER FUNCTION public.client_get_my_training_runtime() RENAME TO _client_get_my_training_runtime_entitled;
  END IF;
END $$;
CREATE OR REPLACE FUNCTION public.client_get_my_training_runtime()
RETURNS JSONB LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_entitlements JSONB;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  v_entitlements:=public.get_my_entitlements();
  IF COALESCE((v_entitlements->'training'->>'full_session')::boolean,false) IS NOT TRUE THEN
    RETURN jsonb_build_object('reason','membership_required','snapshot_complete',false,'assignment',NULL,'days','[]'::jsonb);
  END IF;
  RETURN public._client_get_my_training_runtime_entitled();
END;
$$;

REVOKE ALL ON FUNCTION public.client_get_or_start_customer_journey() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.client_set_preferred_training_days(INTEGER) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.client_set_training_meal_window(TEXT) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.client_get_my_training_preview() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.client_get_my_training_runtime() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.client_get_or_start_customer_journey() TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.client_set_preferred_training_days(INTEGER) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.client_set_training_meal_window(TEXT) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.client_get_my_training_preview() TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.client_get_my_training_runtime() TO authenticated,service_role;

COMMIT;
