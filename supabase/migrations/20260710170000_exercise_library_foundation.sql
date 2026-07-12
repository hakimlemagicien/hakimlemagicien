-- Migration 1: Exercise Library Foundation
-- Catalog tables for muscle groups and exercises (aligned with scripts/exercise-library.json + metadata.json)

CREATE TYPE public.exercise_difficulty AS ENUM (
  'beginner',
  'intermediate',
  'advanced'
);

CREATE TYPE public.exercise_media_status AS ENUM (
  'placeholder',
  'ready',
  'missing'
);

CREATE TYPE public.exercise_type AS ENUM (
  'strength',
  'cardio',
  'mobility',
  'warmup',
  'other'
);

CREATE TABLE public.exercise_muscle_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT exercise_muscle_groups_sort_order_check CHECK (sort_order >= 0)
);

CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  muscle_group_id UUID NOT NULL REFERENCES public.exercise_muscle_groups(id) ON DELETE RESTRICT,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  equipment TEXT,
  difficulty public.exercise_difficulty,
  exercise_type public.exercise_type NOT NULL DEFAULT 'strength',
  primary_muscle TEXT,
  secondary_muscles TEXT[] NOT NULL DEFAULT '{}'::text[],
  coach_notes TEXT,
  duration_seconds INT NOT NULL DEFAULT 30,
  youtube_url TEXT,
  video_status public.exercise_media_status NOT NULL DEFAULT 'placeholder',
  instructions_status public.exercise_media_status NOT NULL DEFAULT 'placeholder',
  video_path TEXT,
  instructions_video_path TEXT,
  thumbnail_path TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT exercises_duration_seconds_check CHECK (duration_seconds > 0),
  CONSTRAINT exercises_sort_order_check CHECK (sort_order >= 0)
);

CREATE INDEX idx_exercises_muscle_group_id ON public.exercises(muscle_group_id);
CREATE INDEX idx_exercises_is_active ON public.exercises(is_active);
CREATE INDEX idx_exercise_muscle_groups_sort_order ON public.exercise_muscle_groups(sort_order);

CREATE TRIGGER trg_exercise_muscle_groups_updated_at
  BEFORE UPDATE ON public.exercise_muscle_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_exercises_updated_at
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.exercise_muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_muscle_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO authenticated;
GRANT ALL ON public.exercise_muscle_groups TO service_role;
GRANT ALL ON public.exercises TO service_role;

CREATE POLICY "exercise_muscle_groups_select_active"
  ON public.exercise_muscle_groups
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "exercise_muscle_groups_admin_all"
  ON public.exercise_muscle_groups
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "exercises_select_active"
  ON public.exercises
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "exercises_admin_all"
  ON public.exercises
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-media', 'exercise-media', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "exercise_media_admin_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'exercise-media'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "exercise_media_admin_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'exercise-media'
    AND public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    bucket_id = 'exercise-media'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "exercise_media_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'exercise-media'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "exercise_media_authenticated_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'exercise-media');

INSERT INTO public.exercise_muscle_groups (code, name_en, name_ar, sort_order)
VALUES
  ('chest', 'Chest', 'صدر', 1),
  ('back', 'Back', 'ظهر', 2),
  ('warm_up', 'Warm Up', 'إحماء', 3),
  ('mobility', 'Mobility', 'حركية', 4),
  ('shoulders', 'Shoulders', 'أكتاف', 5),
  ('biceps', 'Biceps', 'بايسبس', 6),
  ('triceps', 'Triceps', 'ترايسبس', 7),
  ('forearms', 'Forearms', 'ساعد', 8),
  ('legs', 'Legs', 'أرجل', 9),
  ('glutes', 'Glutes', 'مؤخرة', 10),
  ('calves', 'Calves', 'سمانة', 11),
  ('abs', 'Abs', 'بطن', 12),
  ('cardio', 'Cardio', 'كارديو', 13)
ON CONFLICT (code) DO NOTHING;
