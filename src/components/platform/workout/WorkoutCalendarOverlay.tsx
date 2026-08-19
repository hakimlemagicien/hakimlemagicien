import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { premiumEase } from "@/lib/motion";
import {
  dateKeyFromDate,
  formatWorkoutMonthTitle,
  getWeekdayIdFromDate,
  resolveWeekdayPlan,
  type WeekdayId,
  type WeekDayEntry,
} from "@/lib/platform/weekly-workout-schedule";
import { cn } from "@/lib/utils";

const WEEKDAY_HEADERS = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"] as const;

type MonthCell = {
  date: Date;
  dateKey: string;
  dayId: WeekdayId;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isCurrentWeek: boolean;
  isRestDay: boolean;
};

function atNoon(year: number, month: number, day: number) {
  return new Date(year, month, day, 12, 0, 0, 0);
}

function buildMonthCells({
  monthDate,
  todayKey,
  selectedDateKey,
  currentWeekKeys,
  hasWorkoutProgram,
}: {
  monthDate: Date;
  todayKey: string;
  selectedDateKey: string;
  currentWeekKeys: Set<string>;
  hasWorkoutProgram: boolean;
}): MonthCell[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = atNoon(year, month, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: MonthCell[] = [];

  const pushDay = (date: Date, inMonth: boolean) => {
    const dateKey = dateKeyFromDate(date);
    const dayId = getWeekdayIdFromDate(date);
    const plan = resolveWeekdayPlan(dayId, hasWorkoutProgram);
    cells.push({
      date,
      dateKey,
      dayId,
      inMonth,
      isToday: dateKey === todayKey,
      isSelected: dateKey === selectedDateKey,
      isCurrentWeek: currentWeekKeys.has(dateKey),
      isRestDay: plan.isRestDay,
    });
  };

  for (let i = startOffset; i > 0; i -= 1) {
    pushDay(atNoon(year, month, 1 - i), false);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    pushDay(atNoon(year, month, day), true);
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1]!.date;
    pushDay(atNoon(last.getFullYear(), last.getMonth(), last.getDate() + 1), false);
  }

  return cells;
}

export function WorkoutCalendarOverlay({
  open,
  onClose,
  selectedDayId,
  weeklySchedule,
  hasWorkoutProgram,
  onSelectDay,
}: {
  open: boolean;
  onClose: () => void;
  selectedDayId: WeekdayId;
  weeklySchedule: WeekDayEntry[];
  hasWorkoutProgram: boolean;
  onSelectDay: (dayId: WeekdayId) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [cursor, setCursor] = useState(() => new Date());
  const onCloseRef = useRef(onClose);
  const ignoreCloseUntil = useRef(0);
  onCloseRef.current = onClose;
  const todayKey = dateKeyFromDate(new Date());
  const selectedEntry = weeklySchedule.find((entry) => entry.id === selectedDayId) ?? weeklySchedule[0];
  const currentWeekKeys = useMemo(
    () => new Set(weeklySchedule.map((entry) => entry.dateKey)),
    [weeklySchedule],
  );

  useEffect(() => {
    if (!open) return;
    setCursor(new Date());
    ignoreCloseUntil.current = Date.now() + 220;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const cells = useMemo(
    () =>
      selectedEntry
        ? buildMonthCells({
            monthDate: cursor,
            todayKey,
            selectedDateKey: selectedEntry.dateKey,
            currentWeekKeys,
            hasWorkoutProgram,
          })
        : [],
    [cursor, todayKey, selectedEntry, currentWeekKeys, hasWorkoutProgram],
  );

  if (!selectedEntry || typeof document === "undefined") return null;

  const duration = reduceMotion ? 0.12 : 0.42;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="workout-calendar"
          className="workout-calendar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.12 : 0.22, ease: premiumEase }}
        >
          <button
            type="button"
            aria-label="إغلاق التقويم"
            className="workout-calendar__backdrop"
            onClick={() => {
              if (Date.now() < ignoreCloseUntil.current) return;
              onClose();
            }}
          />

          <motion.div
            className="workout-calendar__wrap"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.96 }}
            transition={
              reduceMotion
                ? { duration: 0.14 }
                : { type: "spring", stiffness: 420, damping: 32, mass: 0.78 }
            }
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-label="تقويم التمارين"
              dir="rtl"
              className="workout-calendar__card"
            >
              <div className="workout-calendar__head">
                <CalendarDays className="h-4 w-4 text-primary" strokeWidth={2.3} />
                <h2>تقويم التمارين</h2>
              </div>

              <div className="workout-calendar__month">
                <button
                  type="button"
                  aria-label="الشهر السابق"
                  className="workout-calendar__nav"
                  onClick={() =>
                    setCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
                  }
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
                </button>
                <p>{formatWorkoutMonthTitle(cursor)}</p>
                <button
                  type="button"
                  aria-label="الشهر التالي"
                  className="workout-calendar__nav"
                  onClick={() =>
                    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
                  }
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2.4} />
                </button>
              </div>

              <div className="workout-calendar__weekdays">
                {WEEKDAY_HEADERS.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>

              <div className="workout-calendar__grid">
                {cells.map((cell, index) => (
                  <motion.button
                    key={cell.dateKey}
                    type="button"
                    onClick={() => {
                      onSelectDay(cell.dayId);
                      onClose();
                    }}
                    aria-pressed={cell.isSelected}
                    aria-label={`${cell.date.getDate()} ${cell.isRestDay ? "راحة" : "تمرين"}`}
                    className={cn(
                      "workout-calendar__day",
                      cell.inMonth && "is-month",
                      cell.isToday && "is-today",
                      cell.isSelected && "is-selected",
                      cell.isCurrentWeek && "is-week",
                      cell.isRestDay && "is-rest",
                    )}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.28,
                      delay: reduceMotion ? 0 : Math.min(index * 0.012, 0.22),
                      ease: premiumEase,
                    }}
                  >
                    <span>{cell.date.getDate()}</span>
                    {cell.isSelected ? (
                      <Check className="workout-calendar__check" strokeWidth={3} />
                    ) : (
                      <i aria-hidden className="workout-calendar__dot" />
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="workout-calendar__legend">
                <span>
                  <i className="is-train" />
                  تمرين
                </span>
                <span>
                  <i className="is-rest" />
                  راحة
                </span>
                <span>
                  <i className="is-today" />
                  اليوم
                </span>
              </div>
            </section>

            <motion.button
              type="button"
              className="workout-calendar__cancel"
              onClick={onClose}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.08, duration }}
            >
              إلغاء
            </motion.button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
