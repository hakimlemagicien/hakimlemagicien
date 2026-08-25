import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronRight,
  Circle,
  Layers,
  LoaderCircle,
  Play,
  RefreshCcw,
  Timer,
  Weight,
} from "lucide-react";
import type { WorkoutPlayerState } from "@/hooks/useWorkoutPlayer";
import { ExerciseMedia } from "@/components/platform/exercises/ExerciseMedia";
import { ExerciseStageGuide } from "@/components/platform/exercises/ExerciseStageGuide";
import { ExerciseThumbnail } from "@/components/platform/exercises/ExerciseThumbnail";
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  getExerciseStageCover,
  getExerciseStageGuide,
  getExerciseStageListThumb,
} from "@/lib/platform/exercise-stage-media";
import { formatExerciseVolume, formatWeightKg } from "@/lib/platform/workout-session";
import { cn } from "@/lib/utils";
import { SetLogBottomSheet } from "./SetLogBottomSheet";
import { WorkoutCompleteScreen } from "./WorkoutCompleteScreen";

type ExercisePlayerViewProps = {
  player: WorkoutPlayerState;
};

function formatWeightLabel(kg: number) {
  const value = formatWeightKg(kg);
  return value === "—" ? "—" : `${value} كغ`;
}

function formatRestSeconds(seconds: number) {
  if (seconds <= 0) return "—";
  return `${seconds} ثانية`;
}

