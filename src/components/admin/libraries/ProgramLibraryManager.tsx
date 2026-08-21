import { useEffect, useState } from "react";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminSearchInput,
  AdminTable,
} from "@/components/admin/AdminPage";
import { AdminFilterBar, AdminSkeletonRows, type AdminConfirmRequest } from "@/components/admin/AdminConfirmDialog";
import {
  AdminEditorToolbar,
  AdminField,
  AdminLibraryDialogs,
  AdminLibraryLayout,
  AdminLibraryStatusBadge,
  AdminPagination,
  AdminPreview,
  AdminSaveState,
  AdminSelect,
  AdminTextInput,
  AdminTextarea,
  firstFieldError,
  useDebouncedValue,
  useUnsavedNavigation,
} from "@/components/admin/AdminLibraryKit";
import {
  ADMIN_LIBRARY_PAGE_SIZE,
  PROGRAM_GOALS,
  PROGRAM_LEVELS,
  PROGRAM_VERSIONING_COMPLETION_REQUIRED,
  moveItem,
  programGoalLabel,
  programLevelLabel,
  programStatusLabel,
  translateLibraryError,
  validateProgramDraft,
  type LibrarySaveState,
} from "@/lib/admin/admin-libraries";
import { listAdminExercises, type AdminExerciseListItem } from "@/lib/admin/admin-exercises-api";
import {
  archiveAdminProgramTemplate,
  emptyProgramDay,
  emptyProgramDraft,
  emptyProgramExercise,
  emptyProgramWeek,
  getAdminProgramTemplate,
  listAdminProgramTemplates,
  publishAdminProgramTemplate,
  saveAdminProgramTemplate,
  type AdminProgramDetail,
  type AdminProgramListItem,
} from "@/lib/admin/admin-programs-api";
import { formatAdminDate } from "@/lib/admin/admin-status";

