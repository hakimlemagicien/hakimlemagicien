let audioContext: AudioContext | null = null;
let initialized = false;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    try {
      audioContext = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioContext;
}

export function primeTimerAudio() {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  initialized = true;
}

function beep(frequency: number, durationMs: number, volume = 0.08) {
  if (!initialized) return;
  const ctx = getContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  osc.start(now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);
  osc.stop(now + durationMs / 1000 + 0.02);
}

export const timerAudio = {
  prime: primeTimerAudio,
  countdownTick: () => beep(880, 70),
  workStart: () => beep(660, 120, 0.1),
  restStart: () => beep(440, 120, 0.09),
  finalCountdown: () => beep(990, 80, 0.1),
  complete: () => {
    beep(523, 100, 0.1);
    window.setTimeout(() => beep(659, 120, 0.1), 120);
    window.setTimeout(() => beep(784, 160, 0.1), 260);
  },
};
