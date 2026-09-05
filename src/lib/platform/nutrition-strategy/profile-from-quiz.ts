/**
 * Bridge quiz / training_profiles.answers → nutrition engine profile.
 * Prefer this over re-asking biometrics in admin or client flows.
 */
export {
  nutritionProfileFromQuizAnswers,
  parseClientQuizAnswers,
  nutritionActivityFromQuiz,
  bodyFatCategoryFromQuizBodyType,
} from "@/lib/platform/client-quiz-answers";
