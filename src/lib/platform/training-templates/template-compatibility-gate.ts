/**
 * Equipment / capability gates for Template Resolver (Phase 3).
 * Reuses Phase 2 HOME unknown → REVIEW_REQUIRED policy.
 */

import {
  resolveHomeCapabilityGate,
  type ProgramTemplateContractV1,
} from "./contract";
import type {
  EquipmentCompatibility,
  HomeCapabilityMap,
  ResolvableTemplateRecord,
} from "./template-resolution-types";

export function assessEquipmentCompatibility(input: {
  template: ResolvableTemplateRecord;
  availableEquipment: string[] | null | undefined;
}): EquipmentCompatibility {
  const required = input.template.contract.eligibility.equipment_requirements ?? [];
  const tags = input.template.equipment_tags ?? [];
  const needed = [...required, ...tags.filter(() => false)]; // equipment_requirements primary
  const reqList = required.length > 0 ? required : [];

  if (reqList.length === 0) {
    // Coarse equipment_tags are informational only unless eligibility.equipment_requirements is set.
    return "SUPPORTED";
  }

  if (!input.availableEquipment || input.availableEquipment.length === 0) {
    return "UNKNOWN";
  }

  const available = new Set(input.availableEquipment.map((item) => item.trim().toLowerCase()));
  const missing = reqList.filter((item) => !available.has(item.trim().toLowerCase()));
  if (missing.length === 0) return "SUPPORTED";
  return "INCOMPATIBLE";
}

export function assessCapabilityCompatibility(input: {
  contract: ProgramTemplateContractV1;
  homeCapabilities: HomeCapabilityMap | null | undefined;
}): {
  status: "COMPATIBLE" | "REVIEW_REQUIRED" | "INCOMPATIBLE" | "N/A";
  reasons: string[];
} {
  const requirements = input.contract.eligibility.capability_requirements ?? [];
  if (requirements.length === 0) {
    return { status: "N/A", reasons: [] };
  }
  const gate = resolveHomeCapabilityGate({
    requirements,
    knownCapabilities: input.homeCapabilities ?? {},
  });
  if (gate.status === "SAFE") return { status: "COMPATIBLE", reasons: [] };
  if (gate.reasons.some((r) => r.startsWith("MISSING_CAPABILITY:"))) {
    return { status: "INCOMPATIBLE", reasons: gate.reasons };
  }
  return { status: "REVIEW_REQUIRED", reasons: gate.reasons };
}

export function isLibraryBlocking(state: string): boolean {
  return state === "MISSING_EXERCISE";
}
