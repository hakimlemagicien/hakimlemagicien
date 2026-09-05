import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  FlipHorizontal2,
  Grid3x3,
  Minus,
  Palette,
  Plus,
  RotateCcw,
  Smartphone,
} from "lucide-react";
import { AdminCard, AdminSection } from "@/components/admin/AdminPage";
import {
  adminResetHeroGoalCardTheme,
  adminResetHeroGoalFraming,
  adminSaveHeroGoalCardTheme,
  adminSaveHeroGoalFraming,
} from "@/lib/admin/admin-hero-goal-settings-api";
import { useHeroGoalSettings } from "@/hooks/useHeroGoalSettings";
import {
  formatHeroGoalSettingsError,
  invalidateHeroGoalSettings,
} from "@/lib/platform/hero-goal-settings-api";
import {
  HERO_APP_PREVIEW_HEIGHT,
  HERO_APP_PREVIEW_WIDTH,
  HeroAppFaithfulPreview,
} from "@/components/admin/studio/HeroAppChromePreview";
import type { HeroGender } from "@/lib/platform/hero-goal-images";
import {
  applyHeroGoalCardThemeToManifest,
  applyHeroGoalFramingToManifest,
  buildHeroGoalCardThemeKey,
  buildHeroGoalFramingKey,
  DEFAULT_HERO_GOAL_CARD_THEME,
  DEFAULT_HERO_GOAL_FRAMING,
  getHeroGoalCardTheme,
  getHeroGoalFraming,
  HERO_CARD_COLOR_PRESETS,
  HERO_FRAMING_LIMITS,
  HERO_GOAL_SETTINGS_CHANGED_EVENT,
  panHeroGoalFraming,
  panHeroGoalFramingVertical,
  removeHeroGoalCardThemeFromManifest,
  removeHeroGoalFramingFromManifest,
  resetHeroGoalCardTheme,
  resetHeroGoalFraming,
  saveHeroGoalCardTheme,
  saveHeroGoalFraming,
  toggleHeroGoalFlip,
  zoomHeroGoalFraming,
  type HeroGoalCardTheme,
  type HeroGoalFraming,
} from "@/lib/platform/hero-goal-framing";
import {
  buildHeroReviewState,
  countHeroReviewAssets,
  findHeroReviewSlot,
  listHeroReviewSlots,
  type HeroReviewSlot,
} from "@/lib/platform/hero-review-studio";
import { listHeroGoalAssetEntries } from "@/lib/platform/hero-goals-asset-index";
import { cn } from "@/lib/utils";

type ReviewMode = "single" | "grid";

export type HeroGoalStudioSearch = {
  mode?: ReviewMode;
  gender?: HeroGender;
  goal?: string;
  asset?: number;
};

function goalsForGender(gender: HeroGender): HeroReviewSlot[] {
  return listHeroReviewSlots().filter((slot) => slot.gender === gender);
}

function resolveSlot(gender: HeroGender, goalId: string): HeroReviewSlot {
  const base = findHeroReviewSlot(gender, goalId) ?? goalsForGender(gender)[0]!;
  const assets = listHeroGoalAssetEntries(gender, base.goalId);
  return assets.length > 0 ? { ...base, assets } : base;
}

