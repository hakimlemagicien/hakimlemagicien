import { useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  GripVertical,
  ImagePlus,
  Library,
  Link2,
  Pencil,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AdminExercisePicker } from "@/components/admin/AdminExercisePicker";
import {
  AdminLibraryStatusBadge,
  AdminSaveState,
  firstFieldError,
  useDebouncedValue,
} from "@/components/admin/AdminLibraryKit";
import {
  EXERCISE_DIFFICULTIES,
  EXERCISE_TYPES,
  PROGRAM_GOALS,
  PROGRAM_LEVELS,
  PROGRAM_VERSIONING_COMPLETION_REQUIRED,
  programGoalLabel,
  programLevelLabel,
  programStatusLabel,
  type LibrarySaveState,
} from "@/lib/admin/admin-libraries";
import {
  fetchExerciseFilterOptions,
  listAdminExercises,
  type AdminExerciseListItem,
} from "@/lib/admin/admin-exercises-api";
import {
  addWeekToDraft,
  addWorkoutDayInWeek,
  applyPatternToSelection,
  builderMetadataFrom,
  convertDayType,
  copyDayToClipboard,
  duplicateExerciseAt,
  duplicateWeekInDraft,
  estimateDayMinutes,
  exercisePatternLabel,
  exerciseRoleLabel,
  formatReps,
  formatRest,
  formatRir,
  moveItemToIndex,
  parseRepsInput,
  parseRestInput,
  parseRir,
  pasteDayFromClipboard,
  patchDay,
  patchExercise,
  patchExercises,
  setBuilderField,
  summarizeProgramDraft,
  targetMuscleLabelsForDay,
  totalSetsForDay,
  workoutOrdinal,
  type DayClipboard,
  type ExercisePattern,
  type ExerciseRole,
} from "@/lib/admin/admin-program-builder";
import {
  PROGRAM_LOCATIONS,
  countWorkoutDays,
  programLocationLabel,
  rebuildWeekKeepingWorkouts,
  type ProgramLocation,
} from "@/lib/admin/admin-program-ops";
import {
  emptyProgramExercise,
  uploadProgramCoverImage,
  validateProgramCoverFile,
  type AdminProgramDetail,
} from "@/lib/admin/admin-programs-api";
import { WEEKDAY_LABELS_AR } from "@/lib/admin/coach-override-form";
import { WEEKDAY_CALENDAR_ORDER } from "@/lib/platform/strategy-matrix/weekdays";
import { getExerciseStageListThumb } from "@/lib/platform/exercise-stage-media";

type Props = {
  draft: AdminProgramDetail;
  setDraft: (draft: AdminProgramDetail) => void;
  structureLocked: boolean;
  saveState: LibrarySaveState;
  fieldErrors: Record<string, string>;
  dirty: boolean;
  publishIssues: string[];
  initialPreview?: boolean;
  onBack: () => void;
  onSave: () => void;
  onPublish: () => void;
  onCloneVersion?: () => void;
};

const TYPE_LABELS: Record<string, string> = {
  strength: "قوة",
  cardio: "كارديو",
  mobility: "حركة",
  warmup: "إحماء",
  other: "أخرى",
};

