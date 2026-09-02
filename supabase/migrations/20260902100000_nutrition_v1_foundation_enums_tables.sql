-- MAAKFIT Nutrition Strategy V1 — foundation tables (additive, LOCAL_ONLY).
-- See docs/NUTRITION_V1_DATABASE_CHANGE_REQUEST.md MIGRATION_1.

-- ---------------------------------------------------------------------------
-- client_nutrition_targets — versioned TARGET (separate from PLANNED/CONSUMED)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.client_nutrition_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  version INT NOT NULL CHECK (version > 0),
  previous_target_id UUID REFERENCES public.client_nutrition_targets(id) ON DELETE SET NULL,
  nutrition_objective TEXT NOT NULL,
  goal_context TEXT NOT NULL,
  calories NUMERIC NOT NULL CHECK (calories > 0),
  protein_g NUMERIC NOT NULL CHECK (protein_g >= 0),
  carbs_g NUMERIC NOT NULL CHECK (carbs_g >= 0),
  fat_g NUMERIC NOT NULL CHECK (fat_g >= 0),
  reference_weight_kg NUMERIC,
  reference_weight_source TEXT,
  target_source TEXT NOT NULL
    CHECK (target_source IN ('ENGINE_APPROVED', 'COACH_APPROVED', 'ADMIN_APPROVED')),
  strategy_version TEXT NOT NULL,
  target_reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'superseded', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  superseded_at TIMESTAMPTZ,
  UNIQUE (client_id, version)
);

CREATE INDEX IF NOT EXISTS client_nutrition_targets_client_version_idx
  ON public.client_nutrition_targets (client_id, version DESC);

CREATE UNIQUE INDEX IF NOT EXISTS client_nutrition_targets_one_active
  ON public.client_nutrition_targets (client_id)
  WHERE status = 'active';

-- ---------------------------------------------------------------------------
-- client_nutrition_profiles — allergy status + restrictions (fail-closed)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.client_nutrition_profiles (
  client_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  allergy_status TEXT NOT NULL DEFAULT 'UNKNOWN'
    CHECK (allergy_status IN ('UNKNOWN', 'CONFIRMED_NONE', 'KNOWN_ALLERGIES')),
  known_allergens TEXT[] NOT NULL DEFAULT '{}',
  confirmed_none_at TIMESTAMPTZ,
  dietary_restrictions TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  CONSTRAINT client_nutrition_profiles_confirmed_none_at
    CHECK (
      allergy_status <> 'CONFIRMED_NONE'
      OR confirmed_none_at IS NOT NULL
    ),
  CONSTRAINT client_nutrition_profiles_known_allergies_nonempty
    CHECK (
      allergy_status <> 'KNOWN_ALLERGIES'
      OR cardinality(known_allergens) > 0
    )
);

DROP TRIGGER IF EXISTS trg_client_nutrition_profiles_updated_at ON public.client_nutrition_profiles;
CREATE TRIGGER trg_client_nutrition_profiles_updated_at
  BEFORE UPDATE ON public.client_nutrition_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- nutrition_decision_traces — audit trail for target/assignment changes
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.nutrition_decision_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  strategy_version TEXT NOT NULL,
  target_id UUID REFERENCES public.client_nutrition_targets(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES public.client_nutrition_assignments(id) ON DELETE SET NULL,
  actor_id UUID,
  actor_role TEXT,
  summary TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nutrition_decision_traces_client_idx
  ON public.nutrition_decision_traces (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS nutrition_decision_traces_assignment_idx
  ON public.nutrition_decision_traces (assignment_id)
  WHERE assignment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS nutrition_decision_traces_target_idx
  ON public.nutrition_decision_traces (target_id)
  WHERE target_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.client_nutrition_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_nutrition_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_decision_traces ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.client_nutrition_targets FROM anon, authenticated;
REVOKE ALL ON public.client_nutrition_profiles FROM anon, authenticated;
REVOKE ALL ON public.nutrition_decision_traces FROM anon, authenticated;

GRANT SELECT ON public.client_nutrition_targets TO authenticated;
GRANT SELECT ON public.client_nutrition_profiles TO authenticated;
GRANT ALL ON public.client_nutrition_targets TO service_role;
GRANT ALL ON public.client_nutrition_profiles TO service_role;
GRANT ALL ON public.nutrition_decision_traces TO service_role;

DROP POLICY IF EXISTS client_nutrition_targets_own_active_select ON public.client_nutrition_targets;
DROP POLICY IF EXISTS client_nutrition_targets_admin_select ON public.client_nutrition_targets;
CREATE POLICY client_nutrition_targets_own_active_select
  ON public.client_nutrition_targets FOR SELECT TO authenticated
  USING (client_id = auth.uid() AND status = 'active');
CREATE POLICY client_nutrition_targets_admin_select
  ON public.client_nutrition_targets FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS client_nutrition_profiles_own_select ON public.client_nutrition_profiles;
DROP POLICY IF EXISTS client_nutrition_profiles_own_update ON public.client_nutrition_profiles;
DROP POLICY IF EXISTS client_nutrition_profiles_admin_select ON public.client_nutrition_profiles;
CREATE POLICY client_nutrition_profiles_own_select
  ON public.client_nutrition_profiles FOR SELECT TO authenticated
  USING (client_id = auth.uid());
CREATE POLICY client_nutrition_profiles_own_update
  ON public.client_nutrition_profiles FOR UPDATE TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());
CREATE POLICY client_nutrition_profiles_admin_select
  ON public.client_nutrition_profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS nutrition_decision_traces_admin_select ON public.nutrition_decision_traces;
CREATE POLICY nutrition_decision_traces_admin_select
  ON public.nutrition_decision_traces FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
