import {
  BUILTIN_TIMER_PRESETS,
  DEFAULT_PRESET_ID,
  getBuiltinPreset,
} from "@/lib/platform/timer/presets";
import type {
  CustomPresetsStore,
  TimerConfig,
  TimerPreset,
  TimerSettings,
} from "@/lib/platform/timer/types";
import { INTERVAL_TIMER_STORAGE_VERSION } from "@/lib/platform/timer/types";

const SETTINGS_KEY = "hakim_interval_timer_settings";
const CUSTOM_PRESETS_KEY = "hakim_interval_timer_presets";

function defaultSettings(): TimerSettings {
  const preset = getBuiltinPreset(DEFAULT_PRESET_ID) ?? BUILTIN_TIMER_PRESETS[0];
  return {
    version: INTERVAL_TIMER_STORAGE_VERSION,
    lastPresetId: preset.id,
    soundEnabled: preset.soundEnabled,
    vibrationEnabled: preset.vibrationEnabled,
    config: {
      workSeconds: preset.workSeconds,
      restSeconds: preset.restSeconds,
      rounds: preset.rounds,
      preparationSeconds: preset.preparationSeconds,
      soundEnabled: preset.soundEnabled,
      vibrationEnabled: preset.vibrationEnabled,
    },
  };
}

export function loadTimerSettings(): TimerSettings {
  if (typeof window === "undefined") return defaultSettings();
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    const parsed = JSON.parse(raw) as TimerSettings;
    if (parsed.version !== INTERVAL_TIMER_STORAGE_VERSION) return defaultSettings();
    return parsed;
  } catch {
    return defaultSettings();
  }
}

export function saveTimerSettings(settings: TimerSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({ ...settings, version: INTERVAL_TIMER_STORAGE_VERSION }),
  );
}

export function persistTimerConfig(presetId: string, config: TimerConfig) {
  const current = loadTimerSettings();
  saveTimerSettings({
    ...current,
    lastPresetId: presetId,
    soundEnabled: config.soundEnabled,
    vibrationEnabled: config.vibrationEnabled,
    config,
  });
}

export function loadCustomPresets(): TimerPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CustomPresetsStore;
    if (parsed.version !== INTERVAL_TIMER_STORAGE_VERSION) return [];
    return Array.isArray(parsed.presets) ? parsed.presets : [];
  } catch {
    return [];
  }
}

export function saveCustomPreset(preset: TimerPreset) {
  if (typeof window === "undefined") return preset;
  const existing = loadCustomPresets().filter((item) => item.id !== preset.id);
  const next: CustomPresetsStore = {
    version: INTERVAL_TIMER_STORAGE_VERSION,
    presets: [{ ...preset, type: "custom", isCustom: true }, ...existing].slice(0, 12),
  };
  localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(next));
  return preset;
}

export function listAllPresets(): TimerPreset[] {
  return [...BUILTIN_TIMER_PRESETS, ...loadCustomPresets()];
}

export function resolvePreset(id: string): TimerPreset | null {
  return listAllPresets().find((preset) => preset.id === id) ?? null;
}
