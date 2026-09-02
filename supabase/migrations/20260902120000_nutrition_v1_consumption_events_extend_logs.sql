-- MAAKFIT Nutrition Strategy V1 — consumption events + meal log extend (additive).
-- See docs/NUTRITION_V1_DATABASE_CHANGE_REQUEST.md MIGRATION_3.

-- ---------------------------------------------------------------------------
-- client_nutrition_consumption_events — append-only audit history
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.client_nutrition_consumption_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.client_nutrition_assignments(id) ON DELETE SET NULL,
  slot_id UUID REFERENCES public.client_nutrition_slots(id) ON DELETE SET NULL,
  slot_key TEXT NOT NULL,
  session_date DATE NOT NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('logged', 'updated', 'swapped', 'cleared')),
  status TEXT NOT NULL
    CHECK (status IN ('PLANNED', 'COMPLETED', 'PARTIAL', 'SKIPPED', 'SWAPPED')),
  planned_servings NUMERIC NOT NULL CHECK (planned_servings > 0),
  consumed_servings NUMERIC NOT NULL DEFAULT 0 CHECK (consumed_servings >= 0),
  source_external_id TEXT NOT NULL,
  macros_consumed JSONB NOT NULL DEFAULT '{}',
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT client_nutrition_consumption_events_servings_bounds
    CHECK (consumed_servings <= planned_servings)
);

CREATE INDEX IF NOT EXISTS client_nutrition_consumption_events_user_date_idx
  ON public.client_nutrition_consumption_events (user_id, session_date DESC);

-- ---------------------------------------------------------------------------
-- client_nutrition_meal_logs — partial + swapped + consumed_servings
-- ---------------------------------------------------------------------------

ALTER TABLE public.client_nutrition_meal_logs
  ADD COLUMN IF NOT EXISTS planned_servings NUMERIC NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS consumed_servings NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS macros_consumed JSONB,
  ADD COLUMN IF NOT EXISTS consumption_state TEXT NOT NULL DEFAULT 'LOGGED';

-- Expand status CHECK to include partial + swapped
ALTER TABLE public.client_nutrition_meal_logs
  DROP CONSTRAINT IF EXISTS client_nutrition_meal_logs_status_check;

ALTER TABLE public.client_nutrition_meal_logs
  ADD CONSTRAINT client_nutrition_meal_logs_status_check
  CHECK (status IN ('completed', 'skipped', 'partial', 'swapped'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_nutrition_meal_logs_consumed_bounds'
  ) THEN
    ALTER TABLE public.client_nutrition_meal_logs
      ADD CONSTRAINT client_nutrition_meal_logs_consumed_bounds
      CHECK (consumed_servings >= 0 AND consumed_servings <= planned_servings);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_nutrition_meal_logs_status_servings'
  ) THEN
    ALTER TABLE public.client_nutrition_meal_logs
      ADD CONSTRAINT client_nutrition_meal_logs_status_servings
      CHECK (
        (status = 'partial' AND consumed_servings > 0 AND consumed_servings < planned_servings)
        OR (status = 'completed' AND consumed_servings = planned_servings)
        OR (status = 'skipped' AND consumed_servings = 0)
        OR (status = 'swapped')
      );
  END IF;
END $$;

-- Backfill existing logs
UPDATE public.client_nutrition_meal_logs
SET
  planned_servings = COALESCE(planned_servings, 1),
  consumed_servings = CASE
    WHEN status = 'completed' THEN COALESCE(planned_servings, 1)
    WHEN status = 'skipped' THEN 0
    ELSE COALESCE(consumed_servings, 0)
  END,
  consumption_state = COALESCE(consumption_state, 'LOGGED')
WHERE planned_servings IS NULL OR consumption_state IS NULL;

-- ---------------------------------------------------------------------------
-- RLS for consumption events
-- ---------------------------------------------------------------------------

ALTER TABLE public.client_nutrition_consumption_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.client_nutrition_consumption_events FROM anon, authenticated;
GRANT SELECT ON public.client_nutrition_consumption_events TO authenticated;
GRANT ALL ON public.client_nutrition_consumption_events TO service_role;

DROP POLICY IF EXISTS client_nutrition_consumption_events_own_select ON public.client_nutrition_consumption_events;
DROP POLICY IF EXISTS client_nutrition_consumption_events_admin_select ON public.client_nutrition_consumption_events;
CREATE POLICY client_nutrition_consumption_events_own_select
  ON public.client_nutrition_consumption_events FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY client_nutrition_consumption_events_admin_select
  ON public.client_nutrition_consumption_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
