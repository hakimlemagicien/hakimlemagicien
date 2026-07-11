-- Seed: exercise muscle groups (idempotent)
-- Separated from schema migration so seed can be re-applied safely on any environment.

INSERT INTO public.exercise_muscle_groups (code, name_en, name_ar, sort_order, is_active)
VALUES
  ('chest', 'Chest', 'صدر', 1, true),
  ('back', 'Back', 'ظهر', 2, true),
  ('warm_up', 'Warm Up', 'إحماء', 3, true),
  ('mobility', 'Mobility', 'حركية', 4, true),
  ('shoulders', 'Shoulders', 'أكتاف', 5, true),
  ('biceps', 'Biceps', 'بايسبس', 6, true),
  ('triceps', 'Triceps', 'ترايسبس', 7, true),
  ('forearms', 'Forearms', 'ساعد', 8, true),
  ('legs', 'Legs', 'أرجل', 9, true),
  ('glutes', 'Glutes', 'مؤخرة', 10, true),
  ('calves', 'Calves', 'سمانة', 11, true),
  ('abs', 'Abs', 'بطن', 12, true),
  ('cardio', 'Cardio', 'كارديو', 13, true)
ON CONFLICT (code) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_ar = EXCLUDED.name_ar,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();
