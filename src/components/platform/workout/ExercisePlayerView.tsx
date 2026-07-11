import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronRight,
  Circle,
  Clock3,
  Dumbbell,
  ListOrdered,
  Play,
  Target,
  X,
} from "lucide-react";
import type { WorkoutPlayerState } from "@/hooks/useWorkoutPlayer";
import { cn } from "@/lib/utils";
import { SetLogBottomSheet } from "./SetLogBottomSheet";
import { RestOverlay } from "./RestOverlay";
import { WorkoutCompleteScreen } from "./WorkoutCompleteScreen";

type ExercisePlayerViewProps = {
  player: WorkoutPlayerState;
};

function MetricPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/55 bg-card px-2 py-1.5 text-center">
      <Icon className="mx-auto h-3.5 w-3.5 text-primary" strokeWidth={2.2} />
      <p className="mt-0.5 text-[10px] font-black text-foreground">{value}</p>
      <p className="text-[8px] text-muted-foreground">{label}</p>
    </div>
  );
}

export function ExercisePlayerView({ player }: ExercisePlayerViewProps) {
  const {
    meta,
    exercises,
    exerciseIndex,
    currentExercise,
    progress,
    phase,
    sessionProgressPct,
    videoOpen,
    setVideoOpen,
    showDetails,
    setShowDetails,
    heroKey,
    primaryActionLabel,
    handlePrimaryAction,
    jumpToExercise,
  } = player;

  const isBlocked = phase === "rest" || phase === "complete" || phase === "set-sheet";

  return (
    <>
      <div className="relative pb-36" dir="rtl">
        <header className="space-y-2 px-1 pt-1">
          <div className="flex items-center justify-between gap-2">
            <Link
              to="/app/program/workout"
              data-preview-safe
              aria-label="رجوع"
              className="grid h-9 w-9 place-items-center rounded-2xl border border-border/70 bg-card text-foreground shadow-sm transition-transform duration-[120ms] active:scale-95"
            >
              <ChevronRight className="h-5 w-5" />
            </Link>
            <div className="min-w-0 flex-1 text-center">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={`title-${heroKey}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="truncate text-sm font-black text-foreground"
                >
                  {currentExercise.name}
                </motion.h1>
              </AnimatePresence>
              <p className="text-[10px] font-bold text-muted-foreground">
                تمرين {exerciseIndex + 1} من {meta.totalExercises}
              </p>
            </div>
            <div className="h-9 w-9" />
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={false}
              animate={{ width: `${sessionProgressPct}%` }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </header>

        <div className="pt-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={`hero-${heroKey}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <button
                type="button"
                onClick={() => setVideoOpen(true)}
                className="relative flex h-[min(380px,45dvh)] w-full items-center justify-center overflow-hidden rounded-[24px] border border-border/60 bg-muted shadow-[0_12px_30px_-16px_rgba(15,23,42,0.25)]"
              >
                <img
                  src={currentExercise.thumbnail}
                  alt={currentExercise.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute inset-0 bg-black/20" />
                <span className="relative grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_rgba(249,115,22,0.65)] transition-transform duration-[120ms] active:scale-95">
                  <Play className="h-6 w-6 fill-current" />
                </span>
                <span className="absolute bottom-3 start-3 rounded-lg bg-black/55 px-2 py-1 text-[10px] font-bold text-white">
                  شاهد الأداء الصحيح
                </span>
              </button>

              <div className="mt-3 grid grid-cols-4 gap-1.5">
                <MetricPill icon={Target} label="العضلة" value={currentExercise.muscle} />
                <MetricPill icon={Dumbbell} label="مجموعات" value={String(currentExercise.sets)} />
                <MetricPill icon={ListOrdered} label="تكرار" value={currentExercise.reps} />
                <MetricPill icon={Clock3} label="راحة" value={currentExercise.restLabel} />
              </div>

              <p className="mt-2 text-center text-[10px] font-bold text-muted-foreground">
                الوزن المقترح: {currentExercise.suggestedWeightKg} كجم
              </p>

              <div className="mt-3 rounded-2xl border border-border/60 bg-card p-3">
                <p className="line-clamp-3 text-[11px] leading-relaxed text-foreground">
                  {currentExercise.summary}
                </p>
                <button
                  type="button"
                  onClick={() => setShowDetails((value) => !value)}
                  className="mt-2 text-[10px] font-bold text-primary"
                >
                  {showDetails ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                </button>
                {showDetails ? (
                  <ol className="mt-2 space-y-1.5 border-t border-border/50 pt-2">
                    {currentExercise.detailSteps.map((step, index) => (
                      <li key={step} className="flex gap-2 text-[10px] leading-relaxed text-muted-foreground">
                        <span className="font-black text-primary">{index + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                ) : null}
              </div>
            </motion.div>
          </AnimatePresence>

          <section className="mt-4">
            <h2 className="mb-2 text-[10px] font-black text-foreground">تمارين الحصة</h2>
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
              {exercises.map((exercise, index) => {
                const item = progress[index];
                const isCurrent = index === exerciseIndex;
                const isDone = item.status === "done";

                return (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => jumpToExercise(index)}
                    className={cn(
                      "flex w-full items-center gap-2 border-b border-border/50 px-3 py-2.5 text-right transition-colors duration-150 last:border-b-0 active:bg-muted/30",
                      isCurrent && "bg-primary/5",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-black",
                        isDone
                          ? "bg-[#22C55E] text-white"
                          : isCurrent
                            ? "border border-primary text-primary"
                            : "border border-border text-muted-foreground",
                      )}
                    >
                      {index + 1}
                    </span>
                    <div className="h-9 w-12 shrink-0 overflow-hidden rounded-lg border border-border/50">
                      <img
                        src={exercise.thumbnail}
                        alt={exercise.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate text-[11px] font-black",
                          isCurrent ? "text-primary" : "text-foreground",
                        )}
                      >
                        {exercise.name}
                      </p>
                      <p className="text-[8px] text-muted-foreground">
                        {item.completedSets}/{exercise.sets} مجموعات
                      </p>
                    </div>
                    {isDone ? (
                      <Check className="h-4 w-4 shrink-0 text-[#22C55E]" strokeWidth={3} />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-border" strokeWidth={1.6} />
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--platform-nav-h,64px)+env(safe-area-inset-bottom))] z-40 mx-auto max-w-[var(--platform-frame-w)] px-[var(--platform-gutter)] pb-2">
        <button
          type="button"
          disabled={isBlocked}
          onClick={handlePrimaryAction}
          className="pointer-events-auto flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-[0_12px_28px_-10px_rgba(249,115,22,0.55)] transition-transform duration-[120ms] active:scale-[0.97] disabled:opacity-50"
        >
          {primaryActionLabel}
        </button>
      </div>

      {typeof document !== "undefined"
        ? createPortal(
            <>
              <AnimatePresence>
                {videoOpen ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black"
                  >
                    <button
                      type="button"
                      aria-label="إغلاق الفيديو"
                      onClick={() => setVideoOpen(false)}
                      className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] z-10 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <div className="flex h-full items-center justify-center">
                      <img
                        src={currentExercise.thumbnail}
                        alt={currentExercise.name}
                        className="max-h-full w-full object-contain"
                      />
                      <p className="absolute bottom-8 text-sm font-bold text-white/80">
                        معاينة الفيديو — سيتم ربطه لاحقاً
                      </p>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <SetLogBottomSheet player={player} />
              <RestOverlay player={player} />
              <WorkoutCompleteScreen player={player} />
            </>,
            document.body,
          )
        : null}
    </>
  );
}
