function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

class MemoryStorage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, String(value));
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
}

const memLocal = new MemoryStorage();
const memSession = new MemoryStorage();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: memLocal,
  sessionStorage: memSession,
};

const AUTH_KEY = "sb-testref-auth-token";
const signInAs = (id: string | null) => {
  if (id) memLocal.setItem(AUTH_KEY, JSON.stringify({ user: { id } }));
  else memLocal.removeItem(AUTH_KEY);
};

const { readSignedInUserIdSync, userScopedStorageKey } = await import("./storage-owner");
const storage = await import("./workout-progress-storage");
const pending = await import("./workout-runtime/pending-sync");

signInAs(null);
assert(readSignedInUserIdSync() === null, "no session → no owner");
assert(userScopedStorageKey("k") === "k:anon", "anonymous scope");

// An old unscoped session (no owner) must not surface for anyone.
memLocal.setItem(
  "hakim:today-workout-session:v2",
  JSON.stringify({
    version: 3,
    sessionKey: "x",
    exerciseIndex: 0,
    progress: [{ completedSets: 1, status: "active" }],
    setLogs: [],
    startedAt: "2026-11-27T10:00:00Z",
    updatedAt: "2026-11-27T10:00:00Z",
  }),
);
signInAs("user-a");
assert(storage.peekStoredWorkoutSession() === null, "legacy unscoped session is not shown");
assert(memLocal.getItem("hakim:today-workout-session:v2") === null, "legacy key dropped");

// User A starts a session.
storage.saveWorkoutProgress("today::A", 0, [{ completedSets: 2, status: "active" }], [], {
  startedAt: "2026-11-27T10:00:00Z",
});
assert(
  storage.isStoredWorkoutInterrupted(storage.peekStoredWorkoutSession()),
  "user A sees own interrupted session",
);

// User B signs in on the same device → nothing from A.
signInAs("user-b");
assert(storage.peekStoredWorkoutSession() === null, "user B does not see user A session");
assert(
  !storage.isStoredWorkoutInterrupted(storage.peekStoredWorkoutSession()),
  "no resume notice for B",
);

// Pending set queue is per user too.
pending.writePendingQueue([{ identity: "b1", payload: {}, queuedAt: "t", attempts: 0 }]);
signInAs("user-a");
assert(pending.readPendingQueue().length === 0, "user A does not get user B pending sets");
assert(
  storage.peekStoredWorkoutSession() !== null,
  "user A session still there after switching back",
);

storage.clearWorkoutSession();
assert(storage.peekStoredWorkoutSession() === null, "clear removes only the current user session");
signInAs("user-b");
assert(pending.readPendingQueue().length === 1, "user B pending queue untouched");

console.log("storage-owner.test.ts: all tests passed");

export {};
