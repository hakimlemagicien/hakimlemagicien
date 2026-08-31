import type { WeeklyTrainingSchedule } from "@/lib/platform/strategy-matrix/calendar-resolver";
import { WEEKDAY_LABELS_AR } from "@/lib/admin/coach-override-form";

type Props = {
  schedule: WeeklyTrainingSchedule | null;
  compact?: boolean;
};

export function WeeklySchedulePreview({ schedule, compact = false }: Props) {
  if (!schedule) {
    return <p className="cc-muted">لا معاينة أسبوعية متاحة — تظهر بعد توليد البرنامج من المحرك.</p>;
  }

  return (
    <div className={compact ? "cc-weekly-schedule cc-weekly-schedule--compact" : "cc-weekly-schedule"}>
      <p className="cc-meta">
        {schedule.trainingDaysPerWeek} أيام تدريب · المصدر:{" "}
        {schedule.placementSource === "CLIENT_PREFERENCE"
          ? "تفضيل العميل"
          : schedule.placementSource === "FALLBACK"
            ? "توزيع افتراضي"
            : "مختلط"}
      </p>
      <ul className="cc-weekly-schedule__list">
        {schedule.days.map((day) => (
          <li key={day.weekdayId} className={day.dayKind === "REST" ? "is-rest" : "is-workout"}>
            <span className="cc-weekly-schedule__day">{WEEKDAY_LABELS_AR[day.weekdayId]}</span>
            <span className="cc-weekly-schedule__label">
              {day.dayKind === "REST"
                ? "راحة"
                : day.workout?.title || day.workout?.role || "تمرين"}
            </span>
          </li>
        ))}
      </ul>
      {schedule.warnings.length > 0 ? (
        <p className="cc-muted">تحذيرات التقويم: {schedule.warnings.join(" · ")}</p>
      ) : null}
    </div>
  );
}
