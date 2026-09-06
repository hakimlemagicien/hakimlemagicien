import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronRight,
  Circle,
  Compass,
  Dumbbell,
  Home,
  Layers,
  Play,
  RefreshCcw,
  Timer,
  Utensils,
  Wrench,
  Weight,
  X,
} from "lucide-react";
import { ExerciseMedia } from "@/components/platform/exercises/ExerciseMedia";
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  clientFacingExerciseName,
  clientFacingExerciseThumb,
  formatReps,
} from "@/lib/admin/admin-program-builder";
import type { AdminProgramExercise } from "@/lib/admin/admin-programs-api";
import { getAdminExercise } from "@/lib/admin/admin-exercises-api";
import { exerciseHasRealMotionVideo } from "@/lib/platform/exercise-real-motion-video";
import {
  getExerciseStageCover,
  getExerciseStageListThumb,
} from "@/lib/platform/exercise-stage-media";
import type { ExerciseMediaStatus } from "@/lib/platform/exercise-media";
import { cn } from "@/lib/utils";

type PreviewPhase = "ready" | "active" | "rest" | "complete";

type ResolvedMedia = {
  videoStatus: ExerciseMediaStatus;
  videoPath: string | null;
  useBundled: boolean;
};

type Props = {
  open: boolean;
  exercises: AdminProgramExercise[];
  startIndex: number;
  dayTitle: string;
  onClose: () => void;
};

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
              <p className="mt-1.5 text-[11px] font-medium leading-none text-foreground/70">{stat.label}</p>
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

