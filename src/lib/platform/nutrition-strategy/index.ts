export * from "./constants";
export * from "./types";
export * from "./goal-profile-resolver";
export * from "./target-engine";
export * from "./serving-policy";
export * from "./variety-policy";
export * from "./pre-post-resolver";
export * from "./validate-nutrition-plan";
export * from "./whole-day-optimizer";
export * from "./resolve-nutrition-day";
export * from "./swap-service";
export * from "./decision-trace";
export * from "./consumption";
export * from "./legacy-compat";
export * from "./entitlements-strategy";
export * from "./assignment-orchestrator";
export * from "./profile-from-quiz";

export function isFailClosed(
  result: unknown,
): result is import("./types").NutritionFailClosedOutcome {
  return (
    typeof result === "object" &&
    result !== null &&
    "code" in result &&
    typeof (result as { code: unknown }).code === "string"
  );
}
