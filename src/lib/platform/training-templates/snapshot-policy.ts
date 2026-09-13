/**
 * Snapshot policy for Unified Template Contract vs client assignment.
 * Documentary + helpers — does not change DB snapshot semantics in Phase 2.
 */

import type { ProgramTemplateContractV1 } from "./contract";

export type SnapshotFieldPolicy = "FREEZE_INTO_ASSIGNMENT" | "MASTER_ONLY" | "PROVENANCE_RECORD";

/**
 * A — freeze / provenance into assignment when it affects prescription or explains assign
 * B — master-only catalog/admin presentation
 * C — provenance record (assignment reason / strategy ids)
 */
export const TEMPLATE_CONTRACT_SNAPSHOT_POLICY: Record<
  keyof ProgramTemplateContractV1 | "assignment_reason",
  SnapshotFieldPolicy
> = {
  contract_version: "PROVENANCE_RECORD",
  primary_strategy: "PROVENANCE_RECORD",
  template_family: "PROVENANCE_RECORD",
  legacy_program_goal: "FREEZE_INTO_ASSIGNMENT",
  variant: "FREEZE_INTO_ASSIGNMENT",
  duration_weeks: "FREEZE_INTO_ASSIGNMENT",
  target_gender: "PROVENANCE_RECORD",
  target_audience: "MASTER_ONLY",
  template_purpose: "MASTER_ONLY",
  admin_summary: "MASTER_ONLY",
  eligibility: "PROVENANCE_RECORD",
  activity_roles: "FREEZE_INTO_ASSIGNMENT",
  progression: "PROVENANCE_RECORD",
  media_preference: "PROVENANCE_RECORD",
  review_signals: "PROVENANCE_RECORD",
  transition_policies: "MASTER_ONLY",
  library_readiness: "MASTER_ONLY",
  provenance: "PROVENANCE_RECORD",
  assignment_reason: "PROVENANCE_RECORD",
};

export type AssignmentProvenanceFromTemplate = {
  primary_strategy: ProgramTemplateContractV1["primary_strategy"];
  template_family: ProgramTemplateContractV1["template_family"];
  contract_version: number;
  variant: ProgramTemplateContractV1["variant"];
  progression_compatible: ProgramTemplateContractV1["progression"]["compatible_strategies"];
  review_signals: ProgramTemplateContractV1["review_signals"];
  media_preference: ProgramTemplateContractV1["media_preference"];
};

export function buildAssignmentProvenanceFromContract(
  contract: ProgramTemplateContractV1,
): AssignmentProvenanceFromTemplate {
  return {
    primary_strategy: contract.primary_strategy,
    template_family: contract.template_family,
    contract_version: contract.contract_version,
    variant: { ...contract.variant },
    progression_compatible: [...contract.progression.compatible_strategies],
    review_signals: [...contract.review_signals],
    media_preference: { ...contract.media_preference },
  };
}
