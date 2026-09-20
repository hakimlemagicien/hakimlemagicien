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

const WATER_POUR_DURATION_SECONDS = 1.1;

/** A short, licensed-asset-free pour into a glass. One buffer, one play, no loop. */
function pourIntoGlass(ctx: AudioContext, time: number) {
  const frameCount = Math.ceil(ctx.sampleRate * WATER_POUR_DURATION_SECONDS);
  const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  let previous = 0;
  let seed = 0x4d41414b;

  for (let index = 0; index < samples.length; index += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const noise = (seed / 0xffffffff) * 2 - 1;
    previous = previous * 0.86 + noise * 0.14;
    const progress = index / samples.length;
    const attack = Math.min(1, progress / 0.12);
    const release = Math.min(1, (1 - progress) / 0.2);
    const streamTexture = 0.72 + 0.28 * Math.sin(index * 0.017);
    samples[index] = previous * attack * release * streamTexture;
  }

  const source = ctx.createBufferSource();
  const streamBand = ctx.createBiquadFilter();
  const soften = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  source.loop = false;
  streamBand.type = "bandpass";
  streamBand.frequency.setValueAtTime(820, time);
  streamBand.frequency.linearRampToValueAtTime(1080, time + WATER_POUR_DURATION_SECONDS);
  streamBand.Q.value = 0.7;
  soften.type = "lowpass";
  soften.frequency.value = 2400;
  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(0.055, time + 0.12);
  gain.gain.setValueAtTime(0.05, time + 0.82);
  gain.gain.exponentialRampToValueAtTime(0.001, time + WATER_POUR_DURATION_SECONDS);
  source.connect(streamBand);
  streamBand.connect(soften);
  soften.connect(gain);
  gain.connect(ctx.destination);
  source.start(time);
  source.stop(time + WATER_POUR_DURATION_SECONDS);

  // Two quiet glass resonances make the stream read as water entering a cup.
  drip(ctx, time + 0.58, 690, 0.014);
  drip(ctx, time + 0.84, 540, 0.012);
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
  pourIntoGlass(ctx, ctx.currentTime);
}
