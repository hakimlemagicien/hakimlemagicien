/**
 * Phase 7 — Admin assignment history presentation helpers.
 * Program Template ≠ Client Assignment; history is status-lifecycle, not magic rollback.
 */
import type { AdminAssignmentSummary } from "@/lib/admin/admin-client-training-api";
import { assignmentStatusLabel } from "@/lib/platform/training-assignment";
import {
  parseProgressionStrategy,
  programSourceLabel,
  progressionStrategyLabel,
  resolveProgramSource,
} from "@/lib/platform/progression-strategy";

export type AssignmentHistoryFilter = "all" | "active" | "replaced" | "completed" | "cancelled" | "scheduled";

export const ASSIGNMENT_HISTORY_FILTERS: Array<{ id: AssignmentHistoryFilter; label_ar: string }> = [
  { id: "all", label_ar: "الكل" },
  { id: "active", label_ar: "نشط" },
  { id: "scheduled", label_ar: "مجدول" },
  { id: "replaced", label_ar: "مستبدل" },
  { id: "completed", label_ar: "مكتمل" },
  { id: "cancelled", label_ar: "ملغى" },
];

export function isCurrentAssignmentStatus(status: string): boolean {
  return status === "active" || status === "scheduled";
}

export function filterAssignmentHistory(
  rows: AdminAssignmentSummary[],
  filter: AssignmentHistoryFilter,
): AdminAssignmentSummary[] {
  if (filter === "all") return rows;
  return rows.filter((row) => row.status === filter);
}

export function templateVersionLabel(version: number | null | undefined): string {
  const n = Number(version ?? 1);
  return Number.isFinite(n) && n > 0 ? `v${n}` : "v1";
}

export function presentAssignmentHistoryRow(row: AdminAssignmentSummary): {
  title: string;
  statusLabel: string;
  versionLabel: string;
  sourceLabel: string;
  progressionLabel: string;
  isCurrent: boolean;
} {
  const source = resolveProgramSource({
    source_template_id: row.source_template_id,
    generation_source: row.generation_source ?? null,
  });
  const strategy = row.progression_strategy
    ? progressionStrategyLabel(parseProgressionStrategy(row.progression_strategy))
    : "—";
  return {
    title: row.name_ar?.trim() || "برنامج بدون اسم",
    statusLabel: assignmentStatusLabel(row.status),
    versionLabel: templateVersionLabel(row.template_version),
    sourceLabel: programSourceLabel(source),
    progressionLabel: strategy,
    isCurrent: isCurrentAssignmentStatus(row.status),
  };
}

/** Replace confirmation copy — Arabic RTL admin. */
export function buildReplaceConfirmationBody(input: {
  currentName?: string | null;
  currentVersion?: number | null;
  newName: string;
  newVersion: number;
  startsOn: string;
}): string {
  const current = input.currentName?.trim() || "البرنامج الحالي";
  const cv = templateVersionLabel(input.currentVersion);
  const nv = templateVersionLabel(input.newVersion);
  return [
    `الحالي: ${current} (${cv})`,
    `الجديد: ${input.newName} (${nv})`,
    `البداية: ${input.startsOn}`,
    "يُنشئ لقطة برنامج جديدة للعميل.",
    "التعيين السابق يبقى في التاريخ بحالة مستبدل.",
    "تعديل القالب الرئيسي لاحقاً لا يغيّر اللقطات السابقة.",
  ].join(" ");
}