function HeroFramingPanel({
  gender,
  framing,
  cardTheme,
  statusMessage,
  busy = false,
  onZoom,
  onPan,
  onPanVertical,
  onFlip,
  onCardColor,
  onReset,
}: {
  gender: HeroGender;
  framing: HeroGoalFraming;
  cardTheme: HeroGoalCardTheme;
  statusMessage: string | null;
  busy?: boolean;
  onZoom: (direction: "in" | "out") => void;
  onPan: (direction: "left" | "right") => void;
  onPanVertical: (direction: "up" | "down") => void;
  onFlip: () => void;
  onCardColor: (color: string | null) => void;
  onReset: () => void;
}) {
  const colorPresets = useMemo(() => {
    if (gender !== "female") return [...HERO_CARD_COLOR_PRESETS];
    const rose = HERO_CARD_COLOR_PRESETS.find((preset) => preset.id === "rose");
    const others = HERO_CARD_COLOR_PRESETS.filter((preset) => preset.id !== "rose");
    return rose ? [others[0], rose, ...others.slice(1)] : others;
  }, [gender]);

  return (
    <AdminCard className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-black text-foreground">ضبط موضع الصورة</p>
          <p className="text-xs font-medium text-muted-foreground">
            كبّر / صغّر، حرّك، اعكس الصورة، أو غيّر لون البطاقة — يُطبَّق فوراً بدون حفظ أو نشر
          </p>
        </div>
        <div className="rounded-full border border-border bg-muted/40 px-3 py-1 text-[10px] font-mono text-muted-foreground">
          scale {framing.scale.toFixed(2)} · x {framing.offsetX}px · y {framing.offsetY}px
          {framing.flipX ? " · معكوس" : ""}
          {busy ? " · جاري التحديث…" : ""}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => onZoom("out")}
          disabled={busy || framing.scale <= HERO_FRAMING_LIMITS.scaleMin}
          className="inline-flex h-11 items-center justify-center gap-1 rounded-2xl border border-border bg-card text-xs font-black disabled:opacity-40"
        >
          <Minus className="h-4 w-4" aria-hidden />
          تصغير
        </button>
        <button
          type="button"
          onClick={() => onZoom("in")}
          disabled={busy || framing.scale >= HERO_FRAMING_LIMITS.scaleMax}
          className="inline-flex h-11 items-center justify-center gap-1 rounded-2xl border border-border bg-card text-xs font-black disabled:opacity-40"
        >
          <Plus className="h-4 w-4" aria-hidden />
          تكبير
        </button>
        <button
          type="button"
          onClick={() => onPan("right")}
          disabled={busy || framing.offsetX >= HERO_FRAMING_LIMITS.offsetMax}
          className="inline-flex h-11 items-center justify-center gap-1 rounded-2xl border border-border bg-card text-xs font-black disabled:opacity-40"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
          يمين
        </button>
        <button
          type="button"
          onClick={() => onPan("left")}
          disabled={busy || framing.offsetX <= HERO_FRAMING_LIMITS.offsetMin}
          className="inline-flex h-11 items-center justify-center gap-1 rounded-2xl border border-border bg-card text-xs font-black disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          يسار
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onPanVertical("up")}
          disabled={busy || framing.offsetY <= HERO_FRAMING_LIMITS.offsetMin}
          className="inline-flex h-11 items-center justify-center gap-1 rounded-2xl border border-border bg-card text-xs font-black disabled:opacity-40"
        >
          <ArrowUp className="h-4 w-4" aria-hidden />
          رفع للأعلى
        </button>
        <button
          type="button"
          onClick={() => onPanVertical("down")}
          disabled={busy || framing.offsetY >= HERO_FRAMING_LIMITS.offsetMax}
          className="inline-flex h-11 items-center justify-center gap-1 rounded-2xl border border-border bg-card text-xs font-black disabled:opacity-40"
        >
          <ArrowDown className="h-4 w-4" aria-hidden />
          تنزيل للأسفل
        </button>
        <button
          type="button"
          onClick={onFlip}
          disabled={busy}
          className={cn(
            "inline-flex h-11 items-center justify-center gap-1 rounded-2xl border text-xs font-black disabled:opacity-40",
            framing.flipX
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-foreground",
          )}
        >
          <FlipHorizontal2 className="h-4 w-4" aria-hidden />
          عكس الصورة
        </button>
      </div>

      <div className="space-y-2 rounded-2xl border border-border/70 bg-muted/20 p-3">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" aria-hidden />
          <p className="text-xs font-black text-foreground">لون البطاقة (للهدف كاملاً)</p>
          {gender === "female" ? (
            <p className="text-[10px] font-medium text-muted-foreground">للمعاينة النسائية — جرّب «وردي»</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {colorPresets.map((preset) => {
            const label =
              preset.id === "rose" && gender === "female" ? "وردي · إناث" : preset.labelAr;
            const active =
              preset.color === cardTheme.color || (!preset.color && !cardTheme.color);
            return (
              <button
                key={preset.id}
                type="button"
                disabled={busy}
                onClick={() => onCardColor(preset.color)}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-[11px] font-black transition-colors disabled:opacity-40",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground",
                )}
              >
                <span
                  className="h-4 w-4 rounded-full border border-white/20"
                  style={{
                    background: preset.color
                      ? `linear-gradient(165deg, ${preset.color}, #101012)`
                      : "linear-gradient(165deg, #2a2a2e, #101012)",
                  }}
                  aria-hidden
                />
                {label}
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-muted-foreground">لون مخصص</span>
          <input
            type="color"
            value={cardTheme.color ?? "#2a2a2e"}
            disabled={busy}
            onChange={(event) => onCardColor(event.target.value)}
            className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-card p-1 disabled:opacity-40"
            aria-label="لون مخصص للبطاقة"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onReset}
          disabled={busy}
          className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-card px-4 text-xs font-black disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          إعادة ضبط
        </button>
      </div>

      {statusMessage ? (
        <p
          className={cn(
            "text-center text-xs font-bold",
            statusMessage.startsWith("تم") ? "text-primary" : "text-destructive",
          )}
        >
          {statusMessage}
        </p>
      ) : null}
    </AdminCard>
  );
}

function HeroGridTile({
  slot,
  assetIndex,
  onSelect,
}: {
  slot: HeroReviewSlot;
  assetIndex: number;
  onSelect: () => void;
}) {
  const hero = useMemo(
    () =>
      buildHeroReviewState({
        slot,
        assetIndex,
        cardTheme: getHeroGoalCardTheme(buildHeroGoalCardThemeKey(slot.gender, slot.goalId)),
      }),
    [slot, assetIndex],
  );
  const fileName = slot.assets[assetIndex]?.fileName ?? "—";

  return (
    <button
      type="button"
      onClick={onSelect}
      className="cc-card overflow-hidden p-0 text-right transition-opacity hover:opacity-95"
    >
      <div className="border-b border-border/60 px-3 py-2">
        <p className="text-[11px] font-black text-foreground">{slot.labelAr}</p>
        <p className="text-[10px] font-medium text-muted-foreground">
          {slot.gender === "male" ? "ذكر" : "أنثى"} · {slot.assets.length} صور
        </p>
      </div>
      <div className="hero-review-grid-frame">
        <div className="hero-review-grid-scale">
          <HeroAppFaithfulPreview hero={hero} variant="hero-only" />
        </div>
      </div>
      <div className="truncate border-t border-border/60 px-3 py-2 text-[10px] font-mono text-muted-foreground">
        {fileName}
      </div>
    </button>
  );
}

export function HeroGoalStudioPanel({ search }: { search: HeroGoalStudioSearch }) {
  const navigate = useNavigate({ from: "/admin/studio" });
  const queryClient = useQueryClient();
  const settingsQuery = useHeroGoalSettings();
  const totalAssets = useMemo(() => countHeroReviewAssets(), [settingsQuery.dataUpdatedAt]);
  const draftDirtyRef = useRef(false);
  const prevFramingKeyRef = useRef<string | null>(null);
  const prevCardThemeKeyRef = useRef<string | null>(null);

  const markDraftDirty = useCallback(() => {
    draftDirtyRef.current = true;
  }, []);

  const mode: ReviewMode = search.mode === "grid" ? "grid" : "single";
  const gender: HeroGender = search.gender === "female" ? "female" : "male";
  const genderSlots = useMemo(() => goalsForGender(gender), [gender, settingsQuery.dataUpdatedAt]);
  const goalId = genderSlots.some((slot) => slot.goalId === search.goal)
    ? (search.goal as string)
    : (genderSlots[0]?.goalId ?? "fat");

  const slot = useMemo(
    () => resolveSlot(gender, goalId),
    [gender, goalId, settingsQuery.dataUpdatedAt],
  );
  const assetCount = slot.assets.length;
  const assetIndex =
    assetCount > 0
      ? Math.min(Math.max(0, Number(search.asset) || 0), assetCount - 1)
      : 0;

  const currentAsset = slot.assets[assetIndex] ?? null;
  const framingKey = currentAsset
    ? buildHeroGoalFramingKey(gender, goalId, `/${currentAsset.fileName}`)
    : null;
  const cardThemeKey = buildHeroGoalCardThemeKey(gender, goalId);

  const [savedFraming, setSavedFraming] = useState<HeroGoalFraming>(DEFAULT_HERO_GOAL_FRAMING);
  const [draftFraming, setDraftFraming] = useState<HeroGoalFraming>(DEFAULT_HERO_GOAL_FRAMING);
  const [savedCardTheme, setSavedCardTheme] = useState<HeroGoalCardTheme>(DEFAULT_HERO_GOAL_CARD_THEME);
  const [draftCardTheme, setDraftCardTheme] = useState<HeroGoalCardTheme>(DEFAULT_HERO_GOAL_CARD_THEME);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [gridAssetIndex, setGridAssetIndex] = useState(0);

  const syncFramingFromStore = useCallback(
    (force = false) => {
      if (!framingKey) {
        setSavedFraming(DEFAULT_HERO_GOAL_FRAMING);
        if (force || !draftDirtyRef.current) setDraftFraming(DEFAULT_HERO_GOAL_FRAMING);
        return;
      }
      const loaded = getHeroGoalFraming(framingKey);
      setSavedFraming(loaded);
      if (force || !draftDirtyRef.current) setDraftFraming(loaded);
    },
    [framingKey],
  );

  const syncCardThemeFromStore = useCallback(
    (force = false) => {
      const loaded = getHeroGoalCardTheme(cardThemeKey);
      setSavedCardTheme(loaded);
      if (force || !draftDirtyRef.current) setDraftCardTheme(loaded);
    },
    [cardThemeKey],
  );

  useEffect(() => {
    const framingKeyChanged = prevFramingKeyRef.current !== framingKey;
    prevFramingKeyRef.current = framingKey;
    if (framingKeyChanged) {
      draftDirtyRef.current = false;
      setSaveMessage(null);
    }
    syncFramingFromStore(framingKeyChanged);
  }, [framingKey, settingsQuery.dataUpdatedAt, syncFramingFromStore]);

  useEffect(() => {
    const cardThemeKeyChanged = prevCardThemeKeyRef.current !== cardThemeKey;
    prevCardThemeKeyRef.current = cardThemeKey;
    if (cardThemeKeyChanged) {
      draftDirtyRef.current = false;
      setSaveMessage(null);
    }
    syncCardThemeFromStore(cardThemeKeyChanged);
  }, [cardThemeKey, settingsQuery.dataUpdatedAt, syncCardThemeFromStore]);

  useEffect(() => {
    function syncFromServer() {
      syncFramingFromStore(false);
      syncCardThemeFromStore(false);
    }
    window.addEventListener(HERO_GOAL_SETTINGS_CHANGED_EVENT, syncFromServer);
    return () => window.removeEventListener(HERO_GOAL_SETTINGS_CHANGED_EVENT, syncFromServer);
  }, [syncFramingFromStore, syncCardThemeFromStore]);

  const hero = useMemo(
    () =>
      buildHeroReviewState({
        slot,
        assetIndex,
        framing: draftFraming,
        cardTheme: draftCardTheme,
      }),
    [slot, assetIndex, draftFraming, draftCardTheme],
  );

  function patchSearch(patch: Partial<HeroGoalStudioSearch>) {
    void navigate({
      search: (prev) => ({
        ...prev,
        tab: "hero",
        mode: prev.mode ?? mode,
        gender: prev.gender ?? gender,
        goal: prev.goal ?? goalId,
        asset: prev.asset ?? assetIndex,
        ...patch,
      }),
      replace: true,
    });
  }

  function goAsset(next: number) {
    if (assetCount <= 0) return;
    const index = (next + assetCount) % assetCount;
    patchSearch({ asset: index });
  }

  async function persistFramingLive(
    nextFraming: HeroGoalFraming,
    nextTheme: HeroGoalCardTheme,
  ) {
    if (saving) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      if (framingKey && currentAsset) {
        await adminSaveHeroGoalFraming({
          gender,
          goalId,
          assetFileName: currentAsset.fileName,
          framing: nextFraming,
        });
        const saved = applyHeroGoalFramingToManifest(framingKey, nextFraming);
        if (import.meta.env.DEV) saveHeroGoalFraming(framingKey, saved);
        setSavedFraming(saved);
        setDraftFraming(saved);
      }

      await adminSaveHeroGoalCardTheme({
        gender,
        goalId,
        theme: nextTheme,
      });
      const savedTheme = applyHeroGoalCardThemeToManifest(cardThemeKey, nextTheme);
      if (import.meta.env.DEV) saveHeroGoalCardTheme(cardThemeKey, savedTheme);
      setSavedCardTheme(savedTheme);
      setDraftCardTheme(savedTheme);
      draftDirtyRef.current = false;
      window.dispatchEvent(new Event(HERO_GOAL_SETTINGS_CHANGED_EVENT));
      await invalidateHeroGoalSettings(queryClient);
      setSaveMessage("تم التحديث مباشرة في التطبيق");
      window.setTimeout(() => setSaveMessage(null), 2500);
    } catch (error) {
      setSaveMessage(formatHeroGoalSettingsError(error));
      window.setTimeout(() => setSaveMessage(null), 8000);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!draftDirtyRef.current || !currentAsset) return;
    const timer = window.setTimeout(() => {
      void persistFramingLive(draftFraming, draftCardTheme);
    }, 450);
    return () => window.clearTimeout(timer);
    // Persist only when drafts change after a user edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftFraming, draftCardTheme]);

  async function handleResetFraming() {
    if (saving) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      if (framingKey && currentAsset) {
        await adminResetHeroGoalFraming({
          gender,
          goalId,
          assetFileName: currentAsset.fileName,
        });
        removeHeroGoalFramingFromManifest(framingKey);
        if (import.meta.env.DEV) resetHeroGoalFraming(framingKey);
      }

      await adminResetHeroGoalCardTheme({ gender, goalId });
      removeHeroGoalCardThemeFromManifest(cardThemeKey);
      if (import.meta.env.DEV) resetHeroGoalCardTheme(cardThemeKey);

      setSavedFraming(DEFAULT_HERO_GOAL_FRAMING);
      setDraftFraming(DEFAULT_HERO_GOAL_FRAMING);
      setSavedCardTheme(DEFAULT_HERO_GOAL_CARD_THEME);
      setDraftCardTheme(DEFAULT_HERO_GOAL_CARD_THEME);
      draftDirtyRef.current = false;
      window.dispatchEvent(new Event(HERO_GOAL_SETTINGS_CHANGED_EVENT));
      await invalidateHeroGoalSettings(queryClient);
      setSaveMessage("تمت إعادة الضبط الافتراضي");
      window.setTimeout(() => setSaveMessage(null), 3200);
    } catch (error) {
      setSaveMessage(formatHeroGoalSettingsError(error));
      window.setTimeout(() => setSaveMessage(null), 8000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {settingsQuery.isError ? (
        <AdminCard className="space-y-3 border-destructive/40 bg-destructive/5 p-4">
          <p className="text-sm font-black text-destructive">تعذر تحميل إعدادات الهيرو من السيرفر</p>
          <p className="text-xs font-medium text-muted-foreground">
            {formatHeroGoalSettingsError(settingsQuery.error)}
          </p>
          <button
            type="button"
            onClick={() => void settingsQuery.refetch()}
            className="inline-flex h-9 items-center rounded-full border border-border bg-card px-4 text-xs font-black"
          >
            إعادة المحاولة
          </button>
        </AdminCard>
      ) : settingsQuery.isLoading ? (
        <p className="text-center text-xs font-medium text-muted-foreground">جاري تحميل الإعدادات المحفوظة…</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => patchSearch({ mode: "single" })}
          className={cn(
            "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-xs font-black",
            mode === "single"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-foreground",
          )}
        >
          <Smartphone className="h-3.5 w-3.5" aria-hidden />
          بطاقة واحدة
        </button>
        <button
          type="button"
          onClick={() => patchSearch({ mode: "grid" })}
          className={cn(
            "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-xs font-black",
            mode === "grid"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-foreground",
          )}
        >
          <Grid3x3 className="h-3.5 w-3.5" aria-hidden />
          شبكة الأهداف
        </button>
        <span className="text-xs font-medium text-muted-foreground">
          {genderSlots.length} أهداف · {totalAssets} صورة
        </span>
      </div>

      {mode === "single" ? (
        <div className="hero-review-studio__layout hero-review-studio__layout--single">
          <div className="hero-review-studio__controls">
            <AdminSection title="التحكم">
              <AdminCard className="space-y-4 p-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="block">
                    <span className="mb-1 block text-xs font-black">الجنس</span>
                    <select
                      value={gender}
                      onChange={(e) => {
                        const nextGender = e.target.value === "female" ? "female" : "male";
                        const firstGoal = goalsForGender(nextGender)[0]?.goalId ?? "fat";
                        patchSearch({ gender: nextGender, goal: firstGoal, asset: 0 });
                      }}
                      className="cc-input w-full"
                    >
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-1 block text-xs font-black">الهدف</span>
                    <select
                      value={goalId}
                      onChange={(e) => patchSearch({ goal: e.target.value, asset: 0 })}
                      className="cc-input w-full"
                    >
                      {genderSlots.map((entry) => (
                        <option key={entry.goalId} value={entry.goalId}>
                          {entry.labelAr} ({entry.assets.length} صور)
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {assetCount > 0 ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/30 px-3 py-3">
                    <button
                      type="button"
                      onClick={() => goAsset(assetIndex - 1)}
                      className="inline-flex h-9 items-center gap-1 rounded-full border border-border bg-card px-3 text-xs font-black"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden />
                      السابقة
                    </button>
                    <div className="min-w-0 text-center">
                      <p className="text-xs font-black text-foreground">
                        صورة {assetIndex + 1} / {assetCount}
                      </p>
                      <p className="truncate font-mono text-[10px] text-muted-foreground">
                        {currentAsset?.fileName ?? "—"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => goAsset(assetIndex + 1)}
                      className="inline-flex h-9 items-center gap-1 rounded-full border border-border bg-card px-3 text-xs font-black"
                    >
                      التالية
                      <ChevronLeft className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-destructive">لا توجد صور لهذا الهدف.</p>
                )}

                {assetCount > 1 ? (
                  <div className="flex flex-wrap gap-2">
                    {slot.assets.map((asset, index) => (
                      <button
                        key={asset.repoPath}
                        type="button"
                        onClick={() => patchSearch({ asset: index })}
                        className={cn(
                          "overflow-hidden rounded-xl border transition-colors",
                          index === assetIndex
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border bg-card",
                        )}
                      >
                        <img src={asset.url} alt="" className="h-16 w-12 object-cover" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </AdminCard>
            </AdminSection>

            {assetCount > 0 ? (
              <AdminSection title="ضبط الصورة">
                <HeroFramingPanel
                  gender={gender}
                  framing={draftFraming}
                  cardTheme={draftCardTheme}
                  statusMessage={saveMessage}
                  busy={saving}
                  onZoom={(direction) => {
                    markDraftDirty();
                    setDraftFraming((current) => zoomHeroGoalFraming(current, direction));
                  }}
                  onPan={(direction) => {
                    markDraftDirty();
                    setDraftFraming((current) => panHeroGoalFraming(current, direction));
                  }}
                  onPanVertical={(direction) => {
                    markDraftDirty();
                    setDraftFraming((current) => panHeroGoalFramingVertical(current, direction));
                  }}
                  onFlip={() => {
                    markDraftDirty();
                    setDraftFraming((current) => toggleHeroGoalFlip(current));
                  }}
                  onCardColor={(color) => {
                    markDraftDirty();
                    setDraftCardTheme({ color });
                  }}
                  onReset={handleResetFraming}
                />
              </AdminSection>
            ) : null}
          </div>

          <div className="hero-review-studio__preview">
            <AdminSection title="المعاينة — مطابقة /app">
              <div className="flex flex-col items-center gap-2">
                <p className="text-center text-xs font-medium text-muted-foreground">
                  عرض {HERO_APP_PREVIEW_WIDTH}px · هامش 16px · ارتفاع البطاقة 50% من{" "}
                  {HERO_APP_PREVIEW_HEIGHT}px
                </p>
                <HeroAppFaithfulPreview hero={hero} />
              </div>
            </AdminSection>
          </div>
        </div>
      ) : (
        <>
          <AdminSection title="فلترة الشبكة">
            <AdminCard className="flex flex-wrap items-end gap-3 p-4">
              <label className="block min-w-[140px]">
                <span className="mb-1 block text-xs font-black">الجنس</span>
                <select
                  value={gender}
                  onChange={(e) => {
                    const nextGender = e.target.value === "female" ? "female" : "male";
                    setGridAssetIndex(0);
                    patchSearch({ gender: nextGender });
                  }}
                  className="cc-input w-full"
                >
                  <option value="male">ذكر (6)</option>
                  <option value="female">أنثى (6)</option>
                </select>
              </label>
              <label className="block min-w-[180px]">
                <span className="mb-1 block text-xs font-black">رقم الصورة لكل هدف</span>
                <select
                  value={gridAssetIndex}
                  onChange={(e) => setGridAssetIndex(Number(e.target.value))}
                  className="cc-input w-full"
                >
                  {[0, 1, 2].map((index) => (
                    <option key={index} value={index}>
                      صورة {index + 1}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-xs font-medium text-muted-foreground">
                اضغط أي بطاقة للانتقال إلى المعاينة المفردة.
              </p>
            </AdminCard>
          </AdminSection>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {goalsForGender(gender).map((entry) => {
              const resolved = resolveSlot(entry.gender, entry.goalId);
              const safeIndex = Math.min(gridAssetIndex, Math.max(resolved.assets.length - 1, 0));
              return (
                <HeroGridTile
                  key={`${entry.gender}:${entry.goalId}`}
                  slot={resolved}
                  assetIndex={safeIndex}
                  onSelect={() =>
                    patchSearch({
                      mode: "single",
                      gender: entry.gender,
                      goal: entry.goalId,
                      asset: safeIndex,
                    })
                  }
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
