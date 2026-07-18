import type { TimerPreset } from "@/lib/platform/timer/types";

export const BUILTIN_TIMER_PRESETS: TimerPreset[] = [
  {
    id: "tabata",
    name: "Tabata",
    type: "builtin",
    workSeconds: 20,
    restSeconds: 10,
    rounds: 8,
    preparationSeconds: 5,
    soundEnabled: true,
    vibrationEnabled: true,
  },
  {
    id: "hiit-beginner",
    name: "HIIT للمبتدئين",
    type: "builtin",
    workSeconds: 40,
    restSeconds: 20,
    rounds: 10,
    preparationSeconds: 5,
    soundEnabled: true,
    vibrationEnabled: true,
  },
  {
    id: "fat-burn",
    name: "Fat Burn",
    type: "builtin",
    workSeconds: 45,
    restSeconds: 15,
    rounds: 12,
    preparationSeconds: 5,
    soundEnabled: true,
    vibrationEnabled: true,
  },
  {
    id: "boxing",
    name: "Boxing",
    type: "builtin",
    workSeconds: 180,
    restSeconds: 60,
    rounds: 12,
    preparationSeconds: 10,
    soundEnabled: true,
    vibrationEnabled: true,
  },
];

export const DEFAULT_PRESET_ID = "tabata";

export function getBuiltinPreset(id: string): TimerPreset | undefined {
  return BUILTIN_TIMER_PRESETS.find((preset) => preset.id === id);
}

export const WORK_TIME_OPTIONS = [10, 20, 30, 40, 45, 60] as const;
export const REST_TIME_OPTIONS = [0, 10, 15, 20, 30, 60] as const;
export const PREP_TIME_OPTIONS = [0, 3, 5, 10] as const;