function ExerciseRxStrip({
  sets,
  reps,
  weightLabel,
  restLabel,
}: {
  sets: number;
  reps: string;
  weightLabel: string;
  restLabel: string;
}) {
  const stats = [
    { icon: Layers, label: "المجموعات", value: String(sets) },
    { icon: RefreshCcw, label: "التكرارات", value: reps },
    { icon: Weight, label: "الوزن", value: weightLabel },
    { icon: Timer, label: "الراحة", value: restLabel },
  ] as const;

  return (
    <div className="rounded-[20px] bg-muted/90 px-2 py-3.5">
      <div className="grid grid-cols-4 gap-1.5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="flex min-w-0 flex-col items-center text-center">
              <Icon className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.85} />
              <p className="mt-1.5 text-[11px] font-medium leading-none text-foreground/70">
                {stat.label}
              </p>
              <p className="mt-1.5 max-w-full truncate text-[14px] font-black leading-none tracking-tight text-foreground">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type PlayerExercise = NonNullable<WorkoutPlayerState["currentExercise"]>;

function ExercisePlayerStage({
  sessionActive,
  currentExercise,
  exerciseIndex,
  totalExercises,
  currentSetNumber,
  sessionProgressPct,
  heroKey,
  videoAutoPlay,
  onStart,
}: {
  sessionActive: boolean;
  currentExercise: PlayerExercise;
  exerciseIndex: number;
  totalExercises: number;
  currentSetNumber: number;
  sessionProgressPct: number;
  heroKey: string;
  videoAutoPlay: boolean;
  onStart: () => void;
}) {
  const stillPoster = getExerciseStageCover(currentExercise.external_id);
  return (
    <div className="bg-background pb-2">
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
              تمرين {exerciseIndex + 1} من {totalExercises} · الجولة {currentSetNumber} من {currentExercise.sets}
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
            <div
              className={cn(
                "relative aspect-square w-full overflow-hidden rounded-[24px] border border-border/60 bg-muted shadow-[0_12px_30px_-16px_rgba(15,23,42,0.25)]",
              )}
            >
              {sessionActive ? (
                <ExerciseMedia
                  status={currentExercise.videoStatus}
                  path={currentExercise.videoPath}
                  kind="exercise"
                  title={currentExercise.name}
                  label="فيديو التمرين"
                  autoPlay={videoAutoPlay}
                  loop
                  aspect="square"
                  showCaption={false}
                  className="absolute inset-0 h-full w-full rounded-[24px] border-0 shadow-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={onStart}
                  className="relative flex aspect-square w-full items-center justify-center"
                >
                  {stillPoster ? (
                    <OptimizedImage
                      src={stillPoster.src}
                      alt={stillPoster.alt}
                      width={960}
                      height={720}
                      sizes="(max-width: 430px) 100vw, 390px"
                      objectFit="cover"
                      className="absolute inset-0 h-full w-full"
                      fallback={
                        <ExerciseThumbnail
                          signedUrl={currentExercise.thumbnailUrl}
                          status={currentExercise.videoStatus}
                          mediaPath={currentExercise.videoPath}
                          alt={currentExercise.name}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      }
                    />
                  ) : (
                    <ExerciseThumbnail
                      signedUrl={currentExercise.thumbnailUrl}
                      status={currentExercise.videoStatus}
                      mediaPath={currentExercise.videoPath}
                      alt={currentExercise.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  <span className="relative grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_rgba(249,115,22,0.65)] transition-transform duration-[120ms] active:scale-95">
                    <Play className="h-6 w-6 fill-current" />
                  </span>
                  <span className="absolute bottom-3 start-3 rounded-lg bg-card/95 px-2 py-1 text-[10px] font-bold text-foreground shadow-sm">
                    شاهد الأداء الصحيح
                  </span>
                </button>
              )}
              <span aria-hidden className="workout-video-electric" />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function ExercisePlayerView({ player }: ExercisePlayerViewProps) {
  const {
    meta,
    exercises,
    exerciseIndex,
    currentExercise,
    currentProgress,
    currentSetNumber,
    progress,
    phase,
    sessionProgressPct,
    videoOpen,
    videoAutoPlay,
    openVideo,
    beginSet,
    showDetails,
    setShowDetails,
    heroKey,
    primaryActionLabel,
    handlePrimaryAction,
    jumpToExercise,
    currentSetTargets,
    runtimeMode,
    prescription,
    isTimed,
    isBodyweight,
    v2Targets,
    finishWorkoutEarly,
    editLastSet,
    syncStatus,
  } = player;

  const sessionActive = videoOpen || player.setInProgress;
  const isBlocked = phase === "rest" || phase === "complete" || phase === "set-sheet";
  const dockRef = useRef<HTMLDivElement>(null);
  const [dockH, setDockH] = useState(0);
  const [dockBox, setDockBox] = useState({ top: 0, left: 0, width: 0 });

  useLayoutEffect(() => {
    if (!sessionActive) {
      setDockH(0);
      return;
    }

    const sync = () => {
      const main = document.querySelector(".platform-main");
      const frame = document.querySelector(".platform-frame");
      if (main instanceof HTMLElement) {
        const mainRect = main.getBoundingClientRect();
        const frameRect = frame instanceof HTMLElement ? frame.getBoundingClientRect() : mainRect;
        setDockBox({
          top: mainRect.top,
          left: frameRect.left,
          width: frameRect.width,
        });
      }
      if (dockRef.current) {
        setDockH(dockRef.current.getBoundingClientRect().height);
      }
    };

    sync();
    const observer = new ResizeObserver(sync);
    const main = document.querySelector(".platform-main");
    const frame = document.querySelector(".platform-frame");
    if (main instanceof HTMLElement) observer.observe(main);
    if (frame instanceof HTMLElement) observer.observe(frame);
    const dock = dockRef.current;
    if (dock) observer.observe(dock);
    const frameId = window.requestAnimationFrame(() => {
      if (dockRef.current && dockRef.current !== dock) observer.observe(dockRef.current);
      sync();
    });
    window.addEventListener("resize", sync);
    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [sessionActive, heroKey]);

  if (!currentExercise) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoaderCircle className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  const volumeLabel = formatExerciseVolume(currentExercise);
  const stageGuide = getExerciseStageGuide(currentExercise.external_id);
  const startSession = () => {
    beginSet();
    openVideo();
  };

  return (
    <>
      <div className="relative pb-36" dir="rtl">
        {sessionActive ? (
          <>
            <div
              aria-hidden
              style={{ height: dockH || undefined }}
              className={dockH ? undefined : "h-[calc(min(100%,var(--platform-frame-w))+5.75rem)]"}
            />
            {typeof document !== "undefined"
              ? createPortal(
                  <div
                    ref={dockRef}
                    className="pointer-events-auto bg-background shadow-[0_16px_36px_-18px_rgba(15,23,42,0.35)]"
                    dir="rtl"
                    style={{
                      position: "fixed",
                      top: dockBox.top,
                      left: dockBox.left,
                      width: dockBox.width || "100%",
                      zIndex: 45,
                      visibility: dockBox.width ? "visible" : "hidden",
                    }}
                  >
                    <ExercisePlayerStage
                      sessionActive
                      currentExercise={currentExercise}
                      exerciseIndex={exerciseIndex}
                      totalExercises={meta.totalExercises}
                      currentSetNumber={currentSetNumber}
                      sessionProgressPct={sessionProgressPct}
                      heroKey={heroKey}
                      videoAutoPlay={videoAutoPlay}
                      onStart={startSession}
                    />
                  </div>,
                  document.body,
                )
              : null}
          </>
        ) : (
          <ExercisePlayerStage
            sessionActive={false}
            currentExercise={currentExercise}
            exerciseIndex={exerciseIndex}
            totalExercises={meta.totalExercises}
            currentSetNumber={currentSetNumber}
            sessionProgressPct={sessionProgressPct}
            heroKey={heroKey}
            videoAutoPlay={videoAutoPlay}
            onStart={startSession}
          />
        )}

        <AnimatePresence initial={false}>
          {sessionActive ? (
            <motion.div
              key="session-info"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.32 }}
              className="pt-3"
            >
              <ExerciseRxStrip
                sets={currentExercise.sets}
                reps={
                  isTimed
                    ? `${v2Targets.durationMin ?? currentExercise.durationSeconds} ث`
                    : `${currentSetTargets.repsMin} - ${currentSetTargets.repsMax}`
                }
                weightLabel={
                  isBodyweight || isTimed || (runtimeMode === "v2" && !v2Targets.loadKnown)
                    ? "—"
                    : formatWeightLabel(currentSetTargets.weightKg)
                }
                restLabel={formatRestSeconds(v2Targets.restSeconds ?? currentExercise.restSeconds)}
              />

              {stageGuide ? (
                <div className="mt-3">
                  <ExerciseStageGuide guide={stageGuide} variant="session" />
                </div>
              ) : null}

              <section className="mt-3 rounded-[24px] border border-border/60 bg-card p-4 shadow-[0_8px_24px_-14px_rgba(15,23,42,0.14)]">
                  <p className="text-center text-[10px] font-bold text-primary">طريقة الأداء الصحيح</p>
                  <h2 className="mt-1 text-center text-[16px] font-black leading-snug text-foreground">
                    {currentExercise.name}
                  </h2>
                  <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                    {currentExercise.coachNotes?.trim() ||
                      "حافظ على التحكم في الحركة، لا تتعجل التكرار، وتنفّس بثبات مع كل عدة. شاهد الفيديو أعلاه أثناء التنفيذ."}
                  </p>

                  {currentExercise.instructionsVideoPath ? (
                    <div className="mt-3 border-t border-border/50 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowDetails((value) => !value)}
                        className="text-[11px] font-bold text-primary"
                      >
                        {showDetails ? "إخفاء تعليمات إضافية" : "تعليمات إضافية من المدرب"}
                      </button>
                      {showDetails ? (
                        <div className="mt-3">
                          <ExerciseMedia
                            status={currentExercise.instructionsStatus}
                            path={currentExercise.instructionsVideoPath}
                            kind="instructions"
                            title={currentExercise.name}
                            label="فيديو التعليمات"
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </section>
            </motion.div>
          ) : (
            <motion.div
              key="preview-list"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.32 }}
              className="overflow-hidden pt-3"
            >
              <ExerciseRxStrip
                sets={currentExercise.sets}
                reps={
                  isTimed
                    ? `${currentExercise.durationSeconds ?? volumeLabel} ث`
                    : volumeLabel
                }
                weightLabel={
                  runtimeMode === "v2" && (isBodyweight || isTimed || prescription?.status === "CALIBRATION_REQUIRED")
                    ? "—"
                    : formatWeightLabel(currentExercise.suggestedWeightKg)
                }
                restLabel={formatRestSeconds(currentExercise.restSeconds)}
              />

              {stageGuide ? (
                <div className="mt-3">
                  <ExerciseStageGuide guide={stageGuide} variant="session" />
                </div>
              ) : null}

              <section className="mt-4">
                <h2 className="mb-2 text-[10px] font-black text-foreground">تمارين الحصة</h2>
                <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
                  {exercises.map((exercise, index) => {
                    const item = progress[index];
                    const isCurrent = index === exerciseIndex;
                    const isDone = item?.status === "done";
                    const stillThumb = getExerciseStageListThumb(exercise.external_id);

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
                              ? "bg-primary text-white"
                              : isCurrent
                                ? "border border-primary text-primary"
                                : "border border-border text-muted-foreground",
                          )}
                        >
                          {index + 1}
                        </span>
                        <div className="aspect-square size-16 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-card">
                          {stillThumb ? (
                            <OptimizedImage
                              src={stillThumb}
                              alt=""
                              width={112}
                              height={84}
                              sizes="64px"
                              objectFit="cover"
                              className="h-full w-full object-cover object-center"
                              fallback={
                                <ExerciseThumbnail
                                  signedUrl={exercise.thumbnailUrl}
                                  status={exercise.videoStatus}
                                  mediaPath={exercise.videoPath}
                                  alt={exercise.name}
                                  className="h-full w-full object-cover"
                                />
                              }
                            />
                          ) : (
                            <ExerciseThumbnail
                              signedUrl={exercise.thumbnailUrl}
                              status={exercise.videoStatus}
                              mediaPath={exercise.videoPath}
                              alt={exercise.name}
                              className="h-full w-full object-cover"
                            />
                          )}
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
                            {item?.completedSets ?? 0}/{exercise.sets} مجموعات
                          </p>
                        </div>
                        {isDone ? (
                          <Check className="h-4 w-4 shrink-0 text-success" strokeWidth={3} />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-border" strokeWidth={1.6} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {phase === "rest" || phase === "set-sheet" || phase === "complete" ? null : (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--platform-nav-h,64px)+env(safe-area-inset-bottom)+30px)] z-40 mx-auto max-w-[var(--platform-frame-w)] px-[var(--platform-gutter)] pb-2">
          <div className="space-y-2">
            {syncStatus === "PENDING_SYNC" ? (
              <p className="pointer-events-auto text-center text-[10px] font-bold text-muted-foreground">
                سيتم حفظ النتيجة عند عودة الاتصال
              </p>
            ) : null}
            <button
              type="button"
              disabled={isBlocked}
              onClick={sessionActive ? handlePrimaryAction : startSession}
              className="pointer-events-auto flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-[0_12px_28px_-10px_rgba(249,115,22,0.55)] transition-transform duration-[120ms] active:scale-[0.97] disabled:opacity-50"
            >
              {sessionActive ? primaryActionLabel : "ابدأ الجولة"}
            </button>
            {sessionActive ? (
              <div className="pointer-events-auto grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={editLastSet}
                  className="flex h-11 items-center justify-center rounded-2xl border border-border/60 bg-card text-[11px] font-bold text-foreground"
                >
                  تعديل آخر مجموعة
                </button>
                <button
                  type="button"
                  onClick={finishWorkoutEarly}
                  className="flex h-11 items-center justify-center rounded-2xl border border-border/60 bg-card text-[11px] font-bold text-foreground"
                >
                  إنهاء الحصة
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {typeof document !== "undefined"
        ? createPortal(
            <>
              <SetLogBottomSheet player={player} />
              <WorkoutCompleteScreen player={player} />
            </>,
            document.body,
          )
        : null}
    </>
  );
}
