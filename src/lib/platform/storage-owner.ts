/**
 * Synchronous "who is signed in on this device" for per-user browser storage keys.
 * Reads the Supabase auth token persisted in localStorage (`sb-<ref>-auth-token`), so storage
 * reads during first render are already scoped — no waiting for an auth round-trip.
 */
const AUTH_TOKEN_KEY = /^sb-.+-auth-token$/;

export function readSignedInUserIdSync(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const storage = window.localStorage;
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key || !AUTH_TOKEN_KEY.test(key)) continue;
      const parsed = JSON.parse(storage.getItem(key) ?? "null") as {
        user?: { id?: unknown };
        currentSession?: { user?: { id?: unknown } };
      } | null;
      const id = parsed?.user?.id ?? parsed?.currentSession?.user?.id;
      if (typeof id === "string" && id) return id;
    }
  } catch {
    // private mode / malformed token
  }
  return null;
}

/** `base:userId` (or `base:anon`) — one device can hold several accounts without leaking state. */
export function userScopedStorageKey(base: string): string {
  return `${base}:${readSignedInUserIdSync() ?? "anon"}`;
}
