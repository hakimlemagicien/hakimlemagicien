import { HAKIM_POINTS_REWARDS } from "@/lib/platform/daily-motivation";
import { isFounderReviewEmail, resolveAuthEmail } from "@/lib/platform/membership";
import {
  notifyPlatformActivityChanged,
  seedHostPreviewActivity,
} from "@/lib/platform/platform-activity";
import { recordActivityEvent } from "@/lib/platform/progress-storage";
import { DEFAULT_WATER_GOAL_ML, seedHostPreviewWaterIfNeeded } from "@/lib/platform/water-storage";

const HOST_PREVIEW_FLAG = "hakim.host.preview.v2";

function dateKeyDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function previewUnit(seed: number) {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

function previewFlagKey(userId: string) {
  return `${HOST_PREVIEW_FLAG}:${userId}`;
}

export function isHostPreviewUser(
  user: Parameters<typeof resolveAuthEmail>[0],
  email?: string | null,
) {
  return isFounderReviewEmail(email ?? resolveAuthEmail(user));
}

/** Seeds lived-in activity numbers for the founder host so home/progress UI can be reviewed. */
export function applyHostPreviewIfNeeded(
  userId: string,
  email?: string | null,
  user?: Parameters<typeof resolveAuthEmail>[0],
) {
  if (typeof window === "undefined" || !userId || userId === "guest") return;
  if (!isFounderReviewEmail(email ?? resolveAuthEmail(user))) return;
  if (localStorage.getItem(previewFlagKey(userId))) return;

  const seeded = seedHostPreviewActivity(userId);
  if (!seeded) return;

  const seed = Array.from(userId).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const todayMl = 1500 + Math.floor(previewUnit(seed + 19) * 900);

  const historyMlByDate: Record<string, number> = {};
  for (let daysAgo = 14; daysAgo >= 1; daysAgo -= 1) {
    const reachedGoal = previewUnit(seed + daysAgo * 13) > 0.45;
    historyMlByDate[dateKeyDaysAgo(daysAgo)] = reachedGoal
      ? DEFAULT_WATER_GOAL_ML
      : 1800 + Math.floor(previewUnit(seed + daysAgo) * 1200);
  }

  seedHostPreviewWaterIfNeeded(userId, todayMl, historyMlByDate, true);

  recordActivityEvent(userId, {
    type: "weight",
    title: "حدّثت وزنك",
    subtitle: "آخر قياس",
    points: HAKIM_POINTS_REWARDS.measurements,
    clientId: "preview:host:v2:weight",
    dateKey: dateKeyDaysAgo(1),
  });
  recordActivityEvent(userId, {
    type: "workout",
    title: "أكملت تمرين اليوم",
    points: HAKIM_POINTS_REWARDS.workout,
    clientId: "preview:host:v2:workout",
    dateKey: dateKeyDaysAgo(1),
  });
  recordActivityEvent(userId, {
    type: "achievement",
    title: "أحسنت!",
    subtitle: "سلسلة التزام متواصلة",
    points: HAKIM_POINTS_REWARDS.achievement,
    clientId: "preview:host:v2:achievement",
    dateKey: dateKeyDaysAgo(1),
  });
  recordActivityEvent(userId, {
    type: "meal",
    title: "سجّلت وجبة",
    points: HAKIM_POINTS_REWARDS.nutrition,
    clientId: "preview:host:v2:meal",
  });

  localStorage.setItem(previewFlagKey(userId), "1");
  notifyPlatformActivityChanged();
}
