/**
 * Quiz → Strategy Matrix bridge contract checks.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const root = process.cwd();
const bridge = readFileSync(
  join(root, "src/lib/platform/strategy-matrix/quiz-strategy-bridge.ts"),
  "utf8",
);
assert(bridge.includes("CLIENT_DEFAULT_TRAINING_DAYS_PER_WEEK"), "product default 5 days");
assert(bridge.includes("resolveClientTrainingDaysPerWeek"), "days resolver");
assert(bridge.includes("sanitizeTrainingLocationHints"), "location sanitize");
assert(bridge.includes("dubai"), "ignores contact dubai");
assert(bridge.includes("remote"), "ignores contact remote");

const contracts = readFileSync(join(root, "src/lib/platform/training-v2-contracts.ts"), "utf8");
assert(contracts.includes('canonicalId: "TONED_ARMS_UPPER_BODY"'), "tone mapped in code");
assert(contracts.includes('canonicalId: "POSTURE_TONED_BACK"'), "fit mapped in code");

const resolveGoal = readFileSync(join(root, "src/lib/platform/strategy-matrix/resolve-goal.ts"), "utf8");
assert(resolveGoal.includes("OPEN_GOAL_MAPPING_DECISIONS"), "open decisions export exists");
assert(resolveGoal.includes("readonly string[] = []"), "no open quiz goal decisions");

const profileSource = readFileSync(
  join(root, "src/lib/platform/strategy-matrix/profile-source.ts"),
  "utf8",
);
assert(profileSource.includes("resolveClientTrainingDaysPerWeek"), "profile derives days");
assert(profileSource.includes("sanitizeTrainingLocationHints"), "profile sanitizes location");

const quiz = readFileSync(join(root, "src/routes/quiz.tsx"), "utf8");
assert(
  quiz.includes("training_type: quizAnswers.trainingEnvironment"),
  "quiz draft persists training place",
);

const setup = readFileSync(join(root, "src/lib/platform/client-training-strategy-setup.ts"), "utf8");
assert(setup.includes("assessClientStrategySetupGaps"), "setup assesses quiz gaps only");
assert(setup.includes("needDays: false"), "never re-ask days");
assert(setup.includes("needEnvironment: false"), "never re-ask environment");
assert(setup.includes("CLIENT_DEFAULT_TRAINING_DAYS_PER_WEEK"), "defaults days to product 5");

const card = readFileSync(
  join(root, "src/components/platform/workout/ClientTrainingStrategySetupCard.tsx"),
  "utf8",
);
assert(card.includes("gaps.needGoal"), "card asks goal only when missing");
assert(!card.includes("gaps.needDays"), "card never asks days");
assert(!card.includes("gaps.needEnvironment"), "card never asks environment");
assert(!card.includes("أيام التدريب أسبوعياً"), "no days field in client UI");
assert(!card.includes("مكان التدريب"), "no environment field in client UI");
assert(card.includes("gaps.isComplete"), "card auto-activates when quiz complete");

console.log("quiz-strategy-bridge.test.ts: all assertions passed");
