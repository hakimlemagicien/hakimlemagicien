import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { oauthPostAuthLocation, isOnboardingCompleteFromState } from "./auth-onboarding-gate.ts";

const root = process.cwd();
const quiz = readFileSync(resolve(root, "src/routes/quiz.tsx"), "utf8");
const onboarding = readFileSync(resolve(root, "src/components/quiz/QuizOnboardingScreens.tsx"), "utf8");
const homeHub = readFileSync(resolve(root, "src/lib/platform/home-hub.ts"), "utf8");
const onboardingApi = readFileSync(resolve(root, "src/lib/quiz-onboarding-api.ts"), "utf8");
const migration = readFileSync(
  resolve(root, "supabase/migrations/20260911120000_finalize_onboarding_prefer_quiz_name.sql"),
  "utf8",
);

// 1) Age wheel: no pt-4 offset that desyncs سنة
assert(quiz.includes("Wheel — band and scroller share the same box"), "age wheel alignment comment");
assert(!/relative h-full overflow-hidden rounded-\[28px\] pt-4/.test(quiz), "age wheel no pt-4");
assert(quiz.includes("سنة"), "age unit label present");

// 2) Training environment: home + gym only in picker
assert(quiz.includes('id: "home"'), "home option");
assert(quiz.includes('id: "gym"'), "gym option");
assert(!quiz.includes('id: "anywhere"'), "anywhere option removed from picker");
assert(!quiz.includes("في أي مكان"), "anywhere Arabic label removed");
assert(!quiz.includes("training-env-anywhere"), "anywhere asset import removed");

// 3) OAuth contact: email field hidden when oauthSession
assert(quiz.includes("oauthSession ? null"), "OAuth hides email field");
assert(quiz.includes("userHasOAuthIdentity"), "OAuth identity detection in quiz");
assert(onboardingApi.includes("syncOnboardingDisplayName"), "quiz name sync helper");

// 4) OAuth password skip
assert(onboarding.includes("oauthSkipping"), "CreatePassword OAuth skip");
assert(onboarding.includes("Google أو Apple — نكمل إعداد ملفك بدون كلمة مرور"), "OAuth skip copy");

// 5) Greeting prefers quiz name
assert(homeHub.includes("quiz onboarding name wins over Google/Apple"), "greeting priority comment");
assert(/const quizFirst = readQuizProgress\(\)\?\.userName/.test(homeHub), "quiz name first");

// Migration prefers quiz full_name over existing OAuth profile name
assert(
  migration.includes("full_name = COALESCE(NULLIF(btrim(EXCLUDED.full_name), ''), public.profiles.full_name)"),
  "profiles prefer quiz name",
);
assert(
  migration.includes(
    "full_name = COALESCE(NULLIF(btrim(EXCLUDED.full_name), ''), public.training_profiles.full_name)",
  ),
  "training_profiles prefer quiz name",
);

// Existing onboarding gate still sound
assert.deepEqual(oauthPostAuthLocation(false), { to: "/quiz" });
assert.deepEqual(oauthPostAuthLocation(isOnboardingCompleteFromState({ onboarding_completed: true })), {
  to: "/app",
});

console.log("quiz-oauth-ux-fixes.test.ts: PASS");
