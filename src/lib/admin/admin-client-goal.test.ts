import { ADMIN_GOAL_PICKER_GROUPS, presentClientTrainingGoal } from "./admin-client-goal";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const mapped = presentClientTrainingGoal("glutes");
assert(mapped.status === "MAPPED", "legacy glutes is mapped");
assert(mapped.canonicalId === "GLUTE_GROWTH", "glutes → GLUTE_GROWTH");
assert(mapped.matrixReady, "mapped goals can generate");

const mappedMale = presentClientTrainingGoal("muscle");
assert(mappedMale.status === "MAPPED", "legacy muscle is mapped");
assert(mappedMale.canonicalId === "MUSCLE_GROWTH", "muscle → MUSCLE_GROWTH");
assert(mappedMale.matrixReady, "mapped male goals can generate");

const canonical = presentClientTrainingGoal("FAT_LOSS");
assert(canonical.status === "MAPPED", "canonical FAT_LOSS mapped");
assert(canonical.displayAr.includes("دهون"), "arabic label");

const toneMapped = presentClientTrainingGoal("tone");
assert(toneMapped.status === "MAPPED", "tone quiz goal is mapped");
assert(toneMapped.canonicalId === "TONED_ARMS_UPPER_BODY", "tone → TONED_ARMS_UPPER_BODY");
assert(toneMapped.matrixReady, "mapped tone can generate");

const missing = presentClientTrainingGoal(null);
assert(missing.status === "MISSING", "empty goal");
assert(!missing.matrixReady, "missing cannot generate");

assert(
  ADMIN_GOAL_PICKER_GROUPS.some((group) => group.id === "male" && group.goals.includes("MUSCLE_GROWTH")),
  "picker lists male muscle goal",
);
assert(
  ADMIN_GOAL_PICKER_GROUPS.some((group) => group.id === "female" && group.goals.includes("GLUTE_GROWTH")),
  "picker lists female glute goal",
);
assert(
  ADMIN_GOAL_PICKER_GROUPS.flatMap((group) => group.goals).includes("FAT_LOSS"),
  "picker still lists shared fat loss",
);

console.log("admin-client-goal.test.ts: all assertions passed");
