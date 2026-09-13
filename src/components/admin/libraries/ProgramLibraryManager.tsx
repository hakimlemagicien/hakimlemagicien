import { useEffect, useMemo, useState } from "react";
import {
  AdminConceptKpiRow,
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminSearchInput,
} from "@/components/admin/AdminPage";
import { AdminFilterBar, AdminSkeletonRows, type AdminConfirmRequest } from "@/components/admin/AdminConfirmDialog";
import {
  AdminLibraryDialogs,
  AdminPagination,
  useDebouncedValue,
  useUnsavedNavigation,
} from "@/components/admin/AdminLibraryKit";
import { AdminProgramBuilder } from "@/components/admin/programs/AdminProgramBuilder";
import { ProgramTemplateCard } from "@/components/admin/programs/ProgramTemplateCard";
import { TemplateRecommendationDemoStates } from "@/components/admin/programs/TemplateRecommendationDemoStates";
import {
  ADMIN_LIBRARY_MAX_PAGE_SIZE,
  PROGRAM_VERSIONING_COMPLETION_REQUIRED,
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
} from "@/lib/admin/admin-programs-api";
import { buildSevenDayWeek, weekMatchesDaysPerWeek } from "@/lib/admin/admin-program-ops";
import {
  libraryReadinessLabelAr,
  matchesTemplatePresentation,
  presentListItem,
  primaryStrategyLabelAr,
} from "@/lib/admin/admin-template-ui";
import { listPilotAdminDetails } from "@/lib/platform/training-templates";
import {
  LIBRARY_READINESS_STATES,
  PRIMARY_TRAINING_STRATEGIES,
  TEMPLATE_ENVIRONMENTS,
  TEMPLATE_LEVELS,
} from "@/lib/platform/training-templates";
import { CANONICAL_ALL_KEYS, CANONICAL_TEMPLATE_COUNT } from "@/lib/platform/training-templates/phase9/canonical-locked-master";

const CANONICAL_SLUG_SET = new Set<string>(CANONICAL_ALL_KEYS);

