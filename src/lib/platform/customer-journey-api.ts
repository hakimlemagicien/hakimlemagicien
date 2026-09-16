import { supabase } from "@/integrations/supabase/client";
import type {
  CustomerJourneyPhase,
  CustomerJourneyState,
  PreferredTrainingDays,
  TrainingMealWindow,
} from "@/lib/platform/customer-journey";

type RpcState = {
  phase?: CustomerJourneyPhase;
  preparation_started_at?: string;
  preparation_ready_at?: string;
  extra_window_ends_at?: string | null;
  preferred_training_days?: number | null;
  normalized_training_days?: number | null;
  training_meal_window?: TrainingMealWindow | null;
  assignment_id?: string | null;
  matched_template_id?: string | null;
  failure_code?: string | null;
  grandfathered?: boolean;
};

function mapState(data: unknown): CustomerJourneyState {
  const row = (data ?? {}) as RpcState;
  if (!row.phase || !row.preparation_started_at || !row.preparation_ready_at) {
    throw new Error("invalid_customer_journey_state");
  }
  return {
    phase: row.phase,
    preparationStartedAt: row.preparation_started_at,
    preparationReadyAt: row.preparation_ready_at,
    extraWindowEndsAt: row.extra_window_ends_at ?? null,
    preferredTrainingDays: (row.preferred_training_days as PreferredTrainingDays | null) ?? null,
    normalizedTrainingDays: row.normalized_training_days ?? null,
    trainingMealWindow: row.training_meal_window ?? null,
    assignmentId: row.assignment_id ?? null,
    matchedTemplateId: row.matched_template_id ?? null,
    failureCode: row.failure_code ?? null,
    grandfathered: Boolean(row.grandfathered),
  };
}

type JourneyRpc = (
  name: string,
  args?: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message?: string } | null }>;

async function call(name: string, args?: Record<string, unknown>) {
  // Keep the Supabase client as the method receiver; PostgREST RPC uses client state.
  const { data, error } = await (supabase.rpc as unknown as JourneyRpc)(name, args);
  if (error) throw new Error(error.message || name);
  return mapState(data);
}

export const getOrStartCustomerJourney = () => call("client_get_or_start_customer_journey");
export const savePreferredTrainingDays = (days: PreferredTrainingDays) =>
  call("client_set_preferred_training_days", { p_days: days });
export const saveTrainingMealWindow = (window: TrainingMealWindow) =>
  call("client_set_training_meal_window", { p_window: window });
