import type { ActivePhase, TimerConfig, TimerSession } from "@/lib/platform/timer/types";

export function createIdleSession(): TimerSession {
  return {
    runStatus: "idle",
    phase: "idle",
    currentRound: 1,
    phaseEndTime: null,
    pausedRemainingMs: null,
    pausedPhase: null,
  };
}

export function getActivePhase(session: TimerSession): ActivePhase | null {
  if (session.runStatus === "paused" && session.pausedPhase) return session.pausedPhase;
  if (session.phase === "idle") return null;
  return session.phase;
}

export function getRemainingMs(session: TimerSession, now = Date.now()): number {
  if (session.runStatus === "paused" && session.pausedRemainingMs !== null) {
    return Math.max(0, session.pausedRemainingMs);
  }
  if (session.phaseEndTime === null) return 0;
  return Math.max(0, session.phaseEndTime - now);
}

export function getPhaseDurationMs(config: TimerConfig, phase: ActivePhase): number {
  if (phase === "preparing") return config.preparationSeconds * 1000;
  if (phase === "work") return config.workSeconds * 1000;
  return config.restSeconds * 1000;
}

export function startSession(config: TimerConfig, now = Date.now()): TimerSession {
  if (config.preparationSeconds <= 0) {
    return {
      runStatus: "running",
      phase: "work",
      currentRound: 1,
      phaseEndTime: now + config.workSeconds * 1000,
      pausedRemainingMs: null,
      pausedPhase: null,
    };
  }
  return {
    runStatus: "running",
    phase: "preparing",
    currentRound: 1,
    phaseEndTime: now + config.preparationSeconds * 1000,
    pausedRemainingMs: null,
    pausedPhase: null,
  };
}

function nextPhaseAfter(
  config: TimerConfig,
  phase: ActivePhase,
  currentRound: number,
  overflowMs: number,
  now: number,
): TimerSession {
  if (phase === "preparing") {
    const duration = config.workSeconds * 1000;
    if (overflowMs >= duration) {
      return nextPhaseAfter(config, "work", 1, overflowMs - duration, now);
    }
    return {
      runStatus: "running",
      phase: "work",
      currentRound: 1,
      phaseEndTime: now + duration - overflowMs,
      pausedRemainingMs: null,
      pausedPhase: null,
    };
  }

  if (phase === "work") {
    if (currentRound >= config.rounds) {
      return {
        runStatus: "completed",
        phase: "idle",
        currentRound,
        phaseEndTime: null,
        pausedRemainingMs: null,
        pausedPhase: null,
      };
    }

    if (config.restSeconds <= 0) {
      const duration = config.workSeconds * 1000;
      const nextRound = currentRound + 1;
      if (overflowMs >= duration) {
        return nextPhaseAfter(config, "work", nextRound, overflowMs - duration, now);
      }
      return {
        runStatus: "running",
        phase: "work",
        currentRound: nextRound,
        phaseEndTime: now + duration - overflowMs,
        pausedRemainingMs: null,
        pausedPhase: null,
      };
    }

    const restDuration = config.restSeconds * 1000;
    if (overflowMs >= restDuration) {
      return nextPhaseAfter(config, "rest", currentRound, overflowMs - restDuration, now);
    }
    return {
      runStatus: "running",
      phase: "rest",
      currentRound,
      phaseEndTime: now + restDuration - overflowMs,
      pausedRemainingMs: null,
      pausedPhase: null,
    };
  }

  const workDuration = config.workSeconds * 1000;
  const nextRound = currentRound + 1;
  if (overflowMs >= workDuration) {
    return nextPhaseAfter(config, "work", nextRound, overflowMs - workDuration, now);
  }
  return {
    runStatus: "running",
    phase: "work",
    currentRound: nextRound,
    phaseEndTime: now + workDuration - overflowMs,
    pausedRemainingMs: null,
    pausedPhase: null,
  };
}

export function syncSession(
  config: TimerConfig,
  session: TimerSession,
  now = Date.now(),
): { session: TimerSession; completedPhases: ActivePhase[] } {
  if (session.runStatus !== "running" || session.phaseEndTime === null || session.phase === "idle") {
    return { session, completedPhases: [] };
  }

  let current = session;
  const completedPhases: ActivePhase[] = [];

  while (
    current.runStatus === "running" &&
    current.phaseEndTime !== null &&
    current.phase !== "idle" &&
    now >= current.phaseEndTime
  ) {
    const overflow = now - current.phaseEndTime;
    completedPhases.push(current.phase);
    current = nextPhaseAfter(config, current.phase, current.currentRound, overflow, now);
  }

  return { session: current, completedPhases };
}

