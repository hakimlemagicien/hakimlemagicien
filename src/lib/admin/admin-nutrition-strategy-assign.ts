import { fetchAdminClientTrainingProfile } from "@/lib/platform/strategy-matrix/admin-profile";
import {
  buildStrategyAssignmentPayload,
  dayContextForTrainingMealWindow,
  isFailClosed,
  isTrainingMealWindow,
  mapQuizGoalToClientGoalId,
  nutritionProfileFromQuizAnswers,
  parseClientQuizAnswers,
  type AllergyState,
} from "@/lib/platform/nutrition-strategy";
import {
  assignAdminNutritionTemplate,
  generateAdminStrategyNutrition,
  getAdminClientNutritionTrainingWindow,
  type AdminNutritionAssignment,
} from "@/lib/admin/admin-client-nutrition-api";
import {
  getNutritionTemplate,
  type NutritionTemplateRecord,
} from "@/lib/admin/admin-nutrition-templates-api";
import { getMealByExternalId } from "@/lib/platform/meal-library";
import { hydrateMealLibraryFromSupabase } from "@/lib/platform/meal-library-api";

/** Build + persist a ready-made Strategy V1 nutrition plan for a client. */
export async function assignReadyMadeStrategyNutrition(input: {
  clientId: string;
  overviewGoal: string | null;
  startsOn: string;
  replace: boolean;
  allergy: AllergyState;
  restrictions?: string[];
  templateId?: string;
  publish?: boolean;
}): Promise<AdminNutritionAssignment> {
  await hydrateMealLibraryFromSupabase();
  const profileRow = await fetchAdminClientTrainingProfile(input.clientId);
  const quiz = parseClientQuizAnswers(
    profileRow?.answers ?? {},
    profileRow?.goal ?? input.overviewGoal,
  );
  const nutritionProfile = nutritionProfileFromQuizAnswers(quiz);
  if (!nutritionProfile) {
    throw new Error("nutrition_profile_incomplete");
  }

  const clientGoal =
    mapQuizGoalToClientGoalId(input.overviewGoal) ??
    mapQuizGoalToClientGoalId(profileRow?.goal) ??
    mapQuizGoalToClientGoalId(quiz.goalId);
  if (!clientGoal) {
    throw new Error("nutrition_goal_unmapped");
  }

  const trainingMealWindow = await getAdminClientNutritionTrainingWindow(input.clientId);
  if (!isTrainingMealWindow(trainingMealWindow)) {
    throw new Error("TRAINING_TIME_REQUIRED");
  }

  const payload = buildStrategyAssignmentPayload({
    client_goal: clientGoal,
    profile: nutritionProfile,
    day_context: dayContextForTrainingMealWindow(trainingMealWindow),
    allergies: input.allergy,
    restrictions: input.restrictions ?? [],
    name_ar: "خطة تغذية Strategy V1",
  });

  if (isFailClosed(payload)) {
    throw new Error(payload.code);
  }

  if (input.templateId) {
    const template = await getNutritionTemplate(input.templateId);
    const assignmentPayload =
      template.selection_mode === "curated"
        ? applyCuratedTemplate(payload, template, input.allergy, input.restrictions ?? [])
        : payload;
    return assignAdminNutritionTemplate({
      clientId: input.clientId,
      templateId: input.templateId,
      payload: assignmentPayload as unknown as Record<string, unknown>,
      startsOn: input.startsOn,
      publish: Boolean(input.publish),
    });
  }

  return generateAdminStrategyNutrition({
    clientId: input.clientId,
    payload: payload as unknown as Record<string, unknown>,
    startsOn: input.startsOn,
    replace: input.replace,
  });
}

type CuratedTemplateMeal = {
  external_id?: string;
  id?: string;
};

type CuratedTemplateDay = {
  day?: number;
  slots?: Record<string, CuratedTemplateMeal | null>;
};

