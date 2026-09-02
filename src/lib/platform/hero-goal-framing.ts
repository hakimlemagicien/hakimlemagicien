import type { CSSProperties } from "react";
import type { HeroGender, HeroGoalImage } from "@/lib/platform/hero-goal-images";

export function assetFileName(src: string): string {
  try {
    const decoded = decodeURIComponent(src);
    const segment = decoded.split("/").pop() ?? src;
    return segment.split("?")[0] ?? segment;
  } catch {
    return src;
  }
}

export type HeroGoalFraming = {
  scale: number;
  offsetX: number;
  offsetY: number;
  flipX: boolean;
};

export const DEFAULT_HERO_GOAL_FRAMING: HeroGoalFraming = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  flipX: false,
};

const STORAGE_KEY = "maakfit_hero_goal_framing_v1";
const SCALE_MIN = 0.72;
const SCALE_MAX = 1.35;
const OFFSET_MIN = -96;
const OFFSET_MAX = 96;
const SCALE_STEP = 0.04;
const OFFSET_STEP = 6;

export const HERO_GOAL_FRAMING_MANIFEST: Record<string, HeroGoalFraming> = {};

export const HERO_GOAL_SETTINGS_CHANGED_EVENT = "maakfit:hero-goal-settings-changed";

function notifyHeroGoalSettingsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(HERO_GOAL_SETTINGS_CHANGED_EVENT));
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function clampFraming(value: Partial<HeroGoalFraming>): HeroGoalFraming {
  return {
    scale: Math.min(SCALE_MAX, Math.max(SCALE_MIN, Number((value.scale ?? 1).toFixed(3)))),
    offsetX: Math.min(OFFSET_MAX, Math.max(OFFSET_MIN, Math.round(value.offsetX ?? 0))),
    offsetY: Math.min(OFFSET_MAX, Math.max(OFFSET_MIN, Math.round(value.offsetY ?? 0))),
    flipX: Boolean(value.flipX),
  };
}

export function buildHeroGoalFramingKey(
  gender: HeroGender,
  goalId: string,
  src: string,
): string {
  return `${gender}:${goalId}:${assetFileName(src)}`;
}

