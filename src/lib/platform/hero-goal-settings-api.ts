import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  hydrateHeroGoalSettings,
  type HeroGoalCardTheme,
  type HeroGoalFraming,
} from "@/lib/platform/hero-goal-framing";
import {
  hydrateHeroGoalImageOverrides,
  type HeroGoalImageOverride,
} from "@/lib/platform/hero-goal-image-overrides";

export const HERO_GOAL_SETTINGS_QUERY_KEY = ["hero-goal-settings"] as const;

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === "string" && error.trim()) return error.trim();
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message.trim();
  }
  return "";
}

export function formatHeroGoalSettingsError(error: unknown): string {
  const msg = errorMessage(error).toLowerCase();
  if (
    msg.includes("does not exist") ||
    msg.includes("could not find the function") ||
    msg.includes("42883") ||
    msg.includes("bucket not found")
  ) {
    return "قاعدة البيانات غير جاهزة — طبّق هجرة صور الهيرو / إعدادات الهيرو على Supabase";
  }
  if (msg.includes("42501") || msg.includes("forbidden") || msg.includes("permission")) {
    return "ليس لديك صلاحية الحفظ (content.manage)";
  }
  const raw = errorMessage(error);
  return raw || "تعذر الاتصال بالسيرفر — حاول مرة أخرى";
}

export async function invalidateHeroGoalSettings(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: HERO_GOAL_SETTINGS_QUERY_KEY });
}

export type HeroGoalSettingsSnapshot = {
  framing: Record<string, HeroGoalFraming>;
  cardThemes: Record<string, HeroGoalCardTheme>;
  images: Record<string, HeroGoalImageOverride[]>;
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

function parseImageList(value: unknown): HeroGoalImageOverride[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const url = typeof row.url === "string" ? row.url.trim() : "";
      if (!url) return null;
      return {
        id: String(row.id ?? ""),
        url,
        fileName: String(row.fileName ?? row.storagePath ?? "image"),
        storagePath: String(row.storagePath ?? ""),
        sortOrder: Number(row.sortOrder ?? 0),
        surface: row.surface === "home" ? "home" : "workout",
      } satisfies HeroGoalImageOverride;
    })
    .filter((item): item is HeroGoalImageOverride => Boolean(item?.id && item.url));
}

function mapSettingsPayload(raw: unknown): HeroGoalSettingsSnapshot {
  const payload = (raw && typeof raw === "object" ? raw : {}) as {
    framing?: Record<string, unknown>;
    card_themes?: Record<string, unknown>;
    images?: Record<string, unknown>;
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

  const images: Record<string, HeroGoalImageOverride[]> = {};
  for (const [key, value] of Object.entries(payload.images ?? {})) {
    const list = parseImageList(value);
    if (list.length) images[key] = list;
  }

  return { framing, cardThemes, images };
}

export async function fetchHeroGoalSettings(): Promise<HeroGoalSettingsSnapshot> {
  const { data, error } = await supabase.rpc("client_get_hero_goal_settings");
  if (error) throw error;
  return mapSettingsPayload(data);
}

export async function loadHeroGoalSettings(): Promise<HeroGoalSettingsSnapshot> {
  const snapshot = await fetchHeroGoalSettings();
  hydrateHeroGoalSettings(snapshot);
  hydrateHeroGoalImageOverrides(snapshot.images);
  return snapshot;
}
