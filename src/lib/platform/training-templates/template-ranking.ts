/**
 * Deterministic ranking for exact template candidates.
 */

import type { ResolvableTemplateRecord } from "./template-resolution-types";

function readinessScore(state: string): number {
  if (state === "READY") return 3;
  if (state === "MISSING_MEDIA") return 2;
  if (state === "REVIEW_REQUIRED") return 1;
  return 0; // MISSING_EXERCISE should already be excluded
}

/**
 * Tie-break order (documented):
 * 1. library READY > MISSING_MEDIA > REVIEW_REQUIRED
 * 2. higher template version
 * 3. stable slug ascending
 * 4. stable id ascending
 */
export function compareExactCandidates(a: ResolvableTemplateRecord, b: ResolvableTemplateRecord): number {
  const ready = readinessScore(b.contract.library_readiness.state) - readinessScore(a.contract.library_readiness.state);
  if (ready !== 0) return ready;
  if (b.version !== a.version) return b.version - a.version;
  const slug = a.slug.localeCompare(b.slug);
  if (slug !== 0) return slug;
  return a.id.localeCompare(b.id);
}

export function pickDeterministicWinner(
  candidates: ResolvableTemplateRecord[],
): ResolvableTemplateRecord | null {
  if (candidates.length === 0) return null;
  const sorted = [...candidates].sort(compareExactCandidates);
  return sorted[0] ?? null;
}
