-- Adopt drinks as an official meal_type for Nutrition Library MEAL-101 → MEAL-300.
-- Maps package value "Drinks / Nutritional Add-ons" → public.meal_type 'drinks'.

ALTER TYPE public.meal_type ADD VALUE IF NOT EXISTS 'drinks';
