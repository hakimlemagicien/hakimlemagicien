import { useEffect, useState } from "react";
import {
  AdminConceptKpiRow,
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminSearchInput,
  AdminTable,
} from "@/components/admin/AdminPage";
import { AdminFilterBar, AdminSkeletonRows, type AdminConfirmRequest } from "@/components/admin/AdminConfirmDialog";
import {
  AdminLibraryDialogs,
  AdminLibraryStatusBadge,
  AdminPagination,
  useDebouncedValue,
  useUnsavedNavigation,
} from "@/components/admin/AdminLibraryKit";
import { AdminProgramBuilder } from "@/components/admin/programs/AdminProgramBuilder";
import {
  ADMIN_LIBRARY_PAGE_SIZE,
  PROGRAM_GOALS,
  PROGRAM_LEVELS,
  PROGRAM_VERSIONING_COMPLETION_REQUIRED,
  programGoalLabel,
  programLevelLabel,
  programStatusLabel,
  translateLibraryError,
  validateProgramDraft,
  type LibrarySaveState,
} from "@/lib/admin/admin-libraries";
import {
  serializeBuilderMetadata,
  slugFromProgramName,
  validateProgramForPublish,
} from "@/lib/admin/admin-program-builder";
import {
  archiveAdminProgramTemplate,
  cloneAdminProgramTemplate,
  emptyProgramDraft,
  emptyProgramWeek,
  getAdminProgramTemplate,
  listAdminProgramTemplates,
  publishAdminProgramTemplate,
  saveAdminProgramTemplate,
  type AdminProgramDetail,
  type AdminProgramListItem,
} from "@/lib/admin/admin-programs-api";
import { formatAdminDate } from "@/lib/admin/admin-status";
import {
  PROGRAM_LOCATIONS,
  buildSevenDayWeek,
  programLocationLabel,
  weekMatchesDaysPerWeek,
  type ProgramLocation,
} from "@/lib/admin/admin-program-ops";

