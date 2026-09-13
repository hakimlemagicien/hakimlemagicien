import type { PreferredMediaVariant } from "@/lib/platform/training-templates/contract";
import {
  readTemplateContractFromMetadata,
  type ProgramTemplateContractV1,
} from "@/lib/platform/training-templates/contract";
import type { ExerciseMediaVariant } from "./types";

/** Single canonical normalizer — missing/unknown → STANDARD (historical assignments). */
export function normalizePreferredMediaVariant(value: unknown): PreferredMediaVariant {
  return value === "FEMALE" ? "FEMALE" : "STANDARD";
}

/**
 * Resolve template media preference without hardcoding goal === glute in UI.
 */
export function preferredMediaVariantFromContract(
  contract: Pick<ProgramTemplateContractV1, "media_preference"> | null | undefined,
): PreferredMediaVariant {
  return normalizePreferredMediaVariant(contract?.media_preference?.preferred_media_variant);
}

export function preferredMediaVariantFromTemplateMetadata(
  metadata: Record<string, unknown> | null | undefined,
): PreferredMediaVariant {
  const contract = metadata ? readTemplateContractFromMetadata(metadata) : null;
  return preferredMediaVariantFromContract(contract);
}

/** From assignment row / runtime payload (frozen snapshot field). */
export function preferredMediaVariantFromAssignment(input: {
  preferred_media_variant?: unknown;
  preferredMediaVariant?: unknown;
} | null | undefined): PreferredMediaVariant {
  if (!input) return "STANDARD";
  return normalizePreferredMediaVariant(
    input.preferred_media_variant ?? input.preferredMediaVariant,
  );
}

export function toExerciseMediaVariantPreference(
  preferred: PreferredMediaVariant | null | undefined,
): ExerciseMediaVariant {
  return preferred === "FEMALE" ? "FEMALE" : "STANDARD";
}
