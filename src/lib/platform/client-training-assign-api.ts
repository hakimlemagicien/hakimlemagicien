import { supabase } from "@/integrations/supabase/client";
import {
  validateValidationStatuses,
  validateV2AssignmentPayload,
} from "@/lib/platform/training-strategy-hardening";

export async function clientAssignGeneratedV2Program(input: {
  startsOn: string;
  replace: boolean;
  generationStatus: string;
  validationStatus: string;
  payload: Record<string, unknown>;
}) {
  const statusError = validateValidationStatuses({
    generationStatus: input.generationStatus,
    validationStatus: input.validationStatus,
  });
  if (statusError) throw new Error(statusError);

  const payloadError = validateV2AssignmentPayload(input.payload);
  if (payloadError) throw new Error(payloadError);

  const { data, error } = await supabase.rpc("client_assign_generated_v2_program", {
    p_starts_on: input.startsOn,
    p_replace: input.replace,
    p_generation_status: input.generationStatus,
    p_validation_status: input.validationStatus,
    p_payload: input.payload,
  });
  if (error) throw error;
  return data;
}

export async function clientRecordProgramReviewRequired(input: {
  evaluationKey: string;
  reasonCode: string;
  snapshot: Record<string, unknown>;
}) {
  const { data, error } = await supabase.rpc("client_upsert_adaptive_decision", {
    p_decision_type: "PROGRAM_VALIDATION_BLOCKED",
    p_evaluation_key: input.evaluationKey,
    p_reason_code: input.reasonCode,
    p_confidence: "HIGH",
    p_input_snapshot: input.snapshot,
  });
  if (error) throw error;
  return data;
}
