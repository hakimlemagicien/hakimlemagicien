import { useEffect, useMemo, useState } from "react";
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
  EXERCISE_DIFFICULTIES,
  EXERCISE_TYPES,
  canActivateExercise,
  csvToList,
  exerciseStatusLabel,
  listToCsv,
  translateLibraryError,
  validateExerciseDraft,
  validateExerciseV2Draft,
  type LibrarySaveState,
} from "@/lib/admin/admin-libraries";
import {
  COMPLEXITY_LEVELS,
  EQUIPMENT_STATES,
  EXECUTION_SIDES,
  LOADING_TYPES,
  MECHANICS,
  MOVEMENT_ROLES,
  PRESCRIPTION_MODES,
  V2_METADATA_STATUSES,
} from "@/lib/platform/exercise-library-v2";
import {
  emptyExerciseDraft,
  fetchExerciseFilterOptions,
  getAdminExercise,
  listAdminExercises,
  saveAdminExercise,
  setAdminExerciseActive,
  type AdminExerciseDetail,
  type AdminExerciseFilterOptions,
  type AdminExerciseListItem,
} from "@/lib/admin/admin-exercises-api";
import { formatAdminDate } from "@/lib/admin/admin-status";
import { fetchResolvedExerciseMediaUrl } from "@/lib/platform/exercise-media";
import { detectExerciseSensitiveChanges } from "@/lib/admin/admin-library-safety";
import { LibraryImpactWarningCard } from "@/components/admin/LibraryImpactWarningCard";
import type { LibraryImpactWarning } from "@/lib/admin/admin-library-safety";

