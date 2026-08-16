const SOUNDS_ENABLED_KEY = "hakim_water_sounds";

let audioContext: AudioContext | null = null;
let primed = false;

function soundsEnabled() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SOUNDS_ENABLED_KEY) !== "false";
}

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

export function primeWaterAudio() {
  if (!soundsEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  primed = true;
}

function drip(ctx: AudioContext, time: number, freq: number, volume: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1800;
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, time);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.42, time + 0.18);
  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.24);
}

export function playWaterDropSound() {
  if (!soundsEnabled()) return;
  primeWaterAudio();
  const ctx = getContext();
  if (!ctx) return;
  drip(ctx, ctx.currentTime, 640, 0.045);
}

export function playGoalSplashSound() {
  if (!soundsEnabled()) return;
  primeWaterAudio();
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  drip(ctx, t, 520, 0.05);
  drip(ctx, t + 0.12, 740, 0.045);
  drip(ctx, t + 0.26, 420, 0.04);
}

export function playWaterReminderSound() {
  if (!soundsEnabled() || !primed) return;
  const ctx = getContext();
  if (!ctx || ctx.state === "suspended") return;
  const t = ctx.currentTime;
  drip(ctx, t, 980, 0.055);
  drip(ctx, t + 0.18, 720, 0.045);
}
