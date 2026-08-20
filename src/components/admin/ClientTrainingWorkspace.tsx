import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AdminCard,
  AdminEmptyState,
  AdminErrorState,
  AdminSearchInput,
  AdminSection,
  AdminStatusBadge,
} from "@/components/admin/AdminPage";
import {
  AdminField,
  AdminPagination,
  AdminSaveState,
  AdminSelect,
  useDebouncedValue,
  useUnsavedNavigation,
} from "@/components/admin/AdminLibraryKit";
import { type AdminConfirmRequest } from "@/components/admin/AdminConfirmDialog";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import {
  assignAdminClientProgram,
  endAdminClientProgram,
  getAdminClientAssignment,
  listAdminClientAssignments,
  listAdminClientSetLogs,
  saveAdminClientAssignmentExercises,
  type AdminAssignmentDetail,
  type AdminAssignmentExercise,
  type AdminAssignmentSummary,
  type AdminSetLogRow,
} from "@/lib/admin/admin-client-training-api";
import {
  assignmentStatusLabel,
  currentWeekNumber,
  formatRepsLabel,
  logIsLegacyUnlinked,
  objectiveSignalLabel,
  objectiveTrainingSignals,
  validateClientPrescription,
} from "@/lib/admin/admin-client-training";
import { listAdminExercises, type AdminExerciseListItem } from "@/lib/admin/admin-exercises-api";
import {
  getAdminProgramTemplate,
  listAdminProgramTemplates,
  type AdminProgramDetail,
  type AdminProgramListItem,
} from "@/lib/admin/admin-programs-api";
import {
  ADMIN_LIBRARY_PAGE_SIZE,
  PROGRAM_GOALS,
  PROGRAM_LEVELS,
  moveItem,
  translateLibraryError,
  type LibrarySaveState,
} from "@/lib/admin/admin-libraries";
import { formatAdminDate, formatRelativeAge } from "@/lib/admin/admin-status";
import { PROGRAM_BOUNDARIES } from "@/lib/admin/admin-architecture";
import type { AdminClientOverview } from "@/lib/admin/admin-clients-api";

const GOAL_LABELS: Record<string, string> = {
  cut: "تنشيف",
  bulk: "تضخيم",
  fitness: "لياقة",
  recomp: "إعادة تركيب",
};

type AssignStep = "closed" | "pick" | "preview" | "review";

