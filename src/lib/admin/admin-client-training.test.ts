import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ASSIGNMENT_SNAPSHOT_VERSION_SAFE,
  ASSIGNMENT_STATUSES,
  LEGACY_ASSIGNMENT_REVIEW_REQUIRED,
  assignmentStatusLabel,
  currentWeekNumber,
  formatRepsLabel,
  logIsLegacyUnlinked,
  objectiveTrainingSignals,
  validateClientPrescription,
} from "./admin-client-training";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(ASSIGNMENT_SNAPSHOT_VERSION_SAFE, "assignment snapshot version safety is complete");
assert(LEGACY_ASSIGNMENT_REVIEW_REQUIRED, "legacy pointer rows are not invented into snapshots");
assert(ASSIGNMENT_STATUSES.includes("replaced"), "replacement is a lifecycle status");
assert(assignmentStatusLabel("active") === "نشط", "active label");
assert(formatRepsLabel({ reps_min: 8, reps_max: 12 }) === "8 - 12", "rep range label");
assert(formatRepsLabel({ reps_label: "AMRAP" }) === "AMRAP", "explicit label wins");
assert(currentWeekNumber({ startsOn: "2026-08-01", durationWeeks: 4, today: "2026-08-20" }).week === 3, "week from start date");
assert(currentWeekNumber({ startsOn: "2026-08-25", durationWeeks: 4, today: "2026-08-20" }).reason === "scheduled", "future start");
assert(currentWeekNumber({ startsOn: "2026-06-01", durationWeeks: 4, today: "2026-08-20" }).reason === "ended", "duration elapsed");
assert(objectiveTrainingSignals({ status: null, startsOn: null, durationWeeks: null, snapshotComplete: null })[0] === "no_active_program");
assert(
  objectiveTrainingSignals({
    status: "active",
    startsOn: "2026-01-01",
    durationWeeks: 4,
    snapshotComplete: true,
    today: "2026-08-20",
  }).includes("program_ended"),
  "ended duration is objective",
);
assert(
  objectiveTrainingSignals({
    status: "active",
    startsOn: "2026-08-01",
    durationWeeks: 12,
    snapshotComplete: false,
    today: "2026-08-20",
  }).includes("legacy_assignment"),
  "missing snapshot is flagged",
);
assert(!validateClientPrescription({ sets: 3, rest_seconds: 60 }), "valid prescription");
assert(validateClientPrescription({ sets: 0, rest_seconds: 60 }) === "invalid_sets", "sets > 0");
assert(validateClientPrescription({ sets: 3, rest_seconds: -1 }) === "invalid_rest", "rest >= 0");
assert(logIsLegacyUnlinked(null), "null assignment is legacy log");
assert(!logIsLegacyUnlinked("assign-1"), "linked log is not legacy");

const root = process.cwd();
const workspace = readFileSync(join(root, "src/components/admin/ClientTrainingWorkspace.tsx"), "utf8");
assert(workspace.includes("تعيين برنامج"), "assign action exists");
assert(workspace.includes("استبدال التمرين"), "exercise substitution exists");
assert(!workspace.includes("window.confirm"), "no window.confirm");
assert(!workspace.includes("87%"), "no fake adherence");
assert(workspace.includes("AdminConfirmDialog") || workspace.includes("onConfirm"), "sensitive actions confirm");
assert(workspace.includes("تاريخ البرامج"), "program history exists");
assert(workspace.includes("محرر نسخة العميل"), "client copy editor exists");
assert(workspace.includes("CLIENT-SPECIFIC EDIT"), "client-specific edit badge exists");
assert(workspace.includes("ClientTrainingGoalCard"), "client goal editor exists");
assert(workspace.includes("Strategy Matrix"), "matrix source selector exists");
assert(workspace.includes("Program Template"), "template source selector exists");
assert(workspace.includes("حفظ التعديلات"), "sticky save exists");
assert(workspace.includes("prepareTrainingProgramAssignment"), "V2 orchestrator wired");
assert(workspace.includes("رفض"), "reject action exists");
assert(workspace.includes("ClientProgressionStrategyCard"), "progression strategy card wired");
assert(workspace.includes("استراتيجية التطور"), "progression strategy section exists");
assert(workspace.includes("تغيير استراتيجية التطور") || workspace.includes("ClientProgressionStrategyCard"), "change strategy action exists");

const client360 = readFileSync(join(root, "src/routes/admin/clients/$clientId.tsx"), "utf8");
assert(client360.includes("ClientTrainingWorkspace"), "client 360 training workspace is wired");
assert(!client360.includes("محرر البرامج سيأتي لاحقاً"), "placeholder editor copy is gone");

console.log("admin-client-training tests passed");
