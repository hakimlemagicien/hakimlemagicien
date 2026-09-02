import {
  CALORIE_TOLERANCE,
  MACRO_TOLERANCE_PCT,
  PROTEIN_TOLERANCE,
} from "./constants";
import type {
  MacroTotals,
  NutritionSlot,
  NutritionTarget,
  NutritionValidationIssue,
  NutritionValidationResult,
  ValidationBand,
  ValidationStatus,
} from "./types";

function bandFromDeltaPct(absPct: number, passPct: number, reviewPct: number): ValidationBand {
  if (absPct <= passPct) return "PASS";
  if (absPct <= reviewPct) return "REVIEW";
  return "FAIL";
}

function pctDelta(actual: number, target: number): number {
  if (target <= 0) return 0;
  return ((actual - target) / target) * 100;
}

export function sumPlannedTotals(
  slots: Array<{ macros: MacroTotals; counts_toward_day_totals: boolean; slot_state: string }>,
): MacroTotals {
  return slots.reduce(
    (sum, slot) => {
      if (!slot.counts_toward_day_totals) return sum;
      if (slot.slot_state === "NOT_REQUIRED" || slot.slot_state === "SATISFIED_BY_OTHER_MEAL") {
        return sum;
      }
      return {
        calories: sum.calories + slot.macros.calories,
        protein_g: sum.protein_g + slot.macros.protein_g,
        carbs_g: sum.carbs_g + slot.macros.carbs_g,
        fat_g: sum.fat_g + slot.macros.fat_g,
      };
    },
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
}

export function validateNutritionPlan(input: {
  target: NutritionTarget;
  planned_totals: MacroTotals;
  slots?: NutritionSlot[];
  allergy_safe?: boolean;
  entitlement_ok?: boolean;
}): NutritionValidationResult {
  const issues: NutritionValidationIssue[] = [];
  const { target, planned_totals } = input;

  const calDelta = Math.abs(pctDelta(planned_totals.calories, target.calories));
  const calBand = bandFromDeltaPct(calDelta, CALORIE_TOLERANCE.passPct, CALORIE_TOLERANCE.reviewPct);

  const proteinPct =
    target.protein_g > 0 ? (planned_totals.protein_g / target.protein_g) * 100 : 100;
  let proteinBand: ValidationBand = "PASS";
  if (proteinPct < PROTEIN_TOLERANCE.minPct || proteinPct > PROTEIN_TOLERANCE.maxPct) {
    proteinBand = "FAIL";
  }

  const carbsDelta = Math.abs(pctDelta(planned_totals.carbs_g, target.carbs_g));
  const carbsBand = carbsDelta <= MACRO_TOLERANCE_PCT ? "PASS" : "FAIL";

  const fatDelta = Math.abs(pctDelta(planned_totals.fat_g, target.fat_g));
  const fatBand = fatDelta <= MACRO_TOLERANCE_PCT ? "PASS" : "FAIL";

  if (calBand === "FAIL") {
    issues.push({
      code: "CALORIE_OUT_OF_TOLERANCE",
      message: `Calories delta ${calDelta.toFixed(1)}% exceeds fail threshold`,
      severity: "error",
    });
  }
  if (proteinBand === "FAIL") {
    issues.push({
      code: "PROTEIN_OUT_OF_TOLERANCE",
      message: `Protein at ${proteinPct.toFixed(1)}% of target`,
      severity: "error",
    });
  }
  if (carbsBand === "FAIL") {
    issues.push({ code: "CARBS_OUT_OF_TOLERANCE", message: "Carbs outside tolerance", severity: "error" });
  }
  if (fatBand === "FAIL") {
    issues.push({ code: "FAT_OUT_OF_TOLERANCE", message: "Fat outside tolerance", severity: "error" });
  }

  if (input.allergy_safe === false) {
    issues.push({ code: "ALLERGEN_CONFLICT", message: "Allergen conflict detected", severity: "error" });
  }
  if (input.entitlement_ok === false) {
    issues.push({ code: "ENTITLEMENT_VIOLATION", message: "Entitlement constraints violated", severity: "error" });
  }

  const hasFail = issues.some((i) => i.severity === "error");
  const hasReview = calBand === "REVIEW" || target.review_required === true;

  let status: ValidationStatus = "VALID";
  if (hasFail) status = "INVALID";
  else if (hasReview) status = "REVIEW_REQUIRED";

  return {
    status,
    calories: { delta_pct: calDelta, band: calBand },
    protein: { pct_of_target: proteinPct, band: proteinBand },
    carbs: { delta_pct: carbsDelta, band: carbsBand },
    fats: { delta_pct: fatDelta, band: fatBand },
    issues,
  };
}
