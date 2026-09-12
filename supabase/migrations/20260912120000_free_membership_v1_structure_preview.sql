-- FREE Membership V1: structure preview only (no free playable exercise).
-- Nutrition remains 1 meal/day (breakfast) via existing nutrition_* fields.
-- Client + UI enforce allowedExercisesPerSession = 0; this updates live tier features
-- so existing free accounts pick up the contract on refresh via get_my_entitlements.

UPDATE public.membership_tiers
SET features = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(features, '{}'::jsonb),
      '{training_allowed_exercises_per_session}',
      '0'::jsonb,
      true
    ),
    '{training_full_session}',
    'false'::jsonb,
    true
  ),
  '{training_preview_exercises}',
  'true'::jsonb,
  true
),
updated_at = now()
WHERE tier = 'free';
