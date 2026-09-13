/**
 * Phase 7 — assignment history presentation unit tests (no DB).
 */
import assert from "node:assert/strict";
import {
  ASSIGNMENT_HISTORY_FILTERS,
  buildReplaceConfirmationBody,
  filterAssignmentHistory,
  presentAssignmentHistoryRow,
  templateVersionLabel,
} from "./admin-assignment-history.ts";
import type { AdminAssignmentSummary } from "./admin-client-training-api.ts";

const rows: AdminAssignmentSummary[] = [
  {
    id: "a-new",
    source_template_id: "tpl-2",
    template_version: 2,
    status: "active",
    name_ar: "أساس بناء العضلات",
    starts_on: "2026-09-13",
    assigned_at: "2026-09-13T10:00:00Z",
    ended_at: null,
    snapshot_complete: true,
    generation_source: "template",
    progression_strategy: "SMART_PROGRESSION_EXERCISE_LOCKED",
  },
  {
    id: "a-old",
    source_template_id: "tpl-1",
    template_version: 1,
    status: "replaced",
    name_ar: "أساس بناء العضلات",
    starts_on: "2026-09-01",
    assigned_at: "2026-09-01T10:00:00Z",
    ended_at: "2026-09-13T10:00:00Z",
    snapshot_complete: true,
    generation_source: "template",
    progression_strategy: "SMART_PROGRESSION_EXERCISE_LOCKED",
  },
];

assert.equal(templateVersionLabel(1), "v1");
assert.equal(templateVersionLabel(2), "v2");
assert.equal(filterAssignmentHistory(rows, "replaced").length, 1);
assert.equal(filterAssignmentHistory(rows, "active")[0].id, "a-new");
assert.ok(ASSIGNMENT_HISTORY_FILTERS.some((f) => f.id === "replaced"));

const presented = presentAssignmentHistoryRow(rows[0]);
assert.equal(presented.versionLabel, "v2");
assert.equal(presented.isCurrent, true);
assert.ok(presented.sourceLabel.length > 0);
assert.ok(presented.progressionLabel.length > 0);

const body = buildReplaceConfirmationBody({
  currentName: "أساس بناء العضلات",
  currentVersion: 1,
  newName: "أساس بناء العضلات",
  newVersion: 2,
  startsOn: "2026-09-13",
});
assert.match(body, /v1/);
assert.match(body, /v2/);
assert.match(body, /لقطة/);
assert.match(body, /التاريخ/);

console.log("admin-assignment-history.test.ts: PASS");
