-- Client workout set logs (weights, reps, effort, notes) for progress tracking and admin review

CREATE TYPE public.workout_effort_level AS ENUM ('easy', 'medium', 'hard');

CREATE TABLE public.workout_set_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  exercise_external_id TEXT NOT NULL,
  session_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  set_number INT NOT NULL,
  weight_kg NUMERIC(6,2),
  reps INT,
  effort public.workout_effort_level,
  notes TEXT,
  skipped BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT workout_set_logs_set_number_check CHECK (set_number > 0),
  UNIQUE (user_id, session_date, exercise_external_id, set_number)
);

CREATE INDEX idx_workout_set_logs_user_session
  ON public.workout_set_logs(user_id, session_date DESC);

CREATE INDEX idx_workout_set_logs_exercise_external_id
  ON public.workout_set_logs(exercise_external_id);

CREATE TRIGGER trg_workout_set_logs_updated_at
  BEFORE UPDATE ON public.workout_set_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.workout_set_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.workout_set_logs TO authenticated;
GRANT ALL ON public.workout_set_logs TO service_role;

CREATE POLICY "wsl_own_select" ON public.workout_set_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "wsl_own_insert" ON public.workout_set_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wsl_own_update" ON public.workout_set_logs
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wsl_admin_select" ON public.workout_set_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
