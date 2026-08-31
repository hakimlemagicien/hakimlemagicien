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
  assignAdminClientNutrition,
  endAdminClientNutrition,
  getAdminClientNutritionAssignment,
  listAdminClientNutritionAssignments,
  listAdminClientNutritionLogs,
  saveAdminClientNutritionSlots,
  type AdminNutritionAssignment,
  type AdminNutritionLogRow,
  type AdminNutritionSlot,
  type AdminNutritionSummary,
} from "@/lib/admin/admin-client-nutrition-api";
import { listAdminMeals, getAdminMeal, type AdminMealListItem } from "@/lib/admin/admin-meals-api";
import {
  ADMIN_LIBRARY_PAGE_SIZE,
  MEAL_TYPES,
  translateLibraryError,
  type LibrarySaveState,
} from "@/lib/admin/admin-libraries";
import { formatAdminDate, formatRelativeAge } from "@/lib/admin/admin-status";
import { NUTRITION_BOUNDARIES } from "@/lib/admin/admin-architecture";
import type { AdminClientOverview } from "@/lib/admin/admin-clients-api";
import {
  NUTRITION_MACRO_TARGETS,
  NUTRITION_SLOT_KEYS,
  NUTRITION_SLOT_LABELS,
  NUTRITION_WATER_SOURCE,
  allergenOverlap,
  nutritionAttentionSignals,
  nutritionLogIsLegacyUnlinked,
  nutritionSignalLabel,
  nutritionStatusLabel,
  parseWatchAllergens,
  scaleMacros,
  validateServings,
  type NutritionSlotKey,
} from "@/lib/platform/nutrition-assignment";

type AssignStep = "closed" | "pick" | "preview" | "review";

type SlotDraft = {
  slot_key: NutritionSlotKey;
  mealId: string | null;
  name_ar: string;
  external_id: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  allergens: string[];
  servings: number;
  notes_ar: string;
};

function emptySlots(): SlotDraft[] {
  return NUTRITION_SLOT_KEYS.map((slot_key) => ({
    slot_key,
    mealId: null,
    name_ar: "",
    external_id: "",
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    allergens: [],
    servings: 1,
    notes_ar: "",
  }));
}

function slotFromAssignment(slot: AdminNutritionSlot): SlotDraft {
  return {
    slot_key: slot.slot_key as NutritionSlotKey,
    mealId: slot.source_meal_id,
    name_ar: slot.name_ar,
    external_id: slot.source_external_id,
    calories: slot.calories,
    protein_g: slot.protein_g,
    carbs_g: slot.carbs_g,
    fat_g: slot.fat_g,
    allergens: slot.allergens,
    servings: slot.servings,
    notes_ar: slot.notes_ar ?? "",
  };
}