export function ProgramLibraryManager() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState("");
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<AdminProgramListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<AdminProgramDetail | null>(null);
  const [baseline, setBaseline] = useState("");
  const [saveState, setSaveState] = useState<LibrarySaveState>("saved");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<AdminConfirmRequest | null>(null);
  const [picker, setPicker] = useState<{ week: number; day: number } | null>(null);
  const [pickerQuery, setPickerQuery] = useState("");
  const pickerDebounced = useDebouncedValue(pickerQuery);
  const [pickerRows, setPickerRows] = useState<AdminExerciseListItem[]>([]);
  const dirty = Boolean(draft && JSON.stringify(draft) !== baseline);
  const guard = useUnsavedNavigation(dirty, setConfirm);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void listAdminProgramTemplates({
      query: debouncedQuery,
      goal: goal || null,
      level: level || null,
      status: status || null,
      offset,
    })
      .then((result) => {
        if (cancelled) return;
        setRows(result.rows);
        setTotal(result.totalCount);
      })
      .catch((err) => {
        if (!cancelled) setError(translateLibraryError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, goal, level, status, offset]);

  const openItem = (id: string | "new") => guard(() => setSelectedId(id));

  useEffect(() => {
    if (selectedId == null) {
      setDraft(null);
      return;
    }
    if (selectedId === "new") {
      const next = emptyProgramDraft();
      setDraft(next);
      setBaseline(JSON.stringify(next));
      setSaveState("saved");
      setFieldErrors({});
      return;
    }
    let cancelled = false;
    void getAdminProgramTemplate(selectedId)
      .then((item) => {
        if (cancelled) return;
        setDraft(item);
        setBaseline(JSON.stringify(item));
        setSaveState("saved");
        setFieldErrors({});
      })
      .catch((err) => setError(translateLibraryError(err)));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  useEffect(() => {
    if (draft && JSON.stringify(draft) !== baseline) setSaveState("unsaved");
  }, [draft, baseline]);

  useEffect(() => {
    if (!picker) return;
    void listAdminExercises({ query: pickerDebounced, active: true, offset: 0 }).then((result) => setPickerRows(result.rows));
  }, [picker, pickerDebounced]);

  const refreshList = async () => {
    const result = await listAdminProgramTemplates({
      query: debouncedQuery,
      goal: goal || null,
      level: level || null,
      status: status || null,
      offset,
    });
    setRows(result.rows);
    setTotal(result.totalCount);
  };

  const save = async () => {
    if (!draft) return;
    const errors = validateProgramDraft(draft);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setSaveState("failed");
      return;
    }
    setSaveState("saving");
    try {
      const saved = await saveAdminProgramTemplate(
        {
          id: draft.id || null,
          slug: draft.slug,
          name_ar: draft.name_ar,
          name_en: draft.name_en,
          description_ar: draft.description_ar,
          goal: draft.goal,
          level: draft.level,
          duration_weeks: draft.duration_weeks,
          days_per_week: draft.days_per_week,
          weeks: draft.weeks.map((week, weekIndex) => ({
            week_number: weekIndex + 1,
            title_ar: week.title_ar,
            notes_ar: week.notes_ar,
            days: week.days.map((day, dayIndex) => ({
              day_number: dayIndex + 1,
              day_type: day.day_type,
              title_ar: day.title_ar,
              muscle_focus: day.muscle_focus,
              estimated_minutes: day.estimated_minutes,
              estimated_calories: day.estimated_calories,
              exercises: day.exercises.map((exercise) => ({
                exercise_id: exercise.exercise_id,
                sets: exercise.sets,
                reps_min: exercise.reps_min,
                reps_max: exercise.reps_max,
                reps_label: exercise.reps_label,
                rest_seconds: exercise.rest_seconds,
                suggested_weight_kg: exercise.suggested_weight_kg,
                notes_ar: exercise.notes_ar,
              })),
            })),
          })),
        },
        draft.updated_at || null,
      );
      setDraft(saved);
      setBaseline(JSON.stringify(saved));
      setSelectedId(saved.id);
      setSaveState("saved");
      await refreshList();
    } catch (err) {
      setSaveState("failed");
      setError(translateLibraryError(err));
    }
  };

  const publish = () => {
    if (!draft?.id || dirty) return;
    setConfirm({
      title: "نشر القالب",
      body: PROGRAM_VERSIONING_COMPLETION_REQUIRED
        ? "نشر القالب لا ينشئ لقطة كاملة للأسبوع/اليوم. تعيينات العملاء الحالية تحتفظ برقم الإصدار المجمد، لكن محتوى القالب الحي قد يتغير. PROGRAM_VERSIONING_COMPLETION_REQUIRED."
        : "سيتم نشر القالب.",
      confirmLabel: "نشر القالب",
      onConfirm: () => {
        void publishAdminProgramTemplate(draft.id)
          .then((saved) => {
            setDraft(saved);
            setBaseline(JSON.stringify(saved));
            setSaveState("saved");
            void refreshList();
          })
          .catch((err) => setError(translateLibraryError(err)));
      },
    });
  };

  const archive = () => {
    if (!draft?.id) return;
    setConfirm({
      title: "أرشفة القالب",
      body: `عدد التعيينات النشطة المرتبطة: ${draft.assignment_count}. الأرشفة لا تحذف التعيينات ولا تعدّل برنامج العميل المعيَّن.`,
      confirmLabel: "أرشفة",
      tone: "danger",
      onConfirm: () => {
        void archiveAdminProgramTemplate(draft.id)
          .then((saved) => {
            setDraft(saved);
            setBaseline(JSON.stringify(saved));
            setSaveState("saved");
            void refreshList();
          })
          .catch((err) => setError(translateLibraryError(err)));
      },
    });
  };

  return (
    <>
      <AdminPageHeader
        kicker="قوالب البرامج"
        title="البرامج"
        subtitle="إدارة قوالب البرامج فقط. القالب ليس برنامج العميل المعيَّن."
        actions={
          <button type="button" className="cc-btn cc-btn--primary" onClick={() => openItem("new")}>
            قالب جديد
          </button>
        }
      />
      <AdminLibraryLayout
        list={
          <>
            <AdminSearchInput value={query} onChange={setQuery} placeholder="اسم البرنامج / slug" label="بحث البرامج" />
            <AdminFilterBar>
              <label className="cc-filter">
                الهدف
                <select value={goal} onChange={(event) => { setGoal(event.target.value); setOffset(0); }}>
                  <option value="">الكل</option>
                  {PROGRAM_GOALS.map((item) => (
                    <option key={item} value={item}>
                      {programGoalLabel(item)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="cc-filter">
                المستوى
                <select value={level} onChange={(event) => { setLevel(event.target.value); setOffset(0); }}>
                  <option value="">الكل</option>
                  {PROGRAM_LEVELS.map((item) => (
                    <option key={item} value={item}>
                      {programLevelLabel(item)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="cc-filter">
                الحالة
                <select value={status} onChange={(event) => { setStatus(event.target.value); setOffset(0); }}>
                  <option value="">الكل</option>
                  <option value="draft">مسودة</option>
                  <option value="published">منشور</option>
                  <option value="archived">مؤرشف</option>
                </select>
              </label>
            </AdminFilterBar>
            {error ? <AdminErrorState message={error} onRetry={() => setOffset(0)} /> : null}
            {loading ? (
              <AdminSkeletonRows rows={8} />
            ) : rows.length === 0 ? (
              <AdminEmptyState title="لا قوالب مطابقة" body="أنشئ قالباً أو غيّر الفلاتر." />
            ) : (
              <AdminTable>
                <thead>
                  <tr>
                    <th>البرنامج</th>
                    <th>الهدف</th>
                    <th>المستوى</th>
                    <th>أيام/أسبوع</th>
                    <th>الإصدار</th>
                    <th>تعيينات</th>
                    <th>الحالة</th>
                    <th>تحديث</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className={row.id === selectedId ? "is-selected" : undefined}>
                      <td>
                        <button type="button" className="cc-row-btn" onClick={() => openItem(row.id)}>
                          {row.name_ar}
                        </button>
                        <div className="cc-muted">{row.slug}</div>
                      </td>
                      <td>{programGoalLabel(row.goal)}</td>
                      <td>{programLevelLabel(row.level)}</td>
                      <td>{row.days_per_week}</td>
                      <td>{row.version}</td>
                      <td>{row.assignment_count}</td>
                      <td>
                        <AdminLibraryStatusBadge
                          status={row.archived_at ? "archived" : row.is_published ? "published" : "draft"}
                          label={programStatusLabel(row.is_published, row.archived_at)}
                        />
                      </td>
                      <td>{formatAdminDate(row.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
            )}
            <AdminPagination offset={offset} pageSize={ADMIN_LIBRARY_PAGE_SIZE} total={total} onPage={setOffset} />
          </>
        }
        editor={
          !draft ? (
            <AdminEmptyState title="اختر قالباً" body="هيكل البرنامج يُحمّل عند فتح العنصر فقط." />
          ) : (
            <form
              className="cc-editor"
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <AdminEditorToolbar>
                <AdminSaveState state={saveState} />
                <button type="submit" className="cc-btn cc-btn--primary" disabled={saveState === "saving" || Boolean(draft.archived_at)}>
                  حفظ القالب
                </button>
                {draft.id && !draft.archived_at ? (
                  <>
                    <button type="button" className="cc-btn cc-btn--primary" disabled={dirty} onClick={publish}>
                      نشر
                    </button>
                    <button type="button" className="cc-btn cc-btn--ghost" onClick={archive}>
                      أرشفة
                    </button>
                  </>
                ) : null}
              </AdminEditorToolbar>
              <p className="cc-contract">PROGRAM_TEMPLATE ≠ CLIENT_ASSIGNED_PROGRAM · التعيينات الحالية لا تُعدَّل صامتة.</p>
              {PROGRAM_VERSIONING_COMPLETION_REQUIRED ? (
                <p className="cc-muted">لقطة الهيكل غير مكتملة بعد. لا تعامل رقم الإصدار كتجميد كامل للمحتوى.</p>
              ) : null}
              {firstFieldError(fieldErrors) ? <p className="cc-field__error">{firstFieldError(fieldErrors)}</p> : null}
              <div className="cc-form-grid">
                <AdminField label="اسم البرنامج" htmlFor="name_ar" error={fieldErrors.name_ar}>
                  <AdminTextInput id="name_ar" value={draft.name_ar} error={fieldErrors.name_ar} onChange={(value) => setDraft({ ...draft, name_ar: value })} />
                </AdminField>
                <AdminField label="English name" htmlFor="name_en">
                  <AdminTextInput id="name_en" dir="ltr" value={draft.name_en ?? ""} onChange={(value) => setDraft({ ...draft, name_en: value })} />
                </AdminField>
                <AdminField label="Slug" htmlFor="slug" error={fieldErrors.slug}>
                  <AdminTextInput id="slug" dir="ltr" value={draft.slug} error={fieldErrors.slug} onChange={(value) => setDraft({ ...draft, slug: value })} />
                </AdminField>
                <AdminField label="الهدف" htmlFor="goal">
                  <AdminSelect id="goal" value={draft.goal ?? ""} onChange={(value) => setDraft({ ...draft, goal: value })}>
                    {PROGRAM_GOALS.map((item) => (
                      <option key={item} value={item}>
                        {programGoalLabel(item)}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="المستوى" htmlFor="level">
                  <AdminSelect id="level" value={draft.level ?? ""} onChange={(value) => setDraft({ ...draft, level: value })}>
                    {PROGRAM_LEVELS.map((item) => (
                      <option key={item} value={item}>
                        {programLevelLabel(item)}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="أسابيع" htmlFor="duration_weeks">
                  <AdminTextInput id="duration_weeks" type="number" value={String(draft.duration_weeks)} onChange={(value) => setDraft({ ...draft, duration_weeks: Number(value) || 0 })} />
                </AdminField>
                <AdminField label="أيام/أسبوع" htmlFor="days_per_week">
                  <AdminTextInput id="days_per_week" type="number" value={String(draft.days_per_week)} onChange={(value) => setDraft({ ...draft, days_per_week: Number(value) || 0 })} />
                </AdminField>
              </div>
              <AdminField label="الوصف" htmlFor="description_ar">
                <AdminTextarea id="description_ar" value={draft.description_ar ?? ""} onChange={(value) => setDraft({ ...draft, description_ar: value })} />
              </AdminField>
              <div className="cc-ing-head">
                <h3>الأسابيع</h3>
                <button type="button" className="cc-btn cc-btn--ghost" onClick={() => setDraft({ ...draft, weeks: [...draft.weeks, emptyProgramWeek(draft.weeks.length + 1)] })}>
                  إضافة أسبوع
                </button>
              </div>
              {draft.weeks.map((week, weekIndex) => (
                <section key={weekIndex} className="cc-week">
                  <div className="cc-ing-head">
                    <strong>الأسبوع {weekIndex + 1}</strong>
                    <button type="button" className="cc-btn cc-btn--ghost" onClick={() => setDraft({ ...draft, weeks: draft.weeks.filter((_, i) => i !== weekIndex) })}>
                      حذف الأسبوع
                    </button>
                  </div>
                  <AdminTextInput value={week.title_ar ?? ""} onChange={(value) => setDraft({ ...draft, weeks: draft.weeks.map((row, i) => (i === weekIndex ? { ...row, title_ar: value } : row)) })} />
                  {week.days.map((day, dayIndex) => (
                    <div key={dayIndex} className="cc-day">
                      <div className="cc-ing-head">
                        <span>{day.title_ar || `اليوم ${dayIndex + 1}`}</span>
                        <button type="button" className="cc-btn cc-btn--ghost" onClick={() => setPicker({ week: weekIndex, day: dayIndex })}>
                          اختيار تمرين
                        </button>
                        <button
                          type="button"
                          className="cc-btn cc-btn--ghost"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              weeks: draft.weeks.map((row, i) =>
                                i === weekIndex ? { ...row, days: [...row.days, emptyProgramDay(row.days.length + 1)] } : row,
                              ),
                            })
                          }
                        >
                          يوم
                        </button>
                      </div>
                      <div className="cc-form-grid">
                        <AdminTextInput value={day.title_ar} onChange={(value) => setDraft({ ...draft, weeks: patchDay(draft, weekIndex, dayIndex, { title_ar: value }) })} />
                        <AdminSelect value={day.day_type} onChange={(value) => setDraft({ ...draft, weeks: patchDay(draft, weekIndex, dayIndex, { day_type: value }) })}>
                          <option value="workout">تمرين</option>
                          <option value="rest">راحة</option>
                          <option value="active_recovery">استشفاء</option>
                        </AdminSelect>
                      </div>
                      {day.exercises.map((exercise, exerciseIndex) => (
                        <div key={`${exercise.exercise_id}-${exerciseIndex}`} className="cc-ex-row">
                          <span>{exercise.exercise_name_ar || exercise.exercise_id}</span>
                          <label>
                            مجموعات
                            <input type="number" value={exercise.sets} onChange={(event) => setDraft({ ...draft, weeks: patchExercise(draft, weekIndex, dayIndex, exerciseIndex, { sets: Number(event.target.value) || 1 }) })} />
                          </label>
                          <label>
                            تكرار من
                            <input type="number" value={exercise.reps_min ?? ""} onChange={(event) => setDraft({ ...draft, weeks: patchExercise(draft, weekIndex, dayIndex, exerciseIndex, { reps_min: event.target.value ? Number(event.target.value) : null }) })} />
                          </label>
                          <label>
                            إلى
                            <input type="number" value={exercise.reps_max ?? ""} onChange={(event) => setDraft({ ...draft, weeks: patchExercise(draft, weekIndex, dayIndex, exerciseIndex, { reps_max: event.target.value ? Number(event.target.value) : null }) })} />
                          </label>
                          <label>
                            راحة ث
                            <input type="number" value={exercise.rest_seconds} onChange={(event) => setDraft({ ...draft, weeks: patchExercise(draft, weekIndex, dayIndex, exerciseIndex, { rest_seconds: Number(event.target.value) || 0 }) })} />
                          </label>
                          <label>
                            وزن مقترح
                            <input type="number" value={exercise.suggested_weight_kg ?? ""} onChange={(event) => setDraft({ ...draft, weeks: patchExercise(draft, weekIndex, dayIndex, exerciseIndex, { suggested_weight_kg: event.target.value ? Number(event.target.value) : null }) })} />
                          </label>
                          <button type="button" className="cc-btn cc-btn--ghost" onClick={() => setDraft({ ...draft, weeks: patchExercises(draft, weekIndex, dayIndex, moveItem(day.exercises, exerciseIndex, -1)) })}>
                            أعلى
                          </button>
                          <button type="button" className="cc-btn cc-btn--ghost" onClick={() => setDraft({ ...draft, weeks: patchExercises(draft, weekIndex, dayIndex, moveItem(day.exercises, exerciseIndex, 1)) })}>
                            أسفل
                          </button>
                          <button
                            type="button"
                            className="cc-btn cc-btn--ghost"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                weeks: patchExercises(
                                  draft,
                                  weekIndex,
                                  dayIndex,
                                  day.exercises.filter((_, i) => i !== exerciseIndex),
                                ),
                              })
                            }
                          >
                            إزالة
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </section>
              ))}
              <AdminPreview title="ملخص القالب">
                <p className="cc-preview-title">{draft.name_ar || "بدون اسم"}</p>
                <p>
                  إصدار {draft.version} · تعيينات نشطة {draft.assignment_count} · {draft.weeks.length} أسبوع
                </p>
              </AdminPreview>
            </form>
          )
        }
      />
      {picker && draft ? (
        <div className="cc-dialog-scrim" role="dialog" aria-labelledby="picker-title">
          <div className="cc-dialog cc-dialog--wide">
            <h2 id="picker-title">اختيار تمرين من المكتبة</h2>
            <AdminSearchInput value={pickerQuery} onChange={setPickerQuery} placeholder="ابحث في التمارين النشطة" label="بحث التمرين" />
            <ul className="cc-picker-list">
              {pickerRows.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="cc-row-btn"
                    onClick={() => {
                      const next = emptyProgramExercise({
                        id: item.id,
                        name_ar: item.name_ar,
                        name_en: item.name_en,
                        external_id: item.external_id,
                      });
                      setDraft({
                        ...draft,
                        weeks: patchExercises(draft, picker.week, picker.day, [
                          ...(draft.weeks[picker.week]?.days[picker.day]?.exercises ?? []),
                          next,
                        ]),
                      });
                      setPicker(null);
                    }}
                  >
                    {item.name_ar} <span dir="ltr">{item.name_en}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="cc-btn cc-btn--ghost" onClick={() => setPicker(null)}>
              إغلاق
            </button>
          </div>
        </div>
      ) : null}
      <AdminLibraryDialogs request={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}

function patchDay(draft: AdminProgramDetail, weekIndex: number, dayIndex: number, patch: Partial<AdminProgramDetail["weeks"][number]["days"][number]>) {
  return draft.weeks.map((week, i) =>
    i === weekIndex
      ? { ...week, days: week.days.map((day, j) => (j === dayIndex ? { ...day, ...patch } : day)) }
      : week,
  );
}

function patchExercise(
  draft: AdminProgramDetail,
  weekIndex: number,
  dayIndex: number,
  exerciseIndex: number,
  patch: Partial<AdminProgramDetail["weeks"][number]["days"][number]["exercises"][number]>,
) {
  return patchExercises(
    draft,
    weekIndex,
    dayIndex,
    (draft.weeks[weekIndex]?.days[dayIndex]?.exercises ?? []).map((exercise, index) =>
      index === exerciseIndex ? { ...exercise, ...patch } : exercise,
    ),
  );
}

function patchExercises(
  draft: AdminProgramDetail,
  weekIndex: number,
  dayIndex: number,
  exercises: AdminProgramDetail["weeks"][number]["days"][number]["exercises"],
) {
  return draft.weeks.map((week, i) =>
    i === weekIndex
      ? { ...week, days: week.days.map((day, j) => (j === dayIndex ? { ...day, exercises } : day)) }
      : week,
  );
}
