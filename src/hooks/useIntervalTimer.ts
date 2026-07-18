import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  computeTotalRemainingMs,
  createIdleSession,
  formatTimerClock,
  getActivePhase,
  getPhaseDurationMs,
  getRemainingMs,
  pauseSession,
  resumeSession,
  skipPhase,
  startSession,
  stopSession,
  syncSession,
} from "@/lib/platform/timer/interval-timer-engine";
import {
  loadTimerSettings,
  persistTimerConfig,
  resolvePreset,
  saveCustomPreset,
} from "@/lib/platform/timer/interval-timer-storage";
import { DEFAULT_PRESET_ID, getBuiltinPreset } from "@/lib/platform/timer/presets";
import { timerAudio } from "@/lib/platform/timer/timer-audio";
import {
  vibrateComplete,
  vibrateRestStart,
  vibrateWorkStart,
} from "@/lib/platform/timer/timer-vibration";
import { reacquireWakeLockIfNeeded, releaseWakeLock, requestWakeLock } from "@/lib/platform/timer/wake-lock";
import type { ActivePhase, TimerConfig, TimerPreset, TimerSession } from "@/lib/platform/timer/types";

const TICK_MS = 250;

function configFromPreset(preset: TimerPreset): TimerConfig {
  return {
    workSeconds: preset.workSeconds,
    restSeconds: preset.restSeconds,
    rounds: preset.rounds,
    preparationSeconds: preset.preparationSeconds,
    soundEnabled: preset.soundEnabled,
    vibrationEnabled: preset.vibrationEnabled,
  };
}

function playPhaseFeedback(
  phase: ActivePhase,
  config: TimerConfig,
  kind: "enter" | "complete",
) {
  if (!config.soundEnabled && !config.vibrationEnabled) return;

  if (kind === "complete" && phase === "work") {
    if (config.soundEnabled) timerAudio.complete();
    if (config.vibrationEnabled) vibrateComplete();
    return;
  }

  if (kind === "enter") {
    if (phase === "preparing" && config.soundEnabled) timerAudio.countdownTick();
    if (phase === "work") {
      if (config.soundEnabled) timerAudio.workStart();
      if (config.vibrationEnabled) vibrateWorkStart();
    }
    if (phase === "rest") {
      if (config.soundEnabled) timerAudio.restStart();
      if (config.vibrationEnabled) vibrateRestStart();
    }
  }
}