export function ClientTrainingWorkspace({
  clientId,
  conversationId,
  overview,
  tab,
  onOverviewRefresh,
  onConfirm,
}: {
  clientId: string;
  conversationId?: string | null;
  overview: AdminClientOverview;
  tab: "training" | "progress";
  onOverviewRefresh: () => Promise<void>;
  onConfirm: (request: AdminConfirmRequest) => void;
}) {
  const [detail, setDetail] = useState<AdminAssignmentDetail | null>(null);
  const [history, setHistory] = useState<AdminAssignmentSummary[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [logs, setLogs] = useState<AdminSetLogRow[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsOffset, setLogsOffset] = useState(0);
  const [exerciseFilter, setExerciseFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdminAssignmentDetail | null>(null);
  const [saveState, setSaveState] = useState<LibrarySaveState>("saved");
  const [editing, setEditing] = useState(false);
  const [assignStep, setAssignStep] = useState<AssignStep>("closed");
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerGoal, setPickerGoal] = useState("");
  const [pickerLevel, setPickerLevel] = useState("");
  const [pickerDays, setPickerDays] = useState("");
  const [pickerRows, setPickerRows] = useState<AdminProgramListItem[]>([]);
  const [preview, setPreview] = useState<AdminProgramDetail | null>(null);
  const [startsOn, setStartsOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [pickerOpen, setPickerOpen] = useState<{ week: number; day: number; exercise: number } | null>(null);
  const [exerciseRows, setExerciseRows] = useState<AdminExerciseListItem[]>([]);
  const exerciseQuery = useDebouncedValue(pickerQuery, 280);
  const templateQuery = useDebouncedValue(pickerQuery, 280);
  const dirty = Boolean(editing && draft && detail && JSON.stringify(draft.weeks) !== JSON.stringify(detail.weeks));
  const guard = useUnsavedNavigation(dirty, onConfirm);

  const signals = objectiveTrainingSignals({
    status: overview.assignment?.status ?? null,
    startsOn: overview.assignment?.starts_on ?? null,
    durationWeeks: overview.assignment?.duration_weeks ?? null,
    snapshotComplete: overview.assignment?.snapshot_complete ?? null,
  });
  const weekInfo = currentWeekNumber({
    startsOn: overview.assignment?.starts_on ?? null,
    durationWeeks: overview.assignment?.duration_weeks ?? null,
  });

  const loadAssignment = async (id: string) => {
    const row = await getAdminClientAssignment(id);
    setDetail(row);
    setDraft(row);
    setEditing(false);
    setSaveState("saved");
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    const id = overview.assignment?.id;
    void Promise.all([
      id ? getAdminClientAssignment(id) : Promise.resolve(null),
      listAdminClientAssignments(clientId, 0),
    ])
      .then(([row, list]) => {
        setDetail(row);
        setDraft(row);
        setHistory(list.rows);
        setHistoryTotal(list.totalCount);
        setHistoryOffset(0);
      })
      .catch((err) => {
        console.error(err);
        setError("تعذر تحميل البرنامج.");
      })
      .finally(() => setLoading(false));
  }, [clientId, overview.assignment?.id]);

  useEffect(() => {
    if (tab !== "progress") return;
    setLogsLoading(true);
    void listAdminClientSetLogs({ clientId, exerciseId: exerciseFilter || null, offset: logsOffset })
      .then((result) => {
        setLogs(result.rows);
        setLogsTotal(result.totalCount);
      })
      .catch((err) => {
        console.error(err);
        setError("تعذر تحميل سجل التمرين.");
      })
      .finally(() => setLogsLoading(false));
  }, [clientId, tab, exerciseFilter, logsOffset]);

  useEffect(() => {
    if (assignStep !== "pick") return;
    void listAdminProgramTemplates({
      query: templateQuery,
      goal: pickerGoal || null,
      level: pickerLevel || null,
      status: "published",
    })
      .then((result) => {
        const rows = pickerDays
          ? result.rows.filter((row) => String(row.days_per_week) === pickerDays)
          : result.rows;
        setPickerRows(rows);
      })
      .catch((err) => {
        console.error(err);
        setError(translateLibraryError(err));
      });
  }, [assignStep, templateQuery, pickerGoal, pickerLevel, pickerDays]);

  useEffect(() => {
    if (!pickerOpen) return;
    void listAdminExercises({ query: exerciseQuery, active: true }).then((result) => setExerciseRows(result.rows));
  }, [pickerOpen, exerciseQuery]);

  const flattenExercises = (row: AdminAssignmentDetail) => {
    const exercises: Array<Record<string, unknown>> = [];
    row.weeks.forEach((week) => {
      week.days.forEach((day) => {
        day.exercises.forEach((exercise, index) => {
          exercises.push({
            id: exercise.id,
            exercise_id: exercise.exercise_id,
            sort_order: index,
            sets: exercise.sets,
            reps_min: exercise.reps_min,
            reps_max: exercise.reps_max,
            reps_label: exercise.reps_label,
            rest_seconds: exercise.rest_seconds,
            suggested_weight_kg: exercise.suggested_weight_kg,
            notes_ar: exercise.notes_ar,
          });
        });
      });
    });
    return exercises;
  };

  const saveDraft = async () => {
    if (!draft || !detail) return;
    const invalid = draft.weeks
      .flatMap((week) => week.days.flatMap((day) => day.exercises))
      .map((exercise) => validateClientPrescription(exercise))
      .find(Boolean);
    if (invalid) {
      setSaveState("failed");
      setError(translateLibraryError({ message: invalid }));
      return;
    }
    setSaveState("saving");
    setError(null);
    try {
      const next = await saveAdminClientAssignmentExercises(detail.id, flattenExercises(draft), detail.updated_at);
      setDetail(next);
      setDraft(next);
      setSaveState("saved");
      setEditing(false);
    } catch (err) {
      console.error(err);
      setSaveState("failed");
      setError(translateLibraryError(err));
    }
  };

  const confirmAssign = (replace: boolean) => {
    if (!preview) return;
    onConfirm({
      title: replace ? "استبدال البرنامج النشط" : "تأكيد تعيين البرنامج",
      body: replace
        ? `البرنامج الحالي (${detail?.name_ar ?? overview.assignment?.name_ar ?? "النشط"}) سيصبح تاريخاً بحالة مستبدل. البرنامج الجديد: ${preview.name_ar} إصدار ${preview.version} اعتباراً من ${startsOn}. السجل السابق يبقى.`
        : `تعيين ${preview.name_ar} إصدار ${preview.version} للعميل من ${startsOn}. تُنشأ لقطة مستقلة ولن يغيّر تعديل القالب لاحقاً هذا البرنامج.`,
      confirmLabel: replace ? "استبدال وتعيين" : "تعيين",
      tone: replace ? "danger" : "primary",
      onConfirm: () => {
        void assignAdminClientProgram({
          clientId,
          templateId: preview.id,
          startsOn,
          replace,
        })
          .then(async (row) => {
            setDetail(row);
            setDraft(row);
            setAssignStep("closed");
            setPreview(null);
            const list = await listAdminClientAssignments(clientId, 0);
            setHistory(list.rows);
            setHistoryTotal(list.totalCount);
            await onOverviewRefresh();
          })
          .catch((err) => {
            console.error(err);
            setError(translateLibraryError(err));
          });
      },
    });
  };

  const requestEnd = (status: "completed" | "cancelled") => {
    if (!detail) return;
    onConfirm({
      title: status === "completed" ? "إنهاء البرنامج" : "إلغاء البرنامج",
      body:
        status === "completed"
          ? "سيُحفظ البرنامج في التاريخ ولن يبقى نشطاً. السجلات السابقة تبقى."
          : "سيُلغى التعيين الحالي ويبقى ظاهراً في التاريخ.",
      confirmLabel: status === "completed" ? "إنهاء" : "إلغاء",
      tone: "danger",
      onConfirm: () => {
        void endAdminClientProgram(detail.id, status)
          .then(async () => {
            setDetail(null);
            setDraft(null);
            const list = await listAdminClientAssignments(clientId, 0);
            setHistory(list.rows);
            await onOverviewRefresh();
          })
          .catch((err) => {
            console.error(err);
            setError(translateLibraryError(err));
          });
      },
    });
  };

  const patchExercise = (
    weekIndex: number,
    dayIndex: number,
    exerciseIndex: number,
    patch: Partial<AdminAssignmentExercise>,
  ) => {
    if (!draft) return;
    setDraft({
      ...draft,
      weeks: draft.weeks.map((week, w) =>
        w !== weekIndex
          ? week
          : {
              ...week,
              days: week.days.map((day, d) =>
                d !== dayIndex
                  ? day
                  : {
                      ...day,
                      exercises: day.exercises.map((exercise, e) =>
                        e === exerciseIndex ? { ...exercise, ...patch } : exercise,
                      ),
                    },
              ),
            },
      ),
    });
    setSaveState("unsaved");
  };

  const exerciseOptions = useMemo(() => {
    const ids = new Map<string, string>();
    logs.forEach((row) => {
      if (row.exercise_id) ids.set(row.exercise_id, row.exercise_external_id);
    });
    detail?.weeks.forEach((week) =>
      week.days.forEach((day) =>
        day.exercises.forEach((exercise) => {
          if (exercise.exercise_id) ids.set(exercise.exercise_id, exercise.exercise_name_ar);
        }),
      ),
    );
    return [...ids.entries()];
  }, [logs, detail]);

  if (loading) return <AdminSkeletonRows rows={5} />;

  if (tab === "progress") {
    return (
      <AdminSection>
        {error ? <AdminErrorState message={error} /> : null}
        <AdminCard>
          <h2 className="cc-section__title">ملخص التقدم</h2>
          <dl className="cc-dl">
            <div>
              <dt>البرنامج الحالي</dt>
              <dd>{overview.assignment?.name_ar || "لا برنامج"}</dd>
            </div>
            <div>
              <dt>آخر نشاط تدريبي</dt>
              <dd>{overview.last_workout_at ? formatRelativeAge(overview.last_workout_at) : "لا سجل بعد"}</dd>
            </div>
            <div>
              <dt>نسبة الالتزام</dt>
              <dd>غير معتمدة — لا تُحسب في هذه المرحلة.</dd>
            </div>
          </dl>
        </AdminCard>
        <AdminCard>
          <h2 className="cc-section__title">سجل التمرين</h2>
          <label className="cc-filter">
            <span>تمرين</span>
            <select value={exerciseFilter} onChange={(event) => { setExerciseFilter(event.target.value); setLogsOffset(0); }}>
              <option value="">كل التمارين الأخيرة</option>
              {exerciseOptions.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {logsLoading ? <AdminSkeletonRows rows={3} /> : null}
          {!logsLoading && logs.length === 0 ? (
            <AdminEmptyState title="لا سجلات تمرين بعد" body="تظهر هنا المجموعات المسجّلة من تطبيق العميل فقط." />
          ) : null}
          {logs.length > 0 ? (
            <div className="cc-table-wrap">
              <table className="cc-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>التمرين</th>
                    <th>مجموعة</th>
                    <th>تكرار</th>
                    <th>حمل</th>
                    <th>السياق</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((row) => (
                    <tr key={row.id}>
                      <td>{row.session_date}</td>
                      <td dir="ltr">{row.exercise_external_id}</td>
                      <td>{row.set_number}</td>
                      <td>{row.reps ?? "—"}</td>
                      <td>{row.weight_kg ?? "—"}</td>
                      <td>{logIsLegacyUnlinked(row.assignment_id) ? "سجل قديم غير مرتبط" : "مرتبط بالتعيين"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <AdminPagination
            offset={logsOffset}
            pageSize={ADMIN_LIBRARY_PAGE_SIZE}
            total={logsTotal}
            onPage={setLogsOffset}
          />
        </AdminCard>
        <HistoryList
          rows={history}
          total={historyTotal}
          offset={historyOffset}
          onPage={(next) => {
            setHistoryOffset(next);
            void listAdminClientAssignments(clientId, next).then((list) => {
              setHistory(list.rows);
              setHistoryTotal(list.totalCount);
            });
          }}
          onOpen={(id) => void loadAssignment(id)}
        />
      </AdminSection>
    );
  }

  return (
    <AdminSection>
      {error ? <AdminErrorState message={error} /> : null}
      {signals.length > 0 ? (
        <AdminCard>
          <h2 className="cc-section__title">إشارات موضوعية</h2>
          <ul>
            {signals.map((signal) => (
              <li key={signal}>{objectiveSignalLabel(signal)}</li>
            ))}
          </ul>
          <p className="cc-muted">لا تُعرض نسبة التزام أو تقييم تقدّم علمي غير معتمد.</p>
        </AdminCard>
      ) : null}

      <AdminCard>
        <h2 className="cc-section__title">البرنامج الحالي</h2>
        <p className="cc-muted">
          {PROGRAM_BOUNDARIES.template} منفصل عن {PROGRAM_BOUNDARIES.assigned}. تعديل القالب لا يغيّر لقطة العميل.
        </p>
        {detail ? (
          <dl className="cc-dl">
            <div>
              <dt>الاسم</dt>
              <dd>{detail.name_ar || "—"}</dd>
            </div>
            <div>
              <dt>الحالة</dt>
              <dd>
                <AdminStatusBadge tone={detail.status === "active" ? "success" : "foundation"}>
                  {assignmentStatusLabel(detail.status)}
                </AdminStatusBadge>
              </dd>
            </div>
            <div>
              <dt>إصدار القالب المصدر</dt>
              <dd>{detail.template_version}</dd>
            </div>
            <div>
              <dt>تاريخ البداية</dt>
              <dd>{detail.starts_on ? formatAdminDate(detail.starts_on) : "—"}</dd>
            </div>
            <div>
              <dt>الأسبوع الحالي</dt>
              <dd>{weekInfo.reason === "ok" && detail.starts_on ? weekInfo.week : "غير محسوب — يعتمد على تاريخ البداية"}</dd>
            </div>
            <div>
              <dt>لقطة مكتملة</dt>
              <dd>{detail.snapshot_complete ? "نعم" : "لا — تعيين قديم يحتاج مراجعة"}</dd>
            </div>
            <div>
              <dt>آخر تمرين</dt>
              <dd>{overview.last_workout_at ? formatRelativeAge(overview.last_workout_at) : "لا سجل"}</dd>
            </div>
          </dl>
        ) : (
          <AdminEmptyState
            title="لا برنامج معيَّن"
            body="لا توجد لقطة تدريب لهذا العميل. القوالب ليست برنامج العميل."
          />
        )}
        <div className="cc-editor-toolbar">
          <button type="button" className="cc-btn cc-btn--primary" onClick={() => setAssignStep("pick")}>
            تعيين برنامج
          </button>
          {detail?.snapshot_complete && (detail.status === "active" || detail.status === "scheduled") ? (
            <button type="button" className="cc-btn" onClick={() => setEditing(true)}>
              تعديل نسخة العميل
            </button>
          ) : null}
          {detail && (detail.status === "active" || detail.status === "scheduled") ? (
            <>
              <button type="button" className="cc-btn" onClick={() => requestEnd("completed")}>
                إنهاء البرنامج
              </button>
              <button type="button" className="cc-btn" onClick={() => setAssignStep("pick")}>
                استبدال البرنامج
              </button>
            </>
          ) : null}
          {conversationId ? (
            <Link to="/admin/messages/$conversationId" params={{ conversationId }} className="cc-btn">
              فتح المحادثة
            </Link>
          ) : null}
          {editing ? <AdminSaveState state={dirty ? "unsaved" : saveState} /> : null}
        </div>
      </AdminCard>

      {assignStep !== "closed" ? (
        <AdminCard>
          <h2 className="cc-section__title">تعيين برنامج</h2>
          {assignStep === "pick" ? (
            <>
              <div className="cc-form-grid">
                <AdminSearchInput value={pickerQuery} onChange={setPickerQuery} placeholder="بحث في القوالب المنشورة" label="بحث" />
                <AdminSelect value={pickerGoal} onChange={setPickerGoal}>
                  <option value="">كل الأهداف</option>
                  {PROGRAM_GOALS.map((goal) => (
                    <option key={goal} value={goal}>
                      {GOAL_LABELS[goal] ?? goal}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect value={pickerLevel} onChange={setPickerLevel}>
                  <option value="">كل المستويات</option>
                  {PROGRAM_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect value={pickerDays} onChange={setPickerDays}>
                  <option value="">أيام/أسبوع</option>
                  {[3, 4, 5, 6].map((days) => (
                    <option key={days} value={String(days)}>
                      {days}
                    </option>
                  ))}
                </AdminSelect>
              </div>
              {pickerRows.length === 0 ? <AdminEmptyState title="لا قوالب منشورة مطابقة" body="القوالب المؤرشفة غير ظاهرة هنا." /> : null}
              <ul className="cc-picker-list">
                {pickerRows.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      className="cc-row-btn"
                      onClick={() => {
                        void getAdminProgramTemplate(row.id).then((full) => {
                          setPreview(full);
                          setAssignStep("preview");
                        });
                      }}
                    >
                      {row.name_ar} · إصدار {row.version} · {row.days_per_week} أيام
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {preview && (assignStep === "preview" || assignStep === "review") ? (
            <>
              <dl className="cc-dl">
                <div>
                  <dt>الاسم</dt>
                  <dd>{preview.name_ar}</dd>
                </div>
                <div>
                  <dt>الهدف / المستوى</dt>
                  <dd>
                    {GOAL_LABELS[preview.goal ?? ""] ?? preview.goal ?? "—"} · {preview.level ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt>المدة</dt>
                  <dd>
                    {preview.duration_weeks} أسبوع · {preview.days_per_week} أيام/أسبوع · {preview.weeks.length} أسبوع مبني
                  </dd>
                </div>
                <div>
                  <dt>التمارين</dt>
                  <dd>{preview.weeks.reduce((sum, week) => sum + week.days.reduce((inner, day) => inner + day.exercises.length, 0), 0)}</dd>
                </div>
                <div>
                  <dt>إصدار القالب</dt>
                  <dd>{preview.version}</dd>
                </div>
              </dl>
              {overview.assignment?.status === "active" ? (
                <p className="cc-field__error" role="alert">
                  يوجد برنامج نشط. التعيين الجديد يستبدله بعد التأكيد ويُبقي التاريخ.
                </p>
              ) : null}
              <AdminField label="تاريخ البداية" htmlFor="starts_on">
                <input
                  id="starts_on"
                  className="cc-input"
                  type="date"
                  value={startsOn}
                  onChange={(event) => setStartsOn(event.target.value)}
                />
              </AdminField>
              <div className="cc-editor-toolbar">
                <button type="button" className="cc-btn" onClick={() => setAssignStep("pick")}>
                  رجوع
                </button>
                <button
                  type="button"
                  className="cc-btn cc-btn--primary"
                  onClick={() => confirmAssign(overview.assignment?.status === "active" || overview.assignment?.status === "scheduled")}
                >
                  متابعة التأكيد
                </button>
              </div>
            </>
          ) : null}
          <button type="button" className="cc-btn cc-btn--ghost" onClick={() => { setAssignStep("closed"); setPreview(null); }}>
            إغلاق
          </button>
        </AdminCard>
      ) : null}

      {editing && draft?.snapshot_complete ? (
        <AdminCard>
          <h2 className="cc-section__title">محرر نسخة العميل</h2>
          <p className="cc-muted">هذه الحقول خاصة بلقطة العميل. ملاحظات التمرين تظهر للعميل. الملاحظات الداخلية تبقى في تبويب الملاحظات.</p>
          {draft.weeks.map((week, weekIndex) => (
            <section key={week.id} className="cc-week">
              <strong>الأسبوع {week.week_number}</strong>
              {week.days.map((day, dayIndex) => (
                <div key={day.id} className="cc-day">
                  <span>{day.title_ar} · يوم {day.day_number}</span>
                  {day.exercises.map((exercise, exerciseIndex) => (
                    <div key={exercise.id} className="cc-ex-row">
                      <span>
                        {exercise.exercise_name_ar} <span dir="ltr">{exercise.exercise_name_en}</span>
                      </span>
                      <label>
                        مجموعات
                        <input
                          type="number"
                          min={1}
                          value={exercise.sets}
                          onChange={(event) => patchExercise(weekIndex, dayIndex, exerciseIndex, { sets: Number(event.target.value) || 1 })}
                        />
                      </label>
                      <label>
                        تكرار من
                        <input
                          type="number"
                          min={0}
                          value={exercise.reps_min ?? ""}
                          onChange={(event) =>
                            patchExercise(weekIndex, dayIndex, exerciseIndex, {
                              reps_min: event.target.value ? Number(event.target.value) : null,
                            })
                          }
                        />
                      </label>
                      <label>
                        إلى
                        <input
                          type="number"
                          min={0}
                          value={exercise.reps_max ?? ""}
                          onChange={(event) =>
                            patchExercise(weekIndex, dayIndex, exerciseIndex, {
                              reps_max: event.target.value ? Number(event.target.value) : null,
                            })
                          }
                        />
                      </label>
                      <label>
                        راحة ث
                        <input
                          type="number"
                          min={0}
                          value={exercise.rest_seconds}
                          onChange={(event) =>
                            patchExercise(weekIndex, dayIndex, exerciseIndex, {
                              rest_seconds: Number(event.target.value) || 0,
                            })
                          }
                        />
                      </label>
                      <label>
                        وزن مقترح
                        <input
                          type="number"
                          min={0}
                          value={exercise.suggested_weight_kg ?? ""}
                          onChange={(event) =>
                            patchExercise(weekIndex, dayIndex, exerciseIndex, {
                              suggested_weight_kg: event.target.value ? Number(event.target.value) : null,
                            })
                          }
                        />
                      </label>
                      <label>
                        ملاحظة للعميل
                        <input
                          value={exercise.notes_ar ?? ""}
                          onChange={(event) => patchExercise(weekIndex, dayIndex, exerciseIndex, { notes_ar: event.target.value })}
                        />
                      </label>
                      <button
                        type="button"
                        className="cc-btn cc-btn--ghost"
                        aria-label="نقل التمرين للأعلى"
                        onClick={() => {
                          setDraft({
                            ...draft,
                            weeks: draft.weeks.map((row, w) =>
                              w !== weekIndex
                                ? row
                                : {
                                    ...row,
                                    days: row.days.map((item, d) =>
                                      d !== dayIndex ? item : { ...item, exercises: moveItem(item.exercises, exerciseIndex, -1) },
                                    ),
                                  },
                            ),
                          });
                          setSaveState("unsaved");
                        }}
                      >
                        أعلى
                      </button>
                      <button
                        type="button"
                        className="cc-btn cc-btn--ghost"
                        aria-label="نقل التمرين للأسفل"
                        onClick={() => {
                          setDraft({
                            ...draft,
                            weeks: draft.weeks.map((row, w) =>
                              w !== weekIndex
                                ? row
                                : {
                                    ...row,
                                    days: row.days.map((item, d) =>
                                      d !== dayIndex ? item : { ...item, exercises: moveItem(item.exercises, exerciseIndex, 1) },
                                    ),
                                  },
                            ),
                          });
                          setSaveState("unsaved");
                        }}
                      >
                        أسفل
                      </button>
                      <button
                        type="button"
                        className="cc-btn cc-btn--ghost"
                        onClick={() => {
                          setPickerQuery("");
                          setPickerOpen({ week: weekIndex, day: dayIndex, exercise: exerciseIndex });
                        }}
                      >
                        استبدال التمرين
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </section>
          ))}
          <div className="cc-editor-toolbar">
            <button type="button" className="cc-btn cc-btn--primary" disabled={saveState === "saving"} onClick={() => void saveDraft()}>
              حفظ نسخة العميل
            </button>
            <button
              type="button"
              className="cc-btn"
              onClick={() =>
                guard(() => {
                  setDraft(detail);
                  setEditing(false);
                  setSaveState("saved");
                })
              }
            >
              إلغاء
            </button>
          </div>
        </AdminCard>
      ) : detail?.snapshot_complete ? (
        <AdminCard>
          <h2 className="cc-section__title">هيكل البرنامج</h2>
          {detail.weeks.map((week) => (
            <section key={week.id} className="cc-week">
              <strong>الأسبوع {week.week_number}</strong>
              {week.days.map((day) => (
                <div key={day.id} className="cc-day">
                  <span>{day.title_ar}</span>
                  {day.exercises.map((exercise) => (
                    <p key={exercise.id} className="cc-meta">
                      {exercise.exercise_name_ar} · {exercise.sets} مجموعات · {formatRepsLabel(exercise) ?? "—"}
                    </p>
                  ))}
                </div>
              ))}
            </section>
          ))}
        </AdminCard>
      ) : null}

      <HistoryList
        rows={history}
        total={historyTotal}
        offset={historyOffset}
        onPage={(next) => {
          setHistoryOffset(next);
          void listAdminClientAssignments(clientId, next).then((list) => {
            setHistory(list.rows);
            setHistoryTotal(list.totalCount);
          });
        }}
        onOpen={(id) => void loadAssignment(id)}
      />

      {pickerOpen && draft ? (
        <div className="cc-dialog-scrim" role="dialog" aria-labelledby="client-ex-picker">
          <div className="cc-dialog cc-dialog--wide">
            <h2 id="client-ex-picker">استبدال تمرين من المكتبة</h2>
            <AdminSearchInput value={pickerQuery} onChange={setPickerQuery} placeholder="ابحث في التمارين النشطة" label="بحث التمرين" />
            <ul className="cc-picker-list">
              {exerciseRows.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="cc-row-btn"
                    onClick={() => {
                      patchExercise(pickerOpen.week, pickerOpen.day, pickerOpen.exercise, {
                        exercise_id: item.id,
                        exercise_external_id: item.external_id,
                        exercise_name_ar: item.name_ar,
                        exercise_name_en: item.name_en,
                      });
                      setPickerOpen(null);
                    }}
                  >
                    {item.name_ar} <span dir="ltr">{item.name_en}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="cc-btn cc-btn--ghost" onClick={() => setPickerOpen(null)}>
              إغلاق
            </button>
          </div>
        </div>
      ) : null}
    </AdminSection>
  );
}

function HistoryList({
  rows,
  total,
  offset,
  onPage,
  onOpen,
}: {
  rows: AdminAssignmentSummary[];
  total: number;
  offset: number;
  onPage: (offset: number) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <AdminCard>
      <h2 className="cc-section__title">تاريخ البرامج</h2>
      {rows.length === 0 ? <AdminEmptyState title="لا تاريخ تعيين" body="ستظهر هنا البرامج السابقة والحالية والمجدولة." /> : null}
      {rows.map((row) => (
        <button key={row.id} type="button" className="cc-row-btn" onClick={() => onOpen(row.id)}>
          {row.name_ar || row.id.slice(0, 8)} · {assignmentStatusLabel(row.status)} · إصدار {row.template_version} ·{" "}
          {formatAdminDate(row.assigned_at)}
          {row.snapshot_complete ? "" : " · لقطة ناقصة"}
        </button>
      ))}
      <AdminPagination offset={offset} pageSize={ADMIN_LIBRARY_PAGE_SIZE} total={total} onPage={onPage} />
    </AdminCard>
  );
}
