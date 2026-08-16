-- Daily readiness checks: one row per user per local calendar date.

CREATE TABLE public.daily_readiness_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_date DATE NOT NULL,
  timezone TEXT NOT NULL,
  energy TEXT CHECK (energy IS NULL OR energy IN ('low', 'medium', 'high')),
  sleep TEXT CHECK (sleep IS NULL OR sleep IN ('poor', 'fair', 'good')),
  body TEXT CHECK (body IS NULL OR body IN ('good', 'fatigued', 'pain')),
  score SMALLINT CHECK (score IS NULL OR (score >= 3 AND score <= 9)),
  level TEXT CHECK (level IS NULL OR level IN ('ready', 'balanced', 'recovery')),
  status TEXT NOT NULL CHECK (status IN ('completed', 'skipped', 'dismissed')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'health_prefill')),
  adjustment_decision TEXT CHECK (
    adjustment_decision IS NULL OR adjustment_decision IN ('accepted', 'declined')
  ),
  adjustment_choice TEXT CHECK (
    adjustment_choice IS NULL OR adjustment_choice IN ('lighter', 'active_recovery')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, local_date)
);

CREATE INDEX idx_daily_readiness_checks_user_date
  ON public.daily_readiness_checks(user_id, local_date DESC);

CREATE TRIGGER trg_daily_readiness_checks_updated_at
  BEFORE UPDATE ON public.daily_readiness_checks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.daily_readiness_checks ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.daily_readiness_checks TO authenticated;
GRANT ALL ON public.daily_readiness_checks TO service_role;

CREATE POLICY "drc_own_select" ON public.daily_readiness_checks
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "drc_own_insert" ON public.daily_readiness_checks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "drc_own_update" ON public.daily_readiness_checks
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
