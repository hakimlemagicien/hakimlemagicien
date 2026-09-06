import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Clock3,
  Dumbbell,
  Gauge,
  LoaderCircle,
  NotebookText,
  PlaySquare,
  Target,
} from "lucide-react";
import { ExerciseMedia } from "@/components/platform/exercises/ExerciseMedia";
import { ExerciseStageGuide } from "@/components/platform/exercises/ExerciseStageGuide";
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  PlatformSection,
  PlatformStack,
} from "@/components/platform/layout/PlatformLayout";
import { PlatformDetailHeader } from "@/components/platform/shared/PlatformDetailHeader";
import {
  fetchExerciseDetails,
  formatExerciseDifficulty,
} from "@/lib/platform/exercise-library";
import { getExerciseStageGuide, getExerciseStageListThumb } from "@/lib/platform/exercise-stage-media";
import { guardExerciseLibraryRoute } from "@/lib/platform/exercise-library-route-guard";

export const Route = createFileRoute("/_platform/app/exercises/$exerciseId")({
  head: () => ({ meta: [{ title: "تفاصيل التمرين | MAAKFIT" }] }),
  beforeLoad: guardExerciseLibraryRoute,
  component: ExerciseDetailsPage,
});

function ExerciseDetailsPage() {
  const { exerciseId } = Route.useParams();
  const exerciseQuery = useQuery({
    queryKey: ["exercise-details", exerciseId],
    queryFn: () => fetchExerciseDetails(exerciseId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (exerciseQuery.isLoading) {
    return (
      <PlatformStack>
        <PlatformDetailHeader title="تفاصيل التمرين" backTo="/app/exercises" />
        <div className="platform-card flex min-h-64 flex-col items-center justify-center p-6">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm font-bold text-muted-foreground">جاري تحميل التمرين…</p>
        </div>
      </PlatformStack>
    );
  }

  if (exerciseQuery.isError || !exerciseQuery.data) {
    return (
      <PlatformStack>
        <PlatformDetailHeader title="تفاصيل التمرين" backTo="/app/exercises" />
        <div className="platform-card flex min-h-64 flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="h-8 w-8 text-danger" />
          <p className="mt-3 text-sm font-black text-foreground">تعذر تحميل بيانات التمرين</p>
          <button
            type="button"
            onClick={() => void exerciseQuery.refetch()}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
          >
            إعادة المحاولة
          </button>
        </div>
      </PlatformStack>
    );
  }

  const exercise = exerciseQuery.data;
  const stageGuide = getExerciseStageGuide(exercise.external_id);
  const coverThumb = getExerciseStageListThumb(exercise.external_id);

  return (
    <PlatformStack>
      <PlatformDetailHeader
        title={exercise.name_ar}
        subtitle={exercise.name_en}
        backTo="/app/exercises"
      />

      <section className="platform-card overflow-hidden p-4">
        <div className="flex items-start gap-3">
          <span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary-soft text-primary">
            {coverThumb ? (
              <OptimizedImage
                src={coverThumb}
                alt=""
                width={112}
                height={84}
                sizes="56px"
                objectFit="cover"
                className="h-14 w-14"
                fallback={<Dumbbell className="h-6 w-6" />}
              />
            ) : (
              <Dumbbell className="h-6 w-6" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-foreground">{exercise.name_ar}</h1>
            <p dir="ltr" className="mt-0.5 text-left text-sm font-semibold text-muted-foreground">
              {exercise.name_en}
            </p>
            <p className="mt-2 text-[10px] font-bold text-muted-foreground">
              الرمز: {exercise.external_id}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-muted p-3">
            <Target className="h-4 w-4 text-primary" />
            <p className="mt-1 text-[10px] text-muted-foreground">المجموعة العضلية</p>
            <p className="text-xs font-black text-foreground">{exercise.muscle_group.name_ar}</p>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <Gauge className="h-4 w-4 text-primary" />
            <p className="mt-1 text-[10px] text-muted-foreground">المستوى</p>
            <p className="text-xs font-black text-foreground">
              {formatExerciseDifficulty(exercise.difficulty)}
            </p>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <Dumbbell className="h-4 w-4 text-primary" />
            <p className="mt-1 text-[10px] text-muted-foreground">المعدات</p>
            <p className="text-xs font-black text-foreground">
              {exercise.equipment || "بدون معدات"}
            </p>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <Clock3 className="h-4 w-4 text-primary" />
            <p className="mt-1 text-[10px] text-muted-foreground">المدة المقترحة</p>
            <p className="text-xs font-black text-foreground">{exercise.duration_seconds} ثانية</p>
          </div>
        </div>
      </section>

      {stageGuide ? (
        <ExerciseStageGuide
          guide={stageGuide}
          muscles={{
            primary: exercise.muscle_group.name_ar,
            secondary: exercise.secondary_muscles,
          }}
        />
      ) : null}

      <PlatformSection title="فيديو التمرين" icon={PlaySquare}>
        <ExerciseMedia
          status={exercise.video_status}
          path={exercise.video_path}
          kind="exercise"
          title={exercise.name_ar}
          label="فيديو الأداء"
        />
      </PlatformSection>

      {exercise.coach_notes ? (
        <PlatformSection title="ملاحظات التمرين" icon={NotebookText} variant="card">
          <p className="text-sm leading-7 text-foreground">{exercise.coach_notes}</p>
        </PlatformSection>
      ) : null}
    </PlatformStack>
  );
}
