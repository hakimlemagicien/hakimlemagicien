-- Close quiz → Strategy Matrix goal bridge for remaining quiz ids.
-- App resolution uses LEGACY_GOAL_MAP in code; keep DB map in sync for client_map_legacy_goal RPC.
-- Male canonical goals were never seeded in training_goal_profiles — insert before FK updates.

INSERT INTO public.training_goal_profiles (canonical_id, label_ar, body_composition_dependency)
VALUES
  ('MUSCLE_GROWTH', 'بناء العضلات', false),
  ('FITNESS_ENERGY', 'تحسين اللياقة والطاقة', false),
  ('ATHLETIC_PHYSIQUE', 'جسم رياضي ومتناسق', false),
  ('BODY_RESHAPE', 'تغيير شكل الجسم', false),
  ('HEALTHY_WEIGHT_GAIN', 'زيادة وزن صحي', true)
ON CONFLICT (canonical_id) DO NOTHING;

UPDATE public.training_goal_legacy_map
SET
  canonical_id = 'TONED_ARMS_UPPER_BODY',
  mapping_status = 'MAPPED',
  notes = 'Female quiz chest/upper tone → TONED_ARMS_UPPER_BODY'
WHERE legacy_id = 'tone';

UPDATE public.training_goal_legacy_map
SET
  canonical_id = 'POSTURE_TONED_BACK',
  mapping_status = 'MAPPED',
  notes = 'Female quiz healthy/athletic → POSTURE_TONED_BACK'
WHERE legacy_id = 'fit';

UPDATE public.training_goal_legacy_map
SET
  canonical_id = 'MUSCLE_GROWTH',
  mapping_status = 'MAPPED',
  notes = 'Male quiz muscle → MUSCLE_GROWTH'
WHERE legacy_id = 'muscle'
  AND (canonical_id IS NULL OR mapping_status = 'LEGACY_UNMAPPED');

UPDATE public.training_goal_legacy_map
SET
  canonical_id = 'FITNESS_ENERGY',
  mapping_status = 'MAPPED',
  notes = 'Male quiz fitness → FITNESS_ENERGY'
WHERE legacy_id = 'fitness'
  AND (canonical_id IS NULL OR mapping_status = 'LEGACY_UNMAPPED');

UPDATE public.training_goal_legacy_map
SET
  canonical_id = 'ATHLETIC_PHYSIQUE',
  mapping_status = 'MAPPED',
  notes = 'Male quiz athletic → ATHLETIC_PHYSIQUE'
WHERE legacy_id = 'athletic'
  AND (canonical_id IS NULL OR mapping_status = 'LEGACY_UNMAPPED');

UPDATE public.training_goal_legacy_map
SET
  canonical_id = 'BODY_RESHAPE',
  mapping_status = 'MAPPED',
  notes = 'Male quiz shape → BODY_RESHAPE'
WHERE legacy_id = 'shape'
  AND (canonical_id IS NULL OR mapping_status = 'LEGACY_UNMAPPED');

UPDATE public.training_goal_legacy_map
SET
  canonical_id = 'HEALTHY_WEIGHT_GAIN',
  mapping_status = 'MAPPED',
  notes = 'Male quiz gain → HEALTHY_WEIGHT_GAIN'
WHERE legacy_id = 'gain'
  AND (canonical_id IS NULL OR mapping_status = 'LEGACY_UNMAPPED');
