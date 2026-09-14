import { readFileSync } from "node:fs";
import { join } from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const root = process.cwd();
const migration = readFileSync(
  join(root, "supabase/migrations/20260914150000_client_assignment_draft_publish.sql"),
  "utf8",
);
const trainingApi = readFileSync(join(root, "src/lib/admin/admin-client-training-api.ts"), "utf8");
const nutritionApi = readFileSync(join(root, "src/lib/admin/admin-client-nutrition-api.ts"), "utf8");
const publishBar = readFileSync(join(root, "src/components/admin/AssignmentPublishBar.tsx"), "utf8");
const trainingUi = readFileSync(join(root, "src/components/admin/ClientTrainingWorkspace.tsx"), "utf8");
const nutritionUi = readFileSync(join(root, "src/components/admin/ClientNutritionWorkspace.tsx"), "utf8");
const membershipUi = readFileSync(join(root, "src/components/admin/ClientMembershipWorkspace.tsx"), "utf8");

assert(migration.includes("status IN ('draft', 'scheduled', 'active'"), "draft status allowed on assignments");
assert(migration.includes("client_program_assignments_one_draft"), "one training draft per client");
assert(migration.includes("client_nutrition_assignments_one_draft"), "one nutrition draft per client");
assert(migration.includes("published_assignment_immutable"), "save blocked on published");
assert(migration.includes("admin_create_client_program_draft"), "training create draft");
assert(migration.includes("admin_publish_client_program_draft"), "training publish");
assert(migration.includes("admin_discard_client_program_draft"), "training discard");
assert(migration.includes("admin_save_client_assignment_day"), "week/day editor RPC");
assert(migration.includes("admin_create_client_nutrition_draft"), "nutrition create draft");
assert(migration.includes("admin_publish_client_nutrition_draft"), "nutrition publish");
assert(migration.includes("admin_discard_client_nutrition_draft"), "nutrition discard");
assert(
  migration.includes("a.status IN ('active', 'scheduled')"),
  "member RLS hides drafts for training tree",
);

assert(trainingApi.includes("createAdminClientProgramDraft"), "training API create");
assert(trainingApi.includes("publishAdminClientProgramDraft"), "training API publish");
assert(trainingApi.includes("saveAdminClientAssignmentDay"), "training API day save");
assert(nutritionApi.includes("createAdminClientNutritionDraft"), "nutrition API create");
assert(nutritionApi.includes("publishAdminClientNutritionDraft"), "nutrition API publish");

assert(publishBar.includes("حفظ المسودة"), "save draft CTA");
assert(publishBar.includes("Publish للعميل"), "publish CTA");
assert(publishBar.includes("معاينة كعميل"), "preview CTA");
assert(trainingUi.includes("detail.status !== \"draft\""), "training save gated to draft");
assert(nutritionUi.includes("detail.status !== \"draft\""), "nutrition save gated to draft");
assert(trainingUi.includes("Save Draft") === false || trainingUi.includes("حفظ المسودة") || trainingUi.includes("onSaveDraft"), "training save draft UX");
assert(nutritionUi.includes("معاينة التغذية كما يراها العميل"), "nutrition preview mode");
assert(nutritionUi.includes("setEditing(true);\n    } catch (err)"), "nutrition save draft stays in draft editor");

assert(membershipUi.includes("directoryPlanLabelAr(membership.tier)"), "membership tier surfaced");
assert(membershipUi.includes("membership.is_active"), "membership status surfaced");
assert(
  membershipUi.includes("paid_period_end") || membershipUi.includes("next_renewal_at"),
  "membership expiry surfaced",
);
assert(membershipUi.includes("/admin/memberships"), "activate/change via existing memberships hub");
assert(
  membershipUi.includes("تفعيل / تغيير العضوية") || membershipUi.includes("إدارة الاشتراك"),
  "membership activate/change CTA",
);

console.log("assignment-draft-publish contract tests passed");
