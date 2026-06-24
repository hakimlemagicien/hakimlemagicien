import type { Json } from "@/integrations/supabase/types";

export type QuizAnswersInput = {
  gender?: "male" | "female" | null;
  goalId?: string;
  challengeId?: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: string;
  investment?: string;
  bodyType?: string;
  trainingType?: "online" | "inperson" | null;
  userLocation?: "dubai" | "remote" | null;
  selectedTierId?: "transform" | "pro" | "vip";
  lastStep?: string;
};

export type QuizContactInput = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  locationPreference: "dubai" | "remote";
};

export function buildQuizAnswersPayload(input: QuizAnswersInput): Json {
  return {
    gender: input.gender ?? null,
    goalId: input.goalId ?? null,
    challengeId: input.challengeId ?? null,
    age: input.age ?? null,
    heightCm: input.heightCm ?? null,
    weightKg: input.weightKg ?? null,
    activityLevel: input.activityLevel ?? null,
    investment: input.investment ?? null,
    bodyType: input.bodyType ?? null,
    trainingType: input.trainingType ?? null,
    userLocation: input.userLocation ?? null,
    selectedTierId: input.selectedTierId ?? null,
    lastStep: input.lastStep ?? null,
  };
}

export function buildLeadInsertFromQuiz(
  answersInput: QuizAnswersInput,
  contact: QuizContactInput,
) {
  const answers = buildQuizAnswersPayload({
    ...answersInput,
    userLocation: contact.locationPreference,
    lastStep: "contact",
  });

  return {
    status: "pending_lead" as const,
    answers,
    gender: answersInput.gender ?? null,
    goal_id: answersInput.goalId ?? null,
    challenge_id: answersInput.challengeId ?? null,
    full_name: contact.fullName,
    email: contact.email,
    phone: contact.phone,
    city: contact.city,
    country: contact.country,
    location_preference: contact.locationPreference,
  };
}
