-- Migration 2: Program Templates
-- Reusable workout program templates referencing the exercise catalog

CREATE TYPE public.program_goal AS ENUM (
  'cut',
  'bulk',
  'fitness',
  'recomp'
);

CREATE TYPE public.program_level AS ENUM (
  'beginner',
  'intermediate',
  'advanced'
);

CREATE TYPE public.program_day_type AS ENUM (
  'workout',
  'rest',
  'active_recovery'
);

CREATE TABLE public.program_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description_ar TEXT,
  goal public.program_goal,
  level public.program_level,
  duration_weeks INT NOT NULL DEFAULT 12,
  days_per_week INT NOT NULL DEFAULT 4,
  is_published BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT program_templates_duration_weeks_check CHECK (duration_weeks > 0),
  CONSTRAINT program_templates_days_per_week_check CHECK (days_per_week BETWEEN 1 AND 7)
);

CREATE TABLE public.program_template_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.program_templates(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  title_ar TEXT,
  notes_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT program_template_weeks_week_number_check CHECK (week_number > 0),
  UNIQUE (template_id, week_number)
);

CREATE TABLE public.program_template_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES public.program_template_weeks(id) ON DELETE CASCADE,
  day_number INT NOT NULL,
  day_type public.program_day_type NOT NULL DEFAULT 'workout',
  title_ar TEXT NOT NULL,
  muscle_focus TEXT,
  estimated_minutes INT,
  estimated_calories INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT program_template_days_day_number_check CHECK (day_number BETWEEN 1 AND 7),
  UNIQUE (week_id, day_number)
);

CREATE TABLE public.program_template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.program_template_days(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  sort_order INT NOT NULL DEFAULT 0,
  sets INT NOT NULL DEFAULT 3,
  reps_min INT,
  reps_max INT,
  reps_label TEXT,
  rest_seconds INT NOT NULL DEFAULT 60,
  suggested_weight_kg NUMERIC(6, 2),
  notes_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT program_template_exercises_sets_check CHECK (sets > 0),
  CONSTRAINT program_template_exercises_rest_seconds_check CHECK (rest_seconds >= 0),
  CONSTRAINT program_template_exercises_sort_order_check CHECK (sort_order >= 0),
  UNIQUE (day_id, sort_order)
);

CREATE INDEX idx_program_templates_is_published ON public.program_templates(is_published);
CREATE INDEX idx_program_template_weeks_template_id ON public.program_template_weeks(template_id);
CREATE INDEX idx_program_template_days_week_id ON public.program_template_days(week_id);
CREATE INDEX idx_program_template_exercises_day_id ON public.program_template_exercises(day_id);
CREATE INDEX idx_program_template_exercises_exercise_id ON public.program_template_exercises(exercise_id);

CREATE TRIGGER trg_program_templates_updated_at
  BEFORE UPDATE ON public.program_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_program_template_weeks_updated_at
  BEFORE UPDATE ON public.program_template_weeks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_program_template_days_updated_at
  BEFORE UPDATE ON public.program_template_days
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_program_template_exercises_updated_at
  BEFORE UPDATE ON public.program_template_exercises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.program_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_template_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_template_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_template_exercises ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_template_weeks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_template_days TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_template_exercises TO authenticated;
GRANT ALL ON public.program_templates TO service_role;
GRANT ALL ON public.program_template_weeks TO service_role;
GRANT ALL ON public.program_template_days TO service_role;
GRANT ALL ON public.program_template_exercises TO service_role;

CREATE POLICY "program_templates_select_published"
  ON public.program_templates
  FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "program_templates_admin_all"
  ON public.program_templates
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "program_template_weeks_select_published"
  ON public.program_template_weeks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.program_templates t
      WHERE t.id = template_id
        AND t.is_published = true
    )
  );

CREATE POLICY "program_template_weeks_admin_all"
  ON public.program_template_weeks
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "program_template_days_select_published"
  ON public.program_template_days
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.program_template_weeks w
      JOIN public.program_templates t ON t.id = w.template_id
      WHERE w.id = week_id
        AND t.is_published = true
    )
  );

CREATE POLICY "program_template_days_admin_all"
  ON public.program_template_days
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "program_template_exercises_select_published"
  ON public.program_template_exercises
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.program_template_days d
      JOIN public.program_template_weeks w ON w.id = d.week_id
      JOIN public.program_templates t ON t.id = w.template_id
      WHERE d.id = day_id
        AND t.is_published = true
    )
  );

CREATE POLICY "program_template_exercises_admin_all"
  ON public.program_template_exercises
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
