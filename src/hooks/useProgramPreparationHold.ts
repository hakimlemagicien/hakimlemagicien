import { useEffect, useState } from "react";
import { useCustomerJourney } from "@/hooks/useCustomerJourney";
import {
  stepForElapsedMs,
  type ProgramPreparationHold,
} from "@/lib/platform/program-preparation-hold";

/**
 * Hold room for brand-new accounts only (createdAt within 2h, no coach assign).
 * Existing accounts — including founder/admin — never enter the hold room.
 */
export function useProgramPreparationHold(_input?: { coachAssigned?: boolean }) {
  const journey = useCustomerJourney();
  const [now, setNow] = useState(() => Date.now());
  const started = Date.parse(journey.data?.preparationStartedAt ?? "");
  const ready = Date.parse(journey.data?.preparationReadyAt ?? "");
  const total =
    Number.isFinite(started) && Number.isFinite(ready) ? Math.max(ready - started, 1) : 1;
  const remainingMs = Number.isFinite(ready) ? Math.max(0, ready - now) : 0;
  const elapsedMs = Number.isFinite(started) ? Math.max(0, now - started) : 0;
  const active = journey.data?.phase === "preparing" && remainingMs > 0;
  const secondsTotal = Math.floor(remainingMs / 1000);
  const hold: ProgramPreparationHold = {
    active,
    remainingMs,
    elapsedMs,
    unlocksAt: journey.data?.preparationReadyAt ?? null,
    hours: Math.floor(secondsTotal / 3600),
    minutes: Math.floor((secondsTotal % 3600) / 60),
    seconds: secondsTotal % 60,
    currentStep: active ? stepForElapsedMs((elapsedMs / total) * (2 * 60 * 60 * 1000)) : 4,
  };

  useEffect(() => {
    if (!hold.active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [hold.active]);

  return {
    hold,
    loading: journey.isLoading,
    createdAt: journey.data?.preparationStartedAt ?? null,
  };
}

export type { ProgramPreparationHold };
