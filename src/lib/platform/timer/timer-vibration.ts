export function vibrateWorkStart() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(120);
  }
}

export function vibrateRestStart() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate([80, 60, 80]);
  }
}

export function vibrateComplete() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate([120, 80, 160]);
  }
}
