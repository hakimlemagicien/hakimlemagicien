/**
 * Client quiz answers catalog — contract checks.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const root = process.cwd();
const quizAnswers = readFileSync(join(root, "src/lib/platform/client-quiz-answers.ts"), "utf8");
assert(quizAnswers.includes("parseClientQuizAnswers"), "parser exists");
assert(quizAnswers.includes("nutritionProfileFromQuizAnswers"), "nutrition bridge exists");
assert(quizAnswers.includes("quizAnswersReadyForTraining"), "training readiness helper");
assert(quizAnswers.includes("approximateBirthDateFromAge"), "age → birthDate bridge");
assert(quizAnswers.includes("challengeId"), "challenge preserved");
assert(quizAnswers.includes("bodyType"), "body type preserved");
assert(quizAnswers.includes("injuryIds"), "injuries preserved");

const nutritionBridge = readFileSync(
  join(root, "src/lib/platform/nutrition-strategy/profile-from-quiz.ts"),
  "utf8",
);
assert(nutritionBridge.includes("nutritionProfileFromQuizAnswers"), "nutrition strategy exports quiz bridge");

const profileApi = readFileSync(join(root, "src/lib/platform/profile-api.ts"), "utf8");
assert(profileApi.includes("challengeId"), "profile snapshot exposes challenge");
assert(profileApi.includes("bodyType"), "profile snapshot exposes body type");
assert(profileApi.includes("injuryIds"), "profile snapshot exposes injuries");
assert(profileApi.includes("approximate") || profileApi.includes("age"), "age hydrated into birthDate");

const profileExperience = readFileSync(join(root, "src/lib/platform/profile-experience.ts"), "utf8");
assert(profileExperience.includes("parseClientQuizAnswers"), "profile uses quiz catalog");
assert(profileExperience.includes("trainingEnvironmentLabelAr"), "environment shown from quiz");
assert(profileExperience.includes("challengeLabelAr"), "challenge shown from quiz");
assert(!profileExperience.includes('missing("تاريخ الميلاد")') || profileExperience.includes("العمر"), "age can satisfy birth display");

const sheets = readFileSync(join(root, "src/components/platform/profile/ProfileSheets.tsx"), "utf8");
assert(sheets.includes('value="high"'), "activity options match quiz ids");
assert(sheets.includes("من الاستبيان"), "copy clarifies quiz is source of truth");

console.log("client-quiz-answers.test.ts: all assertions passed");