function readStorageMap(): Record<string, HeroGoalFraming> {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, HeroGoalFraming>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorageMap(map: Record<string, HeroGoalFraming>): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getHeroGoalFraming(key: string): HeroGoalFraming {
  if (import.meta.env.DEV) {
    const stored = readStorageMap()[key];
    if (stored) return clampFraming(stored);
  }
  const manifest = HERO_GOAL_FRAMING_MANIFEST[key];
  if (manifest) return clampFraming(manifest);
  return DEFAULT_HERO_GOAL_FRAMING;
}

export function applyHeroGoalFramingToManifest(key: string, framing: HeroGoalFraming): HeroGoalFraming {
  const next = clampFraming(framing);
  HERO_GOAL_FRAMING_MANIFEST[key] = next;
  return next;
}

export function removeHeroGoalFramingFromManifest(key: string): void {
  delete HERO_GOAL_FRAMING_MANIFEST[key];
}

export function saveHeroGoalFraming(key: string, framing: HeroGoalFraming): HeroGoalFraming {
  const next = clampFraming(framing);
  const map = readStorageMap();
  map[key] = next;
  writeStorageMap(map);
  return next;
}

export function resetHeroGoalFraming(key: string): void {
  const map = readStorageMap();
  delete map[key];
  writeStorageMap(map);
}

export function attachHeroGoalFraming(image: HeroGoalImage): HeroGoalImage {
  const key = buildHeroGoalFramingKey(image.gender, image.goalId, image.src);
  return { ...image, framing: getHeroGoalFraming(key) };
}

export function heroCoachTransformStyle(input: {
  framing?: HeroGoalFraming;
  loaded: boolean;
}): CSSProperties | undefined {
  if (!input.loaded) return undefined;
  const framing = input.framing ?? DEFAULT_HERO_GOAL_FRAMING;
  const baseScale = 0.98 * framing.scale;
  const scaleX = framing.flipX ? -baseScale : baseScale;
  return {
    transform: `translateY(${framing.offsetY}px) scale(${scaleX}, ${baseScale}) translateX(${framing.offsetX}px)`,
  };
}

export function nudgeHeroGoalFraming(
  framing: HeroGoalFraming,
  patch: Partial<HeroGoalFraming>,
): HeroGoalFraming {
  return clampFraming({
    scale: patch.scale ?? framing.scale,
    offsetX: patch.offsetX ?? framing.offsetX,
    offsetY: patch.offsetY ?? framing.offsetY,
    flipX: patch.flipX ?? framing.flipX,
  });
}

export function zoomHeroGoalFraming(framing: HeroGoalFraming, direction: "in" | "out"): HeroGoalFraming {
  const delta = direction === "in" ? SCALE_STEP : -SCALE_STEP;
  return nudgeHeroGoalFraming(framing, { scale: framing.scale + delta });
}

export function panHeroGoalFraming(
  framing: HeroGoalFraming,
  direction: "left" | "right",
): HeroGoalFraming {
  const delta = direction === "right" ? OFFSET_STEP : -OFFSET_STEP;
  return nudgeHeroGoalFraming(framing, { offsetX: framing.offsetX + delta });
}

export function panHeroGoalFramingVertical(
  framing: HeroGoalFraming,
  direction: "up" | "down",
): HeroGoalFraming {
  const delta = direction === "down" ? OFFSET_STEP : -OFFSET_STEP;
  return nudgeHeroGoalFraming(framing, { offsetY: framing.offsetY + delta });
}

export function toggleHeroGoalFlip(framing: HeroGoalFraming): HeroGoalFraming {
  return nudgeHeroGoalFraming(framing, { flipX: !framing.flipX });
}

export const HERO_FRAMING_LIMITS = {
  scaleMin: SCALE_MIN,
  scaleMax: SCALE_MAX,
  offsetMin: OFFSET_MIN,
  offsetMax: OFFSET_MAX,
} as const;

export type HeroGoalCardTheme = {
  color: string | null;
};

export const DEFAULT_HERO_GOAL_CARD_THEME: HeroGoalCardTheme = { color: null };

export const HERO_CARD_COLOR_PRESETS: ReadonlyArray<{
  id: string;
  labelAr: string;
  color: string | null;
}> = [
  { id: "default", labelAr: "افتراضي", color: null },
  { id: "charcoal", labelAr: "فحمي", color: "#2a2a2e" },
  { id: "navy", labelAr: "كحلي", color: "#1e2d42" },
  { id: "forest", labelAr: "أخضر", color: "#1e3228" },
  { id: "wine", labelAr: "خمري", color: "#3a1e28" },
  { id: "rose", labelAr: "وردي", color: "#4a2438" },
  { id: "purple", labelAr: "بنفسجي", color: "#2a1e38" },
  { id: "ocean", labelAr: "أزرق", color: "#1a2840" },
  { id: "bronze", labelAr: "برونزي", color: "#3a2a18" },
];

const CARD_THEME_STORAGE_KEY = "maakfit_hero_goal_card_theme_v1";
export const HERO_GOAL_CARD_THEME_MANIFEST: Record<string, HeroGoalCardTheme> = {};

function clampCardTheme(value: Partial<HeroGoalCardTheme>): HeroGoalCardTheme {
  const raw = value.color?.trim() ?? "";
  if (!raw) return DEFAULT_HERO_GOAL_CARD_THEME;
  const normalized = raw.startsWith("#") ? raw : `#${raw}`;
  return /^#[0-9a-fA-F]{6}$/.test(normalized)
    ? { color: normalized.toLowerCase() }
    : DEFAULT_HERO_GOAL_CARD_THEME;
}

export function buildHeroGoalCardThemeKey(gender: HeroGender, goalId: string): string {
  return `${gender}:${goalId}`;
}

function readCardThemeMap(): Record<string, HeroGoalCardTheme> {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(CARD_THEME_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, HeroGoalCardTheme>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeCardThemeMap(map: Record<string, HeroGoalCardTheme>): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(CARD_THEME_STORAGE_KEY, JSON.stringify(map));
}

export function getHeroGoalCardTheme(key: string): HeroGoalCardTheme {
  if (import.meta.env.DEV) {
    const stored = readCardThemeMap()[key];
    if (stored) return clampCardTheme(stored);
  }
  const manifest = HERO_GOAL_CARD_THEME_MANIFEST[key];
  if (manifest) return clampCardTheme(manifest);
  return DEFAULT_HERO_GOAL_CARD_THEME;
}

export function applyHeroGoalCardThemeToManifest(key: string, theme: HeroGoalCardTheme): HeroGoalCardTheme {
  const next = clampCardTheme(theme);
  if (!next.color) delete HERO_GOAL_CARD_THEME_MANIFEST[key];
  else HERO_GOAL_CARD_THEME_MANIFEST[key] = next;
  return next;
}

export function removeHeroGoalCardThemeFromManifest(key: string): void {
  delete HERO_GOAL_CARD_THEME_MANIFEST[key];
}

export function hydrateHeroGoalSettings(input: {
  framing: Record<string, HeroGoalFraming>;
  cardThemes: Record<string, HeroGoalCardTheme>;
}): void {
  for (const key of Object.keys(HERO_GOAL_FRAMING_MANIFEST)) {
    delete HERO_GOAL_FRAMING_MANIFEST[key];
  }
  for (const key of Object.keys(HERO_GOAL_CARD_THEME_MANIFEST)) {
    delete HERO_GOAL_CARD_THEME_MANIFEST[key];
  }

  for (const [key, framing] of Object.entries(input.framing)) {
    applyHeroGoalFramingToManifest(key, framing);
  }
  for (const [key, theme] of Object.entries(input.cardThemes)) {
    applyHeroGoalCardThemeToManifest(key, theme);
  }

  notifyHeroGoalSettingsChanged();
}

export function saveHeroGoalCardTheme(key: string, theme: HeroGoalCardTheme): HeroGoalCardTheme {
  const next = clampCardTheme(theme);
  const map = readCardThemeMap();
  if (!next.color) delete map[key];
  else map[key] = next;
  writeCardThemeMap(map);
  return next;
}

export function resetHeroGoalCardTheme(key: string): void {
  const map = readCardThemeMap();
  delete map[key];
  writeCardThemeMap(map);
}

function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function mixHexColor(hex: string, amount: number): string {
  const rgb = parseHexColor(hex);
  if (!rgb) return hex;
  const mix = (channel: number) =>
    Math.min(255, Math.max(0, Math.round(channel + (255 - channel) * amount)));
  const shade = (channel: number) =>
    Math.min(255, Math.max(0, Math.round(channel * (1 - amount))));
  const next =
    amount > 0
      ? { r: mix(rgb.r), g: mix(rgb.g), b: mix(rgb.b) }
      : { r: shade(rgb.r), g: shade(rgb.g), b: shade(rgb.b) };
  return `#${[next.r, next.g, next.b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function heroCardSurfaceStyle(theme?: HeroGoalCardTheme | null): CSSProperties | undefined {
  const color = theme?.color;
  if (!color) return undefined;
  const start = mixHexColor(color, 0.12);
  const mid = mixHexColor(color, -0.08);
  const end = mixHexColor(color, -0.42);
  const rgb = parseHexColor(color);
  const glow = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.22)` : "rgba(255, 140, 60, 0.06)";
  return {
    ["--hero-card-gradient-start" as string]: start,
    ["--hero-card-gradient-mid" as string]: mid,
    ["--hero-card-gradient-end" as string]: end,
    ["--hero-card-border-glow" as string]: glow,
  };
}
