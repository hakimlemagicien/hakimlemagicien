import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Droplets,
  Dumbbell,
  Footprints,
  MoreVertical,
  UtensilsCrossed,
} from "lucide-react";
import { ReadinessAdjustmentSheet } from "@/components/platform/readiness/ReadinessAdjustmentSheet";
import { ReadinessCard } from "@/components/platform/readiness/ReadinessCard";
import { ReadinessCheckOverlay } from "@/components/platform/readiness/ReadinessCheckOverlay";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { useUpgradeFlow } from "@/components/platform/upgrade/UpgradeContext";
import { useWater } from "@/components/platform/water/WaterContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useDailyReadiness } from "@/hooks/useDailyReadiness";
import { usePlatformActivity } from "@/hooks/usePlatformActivity";
import { useMembership } from "@/hooks/useMembership";
import { useAssignedTrainingRuntime } from "@/hooks/useAssignedTrainingRuntime";
import { useProgramContinuity } from "@/hooks/useProgramContinuity";
import { trackReadinessEvent } from "@/lib/platform/readiness-analytics";
import { trackTrainingEvent } from "@/lib/platform/training-progress/analytics";
import { shouldAutoOpenReadiness, hasStartedToday, type ReadinessAnswers } from "@/lib/platform/readiness";
import { buildYourDayScore, formatYourDayDate } from "@/lib/platform/your-day";
import { cn } from "@/lib/utils";
export type YourDaySearch = {
  from?: "start-day";
};

const TASK_ICONS = {
  nutrition: UtensilsCrossed,
  water: Droplets,
  workout: Dumbbell,
  activity: Footprints,
} as const;

function DayScoreGauge({
  score,
  max,
  label,
}: {
  score: number;
  max: number;
  label: string;
}) {
  const radius = 86;
  const circumference = Math.PI * radius;
  const pct = Math.min(Math.max(score / max, 0), 1);
  const offset = circumference * (1 - pct);
  const onTrack = score >= 70;

  return (
    <section className="your-day-gauge" aria-label={`إنجاز اليوم ${score} من ${max}`}>
      <div className="your-day-gauge__arc">
        <svg viewBox="0 0 220 128" className="your-day-gauge__svg" aria-hidden>
          <path
            d="M24 118 A86 86 0 0 1 196 118"
            fill="none"
            stroke="#F3EDE7"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M24 118 A86 86 0 0 1 196 118"
            fill="none"
            stroke={onTrack ? "#22C55E" : "#F97316"}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="your-day-gauge__fill"
          />
        </svg>
        <div className="your-day-gauge__value">
          <p className="your-day-gauge__score">
            <span className="tabular-nums">{score}</span>
            <span className="your-day-gauge__of"> من {max}</span>
          </p>
          <p className={cn("your-day-gauge__status", onTrack && "is-ready")}>{label}</p>
          <p className="your-day-gauge__hint">يتحدث تلقائياً مع كل إنجاز</p>
        </div>
      </div>
    </section>
  );
}

