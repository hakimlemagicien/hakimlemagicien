-- Correct a baseline 54be8ba template whose technical contract is MUSCLE_GAIN/bulk
-- but whose Arabic presentation was copied from a fat-loss template.
BEGIN;

UPDATE public.program_templates
SET name_ar = 'بناء العضلات — متوسط — منزل — 4 أيام — رجال'
WHERE slug = 'MUSCLE_GAIN_PROGRESS_INTERMEDIATE_HOME_4D'
  AND goal::text = 'bulk'
  AND metadata->'template_contract'->>'primary_strategy' = 'MUSCLE_GAIN'
  AND name_ar ILIKE '%خسارة الدهون%';

UPDATE public.client_program_assignments a
SET name_ar = t.name_ar
FROM public.program_templates t
WHERE a.source_template_id = t.id
  AND t.slug = 'MUSCLE_GAIN_PROGRESS_INTERMEDIATE_HOME_4D'
  AND a.goal = 'bulk'
  AND a.name_ar ILIKE '%خسارة الدهون%';

COMMIT;