export function ProgramLibraryManager() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState("");
  const [daysFilter, setDaysFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
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
  const [publishIssues, setPublishIssues] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<AdminConfirmRequest | null>(null);
  const [openPreview, setOpenPreview] = useState(false);
  const dirty = Boolean(draft && JSON.stringify(draft) !== baseline);
  const guard = useUnsavedNavigation(dirty, setConfirm);
  const structureLocked = Boolean(draft?.is_published && !draft.archived_at);

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
        setRows(
          result.rows.filter((row) => {
            const daysOk = !daysFilter || String(row.days_per_week) === daysFilter;
            const locationOk =
              !locationFilter || String(row.training_location ?? "").toUpperCase() === locationFilter;
            return daysOk && locationOk;
          }),
        );
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
  }, [debouncedQuery, goal, level, status, offset, daysFilter, locationFilter]);

  const openItem = (id: string | "new", preview = false) =>
    guard(() => {
      setOpenPreview(preview);
      setSelectedId(id);
    });

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
      setPublishIssues([]);
      return;
    }
    let cancelled = false;
    void getAdminProgramTemplate(selectedId)
      .then((item) => {
        if (cancelled) return;
        const weeks =
          item.weeks.length > 0
            ? item.weeks.map((week) =>
                week.days.length === 7 ? week : { ...week, days: buildSevenDayWeek(item.days_per_week) },
              )
            : [emptyProgramWeek(1, item.days_per_week)];
        const next = { ...item, weeks };
        setDraft(next);
        setBaseline(JSON.stringify(next));
        setSaveState("saved");
        setFieldErrors({});
        setPublishIssues([]);
      })
      .catch((err) => setError(translateLibraryError(err)));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  useEffect(() => {
    if (draft && JSON.stringify(draft) !== baseline) setSaveState("unsaved");
  }, [draft, baseline]);

  const refreshList = async () => {
    const result = await listAdminProgramTemplates({
      query: debouncedQuery,
      goal: goal || null,
      level: level || null,
      status: status || null,
      offset,
    });
    setRows(
      result.rows.filter((row) => {
        const daysOk = !daysFilter || String(row.days_per_week) === daysFilter;
        const locationOk =
          !locationFilter || String(row.training_location ?? "").toUpperCase() === locationFilter;
        return daysOk && locationOk;
      }),
    );
    setTotal(result.totalCount);
  };

  const save = async () => {
    if (!draft) return;
    const nextDraft = {
      ...draft,
      slug: draft.slug.trim() || slugFromProgramName(draft.name_ar),
    };
    const errors = validateProgramDraft(nextDraft);
    const week = nextDraft.weeks[0]?.days ?? [];
    if (week.length && !weekMatchesDaysPerWeek(week, nextDraft.days_per_week)) {
      errors.days_per_week = "عدد أيام التدريب يجب أن يطابق أيام التمرين في الأسبوع.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setSaveState("failed");
      return;
    }
    setSaveState("saving");
    const builder = serializeBuilderMetadata(nextDraft);
    const metadata = {
      ...nextDraft.metadata,
      training_location: nextDraft.training_location,
      session_minutes: nextDraft.session_minutes,
      equipment: nextDraft.equipment,
      builder,
    };
    const payload: Record<string, unknown> = {
      id: nextDraft.id || null,
      slug: nextDraft.slug,
      name_ar: nextDraft.name_ar,
      name_en: nextDraft.name_en,
      description_ar: nextDraft.description_ar,
      goal: nextDraft.goal,
      level: nextDraft.level,
      duration_weeks: nextDraft.duration_weeks,
      days_per_week: nextDraft.days_per_week,
      metadata,
    };
    if (!structureLocked) {
      payload.weeks = nextDraft.weeks.map((item, weekIndex) => ({
        week_number: weekIndex + 1,
        title_ar: item.title_ar,
        notes_ar: item.notes_ar,
        days: item.days.map((day, dayIndex) => ({
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
      }));
    }
    try {
      const saved = await saveAdminProgramTemplate(payload, nextDraft.updated_at || null);
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
    const issues = validateProgramForPublish(draft);
    setPublishIssues(issues);
    if (issues.length) {
      setError(issues[0] ?? "لا يمكن النشر قبل إصلاح أخطاء القالب.");
      return;
    }
    setConfirm({
      title: "نشر القالب",
      body: PROGRAM_VERSIONING_COMPLETION_REQUIRED
        ? "بعد النشر يصبح القالب متاحاً للتعيين. تعديل الهيكل لاحقاً يتطلب نسخة جديدة حتى لا تتأثر تعيينات العملاء. PROGRAM_VERSIONING_COMPLETION_REQUIRED."
        : "سيتم نشر القالب للتعيين.",
      confirmLabel: "نشر",
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

  const archive = (id?: string) => {
    const targetId = id ?? draft?.id;
    if (!targetId) return;
    setConfirm({
      title: "أرشفة القالب",
      body: `الأرشفة تخفي القالب من خيارات التعيين. التعيينات الحالية تبقى كما هي.`,
      confirmLabel: "أرشفة",
      tone: "danger",
      onConfirm: () => {
        void archiveAdminProgramTemplate(targetId)
          .then((saved) => {
            if (draft?.id === saved.id) {
              setDraft(saved);
              setBaseline(JSON.stringify(saved));
              setSaveState("saved");
            }
            void refreshList();
          })
          .catch((err) => setError(translateLibraryError(err)));
      },
    });
  };

  const clone = (id: string, mode: "duplicate" | "new_version") => {
    guard(() => {
      void cloneAdminProgramTemplate(id, mode)
        .then((saved) => {
          setSelectedId(saved.id);
          setOpenPreview(false);
          void refreshList();
        })
        .catch((err) => setError(translateLibraryError(err)));
    });
  };

  if (selectedId != null && !draft) {
    return <AdminSkeletonRows rows={8} />;
  }

  if (selectedId != null && draft) {
    return (
      <>
        {error ? <AdminErrorState message={error} onRetry={() => setError(null)} /> : null}
        <AdminProgramBuilder
          draft={draft}
          setDraft={setDraft}
          structureLocked={structureLocked}
          saveState={saveState}
          fieldErrors={fieldErrors}
          dirty={dirty}
          publishIssues={publishIssues}
          initialPreview={openPreview}
          onBack={() =>
            guard(() => {
              setSelectedId(null);
              setDraft(null);
              setOpenPreview(false);
              setPublishIssues([]);
            })
          }
          onSave={() => void save()}
          onPublish={publish}
          onCloneVersion={draft.id ? () => clone(draft.id, "new_version") : undefined}
        />
        <AdminLibraryDialogs request={confirm} onClose={() => setConfirm(null)} />
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        kicker="التدريب"
        title="البرامج التدريبية"
        subtitle="قوالب البرامج للأسبوع والتمارين. القالب ليس برنامج العميل المعيّن."
        actions={
          <button type="button" className="cc-btn cc-btn--primary" onClick={() => openItem("new")}>
            برنامج جديد
          </button>
        }
      />
      <p className="cc-contract">PROGRAM_TEMPLATE ≠ CLIENT_ASSIGNED_PROGRAM · التعيينات الحالية لا تُعدَّل صامتة.</p>
      <AdminConceptKpiRow
        loading={loading}
        metrics={[
          {
            id: "programs",
            label: "البرامج",
            value: total.toLocaleString("ar-AE"),
            hint: "قوالب في المكتبة",
            tone: total > 0 ? "positive" : "neutral",
          },
          {
            id: "page",
            label: "في هذه الصفحة",
            value: rows.length.toLocaleString("ar-AE"),
            hint: "نتائج التصفية الحالية",
          },
          {
            id: "adherence",
            label: "متوسط الالتزام",
            value: "—",
            hint: "لا التزام برامج معتمد في هذه الشاشة",
            tone: "unavailable",
          },
          {
            id: "assigned",
            label: "العملاء المعينون",
            value: "—",
            hint: "التعيين يظهر في ملف العميل",
            tone: "unavailable",
          },
        ]}
      />
      <AdminSearchInput value={query} onChange={setQuery} placeholder="اسم البرنامج" label="بحث البرامج" />
      <AdminFilterBar>
        <label className="cc-filter">
          الهدف
          <select
            value={goal}
            onChange={(event) => {
              setGoal(event.target.value);
              setOffset(0);
            }}
          >
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
          <select
            value={level}
            onChange={(event) => {
              setLevel(event.target.value);
              setOffset(0);
            }}
          >
            <option value="">الكل</option>
            {PROGRAM_LEVELS.map((item) => (
              <option key={item} value={item}>
                {programLevelLabel(item)}
              </option>
            ))}
          </select>
        </label>
        <label className="cc-filter">
          الأيام
          <select
            value={daysFilter}
            onChange={(event) => {
              setDaysFilter(event.target.value);
              setOffset(0);
            }}
          >
            <option value="">الكل</option>
            {[2, 3, 4, 5].map((days) => (
              <option key={days} value={String(days)}>
                {days}
              </option>
            ))}
          </select>
        </label>
        <label className="cc-filter">
          المكان
          <select
            value={locationFilter}
            onChange={(event) => {
              setLocationFilter(event.target.value);
              setOffset(0);
            }}
          >
            <option value="">الكل</option>
            {PROGRAM_LOCATIONS.map((item) => (
              <option key={item} value={item}>
                {programLocationLabel(item)}
              </option>
            ))}
          </select>
        </label>
        <label className="cc-filter">
          الحالة
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setOffset(0);
            }}
          >
            <option value="">الكل</option>
            <option value="draft">مسودة</option>
            <option value="published">نشط</option>
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
              <th>أيام</th>
              <th>المكان</th>
              <th>الإصدار</th>
              <th>الحالة</th>
              <th>تحديث</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={row.id === selectedId ? "is-selected" : undefined}>
                <td>
                  <button type="button" className="cc-row-btn" onClick={() => openItem(row.id)}>
                    {row.name_ar}
                  </button>
                </td>
                <td>{programGoalLabel(row.goal)}</td>
                <td>{programLevelLabel(row.level)}</td>
                <td>{row.days_per_week}</td>
                <td>{programLocationLabel(row.training_location as ProgramLocation)}</td>
                <td>V{row.version}</td>
                <td>
                  <AdminLibraryStatusBadge
                    status={row.archived_at ? "archived" : row.is_published ? "published" : "draft"}
                    label={programStatusLabel(row.is_published, row.archived_at)}
                  />
                </td>
                <td>{formatAdminDate(row.updated_at)}</td>
                <td>
                  <div className="cc-row-actions">
                    <button type="button" className="cc-btn cc-btn--ghost" onClick={() => openItem(row.id)}>
                      فتح
                    </button>
                    <button type="button" className="cc-btn cc-btn--ghost" onClick={() => openItem(row.id, true)}>
                      معاينة
                    </button>
                    <button type="button" className="cc-btn cc-btn--ghost" onClick={() => clone(row.id, "duplicate")}>
                      نسخ القالب
                    </button>
                    <button type="button" className="cc-btn cc-btn--ghost" onClick={() => clone(row.id, "new_version")}>
                      نسخة جديدة
                    </button>
                    {!row.archived_at ? (
                      <button type="button" className="cc-btn cc-btn--ghost" onClick={() => archive(row.id)}>
                        أرشفة
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
      <AdminPagination offset={offset} pageSize={ADMIN_LIBRARY_PAGE_SIZE} total={total} onPage={setOffset} />
      <AdminLibraryDialogs request={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}
