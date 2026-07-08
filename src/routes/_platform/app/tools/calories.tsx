import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Calculator, Flame } from "lucide-react";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { PlatformDetailHeader } from "@/components/platform/shared/PlatformDetailHeader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_platform/app/tools/calories")({
  head: () => ({ meta: [{ title: "حاسبة السعرات | Hakim Platform" }] }),
  component: CalorieCalculatorPage,
});

type Sex = "male" | "female";
type Activity = "sedentary" | "light" | "moderate" | "active";

const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

const ACTIVITY_LABELS: Record<Activity, string> = {
  sedentary: "قليل الحركة",
  light: "نشاط خفيف",
  moderate: "نشاط متوسط",
  active: "نشاط عالٍ",
};

function CalorieCalculatorPage() {
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(28);
  const [weight, setWeight] = useState(72);
  const [height, setHeight] = useState(175);
  const [activity, setActivity] = useState<Activity>("moderate");

  const result = useMemo(() => {
    const bmr =
      sex === "male"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;
    const maintenance = Math.round(bmr * ACTIVITY_FACTOR[activity]);
    return {
      maintenance,
      cut: Math.round(maintenance - 400),
      bulk: Math.round(maintenance + 300),
    };
  }, [sex, age, weight, height, activity]);

  return (
    <PlatformStack>
      <PlatformDetailHeader
        title="حاسبة السعرات"
        subtitle="أداة مجانية لتقدير احتياجك اليومي"
        backTo="/app"
      />

      <section className="platform-card space-y-4 p-4">
        <div className="flex gap-2">
          {(
            [
              ["male", "رجل"],
              ["female", "امرأة"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSex(value)}
              className={cn(
                "flex-1 rounded-xl px-3 py-2.5 text-sm font-extrabold transition",
                sex === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <Field
          label="العمر"
          value={age}
          onChange={setAge}
          min={14}
          max={80}
          suffix="سنة"
        />
        <Field
          label="الوزن"
          value={weight}
          onChange={setWeight}
          min={35}
          max={200}
          suffix="كجم"
        />
        <Field
          label="الطول"
          value={height}
          onChange={setHeight}
          min={130}
          max={220}
          suffix="سم"
        />

        <div>
          <p className="mb-2 text-xs font-bold text-muted-foreground">مستوى النشاط</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(ACTIVITY_LABELS) as Activity[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setActivity(key)}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-xs font-extrabold transition",
                  activity === key
                    ? "bg-secondary-soft text-success"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {ACTIVITY_LABELS[key]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="platform-card space-y-3 p-4">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary">
            <Calculator className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-bold text-muted-foreground">نتيجتك التقريبية</p>
            <p className="text-sm font-black text-foreground">احفظها كمرجع يومي</p>
          </div>
        </div>

        <ResultRow
          icon={<Flame className="h-4 w-4 text-[#EA580C]" />}
          label="للمحافظة"
          value={`${result.maintenance} سعرة`}
        />
        <ResultRow
          icon={<Flame className="h-4 w-4 text-success" />}
          label="للتنشيف"
          value={`${result.cut} سعرة`}
        />
        <ResultRow
          icon={<Flame className="h-4 w-4 text-primary" />}
          label="للتضخيم"
          value={`${result.bulk} سعرة`}
        />
      </section>
    </PlatformStack>
  );
}

function Field({
  label,
  value,
  onChange,
  min,
  max,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  suffix: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-xs font-bold text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums text-foreground">
          {value} {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--primary)]"
      />
    </label>
  );
}

function ResultRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-muted/70 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-white">{icon}</span>
        <span className="text-sm font-bold text-foreground">{label}</span>
      </div>
      <span className="text-sm font-black tabular-nums text-foreground">{value}</span>
    </div>
  );
}
