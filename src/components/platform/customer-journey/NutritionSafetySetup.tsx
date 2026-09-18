import { useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useNutritionPreferences } from "@/hooks/useNutritionPreferences";
import { NutritionTrainingTimeQuestion } from "./NutritionTrainingTimeQuestion";
import { RequiredJourneyModal } from "./RequiredJourneyModal";

const COMMON_ALLERGENS = [
  ["peanut", "الفول السوداني"],
  ["tree_nuts", "المكسرات"],
  ["milk", "الحليب"],
  ["egg", "البيض"],
  ["gluten", "الغلوتين"],
  ["fish", "السمك"],
  ["shellfish", "المحار"],
  ["soy", "الصويا"],
  ["sesame", "السمسم"],
] as const;

function parseCsv(value: string) {
  return [
    ...new Set(
      value
        .split(/[،,\n]/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

export function NutritionSafetySetup() {
  const preferences = useNutritionPreferences();
  const [step, setStep] = useState<"allergy" | "details" | "dislikes">("allergy");
  const [hasAllergy, setHasAllergy] = useState<boolean | null>(null);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [otherAllergens, setOtherAllergens] = useState("");
  const [dislikedFoods, setDislikedFoods] = useState("");
  const allAllergens = useMemo(
    () => [...new Set([...selectedAllergens, ...parseCsv(otherAllergens)])],
    [otherAllergens, selectedAllergens],
  );

  if (preferences.isLoading || preferences.isError) return null;
  if (preferences.data?.status !== "UNKNOWN") return <NutritionTrainingTimeQuestion />;

  const save = () =>
    preferences.save.mutate({
      status: hasAllergy ? "KNOWN_ALLERGIES" : "CONFIRMED_NONE",
      knownAllergens: hasAllergy ? allAllergens : [],
      dislikedFoods: parseCsv(dislikedFoods),
    });

  if (step === "allergy") {
    return (
      <RequiredJourneyModal
        icon={<span aria-hidden="true">🛡️</span>}
        title="هل لديك أي حساسية غذائية؟"
        description="نسأل عن الحساسية أولًا حتى لا نعرض وجبة قد لا تناسبك."
      >
        <div className="grid gap-2">
          <button
            type="button"
            className="min-h-12 rounded-2xl border border-border bg-background px-4 text-sm font-black hover:border-primary hover:bg-primary-soft"
            onClick={() => {
              setHasAllergy(true);
              setStep("details");
            }}
          >
            نعم، لدي حساسية
          </button>
          <button
            type="button"
            className="min-h-12 rounded-2xl border border-border bg-background px-4 text-sm font-black hover:border-primary hover:bg-primary-soft"
            onClick={() => {
              setHasAllergy(false);
              setStep("dislikes");
            }}
          >
            لا توجد لدي حساسية
          </button>
        </div>
      </RequiredJourneyModal>
    );
  }

  if (step === "details") {
    return (
      <RequiredJourneyModal
        icon={<span aria-hidden="true">⚠️</span>}
        title="حدد مسببات الحساسية"
        description="لن تدخل العناصر المحددة في برنامجك أو بدائل وجباتك."
      >
        <div className="grid grid-cols-2 gap-2 text-start">
          {COMMON_ALLERGENS.map(([value, label]) => (
            <label
              key={value}
              className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-xs font-bold"
            >
              <input
                type="checkbox"
                checked={selectedAllergens.includes(value)}
                onChange={(event) =>
                  setSelectedAllergens((current) =>
                    event.target.checked
                      ? [...current, value]
                      : current.filter((item) => item !== value),
                  )
                }
              />
              {label}
            </label>
          ))}
        </div>
        <input
          value={otherAllergens}
          onChange={(event) => setOtherAllergens(event.target.value)}
          placeholder="حساسية أخرى، افصل بينها بفاصلة"
          className="mt-3 min-h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
        />
        <button
          type="button"
          disabled={allAllergens.length === 0}
          onClick={() => setStep("dislikes")}
          className="mt-3 min-h-12 w-full rounded-2xl bg-primary px-4 text-sm font-black text-primary-foreground disabled:opacity-45"
        >
          متابعة
        </button>
      </RequiredJourneyModal>
    );
  }

  return (
    <RequiredJourneyModal
      icon={<span aria-hidden="true">🥗</span>}
      title="هل توجد أطعمة لا تحبها؟"
      description="لن نقترح الأطعمة التي تكتبها. يمكنك ترك الحقل فارغًا إن لم تكن لديك تفضيلات."
    >
      <textarea
        value={dislikedFoods}
        onChange={(event) => setDislikedFoods(event.target.value)}
        placeholder="مثال: فطر، تونة، بروكلي"
        className="min-h-28 w-full rounded-2xl border border-border bg-background p-4 text-sm outline-none focus:border-primary"
      />
      <button
        type="button"
        disabled={preferences.save.isPending}
        onClick={save}
        className="mt-3 flex min-h-12 w-full items-center justify-center rounded-2xl bg-primary px-4 text-sm font-black text-primary-foreground disabled:opacity-60"
      >
        {preferences.save.isPending ? (
          <LoaderCircle className="h-5 w-5 animate-spin" />
        ) : (
          "حفظ ومتابعة"
        )}
      </button>
      {preferences.save.isError ? (
        <p className="mt-3 text-xs font-bold text-destructive">تعذر حفظ البيانات. حاول مرة أخرى.</p>
      ) : null}
    </RequiredJourneyModal>
  );
}
