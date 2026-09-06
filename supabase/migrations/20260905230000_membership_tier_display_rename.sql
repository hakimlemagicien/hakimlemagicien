-- Display-name rename only: FREE / PLUS / PRO (IDs unchanged).
UPDATE public.membership_tiers
SET
  name_en = CASE tier
    WHEN 'free' THEN 'FREE'
    WHEN 'essential' THEN 'PLUS'
    WHEN 'premium' THEN 'PRO'
    ELSE name_en
  END,
  name_ar = CASE tier
    WHEN 'free' THEN 'FREE — ابدأ رحلتك'
    WHEN 'essential' THEN 'PLUS — خطتك الكاملة'
    WHEN 'premium' THEN 'PRO — خطتك التي تتطور معك'
    ELSE name_ar
  END
WHERE tier IN ('free', 'essential', 'premium');