export function skipPhase(config: TimerConfig, session: TimerSession, now = Date.now()): TimerSession {
  const phase = getActivePhase(session);
  if (!phase || session.runStatus === "idle" || session.runStatus === "completed") return session;
  return nextPhaseAfter(config, phase, session.currentRound, Number.MAX_SAFE_INTEGER, now);
}

export function pauseSession(session: TimerSession, now = Date.now()): TimerSession {
  if (session.runStatus !== "running") return session;
  const phase = getActivePhase(session);
  if (!phase) return session;
  return {
    ...session,
    runStatus: "paused",
    pausedRemainingMs: getRemainingMs(session, now),
    pausedPhase: phase,
    phaseEndTime: null,
  };
}

export function resumeSession(session: TimerSession, now = Date.now()): TimerSession {
  if (session.runStatus !== "paused" || session.pausedRemainingMs === null || !session.pausedPhase) {
    return session;
  }
  return {
    ...session,
    runStatus: "running",
    phase: session.pausedPhase,
    phaseEndTime: now + session.pausedRemainingMs,
    pausedRemainingMs: null,
    pausedPhase: null,
  };
}

export function stopSession(): TimerSession {
  return createIdleSession();
}

export function computeTotalRemainingMs(
  config: TimerConfig,
  session: TimerSession,
  now = Date.now(),
): number {
  if (session.runStatus === "idle" || session.runStatus === "completed") return 0;

  let total = getRemainingMs(session, now);
  const phase = getActivePhase(session);
  const round = session.currentRound;
  if (!phase) return total;

  const appendFutureRounds = (fromRound: number) => {
    for (let r = fromRound; r <= config.rounds; r += 1) {
      total += config.workSeconds * 1000;
      if (r < config.rounds && config.restSeconds > 0) {
        total += config.restSeconds * 1000;
      }
    }
  };

  if (phase === "preparing") {
    appendFutureRounds(1);
    return total;
  }

  if (phase === "work") {
    if (round < config.rounds && config.restSeconds > 0) {
      total += config.restSeconds * 1000;
    }
    appendFutureRounds(round + 1);
    return total;
  }

  appendFutureRounds(round + 1);
  return total;
}

export function formatTimerClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function intervalTimerSelfChecks(): { name: string; pass: boolean }[] {
  const config: TimerConfig = {
    workSeconds: 20,
    restSeconds: 10,
    rounds: 2,
    preparationSeconds: 5,
    soundEnabled: true,
    vibrationEnabled: true,
  };

  const t0 = 1_000_000;
  const session = startSession(config, t0);
  const prepOk = session.phase === "preparing" && session.phaseEndTime === t0 + 5000;

  const afterPrep = syncSession(config, session, t0 + 5000);
  const workOk = afterPrep.session.phase === "work" && afterPrep.session.currentRound === 1;

  const afterWork = syncSession(config, afterPrep.session, t0 + 5000 + 20_000);
  const restOk = afterWork.session.phase === "rest" && afterWork.session.currentRound === 1;

  const afterRest = syncSession(config, afterWork.session, t0 + 5000 + 20_000 + 10_000);
  const round2Ok = afterRest.session.phase === "work" && afterRest.session.currentRound === 2;

  const afterFinalWork = syncSession(config, afterRest.session, t0 + 5000 + 20_000 + 10_000 + 20_000);
  const completedOk = afterFinalWork.session.runStatus === "completed";

  const paused = pauseSession(afterRest.session, t0 + 40_000);
  const pausedOk = paused.runStatus === "paused" && paused.pausedRemainingMs !== null;

  const resumed = resumeSession(paused, t0 + 45_000);
  const resumeOk =
    resumed.runStatus === "running" &&
    resumed.phaseEndTime === t0 + 45_000 + (paused.pausedRemainingMs ?? 0);

  const singleRoundConfig: TimerConfig = { ...config, rounds: 1 };
  const single = syncSession(singleRoundConfig, startSession(singleRoundConfig, t0), t0 + 5000 + 20_000);
  const noRestAfterLastOk = single.session.runStatus === "completed";

  return [
    { name: "PREPARING start", pass: prepOk },
    { name: "PREPARING to WORK", pass: workOk },
    { name: "WORK to REST", pass: restOk },
    { name: "REST to next WORK", pass: round2Ok },
    { name: "Last WORK to COMPLETED", pass: completedOk },
    { name: "Pause stores remaining", pass: pausedOk },
    { name: "Resume rebuilds end time", pass: resumeOk },
    { name: "No rest after final round", pass: noRestAfterLastOk },
  ];
}
