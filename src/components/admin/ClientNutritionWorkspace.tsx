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
import { TrainingToolCard, type TrainingToolCardTone } from "@/components/admin/TrainingToolCard";
import {
  assignAdminClientNutrition,
  createAdminClientNutritionDraft,
  discardAdminClientNutritionDraft,
  endAdminClientNutrition,
  getAdminClientNutritionAllergy,
  getAdminClientNutritionAssignment,
  listAdminClientNutritionAssignments,
  listAdminClientNutritionLogs,
  publishAdminClientNutritionDraft,
  saveAdminClientNutritionSlots,
  setAdminClientNutritionPreferences,
  type AdminNutritionAllergyStatus,
  type AdminNutritionAssignment,
  type AdminNutritionLogRow,
  type AdminNutritionSlot,
  type AdminNutritionSummary,
} from "@/lib/admin/admin-client-nutrition-api";
import { AssignmentPublishBar } from "@/components/admin/AssignmentPublishBar";
import { assignReadyMadeStrategyNutrition } from "@/lib/admin/admin-nutrition-strategy-assign";
import {
  listNutritionTemplates,
  type NutritionTemplateRecord,
} from "@/lib/admin/admin-nutrition-templates-api";
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
import { presentClientTrainingGoal } from "@/lib/admin/admin-client-goal";
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
import { mealDeliveryPath } from "@/lib/platform/meal-library";
import type { AllergyState } from "@/lib/platform/nutrition-strategy";

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
  const [allergyStatus, setAllergyStatus] = useState<AdminNutritionAllergyStatus>("UNKNOWN");
  const [allergyKnownRaw, setAllergyKnownRaw] = useState("");
  const [dislikedFoodsRaw, setDislikedFoodsRaw] = useState("");
  const [strategyBusy, setStrategyBusy] = useState(false);
  const [nutritionTemplates, setNutritionTemplates] = useState<NutritionTemplateRecord[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [previewAsClient, setPreviewAsClient] = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);
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
    setEditing(row.status === "draft");
    setSaveState("saved");
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    const id = overview.nutrition_assignment?.id;
    void Promise.all([
      id ? getAdminClientNutritionAssignment(id) : Promise.resolve(null),
      listAdminClientNutritionAssignments(clientId, 0),
      getAdminClientNutritionAllergy(clientId).catch(() => ({
        status: "UNKNOWN" as const,
        knownAllergens: [] as string[],
        dislikedFoods: [] as string[],
      })),
    ])
      .then(async ([row, list, allergy]) => {
        setHistory(list.rows);
        setHistoryTotal(list.totalCount);
        setHistoryOffset(0);
        setAllergyStatus(allergy.status);
        setAllergyKnownRaw(allergy.knownAllergens.join(", "));
        setDislikedFoodsRaw(allergy.dislikedFoods.join(", "));
        const draftRow = list.rows.find((item) => item.status === "draft");
        if (draftRow) {
          const full = await getAdminClientNutritionAssignment(draftRow.id);
          setDetail(full);
          setDraft(full);
          setEditing(true);
          return;
        }
        setDetail(row);
        setDraft(row);
        setEditing(false);
      })
      .catch((err) => {
        console.error(err);
        setError("تعذر تحميل خطة التغذية.");
      })
      .finally(() => setLoading(false));
  }, [clientId, overview.nutrition_assignment?.id]);

  useEffect(() => {
    void listNutritionTemplates()
      .then((rows) => {
        const published = rows.filter((row) => row.status === "published" && row.is_active);
        setNutritionTemplates(published);
        setSelectedTemplateId(
          (current) =>
            current || published.find((row) => row.is_default)?.id || published[0]?.id || "",
        );
      })
      .catch((err) => console.error(err));
  }, []);

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
    const source =
      editing && draft ? draft.slots : assignStep !== "closed" ? slotDrafts : (detail?.slots ?? []);
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
        allergenOverlap(watchAllergens, slot.allergens).map(
          (item) => `${NUTRITION_SLOT_LABELS[slot.slot_key]}: ${item}`,
        ),
      ),
    [slotDrafts, watchAllergens],
  );

  const nutritionPublishMode = !detail ? "none" : detail.status === "draft" ? "draft" : "published";
  const nutritionEditionLabel =
    detail?.status === "draft"
      ? "مسودة تغذية — غير مرئية للعميل"
      : detail
        ? `منشور · ${nutritionStatusLabel(detail.status)}`
        : null;

  const createNutritionDraft = async () => {
    const sourceId = overview.nutrition_assignment?.id ?? detail?.id;
    if (!sourceId) return;
    setPublishBusy(true);
    setError(null);
    try {
      const next = await createAdminClientNutritionDraft(sourceId);
      setDetail(next);
      setDraft(next);
      setEditing(true);
      setSaveState("saved");
      setPreviewAsClient(false);
      const list = await listAdminClientNutritionAssignments(clientId, 0);
      setHistory(list.rows);
      setHistoryTotal(list.totalCount);
    } catch (err) {
      console.error(err);
      setError(translateLibraryError(err));
    } finally {
      setPublishBusy(false);
    }
  };

  const publishNutritionDraft = async () => {
    if (!detail || detail.status !== "draft") return;
    onConfirm({
      title: "نشر مسودة التغذية للعميل؟",
      body: "سيصبح هذا الإصدار هو النسخة الحالية. النسخة المنشورة السابقة تُؤرشف دون تعديل destructive.",
      confirmLabel: "Publish",
      tone: "danger",
      onConfirm: () => {
        void (async () => {
          setPublishBusy(true);
          setError(null);
          try {
            const next = await publishAdminClientNutritionDraft(detail.id);
            setDetail(next);
            setDraft(next);
            setEditing(false);
            setPreviewAsClient(false);
            setSaveState("saved");
            await onOverviewRefresh();
            const list = await listAdminClientNutritionAssignments(clientId, 0);
            setHistory(list.rows);
            setHistoryTotal(list.totalCount);
          } catch (err) {
            console.error(err);
            setError(translateLibraryError(err));
          } finally {
            setPublishBusy(false);
          }
        })();
      },
    });
  };

  const discardNutritionDraft = async () => {
    if (!detail || detail.status !== "draft") return;
    onConfirm({
      title: "تجاهل مسودة التغذية؟",
      body: "ستُحذف المسودة. الخطة المنشورة للعميل تبقى كما هي.",
      confirmLabel: "تجاهل المسودة",
      tone: "danger",
      onConfirm: () => {
        void (async () => {
          setPublishBusy(true);
          setError(null);
          try {
            await discardAdminClientNutritionDraft(detail.id);
            setPreviewAsClient(false);
            const publishedId = overview.nutrition_assignment?.id;
            if (publishedId && publishedId !== detail.id) {
              await loadAssignment(publishedId);
            } else {
              setDetail(null);
              setDraft(null);
              setEditing(false);
            }
            await onOverviewRefresh();
            const list = await listAdminClientNutritionAssignments(clientId, 0);
            setHistory(list.rows);
            setHistoryTotal(list.totalCount);
          } catch (err) {
            console.error(err);
            setError(translateLibraryError(err));
          } finally {
            setPublishBusy(false);
          }
        })();
      },
    });
  };

  const saveDraft = async () => {
    if (!draft || !detail) return;
    if (detail.status !== "draft") {
      setError("عدّل عبر مسودة فقط — أنشئ مسودة قبل الحفظ.");
      setSaveState("failed");
      return;
    }
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
      setEditing(true);
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

  const allergyStateForStrategy = (): AllergyState | null => {
    if (allergyStatus === "CONFIRMED_NONE") {
      return { status: "CONFIRMED_NONE", confirmed_at: new Date().toISOString() };
    }
    if (allergyStatus === "KNOWN_ALLERGIES") {
      const allergens = parseWatchAllergens(allergyKnownRaw);
      if (allergens.length === 0) return null;
      return { status: "KNOWN_ALLERGIES", allergens };
    }
    return null;
  };

  const saveAllergyStatus = async (status: "CONFIRMED_NONE" | "KNOWN_ALLERGIES") => {
    const allergens = status === "KNOWN_ALLERGIES" ? parseWatchAllergens(allergyKnownRaw) : [];
    if (status === "KNOWN_ALLERGIES" && allergens.length === 0) {
      setError(translateLibraryError({ message: "allergens_required" }));
      return;
    }
    try {
      await setAdminClientNutritionPreferences({
        clientId,
        status,
        allergens,
        dislikedFoods: parseWatchAllergens(dislikedFoodsRaw),
      });
      setAllergyStatus(status);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(translateLibraryError(err));
    }
  };

  const confirmStrategyGenerate = (replace: boolean) => {
    const allergy = allergyStateForStrategy();
    if (!allergy) {
      setError(translateLibraryError({ message: "allergy_status_required" }));
      return;
    }
    if (!selectedTemplateId) {
      setError("اختر قالب تغذية منشورًا أولًا.");
      return;
    }
    const selectedTemplate = nutritionTemplates.find((row) => row.id === selectedTemplateId);
    onConfirm({
      title: "إنشاء نسخة تغذية خاصة بالعميل",
      body: `${selectedTemplate?.name_ar ?? "القالب المختار"} سيُحسب ببيانات هذا العميل ويُحفظ كمسودة. الخطة المنشورة الحالية لن تتغير حتى تضغط نشر.`,
      confirmLabel: "إنشاء المسودة",
      tone: "primary",
      onConfirm: () => {
        setStrategyBusy(true);
        void assignReadyMadeStrategyNutrition({
          clientId,
          overviewGoal: overview.goal,
          startsOn,
          replace,
          allergy,
          restrictions: parseWatchAllergens(dislikedFoodsRaw),
          templateId: selectedTemplateId,
          publish: false,
        })
          .then(async (row) => {
            setDetail(row);
            setDraft(row);
            setAssignStep("closed");
            const list = await listAdminClientNutritionAssignments(clientId, 0);
            setHistory(list.rows);
            setHistoryTotal(list.totalCount);
            await onOverviewRefresh();
          })
          .catch((err) => {
            console.error(err);
            setError(translateLibraryError(err));
          })
          .finally(() => setStrategyBusy(false));
      },
    });
  };

  const applyMealToSlot = async (
    slotKey: NutritionSlotKey,
    mealId: string,
    target: "assign" | "edit",
  ) => {
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
  const todayLogs = logs.filter(
    (row) => row.session_date === todayKey && row.status === "completed",
  );
  const plannedToday = detail?.slots.length ?? 0;

  if (loading) return <AdminSkeletonRows rows={5} />;

  const goalPresentation = presentClientTrainingGoal(overview.goal);
  const hasPlan = Boolean(detail && (detail.status === "active" || detail.status === "scheduled"));
  const planTone: TrainingToolCardTone = !hasPlan
    ? "attention"
    : detail?.allergen_conflict
      ? "warn"
      : detail?.snapshot_complete === false
        ? "warn"
        : "ok";
  const planStatus = !hasPlan
    ? "يحتاج تدخل"
    : detail?.allergen_conflict
      ? "يحتاج مراجعة"
      : detail?.snapshot_complete === false
        ? "لقطة ناقصة"
        : "يعمل جيداً";
  const planPreview = !hasPlan
    ? "لا خطة نشطة — عيّن برنامجاً غذائياً جاهزاً"
    : `${detail?.name_ar ?? "خطة نشطة"} · ${nutritionStatusLabel(detail?.status ?? "")}`;

  const openManualAssign = () => {
    guard(() => {
      setAssignStep("pick");
      setSlotDrafts(emptySlots());
      setWatchRaw("");
    });
  };

  const nutritionCards = (
    <div className="cc-tool-cards" aria-label="أدوات التغذية">
      <TrainingToolCard
        title="هدف التغذية"
        preview={
          goalPresentation.status === "MISSING"
            ? "لم يُحدَّد هدف بعد من الكويز أو الأدمن"
            : `هدفه: ${goalPresentation.displayAr}`
        }
        statusLabel={
          goalPresentation.status === "MISSING"
            ? "غير محدد"
            : goalPresentation.status === "UNMAPPED"
              ? "يحتاج مراجعة"
              : "جاهز"
        }
        tone={
          goalPresentation.status === "MISSING"
            ? "attention"
            : goalPresentation.status === "UNMAPPED"
              ? "warn"
              : "ok"
        }
      >
        <AdminCard>
          <dl className="cc-dl">
            <div>
              <dt>الهدف الظاهر</dt>
              <dd>{goalPresentation.displayAr}</dd>
            </div>
            <div>
              <dt>المصدر الخام</dt>
              <dd dir="ltr">{goalPresentation.raw || "—"}</dd>
            </div>
            <div>
              <dt>ملاحظة</dt>
              <dd>الهدف سياق للتعيين الجاهز؛ لا يُخترع منه وصف طبي أو نسبة التزام.</dd>
            </div>
          </dl>
        </AdminCard>
      </TrainingToolCard>

      <TrainingToolCard
        title="الخطة الغذائية"
        preview={planPreview}
        statusLabel={planStatus}
        tone={planTone}
      >
        <AdminCard>
          <p className="cc-muted">
            {NUTRITION_BOUNDARIES.library} منفصل عن {NUTRITION_BOUNDARIES.assigned}. تعديل المكتبة
            لا يغيّر لقطة العميل.
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
                  {Math.round(detail.planned_calories)} سعرة · {detail.planned_protein_g} بروتين ·{" "}
                  {detail.planned_carbs_g} كارب · {detail.planned_fat_g} دهون
                </dd>
              </div>
              <div>
                <dt>تعارض حساسية</dt>
                <dd>{detail.allergen_conflict ? "نعم — مراجعة مطلوبة" : "لا تطابق مباشر"}</dd>
              </div>
              <div>
                <dt>لقطة مكتملة</dt>
                <dd>{detail.snapshot_complete ? "نعم" : "لا — بيانات ناقصة"}</dd>
              </div>
            </dl>
          ) : (
            <AdminEmptyState
              title="لا توجد خطة تغذية نشطة."
              body="امنح العميل برنامجاً غذائياً جاهزاً (Strategy V1) أو عيّن وجبات يدويًا لإنشاء لقطة مستقلة."
            />
          )}

          <div className="cc-form-grid" style={{ marginTop: 12 }}>
            <AdminField
              label="حالة الحساسية (مطلوبة للتوليد الجاهز)"
              htmlFor="nutrition_allergy_status"
            >
              <AdminSelect
                value={allergyStatus === "UNKNOWN" ? "" : allergyStatus}
                onChange={(v) => {
                  if (v === "CONFIRMED_NONE") {
                    void saveAllergyStatus("CONFIRMED_NONE");
                    return;
                  }
                  if (v === "KNOWN_ALLERGIES") {
                    setAllergyStatus("KNOWN_ALLERGIES");
                    return;
                  }
                  setAllergyStatus("UNKNOWN");
                }}
              >
                <option value="">غير مؤكدة — يحتاج تدخل</option>
                <option value="CONFIRMED_NONE">لا حساسية معروفة</option>
                <option value="KNOWN_ALLERGIES">حساسيات معروفة</option>
              </AdminSelect>
            </AdminField>
            {allergyStatus === "KNOWN_ALLERGIES" ? (
              <>
                <AdminField label="مسببات حساسية (فاصلة)" htmlFor="nutrition_allergy_list">
                  <input
                    id="nutrition_allergy_list"
                    className="cc-input"
                    dir="ltr"
                    value={allergyKnownRaw}
                    onChange={(e) => setAllergyKnownRaw(e.target.value)}
                    placeholder="peanut, gluten"
                  />
                </AdminField>
                <div className="cc-editor-toolbar">
                  <button
                    type="button"
                    className="cc-btn"
                    onClick={() => void saveAllergyStatus("KNOWN_ALLERGIES")}
                  >
                    حفظ الحساسيات
                  </button>
                </div>
              </>
            ) : null}
            <AdminField label="أطعمة لا يحبها العميل (فاصلة)" htmlFor="nutrition_disliked_foods">
              <input
                id="nutrition_disliked_foods"
                className="cc-input"
                value={dislikedFoodsRaw}
                onChange={(e) => setDislikedFoodsRaw(e.target.value)}
                placeholder="فطر، تونة، بروكلي"
              />
            </AdminField>
            {allergyStatus !== "UNKNOWN" ? (
              <div className="cc-editor-toolbar">
                <button
                  type="button"
                  className="cc-btn"
                  onClick={() => void saveAllergyStatus(allergyStatus)}
                >
                  حفظ بيانات السلامة والتفضيلات
                </button>
              </div>
            ) : null}
          </div>

          <div className="cc-editor-toolbar">
            <label className="cc-command-field" style={{ minWidth: 240 }}>
              <span>قالب التغذية المنشور</span>
              <select
                value={selectedTemplateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
              >
                <option value="">اختر قالبًا</option>
                {nutritionTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name_ar} · V{template.version}
                    {template.is_default ? " · افتراضي" : ""}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="cc-btn cc-btn--primary"
              disabled={strategyBusy || !selectedTemplateId}
              onClick={() =>
                confirmStrategyGenerate(
                  overview.nutrition_assignment?.status === "active" ||
                    overview.nutrition_assignment?.status === "scheduled",
                )
              }
            >
              {strategyBusy ? "جاري التوليد…" : "إنشاء من القالب كمسودة"}
            </button>
            <button type="button" className="cc-btn cc-btn--primary" onClick={openManualAssign}>
              تعيين برنامج غذائي جاهز
            </button>
            {detail &&
            (detail.status === "active" ||
              detail.status === "scheduled" ||
              detail.status === "draft") ? (
              <>
                <button
                  type="button"
                  className="cc-btn"
                  disabled={publishBusy}
                  onClick={() => {
                    if (detail.status === "draft") {
                      setEditing(true);
                      return;
                    }
                    void createNutritionDraft();
                  }}
                >
                  {detail.status === "draft" ? "فتح المسودة" : "إنشاء مسودة للتعديل"}
                </button>
                {detail.status === "active" || detail.status === "scheduled" ? (
                  <>
                    <button
                      type="button"
                      className="cc-btn"
                      onClick={() => requestEnd("completed")}
                    >
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
              </>
            ) : null}
            {conversationId ? (
              <Link
                to="/admin/messages/$conversationId"
                params={{ conversationId }}
                className="cc-btn"
              >
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
                          تعارض حساسية يحتاج مراجعة:{" "}
                          {allergenOverlap(watchAllergens, slot.allergens).join("، ")}
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
                      <AdminField
                        label={`حصة ${NUTRITION_SLOT_LABELS[slot.slot_key]}`}
                        htmlFor={`servings_${slot.slot_key}`}
                      >
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
                                row.slot_key === slot.slot_key
                                  ? { ...row, notes_ar: event.target.value }
                                  : row,
                              ),
                            )
                          }
                        />
                      </AdminField>
                    </li>
                  ))}
                </ol>
                <p className="cc-muted">
                  ملاحظات الكوتش الخاصة تبقى في تبويب الملاحظات، وليست تعليمات العميل.
                </p>
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
                      {planned.calories} سعرة · {planned.protein} بروتين · {planned.carbs} كارب ·{" "}
                      {planned.fat} دهون
                    </dd>
                  </div>
                </dl>
                {assignConflicts.length > 0 ? (
                  <p className="cc-field__error" role="alert">
                    تعارض حساسية يحتاج مراجعة: {assignConflicts.join(" · ")}. لا يُمنع التعيين
                    تلقائياً.
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
                <button
                  type="button"
                  className="cc-btn cc-btn--primary"
                  onClick={() => setAssignStep("review")}
                >
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
          <>
            <AssignmentPublishBar
              mode={nutritionPublishMode}
              editionLabel={nutritionEditionLabel}
              dirty={dirty}
              saving={saveState === "saving"}
              publishing={publishBusy}
              previewOpen={previewAsClient}
              onCreateDraft={() => void createNutritionDraft()}
              onSaveDraft={() => void saveDraft()}
              onPreview={() => {
                setPreviewAsClient(true);
                setEditing(true);
              }}
              onClosePreview={() => setPreviewAsClient(false)}
              onPublish={() => void publishNutritionDraft()}
              onDiscardDraft={() => void discardNutritionDraft()}
            />
            <AdminCard>
              <h2 className="cc-section__title">
                {previewAsClient ? "معاينة التغذية كما يراها العميل" : "محرر مسودة التغذية"}
              </h2>
              <p className="cc-muted">
                {detail.status === "draft"
                  ? "المسودة مستقلة. حفظ المسودة لا يغيّر بيانات العميل الحية. Preview للقراءة فقط."
                  : "النسخة المنشورة للقراءة — أنشئ مسودة قبل التعديل."}
              </p>
              {(editing || previewAsClient ? draft : detail)?.slots.map((slot, index) => {
                const macros = scaleMacros(slot);
                const conflicts = allergenOverlap(
                  (editing || previewAsClient ? draft : detail)?.watch_allergens,
                  slot.allergens,
                );
                const canEdit = editing && draft && detail.status === "draft" && !previewAsClient;
                return (
                  <div key={slot.id} className="cc-editor-row cc-nutrition-preview-row">
                    <div className="cc-nutrition-preview-row__media">
                      <img
                        src={mealDeliveryPath(slot.source_external_id, "thumb")}
                        alt=""
                        width={72}
                        height={72}
                        className="cc-nutrition-preview-row__img"
                        loading="lazy"
                      />
                      <div>
                        <p>
                          {slot.slot_label} — {slot.name_ar}{" "}
                          <span dir="ltr">({slot.source_external_id})</span>
                        </p>
                        <p className="cc-meta">
                          حصة × {slot.servings}
                          {slot.serving_unit ? ` · ${slot.serving_unit}` : ""} · {macros.calories}{" "}
                          سعرة · {macros.protein}ب / {macros.carbs}ك / {macros.fat}د
                        </p>
                      </div>
                    </div>
                    {conflicts.length > 0 ? (
                      <p className="cc-field__error" role="alert">
                        تعارض حساسية: {conflicts.join("، ")}
                      </p>
                    ) : null}
                    {canEdit ? (
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
                                slots: draft.slots.map((row, i) =>
                                  i === index ? { ...row, servings } : row,
                                ),
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
              {editing && detail.status === "draft" && !previewAsClient ? (
                <div className="cc-editor-toolbar">
                  <AdminField label="حساسيات للمتابعة" htmlFor="edit_watch">
                    <input
                      id="edit_watch"
                      dir="ltr"
                      value={(draft?.watch_allergens ?? []).join(", ")}
                      onChange={(event) => {
                        if (!draft) return;
                        setDraft({
                          ...draft,
                          watch_allergens: parseWatchAllergens(event.target.value),
                        });
                        setSaveState("unsaved");
                      }}
                    />
                  </AdminField>
                </div>
              ) : null}
              {editing && pickerSlot && detail.status === "draft" && !previewAsClient ? (
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
          </>
        ) : null}
      </TrainingToolCard>

      {signals.length > 0 ? (
        <TrainingToolCard
          title="إشارات موضوعية"
          preview={`${signals.length} إشارة تشغيلية`}
          statusLabel={signals.length > 1 ? "مراجعة" : "مراقبة"}
          tone={signals.length > 1 ? "warn" : "neutral"}
        >
          <AdminCard>
            <ul>
              {signals.map((signal) => (
                <li key={signal}>{nutritionSignalLabel(signal)}</li>
              ))}
            </ul>
            <p className="cc-muted">
              لا تقييم جودة حمية ولا نسبة التزام سلوكية. الحساسية تظهر كتحذير مراجعة فقط.
            </p>
          </AdminCard>
        </TrainingToolCard>
      ) : null}

      <TrainingToolCard
        title="سجل التنفيذ الغذائي"
        preview={
          logsTotal > 0
            ? `${logsTotal} سجلًا — اليوم ${todayLogs.length}/${plannedToday || "—"}`
            : "لا سجلات بعد من تطبيق العميل"
        }
        statusLabel={logsTotal > 0 ? "نشط" : "فارغ"}
        tone={logsTotal > 0 ? "ok" : "neutral"}
      >
        <LogsTable
          logs={logs}
          loading={logsLoading}
          total={logsTotal}
          offset={logsOffset}
          onPage={setLogsOffset}
        />
      </TrainingToolCard>

      <TrainingToolCard
        title="تاريخ التغذية"
        preview={
          historyTotal > 0
            ? `${historyTotal} سجلًا — آخرها ${history[0]?.name_ar ?? "خطة"}`
            : "لا سجل تعيينات بعد"
        }
        statusLabel={historyTotal > 0 ? `${historyTotal}` : "فارغ"}
        tone="neutral"
      >
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
      </TrainingToolCard>
    </div>
  );

  if (tab === "progress") {
    return (
      <AdminSection>
        {error ? <AdminErrorState message={error} /> : null}
        <div className="cc-tool-cards" aria-label="مراجعة التغذية">
          <TrainingToolCard
            title="مراجعة التغذية"
            preview={
              hasPlan
                ? `${overview.nutrition_assignment?.name_ar ?? "خطة"} · آخر نشاط ${
                    overview.last_nutrition_at
                      ? formatRelativeAge(overview.last_nutrition_at)
                      : "لا سجل"
                  }`
                : "لا خطة تغذية — يحتاج تدخل"
            }
            statusLabel={hasPlan ? "مراقبة" : "يحتاج تدخل"}
            tone={hasPlan ? "info" : "attention"}
          >
            <AdminCard>
              <dl className="cc-dl">
                <div>
                  <dt>الخطة الحالية</dt>
                  <dd>{overview.nutrition_assignment?.name_ar || "لا خطة تغذية"}</dd>
                </div>
                <div>
                  <dt>آخر نشاط غذائي</dt>
                  <dd>
                    {overview.last_nutrition_at
                      ? formatRelativeAge(overview.last_nutrition_at)
                      : "لا سجل بعد"}
                  </dd>
                </div>
                <div>
                  <dt>وجبات اليوم</dt>
                  <dd>
                    {plannedToday > 0
                      ? `${todayLogs.length} مكتملة / ${plannedToday} مخططة`
                      : "لا خطة لعرض العد"}
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
          </TrainingToolCard>
          <TrainingToolCard
            title="سجل التنفيذ الغذائي"
            preview={logsTotal > 0 ? `${logsTotal} سجلًا` : "لا سجلات بعد"}
            statusLabel={logsTotal > 0 ? "نشط" : "فارغ"}
            tone={logsTotal > 0 ? "ok" : "neutral"}
          >
            <LogsTable
              logs={logs}
              loading={logsLoading}
              total={logsTotal}
              offset={logsOffset}
              onPage={setLogsOffset}
            />
          </TrainingToolCard>
          <TrainingToolCard
            title="تاريخ التغذية"
            preview={historyTotal > 0 ? `${historyTotal} سجلًا` : "لا سجل تعيينات بعد"}
            statusLabel={historyTotal > 0 ? `${historyTotal}` : "فارغ"}
            tone="neutral"
          >
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
          </TrainingToolCard>
        </div>
      </AdminSection>
    );
  }

  return (
    <AdminSection>
      {error ? <AdminErrorState message={error} /> : null}
      {nutritionCards}
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
        <AdminSearchInput
          value={query}
          onChange={onQuery}
          placeholder="بحث في الوجبات المنشورة"
          label="بحث"
        />
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
        <AdminEmptyState
          title="لا وجبات منشورة مطابقة"
          body="الوجبات المؤرشفة غير ظاهرة هنا افتراضياً."
        />
      ) : (
        <ul className="cc-picker-list">
          {rows.map((row) => (
            <li key={row.id}>
              <button type="button" className="cc-row-btn" onClick={() => onSelect(row.id)}>
                {row.name_ar} <span dir="ltr">({row.external_id})</span> · {row.calories} سعرة ·{" "}
                {row.meal_type}
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
      {loading ? <AdminSkeletonRows rows={3} /> : null}
      {!loading && logs.length === 0 ? (
        <AdminEmptyState
          title="لا سجلات تغذية بعد"
          body="تظهر هنا الوجبات المكتملة من تطبيق العميل فقط."
        />
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
                  <td>
                    {nutritionLogIsLegacyUnlinked(row.assignment_id)
                      ? "سجل قديم غير مرتبط"
                      : "مرتبط بالتعيين"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <AdminPagination
        offset={offset}
        pageSize={ADMIN_LIBRARY_PAGE_SIZE}
        total={total}
        onPage={onPage}
      />
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
      {rows.length === 0 ? (
        <AdminEmptyState title="لا تاريخ تعيين بعد" body="الاستبدال يُبقي الخطط السابقة هنا." />
      ) : null}
      <ul className="cc-picker-list">
        {rows.map((row) => (
          <li key={row.id}>
            <button type="button" className="cc-row-btn" onClick={() => onOpen(row.id)}>
              {row.name_ar || "خطة"} · {nutritionStatusLabel(row.status)} ·{" "}
              {formatAdminDate(row.assigned_at)}
              {row.ended_at ? ` → ${formatAdminDate(row.ended_at)}` : ""}
            </button>
          </li>
        ))}
      </ul>
      <AdminPagination
        offset={offset}
        pageSize={ADMIN_LIBRARY_PAGE_SIZE}
        total={total}
        onPage={onPage}
      />
    </AdminCard>
  );
}