export function useIntervalTimer() {
  const initial = loadTimerSettings();
  const initialPreset = resolvePreset(initial.lastPresetId) ?? getBuiltinPreset(DEFAULT_PRESET_ID)!;

  const [presetId, setPresetId] = useState(initialPreset.id);
  const [presetName, setPresetName] = useState(initialPreset.name);
  const [config, setConfig] = useState<TimerConfig>(() => ({
    ...initial.config,
    soundEnabled: initial.soundEnabled,
    vibrationEnabled: initial.vibrationEnabled,
  }));
  const [session, setSession] = useState<TimerSession>(() => createIdleSession());
  const [now, setNow] = useState(() => Date.now());
  const [wakeLockHint, setWakeLockHint] = useState(false);

  const lastTickSecondRef = useRef<number | null>(null);

  const sessionRef = useRef(session);
  const configRef = useRef(config);
  sessionRef.current = session;
  configRef.current = config;

  const activePhase = getActivePhase(session);
  const remainingMs = getRemainingMs(session, now);
  const remainingSeconds = remainingMs / 1000;
  const phaseDurationMs = activePhase ? getPhaseDurationMs(config, activePhase) : 0;
  const progress =
    phaseDurationMs > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / phaseDurationMs)) : 0;

  const isActiveSession =
    session.runStatus === "running" || session.runStatus === "paused";

  useEffect(() => {
    if (session.runStatus !== "running") {
      lastTickSecondRef.current = null;
      return;
    }
    const sec = Math.ceil(remainingMs / 1000);
    if (sec <= 3 && sec > 0 && lastTickSecondRef.current !== sec) {
      lastTickSecondRef.current = sec;
      if (config.soundEnabled) timerAudio.finalCountdown();
    }
  }, [remainingMs, session.runStatus, config.soundEnabled]);

  const applyCompletedPhases = useCallback((completedPhases: ActivePhase[], next: TimerSession) => {
    completedPhases.forEach((phase, index) => {
      const isLast = index === completedPhases.length - 1;
      if (isLast && next.runStatus === "completed" && phase === "work") {
        playPhaseFeedback("work", configRef.current, "complete");
        return;
      }
      if (phase === "preparing" && configRef.current.soundEnabled) timerAudio.countdownTick();
    });

    if (next.runStatus === "running" && next.phase !== "idle") {
      const entered = next.phase;
      if (entered === "work" || entered === "rest") {
        playPhaseFeedback(entered, configRef.current, "enter");
      }
    }
  }, []);

  const setSyncedSession = useCallback(
    (next: TimerSession, completedPhases: ActivePhase[] = []) => {
      applyCompletedPhases(completedPhases, next);
      setSession(next);
    },
    [applyCompletedPhases],
  );

  useEffect(() => {
    if (session.runStatus !== "running") return;
    const id = window.setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);
      const synced = syncSession(configRef.current, sessionRef.current, currentNow);
      if (synced.completedPhases.length > 0 || synced.session !== sessionRef.current) {
        setSyncedSession(synced.session, synced.completedPhases);
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [session.runStatus, setSyncedSession]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const currentNow = Date.now();
      setNow(currentNow);
      const synced = syncSession(configRef.current, sessionRef.current, currentNow);
      if (synced.completedPhases.length > 0 || synced.session !== sessionRef.current) {
        setSyncedSession(synced.session, synced.completedPhases);
      }
      void reacquireWakeLockIfNeeded(
        sessionRef.current.runStatus === "running" || sessionRef.current.runStatus === "paused",
      );
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [setSyncedSession]);

  useEffect(() => {
    const active =
      session.runStatus === "running" || session.runStatus === "paused";
    if (active) {
      void requestWakeLock().then((ok) => {
        if (!ok) setWakeLockHint(true);
      });
    } else {
      void releaseWakeLock();
    }
    return () => {
      void releaseWakeLock();
    };
  }, [session.runStatus]);

  const selectPreset = useCallback((preset: TimerPreset) => {
    const nextConfig = configFromPreset(preset);
    setPresetId(preset.id);
    setPresetName(preset.name);
    setConfig(nextConfig);
    setSession(createIdleSession());
    persistTimerConfig(preset.id, nextConfig);
  }, []);

  const updateConfig = useCallback(
    (partial: Partial<TimerConfig>) => {
      setConfig((prev) => {
        const next = { ...prev, ...partial };
        persistTimerConfig(presetId, next);
        return next;
      });
      if (sessionRef.current.runStatus === "idle" || sessionRef.current.runStatus === "completed") {
        setSession(createIdleSession());
      }
    },
    [presetId],
  );

  const start = useCallback(() => {
    timerAudio.prime();
    const currentNow = Date.now();
    setNow(currentNow);
    const next = startSession(configRef.current, currentNow);
    setSyncedSession(next);
    persistTimerConfig(presetId, configRef.current);
  }, [presetId, setSyncedSession]);

  const pause = useCallback(() => {
    const currentNow = Date.now();
    setNow(currentNow);
    setSession(pauseSession(sessionRef.current, currentNow));
  }, []);

  const resume = useCallback(() => {
    timerAudio.prime();
    const currentNow = Date.now();
    setNow(currentNow);
    setSession(resumeSession(sessionRef.current, currentNow));
  }, []);

  const skip = useCallback(() => {
    const currentNow = Date.now();
    setNow(currentNow);
    const next = skipPhase(configRef.current, sessionRef.current, currentNow);
    setSyncedSession(next);
  }, [setSyncedSession]);

  const reset = useCallback(() => {
    setSession(createIdleSession());
    setNow(Date.now());
  }, []);

  const stop = useCallback(() => {
    setSession(stopSession());
    setNow(Date.now());
  }, []);

  const saveCustom = useCallback(
    (name: string, customConfig: TimerConfig, startImmediately: boolean) => {
      const preset: TimerPreset = {
        id: `custom-${crypto.randomUUID()}`,
        name: name.trim() || "مؤقت مخصص",
        type: "custom",
        isCustom: true,
        ...customConfig,
      };
      saveCustomPreset(preset);
      setPresetId(preset.id);
      setPresetName(preset.name);
      setConfig(customConfig);
      persistTimerConfig(preset.id, customConfig);
      setSession(createIdleSession());
      if (startImmediately) {
        timerAudio.prime();
        const currentNow = Date.now();
        setSyncedSession(startSession(customConfig, currentNow));
      }
      return preset;
    },
    [setSyncedSession],
  );

  const totalRemainingLabel = useMemo(() => {
    if (!isActiveSession) return null;
    const ms = computeTotalRemainingMs(config, session, now);
    return formatTimerClock(ms / 1000);
  }, [config, session, now, isActiveSession]);

  const nextPhasePreview = useMemo(() => {
    if (!activePhase || session.runStatus === "completed") return null;
    if (activePhase === "preparing") {
      return { label: "عمل", seconds: config.workSeconds };
    }
    if (activePhase === "work") {
      if (session.currentRound >= config.rounds) return null;
      if (config.restSeconds <= 0) {
        return { label: "عمل", seconds: config.workSeconds };
      }
      return { label: "راحة", seconds: config.restSeconds };
    }
    return { label: "عمل", seconds: config.workSeconds };
  }, [activePhase, config, session.currentRound, session.runStatus]);

  return {
    presetId,
    presetName,
    config,
    session,
    activePhase,
    remainingSeconds,
    remainingLabel: formatTimerClock(remainingSeconds),
    progress,
    isActiveSession,
    totalRemainingLabel,
    nextPhasePreview,
    wakeLockHint,
    selectPreset,
    updateConfig,
    start,
    pause,
    resume,
    skip,
    reset,
    stop,
    saveCustom,
  };
}

export function getPhaseLabel(phase: ActivePhase | null, runStatus: TimerSession["runStatus"]) {
  if (runStatus === "completed") return "أحسنت، أكملت التمرين";
  if (runStatus === "paused") return "متوقف مؤقتاً";
  if (phase === "preparing") return "استعد";
  if (phase === "work") return "وقت العمل";
  if (phase === "rest") return "وقت الراحة";
  return "جاهز للبدء";
}

export function getMotivationLabel(phase: ActivePhase | null, runStatus: TimerSession["runStatus"]) {
  if (runStatus === "completed") return "عمل رائع اليوم";
  if (runStatus === "paused") return "خذ نفساً ثم تابع";
  if (phase === "preparing") return "استعد للانطلاق";
  if (phase === "work") return "استمر، أنت رائع";
  if (phase === "rest") return "تنفس واستعد للجولة التالية";
  return "اختر إعدادك وابدأ";
}
