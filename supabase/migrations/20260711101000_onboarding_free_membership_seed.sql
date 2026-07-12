-- Seed membership tiers used by onboarding and upgrade gating.

INSERT INTO public.membership_tiers (tier, name_ar, name_en, is_free, sort_order, features)
VALUES
  (
    'free',
    'مجاني',
    'Free',
    true,
    10,
    '{"platform_access":true,"workout_program":false,"nutrition_plan":false,"progress_tracking":false,"free_content":true,"periodic_reviews":false,"limited_coach_contact":false,"personal_followup":false,"program_adjustments":false,"priority_contact":false}'::jsonb
  ),
  (
    'essential',
    'أساسي',
    'Essential',
    false,
    20,
    '{"platform_access":true,"workout_program":true,"nutrition_plan":false,"progress_tracking":true,"free_content":true,"periodic_reviews":true,"limited_coach_contact":true,"personal_followup":false,"program_adjustments":false,"priority_contact":false}'::jsonb
  ),
  (
    'premium',
    'بريميوم',
    'Premium',
    false,
    30,
    '{"platform_access":true,"workout_program":true,"nutrition_plan":true,"progress_tracking":true,"free_content":true,"periodic_reviews":true,"limited_coach_contact":true,"personal_followup":true,"program_adjustments":true,"priority_contact":false}'::jsonb
  ),
  (
    'vip',
    'VIP',
    'VIP',
    false,
    40,
    '{"platform_access":true,"workout_program":true,"nutrition_plan":true,"progress_tracking":true,"free_content":true,"periodic_reviews":true,"limited_coach_contact":true,"personal_followup":true,"program_adjustments":true,"priority_contact":true}'::jsonb
  )
ON CONFLICT (tier) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  is_free = EXCLUDED.is_free,
  sort_order = EXCLUDED.sort_order,
  features = EXCLUDED.features,
  updated_at = now();
