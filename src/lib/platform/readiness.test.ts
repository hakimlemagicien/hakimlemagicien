import {
  computeReadinessResult,
  didMutateDailyPlan,
  getLocalDateKey,
  hasStartedToday,
  isReadinessAnswersComplete,
  shouldAutoOpenReadiness,
  shouldNudgeReadinessBadge,
  type DailyReadinessCheck,
} from "./readiness";
import {
  createMemoryStore,
  createReadinessDraft,
  getReadinessRecord,
  listReadinessRecords,
  upsertReadinessRecord,
} from "./readiness-storage";
import { saveReadinessCheck } from "./readiness-service";
import type { PlatformActivitySnapshot } from "./platform-activity";
import { buildYourDayScore } from "./your-day";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  if (!same) {
    throw new Error(
      `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

function sampleRecord(overrides: Partial<DailyReadinessCheck> = {}): DailyReadinessCheck {
  return {
    userId: "user-1",
    localDate: "2026-08-16",
    timezone: "Asia/Dubai",
    status: "completed",
    source: "manual",
    createdAt: "2026-08-16T08:00:00.000Z",
    updatedAt: "2026-08-16T08:00:00.000Z",
    ...overrides,
  };
}

export function runReadinessTests() {
  assertEqual(isReadinessAnswersComplete({ energy: "high" }), false, "incomplete answers");
  assert(
    isReadinessAnswersComplete({ energy: "high", sleep: "good", body: "good" }),
    "complete answers should pass",
  );
  assertEqual(
    computeReadinessResult({ energy: "high", sleep: "good", body: "good" }),
    { score: 9, level: "ready" },
    "ready score",
  );
  assertEqual(
    computeReadinessResult({ energy: "medium", sleep: "fair", body: "fatigued" }),
    { score: 6, level: "balanced" },
    "balanced score",
  );
  assertEqual(
    computeReadinessResult({ energy: "low", sleep: "poor", body: "fatigued" }),
    { score: 4, level: "recovery" },
    "recovery score",
  );
  assertEqual(
    computeReadinessResult({ energy: "high", sleep: "good", body: "pain" }),
    { score: 7, level: "recovery" },
    "pain forces recovery",
  );

  const dubai = getLocalDateKey(new Date("2026-08-16T23:30:00+04:00"), "Asia/Dubai");
  assertEqual(dubai, "2026-08-16", "local date in Dubai");
  const la = getLocalDateKey(new Date("2026-08-16T03:00:00.000Z"), "America/Los_Angeles");
  assertEqual(la, "2026-08-15", "timezone crossing midnight");

  const none = shouldAutoOpenReadiness({
    isAuthenticated: true,
    fromStartDay: true,
    dataReady: true,
    otherCriticalOverlayOpen: false,
    record: null,
  });
  assert(none, "auto-open default");

  for (const status of ["completed", "skipped", "dismissed"] as const) {
    assertEqual(
      shouldAutoOpenReadiness({
        isAuthenticated: true,
        fromStartDay: true,
        dataReady: true,
        otherCriticalOverlayOpen: false,
        record: sampleRecord({ status }),
      }),
      false,
      `no auto-open after ${status}`,
    );
  }

  assertEqual(
    shouldAutoOpenReadiness({
      isAuthenticated: true,
      fromStartDay: false,
      dataReady: true,
      otherCriticalOverlayOpen: false,
      record: null,
    }),
    false,
    "manual page visit does not auto-open",
  );
  assertEqual(
    shouldAutoOpenReadiness({
      isAuthenticated: false,
      fromStartDay: true,
      dataReady: true,
      otherCriticalOverlayOpen: false,
      record: null,
    }),
    false,
    "guest does not auto-open",
  );
  assertEqual(
    shouldAutoOpenReadiness({
      isAuthenticated: true,
      fromStartDay: true,
      dataReady: false,
      otherCriticalOverlayOpen: false,
      record: null,
    }),
    false,
    "wait for data",
  );
  assertEqual(
    shouldAutoOpenReadiness({
      isAuthenticated: true,
      fromStartDay: true,
      dataReady: true,
      otherCriticalOverlayOpen: true,
      record: null,
    }),
    false,
    "other overlay blocks auto-open",
  );

  assert(hasStartedToday(sampleRecord({ status: "skipped" })), "skipped counts as started");
  assert(!hasStartedToday(null), "no record is not started");
  assert(shouldNudgeReadinessBadge(sampleRecord({ status: "skipped" })), "skipped badge nudges");
  assert(!shouldNudgeReadinessBadge(sampleRecord({ status: "completed" })), "completed does not nudge");
  assert(!shouldNudgeReadinessBadge(null), "missing record does not nudge");
  assert(
    !didMutateDailyPlan(sampleRecord({ adjustmentDecision: "accepted" })),
    "plan stays unchanged",
  );

  const store = createMemoryStore();
  const first = upsertReadinessRecord(sampleRecord({ energy: "low" }), store, { notify: false });
  const second = upsertReadinessRecord(
    sampleRecord({ energy: "high", updatedAt: "2026-08-16T09:00:00.000Z" }),
    store,
    { notify: false },
  );
  assertEqual(listReadinessRecords("user-1", store).length, 1, "one record per day");
  assertEqual(second.energy, "high", "same-day update replaces values");
  assertEqual(second.createdAt, first.createdAt, "createdAt preserved on upsert");
  assertEqual(getReadinessRecord("user-1", "2026-08-16", store)?.energy, "high", "today lookup");

  const offlineStore = createMemoryStore();
  return saveReadinessCheck(
    {
      userId: "user-2",
      answers: { energy: "medium", sleep: "fair", body: "fatigued" },
      status: "completed",
    },
    offlineStore,
  ).then((saved) => {
    assertEqual(saved.status, "completed", "offline save succeeds");
    assertEqual(saved.level, "balanced", "offline score");
    assert(saved.pendingSync, "offline marks pending sync");
    assertEqual(listReadinessRecords("user-2", offlineStore).length, 1, "offline uniqueness");

    const draft = createReadinessDraft("user-3", new Date("2026-08-16T08:00:00+04:00"));
    assertEqual(
      draft.localDate,
      getLocalDateKey(new Date("2026-08-16T08:00:00+04:00")),
      "draft local date",
    );

    const score = buildYourDayScore(
      {
        mealsDone: 4,
        mealsTotal: 4,
        waterGlasses: 8,
        waterGoal: 8,
      } as PlatformActivitySnapshot,
      2,
    );
    assert(score.total >= 0 && score.total <= 100, "day score bounds");
    assertEqual(score.tasks.length, 4, "four day tasks");
    assertEqual(score.nextTask.href, "/app/program/workout", "next task prefers workout");
  });
}

void runReadinessTests()
  .then(() => {
    console.log("readiness tests passed");
  })
  .catch((error: unknown) => {
    console.error(error);
    throw error;
  });
