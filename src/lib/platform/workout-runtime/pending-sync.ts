export type PendingSetWrite = {
  identity: string;
  payload: Record<string, unknown>;
  queuedAt: string;
  attempts: number;
};

export const PENDING_SETS_KEY = "hakim:workout-pending-sets:v1";

export function setIdentity(input: {
  sessionDate: string;
  exerciseExternalId: string;
  setNumber: number;
}): string {
  return `${input.sessionDate}::${input.exerciseExternalId}::${input.setNumber}`;
}

export function enqueuePending(queue: PendingSetWrite[], item: PendingSetWrite): PendingSetWrite[] {
  return [...queue.filter((row) => row.identity !== item.identity), item];
}

export function dequeuePending(queue: PendingSetWrite[], identity: string): PendingSetWrite[] {
  return queue.filter((row) => row.identity !== identity);
}

export function readPendingQueue(): PendingSetWrite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PENDING_SETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingSetWrite[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writePendingQueue(queue: PendingSetWrite[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_SETS_KEY, JSON.stringify(queue));
  } catch {
    // quota / private mode
  }
}
