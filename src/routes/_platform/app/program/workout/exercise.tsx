import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Dumbbell, Info, Play, Target } from "lucide-react";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { PlatformDetailHeader } from "@/components/platform/shared/PlatformDetailHeader";
import { PreviewGate } from "@/components/platform/shared/PreviewGate";
import { useMembership } from "@/hooks/useMembership";
import { EXERCISE_DETAIL_SEED } from "@/lib/platform/seed-content";

export const Route = createFileRoute("/_platform/app/program/workout/exercise")({
  head: () => ({ meta: [{ title: "تفاصيل التمرين | Hakim Platform" }] }),
  component: ExerciseDetailsPage,
});

function Metric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Clock;
  value: string;
  label: string;
}) {
  return (
    <div className="platform-card flex flex-1 flex-col items-center gap-1 p-3 text-center">
      <Icon className="h-5 w-5 text-primary" />
      <p className="text-sm font-black text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ExerciseDetailsPage() {
  const { features } = useMembership();
  const ex = EXERCISE_DETAIL_SEED;
  const previewOnly = !features.workout_program;

  return (
    <PreviewGate
      active={previewOnly}
      reason="هذه معاينة لتفاصيل التمرين. فعّل برنامجك الآن للاستفادة الكاملة."
    >
      <PlatformStack>
        <PlatformDetailHeader
          title={ex.name}
          subtitle={ex.muscle}
          backTo="/app/program/workout"
        />

        <div className="relative flex h-44 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted shadow-card">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-cta">
            <Play className="h-6 w-6 fill-current" />
          </span>
          <span className="absolute bottom-3 start-3 rounded-lg bg-black/55 px-2 py-1 text-xs font-bold text-white">
            شاهد الأداء الصحيح
          </span>
        </div>

        <div className="flex items-stretch gap-2">
          <Metric icon={Dumbbell} value={ex.sets} label="مجموعات" />
          <Metric icon={Target} value={ex.reps} label="تكرار" />
          <Metric icon={Clock} value={ex.rest} label="راحة" />
        </div>

        <section className="platform-card p-4">
          <h2 className="text-sm font-black text-foreground">خطوات الأداء</h2>
          <ol className="mt-3 flex flex-col gap-3">
            {ex.steps.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-black text-primary">
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed text-foreground">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="platform-card p-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-success" />
            <h2 className="text-sm font-black text-foreground">نصائح</h2>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {ex.tips.map((tip, index) => (
              <li key={index} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                {tip}
              </li>
            ))}
          </ul>
        </section>

        <Link
          to="/app/program/workout"
          className="flex h-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-sm font-black text-secondary-foreground shadow-card transition active:scale-[0.99]"
        >
          تم — التمرين التالي
        </Link>
      </PlatformStack>
    </PreviewGate>
  );
}
