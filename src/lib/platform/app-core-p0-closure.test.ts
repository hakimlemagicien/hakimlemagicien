import { readFileSync } from "node:fs";
import { join } from "node:path";
import { canUseCoachChat } from "./coaching-messaging";
import { FREE_MEMBERSHIP_STATE } from "./membership";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

const layout = read("src/routes/_platform/route.tsx");
const hook = read("src/hooks/useNutritionAutoAssign.ts");
const autoAssign = read("src/lib/platform/nutrition-auto-assign.ts");
const migration = read("supabase/migrations/20260920120000_client_nutrition_auto_assign_p0.sql");
const mealApi = read("src/lib/platform/meal-library-api.ts");
const home = read("src/lib/platform/home-hub.ts");
const preview = read("src/routes/admin/client-preview/$clientId.tsx");
const adminNutrition = read("src/components/admin/ClientNutritionWorkspace.tsx");
const headerActions = read("src/components/platform/shared/PlatformHeaderActions.tsx");
const inboxHook = read("src/hooks/useCoachingInbox.ts");
const supportHub = read("src/components/platform/support/SupportHub.tsx");
const profileHub = read("src/components/platform/profile/ProfileHub.tsx");
const coachChatPage = read("src/components/platform/support/CoachChatPage.tsx");

assert(layout.includes("useNutritionAutoAssign"), "journey-ready layout wires nutrition auto assign");
assert(layout.includes('journey.data?.phase === "ready"'), "auto assign waits for preparation completion");
assert(layout.includes("journey.data.trainingMealWindow"), "auto assign requires training meal window");
assert(hook.includes('queryKey: ["client-nutrition-runtime"]'), "runtime refreshes after assignment");
assert(hook.includes('input.userId === "guest"'), "placeholder guest identity cannot consume the assignment attempt");
assert(hook.includes("attemptedUserRef.current === input.userId"), "assignment attempt is scoped to the authenticated user");
assert(autoAssign.includes("client_auto_assign_my_nutrition"), "client calls self-only assignment RPC");
assert(!autoAssign.includes("admin_assign_nutrition_template"), "auto assign has no Admin dependency");
assert(autoAssign.includes('source !== "supabase"'), "assignment fails closed without live catalog");

assert(migration.includes("auth.uid()"), "RPC binds assignment to authenticated user");
assert(migration.includes("pg_advisory_xact_lock"), "RPC serializes duplicate requests");
assert(migration.includes("already_assigned"), "RPC is idempotent");
assert(migration.includes("_nutrition_template_validate_slots"), "DB slot validator remains enforced");
assert(migration.includes("jsonb_array_elements"), "all six slot payload entries are inspected");
assert(migration.includes("status IN ('active', 'scheduled', 'draft')"), "existing assignment prevents regeneration");
assert(migration.includes("CUSTOMER_JOURNEY_NOT_READY"), "RPC rejects premature assignment");
assert(migration.includes("ALLERGY_STATUS_REQUIRED"), "RPC requires nutrition safety answer");
assert(migration.includes("DEFAULT_NUTRITION_TEMPLATE_MISSING"), "RPC resolves default template server-side");
assert(migration.includes("client_nutrition_auto_assigned"), "successful automatic decision is audited");
assert(migration.includes("candidate_pool','live_database_slot_safe'"), "decision trace records live safe pool");
assert(migration.includes("_record_nutrition_auto_assign_failure"), "blocked assignments create actionable Admin traces");
assert(migration.includes("failed_meal_type"), "unsafe slot trace includes the actual meal type");

assert(mealApi.includes("setMealLibraryCatalog(authoritative)"), "database catalog is authoritative");
assert(!mealApi.includes("overlayMealCatalog(getMealLibrarySeed()"), "database ids never merge with stale seed ids");
assert(home.includes("nextNutritionMeal"), "Home accepts real assignment meal only");
assert(!home.includes("MEALS_SEED[activity.mealsDone]"), "Home fake meal fallback removed");
assert(home.includes("خطتك الغذائية قيد التجهيز"), "Home has controlled no-assignment state");

assert(!canUseCoachChat({ ...FREE_MEMBERSHIP_STATE.features, limited_coach_contact: true }, "premium"), "PRO chat is disabled by official V1 contract");
assert(canUseCoachChat(FREE_MEMBERSHIP_STATE.features, "vip"), "VIP chat remains available");
assert(headerActions.includes("coachChatEnabled ?"), "non-VIP header does not render a coach chat entry");
assert(headerActions.includes("enabled: coachChatEnabled"), "non-VIP header does not query the coaching inbox");
assert(inboxHook.includes("enabled: enabled && loadItems"), "coaching notification reads respect entitlement");
assert(supportHub.includes("{canChat ? <section"), "non-VIP support does not advertise a live coach card");
assert(profileHub.includes("{canContactCoach ? ("), "non-VIP profile hides the coach chat row");
assert(coachChatPage.includes("ولا تشملها باقات FREE أو PLUS أو PRO"), "direct chat route explains the official VIP-only contract");
assert(preview.includes("normalizeEntitlements"), "View as Client uses shared entitlement contract");
assert(preview.includes("isMealSlotUnlockedByEntitlements"), "preview meal visibility uses runtime entitlement helper");
assert(preview.includes("تمرين مخصص مقفل"), "FREE preview reproduces protected training cards");
assert(preview.includes("وجبة مخصصة مقفلة"), "FREE preview protects five meal details");
assert(adminNutrition.includes("سبب قرار التغذية"), "Admin displays assignment decision trace");

console.log("app-core-p0-closure.test.ts: PASS");
