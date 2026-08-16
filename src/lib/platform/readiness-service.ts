import {
  computeReadinessResult,
  isReadinessAnswersComplete,
  type DailyReadinessCheck,
  type ReadinessAdjustmentChoice,
  type ReadinessAnswers,
  type ReadinessSource,
  type ReadinessStatus,
} from "@/lib/platform/readiness";
import { fetchRemoteReadiness, upsertRemoteReadiness } from "@/lib/platform/readiness-api";
import {
  createReadinessDraft,
  getTodayReadinessRecord,
  listPendingReadinessSync,
  upsertReadinessRecord,
  type KeyValueStore,
  getDefaultReadinessStore,
} from "@/lib/platform/readiness-storage";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `rd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isOnline(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.onLine;
}

async function syncRecord(
  record: DailyReadinessCheck,
  store: KeyValueStore,
): Promise<DailyReadinessCheck> {
  if (!isOnline()) {
    return upsertReadinessRecord({ ...record, pendingSync: true }, store);
  }

  try {
    const remote = await upsertRemoteReadiness(record);
    const saved = remote ?? { ...record, pendingSync: true };
    return upsertReadinessRecord({ ...saved, pendingSync: !remote }, store);
  } catch {
    return upsertReadinessRecord({ ...record, pendingSync: true }, store);
  }
}

export async function hydrateTodayReadiness(
  userId: string,
  store: KeyValueStore = getDefaultReadinessStore(),
): Promise<DailyReadinessCheck | null> {
  const local = getTodayReadinessRecord(userId, new Date(), store);
  if (!isOnline() || userId === "guest") return local;

  try {
    const localDate = local?.localDate ?? createReadinessDraft(userId).localDate;
    const remote = await fetchRemoteReadiness(userId, localDate);
    if (!remote) return local;
    if (!local) return upsertReadinessRecord({ ...remote, pendingSync: false }, store);
    const localTime = Date.parse(local.updatedAt);
    const remoteTime = Date.parse(remote.updatedAt);
    const winner = remoteTime >= localTime ? remote : local;
    return upsertReadinessRecord(
      { ...winner, pendingSync: winner === local && local.pendingSync },
      store,
    );
  } catch {
    return local;
  }
}

export async function saveReadinessCheck(
  input: {
    userId: string;
    answers: Partial<ReadinessAnswers>;
    status: ReadinessStatus;
    source?: ReadinessSource;
  },
  store: KeyValueStore = getDefaultReadinessStore(),
): Promise<DailyReadinessCheck> {
  const previous = getTodayReadinessRecord(input.userId, new Date(), store);
  const draft = previous ?? createReadinessDraft(input.userId);
  const now = new Date().toISOString();
  let next: DailyReadinessCheck = {
    ...draft,
    id: draft.id ?? newId(),
    userId: input.userId,
    status: input.status,
    source: input.source ?? previous?.source ?? "manual",
    energy: input.answers.energy ?? draft.energy,
    sleep: input.answers.sleep ?? draft.sleep,
    body: input.answers.body ?? draft.body,
    updatedAt: now,
    createdAt: draft.createdAt ?? now,
  };

  if (input.status === "completed" && isReadinessAnswersComplete(input.answers)) {
    const result = computeReadinessResult(input.answers);
    next = {
      ...next,
      ...input.answers,
      score: result.score,
      level: result.level,
      source: input.source ?? "manual",
    };
  }

  return syncRecord(next, store);
}

export async function saveReadinessAdjustment(
  userId: string,
  decision: "accepted" | "declined",
  choice?: ReadinessAdjustmentChoice,
  store: KeyValueStore = getDefaultReadinessStore(),
): Promise<DailyReadinessCheck | null> {
  const current = getTodayReadinessRecord(userId, new Date(), store);
  if (!current) return null;
  return syncRecord(
    {
      ...current,
      adjustmentDecision: decision,
      adjustmentChoice: decision === "accepted" ? choice : undefined,
      updatedAt: new Date().toISOString(),
    },
    store,
  );
}

export async function flushPendingReadinessSync(
  userId: string,
  store: KeyValueStore = getDefaultReadinessStore(),
): Promise<void> {
  if (!isOnline() || userId === "guest") return;
  const pending = listPendingReadinessSync(userId, store);
  for (const record of pending) {
    await syncRecord(record, store);
  }
}
