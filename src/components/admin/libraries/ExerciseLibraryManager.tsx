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
  type LibrarySaveState,
} from "@/lib/admin/admin-libraries";
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

  const save = async () => {
    if (!draft) return;
    const errors = validateExerciseDraft({
      name_ar: draft.name_ar,
      name_en: draft.name_en,
      muscle_group_id: draft.muscle_group_id,
      exercise_type: draft.exercise_type,
      difficulty: draft.difficulty,
      duration_seconds: Number(draft.duration_seconds),
    });
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
        subtitle="إدارة مكتبة التمارين المعتمدة. المصدر هو جدول exercises نفسه الذي يقرأه التطبيق."
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
                <AdminField label="المعرّف" htmlFor="external_id">
                  <AdminTextInput id="external_id" dir="ltr" value={draft.external_id} onChange={(value) => setDraft({ ...draft, external_id: value })} />
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
    </>
  );
}
