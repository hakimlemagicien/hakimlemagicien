/**
 * Home "today" card — the day as a path. Coach Hakim sits at the start of the
 * path and talks to the client about the next stage; finished stages keep a
 * short word from him. Water is logged in place.
 */
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  Droplet,
  Dumbbell,
  Flame,
  Moon,
  Play,
  Plus,
  Scale,
  UtensilsCrossed,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import coachAvatar from "@/assets/coach-avatar-320.webp";
import { useWaterOptional } from "@/components/platform/water/WaterContext";
import { triggerSelectionHaptic } from "@/lib/haptic";
import { buildStreakWeek } from "@/lib/platform/home-hub";
import {
  buildStageLine,
  stageCheer,
  type CoachEvent,
  type StageLine,
  type TodayPlan,
  type TodayTask,
  type TodayTaskId,
} from "@/lib/platform/home-today";
import { cn } from "@/lib/utils";

/* ───────────── shared bits ───────────── */

const TASK_ICON: Record<TodayTaskId, typeof Dumbbell> = {
  workout: Dumbbell,
  meals: UtensilsCrossed,
  water: Droplet,
  weight: Scale,
};

function TaskIcon({ task }: { task: TodayTask }) {
  const Icon = task.rest ? Moon : TASK_ICON[task.id];
  return <Icon aria-hidden />;
}

