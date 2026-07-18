type WakeLockSentinel = {
  release: () => Promise<void>;
};

let wakeLock: WakeLockSentinel | null = null;

export async function requestWakeLock(): Promise<boolean> {
  if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return false;
  try {
    wakeLock = (await (navigator as Navigator & {
      wakeLock: { request: (type: "screen") => Promise<WakeLockSentinel> };
    }).wakeLock.request("screen")) as WakeLockSentinel;
    return true;
  } catch {
    return false;
  }
}

export async function releaseWakeLock() {
  if (!wakeLock) return;
  try {
    await wakeLock.release();
  } catch {
    /* ignore */
  } finally {
    wakeLock = null;
  }
}

export async function reacquireWakeLockIfNeeded(active: boolean) {
  if (!active) {
    await releaseWakeLock();
    return false;
  }
  if (wakeLock) return true;
  return requestWakeLock();
}
