import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Droplets, Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";
import type { WorkoutPlayerState } from "@/hooks/useWorkoutPlayer";
import { ExerciseThumbnail } from "@/components/platform/exercises/ExerciseThumbnail";
import { useWaterOptional } from "@/components/platform/water/WaterContext";
import { formatExerciseVolume, formatRestTime } from "@/lib/platform/workout-session";
import { cn } from "@/lib/utils";
import { AnimatedMetricValue, AnimatedRepRange } from "./AnimatedMetricValue";
import {
  remainingRestSeconds,
  pendingRestCues,
  type RestCueId,
} from "@/lib/platform/workout-runtime/wall-clock-rest";
import { hapticPulse, playWorkoutCue, primeWorkoutAudio } from "@/lib/platform/workout-runtime/audio";
import { V2_EFFORTS } from "@/lib/platform/workout-runtime/effort";
import type { TrainingV2Effort } from "@/lib/platform/training-v2-contracts";

type SetLogBottomSheetProps = {
  player: WorkoutPlayerState;
};

function StepperButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-11 w-11 place-items-center rounded-xl border border-border/50 bg-background/50 text-foreground shadow-sm transition-transform duration-[120ms] active:scale-95"
    >
      {children}
    </button>
  );
}

function ReportForm({ player }: { player: WorkoutPlayerState }) {
  const {
    currentExercise,
    currentSetNumber,
    setDraft,
    setSetDraft,
    effortLabels,
    saveSet,
    currentSetTargets,
    runtimeMode,
    prescription,
    isTimed,
    isBodyweight,
    saveError,
    v2Targets,
    calibrationAction,
  } = player;
  const isV2 = runtimeMode === "v2";
  const hideLoad = isV2 && (isBodyweight || isTimed);
  const calibration = prescription?.status === "CALIBRATION_REQUIRED" || prescription?.status === "RECALIBRATION_REQUIRED";
  const loadKnown = isV2 ? v2Targets.loadKnown && !calibration : currentSetTargets.weightKg > 0;

  return (
    <>
      <div className="text-center">
        <p className="text-xs font-bold text-muted-foreground">تقرير الجولة</p>
        <p className="mt-0.5 text-lg font-black text-foreground">
          {currentSetNumber} من {currentExercise.sets}
        </p>
        <p className="mt-1 text-[10px] font-bold text-primary">مجموعة عمل</p>
        {isV2 && calibration ? (
          <p className="mt-1 text-[10px] font-bold text-muted-foreground">معايرة — أدخل ما استخدمته فعلياً</p>
        ) : null}
        {!isV2 && currentSetNumber > 1 ? (
          <p className="mt-1 text-[10px] font-bold text-primary">الوزن +10% · التكرارات أقل</p>
        ) : null}
        {isV2 && calibrationAction === "KEEP" ? (
          <p className="mt-1 text-[10px] font-bold text-muted-foreground">الإبقاء على نفس الحمل</p>
        ) : null}
        {isV2 && calibrationAction === "SMALL_INCREASE" ? (
          <p className="mt-1 text-[10px] font-bold text-muted-foreground">يمكن زيادة خفيفة للحمل التالي</p>
        ) : null}
        {isV2 && calibrationAction === "REDUCE" ? (
          <p className="mt-1 text-[10px] font-bold text-muted-foreground">خفّف الحمل في المجموعة التالية</p>
        ) : null}
        {isV2 && calibrationAction === "SAFETY_REVIEW" ? (
          <p className="mt-1 text-[10px] font-bold text-muted-foreground">توقف عن زيادة الحمل — راعِ سلامتك</p>
        ) : null}
      </div>

      {!hideLoad ? (
        <div className="rounded-2xl border border-border/50 bg-background/35 p-3">
          <p className="text-center text-xs font-bold text-muted-foreground">
            {isV2 && !loadKnown ? "الحمل المستخدم (كجم)" : "الوزن (كجم)"}
          </p>
          <div className="mt-2 flex items-center justify-center gap-3">
            <StepperButton
              label="تقليل الوزن"
              onClick={() =>
                setSetDraft((draft) => ({
                  ...draft,
                  weightKg: Math.max(0, draft.weightKg - 2.5),
                }))
              }
            >
              <Minus className="h-4 w-4" />
            </StepperButton>
            <p className="min-w-[72px] text-center text-2xl font-black text-foreground">
              {isV2 && !loadKnown && setDraft.weightKg <= 0 ? "—" : setDraft.weightKg}
            </p>
            <StepperButton
              label="زيادة الوزن"
              onClick={() =>
                setSetDraft((draft) => ({
                  ...draft,
                  weightKg: draft.weightKg + 2.5,
                }))
              }
            >
              <Plus className="h-4 w-4" />
            </StepperButton>
          </div>
        </div>
      ) : null}

      {isTimed ? (
        <div className="rounded-2xl border border-border/50 bg-background/35 p-3">
          <p className="text-center text-xs font-bold text-muted-foreground">المدة (ثانية)</p>
          <p className="mt-1 text-center text-[11px] text-muted-foreground">
            الهدف: {v2Targets.durationMin ?? currentExercise.durationSeconds}–
            {v2Targets.durationMax ?? currentExercise.durationSeconds}
          </p>
          <div className="mt-2 flex items-center justify-center gap-3">
            <StepperButton
              label="تقليل المدة"
              onClick={() =>
                setSetDraft((draft) => ({
                  ...draft,
                  durationSeconds: Math.max(0, draft.durationSeconds - 5),
                }))
              }
            >
              <Minus className="h-4 w-4" />
            </StepperButton>
            <p className="min-w-[72px] text-center text-2xl font-black tabular-nums text-foreground">
              {setDraft.durationSeconds}
            </p>
            <StepperButton
              label="زيادة المدة"
              onClick={() => setSetDraft((draft) => ({ ...draft, durationSeconds: draft.durationSeconds + 5 }))}
            >
              <Plus className="h-4 w-4" />
            </StepperButton>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/50 bg-background/35 p-3">
          <p className="text-center text-xs font-bold text-muted-foreground">التكرارات المنفَّذة</p>
          <p className="mt-1 text-center text-[11px] text-muted-foreground">
            الهدف: {currentSetTargets.repsMin}–{currentSetTargets.repsMax}
          </p>
          <div className="mt-2 flex items-center justify-center gap-3">
            <StepperButton
              label="تقليل التكرارات"
              onClick={() => setSetDraft((draft) => ({ ...draft, reps: Math.max(0, draft.reps - 1) }))}
            >
              <Minus className="h-4 w-4" />
            </StepperButton>
            <p className="min-w-[72px] text-center text-2xl font-black tabular-nums text-foreground">{setDraft.reps}</p>
            <StepperButton
              label="زيادة التكرارات"
              onClick={() => setSetDraft((draft) => ({ ...draft, reps: draft.reps + 1 }))}
            >
              <Plus className="h-4 w-4" />
            </StepperButton>
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-center text-xs font-bold text-muted-foreground">مستوى الجهد</p>
        {isV2 ? (
          <div className="grid grid-cols-2 gap-2">
            {V2_EFFORTS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setSetDraft((draft) => ({ ...draft, effortV2: level }))}
                className={cn(
                  "min-h-11 rounded-xl border px-2 py-2 text-[11px] font-bold transition-colors duration-150",
                  setDraft.effortV2 === level
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border/50 bg-background/40 text-muted-foreground",
                )}
              >
                {effortLabels[level as TrainingV2Effort]}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(effortLabels) as Array<keyof typeof effortLabels>).map((level) => (
              <button
                key={String(level)}
                type="button"
                onClick={() =>
                  setSetDraft((draft) => ({
                    ...draft,
                    effort: level as typeof draft.effort,
                  }))
                }
                className={cn(
                  "rounded-xl border px-2 py-2 text-[11px] font-bold transition-colors duration-150",
                  setDraft.effort === level
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border/50 bg-background/40 text-muted-foreground",
                )}
              >
                {effortLabels[level]}
              </button>
            ))}
          </div>
        )}
      </div>

      {isV2 ? (
        <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-border/50 bg-background/35 px-3 text-xs font-bold text-muted-foreground">
          <input
            type="checkbox"
            checked={setDraft.safetyFlag}
            onChange={(event) => setSetDraft((draft) => ({ ...draft, safetyFlag: event.target.checked }))}
            className="h-4 w-4 accent-primary"
          />
          شعرت بألم أو تنفيذ غير آمن
        </label>
      ) : null}

      <div>
        <label htmlFor="set-notes" className="mb-2 block text-center text-xs font-bold text-muted-foreground">
          ملاحظات (اختياري)
        </label>
        <textarea
          id="set-notes"
          value={setDraft.notes}
          onChange={(event) => setSetDraft((draft) => ({ ...draft, notes: event.target.value }))}
          rows={2}
          placeholder="أضف ملاحظة عن الأداء..."
          className="w-full resize-none rounded-2xl border border-border/50 bg-background/40 px-3 py-2 text-sm text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus:ring-2"
        />
      </div>

      {saveError ? <p className="text-center text-[11px] font-bold text-destructive">{saveError}</p> : null}

      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={() => saveSet(false)}
          className="flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground transition-transform duration-[120ms] active:scale-[0.97]"
        >
          حفظ المجموعة
        </button>
        <button
          type="button"
          onClick={() => saveSet(true)}
          className="flex h-11 w-full items-center justify-center rounded-2xl border border-border/50 bg-background/40 text-sm font-bold text-muted-foreground transition-transform duration-[120ms] active:scale-[0.97]"
        >
          تخطي
        </button>
      </div>
    </>
  );
}