function applyCuratedTemplate(
  calculated: Exclude<ReturnType<typeof buildStrategyAssignmentPayload>, { code: string }>,
  template: NutritionTemplateRecord,
  allergy: AllergyState,
  restrictions: string[],
) {
  const days = template.curated_plan as CuratedTemplateDay[];
  if (days.length !== 7) throw new Error("seven_day_curated_plan_required");
  const knownAllergens = allergy.status === "KNOWN_ALLERGIES" ? allergy.allergens : [];
  const baseSlots = new Map(calculated.slots.map((slot) => [slot.slot_key, slot]));
  const cycle = days.map((day, dayIndex) => {
    const slots = calculated.slots.map((base) => {
      const selected = day.slots?.[base.slot_key];
      const externalId = selected?.external_id;
      if (!externalId) throw new Error(`curated_meal_required:${dayIndex + 1}:${base.slot_key}`);
      const meal = getMealByExternalId(externalId);
      if (!meal) throw new Error(`curated_meal_not_found:${externalId}`);
      if (knownAllergens.some((allergen) => meal.allergens.includes(allergen))) {
        throw new Error(`curated_meal_allergen_conflict:${externalId}`);
      }
      const searchable = [
        meal.name_ar,
        meal.name_en,
        ...meal.dietary_tags,
        ...meal.ingredients.flatMap((item) => [item.ingredient_key, item.name_ar, item.name_en]),
      ]
        .join(" ")
        .toLocaleLowerCase("ar");
      if (
        restrictions.some(
          (item) => item.trim() && searchable.includes(item.trim().toLocaleLowerCase("ar")),
        )
      ) {
        throw new Error(`curated_meal_disliked_food_conflict:${externalId}`);
      }
      const slot = baseSlots.get(base.slot_key) ?? base;
      return {
        ...slot,
        source_external_id: meal.external_id,
        servings: 1,
        planned_servings: 1,
        meal_snapshot: {
          name_ar: meal.name_ar,
          calories: meal.calories,
          protein_g: meal.protein_g,
          carbs_g: meal.carbs_g,
          fat_g: meal.fat_g,
          allergens: meal.allergens,
          serving_size: meal.serving_size,
          serving_unit: meal.serving_unit,
        },
      };
    });
    const totals = slots.reduce(
      (sum, slot) => {
        const meal = getMealByExternalId(slot.source_external_id);
        return {
          calories: sum.calories + (meal?.calories ?? 0) * slot.planned_servings,
          protein_g: sum.protein_g + (meal?.protein_g ?? 0) * slot.planned_servings,
          carbs_g: sum.carbs_g + (meal?.carbs_g ?? 0) * slot.planned_servings,
          fat_g: sum.fat_g + (meal?.fat_g ?? 0) * slot.planned_servings,
        };
      },
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
    );
    return {
      day: day.day ?? dayIndex + 1,
      ordered_slot_keys: slots.map((slot) => slot.slot_key),
      slots,
      planned_totals: totals,
      validation_result: {
        status: "REVIEW_REQUIRED",
        issues: [
          {
            code: "CURATED_TEMPLATE_REVIEW",
            message: "Curated plan preserved; review target fit before publish.",
            severity: "warning",
          },
        ],
      },
    };
  });
  const firstDay = cycle[0];
  if (!firstDay) throw new Error("seven_day_curated_plan_required");
  return {
    ...calculated,
    name_ar: template.name_ar,
    validation_status: "REVIEW_REQUIRED",
    slots: firstDay.slots,
    resolved_snapshot: {
      ...calculated.resolved_snapshot,
      cycle_days: 7,
      seven_day_cycle: cycle,
      ordered_slot_keys: firstDay.ordered_slot_keys,
      planned_totals: firstDay.planned_totals,
      validation_result: firstDay.validation_result,
      curated_template: true,
    },
    decision_trace: {
      ...calculated.decision_trace,
      summary: `Curated nutrition template ${template.template_key} V${template.version}`,
      metadata: {
        ...calculated.decision_trace.metadata,
        selection_mode: "curated",
        curated_plan_preserved: true,
        template_key: template.template_key,
        template_version: template.version,
      },
    },
  };
}
