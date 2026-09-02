import type { EntitlementsSnapshot } from "@/lib/platform/entitlements";
import { isTrainingPreviewMode } from "@/lib/platform/entitlements";

export function countVisibleSessionExercises(
  entitlements: EntitlementsSnapshot,
  totalExercises: number,
): number {
  if (!isTrainingPreviewMode(entitlements)) return totalExercises;
  return Math.min(totalExercises, Math.max(entitlements.training.allowedExercisesPerSession, 0));
}

export function countHiddenSessionExercises(
  entitlements: EntitlementsSnapshot,
  totalExercises: number,
): number {
  return Math.max(0, totalExercises - countVisibleSessionExercises(entitlements, totalExercises));
}

export function isSessionExerciseVisible(
  entitlements: EntitlementsSnapshot,
  orderIndex: number,
  totalExercises: number,
): boolean {
  return orderIndex < countVisibleSessionExercises(entitlements, totalExercises);
}
