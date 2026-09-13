/**
 * Glute release required set — production handoff IDs from approved audit.
 * Completeness scope for Glute gate only. Not a second exercise library.
 */

export const GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS = [
  "AB-006",
  "AB-011",
  "BA-006",
  "BA-010",
  "BA-016",
  "BA-017",
  "BA-023",
  "BI-001",
  "BI-002",
  "CH-003",
  "CH-012",
  "GL-001",
  "GL-002",
  "GL-003",
  "GL-004",
  "GL-006",
  "GL-007",
  "GL-009",
  "GL-015",
  "LE-001",
  "LE-003",
  "LE-004",
  "LE-005",
  "LE-007",
  "LE-008",
  "LE-009",
  "SH-002",
  "SH-005",
  "TR-001",
  "TR-002",
  "WU-001",
  "WU-002",
  "WU-003",
  "WU-010",
  "WU-013",
  "WU-017",
  "WU-019",
  "WU-020",
  "WU-021",
  "WU-022",
] as const;

export type GluteFemaleMediaRequiredId =
  (typeof GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS)[number];

export const GLUTE_FEMALE_MEDIA_TEMPLATE_SLUGS = [
  "GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D",
  "GLUTE_FOCUS_PROGRESS_INTERMEDIATE_GYM_4D",
] as const;

/**
 * P0 shared Glute set (both Foundation + Progress) — from approved manifest priority=P0.
 * Registration batch scope. Full Glute set remains GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS (40).
 */
export const GLUTE_P0_FEMALE_MEDIA_EXTERNAL_IDS = [
  "AB-011",
  "BA-016",
  "BA-023",
  "CH-012",
  "GL-001",
  "GL-003",
  "GL-004",
  "GL-006",
  "GL-007",
  "GL-015",
  "LE-007",
  "WU-001",
  "WU-002",
  "WU-003",
  "WU-017",
  "WU-020",
  "WU-022",
] as const;

export type GluteP0FemaleMediaId = (typeof GLUTE_P0_FEMALE_MEDIA_EXTERNAL_IDS)[number];

export function isGluteP0FemaleMediaId(id: string): id is GluteP0FemaleMediaId {
  return (GLUTE_P0_FEMALE_MEDIA_EXTERNAL_IDS as readonly string[]).includes(id);
}

export function isGluteFemaleMediaRequiredId(id: string): id is GluteFemaleMediaRequiredId {
  return (GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS as readonly string[]).includes(id);
}

export function isGluteFemaleMediaTemplateSlug(slug: string): boolean {
  return (GLUTE_FEMALE_MEDIA_TEMPLATE_SLUGS as readonly string[]).includes(slug);
}
