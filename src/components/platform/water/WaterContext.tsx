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
  getProfileSettings,
  subscribeProfileSettings,
} from "@/lib/platform/profile-settings-storage";
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
  getWaterReminderAnchor,
  migrateLegacyWaterLogs,
  todayKey,
  undoLastWater,
  WATER_CHANGE_EVENT,
  WATER_REMINDER_MS,
  writeWaterReminderAnchor,
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
  reminderOpen: boolean;
  openWaterSheet: () => void;
  closeWaterSheet: () => void;
  skipWaterReminder: () => void;
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
  const [reminderOpen, setReminderOpen] = useState(false);
  const addingRef = useRef(false);
  const undoTimerRef = useRef<number | null>(null);
  const reminderClearRef = useRef<number | null>(null);
  const reminderOpenRef = useRef(false);
  const sheetOpenRef = useRef(false);

  reminderOpenRef.current = reminderOpen;
  sheetOpenRef.current = sheetOpen;

  const refresh = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    const prime = () => primeWaterAudio();
    window.addEventListener("pointerdown", prime, { once: true });
    return () => window.removeEventListener("pointerdown", prime);
  }, []);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? "guest");
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
      setReminderOpen(false);
      setReminderPulse(false);
      return;
    }

    let timer = 0;
    let cancelled = false;

    const clearPulseLater = () => {
      if (reminderClearRef.current) window.clearTimeout(reminderClearRef.current);
      reminderClearRef.current = window.setTimeout(() => setReminderPulse(false), 2400);
    };

    const schedule = (ms: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(run, Math.max(ms, 250));
    };

    const run = () => {
      if (cancelled) return;
      const enabled = getProfileSettings().notifications.waterReminders;
      if (!enabled || getWaterDayState(userId).goalReached) {
        setReminderOpen(false);
        setReminderPulse(false);
        return;
      }
      if (document.visibilityState !== "visible") {
        schedule(12_000);
        return;
      }
      if (sheetOpenRef.current || reminderOpenRef.current) {
        schedule(4000);
        return;
      }

      const dateKey = todayKey();
      const wait = getWaterReminderAnchor(userId, dateKey) + WATER_REMINDER_MS - Date.now();
      if (wait > 0) {
        schedule(wait);
        return;
      }

      writeWaterReminderAnchor(userId, Date.now(), dateKey);
      playWaterReminderSound();
      setReminderOpen(true);
      setReminderPulse(true);
      clearPulseLater();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") schedule(400);
    };

    schedule(800);
    document.addEventListener("visibilitychange", onVisibility);
    const unsubscribeSettings = subscribeProfileSettings(() => schedule(200));

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      unsubscribeSettings();
      if (reminderClearRef.current) window.clearTimeout(reminderClearRef.current);
    };
  }, [state.goalReached, userId]);

  const openWaterSheet = useCallback(() => {
    primeWaterAudio();
    setError(null);
    setSheetOpen(true);
  }, []);

  const closeWaterSheet = useCallback(() => {
    setSheetOpen(false);
    setError(null);
  }, []);

  const skipWaterReminder = useCallback(() => {
    writeWaterReminderAnchor(userId);
    setReminderOpen(false);
    setReminderPulse(false);
  }, [userId]);

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
      writeWaterReminderAnchor(userId);
      setReminderOpen(false);
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
      reminderOpen,
      openWaterSheet,
      closeWaterSheet,
      skipWaterReminder,
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
      reminderOpen,
      openWaterSheet,
      closeWaterSheet,
      skipWaterReminder,
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
