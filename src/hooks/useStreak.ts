import { useEffect, useState } from "react";

const STORAGE_KEY = "hakim_platform_streak_v1";
const POINTS_KEY = "hakim_platform_points_v1";
/** Seed until activity-based awards are wired (login never grants points). */
const DEFAULT_POINTS = 230;

type StreakState = {
  count: number;
  lastVisit: string | null;
};

function readStreak(): StreakState {
  if (typeof window === "undefined") return { count: 0, lastVisit: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, lastVisit: null };
    return JSON.parse(raw) as StreakState;
  } catch {
    return { count: 0, lastVisit: null };
  }
}

function writeStreak(state: StreakState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function readPoints(): number {
  if (typeof window === "undefined") return DEFAULT_POINTS;
  try {
    const raw = localStorage.getItem(POINTS_KEY);
    if (!raw) return DEFAULT_POINTS;
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) ? value : DEFAULT_POINTS;
  } catch {
    return DEFAULT_POINTS;
  }
}

function writePoints(value: number) {
  localStorage.setItem(POINTS_KEY, String(value));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Daily streak + Hakim Points store.
 * Opening the app continues the streak counter, but NEVER awards points for login.
 * Points must come from workouts, meals, water, measurements, challenges, achievements.
 */
export function useStreak() {
  const [count, setCount] = useState(0);
  const [points, setPoints] = useState(DEFAULT_POINTS);

  useEffect(() => {
    const today = todayKey();
    const yesterday = yesterdayKey();
    const current = readStreak();
    const currentPoints = readPoints();

    if (current.lastVisit === today) {
      setCount(current.count);
      setPoints(currentPoints);
      return;
    }

    const nextCount = current.lastVisit === yesterday ? current.count + 1 : 1;
    writeStreak({ count: nextCount, lastVisit: today });
    // Persist points as-is — no login bonus.
    writePoints(currentPoints);
    setCount(nextCount);
    setPoints(currentPoints);
  }, []);

  return { count, points, hakimPoints: points };
}