export function ProgramLibraryManager() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [primaryStrategy, setPrimaryStrategy] = useState("");
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState("");
  const [daysFilter, setDaysFilter] = useState("");
  const [environmentFilter, setEnvironmentFilter] = useState("");
  const [readinessFilter, setReadinessFilter] = useState("");
  const [canonicalOnly, setCanonicalOnly] = useState(true);
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listAdminProgramTemplates>>["rows"]>([]);
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
  const [showQaDemo, setShowQaDemo] = useState(false);
  const dirty = Boolean(draft && JSON.stringify(draft) !== baseline);
  const guard = useUnsavedNavigation(dirty, setConfirm);
  const structureLocked = Boolean(draft?.is_published && !draft.archived_at);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void listAdminProgramTemplates({
      query: debouncedQuery,
      goal: null,
      level: level ? level.toLowerCase() : null,
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
  }, [debouncedQuery, level, status, offset]);

  const visibleRows = useMemo(() => {
    const pilotDetails = listPilotAdminDetails();
    const pilotAsList = pilotDetails.map((detail) => ({
      id: detail.id,
      slug: detail.slug,
      name_ar: detail.name_ar,
      name_en: detail.name_en,
      goal: detail.goal,
      level: detail.level,
      duration_weeks: detail.duration_weeks,
      days_per_week: detail.days_per_week,
      version: detail.version,
      is_published: detail.is_published,
      archived_at: detail.archived_at,
      assignment_count: detail.assignment_count,
      updated_at: detail.updated_at,
      training_location: detail.training_location,
      metadata: detail.metadata,
      template_contract: (detail.metadata?.template_contract as Record<string, unknown>) ?? null,
    }));
    const bySlug = new Map<string, (typeof rows)[number]>();
    for (const row of rows) bySlug.set(row.slug, row);
    for (const pilot of pilotAsList) {
      const existing = bySlug.get(pilot.slug);
      // Phase 6: DB rows with template_contract take precedence; merge pilot-local only when missing/legacy.
      if (!existing || !existing.metadata?.template_contract) {
        bySlug.set(pilot.slug, { ...existing, ...pilot, id: existing?.id ?? pilot.id });
      }
    }
    return [...bySlug.values()].filter((row) => {
      if (canonicalOnly && !CANONICAL_SLUG_SET.has(row.slug)) return false;
      const presentation = presentListItem(row);
      return matchesTemplatePresentation(presentation, {
        primary_strategy: primaryStrategy || undefined,
        level: level || undefined,
        environment: environmentFilter || undefined,
        days: daysFilter || undefined,
        status: status || undefined,
        library_readiness: readinessFilter || undefined,
      });
    });
  }, [rows, primaryStrategy, level, environmentFilter, daysFilter, status, readinessFilter, canonicalOnly]);

  const canonicalInLibrary = useMemo(
    () => rows.filter((row) => CANONICAL_SLUG_SET.has(row.slug)).length,
    [rows],
  );
  const canonicalVisible = useMemo(
    () => visibleRows.filter((row) => CANONICAL_SLUG_SET.has(row.slug)).length,
    [visibleRows],
  );

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
    if (String(selectedId).startsWith("pilot-local-")) {
      const fromCatalog = listPilotAdminDetails().find((row) => row.id === selectedId);
      if (fromCatalog) {
        setDraft(fromCatalog);
        setBaseline(JSON.stringify(fromCatalog));
        setSaveState("saved");
        setFieldErrors({});
        setPublishIssues([]);
      } else {
        // Avoid stuck AdminSkeletonRows (selectedId set, draft null).
        setError("تعذّر تحميل قالب Pilot المحلي.");
        setSelectedId(null);
        setDraft(null);
      }
      return;
    }
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
      .catch((err) => {
        if (cancelled) return;
        // Phase 8: failed load previously left selectedId set with draft=null → infinite skeleton / error boundary.
        setError(translateLibraryError(err));
        setSelectedId(null);
        setDraft(null);
      });
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
      goal: null,
      level: level ? level.toLowerCase() : null,
      status: status || null,
      offset,
    });
    setRows(result.rows);
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
            activity_role: exercise.activity_role ?? null,
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
      body: "الأرشفة تخفي القالب من خيارات التعيين. التعيينات الحالية تبقى كما هي.",
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
        subtitle="قوالب البرامج — الجمهور، الغرض، الاستراتيجية، المستوى، المكان، الأيام، الجاهزية."
        actions={
          <>
            <button type="button" className="cc-btn cc-btn--ghost" onClick={() => setShowQaDemo((v) => !v)}>
              {showQaDemo ? "إخفاء مراجعة التوصية" : "مراجعة حالات التوصية"}
            </button>
            <button type="button" className="cc-btn cc-btn--primary" onClick={() => openItem("new")}>
              برنامج جديد
            </button>
          </>
        }
      />
      <p className="cc-contract">PROGRAM_TEMPLATE ≠ CLIENT_ASSIGNED_PROGRAM · التوصية لا تعيّن تلقائياً.</p>
      <AdminConceptKpiRow
        loading={loading}
        metrics={[
          {
            id: "canonical",
            label: "Canonical V1",
            value: `${canonicalVisible.toLocaleString("ar-AE")} / ${CANONICAL_TEMPLATE_COUNT}`,
            hint: canonicalOnly
              ? "عرض القوالب الكانونية فقط (ماستر V1)"
              : `في الصفحة من أصل ${canonicalInLibrary} كانوني محمّل`,
            tone: canonicalVisible === CANONICAL_TEMPLATE_COUNT ? "positive" : "neutral",
          },
          {
            id: "programs",
            label: "إجمالي المكتبة",
            value: total.toLocaleString("ar-AE"),
            hint: "كل الصفوف من قاعدة البيانات (يشمل نسخًا غير كانونية إن وُجدت)",
            tone: total > 0 ? "positive" : "neutral",
          },
          {
            id: "page",
            label: "في هذه الصفحة",
            value: visibleRows.length.toLocaleString("ar-AE"),
            hint: "بعد الفلاتر الحالية",
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

      {showQaDemo ? <TemplateRecommendationDemoStates /> : null}

      <AdminSearchInput value={query} onChange={setQuery} placeholder="اسم البرنامج" label="بحث البرامج" />
      <AdminFilterBar>
        <label className="cc-filter">
          الاستراتيجية
          <select
            value={primaryStrategy}
            onChange={(event) => {
              setPrimaryStrategy(event.target.value);
              setOffset(0);
            }}
          >
            <option value="">الكل</option>
            {PRIMARY_TRAINING_STRATEGIES.map((item) => (
              <option key={item} value={item}>
                {primaryStrategyLabelAr(item)}
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
            {TEMPLATE_LEVELS.map((item) => (
              <option key={item} value={item}>
                {item === "BEGINNER" ? "مبتدئ" : item === "INTERMEDIATE" ? "متوسط" : "متقدم"}
              </option>
            ))}
          </select>
        </label>
        <label className="cc-filter">
          المكان
          <select
            value={environmentFilter}
            onChange={(event) => {
              setEnvironmentFilter(event.target.value);
              setOffset(0);
            }}
          >
            <option value="">الكل</option>
            {TEMPLATE_ENVIRONMENTS.map((item) => (
              <option key={item} value={item}>
                {item === "HOME" ? "منزل" : "صالة"}
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
            {[3, 4, 5].map((days) => (
              <option key={days} value={String(days)}>
                {days}
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
            <option value="published">منشور</option>
            <option value="archived">مؤرشف</option>
          </select>
        </label>
        <label className="cc-filter">
          جاهزية المكتبة
          <select
            value={readinessFilter}
            onChange={(event) => {
              setReadinessFilter(event.target.value);
              setOffset(0);
            }}
          >
            <option value="">الكل</option>
            {LIBRARY_READINESS_STATES.map((item) => (
              <option key={item} value={item}>
                {libraryReadinessLabelAr(item)}
              </option>
            ))}
          </select>
        </label>
        <label className="cc-filter">
          نطاق المكتبة
          <select
            value={canonicalOnly ? "canonical" : "all"}
            onChange={(event) => {
              setCanonicalOnly(event.target.value === "canonical");
              setOffset(0);
            }}
          >
            <option value="canonical">Canonical V1 فقط ({CANONICAL_TEMPLATE_COUNT})</option>
            <option value="all">الكل (يشمل نسخًا غير كانونية)</option>
          </select>
        </label>
      </AdminFilterBar>
      {error ? <AdminErrorState message={error} onRetry={() => setOffset(0)} /> : null}
      {loading ? (
        <AdminSkeletonRows rows={8} />
      ) : visibleRows.length === 0 ? (
        <AdminEmptyState
          title="لا قوالب مطابقة"
          body={rows.length === 0 ? "لا توجد قوالب بعد. أنشئ قالباً جديداً." : "الفلاتر قد تخفي النتائج. غيّر التصفية."}
        />
      ) : (
        <div className="tpl-card-grid" aria-label="قائمة قوالب البرامج">
          {visibleRows.map((row) => {
            const presentation = presentListItem(row);
            return (
              <ProgramTemplateCard
                key={row.id}
                row={row}
                presentation={presentation}
                selected={row.id === selectedId}
                onOpen={() => openItem(row.id)}
                onPreview={() => openItem(row.id, true)}
                onClone={() => clone(row.id, "duplicate")}
                onNewVersion={() => clone(row.id, "new_version")}
                onArchive={!row.archived_at ? () => archive(row.id) : undefined}
              />
            );
          })}
        </div>
      )}
      <AdminPagination offset={offset} pageSize={ADMIN_LIBRARY_MAX_PAGE_SIZE} total={total} onPage={setOffset} />
      <AdminLibraryDialogs request={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}