export function AdminProgramBuilder({
  draft,
  setDraft,
  structureLocked,
  saveState,
  fieldErrors,
  dirty,
  publishIssues,
  initialPreview = false,
  onBack,
  onSave,
  onPublish,
  onCloneVersion,
}: Props) {
  const [weekIndex, setWeekIndex] = useState(0);
  const [dayIndex, setDayIndex] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(initialPreview);
  const [coverOpen, setCoverOpen] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [clipboard, setClipboard] = useState<DayClipboard | null>(null);
  const [picker, setPicker] = useState<"add" | number | null>(null);
  const [libQuery, setLibQuery] = useState("");
  const [libMuscle, setLibMuscle] = useState("");
  const [libEquipment, setLibEquipment] = useState("");
  const [libLevel, setLibLevel] = useState("");
  const [libType, setLibType] = useState("");
  const [libRows, setLibRows] = useState<AdminExerciseListItem[]>([]);
  const [libTotal, setLibTotal] = useState(0);
  const [libLoading, setLibLoading] = useState(false);
  const [libOpen, setLibOpen] = useState(false);
  const [muscles, setMuscles] = useState<Array<{ id: string; name_ar: string }>>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>([]);
  const dragFrom = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const draggedLibrary = useRef<AdminExerciseListItem | null>(null);
  const debouncedQuery = useDebouncedValue(libQuery);
  const builder = builderMetadataFrom(draft.metadata);
  const week = draft.weeks[weekIndex] ?? draft.weeks[0];
  const day = week?.days[dayIndex] ?? week?.days[0];
  const locked = structureLocked || Boolean(draft.archived_at);
  const estimated = day ? estimateDayMinutes(day) : 0;
  const summary = useMemo(() => summarizeProgramDraft(draft), [draft]);

  useEffect(() => {
    void fetchExerciseFilterOptions().then((options) => {
      setMuscles(options.muscles.map((row) => ({ id: row.id, name_ar: row.name_ar })));
      setEquipmentOptions(options.equipment);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLibLoading(true);
    void listAdminExercises({
      query: debouncedQuery,
      muscle: libMuscle || null,
      equipment: libEquipment || null,
      difficulty: libLevel || null,
      type: libType || null,
      active: true,
      offset: 0,
      limit: 50,
    })
      .then((result) => {
        if (cancelled) return;
        setLibRows(result.rows);
        setLibTotal(result.totalCount);
      })
      .finally(() => {
        if (!cancelled) setLibLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, libMuscle, libEquipment, libLevel, libType]);

  useEffect(() => {
    if (weekIndex >= draft.weeks.length) setWeekIndex(Math.max(0, draft.weeks.length - 1));
  }, [draft.weeks.length, weekIndex]);

  useEffect(() => {
    const currentWeek = draft.weeks[weekIndex];
    const firstWorkout = currentWeek?.days.findIndex((row) => row.day_type === "workout") ?? 0;
    setDayIndex(firstWorkout >= 0 ? firstWorkout : 0);
    setSelectedExercise(0);
    // Only when switching weeks — do not steal a rest-day click.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekIndex]);

  if (!week || !day) return null;

  const selected = day.exercises[selectedExercise] ?? day.exercises[0] ?? null;
  const selectedLibrary = selected ? libRows.find((row) => row.id === selected.exercise_id) : null;
  const alternativeCandidates = libRows.filter((row) => {
    if (!selected) return false;
    if (row.id === selected.exercise_id) return false;
    if (!selectedLibrary) return true;
    return row.muscle_group_name_ar === selectedLibrary.muscle_group_name_ar;
  });

  const updateWeeks = (weeks: AdminProgramDetail["weeks"], extra?: Partial<AdminProgramDetail>) => {
    setDraft({ ...draft, ...extra, weeks });
  };

  const addFromLibrary = (item: AdminExerciseListItem) => {
    if (locked) return;
    let nextDay = day;
    let daysPerWeek = draft.days_per_week;
    if (day.day_type !== "workout") {
      const weekday = WEEKDAY_CALENDAR_ORDER[dayIndex] ?? "sun";
      nextDay = convertDayType(day, "workout", WEEKDAY_LABELS_AR[weekday]);
      daysPerWeek = countWorkoutDays(week.days.map((row, index) => (index === dayIndex ? nextDay : row)));
    }
    const nextExercises = [
      ...nextDay.exercises,
      emptyProgramExercise({
        id: item.id,
        name_ar: item.name_ar,
        name_en: item.name_en,
        external_id: item.external_id,
      }),
    ];
    updateWeeks(patchDay(draft, weekIndex, dayIndex, { ...nextDay, exercises: nextExercises }), {
      days_per_week: daysPerWeek,
    });
    setSelectedExercise(nextExercises.length - 1);
    setLibOpen(false);
  };

  const replaceExercise = (item: AdminExerciseListItem, index: number) => {
    if (locked) return;
    updateWeeks(
      patchExercise(draft, weekIndex, dayIndex, index, {
        ...emptyProgramExercise({
          id: item.id,
          name_ar: item.name_ar,
          name_en: item.name_en,
          external_id: item.external_id,
        }),
        sets: day.exercises[index]?.sets ?? 3,
        reps_min: day.exercises[index]?.reps_min ?? 8,
        reps_max: day.exercises[index]?.reps_max ?? 12,
        rest_seconds: day.exercises[index]?.rest_seconds ?? 90,
        rir: day.exercises[index]?.rir,
        tempo: day.exercises[index]?.tempo,
        notes_ar: day.exercises[index]?.notes_ar ?? "",
        role: day.exercises[index]?.role,
      }),
    );
  };

  const addAlternative = (item: AdminExerciseListItem) => {
    if (!selected || locked) return;
    const current = selected.alternatives ?? [];
    if (current.some((row) => row.exercise_id === item.id)) return;
    updateWeeks(
      patchExercise(draft, weekIndex, dayIndex, selectedExercise, {
        alternatives: [...current, { exercise_id: item.id, name_ar: item.name_ar, name_en: item.name_en, external_id: item.external_id }],
      }),
    );
  };

  return (
    <div className="cc-builder">
      <div className="cc-builder__toolbar">
        <button type="button" className="cc-btn cc-btn--ghost" onClick={onBack}>
          العودة للقائمة
        </button>
        <AdminLibraryStatusBadge
          status={draft.archived_at ? "archived" : draft.is_published ? "published" : "draft"}
          label={programStatusLabel(draft.is_published, draft.archived_at)}
        />
        <span className="cc-muted">قالب برنامج · V{draft.version}</span>
        <div className="cc-builder__toolbar-meta">
          <AdminSaveState state={saveState} />
          <button type="button" className="cc-btn cc-btn--ghost" onClick={() => setPreviewOpen(true)}>
            معاينة كعميل
          </button>
          <button type="button" className="cc-btn cc-btn--primary" disabled={saveState === "saving" || Boolean(draft.archived_at)} onClick={onSave}>
            حفظ مسودة
          </button>
          {draft.id && !draft.archived_at && !draft.is_published ? (
            <button type="button" className="cc-btn cc-btn--primary" disabled={dirty} onClick={onPublish}>
              نشر
            </button>
          ) : null}
          {draft.id && draft.is_published && !draft.archived_at && onCloneVersion ? (
            <button type="button" className="cc-btn" onClick={onCloneVersion}>
              نسخة جديدة
            </button>
          ) : null}
        </div>
      </div>

      <p className="cc-contract">PROGRAM_TEMPLATE ≠ CLIENT_ASSIGNED_PROGRAM · تعديل القالب لا يغيّر برامج العملاء المعيّنة.</p>
      {PROGRAM_VERSIONING_COMPLETION_REQUIRED ? (
        <p className="cc-muted">لقطة الهيكل غير مكتملة بعد. لا تعامل رقم الإصدار كتجميد كامل للمحتوى.</p>
      ) : null}
      {locked ? <p className="cc-muted">القالب المنشور للقراءة. أنشئ نسخة جديدة لتعديل الحصص حتى لا تتأثر التعيينات.</p> : null}
      {firstFieldError(fieldErrors) ? <p className="cc-field__error">{firstFieldError(fieldErrors)}</p> : null}
      {publishIssues.length ? (
        <div className="cc-builder-issues" role="alert">
          {publishIssues.map((issue) => (
            <p key={issue}>{issue}</p>
          ))}
        </div>
      ) : null}

      <section className="cc-builder__card cc-builder__info">
        <button
          type="button"
          className="cc-builder__cover"
          disabled={Boolean(draft.archived_at)}
          onClick={() => {
            setCoverUrl(builder.cover_image_url ?? "");
            setCoverFile(null);
            setCoverPreview(builder.cover_image_url || null);
            setCoverError(null);
            setCoverOpen(true);
          }}
        >
          {builder.cover_image_url ? <img src={builder.cover_image_url} alt="" /> : <span>غلاف</span>}
          <span className="cc-builder__cover-btn">
            <ImagePlus size={14} /> تغيير
          </span>
        </button>
        <div>
          <div className="cc-builder__info-head">
            <h3>معلومات البرنامج</h3>
            <p className="cc-muted">للمدرب فقط · العميل يرى الهدف لا اسم القالب</p>
          </div>
          <div className="cc-builder__fields">
            <label className="cc-builder__field">
              اسم البرنامج
              <input value={draft.name_ar} disabled={Boolean(draft.archived_at)} onChange={(event) => setDraft({ ...draft, name_ar: event.target.value })} />
            </label>
            <label className="cc-builder__field">
              الهدف
              <select value={draft.goal ?? ""} disabled={Boolean(draft.archived_at)} onChange={(event) => setDraft({ ...draft, goal: event.target.value })}>
                {PROGRAM_GOALS.map((item) => (
                  <option key={item} value={item}>
                    {programGoalLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="cc-builder__field">
              المستوى
              <select value={draft.level ?? ""} disabled={Boolean(draft.archived_at)} onChange={(event) => setDraft({ ...draft, level: event.target.value })}>
                {PROGRAM_LEVELS.map((item) => (
                  <option key={item} value={item}>
                    {programLevelLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="cc-builder__field">
              المكان
              <select
                value={draft.training_location ?? "GYM"}
                disabled={Boolean(draft.archived_at)}
                onChange={(event) => setDraft({ ...draft, training_location: event.target.value })}
              >
                {PROGRAM_LOCATIONS.map((item) => (
                  <option key={item} value={item}>
                    {programLocationLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="cc-builder__field">
              أيام/أسبوع
              <select
                value={String(draft.days_per_week)}
                disabled={locked}
                onChange={(event) => {
                  const days = Number(event.target.value) || 3;
                  setDraft({
                    ...draft,
                    days_per_week: days,
                    weeks: draft.weeks.map((row) => rebuildWeekKeepingWorkouts(row, days)),
                  });
                }}
              >
                {[2, 3, 4, 5, 6].map((days) => (
                  <option key={days} value={String(days)}>
                    {days}
                  </option>
                ))}
              </select>
            </label>
            <label className="cc-builder__field">
              مدة مستهدفة
              <input
                type="number"
                value={String(draft.session_minutes ?? 60)}
                disabled={Boolean(draft.archived_at)}
                onChange={(event) => setDraft({ ...draft, session_minutes: Number(event.target.value) || 60 })}
              />
            </label>
          </div>
        </div>
      </section>

      <details className="cc-builder__card cc-builder__extras">
        <summary>ملاحظات المدرب · التقدم · الوصف · المعدات</summary>
        <div className="cc-builder__fields cc-builder__fields--extras">
          <label className="cc-builder__field">
            ملاحظات الأسبوع
            <input
              value={week.notes_ar ?? ""}
              disabled={locked}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  weeks: draft.weeks.map((row, index) => (index === weekIndex ? { ...row, notes_ar: event.target.value } : row)),
                })
              }
            />
          </label>
          <label className="cc-builder__field">
            ملاحظات المدرب
            <input
              value={builder.coach_notes ?? ""}
              disabled={Boolean(draft.archived_at)}
              onChange={(event) => setDraft(setBuilderField(draft, { coach_notes: event.target.value }))}
            />
          </label>
          <label className="cc-builder__field">
            قواعد التقدم أسبوعياً
            <input
              value={builder.progression_notes ?? ""}
              disabled={Boolean(draft.archived_at)}
              onChange={(event) => setDraft(setBuilderField(draft, { progression_notes: event.target.value }))}
            />
          </label>
          <label className="cc-builder__field">
            المعدات
            <input value={draft.equipment} disabled={Boolean(draft.archived_at)} onChange={(event) => setDraft({ ...draft, equipment: event.target.value })} />
          </label>
          <label className="cc-builder__field cc-builder__field--wide">
            وصف البرنامج
            <textarea
              value={draft.description_ar ?? ""}
              disabled={Boolean(draft.archived_at)}
              onChange={(event) => setDraft({ ...draft, description_ar: event.target.value })}
            />
          </label>
        </div>
      </details>

      <section className="cc-builder__card cc-builder__schedule">
        <div className="cc-builder__schedule-head">
          <div className="cc-builder__weeks">
            {draft.weeks.map((row, index) => (
              <button
                key={row.week_number ?? index}
                type="button"
                className={index === weekIndex ? "cc-builder__week-tab is-active" : "cc-builder__week-tab"}
                onClick={() => {
                  setWeekIndex(index);
                  setDayIndex(0);
                  setSelectedExercise(0);
                }}
              >
                الأسبوع {index + 1}
              </button>
            ))}
            <button
              type="button"
              className="cc-builder__add"
              disabled={locked}
              onClick={() => {
                const next = addWeekToDraft(draft);
                setDraft(next);
                setWeekIndex(next.weeks.length - 1);
                setDayIndex(0);
              }}
            >
              إضافة أسبوع +
            </button>
            <button type="button" className="cc-builder__add" disabled={locked} onClick={() => setDraft(duplicateWeekInDraft(draft, weekIndex))}>
              نسخ الأسبوع
            </button>
          </div>
        </div>
        <div className="cc-builder__days">
          {week.days.map((row, index) => {
            const rest = row.day_type !== "workout";
            const ordinal = workoutOrdinal(week, index);
            return (
              <button
                key={row.day_number ?? index}
                type="button"
                className={[
                  "cc-builder__day-tab",
                  index === dayIndex ? "is-active" : "",
                  rest ? "is-rest" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => {
                  setDayIndex(index);
                  setSelectedExercise(0);
                }}
              >
                <strong>{rest ? "راحة" : row.title_ar || `اليوم ${ordinal}`}</strong>
                <small>{rest ? "بدون تمارين" : `${row.exercises.length} تمرين`}</small>
              </button>
            );
          })}
          <button
            type="button"
            className="cc-builder__add"
            disabled={locked || week.days.every((row) => row.day_type === "workout")}
            onClick={() => {
              const weekday = WEEKDAY_CALENDAR_ORDER[week.days.findIndex((row) => row.day_type !== "workout")] ?? "sun";
              const nextWeek = addWorkoutDayInWeek(week, WEEKDAY_LABELS_AR[weekday]);
              const daysPerWeek = countWorkoutDays(nextWeek.days);
              updateWeeks(
                draft.weeks.map((row, index) => (index === weekIndex ? nextWeek : row)),
                { days_per_week: daysPerWeek },
              );
            }}
          >
            إضافة يوم +
          </button>
        </div>
        <div className="cc-builder-kpis" aria-label="ملخص البرنامج قبل النشر">
          <span>
            <b>{summary.weeks}</b> أسابيع
          </span>
          <span>
            <b>{summary.workoutDays}</b> أيام تدريب
          </span>
          <span>
            <b>{summary.exercises}</b> تمارين
          </span>
          <span>
            <b>{summary.muscles.join(" · ") || "—"}</b> عضلات
          </span>
          <span>
            <b>{summary.equipment.join("، ") || draft.equipment || "—"}</b> معدات
          </span>
        </div>
      </section>

      <button type="button" className="cc-builder-lib-toggle" onClick={() => setLibOpen(true)}>
        <Library size={16} /> مكتبة التمارين
      </button>

      {libOpen ? (
        <button type="button" className="cc-builder-lib-backdrop" aria-label="إغلاق المكتبة" onClick={() => setLibOpen(false)} />
      ) : null}

      <div className="cc-builder__workspace">
        <aside className={libOpen ? "cc-builder__card cc-builder-lib is-open" : "cc-builder__card cc-builder-lib"}>
          <div className="cc-builder-lib__head">
            <h3>مكتبة التمارين</h3>
            <button type="button" className="cc-icon-btn cc-builder-lib__close" onClick={() => setLibOpen(false)} aria-label="إغلاق المكتبة">
              <X size={16} />
            </button>
          </div>
          <div className="cc-builder-lib__search">
            <Search size={16} />
            <input value={libQuery} onChange={(event) => setLibQuery(event.target.value)} placeholder="بحث عن تمرين..." aria-label="بحث التمارين" />
          </div>
          <div className="cc-builder-chips">
            <button type="button" className={!libMuscle ? "cc-builder-chip is-active" : "cc-builder-chip"} onClick={() => setLibMuscle("")}>
              الكل
            </button>
            {muscles.map((muscle) => (
              <button
                key={muscle.id}
                type="button"
                className={libMuscle === muscle.id ? "cc-builder-chip is-active" : "cc-builder-chip"}
                onClick={() => setLibMuscle(muscle.id)}
              >
                {muscle.name_ar}
              </button>
            ))}
          </div>
          <div className="cc-builder-lib__filters">
            <select value={libEquipment} onChange={(event) => setLibEquipment(event.target.value)} aria-label="المعدات">
              <option value="">كل المعدات</option>
              {equipmentOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select value={libLevel} onChange={(event) => setLibLevel(event.target.value)} aria-label="المستوى">
              <option value="">كل المستويات</option>
              {EXERCISE_DIFFICULTIES.map((item) => (
                <option key={item} value={item}>
                  {programLevelLabel(item)}
                </option>
              ))}
            </select>
            <select value={libType} onChange={(event) => setLibType(event.target.value)} aria-label="نوع الحركة">
              <option value="">كل الأنواع</option>
              {EXERCISE_TYPES.map((item) => (
                <option key={item} value={item}>
                  {TYPE_LABELS[item] ?? item}
                </option>
              ))}
            </select>
          </div>
          {libLoading ? <p className="cc-muted">جاري التحميل…</p> : null}
          {libRows.map((item) => {
            const thumb = getExerciseStageListThumb(item.external_id);
            return (
              <article
                key={item.id}
                className="cc-builder-lib-card"
                draggable={!locked}
                onDragStart={() => {
                  draggedLibrary.current = item;
                  dragFrom.current = null;
                }}
              >
                <GripVertical className="cc-builder-drag" size={16} />
                {thumb ? <img src={thumb} alt="" /> : <span className="cc-builder-thumb" />}
                <div>
                  <strong>{item.name_ar}</strong>
                  <div className="cc-builder-tags">
                    {item.muscle_group_name_ar ? <span className="cc-builder-tag">{item.muscle_group_name_ar}</span> : null}
                    {item.exercise_type ? <span className="cc-builder-tag">{TYPE_LABELS[item.exercise_type] ?? item.exercise_type}</span> : null}
                    {item.equipment ? <span className="cc-builder-tag">{item.equipment}</span> : null}
                  </div>
                </div>
                <button type="button" className="cc-plus-btn" disabled={locked} onClick={() => addFromLibrary(item)} aria-label={`إضافة ${item.name_ar}`}>
                  +
                </button>
              </article>
            );
          })}
          {!libLoading && libRows.length === 0 ? <p className="cc-muted">لا توجد تمارين مطابقة.</p> : null}
          {libTotal > libRows.length ? <p className="cc-muted">{libTotal} تمرين — استخدم البحث لتضييق النتائج.</p> : null}
        </aside>

        <section className="cc-builder__card cc-builder-day">
          <div className="cc-builder-day__head">
            <div className="cc-builder-day__title">
              <Pencil size={16} />
              <input
                value={day.title_ar}
                disabled={locked || day.day_type !== "workout"}
                onChange={(event) => updateWeeks(patchDay(draft, weekIndex, dayIndex, { title_ar: event.target.value }))}
              />
            </div>
            <span className="cc-builder-est">مدة الحصة المقدرة: {day.day_type === "workout" ? estimated : 0} دقيقة</span>
          </div>

          {day.day_type !== "workout" ? (
            <div className="cc-builder-rest">
              <p>يوم راحة — لا تمارين في هذا اليوم.</p>
              <button
                type="button"
                className="cc-btn cc-btn--primary"
                disabled={locked}
                onClick={() => {
                  const weekday = WEEKDAY_CALENDAR_ORDER[dayIndex] ?? "sun";
                  const nextDay = convertDayType(day, "workout", WEEKDAY_LABELS_AR[weekday]);
                  const nextDays = week.days.map((row, index) => (index === dayIndex ? nextDay : row));
                  updateWeeks(patchDay(draft, weekIndex, dayIndex, nextDay), { days_per_week: countWorkoutDays(nextDays) });
                }}
              >
                تحويل إلى يوم تدريب
              </button>
              {clipboard ? (
                <button
                  type="button"
                  className="cc-btn"
                  disabled={locked}
                  onClick={() => {
                    const nextDay = pasteDayFromClipboard(day, clipboard);
                    const nextDays = week.days.map((row, index) => (index === dayIndex ? nextDay : row));
                    updateWeeks(patchDay(draft, weekIndex, dayIndex, nextDay), { days_per_week: countWorkoutDays(nextDays) });
                  }}
                >
                  لصق اليوم المنسوخ
                </button>
              ) : null}
            </div>
          ) : (
            <>
              <div
                className="cc-builder-table-wrap"
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggedLibrary.current) addFromLibrary(draggedLibrary.current);
                  draggedLibrary.current = null;
                }}
              >
                {day.exercises.length === 0 ? (
                  <div className="cc-builder-dropzone">
                    <p>اسحب تمريناً من المكتبة أو أضفه من هنا</p>
                    <button type="button" className="cc-builder-add-ex" disabled={locked} onClick={() => setPicker("add")}>
                      إضافة تمرين +
                    </button>
                  </div>
                ) : (
                <table className="cc-builder-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>التمرين</th>
                      <th>المجموعات</th>
                      <th>التكرارات</th>
                      <th>الراحة</th>
                      <th>RIR</th>
                      <th>Tempo</th>
                      <th>الملاحظات</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {day.exercises.map((exercise, index) => {
                      const thumb = getExerciseStageListThumb(exercise.exercise_external_id);
                      return (
                        <tr
                          key={`${exercise.exercise_id}-${index}`}
                          className={[
                            "cc-builder-row",
                            index === selectedExercise ? "is-selected" : "",
                            dragOver === index ? "is-drag" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={() => setSelectedExercise(index)}
                          onDragOver={(event) => {
                            event.preventDefault();
                            setDragOver(index);
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            if (draggedLibrary.current) {
                              addFromLibrary(draggedLibrary.current);
                              draggedLibrary.current = null;
                              return;
                            }
                            if (dragFrom.current == null || locked) return;
                            updateWeeks(patchExercises(draft, weekIndex, dayIndex, moveItemToIndex(day.exercises, dragFrom.current, index)));
                            setSelectedExercise(index);
                            dragFrom.current = null;
                            setDragOver(null);
                          }}
                        >
                          <td>
                            <span
                              className="cc-builder-drag"
                              draggable={!locked}
                              onDragStart={() => {
                                dragFrom.current = index;
                                draggedLibrary.current = null;
                              }}
                            >
                              <GripVertical size={16} />
                            </span>
                            {index + 1}
                          </td>
                          <td>
                            <div className="cc-builder-ex">
                              <button type="button" className="cc-builder-ex" disabled={locked} onClick={() => setPicker(index)}>
                                {thumb ? <img src={thumb} alt="" className="cc-builder-thumb" /> : <span className="cc-builder-thumb" />}
                                <span className="cc-builder-ex-name">
                                  <strong>{exercise.exercise_name_ar || "اختيار تمرين"}</strong>
                                </span>
                              </button>
                              <select
                                value={exercise.role ?? "main"}
                                disabled={locked}
                                aria-label="دور التمرين"
                                onChange={(event) =>
                                  updateWeeks(patchExercise(draft, weekIndex, dayIndex, index, { role: event.target.value as ExerciseRole }))
                                }
                              >
                                <option value="warmup">إحماء</option>
                                <option value="main">أساسي</option>
                                <option value="accessory">مساعد</option>
                                <option value="finisher">ختام</option>
                              </select>
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              disabled={locked}
                              value={exercise.sets}
                              onChange={(event) =>
                                updateWeeks(patchExercise(draft, weekIndex, dayIndex, index, { sets: Number(event.target.value) || 0 }))
                              }
                            />
                          </td>
                          <td>
                            <input
                              disabled={locked}
                              value={formatReps(exercise)}
                              onChange={(event) => updateWeeks(patchExercise(draft, weekIndex, dayIndex, index, parseRepsInput(event.target.value)))}
                            />
                          </td>
                          <td>
                            <input
                              disabled={locked}
                              value={formatRest(exercise.rest_seconds)}
                              onChange={(event) =>
                                updateWeeks(patchExercise(draft, weekIndex, dayIndex, index, { rest_seconds: parseRestInput(event.target.value) }))
                              }
                            />
                          </td>
                          <td>
                            <input
                              disabled={locked}
                              value={formatRir(exercise.rir)}
                              onChange={(event) =>
                                updateWeeks(patchExercise(draft, weekIndex, dayIndex, index, { rir: parseRir(event.target.value) }))
                              }
                            />
                          </td>
                          <td>
                            <input
                              disabled={locked}
                              value={exercise.tempo ?? ""}
                              placeholder="2-0-2"
                              onChange={(event) => updateWeeks(patchExercise(draft, weekIndex, dayIndex, index, { tempo: event.target.value }))}
                            />
                          </td>
                          <td>
                            <input
                              className="cc-builder-notes"
                              disabled={locked}
                              value={exercise.notes_ar ?? ""}
                              onChange={(event) => updateWeeks(patchExercise(draft, weekIndex, dayIndex, index, { notes_ar: event.target.value }))}
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="cc-icon-btn"
                              disabled={locked}
                              aria-label="نسخ التمرين"
                              onClick={() => {
                                updateWeeks(patchExercises(draft, weekIndex, dayIndex, duplicateExerciseAt(day.exercises, index)));
                                setSelectedExercise(index + 1);
                              }}
                            >
                              <Copy size={16} />
                            </button>
                            <button
                              type="button"
                              className="cc-icon-btn is-danger"
                              disabled={locked}
                              aria-label="حذف التمرين"
                              onClick={() =>
                                updateWeeks(
                                  patchExercises(
                                    draft,
                                    weekIndex,
                                    dayIndex,
                                    day.exercises.filter((_, rowIndex) => rowIndex !== index),
                                  ),
                                )
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                )}
              </div>
              <div className="cc-builder-day__actions">
                {day.exercises.length > 0 ? (
                  <button type="button" className="cc-builder-add-ex" disabled={locked} onClick={() => setPicker("add")}>
                    إضافة تمرين +
                  </button>
                ) : null}
                <button
                  type="button"
                  className="cc-btn cc-btn--ghost"
                  disabled={locked}
                  onClick={() => setClipboard(copyDayToClipboard(day))}
                >
                  <Copy size={16} /> نسخ اليوم
                </button>
                <button
                  type="button"
                  className="cc-btn cc-btn--ghost"
                  disabled={locked || !clipboard}
                  onClick={() => clipboard && updateWeeks(patchDay(draft, weekIndex, dayIndex, pasteDayFromClipboard(day, clipboard)))}
                >
                  لصق اليوم
                </button>
                <button
                  type="button"
                  className="cc-btn cc-btn--ghost"
                  disabled={locked}
                  onClick={() => {
                    const weekday = WEEKDAY_CALENDAR_ORDER[dayIndex] ?? "sun";
                    const nextDay = convertDayType(day, "rest", `${WEEKDAY_LABELS_AR[weekday]} — راحة`);
                    const nextDays = week.days.map((row, index) => (index === dayIndex ? nextDay : row));
                    updateWeeks(patchDay(draft, weekIndex, dayIndex, nextDay), { days_per_week: Math.max(1, countWorkoutDays(nextDays)) });
                  }}
                >
                  <Trash2 size={16} /> حذف اليوم
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {day.day_type === "workout" ? (
        <details className="cc-builder__card cc-builder-footer">
          <summary>
            أدوات اليوم · بدائل وأنماط وملاحظات
            <span className="cc-muted">
              {day.exercises.length} تمارين · {estimated} د · {totalSetsForDay(day)} مجموعات
              {targetMuscleLabelsForDay(day).length ? ` · ${targetMuscleLabelsForDay(day).join(" - ")}` : ""}
            </span>
          </summary>
          <div className="cc-builder-footer__grid">
            <section>
              <h3>بدائل التمرين المحدد</h3>
              {!selected ? <p className="cc-muted">اختر تمريناً من الجدول.</p> : null}
              {(selected?.alternatives ?? []).map((alt) => (
                <div key={alt.exercise_id} className="cc-builder-alt-row">
                  <span>{alt.name_ar}</span>
                  <button
                    type="button"
                    className="cc-btn cc-btn--ghost"
                    disabled={locked}
                    onClick={() =>
                      replaceExercise(
                        {
                          id: alt.exercise_id,
                          name_ar: alt.name_ar,
                          name_en: alt.name_en ?? alt.name_ar,
                          external_id: alt.external_id,
                        } as AdminExerciseListItem,
                        selectedExercise,
                      )
                    }
                  >
                    استبدال
                  </button>
                </div>
              ))}
              {alternativeCandidates.slice(0, 5).map((item) => (
                <div key={item.id} className="cc-builder-alt-row">
                  <span>{item.name_ar}</span>
                  <button type="button" className="cc-plus-btn" disabled={locked} onClick={() => addAlternative(item)}>
                    +
                  </button>
                </div>
              ))}
            </section>
            <section>
              <h3>ملاحظات اليوم</h3>
              <textarea
                value={day.notes_ar ?? ""}
                disabled={locked}
                onChange={(event) => updateWeeks(patchDay(draft, weekIndex, dayIndex, { notes_ar: event.target.value }))}
              />
            </section>
            <section>
              <h3>أنماط متقدمة</h3>
              <div className="cc-builder-pattern">
                {(["superset", "circuit", "dropset"] as ExercisePattern[]).map((pattern) => (
                  <button
                    key={pattern}
                    type="button"
                    className={selected?.pattern === pattern ? "is-active" : undefined}
                    disabled={locked || !selected}
                    onClick={() =>
                      selected &&
                      updateWeeks(patchExercises(draft, weekIndex, dayIndex, applyPatternToSelection(day.exercises, selectedExercise, pattern)))
                    }
                  >
                    {exercisePatternLabel(pattern)}
                  </button>
                ))}
              </div>
              {selected?.pattern && selected.pattern !== "none" ? (
                <p className="cc-muted">
                  {exerciseRoleLabel(selected.role)} · {exercisePatternLabel(selected.pattern)}
                </p>
              ) : null}
            </section>
          </div>
        </details>
      ) : null}

      {coverOpen ? (
        <div
          className="cc-builder-preview"
          role="presentation"
          onClick={() => {
            if (coverUploading) return;
            setCoverOpen(false);
          }}
        >
          <div className="cc-builder__card cc-builder-cover-dialog" role="dialog" aria-label="صورة الغلاف" onClick={(event) => event.stopPropagation()}>
            <h3>
              <ImagePlus size={16} /> صورة غلاف البرنامج
            </h3>
            <p className="cc-muted">ارفع صورة من جهازك (JPG / PNG / WebP — حتى 5 ميغابايت)، أو الصق رابطاً عاماً.</p>

            {(coverPreview || builder.cover_image_url) ? (
              <div className="cc-builder-cover-dialog__preview">
                <img src={coverPreview || builder.cover_image_url || ""} alt="" />
              </div>
            ) : null}

            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                event.target.value = "";
                if (!file) return;
                const err = validateProgramCoverFile(file);
                if (err) {
                  setCoverError(err);
                  setCoverFile(null);
                  return;
                }
                if (coverPreview?.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
                setCoverError(null);
                setCoverFile(file);
                setCoverPreview(URL.createObjectURL(file));
              }}
            />

            <div className="cc-builder-day__actions">
              <button
                type="button"
                className="cc-btn cc-btn--primary"
                disabled={coverUploading || Boolean(draft.archived_at)}
                onClick={() => coverInputRef.current?.click()}
              >
                <Upload size={16} /> اختيار من الجهاز
              </button>
              {coverFile ? (
                <button
                  type="button"
                  className="cc-btn cc-btn--primary"
                  disabled={coverUploading || Boolean(draft.archived_at)}
                  onClick={() => {
                    void (async () => {
                      setCoverUploading(true);
                      setCoverError(null);
                      try {
                        const url = await uploadProgramCoverImage({
                          file: coverFile,
                          templateId: draft.id || null,
                        });
                        setDraft(setBuilderField(draft, { cover_image_url: url }));
                        setCoverUrl(url);
                        setCoverFile(null);
                        if (coverPreview?.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
                        setCoverPreview(url);
                        setCoverOpen(false);
                      } catch (error) {
                        setCoverError(error instanceof Error ? error.message : "فشل رفع الصورة.");
                      } finally {
                        setCoverUploading(false);
                      }
                    })();
                  }}
                >
                  {coverUploading ? "جاري الرفع…" : "رفع وحفظ"}
                </button>
              ) : null}
            </div>

            <label className="cc-builder__field" style={{ marginTop: 12 }}>
              <span className="cc-muted" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Link2 size={14} /> أو رابط عام
              </span>
              <input
                dir="ltr"
                value={coverUrl}
                disabled={coverUploading || Boolean(draft.archived_at)}
                onChange={(event) => setCoverUrl(event.target.value)}
                placeholder="https://"
              />
            </label>

            {coverError ? (
              <p className="cc-field__error" role="alert">
                {coverError}
              </p>
            ) : null}

            <div className="cc-builder-day__actions">
              <button
                type="button"
                className="cc-btn cc-btn--primary"
                disabled={coverUploading || Boolean(draft.archived_at) || Boolean(coverFile)}
                onClick={() => {
                  setDraft(setBuilderField(draft, { cover_image_url: coverUrl.trim() }));
                  setCoverOpen(false);
                }}
              >
                حفظ الرابط
              </button>
              {builder.cover_image_url ? (
                <button
                  type="button"
                  className="cc-btn cc-btn--ghost"
                  disabled={coverUploading || Boolean(draft.archived_at)}
                  onClick={() => {
                    setDraft(setBuilderField(draft, { cover_image_url: "" }));
                    setCoverUrl("");
                    setCoverFile(null);
                    if (coverPreview?.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
                    setCoverPreview(null);
                    setCoverOpen(false);
                  }}
                >
                  إزالة الصورة
                </button>
              ) : null}
              <button
                type="button"
                className="cc-btn cc-btn--ghost"
                disabled={coverUploading}
                onClick={() => {
                  if (coverPreview?.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
                  setCoverFile(null);
                  setCoverOpen(false);
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {previewOpen ? (
        <div className="cc-builder-preview" role="presentation" onClick={() => setPreviewOpen(false)}>
          <div className="cc-builder-preview__panel" role="dialog" aria-label="معاينة كعميل" onClick={(event) => event.stopPropagation()}>
            <div className="cc-builder-day__head">
              <div>
                <h3>معاينة كعميل</h3>
                <p className="cc-muted">هذه معاينة للقالب وليست برنامج عميل معيّن. العميل يرى هدفه لا اسم القالب.</p>
              </div>
              <button type="button" className="cc-btn cc-btn--ghost" onClick={() => setPreviewOpen(false)}>
                إغلاق
              </button>
            </div>
            <div className="cc-builder-preview__grid">
              <ul className="cc-weekly-schedule__list">
                {week.days.map((row, index) => (
                  <li key={index} className={row.day_type === "workout" ? undefined : "is-rest"}>
                    <span className="cc-weekly-schedule__day">{WEEKDAY_LABELS_AR[WEEKDAY_CALENDAR_ORDER[index] ?? "sun"]}</span>
                    {row.day_type === "workout" ? row.title_ar : "راحة"}
                  </li>
                ))}
              </ul>
              <div className="cc-builder-phone">
                <section
                  className="cc-builder-phone__hero"
                  style={builder.cover_image_url ? { backgroundImage: `url(${builder.cover_image_url})` } : undefined}
                >
                  <p className="cc-builder-phone__eyebrow">هدفك</p>
                  <h4>{programGoalLabel(draft.goal)}</h4>
                  <p>برنامجك مصمم خصيصاً لك بناءً على بياناتك وسيتم تحديثه كل أسبوع.</p>
                </section>
                <div className="cc-builder-phone__session">
                  <p className="cc-muted">
                    {programLevelLabel(draft.level)} · {programLocationLabel((draft.training_location || "GYM") as ProgramLocation)}
                  </p>
                  <strong>{day.day_type === "workout" ? day.title_ar : "يوم راحة"}</strong>
                  <span>{estimated} دقيقة</span>
                </div>
                {day.day_type !== "workout" ? (
                  <p className="cc-muted">استراحة اليوم — غداً نكمل الهدف.</p>
                ) : (
                  <ul>
                    {day.exercises.map((exercise, index) => {
                      const thumb = getExerciseStageListThumb(exercise.exercise_external_id);
                      return (
                        <li key={`${exercise.exercise_id}-${index}`}>
                          {thumb ? <img src={thumb} alt="" className="cc-builder-thumb" /> : <span className="cc-builder-thumb" />}
                          <span>
                            <strong>{exercise.exercise_name_ar}</strong>
                            <small className="cc-muted">
                              {exercise.sets} × {formatReps(exercise)} · راحة {formatRest(exercise.rest_seconds)}
                              {exercise.rir != null ? ` · RIR ${exercise.rir}` : ""}
                            </small>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <AdminExercisePicker
        open={picker != null}
        title="اختيار تمرين"
        onClose={() => setPicker(null)}
        onPick={(item) => {
          if (picker === "add") addFromLibrary(item);
          else if (typeof picker === "number") replaceExercise(item, picker);
          setPicker(null);
        }}
      />
    </div>
  );
}