function StreakChip({ streak }: { streak: number }) {
  const [open, setOpen] = useState(false);
  const week = useMemo(() => buildStreakWeek(streak).slice().reverse(), [streak]);
  return (
    <span className="htd-streak-wrap">
      <button
        type="button"
        className={cn("htd-streak", streak > 0 && "is-hot")}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`سلسلة ${streak} أيام`}
      >
        <Flame aria-hidden />
        <b className="tabular-nums">{streak}</b>
      </button>
      <AnimatePresence>
        {open ? (
          <motion.span
            className="htd-week"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          >
            <span className="htd-week__title">
              {streak > 0
                ? `${streak} ${streak === 1 ? "يوم" : "أيام"} متتالية 🔥`
                : "ابدأ سلسلتك اليوم"}
            </span>
            <span className="htd-week__days">
              {week.map((d) => (
                <span key={d.key} className={cn("htd-week__day", `is-${d.state}`)}>
                  <i>{d.state === "done" ? "✓" : d.state === "today" ? "🔥" : ""}</i>
                  {d.label === "اليوم" ? "اليوم" : d.label.slice(0, 3)}
                </span>
              ))}
            </span>
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}

function NextButton({ plan, onWater }: { plan: TodayPlan; onWater: () => void }) {
  const icon =
    plan.next.taskId === "all-done" ? (
      <Check aria-hidden />
    ) : plan.next.inline ? (
      <Droplet aria-hidden />
    ) : (
      <Play className="fill-current" aria-hidden />
    );
  if (plan.next.inline === "water") {
    return (
      <button type="button" className="htd-next htd-cta" onClick={onWater}>
        {icon}
        <span>{plan.next.label}</span>
      </button>
    );
  }
  return (
    <Link to={plan.next.href} className="htd-next htd-cta">
      {icon}
      <span>{plan.next.label}</span>
    </Link>
  );
}

/* ───────────── coach state: stage line, typing, inline water ───────────── */

function useCoachOnPath(plan: TodayPlan, glassMl: number) {
  const water = useWaterOptional();
  const reduce = useReducedMotion();
  const [event, setEvent] = useState<CoachEvent>(null);
  const [pulse, setPulse] = useState<TodayTaskId | null>(null);
  const line = useMemo<StageLine>(() => buildStageLine(plan, { event }), [plan, event]);

  // "Typing…" the first time home opens each day, and each time Hakim moves to a new stage.
  const [typing, setTyping] = useState(false);
  const lastStage = useRef<string | null>(null);
  useEffect(() => {
    if (reduce) return;
    const dayKeyName = `maakfit_coach_typed_${new Date().toISOString().slice(0, 10)}`;
    let firstToday = false;
    try {
      firstToday = !window.localStorage.getItem(dayKeyName);
    } catch {
      firstToday = false;
    }
    const moved = lastStage.current != null && lastStage.current !== line.stage;
    lastStage.current = line.stage;
    if (!firstToday && !moved) return;
    setTyping(true);
    const t = window.setTimeout(
      () => {
        setTyping(false);
        try {
          window.localStorage.setItem(dayKeyName, "1");
        } catch {
          /* storage unavailable */
        }
      },
      moved ? 750 : 1100,
    );
    return () => {
      window.clearTimeout(t);
      setTyping(false);
    };
  }, [line.stage, reduce]);

  // A reaction stays a few seconds, then Hakim goes back to the stage plan.
  useEffect(() => {
    if (!event) return;
    const t = window.setTimeout(() => setEvent(null), 5000);
    return () => window.clearTimeout(t);
  }, [event]);

  const addWater = async () => {
    if (!water) return;
    triggerSelectionHaptic(20);
    const ok = await water.registerWater(glassMl);
    if (!ok) return;
    setPulse("water");
    window.setTimeout(() => setPulse(null), 700);
    const total = water.state.totalMl + glassMl;
    const goal = water.state.goalMl;
    setEvent({
      type: "water",
      goalReached: total >= goal,
      leftGlasses: Math.max(Math.ceil((goal - total) / glassMl), 0),
    });
  };

  return { line, typing, addWater, pulse, canAddWater: Boolean(water) };
}

/** Hakim at the start of the path: his face sits on the line, the bubble talks about the next stage. */
function CoachOnPath({ line, typing }: { line: StageLine; typing: boolean }) {
  return (
    <li className="htd-path__coach-row">
      <span className="htd-path__coach-face">
        <img src={coachAvatar} alt="المدرب حكيم" width={46} height={46} decoding="async" />
      </span>
      <motion.p layout className="htd-path__bubble" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {typing ? (
            <motion.span
              key="dots"
              className="htd-dots"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              <i />
              <i />
              <i />
            </motion.span>
          ) : (
            <motion.span
              key={line.text}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              {line.text}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.p>
    </li>
  );
}

/* ───────────── the path card ───────────── */

const PATH_ORDER: TodayTaskId[] = ["weight", "workout", "meals", "water"];

function PathCard({ plan, glassMl }: { plan: TodayPlan; glassMl: number }) {
  const { line, typing, addWater, pulse, canAddWater } = useCoachOnPath(plan, glassMl);
  const ordered = PATH_ORDER.map((id) => plan.tasks.find((t) => t.id === id)).filter(
    Boolean,
  ) as TodayTask[];
  const doneSteps = ordered.filter((t) => t.done).length;
  const hour = new Date().getHours();
  const hello = hour < 12 ? "صباح الخير" : hour < 18 ? "أهلاً" : "مساء الخير";

  return (
    <section className="htd htd--path" aria-label="يومك مع حكيم">
      <header className="htd-top">
        <span>
          <span className="htd-hello">
            {hello}
            {plan.firstName ? ` ${plan.firstName}` : ""} 👋
          </span>
          <span className="htd-dayline">
            اليوم {plan.dayNumber} · {plan.goalLabel} ·{" "}
            <b className="tabular-nums">
              {plan.doneCount}/{plan.totalCount}
            </b>
          </span>
        </span>
        <StreakChip streak={plan.streak} />
      </header>

      <ol
        className="htd-path__list"
        style={{ ["--path" as string]: ordered.length ? doneSteps / ordered.length : 0 }}
      >
        <CoachOnPath line={line} typing={typing} />
        {ordered.map((t) => {
          const isNext = line.stage === t.id;
          return (
            <li
              key={t.id}
              className={cn(
                "htd-path__step",
                t.done && "is-done",
                isNext && "is-here",
                t.rest && "is-rest",
                pulse === t.id && "is-pulse",
              )}
            >
              <span className="htd-path__node">
                {t.done && !t.rest ? <Check aria-hidden /> : <TaskIcon task={t} />}
              </span>
              <span className="htd-path__copy">
                <b>
                  {t.title}
                  {isNext && !t.done ? <em>الخطوة التالية</em> : null}
                  {t.done && !t.rest ? (
                    <em className="is-cheer">{stageCheer(t.id, plan.female)}</em>
                  ) : null}
                </b>
                <span>{t.detail}</span>
                {t.id === "water" && !t.done ? (
                  <span className="htd-row__bar">
                    <i style={{ width: `${Math.round(t.progress * 100)}%` }} />
                  </span>
                ) : null}
              </span>
              {t.id === "water" && canAddWater && !t.done ? (
                <button
                  type="button"
                  className="htd-row__plus"
                  onClick={addWater}
                  aria-label="أضف كوب ماء"
                >
                  <Plus aria-hidden />
                </button>
              ) : !t.rest ? (
                <Link to={t.href} className="htd-path__go" aria-label={`فتح ${t.title}`}>
                  <ChevronLeft aria-hidden />
                </Link>
              ) : null}
            </li>
          );
        })}
      </ol>

      <NextButton plan={plan} onWater={addWater} />
    </section>
  );
}

/* ───────────── entry ───────────── */

export function HomeTodayCard({ plan, glassMl }: { plan: TodayPlan; glassMl: number }) {
  return <PathCard plan={plan} glassMl={glassMl} />;
}
