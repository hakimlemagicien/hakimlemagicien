import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, CheckCircle2, Copy, Eye, Plus, Search, Send, Star, X } from "lucide-react";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminPageHeader,
  AdminStatusBadge,
} from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import { TrainingOpsSubnav } from "@/components/admin/TrainingOpsSubnav";
import { searchAdminClients, type AdminClientListItem } from "@/lib/admin/admin-clients-api";
import {
  getAdminClientNutritionAllergy,
  getAdminClientNutritionProfileInputs,
  getAdminClientNutritionTrainingWindow,
  saveAdminClientNutritionProfileInputs,
  saveAdminClientNutritionTrainingWindow,
  setAdminClientNutritionPreferences,
  type AdminNutritionAllergyStatus,
  type AdminNutritionProfileInputs,
} from "@/lib/admin/admin-client-nutrition-api";
import {
  adminMealImageSource,
  fetchAdminMealMediaUrls,
  getAdminMeal,
  listAdminMeals,
  type AdminMealDetail,
  type AdminMealListItem,
} from "@/lib/admin/admin-meals-api";
import { assignReadyMadeStrategyNutrition } from "@/lib/admin/admin-nutrition-strategy-assign";
import {
  archiveNutritionTemplate,
  createNutritionTemplateVersion,
  duplicateNutritionTemplate,
  listNutritionTemplates,
  publishNutritionTemplate,
  saveNutritionTemplate,
  setDefaultNutritionTemplate,
  type NutritionTemplateBucket,
  type NutritionTemplateRecord,
} from "@/lib/admin/admin-nutrition-templates-api";
import { CLIENT_GOAL_IDS } from "@/lib/platform/nutrition-strategy";
import {
  TRAINING_MEAL_WINDOWS,
  TRAINING_MEAL_WINDOW_LABELS_AR,
  type TrainingMealWindow,
} from "@/lib/platform/customer-journey";

type TemplateSlotDefinition = {
  slot_key: string;
  label_ar: string;
  allowed_types: readonly string[];
  conservative?: boolean;
};

const SLOT_STRUCTURE: readonly TemplateSlotDefinition[] = [
  { slot_key: "breakfast", label_ar: "الفطور", allowed_types: ["breakfast"] },
  { slot_key: "lunch", label_ar: "وجبة رئيسية 1", allowed_types: ["lunch"] },
  { slot_key: "snack", label_ar: "وجبة رئيسية / سناك", allowed_types: ["snack"] },
  { slot_key: "dinner", label_ar: "وجبة رئيسية 2", allowed_types: ["dinner"] },
  {
    slot_key: "pre_workout",
    label_ar: "قبل التمرين",
    allowed_types: ["pre_workout"],
    conservative: true,
  },
  {
    slot_key: "post_workout",
    label_ar: "بعد التمرين",
    allowed_types: ["post_workout"],
    conservative: true,
  },
] as const;

const BUCKET_LABEL: Record<NutritionTemplateBucket, string> = {
  FAT_LOSS: "خسارة الدهون",
  MUSCLE_GAIN: "بناء العضلات",
  MAINTENANCE: "الثبات والصحة",
};

const GOAL_LABEL: Record<string, string> = {
  FAT_LOSS: "خسارة الدهون",
  MUSCLE_GAIN: "بناء العضلات",
  BODY_RECOMPOSITION: "إعادة التكوين",
  GLUTE_GROWTH: "تطوير الأرداف",
  WAIST_DEFINITION: "تحديد الخصر",
  UPPER_BODY_DEFINITION: "تحديد الجزء العلوي",
  FEMININE_BALANCED_BODY: "جسم أنثوي متوازن",
  STRENGTH_PERFORMANCE: "القوة والأداء",
  FITNESS_ENDURANCE: "اللياقة والتحمل",
  MOBILITY_RECOVERY: "الحركة والتعافي",
  POSTURE_BACK_HEALTH: "القوام وصحة الظهر",
  GENERAL_HEALTH_FITNESS: "الصحة واللياقة",
};

type CuratedMeal = Pick<
  AdminMealListItem,
  | "id"
  | "external_id"
  | "name_ar"
  | "meal_type"
  | "calories"
  | "protein_g"
  | "carbs_g"
  | "fat_g"
  | "image_thumb_path"
>;
type CuratedDay = { day: number; slots: Record<string, CuratedMeal | null> };

function blankDays(): CuratedDay[] {
  return Array.from({ length: 7 }, (_, index) => ({
    day: index + 1,
    slots: Object.fromEntries(SLOT_STRUCTURE.map((slot) => [slot.slot_key, null])),
  }));
}

