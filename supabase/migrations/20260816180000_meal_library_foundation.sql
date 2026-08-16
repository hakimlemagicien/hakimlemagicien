-- Meal Library foundation (Pilot MEAL-001 → MEAL-020, ready for MEAL-021 → MEAL-300)
-- Catalog tables are independent from user nutrition plan / progress state.

CREATE TYPE public.meal_type AS ENUM (
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'pre_workout',
  'post_workout'
);

CREATE TYPE public.meal_library_status AS ENUM (
  'pilot',
  'published',
  'archived'
);

CREATE TYPE public.meal_image_status AS ENUM (
  'placeholder',
  'ready',
  'missing',
  'review_required'
);

CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  meal_type public.meal_type NOT NULL,
  suitable_goals TEXT[] NOT NULL DEFAULT '{}'::text[],
  dietary_tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  allergens TEXT[] NOT NULL DEFAULT '{}'::text[],
  calories NUMERIC NOT NULL,
  protein_g NUMERIC NOT NULL,
  carbs_g NUMERIC NOT NULL,
  fat_g NUMERIC NOT NULL,
  serving_size NUMERIC NOT NULL,
  serving_unit TEXT NOT NULL DEFAULT 'g',
  yield_servings NUMERIC NOT NULL DEFAULT 1,
  preparation_steps_ar TEXT[] NOT NULL DEFAULT '{}'::text[],
  preparation_steps_en TEXT[] NOT NULL DEFAULT '{}'::text[],
  preparation_time_minutes INT,
  image_path TEXT,
  image_thumb_path TEXT,
  image_master_path TEXT,
  image_status public.meal_image_status NOT NULL DEFAULT 'placeholder',
  image_alt_ar TEXT,
  image_alt_en TEXT,
  status public.meal_library_status NOT NULL DEFAULT 'pilot',
  review_status TEXT,
  notes TEXT,
  substitution_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  qa JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT meals_calories_check CHECK (calories >= 0),
  CONSTRAINT meals_macros_check CHECK (protein_g >= 0 AND carbs_g >= 0 AND fat_g >= 0),
  CONSTRAINT meals_serving_size_check CHECK (serving_size > 0),
  CONSTRAINT meals_sort_order_check CHECK (sort_order >= 0)
);

CREATE TABLE public.meal_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  ingredient_order INT NOT NULL,
  ingredient_key TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  kcal NUMERIC,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  source TEXT,
  source_query_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT meal_ingredients_order_check CHECK (ingredient_order > 0),
  CONSTRAINT meal_ingredients_quantity_check CHECK (quantity > 0),
  CONSTRAINT meal_ingredients_unique_order UNIQUE (meal_id, ingredient_order)
);

CREATE INDEX idx_meals_meal_type ON public.meals(meal_type);
CREATE INDEX idx_meals_is_active ON public.meals(is_active);
CREATE INDEX idx_meals_sort_order ON public.meals(sort_order);
CREATE INDEX idx_meal_ingredients_meal_id ON public.meal_ingredients(meal_id);

CREATE TRIGGER trg_meals_updated_at
  BEFORE UPDATE ON public.meals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_ingredients ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_ingredients TO authenticated;
GRANT ALL ON public.meals TO service_role;
GRANT ALL ON public.meal_ingredients TO service_role;

CREATE POLICY "meals_select_active"
  ON public.meals
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "meals_admin_all"
  ON public.meals
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "meal_ingredients_select_active"
  ON public.meal_ingredients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.meals m
      WHERE m.id = meal_id
        AND m.is_active = true
    )
  );

CREATE POLICY "meal_ingredients_admin_all"
  ON public.meal_ingredients
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-media', 'meal-media', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "meal_media_admin_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'meal-media'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "meal_media_admin_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'meal-media'
    AND public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    bucket_id = 'meal-media'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "meal_media_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'meal-media'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "meal_media_authenticated_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'meal-media');
