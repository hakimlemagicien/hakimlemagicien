import { supabase } from "@/integrations/supabase/client";
import {
  hydrateHeroGoalSettings,
  type HeroGoalCardTheme,
  type HeroGoalFraming,
} from "@/lib/platform/hero-goal-framing";

export const HERO_GOAL_SETTINGS_QUERY_KEY = ["hero-goal-settings"] as const;

export type HeroGoalSettingsSnapshot = {
  framing: Record<string, HeroGoalFraming>;
  cardThemes: Record<string, HeroGoalCardTheme>;
};

function parseFraming(value: unknown): HeroGoalFraming | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const scale = Number(row.scale);
  const offsetX = Number(row.offsetX);
  const offsetY = Number(row.offsetY);
  if (!Number.isFinite(scale) || !Number.isFinite(offsetX) || !Number.isFinite(offsetY)) return null;
  return {
    scale,
    offsetX,
    offsetY,
    flipX: Boolean(row.flipX),
  };
}

function parseCardTheme(value: unknown): HeroGoalCardTheme {
  if (!value || typeof value !== "object") return { color: null };
  const color = (value as { color?: unknown }).color;
  return typeof color === "string" && color.trim() ? { color: color.toLowerCase() } : { color: null };
}

function mapSettingsPayload(raw: unknown): HeroGoalSettingsSnapshot {
  const payload = (raw && typeof raw === "object" ? raw : {}) as {
    framing?: Record<string, unknown>;
    card_themes?: Record<string, unknown>;
  };

  const framing: Record<string, HeroGoalFraming> = {};
  for (const [key, value] of Object.entries(payload.framing ?? {})) {
    const parsed = parseFraming(value);
    if (parsed) framing[key] = parsed;
  }

  const cardThemes: Record<string, HeroGoalCardTheme> = {};
  for (const [key, value] of Object.entries(payload.card_themes ?? {})) {
    cardThemes[key] = parseCardTheme(value);
  }

  return { framing, cardThemes };
}

export async function fetchHeroGoalSettings(): Promise<HeroGoalSettingsSnapshot> {
  const { data, error } = await supabase.rpc("client_get_hero_goal_settings");
  if (error) throw error;
  return mapSettingsPayload(data);
}

export async function loadHeroGoalSettings(): Promise<HeroGoalSettingsSnapshot> {
  const snapshot = await fetchHeroGoalSettings();
  hydrateHeroGoalSettings(snapshot);
  return snapshot;
}
