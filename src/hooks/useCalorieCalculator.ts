import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMembership } from "@/hooks/useMembership";
import { usePlatformActivity } from "@/hooks/usePlatformActivity";
import {
  computeCalorieCalculatorResult,
  computeAgeFromBirthDate,
  mapActivityLevel,
  mapGoalIdToPreviewGoal,
  PREVIEW_GOAL_LABELS_AR,
  type CalorieCalculatorInput,
  type CaloriePreviewGoal,
  validateCalorieInput,
} from "@/lib/platform/calorie-calculator";
import { saveCalorieCalculatorReference } from "@/lib/platform/calorie-calculator-storage";
import { fetchMyProfileDetails, fetchMyTrainingProfile } from "@/lib/platform/profile-api";
import {
  PROFILE_DETAILS_KEY,
  PROFILE_TRAINING_KEY,
} from "@/hooks/useProfileExperience";
import { getBodyMeasurements } from "@/lib/platform/progress-storage";
import { ACTIVITY_LABELS } from "@/lib/platform/profile-experience";

const GENDER_LABELS = { male: "ذكر", female: "أنثى" } as const;

export function useCalorieCalculator(enabled: boolean) {
  const { features } = useMembership();
  const { userId } = usePlatformActivity();
  const [previewGoal, setPreviewGoal] = useState<CaloriePreviewGoal>("maintain");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: PROFILE_DETAILS_KEY,
    queryFn: fetchMyProfileDetails,
    enabled,
    staleTime: 15_000,
  });

  const trainingQuery = useQuery({
    queryKey: PROFILE_TRAINING_KEY,
    queryFn: fetchMyTrainingProfile,
    enabled,
    staleTime: 15_000,
  });

  const profile = profileQuery.data ?? null;
  const training = trainingQuery.data ?? null;
  const answers = training?.answers ?? {};

  const bodyWeight = useMemo(() => {
    if (!userId) return null;
    return getBodyMeasurements(userId).weight ?? answers.weightKg ?? null;
  }, [userId, answers.weightKg, profileQuery.dataUpdatedAt]);

  const actualGoal = useMemo(
    () => mapGoalIdToPreviewGoal(answers.goalId ?? profile?.goal ?? training?.goal),
    [answers.goalId, profile?.goal, training?.goal],
  );

  useEffect(() => {
    if (enabled) setPreviewGoal(actualGoal);
  }, [enabled, actualGoal]);

  const activityLevel = mapActivityLevel(answers.activityLevel);
  const age = computeAgeFromBirthDate(answers.birthDate);
  const gender = answers.gender ?? null;

  const validation = validateCalorieInput({
    gender,
    age,
    heightCm: answers.heightCm ?? null,
    weightKg: bodyWeight,
    activityLevel,
    goal: actualGoal,
  });

  const input: CalorieCalculatorInput | null = validation.complete
    ? {
        gender: gender!,
        age: age!,
        weightKg: bodyWeight!,
        heightCm: answers.heightCm!,
        activityLevel: activityLevel!,
        actualGoal,
      }
    : null;

  const result = useMemo(
    () => (input ? computeCalorieCalculatorResult(input, previewGoal) : null),
    [input, previewGoal],
  );

  const accountRows = useMemo(() => {
    if (!validation.complete && !profile) return [];
    return [
      gender ? { label: "الجنس", value: GENDER_LABELS[gender] } : null,
      age ? { label: "العمر", value: `${age} سنة` } : null,
      answers.heightCm ? { label: "الطول", value: `${answers.heightCm} سم` } : null,
      bodyWeight ? { label: "الوزن", value: `${bodyWeight} كجم` } : null,
      activityLevel
        ? { label: "النشاط", value: ACTIVITY_LABELS[activityLevel] ?? activityLevel }
        : null,
      { label: "الهدف الحالي", value: PREVIEW_GOAL_LABELS_AR[actualGoal] },
    ].filter(Boolean) as { label: string; value: string }[];
  }, [gender, age, answers.heightCm, bodyWeight, activityLevel, actualGoal, profile, validation.complete]);

  useEffect(() => {
    if (!enabled) return;
    const onFocus = () => {
      void profileQuery.refetch();
      void trainingQuery.refetch();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [enabled, profileQuery, trainingQuery]);

  const hasActiveNutritionPlan = features.nutrition_plan;

  const loading = enabled && ((profileQuery.isLoading && !profileQuery.isFetched) || (trainingQuery.isLoading && !trainingQuery.isFetched));
  const error =
    profileQuery.error instanceof Error
      ? profileQuery.error.message
      : trainingQuery.error instanceof Error
        ? trainingQuery.error.message
        : null;

  const refresh = useCallback(async () => {
    await Promise.all([profileQuery.refetch(), trainingQuery.refetch()]);
  }, [profileQuery, trainingQuery]);

  const saveReference = useCallback(() => {
    if (!result || !input || !userId) return false;
    setSaveMessage(null);
    try {
      saveCalorieCalculatorReference(userId, {
        ...result,
        activityLevel: input.activityLevel,
        weightKg: input.weightKg,
        isPreviewSave: result.isPreview,
      });
      setSaveMessage("تم حفظ النتيجة كمرجع داخل حسابك.");
      return true;
    } catch {
      setSaveMessage("تعذر حفظ النتيجة. حاول مجدداً.");
      return false;
    }
  }, [result, input, userId]);

  return {
    profile,
    training,
    validation,
    input,
    result,
    previewGoal,
    setPreviewGoal,
    actualGoal,
    accountRows,
    hasActiveNutritionPlan,
    loading,
    error,
    refresh,
    saveReference,
    saveMessage,
    clearSaveMessage: () => setSaveMessage(null),
  };
}
