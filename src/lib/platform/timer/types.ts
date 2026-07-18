export const INTERVAL_TIMER_STORAGE_VERSION = 1;

export type TimerPhase = "idle" | "preparing" | "work" | "rest";
export type TimerRunStatus = "idle" | "running" | "paused" | "completed";

export type TimerConfig = {
  workSeconds: number;
  restSeconds: number;
  rounds: number;
  preparationSeconds: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
};

export type TimerPreset = TimerConfig & {
  id: string;
  name: string;
  type: "builtin" | "custom";
  isCustom?: boolean;
};

export type TimerSession = {
  runStatus: TimerRunStatus;
  phase: TimerPhase;
  currentRound: number;
  phaseEndTime: number | null;
  pausedRemainingMs: number | null;
  pausedPhase: Exclude<TimerPhase, "idle"> | null;
};

export type ActivePhase = Exclude<TimerPhase, "idle">;

export type TimerSettings = {
  version: number;
  lastPresetId: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  config: TimerConfig;
};

export type CustomPresetsStore = {
  version: number;
  presets: TimerPreset[];
};