export function ExerciseLibraryManager() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [muscle, setMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [type, setType] = useState("");
  const [active, setActive] = useState("");
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<AdminExerciseListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<AdminExerciseFilterOptions>({ muscles: [], equipment: [] });
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<ReturnType<typeof emptyExerciseDraft> | AdminExerciseDetail | null>(null);
  const [baseline, setBaseline] = useState("");
  const [saveState, setSaveState] = useState<LibrarySaveState>("saved");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<AdminConfirmRequest | null>(null);
  const [pendingImpact, setPendingImpact] = useState<LibraryImpactWarning | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const dirty = Boolean(draft && JSON.stringify(draft) !== baseline);
  const guard = useUnsavedNavigation(dirty, setConfirm);

  useEffect(() => {
    void fetchExerciseFilterOptions()
      .then(setOptions)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void listAdminExercises({
      query: debouncedQuery,
      muscle: muscle || null,
      equipment: equipment || null,
      difficulty: difficulty || null,
      type: type || null,
      active: active === "" ? null : active === "active",
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
  }, [debouncedQuery, muscle, equipment, difficulty, type, active, offset]);

  const openItem = (id: string | "new") => {
    guard(() => {
      setSelectedId(id);
    });
  };

  useEffect(() => {
    if (selectedId == null) {
      setDraft(null);
      return;
    }
    if (selectedId === "new") {
      const next = emptyExerciseDraft(options.muscles[0]?.id ?? "");
      setDraft(next);
      setBaseline(JSON.stringify(next));
      setSaveState("saved");
      setFieldErrors({});
      return;
    }
    let cancelled = false;
    void getAdminExercise(selectedId)
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
    if (!draft?.thumbnail_path && !draft?.video_path) {
      setPreviewUrl(null);
      return;
    }
    let cancelled = false;
    void fetchResolvedExerciseMediaUrl({
      status: (draft.video_status as "placeholder" | "ready" | "missing") ?? "placeholder",
      path: draft.thumbnail_path || draft.video_path,
      kind: "exercise",
    })
      .then((url) => {
        if (!cancelled) setPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [draft?.thumbnail_path, draft?.video_path, draft?.video_status]);

  useEffect(() => {
    if (draft && JSON.stringify(draft) !== baseline) setSaveState("unsaved");
  }, [draft, baseline]);

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  );

  const commitSave = async () => {
    if (!draft) return;
    const errors = {
      ...validateExerciseDraft({
        name_ar: draft.name_ar,
        name_en: draft.name_en,
        muscle_group_id: draft.muscle_group_id,
        exercise_type: draft.exercise_type,
        difficulty: draft.difficulty,
        duration_seconds: Number(draft.duration_seconds),
      }),
      ...validateExerciseV2Draft({
        v2_metadata_status: draft.v2_metadata_status,
        primary_muscle_canonical: draft.primary_muscle_canonical,
        primary_movement_role: draft.primary_movement_role,
        equipment_state: draft.equipment_state,
        required_equipment: draft.required_equipment,
        mechanics: draft.mechanics,
        is_bodyweight: draft.is_bodyweight,
        is_unilateral: draft.is_unilateral,
        prescription_mode: draft.prescription_mode,
        supports_timed_prescription: draft.supports_timed_prescription,
      }),
    };
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setSaveState("failed");
      return;
    }
    setSaveState("saving");
    try {
      const saved = await saveAdminExercise(
        {
          id: draft.id || null,
          external_id: draft.external_id || null,
          slug: draft.slug || null,
          name_ar: draft.name_ar,
          name_en: draft.name_en,
          muscle_group_id: draft.muscle_group_id,
          equipment: draft.equipment,
          difficulty: draft.difficulty,
          exercise_type: draft.exercise_type,
          primary_muscle: draft.primary_muscle,
          secondary_muscles: draft.secondary_muscles,
          coach_notes: draft.coach_notes,
          duration_seconds: Number(draft.duration_seconds),
          youtube_url: draft.youtube_url,
          video_path: draft.video_path,
          instructions_video_path: draft.instructions_video_path,
          thumbnail_path: draft.thumbnail_path,
          video_status: draft.video_status,
          instructions_status: draft.instructions_status,
          sort_order: draft.sort_order,
          v2_metadata_status: draft.v2_metadata_status,
          primary_muscle_canonical: draft.primary_muscle_canonical,
          secondary_muscles_canonical: draft.secondary_muscles_canonical,
          primary_movement_role: draft.primary_movement_role,
          secondary_movement_roles: draft.secondary_movement_roles,
          substitution_group: draft.substitution_group,
          mechanics: draft.mechanics,
          loading_type: draft.loading_type,
          required_equipment: draft.required_equipment,
          equipment_state: draft.equipment_state,
          location_compatibility: draft.location_compatibility,
          is_bodyweight: draft.is_bodyweight,
          is_unilateral: draft.is_unilateral,
          execution_sides: draft.execution_sides,
          supports_timed_prescription: draft.supports_timed_prescription,
          prescription_mode: draft.prescription_mode,
          conditioning_class: draft.conditioning_class,
          complexity: draft.complexity,
          beginner_eligible: draft.beginner_eligible,
        },
        draft.updated_at,
      );
      setDraft(saved);
      setBaseline(JSON.stringify(saved));
      setSelectedId(saved.id);
      setSaveState("saved");
      setOffset(0);
      const result = await listAdminExercises({
        query: debouncedQuery,
        muscle: muscle || null,
        equipment: equipment || null,
        difficulty: difficulty || null,
        type: type || null,
        active: active === "" ? null : active === "active",
        offset: 0,
      });
      setRows(result.rows);
      setTotal(result.totalCount);
    } catch (err) {
      setSaveState("failed");
      setError(translateLibraryError(err));
    }
  };

  const save = async (skipImpactCheck = false) => {
    if (!skipImpactCheck && baseline && draft) {
      try {
        const before = JSON.parse(baseline) as Record<string, unknown>;
        const warning = detectExerciseSensitiveChanges(before, draft as Record<string, unknown>);
        if (warning) {
          setPendingImpact(warning);
          return;
        }
      } catch {
        // baseline parse failure — proceed with save
      }
    }
    setPendingImpact(null);
    await commitSave();
  };

  const archive = (makeActive: boolean) => {
    if (!draft?.id) return;
    if (!makeActive && !canActivateExercise(draft) && makeActive) return;
    setConfirm({
      title: makeActive ? "تفعيل التمرين" : "أرشفة التمرين",
      body: makeActive
        ? "سيظهر التمرين للعملاء في المكتبة النشطة."
        : "سيختفي التمرين من المكتبة النشطة. البرامج والسجلات التاريخية تبقى. لا حذف نهائي.",
      confirmLabel: makeActive ? "تفعيل" : "أرشفة",
      tone: makeActive ? "primary" : "danger",
      onConfirm: () => {
        void setAdminExerciseActive(draft.id, makeActive)
          .then((saved) => {
            setDraft(saved);
            setBaseline(JSON.stringify(saved));
            setSaveState("saved");
          })
          .catch((err) => setError(translateLibraryError(err)));
      },
    });
  };

  return (
    <>
      <AdminPageHeader
        kicker="مكتبة التدريب"
        title="التمارين"
        subtitle="مكتبة التمارين — تعديل التعريف قد يؤثر على Strategy Matrix. لا يعاد كتابة برامج العملاء تلقائيًا."
        actions={
          <button type="button" className="cc-btn cc-btn--primary" onClick={() => openItem("new")}>
            تمرين جديد
          </button>
        }
      />
      <AdminLibraryLayout
        list={
          <>
            <AdminSearchInput value={query} onChange={setQuery} placeholder="اسم عربي / إنجليزي / المعرّف" label="بحث التمارين" />
            <AdminFilterBar>
              <label className="cc-filter">
                العضلة
                <select value={muscle} onChange={(event) => { setMuscle(event.target.value); setOffset(0); }}>
                  <option value="">الكل</option>
                  {options.muscles.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name_ar}
                    </option>
                  ))}
                </select>
              </label>
              {options.equipment.length > 0 ? (
                <label className="cc-filter">
                  المعدات
                  <select value={equipment} onChange={(event) => { setEquipment(event.target.value); setOffset(0); }}>
                    <option value="">الكل</option>
                    {options.equipment.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="cc-filter">
                الصعوبة
                <select value={difficulty} onChange={(event) => { setDifficulty(event.target.value); setOffset(0); }}>
                  <option value="">الكل</option>
                  {EXERCISE_DIFFICULTIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="cc-filter">
                النوع
                <select value={type} onChange={(event) => { setType(event.target.value); setOffset(0); }}>
                  <option value="">الكل</option>
                  {EXERCISE_TYPES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="cc-filter">
                الحالة
                <select value={active} onChange={(event) => { setActive(event.target.value); setOffset(0); }}>
                  <option value="">الكل</option>
                  <option value="active">نشط</option>
                  <option value="archived">مؤرشف</option>
                </select>
              </label>
            </AdminFilterBar>
            {error ? <AdminErrorState message={error} onRetry={() => setOffset(0)} /> : null}
            {loading ? (
              <AdminSkeletonRows rows={8} />
            ) : rows.length === 0 ? (
              <AdminEmptyState title="لا تمارين مطابقة" body="غيّر البحث أو أضف تمريناً جديداً." />
            ) : (
              <AdminTable>
                <thead>
                  <tr>
                    <th>التمرين</th>
                    <th>English</th>
                    <th>النوع</th>
                    <th>العضلة</th>
                    <th>المعدات</th>
                    <th>الحالة</th>
                    <th>الوسائط</th>
                    <th>V2</th>
                    <th>تحديث</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className={row.id === selectedId ? "is-selected" : undefined}
                      onClick={() => openItem(row.id)}
                    >
                      <td>
                        <button type="button" className="cc-row-btn" onClick={() => openItem(row.id)}>
                          {row.name_ar}
                        </button>
                        <div className="cc-muted">{row.external_id}</div>
                      </td>
                      <td dir="ltr">{row.name_en}</td>
                      <td>{row.exercise_type}</td>
                      <td>{row.muscle_group_name_ar || row.primary_muscle || "—"}</td>
                      <td>{row.equipment || "—"}</td>
                      <td>
                        <AdminLibraryStatusBadge
                          status={row.is_active ? "active" : "archived"}
                          label={exerciseStatusLabel(row.is_active)}
                        />
                      </td>
                      <td>{row.video_status}</td>
                      <td>{row.v2_metadata_status}</td>
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
            <AdminEmptyState title="اختر تمريناً" body="افتح عنصراً من القائمة أو أنشئ تمريناً جديداً." />
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
                <button type="submit" className="cc-btn cc-btn--primary" disabled={saveState === "saving"}>
                  حفظ مسودة
                </button>
                {draft.id ? (
                  draft.is_active ? (
                    <button type="button" className="cc-btn cc-btn--ghost" onClick={() => archive(false)}>
                      أرشفة
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="cc-btn cc-btn--primary"
                      disabled={!canActivateExercise(draft) || dirty}
                      onClick={() => archive(true)}
                    >
                      تفعيل
                    </button>
                  )
                ) : null}
              </AdminEditorToolbar>
              {firstFieldError(fieldErrors) ? <p className="cc-field__error">{firstFieldError(fieldErrors)}</p> : null}
              <div className="cc-form-grid">
                <AdminField label="الاسم العربي" htmlFor="name_ar" error={fieldErrors.name_ar}>
                  <AdminTextInput id="name_ar" value={draft.name_ar} error={fieldErrors.name_ar} onChange={(value) => setDraft({ ...draft, name_ar: value })} />
                </AdminField>
                <AdminField label="English name" htmlFor="name_en" error={fieldErrors.name_en}>
                  <AdminTextInput id="name_en" dir="ltr" value={draft.name_en} error={fieldErrors.name_en} onChange={(value) => setDraft({ ...draft, name_en: value })} />
                </AdminField>
                <AdminField
                  label="المعرّف"
                  htmlFor="external_id"
                  hint={draft.id ? "ثابت بعد الإنشاء. لا يُستخدم الاسم كهوية." : "مطلوب عند الإنشاء. مثال CH-001"}
                >
                  <AdminTextInput
                    id="external_id"
                    dir="ltr"
                    value={draft.external_id}
                    onChange={(value) => {
                      if (draft.id) return;
                      setDraft({ ...draft, external_id: value });
                    }}
                  />
                </AdminField>
                <AdminField label="Slug" htmlFor="slug">
                  <AdminTextInput id="slug" dir="ltr" value={draft.slug} onChange={(value) => setDraft({ ...draft, slug: value })} />
                </AdminField>
                <AdminField label="المجموعة العضلية" htmlFor="muscle_group_id" error={fieldErrors.muscle_group_id}>
                  <AdminSelect id="muscle_group_id" value={draft.muscle_group_id} onChange={(value) => setDraft({ ...draft, muscle_group_id: value })}>
                    <option value="">اختر</option>
                    {options.muscles.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name_ar}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="النوع" htmlFor="exercise_type">
                  <AdminSelect id="exercise_type" value={draft.exercise_type} onChange={(value) => setDraft({ ...draft, exercise_type: value })}>
                    {EXERCISE_TYPES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="الصعوبة" htmlFor="difficulty">
                  <AdminSelect id="difficulty" value={draft.difficulty ?? ""} onChange={(value) => setDraft({ ...draft, difficulty: value || null })}>
                    <option value="">غير محدد</option>
                    {EXERCISE_DIFFICULTIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="المعدات" htmlFor="equipment">
                  <AdminTextInput id="equipment" value={draft.equipment ?? ""} onChange={(value) => setDraft({ ...draft, equipment: value })} />
                </AdminField>
                <AdminField label="العضلة الأساسية" htmlFor="primary_muscle">
                  <AdminTextInput id="primary_muscle" value={draft.primary_muscle ?? ""} onChange={(value) => setDraft({ ...draft, primary_muscle: value })} />
                </AdminField>
                <AdminField label="عضلات ثانوية" htmlFor="secondary_muscles" hint="افصل بفاصلة">
                  <AdminTextInput
                    id="secondary_muscles"
                    value={listToCsv(draft.secondary_muscles)}
                    onChange={(value) => setDraft({ ...draft, secondary_muscles: csvToList(value) })}
                  />
                </AdminField>
                <AdminField label="المدة بالثواني" htmlFor="duration_seconds" error={fieldErrors.duration_seconds}>
                  <AdminTextInput
                    id="duration_seconds"
                    type="number"
                    value={String(draft.duration_seconds)}
                    onChange={(value) => setDraft({ ...draft, duration_seconds: Number(value) || 0 })}
                  />
                </AdminField>
                <AdminField label="YouTube" htmlFor="youtube_url">
                  <AdminTextInput id="youtube_url" dir="ltr" value={draft.youtube_url ?? ""} onChange={(value) => setDraft({ ...draft, youtube_url: value })} />
                </AdminField>
                <AdminField label="مسار الفيديو" htmlFor="video_path" hint="مسار داخل bucket exercise-media">
                  <AdminTextInput id="video_path" dir="ltr" value={draft.video_path ?? ""} onChange={(value) => setDraft({ ...draft, video_path: value })} />
                </AdminField>
                <AdminField label="مسار التعليمات" htmlFor="instructions_video_path">
                  <AdminTextInput id="instructions_video_path" dir="ltr" value={draft.instructions_video_path ?? ""} onChange={(value) => setDraft({ ...draft, instructions_video_path: value })} />
                </AdminField>
                <AdminField label="الصورة المصغرة" htmlFor="thumbnail_path">
                  <AdminTextInput id="thumbnail_path" dir="ltr" value={draft.thumbnail_path ?? ""} onChange={(value) => setDraft({ ...draft, thumbnail_path: value })} />
                </AdminField>
                <AdminField label="حالة الفيديو" htmlFor="video_status">
                  <AdminSelect id="video_status" value={draft.video_status} onChange={(value) => setDraft({ ...draft, video_status: value })}>
                    <option value="placeholder">placeholder</option>
                    <option value="ready">ready</option>
                    <option value="missing">missing</option>
                  </AdminSelect>
                </AdminField>
                <AdminField label="حالة التعليمات" htmlFor="instructions_status">
                  <AdminSelect id="instructions_status" value={draft.instructions_status} onChange={(value) => setDraft({ ...draft, instructions_status: value })}>
                    <option value="placeholder">placeholder</option>
                    <option value="ready">ready</option>
                    <option value="missing">missing</option>
                  </AdminSelect>
                </AdminField>
              </div>
              <p className="cc-muted">بيانات التدريب V2 — منفصلة عن حالة الفيديو. لا تُخمّن في وقت التشغيل.</p>
              <div className="cc-form-grid">
                <AdminField label="حالة بيانات V2" htmlFor="v2_metadata_status" error={fieldErrors.v2_metadata_status}>
                  <AdminSelect
                    id="v2_metadata_status"
                    value={draft.v2_metadata_status}
                    onChange={(value) => setDraft({ ...draft, v2_metadata_status: value })}
                  >
                    {V2_METADATA_STATUSES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="العضلة الأساسية (canonical)" htmlFor="primary_muscle_canonical" error={fieldErrors.primary_muscle_canonical}>
                  <AdminTextInput
                    id="primary_muscle_canonical"
                    dir="ltr"
                    value={draft.primary_muscle_canonical ?? ""}
                    onChange={(value) => setDraft({ ...draft, primary_muscle_canonical: value })}
                  />
                </AdminField>
                <AdminField label="دور الحركة الأساسي" htmlFor="primary_movement_role" error={fieldErrors.primary_movement_role}>
                  <AdminSelect
                    id="primary_movement_role"
                    value={draft.primary_movement_role ?? ""}
                    onChange={(value) => setDraft({ ...draft, primary_movement_role: value || null })}
                  >
                    <option value="">غير محدد</option>
                    {MOVEMENT_ROLES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="الميكانيكا" htmlFor="mechanics" error={fieldErrors.mechanics}>
                  <AdminSelect
                    id="mechanics"
                    value={draft.mechanics ?? ""}
                    onChange={(value) => setDraft({ ...draft, mechanics: value || null })}
                  >
                    <option value="">غير محدد</option>
                    {MECHANICS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="نوع التحميل" htmlFor="loading_type">
                  <AdminSelect
                    id="loading_type"
                    value={draft.loading_type ?? ""}
                    onChange={(value) => setDraft({ ...draft, loading_type: value || null })}
                  >
                    <option value="">غير محدد</option>
                    {LOADING_TYPES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="حالة المعدات" htmlFor="equipment_state" error={fieldErrors.equipment_state} hint="NO_EQUIPMENT ≠ UNKNOWN">
                  <AdminSelect
                    id="equipment_state"
                    value={draft.equipment_state}
                    onChange={(value) => setDraft({ ...draft, equipment_state: value })}
                  >
                    {EQUIPMENT_STATES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="المعدات المطلوبة" htmlFor="required_equipment" hint="مفاتيح canonical مفصولة بفاصلة" error={fieldErrors.required_equipment}>
                  <AdminTextInput
                    id="required_equipment"
                    dir="ltr"
                    value={listToCsv(draft.required_equipment)}
                    onChange={(value) => setDraft({ ...draft, required_equipment: csvToList(value) })}
                  />
                </AdminField>
                <AdminField label="توافق المكان" htmlFor="location_compatibility" hint="GYM, HOME, NO_EQUIPMENT">
                  <AdminTextInput
                    id="location_compatibility"
                    dir="ltr"
                    value={listToCsv(draft.location_compatibility)}
                    onChange={(value) => setDraft({ ...draft, location_compatibility: csvToList(value) })}
                  />
                </AdminField>
                <AdminField label="وزن الجسم" htmlFor="is_bodyweight" error={fieldErrors.is_bodyweight}>
                  <AdminSelect
                    id="is_bodyweight"
                    value={draft.is_bodyweight == null ? "" : String(draft.is_bodyweight)}
                    onChange={(value) =>
                      setDraft({ ...draft, is_bodyweight: value === "" ? null : value === "true" })
                    }
                  >
                    <option value="">غير معروف</option>
                    <option value="true">نعم</option>
                    <option value="false">لا</option>
                  </AdminSelect>
                </AdminField>
                <AdminField label="أحادي الجانب" htmlFor="is_unilateral" error={fieldErrors.is_unilateral}>
                  <AdminSelect
                    id="is_unilateral"
                    value={draft.is_unilateral == null ? "" : String(draft.is_unilateral)}
                    onChange={(value) =>
                      setDraft({ ...draft, is_unilateral: value === "" ? null : value === "true" })
                    }
                  >
                    <option value="">غير معروف</option>
                    <option value="true">نعم</option>
                    <option value="false">لا</option>
                  </AdminSelect>
                </AdminField>
                <AdminField label="تنفيذ الجانبين" htmlFor="execution_sides">
                  <AdminSelect
                    id="execution_sides"
                    value={draft.execution_sides ?? ""}
                    onChange={(value) => setDraft({ ...draft, execution_sides: value || null })}
                  >
                    <option value="">غير محدد</option>
                    {EXECUTION_SIDES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="وضع الوصفة" htmlFor="prescription_mode" error={fieldErrors.prescription_mode}>
                  <AdminSelect
                    id="prescription_mode"
                    value={draft.prescription_mode ?? ""}
                    onChange={(value) => setDraft({ ...draft, prescription_mode: value || null })}
                  >
                    <option value="">غير محدد</option>
                    {PRESCRIPTION_MODES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="وصفة زمنية" htmlFor="supports_timed_prescription">
                  <AdminSelect
                    id="supports_timed_prescription"
                    value={draft.supports_timed_prescription == null ? "" : String(draft.supports_timed_prescription)}
                    onChange={(value) =>
                      setDraft({
                        ...draft,
                        supports_timed_prescription: value === "" ? null : value === "true",
                      })
                    }
                  >
                    <option value="">غير معروف</option>
                    <option value="true">نعم</option>
                    <option value="false">لا</option>
                  </AdminSelect>
                </AdminField>
                <AdminField label="التعقيد التقني" htmlFor="complexity">
                  <AdminSelect
                    id="complexity"
                    value={draft.complexity ?? ""}
                    onChange={(value) => setDraft({ ...draft, complexity: value || null })}
                  >
                    <option value="">غير محدد</option>
                    {COMPLEXITY_LEVELS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="مجموعة الاستبدال" htmlFor="substitution_group" hint="مفتاح دلالي وليس قائمة بدائل يدوية">
                  <AdminTextInput
                    id="substitution_group"
                    dir="ltr"
                    value={draft.substitution_group ?? ""}
                    onChange={(value) => setDraft({ ...draft, substitution_group: value })}
                  />
                </AdminField>
              </div>
              <AdminField label="ملاحظات الكوتش / التعليمات" htmlFor="coach_notes">
                <AdminTextarea id="coach_notes" value={draft.coach_notes ?? ""} onChange={(value) => setDraft({ ...draft, coach_notes: value })} />
              </AdminField>
              <AdminPreview title="معاينة العميل">
                <p className="cc-preview-title">{draft.name_ar || "بدون اسم"}</p>
                <p className="cc-muted" dir="ltr">
                  {draft.name_en || "Untitled"}
                </p>
                <p>{draft.coach_notes || "لا تعليمات بعد."}</p>
                {previewUrl ? <img src={previewUrl} alt="" className="cc-preview-media" /> : <p className="cc-muted">لا توجد وسائط جاهزة للعرض.</p>}
                {selectedRow ? <p className="cc-muted">آخر تحديث: {formatAdminDate(selectedRow.updated_at)}</p> : null}
              </AdminPreview>
            </form>
          )
        }
      />
      <AdminLibraryDialogs request={confirm} onClose={() => setConfirm(null)} />
      {pendingImpact ? (
        <LibraryImpactWarningCard
          warning={pendingImpact}
          busy={saveState === "saving"}
          onConfirm={() => void save(true)}
          onCancel={() => setPendingImpact(null)}
        />
      ) : null}
    </>
  );
}
