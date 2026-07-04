import { useEffect, useRef, useState } from "react";
import { readQuizProgress, writeQuizProgress, type QuizProgressSnapshot } from "@/lib/quiz-progress-storage";
import { useQuizStepTransition } from "@/hooks/use-quiz-step-transition";

const PERSIST_DEBOUNCE_MS = 280;

type QuizStep =
  | "loading"
  | "gender"
  | "goals"
  | "femaleGoals"
  | "age"
  | "measure"
  | "activity"
  | "challenge"
  | "femaleChallenge"
  | "investment"
  | "bodyType"
  | "femaleBodyType"
  | "analysis"
  | "contact"
  | "congrats"
  | "reveal"
  | "trainingType"
  | "pricing"
  | "pricingDubai"
  | "offlinePackages"
  | "payment";

function applySnapshot(
  saved: QuizProgressSnapshot,
  setters: {
    setGender: (v: "male" | "female" | null) => void;
    setUserName: (v: string) => void;
    setUserPhone: (v: string) => void;
    setUserCity: (v: string) => void;
    setGoalId: (v: string) => void;
    setChallengeId: (v: string) => void;
    setAge: (v: number | undefined) => void;
    setHeightCm: (v: number | undefined) => void;
    setWeightKg: (v: number | undefined) => void;
    setActivityLevel: (v: string | undefined) => void;
    setInvestment: (v: string | undefined) => void;
    setBodyType: (v: string | undefined) => void;
    setUserLocation: (v: "dubai" | "remote" | null) => void;
    setSelectedTierId: (v: "transform" | "pro" | "vip") => void;
  },
) {
  setters.setGender(saved.gender);
  setters.setUserName(saved.userName);
  setters.setUserPhone(saved.userPhone);
  setters.setUserCity(saved.userCity);
  setters.setGoalId(saved.goalId);
  setters.setChallengeId(saved.challengeId);
  setters.setAge(saved.age);
  setters.setHeightCm(saved.heightCm);
  setters.setWeightKg(saved.weightKg);
  setters.setActivityLevel(saved.activityLevel);
  setters.setInvestment(saved.investment);
  setters.setBodyType(saved.bodyType);
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
  const [userPhone, setUserPhone] = useState("");
  const [userCity, setUserCity] = useState("");
  const [goalId, setGoalId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [age, setAge] = useState<number | undefined>();
  const [heightCm, setHeightCm] = useState<number | undefined>();
  const [weightKg, setWeightKg] = useState<number | undefined>();
  const [activityLevel, setActivityLevel] = useState<string | undefined>();
  const [investment, setInvestment] = useState<string | undefined>();
  const [bodyType, setBodyType] = useState<string | undefined>();
  const [userLocation, setUserLocation] = useState<"dubai" | "remote" | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<"transform" | "pro" | "vip">("transform");

  useEffect(() => {
    const saved = readQuizProgress();
    if (saved) {
      applySnapshot(saved, {
        setGender,
        setUserName,
        setUserPhone,
        setUserCity,
        setGoalId,
        setChallengeId,
        setAge,
        setHeightCm,
        setWeightKg,
        setActivityLevel,
        setInvestment,
        setBodyType,
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
      userPhone,
      userCity,
      goalId,
      challengeId,
      age,
      heightCm,
      weightKg,
      activityLevel,
      investment,
      bodyType,
      userLocation,
      selectedTierId,
    };

    const timer = window.setTimeout(() => writeQuizProgress(snapshot), PERSIST_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [
    step,
    gender,
    userName,
    userPhone,
    userCity,
    goalId,
    challengeId,
    age,
    heightCm,
    weightKg,
    activityLevel,
    investment,
    bodyType,
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
    userPhone,
    setUserPhone,
    userCity,
    setUserCity,
    goalId,
    setGoalId,
    challengeId,
    setChallengeId,
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
    userLocation,
    setUserLocation,
    selectedTierId,
    setSelectedTierId,
  };
}