export function YourDayPage({ search }: { search: YourDaySearch }) {
  const navigate = useNavigate();
  const { userId, snapshot, refresh } = usePlatformActivity();
  const { features } = useMembership();
  const runtimeQuery = useAssignedTrainingRuntime(Boolean(features?.workout_program));
  const continuity = useProgramContinuity(runtimeQuery.data, Boolean(features?.workout_program));
  const water = useWater();
  const upgrade = useUpgradeFlow();
  const { record, ready, saving, error, save, saveAdjustment, clearError } =
    useDailyReadiness(userId);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [answers, setAnswers] = useState<Partial<ReadinessAnswers>>({});
  const [manualOpen, setManualOpen] = useState(false);
  const autoOpenedRef = useRef(false);
  const programViewedRef = useRef(false);

  const todayPlan = continuity.assignedPlans?.[continuity.todayId];
  const workoutTotal =
    todayPlan && !todayPlan.isRestDay ? todayPlan.prescriptions.length : snapshot.workoutTotal;
  const dayScore = useMemo(
    () => buildYourDayScore(snapshot, snapshot.workoutDone, Math.max(workoutTotal, 0)),
    [snapshot, workoutTotal],
  );
  const authenticated = Boolean(userId && userId !== "guest");

  useEffect(() => {
    if (programViewedRef.current) return;
    programViewedRef.current = true;
    trackTrainingEvent("training_program_viewed", { has_runtime: runtimeQuery.data?.reason === "ok" });
  }, [runtimeQuery.data?.reason]);

  useEffect(() => {
    if (!authenticated || !ready || autoOpenedRef.current) return;
    const fromStartDay = search.from === "start-day";
    const shouldOpen = shouldAutoOpenReadiness({
      isAuthenticated: authenticated,
      fromStartDay,
      dataReady: ready,
      otherCriticalOverlayOpen: false,
      record,
    });
    if (fromStartDay && !shouldOpen && hasStartedToday(record)) {
      void navigate({ to: "/app/program", search: {}, replace: true });
      return;
    }
    if (!shouldOpen) return;
    autoOpenedRef.current = true;
    setAnswers({
      energy: record?.energy,
      sleep: record?.sleep,
      body: record?.body,
    });
    setOverlayOpen(true);
    trackReadinessEvent("readiness_check_viewed");
  }, [authenticated, navigate, ready, record, search.from]);

  const openManual = () => {
    setManualOpen(true);
    setAnswers({
      energy: record?.energy,
      sleep: record?.sleep,
      body: record?.body,
    });
    setOverlayOpen(true);
    trackReadinessEvent("readiness_check_reopened");
  };

  const closeOverlay = () => {
    setOverlayOpen(false);
    setManualOpen(false);
    clearError();
    if (search.from === "start-day") {
      void navigate({ to: "/app/program", search: {}, replace: true });
    }
  };

  const handleConfirm = async () => {
    const next = await save({ answers, status: "completed" });
    if (!next) return;
    trackReadinessEvent("readiness_check_submitted", { readiness_level: next.level });
    closeOverlay();
  };

  const handleSkip = async () => {
    const next = await save({ answers, status: "skipped" });
    if (!next) return;
    trackReadinessEvent("readiness_check_skipped");
    closeOverlay();
  };

  const handleDismiss = () => {
    if (!overlayOpen) return;
    closeOverlay();
  };

  const handleKeepPlan = async () => {
    await saveAdjustment("declined");
    trackReadinessEvent("readiness_adjustment_declined");
  };

  const handleShowAdjustments = () => {
    setAdjustOpen(true);
    trackReadinessEvent("readiness_adjustment_viewed");
  };

  const handleAcceptAdjustment = async (choice: "lighter" | "active_recovery") => {
    await saveAdjustment("accepted", choice);
    trackReadinessEvent("readiness_adjustment_accepted");
    setAdjustOpen(false);
  };

  if (!ready) {
    return (
      <PlatformStack>
        <YourDaySkeleton />
      </PlatformStack>
    );
  }

  return (
    <PlatformStack className="your-day">
      <header className="your-day-header">
        <Link to="/app" aria-label="رجوع" className="your-day-header__icon">
          <ChevronRight className="h-5 w-5" />
        </Link>
        <div className="your-day-header__titles">
          <h1>يومك</h1>
          <p>{formatYourDayDate()}</p>
        </div>
        <button type="button" aria-label="المزيد" className="your-day-header__icon">
          <MoreVertical className="h-5 w-5" />
        </button>
      </header>

      <ReadinessCard
        record={record}
        onUpdate={openManual}
        onShowAdjustments={handleShowAdjustments}
        onKeepPlan={() => void handleKeepPlan()}
      />

      <DayScoreGauge score={dayScore.total} max={dayScore.max} label={dayScore.label} />

      <div className="your-day-stats" aria-label="تفاصيل النقاط">
        {dayScore.tasks.map((task) => {
          const Icon = TASK_ICONS[task.id];
          return (
            <div key={task.id} className={cn("your-day-stats__item", `is-${task.id}`, task.current >= task.total && "is-done")}>
              <Icon className="h-3.5 w-3.5" aria-hidden />
              <span className="tabular-nums">
                {task.points}/{task.maxPoints}
              </span>
            </div>
          );
        })}
      </div>

      <div className="your-day-grid">
        {dayScore.tasks.map((task) => {
          const Icon = TASK_ICONS[task.id];
          const pct = task.total > 0 ? Math.min(task.current / task.total, 1) * 100 : 0;
          const detail =
            task.id === "nutrition"
              ? `${task.current} من ${task.total} وجبات`
              : task.id === "water"
                ? `${task.current} من ${task.total} أكواب`
                : task.id === "workout"
                  ? `${task.current} من ${task.total} تمارين`
                  : `${task.current} من ${task.total} نقطة`;

          const action = (
            <span className="your-day-task__cta">
              {task.actionLabel}
              {task.actionKind === "link" ? (
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              ) : null}
            </span>
          );

          const body = (
            <>
              <span className={cn("your-day-task__icon", `is-${task.id}`, task.current >= task.total && "is-done")}>
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <p className="your-day-task__title">{task.title}</p>
              <p className="your-day-task__detail">{detail}</p>
              <p className="your-day-task__points tabular-nums">
                {task.points}/{task.maxPoints}
              </p>
              <span className={cn("your-day-task__bar", task.current >= task.total && "is-done")}>
                <span style={{ width: `${pct}%` }} />
              </span>
              {action}
            </>
          );

          if (task.actionKind === "water") {
            return (
              <button
                key={task.id}
                type="button"
                className="your-day-task"
                onClick={() => {
                  void water.registerWater(snapshot.waterGlassMl || 250);
                  refresh();
                }}
              >
                {body}
              </button>
            );
          }

          return (
            <Link key={task.id} to={task.href ?? "/app"} className="your-day-task">
              {body}
            </Link>
          );
        })}
      </div>

      <div className="your-day-next" role="region" aria-label="المهمة التالية">
        <p>{dayScore.nextTask.label}</p>
        {dayScore.nextTask.actionKind === "water" ? (
          <button
            type="button"
            className="your-day-next__cta"
            onClick={() => void water.registerWater(snapshot.waterGlassMl || 250)}
          >
            {dayScore.nextTask.cta}
          </button>
        ) : (
          <Link to={dayScore.nextTask.href} className="your-day-next__cta">
            {dayScore.nextTask.cta}
          </Link>
        )}
      </div>

      <ReadinessCheckOverlay
        open={overlayOpen}
        saving={saving}
        error={error}
        answers={answers}
        onAnswersChange={setAnswers}
        onConfirm={() => void handleConfirm()}
        onSkip={() => void handleSkip()}
        onDismiss={() => void handleDismiss()}
      />
      <ReadinessAdjustmentSheet
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        onAccept={(choice) => void handleAcceptAdjustment(choice)}
      />
    </PlatformStack>
  );
}

function YourDaySkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <Skeleton className="mx-auto h-12 w-40 rounded-xl" />
      <Skeleton className="h-[108px] w-full rounded-[24px]" />
      <Skeleton className="mx-auto h-[160px] w-[220px] rounded-full" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-[148px] rounded-[24px]" />
        <Skeleton className="h-[148px] rounded-[24px]" />
        <Skeleton className="h-[148px] rounded-[24px]" />
        <Skeleton className="h-[148px] rounded-[24px]" />
      </div>
    </div>
  );
}
