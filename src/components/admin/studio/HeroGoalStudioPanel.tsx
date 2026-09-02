import { useEffect, useMemo, useState } from "react";
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
  Save,
  Smartphone,
} from "lucide-react";
import { AdminCard, AdminSection } from "@/components/admin/AdminPage";
import {
  HERO_APP_PREVIEW_HEIGHT,
  HERO_APP_PREVIEW_WIDTH,
  HeroAppFaithfulPreview,
} from "@/components/admin/studio/HeroAppChromePreview";
import type { HeroGender } from "@/lib/platform/hero-goal-images";
import {
  buildHeroGoalCardThemeKey,
  buildHeroGoalFramingKey,
  DEFAULT_HERO_GOAL_CARD_THEME,
  DEFAULT_HERO_GOAL_FRAMING,
  getHeroGoalCardTheme,
  getHeroGoalFraming,
  HERO_CARD_COLOR_PRESETS,
  HERO_FRAMING_LIMITS,
  panHeroGoalFraming,
  panHeroGoalFramingVertical,
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
  savedFraming,
  cardTheme,
  savedCardTheme,
  saveMessage,
  onZoom,
  onPan,
  onPanVertical,
  onFlip,
  onCardColor,
  onReset,
  onSave,
}: {
  gender: HeroGender;
  framing: HeroGoalFraming;
  savedFraming: HeroGoalFraming;
  cardTheme: HeroGoalCardTheme;
  savedCardTheme: HeroGoalCardTheme;
  saveMessage: string | null;
  onZoom: (direction: "in" | "out") => void;
  onPan: (direction: "left" | "right") => void;
  onPanVertical: (direction: "up" | "down") => void;
  onFlip: () => void;
  onCardColor: (color: string | null) => void;
  onReset: () => void;
  onSave: () => void;
}) {
  const colorPresets = useMemo(() => {
    if (gender !== "female") return [...HERO_CARD_COLOR_PRESETS];
    const rose = HERO_CARD_COLOR_PRESETS.find((preset) => preset.id === "rose");
    const others = HERO_CARD_COLOR_PRESETS.filter((preset) => preset.id !== "rose");
    return rose ? [others[0], rose, ...others.slice(1)] : others;
  }, [gender]);

  const isDirty =
    framing.scale !== savedFraming.scale ||
    framing.offsetX !== savedFraming.offsetX ||
    framing.offsetY !== savedFraming.offsetY ||
    framing.flipX !== savedFraming.flipX ||
    cardTheme.color !== savedCardTheme.color;

  return (
    <AdminCard className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-black text-foreground">ضبط موضع الصورة</p>
          <p className="text-xs font-medium text-muted-foreground">
            كبّر / صغّر، حرّك، اعكس الصورة، أو غيّر لون البطاقة — ثم احفظ ليُطبَّق في /app
          </p>
        </div>
        <div className="rounded-full border border-border bg-muted/40 px-3 py-1 text-[10px] font-mono text-muted-foreground">
          scale {framing.scale.toFixed(2)} · x {framing.offsetX}px · y {framing.offsetY}px
          {framing.flipX ? " · معكوس" : ""}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => onZoom("out")}
          disabled={framing.scale <= HERO_FRAMING_LIMITS.scaleMin}
          className="inline-flex h-11 items-center justify-center gap-1 rounded-2xl border border-border bg-card text-xs font-black disabled:opacity-40"
        >
          <Minus className="h-4 w-4" aria-hidden />
          تصغير
        </button>
        <button
          type="button"
          onClick={() => onZoom("in")}
          disabled={framing.scale >= HERO_FRAMING_LIMITS.scaleMax}
          className="inline-flex h-11 items-center justify-center gap-1 rounded-2xl border border-border bg-card text-xs font-black disabled:opacity-40"
        >
          <Plus className="h-4 w-4" aria-hidden />
          تكبير
        </button>
        <button
          type="button"
          onClick={() => onPan("right")}
          disabled={framing.offsetX >= HERO_FRAMING_LIMITS.offsetMax}
          className="inline-flex h-11 items-center justify-center gap-1 rounded-2xl border border-border bg-card text-xs font-black disabled:opacity-40"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
          يمين
        </button>
        <button
          type="button"
          onClick={() => onPan("left")}
          disabled={framing.offsetX <= HERO_FRAMING_LIMITS.offsetMin}
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
          disabled={framing.offsetY <= HERO_FRAMING_LIMITS.offsetMin}
          className="inline-flex h-11 items-center justify-center gap-1 rounded-2xl border border-border bg-card text-xs font-black disabled:opacity-40"
        >
          <ArrowUp className="h-4 w-4" aria-hidden />
          رفع للأعلى
        </button>
        <button
          type="button"
          onClick={() => onPanVertical("down")}
          disabled={framing.offsetY >= HERO_FRAMING_LIMITS.offsetMax}
          className="inline-flex h-11 items-center justify-center gap-1 rounded-2xl border border-border bg-card text-xs font-black disabled:opacity-40"
        >
          <ArrowDown className="h-4 w-4" aria-hidden />
          تنزيل للأسفل
        </button>
        <button
          type="button"
          onClick={onFlip}
          className={cn(
            "inline-flex h-11 items-center justify-center gap-1 rounded-2xl border text-xs font-black",
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
                onClick={() => onCardColor(preset.color)}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-[11px] font-black transition-colors",
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
            onChange={(event) => onCardColor(event.target.value)}
            className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-card p-1"
            aria-label="لون مخصص للبطاقة"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-card px-4 text-xs font-black"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          إعادة ضبط
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!isDirty}
          className={cn(
            "platform-home-hero__cta inline-flex h-11 min-w-[180px] flex-[2] items-center justify-center gap-2 rounded-full px-5 text-sm font-black text-white disabled:opacity-50",
            !isDirty && "opacity-70",
          )}
        >
          <Save className="h-4 w-4" aria-hidden />
          حفظ التعديل
        </button>
      </div>

      {saveMessage ? (
        <p className="text-center text-xs font-bold text-primary">{saveMessage}</p>
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
  const totalAssets = useMemo(() => countHeroReviewAssets(), []);

  const mode: ReviewMode = search.mode === "grid" ? "grid" : "single";
  const gender: HeroGender = search.gender === "female" ? "female" : "male";
  const genderSlots = useMemo(() => goalsForGender(gender), [gender]);
  const goalId = genderSlots.some((slot) => slot.goalId === search.goal)
    ? (search.goal as string)
    : (genderSlots[0]?.goalId ?? "fat");

  const slot = useMemo(() => resolveSlot(gender, goalId), [gender, goalId]);
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
  const [gridAssetIndex, setGridAssetIndex] = useState(0);

  useEffect(() => {
    if (!framingKey) {
      setSavedFraming(DEFAULT_HERO_GOAL_FRAMING);
      setDraftFraming(DEFAULT_HERO_GOAL_FRAMING);
      return;
    }
    const loaded = getHeroGoalFraming(framingKey);
    setSavedFraming(loaded);
    setDraftFraming(loaded);
    setSaveMessage(null);
  }, [framingKey]);

  useEffect(() => {
    const loaded = getHeroGoalCardTheme(cardThemeKey);
    setSavedCardTheme(loaded);
    setDraftCardTheme(loaded);
    setSaveMessage(null);
  }, [cardThemeKey]);

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

  function handleSaveFraming() {
    if (framingKey) {
      const saved = saveHeroGoalFraming(framingKey, draftFraming);
      setSavedFraming(saved);
      setDraftFraming(saved);
    }
    const savedTheme = saveHeroGoalCardTheme(cardThemeKey, draftCardTheme);
    setSavedCardTheme(savedTheme);
    setDraftCardTheme(savedTheme);
    setSaveMessage("تم حفظ التعديل — سيظهر في التطبيق فوراً");
    window.setTimeout(() => setSaveMessage(null), 2800);
  }

  function handleResetFraming() {
    if (framingKey) {
      resetHeroGoalFraming(framingKey);
      setSavedFraming(DEFAULT_HERO_GOAL_FRAMING);
      setDraftFraming(DEFAULT_HERO_GOAL_FRAMING);
    }
    resetHeroGoalCardTheme(cardThemeKey);
    setSavedCardTheme(DEFAULT_HERO_GOAL_CARD_THEME);
    setDraftCardTheme(DEFAULT_HERO_GOAL_CARD_THEME);
    setSaveMessage("تمت إعادة الضبط الافتراضي");
    window.setTimeout(() => setSaveMessage(null), 2200);
  }

  return (
    <div className="space-y-6" dir="rtl">
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
                          "rounded-xl border px-3 py-2 text-[10px] font-mono transition-colors",
                          index === assetIndex
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground",
                        )}
                      >
                        {asset.fileName}
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
                  savedFraming={savedFraming}
                  cardTheme={draftCardTheme}
                  savedCardTheme={savedCardTheme}
                  saveMessage={saveMessage}
                  onZoom={(direction) => setDraftFraming((current) => zoomHeroGoalFraming(current, direction))}
                  onPan={(direction) => setDraftFraming((current) => panHeroGoalFraming(current, direction))}
                  onPanVertical={(direction) =>
                    setDraftFraming((current) => panHeroGoalFramingVertical(current, direction))
                  }
                  onFlip={() => setDraftFraming((current) => toggleHeroGoalFlip(current))}
                  onCardColor={(color) => setDraftCardTheme({ color })}
                  onReset={handleResetFraming}
                  onSave={handleSaveFraming}
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
