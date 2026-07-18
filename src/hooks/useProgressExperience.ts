import { useCallback, useEffect, useMemo, useState } from "react";
import { usePlatformActivity } from "@/hooks/usePlatformActivity";
import { buildProgressDashboard } from "@/lib/platform/progress-experience";
import { PROGRESS_CHANGE_EVENT } from "@/lib/platform/progress-storage";
import { PLATFORM_ACTIVITY_CHANGE_EVENT } from "@/lib/platform/platform-activity";
import { WATER_CHANGE_EVENT } from "@/lib/platform/water-storage";
import { NUTRITION_PLAN_CHANGE_EVENT } from "@/lib/platform/nutrition-plan-storage";

export function useProgressExperience() {
  const { userId, snapshot, refresh, logWeight } = usePlatformActivity();
  const [tick, setTick] = useState(0);

  const bump = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    const onChange = () => bump();
    window.addEventListener(PLATFORM_ACTIVITY_CHANGE_EVENT, onChange);
    window.addEventListener(WATER_CHANGE_EVENT, onChange);
    window.addEventListener(NUTRITION_PLAN_CHANGE_EVENT, onChange);
    window.addEventListener(PROGRESS_CHANGE_EVENT, onChange);
    return () => {
      window.removeEventListener(PLATFORM_ACTIVITY_CHANGE_EVENT, onChange);
      window.removeEventListener(WATER_CHANGE_EVENT, onChange);
      window.removeEventListener(NUTRITION_PLAN_CHANGE_EVENT, onChange);
      window.removeEventListener(PROGRESS_CHANGE_EVENT, onChange);
    };
  }, [bump]);

  const data = useMemo(
    () => buildProgressDashboard(userId, snapshot),
    [userId, snapshot, tick],
  );

  return {
    userId,
    snapshot,
    data,
    refresh: () => {
      refresh();
      bump();
    },
    logWeight,
  };
}

export function useOnlineStatus() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return online;
}
