-- MAAKFIT Nutrition Strategy V1 — extend assignments + slots (additive).
-- See docs/NUTRITION_V1_DATABASE_CHANGE_REQUEST.md MIGRATION_2.

-- ---------------------------------------------------------------------------
-- client_nutrition_assignments — schema version + target linkage + snapshot
-- ---------------------------------------------------------------------------

ALTER TABLE public.client_nutrition_assignments
  ADD COLUMN IF NOT EXISTS schema_version TEXT NOT NULL DEFAULT 'LEGACY_4_SLOT',
  ADD COLUMN IF NOT EXISTS assignment_version INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS target_id UUID REFERENCES public.client_nutrition_targets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS strategy_version TEXT,
  ADD COLUMN IF NOT EXISTS library_version TEXT,
  ADD COLUMN IF NOT EXISTS replaces_assignment_id UUID
    REFERENCES public.client_nutrition_assignments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resolved_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS validation_status TEXT,
  ADD COLUMN IF NOT EXISTS decision_trace_id UUID
    REFERENCES public.nutrition_decision_traces(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'client_nutrition_assignments_schema_version_check'
  ) THEN
    ALTER TABLE public.client_nutrition_assignments
      ADD CONSTRAINT client_nutrition_assignments_schema_version_check
      CHECK (schema_version IN ('LEGACY_4_SLOT', 'STRATEGY_V1_DYNAMIC'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'client_nutrition_assignments_validation_status_check'
  ) THEN
    ALTER TABLE public.client_nutrition_assignments
      ADD CONSTRAINT client_nutrition_assignments_validation_status_check
      CHECK (validation_status IS NULL OR validation_status IN ('VALID', 'REVIEW_REQUIRED', 'INVALID'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS client_nutrition_assignments_client_version_idx
  ON public.client_nutrition_assignments (client_id, assignment_version DESC);

-- ---------------------------------------------------------------------------
-- client_nutrition_slots — dynamic slot states + serving policy
-- ---------------------------------------------------------------------------

ALTER TABLE public.client_nutrition_slots
  ADD COLUMN IF NOT EXISTS slot_state TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS slot_role TEXT,
  ADD COLUMN IF NOT EXISTS satisfied_by_slot_key TEXT,
  ADD COLUMN IF NOT EXISTS serving_policy TEXT,
  ADD COLUMN IF NOT EXISTS planned_servings NUMERIC,
  ADD COLUMN IF NOT EXISTS display_order INT,
  ADD COLUMN IF NOT EXISTS counts_toward_day_totals BOOLEAN NOT NULL DEFAULT true;

-- Widen slot_key to include pre/post (drop + recreate CHECK)
ALTER TABLE public.client_nutrition_slots
  DROP CONSTRAINT IF EXISTS client_nutrition_slots_slot_key_check;

ALTER TABLE public.client_nutrition_slots
  ADD CONSTRAINT client_nutrition_slots_slot_key_check
  CHECK (slot_key IN (
    'breakfast', 'snack', 'lunch', 'dinner', 'pre_workout', 'post_workout'
  ));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_nutrition_slots_slot_state_check'
  ) THEN
    ALTER TABLE public.client_nutrition_slots
      ADD CONSTRAINT client_nutrition_slots_slot_state_check
      CHECK (slot_state IN ('ACTIVE', 'OPTIONAL', 'SATISFIED_BY_OTHER_MEAL', 'NOT_REQUIRED'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_nutrition_slots_satisfied_by_check'
  ) THEN
    ALTER TABLE public.client_nutrition_slots
      ADD CONSTRAINT client_nutrition_slots_satisfied_by_check
      CHECK (
        slot_state <> 'SATISFIED_BY_OTHER_MEAL'
        OR satisfied_by_slot_key IS NOT NULL
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_nutrition_slots_no_self_satisfied'
  ) THEN
    ALTER TABLE public.client_nutrition_slots
      ADD CONSTRAINT client_nutrition_slots_no_self_satisfied
      CHECK (
        satisfied_by_slot_key IS NULL
        OR satisfied_by_slot_key <> slot_key
      );
  END IF;
END $$;

-- Backfill legacy rows
UPDATE public.client_nutrition_slots
SET
  slot_state = COALESCE(slot_state, 'ACTIVE'),
  planned_servings = COALESCE(planned_servings, servings),
  display_order = COALESCE(display_order, sort_order),
  counts_toward_day_totals = COALESCE(counts_toward_day_totals, true)
WHERE slot_state IS NULL
   OR planned_servings IS NULL
   OR display_order IS NULL;

CREATE INDEX IF NOT EXISTS client_nutrition_slots_display_order_idx
  ON public.client_nutrition_slots (assignment_id, display_order);

-- Composite FK for satisfied_by (deferred — add only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_nutrition_slots_satisfied_by_fk'
  ) THEN
    ALTER TABLE public.client_nutrition_slots
      ADD CONSTRAINT client_nutrition_slots_satisfied_by_fk
      FOREIGN KEY (assignment_id, satisfied_by_slot_key)
      REFERENCES public.client_nutrition_slots (assignment_id, slot_key)
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'satisfied_by composite FK skipped: %', SQLERRM;
END $$;

-- Extend slot meta helper for pre/post
CREATE OR REPLACE FUNCTION public._nutrition_slot_meta(p_key TEXT)
RETURNS TABLE (slot_label TEXT, time_label TEXT, hour INT, minute INT, sort_order INT)
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT x.slot_label, x.time_label, x.hour, x.minute, x.sort_order
  FROM (
    VALUES
      ('breakfast', 'الفطور', '8:00 ص', 8, 0, 0),
      ('snack', 'سناك', '11:00 ص', 11, 0, 1),
      ('lunch', 'الغداء', '2:00 م', 14, 0, 2),
      ('pre_workout', 'قبل التمرين', '5:00 م', 17, 0, 3),
      ('post_workout', 'بعد التمرين', '7:00 م', 19, 0, 4),
      ('dinner', 'العشاء', '8:00 م', 20, 0, 5)
  ) AS x(slot_key, slot_label, time_label, hour, minute, sort_order)
  WHERE x.slot_key = p_key;
$$;
