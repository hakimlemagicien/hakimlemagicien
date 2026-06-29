/** Short tap pulse — tuned for Chrome / Chromium `navigator.vibrate`. */
export const SELECTION_HAPTIC_MS = 25;

/** Delay after haptic before viewport changes so the pulse is felt. */
export const HAPTIC_NAV_DELAY_MS = 150;

/** Fade-out duration before swapping quiz steps. */
export const QUIZ_STEP_FADE_MS = 180;

/**
 * Premium selection haptic. Safe on iOS Safari (no-op) and optimized for
 * Chrome mobile where `navigator.vibrate` is natively supported.
 */
export function triggerSelectionHaptic(durationMs = SELECTION_HAPTIC_MS): void {
  if (typeof navigator === "undefined") return;

  const vibrateFn = navigator.vibrate;
  if (typeof vibrateFn !== "function") return;

  try {
    vibrateFn(durationMs);
  } catch {
    // Restricted contexts / unsupported platforms
  }
}

/** Fire haptic immediately, then run `action` after the navigation delay. */
export function afterSelectionHaptic(
  action: () => void,
  delayMs = HAPTIC_NAV_DELAY_MS,
): void {
  triggerSelectionHaptic();
  window.setTimeout(action, delayMs);
}