function RestWaterCue() {
  const water = useWaterOptional();

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        type="button"
        aria-label="شرب ماء"
        onClick={() => {
          if (water) void water.registerWater(250);
        }}
        className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-500/15 text-sky-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ring-1 ring-sky-500/25"
      >
        <Droplets className="h-6 w-6" strokeWidth={1.9} />
      </motion.button>
      <p className="text-[10px] font-bold text-muted-foreground">رشة ماء بين الجولات</p>
    </div>
  );
}

function RestTimer({ player }: { player: WorkoutPlayerState }) {
  const {
    restClock,
    restTotalSeconds,
    restUpcoming,
    skipRest,
    addRestTime,
    finishRest,
    runtimeMode,
    hydrationVisible,
    dismissHydration,
    syncStatus,
  } = player;
  const firedRef = useRef<Set<RestCueId>>(new Set());
  const expiredRef = useRef(false);
  const [left, setLeft] = useState(() => (restClock ? remainingRestSeconds(restClock) : 0));

  useEffect(() => {
    firedRef.current = new Set();
    expiredRef.current = false;
    primeWorkoutAudio();
  }, [restClock?.rest_started_at]);

  useEffect(() => {
    if (!restClock) return undefined;
    const tick = () => {
      const remaining = remainingRestSeconds(restClock);
      setLeft(remaining);
      const pending = pendingRestCues(restClock, firedRef.current);
      pending.forEach((cue) => {
        firedRef.current.add(cue);
        playWorkoutCue(cue);
        if (cue === "start") hapticPulse();
      });
      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        finishRest();
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    const onVis = () => tick();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [finishRest, restClock]);

  const progress = restTotalSeconds > 0 ? ((restTotalSeconds - left) / restTotalSeconds) * 100 : 0;
  const isV2 = runtimeMode === "v2";

  return (
    <>
      <div className="text-center">
        <p className="text-xs font-bold text-muted-foreground">راحة بين الجولات</p>
        {left <= 0 ? (
          <p className="mt-1 text-sm font-black text-primary" aria-live="polite">
            جاهز للبدء
          </p>
        ) : left <= 3 ? (
          <p className="mt-1 text-lg font-black text-primary" aria-live="polite">
            {left}
          </p>
        ) : null}
      </div>

      <div className="relative mx-auto grid h-28 w-28 place-items-center">
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
          <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="currentColor"
            className="text-primary"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - Math.min(progress, 100) / 100)}`}
          />
        </svg>
        <p className="text-2xl font-black tracking-tight text-foreground" aria-live="polite">
          {formatRestTime(left)}
        </p>
      </div>

      <RestWaterCue />

      {hydrationVisible ? (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-right">
          <p className="text-[11px] font-bold text-sky-800">وقت لشرب بعض الماء 💧</p>
          <button type="button" onClick={dismissHydration} className="text-[10px] font-bold text-sky-700">
            إغلاق
          </button>
        </div>
      ) : null}

      {syncStatus === "PENDING_SYNC" ? (
        <p className="text-center text-[10px] font-bold text-muted-foreground">سيتم حفظ النتيجة عند عودة الاتصال</p>
      ) : null}

      {restUpcoming ? (
        <div className="rounded-2xl border border-border/50 bg-background/35 p-3 text-right">
          {restUpcoming.kind === "set" ? (
            <>
              <p className="text-[10px] font-bold text-muted-foreground">الجولة التالية</p>
              <div className="mt-2 flex items-center gap-2.5">
                <div className="aspect-square size-[78px] shrink-0 overflow-hidden rounded-xl border border-border/50">
                  <ExerciseThumbnail
                    signedUrl={restUpcoming.exercise.thumbnailUrl}
                    status={restUpcoming.exercise.videoStatus}
                    mediaPath={restUpcoming.exercise.videoPath}
                    alt={restUpcoming.exercise.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-foreground">
                    الجولة {restUpcoming.setNumber} من {restUpcoming.totalSets}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">{restUpcoming.exercise.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] font-black text-foreground">
                    {restUpcoming.to.weightKg > 0 ? (
                      <AnimatedMetricValue
                        value={restUpcoming.to.weightKg}
                        initial={restUpcoming.from.weightKg}
                        decimals={restUpcoming.to.weightKg % 1 === 0 && restUpcoming.from.weightKg % 1 === 0 ? 0 : 1}
                        suffix=" كجم"
                      />
                    ) : null}
                    <AnimatedRepRange
                      min={restUpcoming.to.repsMin}
                      max={restUpcoming.to.repsMax}
                      initialMin={restUpcoming.from.repsMin}
                      initialMax={restUpcoming.from.repsMax}
                    />
                  </div>
                  {!isV2 && restUpcoming.to.weightKg > 0 ? (
                    <p className="mt-0.5 text-[10px] font-bold text-primary">رفع الوزن +10%</p>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-[10px] font-bold text-muted-foreground">التمرين القادم</p>
              <div className="mt-2 flex items-center gap-2.5">
                <div className="aspect-square size-[78px] shrink-0 overflow-hidden rounded-xl border border-border/50">
                  <ExerciseThumbnail
                    signedUrl={restUpcoming.exercise.thumbnailUrl}
                    status={restUpcoming.exercise.videoStatus}
                    mediaPath={restUpcoming.exercise.videoPath}
                    alt={restUpcoming.exercise.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-foreground">{restUpcoming.exercise.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {restUpcoming.exercise.sets} مجموعات × {formatExerciseVolume(restUpcoming.exercise)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={skipRest}
          className="flex h-11 items-center justify-center rounded-2xl border border-border/50 bg-background/40 text-xs font-bold text-foreground transition-transform duration-[120ms] active:scale-[0.97]"
        >
          ابدأ مبكراً
        </button>
        <button
          type="button"
          onClick={addRestTime}
          className="inline-flex h-11 items-center justify-center gap-1 rounded-2xl bg-primary/15 text-xs font-bold text-primary transition-transform duration-[120ms] active:scale-[0.97]"
        >
          <Plus className="h-3.5 w-3.5" />
          إضافة 30 ثانية
        </button>
      </div>
    </>
  );
}

export function SetLogBottomSheet({ player }: SetLogBottomSheetProps) {
  const { phase, closeSetSheet } = player;
  const open = phase === "set-sheet" || phase === "rest";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="set-overlay"
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          dir="rtl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {phase === "set-sheet" ? (
            <button
              type="button"
              aria-label="إغلاق"
              className="absolute inset-0 bg-foreground/25 backdrop-blur-[8px]"
              onClick={closeSetSheet}
            />
          ) : (
            <div className="absolute inset-0 bg-foreground/25 backdrop-blur-[8px]" />
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-[min(24rem,calc(var(--platform-frame-w)-2rem))] overflow-hidden rounded-[28px] border border-white/40 bg-card/70 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.45)] backdrop-blur-xl"
          >
            <div className="max-h-[min(82dvh,640px)] space-y-4 overflow-y-auto px-4 py-4">
              <AnimatePresence mode="wait" initial={false}>
                {phase === "set-sheet" ? (
                  <motion.div
                    key="report"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-4"
                  >
                    <ReportForm player={player} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="rest"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-4"
                  >
                    <RestTimer player={player} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
