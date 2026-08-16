import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  awardWaterGoalIfNeeded,
  touchWaterActivity,
} from "@/lib/platform/platform-activity";
import { readNutritionPlanStore } from "@/lib/platform/nutrition-plan-storage";
import { recordActivityEvent } from "@/lib/platform/progress-storage";
import {
  playGoalSplashSound,
  playWaterDropSound,
  playWaterReminderSound,
  primeWaterAudio,
} from "@/lib/platform/water-audio";
import {
  addWater,
  getRecentWaterLogs,
  getWaterDayState,
  getWaterMotivationMessage,
  migrateLegacyWaterLogs,
  todayKey,
  undoLastWater,
  WATER_CHANGE_EVENT,
  type WaterDayState,
  type WaterLogEntry,
} from "@/lib/platform/water-storage";

type UndoState = {
  ml: number;
  expiresAt: number;
};

type WaterContextValue = {
  state: WaterDayState;
  recentLogs: WaterLogEntry[];
  message: string;
  sheetOpen: boolean;
  loading: boolean;
  error: string | null;
  pendingUndo: UndoState | null;
  goalCelebration: boolean;
  reminderPulse: boolean;
  openWaterSheet: () => void;
  closeWaterSheet: () => void;
  registerWater: (ml: number) => Promise<boolean>;
  undoLastEntry: () => void;
  dismissGoalCelebration: () => void;
  clearError: () => void;
};

const WaterContext = createContext<WaterContextValue | null>(null);

export function WaterProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState("guest");
  const [tick, setTick] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingUndo, setPendingUndo] = useState<UndoState | null>(null);
  const [goalCelebration, setGoalCelebration] = useState(false);
  const [reminderPulse, setReminderPulse] = useState(false);
  const addingRef = useRef(false);
  const undoTimerRef = useRef<number | null>(null);
  const reminderClearRef = useRef<number | null>(null);

  const refresh = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    const prime = () => primeWaterAudio();
    window.addEventListener("pointerdown", prime, { once: true });
    return () => window.removeEventListener("pointerdown", prime);
  }, []);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? "guest");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? "guest");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const legacy = readNutritionPlanStore(userId);
    const dateKey = todayKey();
    migrateLegacyWaterLogs(userId, legacy.waterLogs[dateKey] ?? []);
  }, [userId]);

  useEffect(() => {
    const onChange = () => refresh();
    window.addEventListener(WATER_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(WATER_CHANGE_EVENT, onChange);
  }, [refresh]);

  useEffect(() => {
    if (!pendingUndo) return;
    const ms = pendingUndo.expiresAt - Date.now();
    if (ms <= 0) {
      setPendingUndo(null);
      return;
    }
    undoTimerRef.current = window.setTimeout(() => setPendingUndo(null), ms);
    return () => {
      if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    };
  }, [pendingUndo]);

  const state = useMemo(() => getWaterDayState(userId), [userId, tick]);
  const recentLogs = useMemo(() => getRecentWaterLogs(userId, 3), [userId, tick]);
  const message = useMemo(
    () => getWaterMotivationMessage(state.totalMl, state.goalMl),
    [state.totalMl, state.goalMl],
  );

  useEffect(() => {
    if (state.goalReached) {
      setReminderPulse(false);
      return;
    }

    const hourMs = 60 * 60 * 1000;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const fireReminder = () => {
      if (document.visibilityState !== "visible") return;
      if (prefersReduced) return;
      playWaterReminderSound();
      setReminderPulse(true);
      if (reminderClearRef.current) window.clearTimeout(reminderClearRef.current);
      reminderClearRef.current = window.setTimeout(() => setReminderPulse(false), 2400);
    };

    const timer = window.setInterval(fireReminder, hourMs);
    return () => {
      window.clearInterval(timer);
      if (reminderClearRef.current) window.clearTimeout(reminderClearRef.current);
    };
  }, [state.goalReached, state.totalMl]);

  const openWaterSheet = useCallback(() => {
    primeWaterAudio();
    setError(null);
    setSheetOpen(true);
  }, []);

  const closeWaterSheet = useCallback(() => {
    setSheetOpen(false);
    setError(null);
  }, []);

  const registerWater = useCallback(
    async (ml: number) => {
      if (addingRef.current) return false;
      addingRef.current = true;
      setLoading(true);
      setError(null);

      const clientId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      const result = addWater(userId, ml, clientId);
      setLoading(false);
      addingRef.current = false;

      if (!result.ok) {
        if (!result.duplicate) setError(result.error);
        return false;
      }

      touchWaterActivity(userId);
      recordActivityEvent(userId, {
        type: "water",
        title: `شربت ${ml} ml`,
        points: 10,
        clientId: `water:${clientId}`,
        refId: result.log.id,
      });
      if (result.goalReached) {
        awardWaterGoalIfNeeded(userId);
        setGoalCelebration(true);
        playGoalSplashSound();
      } else {
        playWaterDropSound();
      }

      setPendingUndo({ ml, expiresAt: Date.now() + 5000 });
      refresh();

      window.setTimeout(() => {
        closeWaterSheet();
      }, 850);

      return true;
    },
    [userId, refresh, closeWaterSheet],
  );

  const undoLastEntry = useCallback(() => {
    const removed = undoLastWater(userId);
    if (!removed) return;
    setPendingUndo(null);
    refresh();
  }, [userId, refresh]);

  const value = useMemo(
    () => ({
      state,
      recentLogs,
      message,
      sheetOpen,
      loading,
      error,
      pendingUndo,
      goalCelebration,
      reminderPulse,
      openWaterSheet,
      closeWaterSheet,
      registerWater,
      undoLastEntry,
      dismissGoalCelebration: () => setGoalCelebration(false),
      clearError: () => setError(null),
    }),
    [
      state,
      recentLogs,
      message,
      sheetOpen,
      loading,
      error,
      pendingUndo,
      goalCelebration,
      reminderPulse,
      openWaterSheet,
      closeWaterSheet,
      registerWater,
      undoLastEntry,
    ],
  );

  return <WaterContext.Provider value={value}>{children}</WaterContext.Provider>;
}

export function useWater() {
  const ctx = useContext(WaterContext);
  if (!ctx) throw new Error("useWater must be used within WaterProvider");
  return ctx;
}

export function useWaterOptional() {
  return useContext(WaterContext);
}