export function ClientNutritionWorkspace({
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
  tab: "nutrition" | "progress";
  onOverviewRefresh: () => Promise<void>;
  onConfirm: (request: AdminConfirmRequest) => void;
}) {
  const [detail, setDetail] = useState<AdminNutritionAssignment | null>(null);
  const [history, setHistory] = useState<AdminNutritionSummary[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [logs, setLogs] = useState<AdminNutritionLogRow[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsOffset, setLogsOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdminNutritionAssignment | null>(null);
  const [saveState, setSaveState] = useState<LibrarySaveState>("saved");
  const [editing, setEditing] = useState(false);
  const [assignStep, setAssignStep] = useState<AssignStep>("closed");
  const [assignName, setAssignName] = useState("خطة التغذية");
  const [watchRaw, setWatchRaw] = useState("");
  const [startsOn, setStartsOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [slotDrafts, setSlotDrafts] = useState<SlotDraft[]>(emptySlots);
  const [pickerSlot, setPickerSlot] = useState<NutritionSlotKey | null>(null);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerType, setPickerType] = useState("");
  const [pickerRows, setPickerRows] = useState<AdminMealListItem[]>([]);
  const mealQuery = useDebouncedValue(pickerQuery, 280);
  const dirty = Boolean(
    editing &&
      draft &&
      detail &&
      (JSON.stringify(draft.slots) !== JSON.stringify(detail.slots) ||
        JSON.stringify(draft.watch_allergens) !== JSON.stringify(detail.watch_allergens) ||
        draft.name_ar !== detail.name_ar),
  );
  const guard = useUnsavedNavigation(dirty, onConfirm);
  const watchAllergens = parseWatchAllergens(watchRaw);

  const signals = nutritionAttentionSignals({
    status: overview.nutrition_assignment?.status ?? null,
    startsOn: overview.nutrition_assignment?.starts_on ?? null,
    snapshotComplete: overview.nutrition_assignment?.snapshot_complete ?? null,
    allergenConflict: overview.nutrition_assignment?.allergen_conflict ?? detail?.allergen_conflict,
    libraryAllergenReview: detail?.library_allergen_review,
  });

  const loadAssignment = async (id: string) => {
    const row = await getAdminClientNutritionAssignment(id);
    setDetail(row);
    setDraft(row);
    setEditing(false);
    setSaveState("saved");
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    const id = overview.nutrition_assignment?.id;
    void Promise.all([
      id ? getAdminClientNutritionAssignment(id) : Promise.resolve(null),
      listAdminClientNutritionAssignments(clientId, 0),
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
        setError("تعذر تحميل خطة التغذية.");
      })
      .finally(() => setLoading(false));
  }, [clientId, overview.nutrition_assignment?.id]);

  useEffect(() => {
    if (tab !== "progress" && tab !== "nutrition") return;
    setLogsLoading(true);
    void listAdminClientNutritionLogs(clientId, logsOffset)
      .then((result) => {
        setLogs(result.rows);
        setLogsTotal(result.totalCount);
      })
      .catch((err) => {
        console.error(err);
        setError("تعذر تحميل سجل التغذية.");
      })
      .finally(() => setLogsLoading(false));
  }, [clientId, tab, logsOffset]);

  useEffect(() => {
    if (!pickerSlot) return;
    void listAdminMeals({
      query: mealQuery,
      type: pickerType || pickerSlot || null,
      status: "published",
    })
      .then((result) => setPickerRows(result.rows))
      .catch((err) => {
        console.error(err);
        setError(translateLibraryError(err));
      });
  }, [pickerSlot, mealQuery, pickerType]);

  const planned = useMemo(() => {
    const source = editing && draft ? draft.slots : assignStep !== "closed" ? slotDrafts : detail?.slots ?? [];
    return source.reduce(
      (sum, slot) => {
        const macros = scaleMacros({
          calories: "calories" in slot ? slot.calories : 0,
          protein_g: "protein_g" in slot ? slot.protein_g : 0,
          carbs_g: "carbs_g" in slot ? slot.carbs_g : 0,
          fat_g: "fat_g" in slot ? slot.fat_g : 0,
          servings: slot.servings,
        });
        return {
          calories: sum.calories + macros.calories,
          protein: sum.protein + macros.protein,
          carbs: sum.carbs + macros.carbs,
          fat: sum.fat + macros.fat,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [assignStep, detail, draft, editing, slotDrafts]);

  const assignConflicts = useMemo(
    () =>
      slotDrafts.flatMap((slot) =>
        allergenOverlap(watchAllergens, slot.allergens).map((item) => `${NUTRITION_SLOT_LABELS[slot.slot_key]}: ${item}`),
      ),
    [slotDrafts, watchAllergens],
  );

  const saveDraft = async () => {
    if (!draft || !detail) return;
    const invalid = draft.slots.map((slot) => validateServings(slot.servings)).find(Boolean);
    if (invalid) {
      setSaveState("failed");
      setError(translateLibraryError({ message: invalid }));
      return;
    }
    setSaveState("saving");
    setError(null);
    try {
      const next = await saveAdminClientNutritionSlots(
        detail.id,
        {
          name_ar: draft.name_ar,
          watch_allergens: draft.watch_allergens,
          slots: draft.slots.map((slot) => ({
            id: slot.id,
            servings: slot.servings,
            notes_ar: slot.notes_ar,
            source_meal_id: slot.source_meal_id,
          })),
        },
        detail.updated_at,
      );
      setDetail(next);
      setDraft(next);
      setSaveState("saved");
      setEditing(false);
      await onOverviewRefresh();
    } catch (err) {
      console.error(err);
      setSaveState("failed");
      setError(translateLibraryError(err));
    }
  };

  const confirmAssign = (replace: boolean) => {
    if (slotDrafts.some((slot) => !slot.mealId)) {
      setError(translateLibraryError({ message: "slots_required" }));
      return;
    }
    onConfirm({
      title: replace ? "استبدال خطة التغذية النشطة" : "تأكيد تعيين التغذية",
      body: replace
        ? `الخطة الحالية (${detail?.name_ar ?? overview.nutrition_assignment?.name_ar ?? "النشطة"}) ستصبح تاريخاً بحالة مستبدل. الخطة الجديدة: ${assignName} اعتباراً من ${startsOn}. السجل السابق يبقى.`
        : `تعيين ${assignName} للعميل من ${startsOn}. تُثبَّت لقطة الوجبات ولن يغيّر تعديل المكتبة لاحقاً هذه النسخة.`,
      confirmLabel: replace ? "استبدال وتعيين" : "تعيين",
      tone: replace ? "danger" : "primary",
      onConfirm: () => {
        void assignAdminClientNutrition({
          clientId,
          nameAr: assignName,
          startsOn,
          replace,
          watchAllergens,
          slots: slotDrafts.map((slot) => ({
            slot_key: slot.slot_key,
            meal_id: slot.mealId!,
            servings: slot.servings,
            notes_ar: slot.notes_ar,
          })),
        })
          .then(async (row) => {
            setDetail(row);
            setDraft(row);
            setAssignStep("closed");
            setSlotDrafts(emptySlots());
            const list = await listAdminClientNutritionAssignments(clientId, 0);
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
      title: status === "completed" ? "إنهاء خطة التغذية" : "إلغاء خطة التغذية",
      body:
        status === "completed"
          ? "ستُحفظ الخطة في التاريخ ولن تبقى نشطة. السجلات السابقة تبقى."
          : "سيُلغى التعيين الحالي ويبقى ظاهراً في التاريخ.",
      confirmLabel: status === "completed" ? "إنهاء" : "إلغاء",
      tone: "danger",
      onConfirm: () => {
        void endAdminClientNutrition(detail.id, status)
          .then(async () => {
            setDetail(null);
            setDraft(null);
            const list = await listAdminClientNutritionAssignments(clientId, 0);
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

  const applyMealToSlot = async (slotKey: NutritionSlotKey, mealId: string, target: "assign" | "edit") => {
    const meal = await getAdminMeal(mealId);
    if (target === "assign") {
      setSlotDrafts((rows) =>
        rows.map((slot) =>
          slot.slot_key === slotKey
            ? {
                ...slot,
                mealId: meal.id,
                name_ar: meal.name_ar,
                external_id: meal.external_id,
                calories: meal.calories,
                protein_g: meal.protein_g,
                carbs_g: meal.carbs_g,
                fat_g: meal.fat_g,
                allergens: meal.allergens,
              }
            : slot,
        ),
      );
    } else if (draft) {
      setDraft({
        ...draft,
        slots: draft.slots.map((slot) =>
          slot.slot_key === slotKey
            ? {
                ...slot,
                source_meal_id: meal.id,
                source_external_id: meal.external_id,
                name_ar: meal.name_ar,
                name_en: meal.name_en,
                calories: meal.calories,
                protein_g: meal.protein_g,
                carbs_g: meal.carbs_g,
                fat_g: meal.fat_g,
                allergens: meal.allergens,
              }
            : slot,
        ),
      });
      setSaveState("unsaved");
    }
    setPickerSlot(null);
    setPickerQuery("");
  };

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayLogs = logs.filter((row) => row.session_date === todayKey && row.status === "completed");
  const plannedToday = detail?.slots.length ?? 0;

  if (loading) return <AdminSkeletonRows rows={5} />;

  if (tab === "progress") {
    return (
      <AdminSection>
        {error ? <AdminErrorState message={error} /> : null}
        <AdminCard>
          <h2 className="cc-section__title">مراجعة التغذية</h2>
          <dl className="cc-dl">
            <div>
              <dt>الخطة الحالية</dt>
              <dd>{overview.nutrition_assignment?.name_ar || "لا خطة تغذية"}</dd>
            </div>
            <div>
              <dt>آخر نشاط غذائي</dt>
              <dd>{overview.last_nutrition_at ? formatRelativeAge(overview.last_nutrition_at) : "لا سجل بعد"}</dd>
            </div>
            <div>
              <dt>وجبات اليوم</dt>
              <dd>
                {plannedToday > 0 ? `${todayLogs.length} مكتملة / ${plannedToday} مخططة` : "لا خطة لعرض العد"}
              </dd>
            </div>
            <div>
              <dt>نسبة الالتزام</dt>
              <dd>غير معتمدة — لا تُحسب في هذه المرحلة.</dd>
            </div>
            <div>
              <dt>الماء</dt>
              <dd>{NUTRITION_WATER_SOURCE} — لا يظهر في الخادم.</dd>
            </div>
            <div>
              <dt>أهداف السعرات/الماكروز</dt>
              <dd>{NUTRITION_MACRO_TARGETS} — لا تُخترع هنا.</dd>
            </div>
          </dl>
        </AdminCard>
        <LogsTable
          logs={logs}
          loading={logsLoading}
          total={logsTotal}
          offset={logsOffset}
          onPage={setLogsOffset}
        />
        <HistoryList
          rows={history}
          total={historyTotal}
          offset={historyOffset}
          onPage={(next) => {
            setHistoryOffset(next);
            void listAdminClientNutritionAssignments(clientId, next).then((list) => {
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
              <li key={signal}>{nutritionSignalLabel(signal)}</li>
            ))}
          </ul>
          <p className="cc-muted">لا تقييم جودة حمية ولا نسبة التزام سلوكية. الحساسية تظهر كتحذير مراجعة فقط.</p>
        </AdminCard>
      ) : null}

      <AdminCard>
        <h2 className="cc-section__title">الخطة الغذائية الحالية</h2>
        <p className="cc-muted">
          {NUTRITION_BOUNDARIES.library} منفصل عن {NUTRITION_BOUNDARIES.assigned}. تعديل المكتبة لا يغيّر لقطة العميل.
        </p>
        <dl className="cc-dl">
          <div>
            <dt>هدف العميل (سياق)</dt>
            <dd>{overview.goal || "—"} — لا يُشتق منه وصف غذائي تلقائي.</dd>
          </div>
        </dl>
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
                  {nutritionStatusLabel(detail.status)}
                </AdminStatusBadge>
              </dd>
            </div>
            <div>
              <dt>تاريخ البداية</dt>
              <dd>{detail.starts_on ? formatAdminDate(detail.starts_on) : "—"}</dd>
            </div>
            <div>
              <dt>مخطط اليوم من الوجبات المعيَّنة</dt>
              <dd>
                {Math.round(detail.planned_calories)} سعرة · {detail.planned_protein_g} بروتين · {detail.planned_carbs_g}{" "}
                كارب · {detail.planned_fat_g} دهون
              </dd>
            </div>
            <div>
              <dt>أهداف معتمدة</dt>
              <dd>{NUTRITION_MACRO_TARGETS}</dd>
            </div>
            <div>
              <dt>حساسيات للمتابعة</dt>
              <dd>{detail.watch_allergens.join("، ") || "لا قائمة مدخلة من المدرب"}</dd>
            </div>
            <div>
              <dt>تعارض حساسية</dt>
              <dd>{detail.allergen_conflict ? "نعم — مراجعة مطلوبة" : "لا تطابق مباشر"}</dd>
            </div>
            <div>
              <dt>لقطة مكتملة</dt>
              <dd>{detail.snapshot_complete ? "نعم" : "لا — بيانات ناقصة"}</dd>
            </div>
            <div>
              <dt>الماء</dt>
              <dd>{NUTRITION_WATER_SOURCE}</dd>
            </div>
          </dl>
        ) : (
          <AdminEmptyState
            title="لا توجد خطة تغذية نشطة."
            body="مكتبة الوجبات ليست خطة العميل. عيّن أربع وجبات يومية لإنشاء لقطة مستقلة."
          />
        )}
        <div className="cc-editor-toolbar">
          <button
            type="button"
            className="cc-btn cc-btn--primary"
            onClick={() => {
              guard(() => {
                setAssignStep("pick");
                setSlotDrafts(emptySlots());
                setWatchRaw("");
              });
            }}
          >
            تعيين خطة تغذية
          </button>
          {detail && (detail.status === "active" || detail.status === "scheduled") ? (
            <>
              <button type="button" className="cc-btn" onClick={() => setEditing(true)}>
                تعديل نسخة العميل
              </button>
              <button type="button" className="cc-btn" onClick={() => requestEnd("completed")}>
                إنهاء الخطة
              </button>
              <button
                type="button"
                className="cc-btn"
                onClick={() => {
                  guard(() => {
                    setAssignStep("pick");
                    setSlotDrafts(detail.slots.map(slotFromAssignment));
                    setWatchRaw(detail.watch_allergens.join("، "));
                    setAssignName(detail.name_ar || "خطة التغذية");
                  });
                }}
              >
                استبدال الخطة
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
          <h2 className="cc-section__title">تعيين خطة تغذية</h2>
          {assignStep === "pick" ? (
            <>
              <div className="cc-form-grid">
                <AdminField label="اسم الخطة" htmlFor="nutrition_name">
                  <input
                    id="nutrition_name"
                    value={assignName}
                    onChange={(event) => setAssignName(event.target.value)}
                  />
                </AdminField>
                <AdminField
                  label="حساسيات للمتابعة (فاصلة)"
                  htmlFor="watch_allergens"
                  hint="مطابقة نصية مباشرة مع بيانات الوجبة. ليست توصية طبية."
                >
                  <input
                    id="watch_allergens"
                    value={watchRaw}
                    onChange={(event) => setWatchRaw(event.target.value)}
                    placeholder="peanut, gluten"
                    dir="ltr"
                  />
                </AdminField>
              </div>
              <ol className="cc-picker-list">
                {slotDrafts.map((slot) => (
                  <li key={slot.slot_key}>
                    <p>
                      {NUTRITION_SLOT_LABELS[slot.slot_key]}:{" "}
                      {slot.mealId ? slot.name_ar : "لم تُختر وجبة"}
                    </p>
                    {allergenOverlap(watchAllergens, slot.allergens).length > 0 ? (
                      <p className="cc-field__error" role="alert">
                        تعارض حساسية يحتاج مراجعة: {allergenOverlap(watchAllergens, slot.allergens).join("، ")}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      className="cc-btn"
                      onClick={() => {
                        setPickerType(slot.slot_key);
                        setPickerSlot(slot.slot_key);
                      }}
                    >
                      اختيار من المكتبة
                    </button>
                    <AdminField label={`حصة ${NUTRITION_SLOT_LABELS[slot.slot_key]}`} htmlFor={`servings_${slot.slot_key}`}>
                      <input
                        id={`servings_${slot.slot_key}`}
                        type="number"
                        min={0.25}
                        step={0.25}
                        value={slot.servings}
                        onChange={(event) =>
                          setSlotDrafts((rows) =>
                            rows.map((row) =>
                              row.slot_key === slot.slot_key
                                ? { ...row, servings: Number(event.target.value) }
                                : row,
                            ),
                          )
                        }
                      />
                    </AdminField>
                    <AdminField label="تعليمات ظاهرة للعميل" htmlFor={`notes_${slot.slot_key}`}>
                      <input
                        id={`notes_${slot.slot_key}`}
                        value={slot.notes_ar}
                        onChange={(event) =>
                          setSlotDrafts((rows) =>
                            rows.map((row) =>
                              row.slot_key === slot.slot_key ? { ...row, notes_ar: event.target.value } : row,
                            ),
                          )
                        }
                      />
                    </AdminField>
                  </li>
                ))}
              </ol>
              <p className="cc-muted">ملاحظات الكوتش الخاصة تبقى في تبويب الملاحظات، وليست تعليمات العميل.</p>
              <button
                type="button"
                className="cc-btn cc-btn--primary"
                disabled={slotDrafts.some((slot) => !slot.mealId)}
                onClick={() => setAssignStep("preview")}
              >
                مراجعة الوجبات
              </button>
              <button type="button" className="cc-btn" onClick={() => setAssignStep("closed")}>
                إلغاء
              </button>
            </>
          ) : null}

          {(assignStep === "preview" || assignStep === "review") && (
            <>
              <dl className="cc-dl">
                <div>
                  <dt>مخطط من الوجبات × الحصص</dt>
                  <dd>
                    {planned.calories} سعرة · {planned.protein} بروتين · {planned.carbs} كارب · {planned.fat} دهون
                  </dd>
                </div>
              </dl>
              {assignConflicts.length > 0 ? (
                <p className="cc-field__error" role="alert">
                  تعارض حساسية يحتاج مراجعة: {assignConflicts.join(" · ")}. لا يُمنع التعيين تلقائياً.
                </p>
              ) : null}
              <ul>
                {slotDrafts.map((slot) => (
                  <li key={slot.slot_key}>
                    {NUTRITION_SLOT_LABELS[slot.slot_key]} — {slot.name_ar}{" "}
                    <span dir="ltr">({slot.external_id})</span> × {slot.servings}
                  </li>
                ))}
              </ul>
              {overview.nutrition_assignment?.status === "active" ? (
                <p className="cc-field__error" role="alert">
                  يوجد خطة نشطة. التعيين الجديد يستبدلها بعد التأكيد ويُبقي التاريخ.
                </p>
              ) : null}
              <AdminField label="تاريخ البداية" htmlFor="nutrition_starts_on">
                <input
                  id="nutrition_starts_on"
                  type="date"
                  value={startsOn}
                  onChange={(event) => setStartsOn(event.target.value)}
                />
              </AdminField>
              <button type="button" className="cc-btn" onClick={() => setAssignStep("pick")}>
                رجوع
              </button>
              <button type="button" className="cc-btn cc-btn--primary" onClick={() => setAssignStep("review")}>
                تأكيد المعاينة
              </button>
              {assignStep === "review" ? (
                <button
                  type="button"
                  className="cc-btn cc-btn--primary"
                  onClick={() =>
                    confirmAssign(
                      overview.nutrition_assignment?.status === "active" ||
                        overview.nutrition_assignment?.status === "scheduled",
                    )
                  }
                >
                  تفعيل / جدولة
                </button>
              ) : null}
            </>
          )}

          {pickerSlot ? (
            <MealPicker
              slotKey={pickerSlot}
              query={pickerQuery}
              type={pickerType}
              rows={pickerRows}
              watchAllergens={watchAllergens}
              onQuery={setPickerQuery}
              onType={setPickerType}
              onSelect={(id) => void applyMealToSlot(pickerSlot, id, "assign")}
              onClose={() => setPickerSlot(null)}
            />
          ) : null}
        </AdminCard>
      ) : null}

      {detail ? (
        <AdminCard>
          <h2 className="cc-section__title">محرر نسخة العميل</h2>
          <p className="cc-muted">الحصص والتعليمات تخص هذه النسخة فقط. مكتبة الوجبات لا تُعدَّل من هنا.</p>
          {(editing ? draft : detail)?.slots.map((slot, index) => {
            const macros = scaleMacros(slot);
            const conflicts = allergenOverlap((editing ? draft : detail)?.watch_allergens, slot.allergens);
            return (
              <div key={slot.id} className="cc-editor-row">
                <p>
                  {slot.slot_label} — {slot.name_ar} <span dir="ltr">({slot.source_external_id})</span>
                </p>
                <p className="cc-meta">
                  مكتبة: {slot.calories} سعرة / حصة · معيَّن: {macros.calories} سعرة × {slot.servings}
                </p>
                {conflicts.length > 0 ? (
                  <p className="cc-field__error" role="alert">
                    تعارض حساسية: {conflicts.join("، ")}
                  </p>
                ) : null}
                {editing && draft ? (
                  <>
                    <AdminField label="الحصة" htmlFor={`edit_servings_${slot.id}`}>
                      <input
                        id={`edit_servings_${slot.id}`}
                        type="number"
                        min={0.25}
                        step={0.25}
                        value={slot.servings}
                        onChange={(event) => {
                          const servings = Number(event.target.value);
                          setDraft({
                            ...draft,
                            slots: draft.slots.map((row, i) => (i === index ? { ...row, servings } : row)),
                          });
                          setSaveState("unsaved");
                        }}
                      />
                    </AdminField>
                    <AdminField label="تعليمات ظاهرة للعميل" htmlFor={`edit_notes_${slot.id}`}>
                      <input
                        id={`edit_notes_${slot.id}`}
                        value={slot.notes_ar ?? ""}
                        onChange={(event) => {
                          setDraft({
                            ...draft,
                            slots: draft.slots.map((row, i) =>
                              i === index ? { ...row, notes_ar: event.target.value } : row,
                            ),
                          });
                          setSaveState("unsaved");
                        }}
                      />
                    </AdminField>
                    <button
                      type="button"
                      className="cc-btn"
                      onClick={() => {
                        setPickerSlot(slot.slot_key as NutritionSlotKey);
                      }}
                    >
                      استبدال الوجبة
                    </button>
                  </>
                ) : null}
              </div>
            );
          })}
          {editing ? (
            <div className="cc-editor-toolbar">
              <AdminField label="حساسيات للمتابعة" htmlFor="edit_watch">
                <input
                  id="edit_watch"
                  dir="ltr"
                  value={(draft?.watch_allergens ?? []).join(", ")}
                  onChange={(event) => {
                    if (!draft) return;
                    setDraft({ ...draft, watch_allergens: parseWatchAllergens(event.target.value) });
                    setSaveState("unsaved");
                  }}
                />
              </AdminField>
              <button type="button" className="cc-btn cc-btn--primary" onClick={() => void saveDraft()}>
                حفظ نسخة العميل
              </button>
              <button
                type="button"
                className="cc-btn"
                onClick={() => {
                  setDraft(detail);
                  setEditing(false);
                  setSaveState("saved");
                }}
              >
                إلغاء
              </button>
            </div>
          ) : null}
          {editing && pickerSlot ? (
            <MealPicker
              slotKey={pickerSlot}
              query={pickerQuery}
              type={pickerType}
              rows={pickerRows}
              watchAllergens={draft?.watch_allergens ?? []}
              onQuery={setPickerQuery}
              onType={setPickerType}
              onSelect={(id) => void applyMealToSlot(pickerSlot, id, "edit")}
              onClose={() => setPickerSlot(null)}
            />
          ) : null}
        </AdminCard>
      ) : null}

      <LogsTable
        logs={logs}
        loading={logsLoading}
        total={logsTotal}
        offset={logsOffset}
        onPage={setLogsOffset}
      />
      <HistoryList
        rows={history}
        total={historyTotal}
        offset={historyOffset}
        onPage={(next) => {
          setHistoryOffset(next);
          void listAdminClientNutritionAssignments(clientId, next).then((list) => {
            setHistory(list.rows);
            setHistoryTotal(list.totalCount);
          });
        }}
        onOpen={(id) => void loadAssignment(id)}
      />
    </AdminSection>
  );
}

function MealPicker({
  slotKey,
  query,
  type,
  rows,
  watchAllergens,
  onQuery,
  onType,
  onSelect,
  onClose,
}: {
  slotKey: NutritionSlotKey;
  query: string;
  type: string;
  rows: AdminMealListItem[];
  watchAllergens: string[];
  onQuery: (value: string) => void;
  onType: (value: string) => void;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="cc-picker" role="dialog" aria-labelledby="meal-picker-title">
      <h3 id="meal-picker-title">اختيار وجبة — {NUTRITION_SLOT_LABELS[slotKey]}</h3>
      <div className="cc-form-grid">
        <AdminSearchInput value={query} onChange={onQuery} placeholder="بحث في الوجبات المنشورة" label="بحث" />
        <AdminSelect value={type} onChange={onType}>
          <option value="">كل الأنواع</option>
          {MEAL_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </AdminSelect>
      </div>
      {rows.length === 0 ? (
        <AdminEmptyState title="لا وجبات منشورة مطابقة" body="الوجبات المؤرشفة غير ظاهرة هنا افتراضياً." />
      ) : (
        <ul className="cc-picker-list">
          {rows.map((row) => (
            <li key={row.id}>
              <button type="button" className="cc-row-btn" onClick={() => onSelect(row.id)}>
                {row.name_ar} <span dir="ltr">({row.external_id})</span> · {row.calories} سعرة · {row.meal_type}
              </button>
              {watchAllergens.length > 0 ? (
                <p className="cc-muted">بعد الاختيار تُراجع الحساسية من بيانات الوجبة الكاملة.</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="cc-btn" onClick={onClose}>
        إغلاق
      </button>
    </div>
  );
}

function LogsTable({
  logs,
  loading,
  total,
  offset,
  onPage,
}: {
  logs: AdminNutritionLogRow[];
  loading: boolean;
  total: number;
  offset: number;
  onPage: (offset: number) => void;
}) {
  return (
    <AdminCard>
      <h2 className="cc-section__title">سجل التنفيذ الغذائي</h2>
      {loading ? <AdminSkeletonRows rows={3} /> : null}
      {!loading && logs.length === 0 ? (
        <AdminEmptyState title="لا سجلات تغذية بعد" body="تظهر هنا الوجبات المكتملة من تطبيق العميل فقط." />
      ) : null}
      {logs.length > 0 ? (
        <div className="cc-table-wrap">
          <table className="cc-table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>الفترة</th>
                <th>الوجبة وقت التسجيل</th>
                <th>الحالة</th>
                <th>السياق</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((row) => (
                <tr key={row.id}>
                  <td>{row.session_date}</td>
                  <td>{NUTRITION_SLOT_LABELS[row.slot_key as NutritionSlotKey] ?? row.slot_key}</td>
                  <td dir="ltr">{row.source_external_id}</td>
                  <td>{row.status === "completed" ? "مكتملة" : "تم التخطي"}</td>
                  <td>{nutritionLogIsLegacyUnlinked(row.assignment_id) ? "سجل قديم غير مرتبط" : "مرتبط بالتعيين"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <AdminPagination offset={offset} pageSize={ADMIN_LIBRARY_PAGE_SIZE} total={total} onPage={onPage} />
    </AdminCard>
  );
}

function HistoryList({
  rows,
  total,
  offset,
  onPage,
  onOpen,
}: {
  rows: AdminNutritionSummary[];
  total: number;
  offset: number;
  onPage: (offset: number) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <AdminCard>
      <h2 className="cc-section__title">تاريخ التغذية</h2>
      {rows.length === 0 ? <AdminEmptyState title="لا تاريخ تعيين بعد" body="الاستبدال يُبقي الخطط السابقة هنا." /> : null}
      <ul className="cc-picker-list">
        {rows.map((row) => (
          <li key={row.id}>
            <button type="button" className="cc-row-btn" onClick={() => onOpen(row.id)}>
              {row.name_ar || "خطة"} · {nutritionStatusLabel(row.status)} · {formatAdminDate(row.assigned_at)}
              {row.ended_at ? ` → ${formatAdminDate(row.ended_at)}` : ""}
            </button>
          </li>
        ))}
      </ul>
      <AdminPagination offset={offset} pageSize={ADMIN_LIBRARY_PAGE_SIZE} total={total} onPage={onPage} />
    </AdminCard>
  );
}
