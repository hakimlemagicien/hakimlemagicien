import { useCallback, useState } from "react";
import {
  HAPTIC_NAV_DELAY_MS,
  QUIZ_STEP_FADE_MS,
  triggerSelectionHaptic,
} from "@/lib/haptic";

export type QuizTransitionPhase = "in" | "out";

export function useQuizStepTransition<T extends string>(initial: T) {
  const [step, setStep] = useState<T>(initial);
  const [phase, setPhase] = useState<QuizTransitionPhase>("in");

  const transitionTo = useCallback((next: T, sideEffect?: () => void) => {
    setPhase("out");
    window.setTimeout(() => {
      sideEffect?.();
      setStep(next);
      setPhase("in");
    }, QUIZ_STEP_FADE_MS);
  }, []);

  const selectAndGo = useCallback(
    (next: T, sideEffect?: () => void) => {
      triggerSelectionHaptic();
      window.setTimeout(() => transitionTo(next, sideEffect), HAPTIC_NAV_DELAY_MS);
    },
    [transitionTo],
  );

  const goBack = useCallback(
    (next: T) => {
      transitionTo(next);
    },
    [transitionTo],
  );

  return { step, phase, transitionTo, selectAndGo, goBack };
}
