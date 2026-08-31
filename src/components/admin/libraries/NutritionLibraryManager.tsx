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
  MEAL_STATUSES,
  MEAL_TYPES,
  canPublishMeal,
  csvToList,
  ingredientsChanged,
  listToCsv,
  mealStatusLabel,
  mealTypeLabel,
  moveItem,
  translateLibraryError,
  validateMealDraft,
  type LibrarySaveState,
} from "@/lib/admin/admin-libraries";
import {
  emptyMealDraft,
  emptyMealIngredient,
  getAdminMeal,
  listAdminMeals,
  saveAdminMeal,
  setAdminMealStatus,
  type AdminMealDetail,
  type AdminMealListItem,
} from "@/lib/admin/admin-meals-api";
import { formatAdminDate } from "@/lib/admin/admin-status";
import { mealDeliveryPath } from "@/lib/platform/meal-library";
import { detectMealSensitiveChanges } from "@/lib/admin/admin-library-safety";
import { LibraryImpactWarningCard } from "@/components/admin/LibraryImpactWarningCard";
import type { LibraryImpactWarning } from "@/lib/admin/admin-library-safety";
import { NUTRITION_BOUNDARIES } from "@/lib/admin/admin-architecture";

export function NutritionLibraryManager() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<AdminMealListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<AdminMealDetail | null>(null);
  const [originalIngredients, setOriginalIngredients] = useState(draft?.ingredients ?? []);
  const [allergensConfirmed, setAllergensConfirmed] = useState(false);
  const [baseline, setBaseline] = useState("");
  const [saveState, setSaveState] = useState<LibrarySaveState>("saved");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<AdminConfirmRequest | null>(null);
  const [pendingImpact, setPendingImpact] = useState<LibraryImpactWarning | null>(null);
  const [subJson, setSubJson] = useState("{}");
  const dirty = Boolean(draft && JSON.stringify(draft) !== baseline);
  const guard = useUnsavedNavigation(dirty, setConfirm);
  const ingredientsDirty = draft ? ingredientsChanged(originalIngredients, draft.ingredients) : false;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void listAdminMeals({
      query: debouncedQuery,
      type: type || null,
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
  }, [debouncedQuery, type, status, offset]);

  const openItem = (id: string | "new") => guard(() => setSelectedId(id));

  useEffect(() => {
    if (selectedId == null) {
      setDraft(null);
      return;
    }
    if (selectedId === "new") {
      const next = emptyMealDraft();
      setDraft(next);
      setOriginalIngredients(next.ingredients);
      setBaseline(JSON.stringify(next));
      setSubJson("{}");
      setAllergensConfirmed(false);
      setSaveState("saved");
      setFieldErrors({});
      return;
    }
    let cancelled = false;
    void getAdminMeal(selectedId)
      .then((item) => {
        if (cancelled) return;
        setDraft(item);
        setOriginalIngredients(item.ingredients);
        setBaseline(JSON.stringify(item));
        setSubJson(JSON.stringify(item.substitution_profile ?? {}, null, 2));
        setAllergensConfirmed(false);
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

  const refreshList = async () => {
    const result = await listAdminMeals({
      query: debouncedQuery,
      type: type || null,
      status: status || null,
      offset,
    });
    setRows(result.rows);
    setTotal(result.totalCount);
  };

  const commitSave = async () => {
    if (!draft) return;
    const errors = validateMealDraft(draft);
    try {
      draft.substitution_profile = JSON.parse(subJson || "{}") as Record<string, unknown>;
    } catch {
      errors.substitution_profile = "صيغة البدائل غير صالحة.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setSaveState("failed");
      return;
    }
    if (ingredientsDirty && !allergensConfirmed) {
      setFieldErrors({ allergens: "راجع مسببات الحساسية بعد تغيير المكوّنات ثم أكّد." });
      setSaveState("failed");
      return;
    }
    setSaveState("saving");
    try {
      const saved = await saveAdminMeal(
        {
          id: draft.id || null,
          external_id: draft.external_id,
          name_ar: draft.name_ar,
          name_en: draft.name_en,
          description_ar: draft.description_ar,
          description_en: draft.description_en,
          meal_type: draft.meal_type,
          suitable_goals: draft.suitable_goals,
          dietary_tags: draft.dietary_tags,
          allergens: draft.allergens,
          calories: draft.calories,
          protein_g: draft.protein_g,
          carbs_g: draft.carbs_g,
          fat_g: draft.fat_g,
          serving_size: draft.serving_size,
          serving_unit: draft.serving_unit,
          yield_servings: draft.yield_servings,
          preparation_steps_ar: draft.preparation_steps_ar.filter(Boolean),
          preparation_steps_en: draft.preparation_steps_en.filter(Boolean),
          preparation_time_minutes: draft.preparation_time_minutes,
          image_path: draft.image_path,
          image_thumb_path: draft.image_thumb_path,
          image_master_path: draft.image_master_path,
          image_status: draft.image_status,
          image_alt_ar: draft.image_alt_ar,
          image_alt_en: draft.image_alt_en,
          notes: draft.notes,
          substitution_profile: draft.substitution_profile,
          review_status: draft.review_status,
          ingredients: draft.ingredients,
          allergens_confirmed: allergensConfirmed || !ingredientsDirty,
        },
        draft.updated_at || null,
      );
      setDraft(saved);
      setOriginalIngredients(saved.ingredients);
      setBaseline(JSON.stringify(saved));
      setSelectedId(saved.id);
      setSaveState("saved");
      setAllergensConfirmed(false);
      await refreshList();
    } catch (err) {
      setSaveState("failed");
      setError(translateLibraryError(err));
    }
  };

  const save = async (skipImpactCheck = false) => {
    if (!skipImpactCheck && baseline && draft) {
      try {
        const before = JSON.parse(baseline) as Record<string, unknown>;
        const warning = detectMealSensitiveChanges(before, draft as Record<string, unknown>, ingredientsDirty);
        if (warning) {
          setPendingImpact(warning);
          return;
        }
      } catch {
        // proceed
      }
    }
    setPendingImpact(null);
    await commitSave();
  };

  const changeStatus = (next: "pilot" | "published" | "archived") => {
    if (!draft?.id) return;
    if (next === "published" && (!canPublishMeal(draft) || dirty)) return;
    setConfirm({
      title: next === "archived" ? "أرشفة الوجبة" : next === "published" ? "نشر الوجبة" : "إرجاع للتجريب",
      body:
        next === "archived"
          ? "ستختفي الوجبة من المكتبة النشطة. السجلات التاريخية تبقى. لا حذف نهائي."
          : next === "published"
            ? "ستظهر الوجبة للعملاء حسب عقد المكتبة. الحفظ وحده لا ينشر."
            : "ستبقى الوجبة غير منشورة للعملاء.",
      confirmLabel: next === "archived" ? "أرشفة" : next === "published" ? "نشر" : "تأكيد",
      tone: next === "archived" ? "danger" : "primary",
      onConfirm: () => {
        void setAdminMealStatus(draft.id, next)
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
        kicker="مكتبة التغذية"
        title="مكتبة الوجبات"
        subtitle={`${NUTRITION_BOUNDARIES.library} — منفصلة عن ${NUTRITION_BOUNDARIES.plan}. تعديل الوجبة لا يغيّر خطط العملاء تلقائيًا.`}
        actions={
          <button type="button" className="cc-btn cc-btn--primary" onClick={() => openItem("new")}>
            وجبة جديدة
          </button>
        }
      />
      <AdminLibraryLayout
        list={
          <>
            <AdminSearchInput value={query} onChange={setQuery} placeholder="MEAL-001 / اسم عربي / English" label="بحث الوجبات" />
            <AdminFilterBar>
              <label className="cc-filter">
                النوع
                <select value={type} onChange={(event) => { setType(event.target.value); setOffset(0); }}>
                  <option value="">الكل</option>
                  {MEAL_TYPES.map((item) => (
                    <option key={item} value={item}>
                      {mealTypeLabel(item)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="cc-filter">
                الحالة
                <select value={status} onChange={(event) => { setStatus(event.target.value); setOffset(0); }}>
                  <option value="">الكل</option>
                  {MEAL_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {mealStatusLabel(item)}
                    </option>
                  ))}
                </select>
              </label>
            </AdminFilterBar>
            {error ? <AdminErrorState message={error} onRetry={() => setOffset(0)} /> : null}
            {loading ? (
              <AdminSkeletonRows rows={8} />
            ) : rows.length === 0 ? (
              <AdminEmptyState title="لا وجبات مطابقة" body="غيّر البحث أو أضف وجبة. لا يتم إنشاء وجبات ناقصة تلقائياً." />
            ) : (
              <AdminTable>
                <thead>
                  <tr>
                    <th>صورة</th>
                    <th>الوجبة</th>
                    <th>English</th>
                    <th>النوع</th>
                    <th>سعرات</th>
                    <th>P/C/F</th>
                    <th>الحالة</th>
                    <th>مراجعة</th>
                    <th>تحديث</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className={row.id === selectedId ? "is-selected" : undefined}>
                      <td>
                        <img
                          className="cc-thumb"
                          alt=""
                          loading="lazy"
                          src={mealDeliveryPath(row.external_id, "thumb")}
                          width={40}
                          height={40}
                        />
                      </td>
                      <td>
                        <button type="button" className="cc-row-btn" onClick={() => openItem(row.id)}>
                          {row.name_ar}
                        </button>
                        <div className="cc-muted">{row.external_id}</div>
                      </td>
                      <td dir="ltr">{row.name_en}</td>
                      <td>{mealTypeLabel(row.meal_type)}</td>
                      <td>{row.calories}</td>
                      <td>
                        {row.protein_g}/{row.carbs_g}/{row.fat_g}
                      </td>
                      <td>
                        <AdminLibraryStatusBadge status={row.status} label={mealStatusLabel(row.status)} />
                      </td>
                      <td>{row.review_status || "—"}</td>
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
            <AdminEmptyState title="اختر وجبة" body="فتح عنصر يحمّل المكوّنات عند الحاجة فقط." />
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
                  حفظ
                </button>
                {draft.id ? (
                  <>
                    <button type="button" className="cc-btn cc-btn--primary" disabled={dirty || !canPublishMeal(draft)} onClick={() => changeStatus("published")}>
                      نشر
                    </button>
                    <button type="button" className="cc-btn cc-btn--ghost" onClick={() => changeStatus("pilot")}>
                      تجريبي
                    </button>
                    <button type="button" className="cc-btn cc-btn--ghost" onClick={() => changeStatus("archived")}>
                      أرشفة
                    </button>
                  </>
                ) : null}
              </AdminEditorToolbar>
              {firstFieldError(fieldErrors) ? <p className="cc-field__error">{firstFieldError(fieldErrors)}</p> : null}
              <div className="cc-form-grid">
                <AdminField label="MEAL ID" htmlFor="external_id" error={fieldErrors.external_id}>
                  <AdminTextInput id="external_id" dir="ltr" value={draft.external_id} error={fieldErrors.external_id} onChange={(value) => setDraft({ ...draft, external_id: value })} />
                </AdminField>
                <AdminField label="الاسم العربي" htmlFor="name_ar" error={fieldErrors.name_ar}>
                  <AdminTextInput id="name_ar" value={draft.name_ar} error={fieldErrors.name_ar} onChange={(value) => setDraft({ ...draft, name_ar: value })} />
                </AdminField>
                <AdminField label="English name" htmlFor="name_en" error={fieldErrors.name_en}>
                  <AdminTextInput id="name_en" dir="ltr" value={draft.name_en} error={fieldErrors.name_en} onChange={(value) => setDraft({ ...draft, name_en: value })} />
                </AdminField>
                <AdminField label="النوع" htmlFor="meal_type">
                  <AdminSelect id="meal_type" value={draft.meal_type} onChange={(value) => setDraft({ ...draft, meal_type: value })}>
                    {MEAL_TYPES.map((item) => (
                      <option key={item} value={item}>
                        {mealTypeLabel(item)}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="سعرات" htmlFor="calories">
                  <AdminTextInput id="calories" type="number" value={String(draft.calories)} onChange={(value) => setDraft({ ...draft, calories: Number(value) || 0 })} />
                </AdminField>
                <AdminField label="بروتين" htmlFor="protein_g">
                  <AdminTextInput id="protein_g" type="number" value={String(draft.protein_g)} onChange={(value) => setDraft({ ...draft, protein_g: Number(value) || 0 })} />
                </AdminField>
                <AdminField label="كارب" htmlFor="carbs_g">
                  <AdminTextInput id="carbs_g" type="number" value={String(draft.carbs_g)} onChange={(value) => setDraft({ ...draft, carbs_g: Number(value) || 0 })} />
                </AdminField>
                <AdminField label="دهون" htmlFor="fat_g">
                  <AdminTextInput id="fat_g" type="number" value={String(draft.fat_g)} onChange={(value) => setDraft({ ...draft, fat_g: Number(value) || 0 })} />
                </AdminField>
                <AdminField label="الحصة" htmlFor="serving_size">
                  <AdminTextInput id="serving_size" type="number" value={String(draft.serving_size)} onChange={(value) => setDraft({ ...draft, serving_size: Number(value) || 0 })} />
                </AdminField>
                <AdminField label="وحدة الحصة" htmlFor="serving_unit">
                  <AdminTextInput id="serving_unit" dir="ltr" value={draft.serving_unit} onChange={(value) => setDraft({ ...draft, serving_unit: value })} />
                </AdminField>
                <AdminField label="حالة المراجعة" htmlFor="review_status" hint="الحفظ لا يعني اعتماد التغذية">
                  <AdminSelect id="review_status" value={draft.review_status ?? "edited"} onChange={(value) => setDraft({ ...draft, review_status: value })}>
                    <option value="edited">edited</option>
                    <option value="approved">approved</option>
                    <option value="review_required">review_required</option>
                  </AdminSelect>
                </AdminField>
              </div>
              <AdminField label="الوصف العربي" htmlFor="description_ar">
                <AdminTextarea id="description_ar" value={draft.description_ar ?? ""} onChange={(value) => setDraft({ ...draft, description_ar: value })} />
              </AdminField>
              <AdminField label="English description" htmlFor="description_en">
                <AdminTextarea id="description_en" dir="ltr" value={draft.description_en ?? ""} onChange={(value) => setDraft({ ...draft, description_en: value })} />
              </AdminField>
              <AdminField label="مسببات الحساسية" htmlFor="allergens" error={fieldErrors.allergens} hint="يدوي. لا تُحسب تلقائياً من المكوّنات.">
                <AdminTextInput id="allergens" value={listToCsv(draft.allergens)} onChange={(value) => setDraft({ ...draft, allergens: csvToList(value) })} />
              </AdminField>
              {ingredientsDirty ? (
                <label className="cc-check">
                  <input type="checkbox" checked={allergensConfirmed} onChange={(event) => setAllergensConfirmed(event.target.checked)} />
                  راجعت مسببات الحساسية بعد تغيير المكوّنات
                </label>
              ) : null}
              <div className="cc-ing-head">
                <h3>المكوّنات</h3>
                <button
                  type="button"
                  className="cc-btn cc-btn--ghost"
                  onClick={() => setDraft({ ...draft, ingredients: [...draft.ingredients, emptyMealIngredient()] })}
                >
                  إضافة مكوّن
                </button>
              </div>
              <div className="cc-ing-list">
                {draft.ingredients.map((ingredient, index) => (
                  <div key={`${ingredient.ingredient_key}-${index}`} className="cc-ing-row">
                    <AdminTextInput value={ingredient.ingredient_key} dir="ltr" onChange={(value) => setDraft({ ...draft, ingredients: draft.ingredients.map((row, i) => (i === index ? { ...row, ingredient_key: value } : row)) })} />
                    <AdminTextInput value={ingredient.name_ar} onChange={(value) => setDraft({ ...draft, ingredients: draft.ingredients.map((row, i) => (i === index ? { ...row, name_ar: value } : row)) })} />
                    <AdminTextInput value={ingredient.name_en} dir="ltr" onChange={(value) => setDraft({ ...draft, ingredients: draft.ingredients.map((row, i) => (i === index ? { ...row, name_en: value } : row)) })} />
                    <AdminTextInput type="number" value={String(ingredient.quantity)} onChange={(value) => setDraft({ ...draft, ingredients: draft.ingredients.map((row, i) => (i === index ? { ...row, quantity: Number(value) || 0 } : row)) })} />
                    <AdminTextInput value={ingredient.unit} dir="ltr" onChange={(value) => setDraft({ ...draft, ingredients: draft.ingredients.map((row, i) => (i === index ? { ...row, unit: value } : row)) })} />
                    <button type="button" className="cc-btn cc-btn--ghost" onClick={() => setDraft({ ...draft, ingredients: moveItem(draft.ingredients, index, -1) })}>
                      أعلى
                    </button>
                    <button type="button" className="cc-btn cc-btn--ghost" onClick={() => setDraft({ ...draft, ingredients: moveItem(draft.ingredients, index, 1) })}>
                      أسفل
                    </button>
                    <button type="button" className="cc-btn cc-btn--ghost" onClick={() => setDraft({ ...draft, ingredients: draft.ingredients.filter((_, i) => i !== index) })}>
                      حذف
                    </button>
                  </div>
                ))}
              </div>
              <AdminField label="التحضير بالعربية" htmlFor="prep_ar">
                <AdminTextarea id="prep_ar" value={draft.preparation_steps_ar.join("\n")} onChange={(value) => setDraft({ ...draft, preparation_steps_ar: value.split("\n") })} />
              </AdminField>
              <AdminField label="Preparation (EN)" htmlFor="prep_en">
                <AdminTextarea id="prep_en" dir="ltr" value={draft.preparation_steps_en.join("\n")} onChange={(value) => setDraft({ ...draft, preparation_steps_en: value.split("\n") })} />
              </AdminField>
              <AdminField label="مسار الصورة" htmlFor="image_path" hint="العرض يستخدم صور التغذية الحالية عند توفر MEAL-ID">
                <AdminTextInput id="image_path" dir="ltr" value={draft.image_path ?? ""} onChange={(value) => setDraft({ ...draft, image_path: value })} />
              </AdminField>
              <AdminField label="substitution_profile JSON" htmlFor="substitution_profile" error={fieldErrors.substitution_profile}>
                <AdminTextarea id="substitution_profile" dir="ltr" value={subJson} onChange={setSubJson} />
              </AdminField>
              <AdminPreview title="معاينة الوجبة">
                <img className="cc-preview-media" alt="" src={mealDeliveryPath(draft.external_id || "MEAL-001", "cover")} />
                <p className="cc-preview-title">{draft.name_ar || "بدون اسم"}</p>
                <p>{draft.calories} kcal · P {draft.protein_g} / C {draft.carbs_g} / F {draft.fat_g}</p>
                <p>{draft.description_ar}</p>
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
