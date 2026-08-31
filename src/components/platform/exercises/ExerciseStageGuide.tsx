import { useState, type ComponentType } from "react";
import { Check, Dumbbell, Images, MoveVertical, Target, Wind, X } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { PlatformSection } from "@/components/platform/layout/PlatformLayout";
import {
  EXERCISE_STAGE_IMAGE_SIZE,
  type ExerciseStageCueKind,
  type ExerciseStageGuide as ExerciseStageGuideData,
  type ExerciseStageKey,
} from "@/lib/platform/exercise-stage-media";
import { cn } from "@/lib/utils";

const imageFallback = (
  <span className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
    <Dumbbell className="h-5 w-5" />
  </span>
);

const CUE_ICONS: Record<ExerciseStageCueKind, ComponentType<{ className?: string }>> = {
  breath: Wind,
  aim: Target,
  joint: MoveVertical,
};

type GuideTab = "method" | "mistakes" | "muscles";

const TABS: { id: GuideTab; label: string }[] = [
  { id: "method", label: "الطريقة" },
  { id: "mistakes", label: "الأخطاء" },
  { id: "muscles", label: "العضلات" },
];

export function ExerciseStageGuide({
  guide,
  muscles,
}: {
  guide: ExerciseStageGuideData;
  variant?: "library" | "session";
  muscles?: { primary: string; secondary: string[] };
}) {
  const [stageKey, setStageKey] = useState<ExerciseStageKey>("b");
  const [tab, setTab] = useState<GuideTab>("method");
  const stage = guide.stages.find((item) => item.key === stageKey) ?? guide.stages[1] ?? guide.stages[0];
  const correctStage = guide.stages.find((item) => item.key === "b") ?? guide.stages[0];
  const incorrect = guide.mistakes[0];

  return (
    <PlatformSection title="شرح الحركة" icon={Images}>
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="مراحل التمرين">
        {guide.stages.map((item) => {
          const selected = item.key === stage.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={selected}
              id={`exercise-stage-${item.key}`}
              onClick={() => setStageKey(item.key)}
              className={cn(
                "overflow-hidden rounded-xl border bg-card text-start transition",
                selected ? "border-primary shadow-[0_0_0_1px_var(--primary)]" : "border-border",
              )}
            >
              <span className="relative block aspect-[4/3] w-full bg-muted">
                <OptimizedImage
                  src={item.thumbSrc}
                  alt=""
                  width={EXERCISE_STAGE_IMAGE_SIZE.thumb.width}
                  height={EXERCISE_STAGE_IMAGE_SIZE.thumb.height}
                  sizes="30vw"
                  objectFit="cover"
                  className="h-full w-full"
                  fallback={imageFallback}
                />
                <span
                  className={cn(
                    "absolute start-1.5 top-1.5 grid h-5 min-w-5 place-items-center rounded-md px-1 text-[10px] font-black",
                    selected ? "bg-primary text-primary-foreground" : "bg-primary text-primary-foreground",
                  )}
                >
                  {item.key.toUpperCase()}
                </span>
              </span>
              <span
                className={cn(
                  "block px-1 py-1.5 text-center text-[11px] font-black leading-none",
                  selected ? "bg-primary text-primary-foreground" : "bg-card text-foreground",
                )}
              >
                {item.shortTitleAr}
              </span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        aria-labelledby={`exercise-stage-${stage.key}`}
        className="overflow-hidden rounded-2xl border border-border bg-card"
      >
        <p className="px-3 pt-3 text-sm font-black text-primary">
          المرحلة {stage.key.toUpperCase()} — {stage.shortTitleAr}
        </p>
        <ul>
          {stage.cues.map((cue, index) => {
            const Icon = CUE_ICONS[cue.kind];
            return (
              <li
                key={`${stage.key}-${cue.kind}-${index}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5",
                  index < stage.cues.length - 1 && "border-b border-border/70",
                )}
              >
                <Icon className="h-4 w-4 shrink-0 text-foreground" aria-hidden />
                <span className="text-[13px] font-bold leading-6 text-foreground">{cue.textAr}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex border-b border-border" role="tablist" aria-label="تفاصيل الشرح">
        {TABS.map((item) => {
          const selected = item.id === tab;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(item.id)}
              className={cn(
                "min-h-11 flex-1 text-[13px] font-black transition",
                selected ? "border-b-2 border-primary text-primary" : "text-muted-foreground",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "method" ? (
        <div className="space-y-2">
          <p className="text-sm font-black text-foreground">تجنّب هذه الأخطاء</p>
          <div className="grid grid-cols-2 gap-2">
            <CompareCard
              src={correctStage.src}
              alt={correctStage.alt}
              ok
              label={guide.compare.correctLabelAr}
            />
            <CompareCard
              src={incorrect.src}
              alt={incorrect.alt}
              ok={false}
              label={guide.compare.incorrectLabelAr}
            />
          </div>
        </div>
      ) : null}

      {tab === "mistakes" ? (
        <div className="grid grid-cols-2 gap-2">
          {guide.mistakes.map((mistake) => (
            <CompareCard
              key={mistake.key}
              src={mistake.src}
              alt={mistake.alt}
              ok={false}
              label={`خطأ — ${mistake.descriptionAr.replace(/[.]/g, "")}`}
            />
          ))}
        </div>
      ) : null}

      {tab === "muscles" ? (
        <div className="flex flex-wrap gap-2">
          {muscles?.primary ? (
            <span className="rounded-full bg-primary-soft px-3 py-1.5 text-xs font-black text-primary">
              {muscles.primary}
            </span>
          ) : null}
          {(muscles?.secondary ?? []).map((muscle) => (
            <span
              key={muscle}
              className="rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-foreground"
            >
              {muscle}
            </span>
          ))}
          {!muscles?.primary && (muscles?.secondary.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">المجموعة العضلية تظهر مع تفاصيل التمرين.</p>
          ) : null}
        </div>
      ) : null}
    </PlatformSection>
  );
}

function CompareCard({
  src,
  alt,
  ok,
  label,
}: {
  src: string;
  alt: string;
  ok: boolean;
  label: string;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-[4/3] bg-muted">
        <OptimizedImage
          src={src}
          alt={alt}
          width={EXERCISE_STAGE_IMAGE_SIZE.detail.width}
          height={EXERCISE_STAGE_IMAGE_SIZE.detail.height}
          sizes="45vw"
          objectFit="cover"
          className="h-full w-full"
          fallback={imageFallback}
        />
        <span
          className={cn(
            "absolute end-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full text-white",
            ok ? "bg-success" : "bg-danger",
          )}
        >
          {ok ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <X className="h-3.5 w-3.5" strokeWidth={3} />}
        </span>
      </div>
      <p
        className={cn(
          "px-2 py-2 text-center text-[11px] font-black leading-4",
          ok ? "bg-success-soft text-success" : "bg-red-50 text-danger",
        )}
      >
        {label}
      </p>
    </article>
  );
}