export function AdminClientExercisePreview({ open, exercises, startIndex, dayTitle, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [phase, setPhase] = useState<PreviewPhase>("ready");
  const [setNumber, setSetNumber] = useState(1);
  const [restLeft, setRestLeft] = useState(0);
  const [completedSets, setCompletedSets] = useState<Record<number, number>>({});
  const [mediaById, setMediaById] = useState<Record<string, ResolvedMedia>>({});
  const restTimer = useRef<number | null>(null);
  const loadedIds = useRef(new Set<string>());

  const list = useMemo(
    () => exercises.filter((row) => Boolean(row.exercise_id || row.exercise_external_id)),
    [exercises],
  );
  const safeIndex = list.length === 0 ? 0 : Math.min(Math.max(0, index), list.length - 1);
  const current = list[safeIndex] ?? null;

  useEffect(() => {
    if (!open) return;
    setIndex(Math.min(Math.max(0, startIndex), Math.max(0, list.length - 1)));
    setPhase("ready");
    setSetNumber(1);
    setRestLeft(0);
    setCompletedSets({});
  }, [open, startIndex, list.length]);

  useEffect(() => {
    if (!open || !current?.exercise_id) return;
    const id = current.exercise_id;
    if (loadedIds.current.has(id)) return;
    loadedIds.current.add(id);
    let cancelled = false;
    void getAdminExercise(id)
      .then((detail) => {
        if (cancelled) return;
        const ready = detail.video_status === "ready" && Boolean(detail.video_path?.trim());
        const bundled = exerciseHasRealMotionVideo({
          externalId: detail.external_id,
          videoStatus: detail.video_status,
        });
        setMediaById((prev) => ({
          ...prev,
          [id]: {
            videoStatus: (ready ? "ready" : (detail.video_status as ExerciseMediaStatus)) || "placeholder",
            videoPath: ready ? detail.video_path : null,
            useBundled: !ready && bundled,
          },
        }));
      })
      .catch(() => {
        if (cancelled) return;
        const externalId = current.exercise_external_id ?? "";
        const bundled = exerciseHasRealMotionVideo({ externalId, videoStatus: null });
        setMediaById((prev) => ({
          ...prev,
          [id]: {
            videoStatus: bundled ? "ready" : "placeholder",
            videoPath: null,
            useBundled: bundled,
          },
        }));
      });
    return () => {
      cancelled = true;
    };
  }, [open, current?.exercise_id, current?.exercise_external_id]);

  useEffect(() => {
    if (phase !== "rest") {
      if (restTimer.current) window.clearInterval(restTimer.current);
      restTimer.current = null;
      return;
    }
    restTimer.current = window.setInterval(() => {
      setRestLeft((value) => {
        if (value <= 1) {
          if (restTimer.current) window.clearInterval(restTimer.current);
          restTimer.current = null;
          setPhase("active");
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => {
      if (restTimer.current) window.clearInterval(restTimer.current);
    };
  }, [phase]);

  if (!open || !current || typeof document === "undefined") return null;

  const externalId = current.exercise_external_id ?? "";
  const displayName = clientFacingExerciseName(current);
  const overrideThumb = clientFacingExerciseThumb(current);
  const media = current.exercise_id ? mediaById[current.exercise_id] : undefined;
  const stageCover = getExerciseStageCover(externalId);
  const listThumb = overrideThumb || getExerciseStageListThumb(externalId) || stageCover?.src || null;
  const totalSets = Math.max(1, current.sets || 1);
  const repsLabel = formatReps(current) || "—";
  const restLabel = formatRestSeconds(current.rest_seconds);
  const weightLabel = current.suggested_weight_kg != null ? `${current.suggested_weight_kg} كغ` : "—";
  const progressPct = Math.round(((safeIndex + (setNumber - 1) / totalSets) / Math.max(list.length, 1)) * 100);
  const bundledSrc = media?.useBundled && externalId ? `/exercises/${externalId}/video/exercise.mp4` : null;
  const sessionActive = phase === "active" || phase === "rest";
  const currentDoneSets = completedSets[safeIndex] ?? 0;

  function jumpToExercise(nextIndex: number) {
    setIndex(nextIndex);
    setSetNumber(Math.min((completedSets[nextIndex] ?? 0) + 1, Math.max(1, list[nextIndex]?.sets || 1)));
    setPhase("ready");
    setRestLeft(0);
  }

  function completeSet() {
    const nextDone = Math.min(totalSets, currentDoneSets + 1);
    setCompletedSets((prev) => ({ ...prev, [safeIndex]: nextDone }));

    if (nextDone < totalSets) {
      setRestLeft(Math.max(5, current.rest_seconds || 90));
      setPhase("rest");
      setSetNumber(nextDone + 1);
      return;
    }
    if (safeIndex + 1 < list.length) {
      setIndex(safeIndex + 1);
      setSetNumber(1);
      setPhase("ready");
      return;
    }
    setPhase("complete");
  }

  const primaryLabel =
    phase === "rest"
      ? `راحة ${restLeft}ث · تخطي`
      : phase === "active"
        ? setNumber < totalSets
          ? "إكمال الجولة"
          : safeIndex + 1 < list.length
            ? "التمرين التالي"
            : "إنهاء المعاينة"
        : "ابدأ الجولة";

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#1c1917]/70 p-3 sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[min(920px,96vh)] w-[min(390px,100%)] flex-col overflow-hidden rounded-[28px] bg-background shadow-[0_28px_80px_rgba(15,23,42,0.45)]"
        role="dialog"
        aria-modal="true"
        aria-label="معاينة شاشة التمرين للعميل"
        onClick={(event) => event.stopPropagation()}
        dir="rtl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/70 bg-card px-3 py-2.5">
          <p className="min-w-0 truncate text-[11px] font-black text-foreground">
            معاينة عميل · {dayTitle}
            <span className="font-bold text-muted-foreground"> — تحكّم كأنك العميل</span>
          </p>
          <button
            type="button"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-border/70 bg-background text-foreground"
            onClick={onClose}
            aria-label="إغلاق المعاينة"
          >
            <X size={15} />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto bg-background px-3 pb-[7.5rem] pt-2">
          {phase === "complete" ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 px-4 text-center">
              <Check className="h-10 w-10 text-primary" />
              <h3 className="text-lg font-black text-foreground">انتهت معاينة الحصة</h3>
              <p className="text-xs font-bold text-muted-foreground">هذه معاينة داخلية — لم يُحفظ أي سجل للعميل.</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 h-11 rounded-2xl bg-primary px-5 text-sm font-black text-primary-foreground"
              >
                إغلاق
              </button>
            </div>
          ) : (
            <>
              <header className="space-y-2 px-1 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="رجوع"
                    className="grid h-9 w-9 place-items-center rounded-2xl border border-border/70 bg-card text-foreground shadow-sm"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="min-w-0 flex-1 text-center">
                    <h1 className="truncate text-sm font-black text-foreground">{displayName}</h1>
                    <p className="text-[10px] font-bold text-muted-foreground">
                      تمرين {safeIndex + 1} من {list.length} · الجولة {setNumber} من {totalSets}
                    </p>
                  </div>
                  <div className="h-9 w-9" />
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-300"
                    style={{ width: `${Math.min(100, Math.max(4, progressPct))}%` }}
                  />
                </div>
              </header>

              <div className="pt-2">
                <div className="relative aspect-square w-full overflow-hidden rounded-[24px] border border-border/60 bg-muted shadow-[0_12px_30px_-16px_rgba(15,23,42,0.25)]">
                  {sessionActive ? (
                    bundledSrc ? (
                      <video
                        src={bundledSrc}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <ExerciseMedia
                        status={media?.videoStatus ?? "placeholder"}
                        path={media?.videoPath ?? null}
                        kind="exercise"
                        title={displayName}
                        label="فيديو التمرين"
                        autoPlay
                        loop
                        aspect="square"
                        showCaption={false}
                        className="absolute inset-0 h-full w-full rounded-[24px] border-0 shadow-none"
                      />
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPhase("active")}
                      className="relative flex aspect-square w-full items-center justify-center"
                    >
                      {listThumb ? (
                        <OptimizedImage
                          src={listThumb}
                          alt={displayName}
                          width={960}
                          height={720}
                          sizes="390px"
                          objectFit="cover"
                          className="absolute inset-0 h-full w-full"
                        />
                      ) : (
                        <span className="absolute inset-0 grid place-items-center bg-muted text-4xl font-black text-muted-foreground">
                          {displayName.slice(0, 1)}
                        </span>
                      )}
                      <span className="relative grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_rgba(249,115,22,0.65)]">
                        <Play className="h-6 w-6 fill-current" />
                      </span>
                      <span className="absolute bottom-3 start-3 rounded-lg bg-card/95 px-2 py-1 text-[10px] font-bold text-foreground shadow-sm">
                        شاهد الأداء الصحيح
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-3">
                <ExerciseRxStrip
                  sets={totalSets}
                  reps={repsLabel}
                  weightLabel={weightLabel}
                  restLabel={restLabel}
                />
              </div>

              <section className="mt-4">
                <h2 className="mb-2 text-[10px] font-black text-foreground">تمارين الحصة</h2>
                <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
                  {list.map((exercise, exerciseIndex) => {
                    const doneSets = completedSets[exerciseIndex] ?? 0;
                    const total = Math.max(1, exercise.sets || 1);
                    const isCurrent = exerciseIndex === safeIndex;
                    const isDone = doneSets >= total;
                    const thumb =
                      clientFacingExerciseThumb(exercise) ||
                      getExerciseStageListThumb(exercise.exercise_external_id) ||
                      getExerciseStageCover(exercise.exercise_external_id ?? "")?.src ||
                      null;
                    const name = clientFacingExerciseName(exercise);

                    return (
                      <button
                        key={`${exercise.exercise_id}-${exerciseIndex}`}
                        type="button"
                        onClick={() => jumpToExercise(exerciseIndex)}
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
                          {exerciseIndex + 1}
                        </span>
                        <div className="aspect-square size-16 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-card">
                          {thumb ? (
                            <OptimizedImage
                              src={thumb}
                              alt=""
                              width={112}
                              height={84}
                              sizes="64px"
                              objectFit="cover"
                              className="h-full w-full object-cover object-center"
                            />
                          ) : (
                            <span className="grid h-full w-full place-items-center text-sm font-black text-muted-foreground">
                              {name.slice(0, 1)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate text-[11px] font-black",
                              isCurrent ? "text-primary" : "text-foreground",
                            )}
                          >
                            {name}
                          </p>
                          <p className="text-[8px] text-muted-foreground">
                            {doneSets}/{total} مجموعات
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
            </>
          )}
        </div>

        {phase !== "complete" ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-[64px] z-10 px-3 pb-2">
            <button
              type="button"
              onClick={() => {
                if (phase === "ready") {
                  setPhase("active");
                  return;
                }
                if (phase === "rest") {
                  setPhase("active");
                  setRestLeft(0);
                  return;
                }
                completeSet();
              }}
              className="pointer-events-auto flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-[0_12px_28px_-10px_rgba(249,115,22,0.55)] transition-transform duration-[120ms] active:scale-[0.97]"
            >
              {primaryLabel}
            </button>
          </div>
        ) : null}

        <nav
          aria-label="شريط تنقل التطبيق (معاينة)"
          className="grid shrink-0 grid-cols-5 border-t border-border/70 bg-card px-1 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 text-[9px] font-bold text-muted-foreground"
        >
          {[
            { icon: Dumbbell, label: "تماريني", active: true },
            { icon: Utensils, label: "تغذيتي" },
            { icon: Home, label: "الرئيسية", home: true },
            { icon: Compass, label: "اكتشف" },
            { icon: Wrench, label: "الأدوات" },
          ].map((item) => {
            const Icon = item.icon;
            if (item.home) {
              return (
                <span key={item.label} className="-mt-5 flex flex-col items-center gap-1">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-md">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>{item.label}</span>
                </span>
              );
            }
            return (
              <span
                key={item.label}
                className={cn("flex flex-col items-center gap-1 py-1", item.active && "text-primary")}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </span>
            );
          })}
        </nav>
      </div>
    </div>,
    document.body,
  );
}
