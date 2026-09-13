export * from "./primary-strategy";
export * from "./v2-primary-bridge";
export * from "./activity-roles";
export * from "./legacy-program-goal";
export * from "./contract";
export * from "./snapshot-policy";
export * from "./template-resolution-types";
export * from "./fixture-catalog";
export * from "./template-ranking";
export * from "./template-compatibility-gate";
export * from "./template-resolver";
export * from "./template-coverage-audit";
export * from "./pilot-4";
// Phase 8/9 pack modules are imported directly — do not re-export here.
// Re-exporting them from this barrel creates a circular init with pilot-4/definitions
// (definitions imports this barrel).