function parseCurated(value: Array<Record<string, unknown>>): CuratedDay[] {
  if (value.length !== 7) return blankDays();
  return value.map((item, index) => ({
    day: Number(item.day ?? index + 1),
    slots: (item.slots as Record<string, CuratedMeal | null>) ?? {},
  }));
}

function dateText(value: string) {
  return new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(new Date(value));
}

export function NutritionTemplateCatalog() {
  const [templates, setTemplates] = useState<NutritionTemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editor, setEditor] = useState<NutritionTemplateRecord | "new" | null>(null);
  const [preview, setPreview] = useState<NutritionTemplateRecord | null>(null);
  const [assigning, setAssigning] = useState<NutritionTemplateRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTemplates(await listNutritionTemplates());
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل القوالب.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(work: () => Promise<unknown>, message: string) {
    setNotice(null);
    try {
      await work();
      setNotice(message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تنفيذ الإجراء.");
    }
  }

  return (
    <div className="cc-ops-stack">
      <AdminPageHeader
        kicker="التغذية · مركز التشغيل"
        title="قوالب التغذية"
        subtitle="قواعد محسوبة وآمنة للوجبات، ثم نسخة مستقلة لكل عميل. النشر هنا لا يحتاج نشر الكود."
        actions={
          <button type="button" className="cc-btn cc-btn--primary" onClick={() => setEditor("new")}>
            <Plus size={18} /> قالب جديد
          </button>
        }
      />
      <TrainingOpsSubnav section="nutrition" />
      <div className="cc-automation-contract">
        <strong>القالب الرئيسي ← تعيين ← نسخة العميل ← تعديل خاص</strong>
        <span>تعديل القالب لا يغيّر خطط العملاء المنشورة.</span>
      </div>
      {notice ? (
        <div className="cc-template-notice">
          <CheckCircle2 size={18} />
          {notice}
        </div>
      ) : null}
      {error ? <AdminErrorState message={error} onRetry={() => void load()} /> : null}
      {loading ? <AdminSkeletonRows rows={3} /> : null}
      {!loading && templates.length === 0 ? (
        <AdminEmptyState title="لا توجد قوالب" body="أنشئ أول قالب غذائي محسوب." />
      ) : null}
      <div className="cc-template-grid">
        {templates.map((template) => (
          <article className="cc-template-card" key={template.id}>
            <div className="cc-template-card__top">
              <div>
                <span className="cc-template-card__eyebrow">
                  {BUCKET_LABEL[template.strategy_bucket]} · V{template.version}
                </span>
                <h2>{template.name_ar}</h2>
              </div>
              <AdminStatusBadge tone={template.status}>
                {template.status === "published"
                  ? "منشور"
                  : template.status === "draft"
                    ? "مسودة"
                    : "مؤرشف"}
              </AdminStatusBadge>
            </div>
            <p>{template.description_ar || "بدون وصف"}</p>
            <div className="cc-template-card__badges">
              <span>7 أيام</span>
              <span>6 وجبات/يوم</span>
              <span>{template.selection_mode === "calculated" ? "محسوب" : "منتقى يدويًا"}</span>
              {template.is_default ? (
                <span className="is-default">
                  <Star size={12} /> افتراضي
                </span>
              ) : null}
            </div>
            <div className="cc-template-goals">
              {template.mapped_goals.map((goal) => (
                <span key={goal}>{GOAL_LABEL[goal] ?? goal}</span>
              ))}
            </div>
            <div className="cc-template-card__meta">
              <span>{template.assigned_clients || 0} عميل حالي</span>
              <span>آخر تعديل {dateText(template.updated_at)}</span>
            </div>
            <div className="cc-template-card__actions">
              <button
                type="button"
                className="cc-btn cc-btn--ghost"
                onClick={() => setPreview(template)}
              >
                <Eye size={16} /> معاينة
              </button>
              {template.status === "draft" ? (
                <button type="button" className="cc-btn" onClick={() => setEditor(template)}>
                  تعديل
                </button>
              ) : null}
              {template.status === "draft" ? (
                <button
                  type="button"
                  className="cc-btn cc-btn--primary"
                  onClick={() =>
                    void act(() => publishNutritionTemplate(template.id), "تم نشر القالب.")
                  }
                >
                  نشر
                </button>
              ) : null}
              {template.status === "published" ? (
                <button
                  type="button"
                  className="cc-btn cc-btn--primary"
                  onClick={() => setAssigning(template)}
                >
                  <Send size={16} /> تعيين
                </button>
              ) : null}
              {template.status === "published" ? (
                <button
                  type="button"
                  className="cc-btn"
                  onClick={() =>
                    void act(
                      () => createNutritionTemplateVersion(template.id),
                      "تم إنشاء مسودة الإصدار الجديد.",
                    )
                  }
                >
                  إصدار جديد
                </button>
              ) : null}
              {template.status === "published" && !template.is_default ? (
                <button
                  type="button"
                  className="cc-btn"
                  onClick={() =>
                    void act(
                      () => setDefaultNutritionTemplate(template.id),
                      "تم تعيين القالب كافتراضي.",
                    )
                  }
                >
                  <Star size={15} /> افتراضي
                </button>
              ) : null}
              {template.status !== "archived" ? (
                <button
                  type="button"
                  className="cc-btn"
                  onClick={() => {
                    const key = `${template.template_key}-copy-${Date.now().toString().slice(-5)}`;
                    void act(
                      () =>
                        duplicateNutritionTemplate(template.id, key, `${template.name_ar} — نسخة`),
                      "تم إنشاء نسخة مستقلة كمسودة.",
                    );
                  }}
                >
                  <Copy size={15} /> نسخ
                </button>
              ) : null}
              {template.status !== "archived" ? (
                <button
                  type="button"
                  className="cc-btn cc-btn--danger"
                  onClick={() =>
                    window.confirm("أرشفة القالب؟ ستبقى نسخ العملاء الحالية دون تغيير.") &&
                    void act(() => archiveNutritionTemplate(template.id), "تمت أرشفة القالب.")
                  }
                >
                  <Archive size={15} /> أرشفة
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {editor ? (
        <TemplateEditor
          template={editor === "new" ? null : editor}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            setNotice("حُفظت المسودة.");
            void load();
          }}
        />
      ) : null}
      {preview ? <TemplatePreview template={preview} onClose={() => setPreview(null)} /> : null}
      {assigning ? (
        <AssignTemplateSheet
          template={assigning}
          onClose={() => setAssigning(null)}
          onAssigned={() => {
            setAssigning(null);
            setNotice("تم إنشاء نسخة العميل بنجاح.");
            void load();
          }}
        />
      ) : null}
    </div>
  );
}

function TemplateEditor({
  template,
  onClose,
  onSaved,
}: {
  template: NutritionTemplateRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tab, setTab] = useState<"details" | "meals" | "preview">("details");
  const [name, setName] = useState(template?.name_ar ?? "");
  const [key, setKey] = useState(template?.template_key ?? "");
  const [description, setDescription] = useState(template?.description_ar ?? "");
  const [bucket, setBucket] = useState<NutritionTemplateBucket>(
    template?.strategy_bucket ?? "FAT_LOSS",
  );
  const [goals, setGoals] = useState<string[]>(template?.mapped_goals ?? ["FAT_LOSS"]);
  const [gender, setGender] = useState(template?.gender_scope ?? "all");
  const [mode, setMode] = useState(template?.selection_mode ?? "calculated");
  const [active, setActive] = useState(template?.is_active ?? true);
  const [isDefault, setIsDefault] = useState(template?.is_default ?? false);
  const [notes, setNotes] = useState(template?.notes ?? "");
  const [days, setDays] = useState<CuratedDay[]>(parseCurated(template?.curated_plan ?? []));
  const [picker, setPicker] = useState<{ day: number; slot: TemplateSlotDefinition } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const complete = days.every((day) =>
    SLOT_STRUCTURE.every((slot) => Boolean(day.slots[slot.slot_key])),
  );
  async function save() {
    if (!name.trim() || !key.trim() || goals.length === 0) {
      setError("الاسم والكود وهدف واحد على الأقل مطلوبة.");
      return;
    }
    if (mode === "curated" && !complete) {
      setError("القالب المنتقى يدويًا يحتاج 6 وجبات لكل يوم من الأيام السبعة.");
      setTab("meals");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveNutritionTemplate({
        id: template?.id,
        name_ar: name,
        template_key: key,
        description_ar: description,
        strategy_bucket: bucket,
        mapped_goals: goals,
        gender_scope: gender,
        selection_mode: mode,
        cycle_days: 7,
        meals_per_day: 6,
        slot_structure: SLOT_STRUCTURE,
        curated_plan: mode === "curated" ? days : [],
        notes,
        is_active: active,
        is_default: isDefault,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ المسودة.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cc-dialog-scrim" onClick={onClose}>
      <section
        className="cc-ops-sheet cc-template-sheet"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="cc-ops-sheet__head">
          <div>
            <small>Draft فقط</small>
            <h2>{template ? `تعديل ${template.name_ar}` : "قالب تغذية جديد"}</h2>
          </div>
          <button type="button" className="cc-icon-btn" onClick={onClose}>
            <X />
          </button>
        </header>
        <div className="cc-template-tabs">
          <button
            className={tab === "details" ? "is-active" : ""}
            onClick={() => setTab("details")}
          >
            الإعدادات
          </button>
          <button className={tab === "meals" ? "is-active" : ""} onClick={() => setTab("meals")}>
            خطة 7 أيام
          </button>
          <button
            className={tab === "preview" ? "is-active" : ""}
            onClick={() => setTab("preview")}
          >
            المعاينة
          </button>
        </div>
        {tab === "details" ? (
          <div className="cc-form-grid cc-sheet-form">
            <label className="cc-command-field">
              <span>اسم القالب</span>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="cc-command-field">
              <span>الكود الداخلي</span>
              <input
                dir="ltr"
                value={key}
                onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              />
            </label>
            <label className="cc-command-field cc-command-field--wide">
              <span>الوصف</span>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <label className="cc-command-field">
              <span>الاستراتيجية</span>
              <select
                value={bucket}
                onChange={(e) => setBucket(e.target.value as NutritionTemplateBucket)}
              >
                {Object.entries(BUCKET_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="cc-command-field">
              <span>وضع الاختيار</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "calculated" | "curated")}
              >
                <option value="calculated">محسوب تلقائيًا</option>
                <option value="curated">منتقى يدويًا</option>
              </select>
            </label>
            <label className="cc-command-field">
              <span>نطاق الجنس</span>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as "all" | "male" | "female")}
              >
                <option value="all">الجميع</option>
                <option value="male">رجال</option>
                <option value="female">نساء</option>
              </select>
            </label>
            <div className="cc-command-field">
              <span>الدورة</span>
              <div className="cc-fixed-contract">7 أيام · 6 وجبات يوميًا</div>
            </div>
            <fieldset className="cc-goal-checks">
              <legend>الأهداف الرسمية</legend>
              {CLIENT_GOAL_IDS.map((goal) => (
                <label key={goal}>
                  <input
                    type="checkbox"
                    checked={goals.includes(goal)}
                    onChange={(e) =>
                      setGoals(
                        e.target.checked ? [...goals, goal] : goals.filter((item) => item !== goal),
                      )
                    }
                  />
                  <span>{GOAL_LABEL[goal]}</span>
                </label>
              ))}
            </fieldset>
            <label className="cc-command-field cc-command-field--wide">
              <span>ملاحظات داخلية</span>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <label className="cc-toggle-row">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <span>
                <strong>قالب نشط</strong>
                <small>يمكن استخدامه بعد النشر</small>
              </span>
            </label>
            <label className="cc-toggle-row">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
              <span>
                <strong>افتراضي للاستراتيجية</strong>
                <small>الجدد فقط؛ لا يغير العملاء الحاليين</small>
              </span>
            </label>
          </div>
        ) : null}
        {tab === "meals" ? (
          <div className="cc-seven-days">
            <p className="cc-preview-note">
              في الوضع المحسوب يختار المحرك وجبات آمنة عند إنشاء نسخة العميل. في الوضع المنتقى يجب
              اختيار 42 خانة، ولا يُسمح بالعبور بين الأنواع.
            </p>
            {days.map((day) => (
              <details key={day.day} open={day.day === 1}>
                <summary>
                  اليوم {day.day}
                  <span>{SLOT_STRUCTURE.filter((slot) => day.slots[slot.slot_key]).length}/6</span>
                </summary>
                <div className="cc-day-slots">
                  {SLOT_STRUCTURE.map((slot) => {
                    const meal = day.slots[slot.slot_key];
                    return (
                      <button
                        type="button"
                        key={slot.slot_key}
                        onClick={() => setPicker({ day: day.day, slot })}
                      >
                        <span>{slot.label_ar}</span>
                        <strong>{meal?.name_ar ?? "اختيار وجبة"}</strong>
                        <small>
                          {meal
                            ? `${meal.calories} kcal · P ${meal.protein_g} · C ${meal.carbs_g} · F ${meal.fat_g}`
                            : slot.conservative
                              ? "فلتر محافظ إلزامي"
                              : slot.allowed_types.join(" / ")}
                        </small>
                      </button>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        ) : null}
        {tab === "preview" ? (
          <SevenDayPreview days={days} calculated={mode === "calculated"} bucket={bucket} />
        ) : null}
        {error ? (
          <p className="cc-field__error" role="alert">
            {error}
          </p>
        ) : null}
        <footer className="cc-sheet-actions">
          <button type="button" className="cc-btn cc-btn--ghost" onClick={onClose}>
            إلغاء
          </button>
          <button
            type="button"
            className="cc-btn cc-btn--primary"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? "جاري الحفظ…" : "حفظ كمسودة"}
          </button>
        </footer>
        {picker ? (
          <MealPicker
            slot={picker.slot}
            onClose={() => setPicker(null)}
            onPick={(meal) => {
              setDays((current) =>
                current.map((day) =>
                  day.day === picker.day
                    ? { ...day, slots: { ...day.slots, [picker.slot.slot_key]: meal } }
                    : day,
                ),
              );
              setPicker(null);
            }}
          />
        ) : null}
      </section>
    </div>
  );
}

function MealPicker({
  slot,
  onClose,
  onPick,
}: {
  slot: TemplateSlotDefinition;
  onClose: () => void;
  onPick: (meal: CuratedMeal) => void;
}) {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<AdminMealListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      void (async () => {
        const first = await listAdminMeals({
          query,
          type: slot.allowed_types[0],
          status: "published",
          offset: 0,
        });
        const pageOffsets = Array.from(
          { length: Math.max(0, Math.ceil(first.totalCount / 25) - 1) },
          (_, index) => (index + 1) * 25,
        );
        const extraPages = await Promise.all(
          pageOffsets.map((offset) =>
            listAdminMeals({ query, type: slot.allowed_types[0], status: "published", offset }),
          ),
        );
        const available = [first, ...extraPages]
          .flatMap((page) => page.rows)
          .filter((meal) => meal.is_active && meal.image_status === "ready");
        if (!slot.conservative) return available;
        const detailed = await Promise.all(available.map((meal) => getAdminMeal(meal.id)));
        return detailed.filter((meal) => isConservativePickerMeal(slot.slot_key, meal));
      })()
        .then(async (result) => {
          if (cancelled) return;
          setRows(result);
          const urls = await fetchAdminMealMediaUrls(result.map((meal) => meal.image_thumb_path));
          if (!cancelled) setMediaUrls(urls);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, slot]);
  return (
    <div className="cc-dialog-scrim cc-dialog-scrim--nested" onClick={onClose}>
      <section className="cc-ops-sheet cc-ops-sheet--compact" onClick={(e) => e.stopPropagation()}>
        <header className="cc-ops-sheet__head">
          <div>
            <small>مرشح آمن تلقائيًا</small>
            <h2>{slot.label_ar}</h2>
          </div>
          <button className="cc-icon-btn" onClick={onClose}>
            <X />
          </button>
        </header>
        <label className="cc-template-search">
          <Search />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث باسم الوجبة…"
          />
        </label>
        {slot.conservative ? (
          <p className="cc-template-warning">
            تُطبّق حدود السعرات والدهون/الألياف والبروتين/الكربوهيدرات مرة أخرى عند النشر والتعيين.
          </p>
        ) : null}
        <div className="cc-meal-picker-list">
          {loading ? (
            <AdminSkeletonRows rows={4} />
          ) : rows.length === 0 ? (
            <AdminEmptyState
              title="لا توجد وجبات جاهزة لهذه الخانة"
              body="يجب أن تكون الوجبة منشورة ونشطة وصورتها جاهزة ومطابقة لنوع الخانة."
            />
          ) : (
            rows.map((meal) => (
              <button key={meal.id} type="button" onClick={() => onPick(meal)}>
                <img
                  src={adminMealImageSource(meal, mediaUrls, "thumb")}
                  alt={`صورة ${meal.name_ar}`}
                  loading="lazy"
                />
                <div>
                  <strong>{meal.name_ar}</strong>
                  <span>
                    {meal.external_id} · {meal.meal_type}
                  </span>
                </div>
                <small>
                  {meal.calories} kcal
                  <br />P {meal.protein_g} · C {meal.carbs_g} · F {meal.fat_g}
                </small>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function isConservativePickerMeal(slotKey: string, meal: AdminMealDetail): boolean {
  if (slotKey === "pre_workout") {
    const fiber = Number(meal.qa.derived_fiber_g);
    return (
      meal.meal_type === "pre_workout" &&
      meal.carbs_g >= 20 &&
      meal.fat_g <= 15 &&
      Number.isFinite(fiber) &&
      fiber <= 10 &&
      meal.calories <= 500 &&
      meal.serving_size <= 600
    );
  }
  if (slotKey === "post_workout") {
    return (
      meal.meal_type === "post_workout" &&
      meal.protein_g >= 20 &&
      meal.carbs_g >= 20 &&
      meal.fat_g <= 20 &&
      meal.calories <= 700 &&
      meal.serving_size <= 700
    );
  }
  return false;
}

function SevenDayPreview({
  days,
  calculated,
  bucket,
}: {
  days: CuratedDay[];
  calculated: boolean;
  bucket: NutritionTemplateBucket;
}) {
  return (
    <div className="cc-template-preview">
      <div className="cc-sheet-preview">
        <span>استراتيجية القالب</span>
        <strong>{BUCKET_LABEL[bucket]}</strong>
        <small>{calculated ? "السعرات والماكروز محسوبة لكل عميل" : "خطة منتقاة من 7 أيام"}</small>
      </div>
      {days.map((day) => (
        <section key={day.day}>
          <h3>اليوم {day.day}</h3>
          <div>
            {SLOT_STRUCTURE.map((slot) => {
              const meal = day.slots[slot.slot_key];
              return (
                <article key={slot.slot_key}>
                  <span>{slot.label_ar}</span>
                  <strong>
                    {calculated ? "اختيار محسوب وآمن عند التعيين" : (meal?.name_ar ?? "غير محدد")}
                  </strong>
                  <small>
                    {calculated
                      ? slot.allowed_types.join(" / ")
                      : meal
                        ? `${meal.calories} kcal · P ${meal.protein_g}`
                        : "—"}
                  </small>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function TemplatePreview({
  template,
  onClose,
}: {
  template: NutritionTemplateRecord;
  onClose: () => void;
}) {
  return (
    <div className="cc-dialog-scrim" onClick={onClose}>
      <section className="cc-ops-sheet cc-template-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="cc-ops-sheet__head">
          <div>
            <small>معاينة للقراءة فقط · V{template.version}</small>
            <h2>{template.name_ar}</h2>
          </div>
          <button className="cc-icon-btn" onClick={onClose}>
            <X />
          </button>
        </header>
        <SevenDayPreview
          days={parseCurated(template.curated_plan)}
          calculated={template.selection_mode === "calculated"}
          bucket={template.strategy_bucket}
        />
        <footer className="cc-sheet-actions">
          <button className="cc-btn cc-btn--primary" onClick={onClose}>
            إغلاق المعاينة
          </button>
        </footer>
      </section>
    </div>
  );
}

function AssignTemplateSheet({
  template,
  onClose,
  onAssigned,
}: {
  template: NutritionTemplateRecord;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [query, setQuery] = useState("");
  const [clients, setClients] = useState<AdminClientListItem[]>([]);
  const [selected, setSelected] = useState<AdminClientListItem | null>(null);
  const [startsOn, setStartsOn] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferenceStatus, setPreferenceStatus] = useState<AdminNutritionAllergyStatus>("UNKNOWN");
  const [allergens, setAllergens] = useState("");
  const [dislikedFoods, setDislikedFoods] = useState("");
  const [preferenceLoading, setPreferenceLoading] = useState(false);
  const [profileInputs, setProfileInputs] = useState<AdminNutritionProfileInputs>({
    gender: "",
    age: "",
    heightCm: "",
    weightKg: "",
    activityLevel: "",
    bodyType: "average",
  });
  const [trainingMealWindow, setTrainingMealWindow] = useState<TrainingMealWindow | "">("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (query && query.trim().length < 2) return;
      void searchAdminClients(query).then((result) => setClients(result.rows));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setPreferenceLoading(true);
    setTrainingMealWindow("");
    setError(null);
    void Promise.all([
      getAdminClientNutritionAllergy(selected.id),
      getAdminClientNutritionProfileInputs(selected.id),
      getAdminClientNutritionTrainingWindow(selected.id),
    ])
      .then(([value, profile, trainingWindow]) => {
        if (cancelled) return;
        setPreferenceStatus(value.status);
        setAllergens(value.knownAllergens.join("، "));
        setDislikedFoods(value.dislikedFoods.join("، "));
        setProfileInputs(profile);
        setTrainingMealWindow(trainingWindow);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "تعذر تحميل بيانات تغذية العميل.");
      })
      .finally(() => {
        if (!cancelled) setPreferenceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);
  const splitValues = (value: string) =>
    value
      .split(/[،,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  async function savePreferences() {
    if (!selected || preferenceStatus === "UNKNOWN") return;
    const parsedAllergens = splitValues(allergens);
    if (preferenceStatus === "KNOWN_ALLERGIES" && parsedAllergens.length === 0) {
      setError("أدخل مسببات الحساسية قبل الحفظ.");
      return;
    }
    setPreferenceLoading(true);
    setError(null);
    try {
      await setAdminClientNutritionPreferences({
        clientId: selected.id,
        status: preferenceStatus,
        allergens: parsedAllergens,
        dislikedFoods: splitValues(dislikedFoods),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ التفضيلات.");
    } finally {
      setPreferenceLoading(false);
    }
  }
  async function assign(publish: boolean) {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      if (!trainingMealWindow) throw new Error("TRAINING_TIME_REQUIRED");
      await Promise.all([
        saveAdminClientNutritionProfileInputs(selected.id, selected.goal, profileInputs),
        saveAdminClientNutritionTrainingWindow(selected.id, trainingMealWindow),
      ]);
      const allergy = await getAdminClientNutritionAllergy(selected.id);
      if (allergy.status === "UNKNOWN") throw new Error("ALLERGY_STATUS_REQUIRED");
      await assignReadyMadeStrategyNutrition({
        clientId: selected.id,
        overviewGoal: selected.goal,
        startsOn,
        replace: false,
        allergy:
          allergy.status === "CONFIRMED_NONE"
            ? { status: "CONFIRMED_NONE", confirmed_at: new Date().toISOString() }
            : { status: "KNOWN_ALLERGIES", allergens: allergy.knownAllergens },
        restrictions: allergy.dislikedFoods,
        templateId: template.id,
        publish,
      });
      onAssigned();
    } catch (err) {
      const message = err instanceof Error ? err.message : "تعذر التعيين";
      setError(
        message === "TRAINING_TIME_REQUIRED"
          ? "اختر وقت التدريب من نفس النافذة ثم أعد التفعيل."
          : message === "ALLERGY_STATUS_REQUIRED"
            ? "أكد الحساسية من نفس النافذة ثم تابع."
            : message === "nutrition_profile_incomplete"
              ? "أكمل الجنس والعمر والطول والوزن والنشاط ثم أعد التفعيل."
              : message === "draft_exists"
                ? "لدى العميل مسودة تغذية موجودة بالفعل."
                : message === "template_strategy_mismatch"
                  ? "هذا القالب لا يطابق هدف العميل. اختر قالب الهدف الصحيح."
                  : message.startsWith("curated_meal_disliked_food_conflict")
                    ? "إحدى وجبات القالب تحتوي طعامًا لا يحبه العميل. استبدلها أولًا."
                    : message,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="cc-dialog-scrim" onClick={onClose}>
      <section className="cc-ops-sheet cc-ops-sheet--compact" onClick={(e) => e.stopPropagation()}>
        <header className="cc-ops-sheet__head">
          <div>
            <small>إنشاء نسخة مستقلة للعميل</small>
            <h2>تعيين {template.name_ar}</h2>
          </div>
          <button className="cc-icon-btn" onClick={onClose}>
            <X />
          </button>
        </header>
        <label className="cc-template-search">
          <Search />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="الاسم، البريد أو الهاتف…"
          />
        </label>
        <div className="cc-client-picker">
          {clients.map((client) => (
            <button
              type="button"
              className={selected?.id === client.id ? "is-selected" : ""}
              key={client.id}
              onClick={() => setSelected(client)}
            >
              <span>{(client.fullName ?? "ع").slice(0, 1)}</span>
              <div>
                <strong>{client.fullName ?? "عميل"}</strong>
                <small>{client.email ?? client.phone ?? "—"}</small>
                <small>
                  {GOAL_LABEL[client.goal ?? ""] ?? client.goal ?? "هدف غير مكتمل"} ·{" "}
                  {client.membershipPlan ?? "FREE"}
                </small>
              </div>
            </button>
          ))}
        </div>
        {selected ? (
          <>
            <div className="cc-assign-summary">
              <span>العميل</span>
              <strong>{selected.fullName}</strong>
              <small>
                {GOAL_LABEL[selected.goal ?? ""] ?? selected.goal} ·{" "}
                {selected.membershipPlan ?? "FREE"}
              </small>
              <span>التعيين الجديد</span>
              <strong>
                {template.name_ar} · V{template.version}
              </strong>
              <small>{BUCKET_LABEL[template.strategy_bucket]} · 7 أيام · 6 وجبات</small>
              <label className="cc-command-field">
                <span>تاريخ البداية</span>
                <input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />
              </label>
              <label className="cc-command-field">
                <span>متى يتمرن العميل؟</span>
                <select
                  value={trainingMealWindow}
                  onChange={(event) =>
                    setTrainingMealWindow(event.target.value as TrainingMealWindow | "")
                  }
                >
                  <option value="">اختر وقت التدريب</option>
                  {TRAINING_MEAL_WINDOWS.map((window) => (
                    <option key={window} value={window}>
                      {TRAINING_MEAL_WINDOW_LABELS_AR[window]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="cc-profile-inputs">
              <strong>بيانات حساب الخطة</strong>
              <small>
                تُحفظ للعميل وتُستخدم لحساب السعرات والماكروز، دون أرقام افتراضية مخفية.
              </small>
              <label>
                الجنس
                <select
                  value={profileInputs.gender}
                  onChange={(event) =>
                    setProfileInputs({
                      ...profileInputs,
                      gender: event.target.value as AdminNutritionProfileInputs["gender"],
                    })
                  }
                >
                  <option value="">اختر</option>
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </label>
              <label>
                العمر
                <input
                  type="number"
                  min="13"
                  max="90"
                  value={profileInputs.age}
                  onChange={(event) =>
                    setProfileInputs({ ...profileInputs, age: event.target.value })
                  }
                />
              </label>
              <label>
                الطول (سم)
                <input
                  type="number"
                  min="120"
                  max="230"
                  value={profileInputs.heightCm}
                  onChange={(event) =>
                    setProfileInputs({ ...profileInputs, heightCm: event.target.value })
                  }
                />
              </label>
              <label>
                الوزن (كغ)
                <input
                  type="number"
                  min="35"
                  max="300"
                  value={profileInputs.weightKg}
                  onChange={(event) =>
                    setProfileInputs({ ...profileInputs, weightKg: event.target.value })
                  }
                />
              </label>
              <label>
                مستوى النشاط
                <select
                  value={profileInputs.activityLevel}
                  onChange={(event) =>
                    setProfileInputs({ ...profileInputs, activityLevel: event.target.value })
                  }
                >
                  <option value="">اختر</option>
                  <option value="sedentary">قليل</option>
                  <option value="light">خفيف</option>
                  <option value="moderate">متوسط</option>
                  <option value="high">عالٍ</option>
                  <option value="veryhigh">عالٍ جدًا</option>
                  <option value="athlete">رياضي</option>
                </select>
              </label>
              <label>
                تكوين الجسم
                <select
                  value={profileInputs.bodyType}
                  onChange={(event) =>
                    setProfileInputs({ ...profileInputs, bodyType: event.target.value })
                  }
                >
                  <option value="overweight">دهون مرتفعة</option>
                  <option value="curvy">ممتلئ</option>
                  <option value="average">متوسط</option>
                  <option value="hourglass">متوازن</option>
                  <option value="slim">نحيف</option>
                  <option value="athletic">رياضي</option>
                </select>
              </label>
            </div>
            <div className="cc-preference-editor">
              <strong>سلامة وتفضيلات العميل</strong>
              <label>
                حالة الحساسية
                <select
                  value={preferenceStatus}
                  onChange={(event) =>
                    setPreferenceStatus(event.target.value as AdminNutritionAllergyStatus)
                  }
                >
                  <option value="UNKNOWN">غير مؤكدة</option>
                  <option value="CONFIRMED_NONE">لا توجد حساسية</option>
                  <option value="KNOWN_ALLERGIES">توجد حساسية</option>
                </select>
              </label>
              {preferenceStatus === "KNOWN_ALLERGIES" ? (
                <label>
                  مسببات الحساسية
                  <input
                    value={allergens}
                    onChange={(event) => setAllergens(event.target.value)}
                    placeholder="مثال: حليب، فول سوداني"
                  />
                </label>
              ) : null}
              <label>
                أطعمة لا يحبها
                <input
                  value={dislikedFoods}
                  onChange={(event) => setDislikedFoods(event.target.value)}
                  placeholder="مثال: فطر، تونة"
                />
              </label>
              <button
                type="button"
                className="cc-btn"
                disabled={preferenceLoading || preferenceStatus === "UNKNOWN"}
                onClick={() => void savePreferences()}
              >
                {preferenceLoading ? "جارٍ الحفظ…" : "حفظ بيانات السلامة"}
              </button>
            </div>
          </>
        ) : null}
        {error ? <p className="cc-field__error">{error}</p> : null}
        <footer className="cc-sheet-actions">
          <button className="cc-btn cc-btn--ghost" onClick={onClose}>
            إلغاء
          </button>
          <button
            disabled={!selected || busy || preferenceStatus === "UNKNOWN" || !trainingMealWindow}
            className="cc-btn"
            onClick={() => void assign(false)}
          >
            تعيين كمسودة
          </button>
          <button
            disabled={!selected || busy || preferenceStatus === "UNKNOWN" || !trainingMealWindow}
            className="cc-btn cc-btn--primary"
            onClick={() => void assign(true)}
          >
            تعيين ونشر
          </button>
        </footer>
      </section>
    </div>
  );
}
