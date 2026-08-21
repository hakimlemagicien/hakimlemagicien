/**
 * Workout audio cues — original synthesized WAV assets (not commercial/copyrighted).
 * Timer works without audio. Respects profile appSounds.
 */
import { getProfileSettings } from "@/lib/platform/profile-settings-storage";
import type { RestCueId } from "./wall-clock-rest";

export const WORKOUT_AUDIO_ASSETS: Record<RestCueId, { path: string; purpose: string }> = {
  t15: { path: "/audio/workout/t15.wav", purpose: "T-15 rest warning" },
  count3: { path: "/audio/workout/count-3.wav", purpose: "3-second countdown" },
  count2: { path: "/audio/workout/count-2.wav", purpose: "2-second countdown" },
  count1: { path: "/audio/workout/count-1.wav", purpose: "1-second countdown" },
  start: { path: "/audio/workout/start.wav", purpose: "rest complete / start whistle" },
};

const buffers = new Map<RestCueId, HTMLAudioElement>();
let primed = false;

export function workoutSoundsEnabled() {
  if (typeof window === "undefined") return false;
  return getProfileSettings().app.appSounds !== false;
}

export function primeWorkoutAudio() {
  if (typeof window === "undefined") return;
  primed = true;
  (Object.keys(WORKOUT_AUDIO_ASSETS) as RestCueId[]).forEach((id) => {
    if (buffers.has(id)) return;
    const audio = new Audio(WORKOUT_AUDIO_ASSETS[id].path);
    audio.preload = "auto";
    audio.volume = 0.7;
    buffers.set(id, audio);
  });
}

export function playWorkoutCue(id: RestCueId) {
  if (!workoutSoundsEnabled() || !primed) return;
  const audio = buffers.get(id);
  if (!audio) return;
  try {
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // autoplay blocked — timer continues
    });
  } catch {
    // unsupported
  }
}

export function hapticPulse() {
  if (typeof navigator === "undefined") return;
  if (!getProfileSettings().app.haptics) return;
  try {
    navigator.vibrate?.(40);
  } catch {
    // unsupported
  }
}
