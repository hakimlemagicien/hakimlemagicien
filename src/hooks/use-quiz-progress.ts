import { useEffect, useRef, useState } from "react";
import { readQuizProgress, writeQuizProgress, type QuizProgressSnapshot } from "@/lib/quiz-progress-storage";
import { useQuizStepTransition } from "@/hooks/use-quiz-step-transition";

const PERSIST_DEBOUNCE_MS = 280;

const QUIZ_STEPS = [
  "loading",
  "gender",
  "goals",
  "femaleGoals",
  "age",
  "measure",
  "activity",
  "challenge",
  "femaleChallenge",
  "injuries",
  "investment",
  "bodyType",
  "femaleBodyType",
  "trainingEnvironment",
  "analysis",
  "contact",
  "congrats",
  "reveal",
  "verifyEmail",
  "createPassword",
  "profilePhoto",
  "platformWelcome",
  "trainingType",
  "pricing",
  "pricingDubai",
  "offlinePackages",
  "payment",
] as const;

type QuizStep = (typeof QUIZ_STEPS)[number];

function isQuizStep(value: string): value is QuizStep {
  return (QUIZ_STEPS as readonly string[]).includes(value);
}

function readPreviewStepFromUrl(): QuizStep | null {
  if (typeof window === "undefined") return null;
  const step = new URLSearchParams(window.location.search).get("step");
  return step && isQuizStep(step) ? step : null;
}

function applySnapshot(
  saved: QuizProgressSnapshot,
  setters: {
    setGender: (v: "male" | "female" | null) => void;
    setUserName: (v: string) => void;
    setUserEmail: (v: string) => void;
    setUserPhone: (v: string) => void;
    setUserCity: (v: string) => void;
    setGoalId: (v: string) => void;
    setChallengeId: (v: string) => void;
    setInjuryIds: (v: string[]) => void;
    setAge: (v: number | undefined) => void;
    setHeightCm: (v: number | undefined) => void;
    setWeightKg: (v: number | undefined) => void;
    setActivityLevel: (v: string | undefined) => void;
    setInvestment: (v: string | undefined) => void;
    setBodyType: (v: string | undefined) => void;
    setTrainingEnvironment: (v: "home" | "gym" | "anywhere" | undefined) => void;
    setUserLocation: (v: "dubai" | "remote" | null) => void;
    setSelectedTierId: (v: "transform" | "pro" | "vip") => void;
  },
) {
  setters.setGender(saved.gender);
  setters.setUserName(saved.userName);
  setters.setUserEmail(saved.userEmail ?? "");
  setters.setUserPhone(saved.userPhone);
  setters.setUserCity(saved.userCity);
  setters.setGoalId(saved.goalId);
  setters.setChallengeId(saved.challengeId);
  setters.setInjuryIds(saved.injuryIds ?? ["none"]);
  setters.setAge(saved.age);
  setters.setHeightCm(saved.heightCm);
  setters.setWeightKg(saved.weightKg);
  setters.setActivityLevel(saved.activityLevel);
  setters.setInvestment(saved.investment);
  setters.setBodyType(saved.bodyType);
  setters.setTrainingEnvironment(saved.trainingEnvironment);
  setters.setUserLocation(saved.userLocation);
  setters.setSelectedTierId(saved.selectedTierId);
}

export function useQuizProgress() {
  const hydratedRef = useRef(false);

  const {
    step,
    phase,
    transitionTo,
    selectAndGo,
    goBack,
    replaceStep,
  } = useQuizStepTransition<QuizStep>("loading");

  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userCity, setUserCity] = useState("");
  const [goalId, setGoalId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [injuryIds, setInjuryIds] = useState<string[]>(["none"]);
  const [age, setAge] = useState<number | undefined>();
  const [heightCm, setHeightCm] = useState<number | undefined>();
  const [weightKg, setWeightKg] = useState<number | undefined>();
  const [activityLevel, setActivityLevel] = useState<string | undefined>();
  const [investment, setInvestment] = useState<string | undefined>();
  const [bodyType, setBodyType] = useState<string | undefined>();
  const [trainingEnvironment, setTrainingEnvironment] = useState<"home" | "gym" | "anywhere" | undefined>();
  const [userLocation, setUserLocation] = useState<"dubai" | "remote" | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<"transform" | "pro" | "vip">("transform");

  useEffect(() => {
    const previewStep = readPreviewStepFromUrl();
    if (previewStep) {
      replaceStep(previewStep);
      hydratedRef.current = true;
      return;
    }

    const saved = readQuizProgress();
    if (saved) {
      applySnapshot(saved, {
        setGender,
        setUserName,
        setUserEmail,
        setUserPhone,
        setUserCity,
        setGoalId,
        setChallengeId,
        setInjuryIds,
        setAge,
        setHeightCm,
        setWeightKg,
        setActivityLevel,
        setInvestment,
        setBodyType,
        setTrainingEnvironment,
        setUserLocation,
        setSelectedTierId,
      });
      if (saved.step && saved.step !== "loading") {
        replaceStep(saved.step as QuizStep);
      }
    }
    hydratedRef.current = true;
  }, [replaceStep]);

  useEffect(() => {
    if (!hydratedRef.current) return;

    const snapshot: Omit<QuizProgressSnapshot, "version" | "savedAt"> = {
      step,
      gender,
      userName,
      userEmail,
      userPhone,
      userCity,
      goalId,
      challengeId,
      injuryIds,
      age,
      heightCm,
      weightKg,
      activityLevel,
      investment,
      bodyType,
      trainingEnvironment,
      userLocation,
      selectedTierId,
    };

    const timer = window.setTimeout(() => writeQuizProgress(snapshot), PERSIST_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [
    step,
    gender,
    userName,
    userEmail,
    userPhone,
    userCity,
    goalId,
    challengeId,
    injuryIds,
    age,
    heightCm,
    weightKg,
    activityLevel,
    investment,
    bodyType,
    trainingEnvironment,
    userLocation,
    selectedTierId,
  ]);

  return {
    step,
    phase,
    transitionTo,
    selectAndGo,
    goBack,
    gender,
    setGender,
    userName,
    setUserName,
    userEmail,
    setUserEmail,
    userPhone,
    setUserPhone,
    userCity,
    setUserCity,
    goalId,
    setGoalId,
    challengeId,
    setChallengeId,
    injuryIds,
    setInjuryIds,
    age,
    setAge,
    heightCm,
    setHeightCm,
    weightKg,
    setWeightKg,
    activityLevel,
    setActivityLevel,
    investment,
    setInvestment,
    bodyType,
    setBodyType,
    trainingEnvironment,
    setTrainingEnvironment,
    userLocation,
    setUserLocation,
    selectedTierId,
    setSelectedTierId,
  };
}
