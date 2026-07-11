import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ChevronLeft,
  Dumbbell,
  LoaderCircle,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  PlatformPageHeader,
  PlatformSection,
  PlatformStack,
} from "@/components/platform/layout/PlatformLayout";
import {
  fetchExerciseLibrary,
  formatExerciseDifficulty,
  type ExerciseLibraryItem,
} from "@/lib/platform/exercise-library";
import { guardExerciseLibraryRoute } from "@/lib/platform/exercise-library-route-guard";

export const Route = createFileRoute("/_platform/app/exercises/")({
  head: () => ({ meta: [{ title: "مكتبة التمارين | Hakim Platform" }] }),
  beforeLoad: guardExerciseLibraryRoute,
  component: ExerciseLibraryPage,
});

type ExerciseGroup = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  sortOrder: number;
  exercises: ExerciseLibraryItem[];
};

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase("ar");
}

function groupExercises(exercises: ExerciseLibraryItem[]): ExerciseGroup[] {
  const groups = new Map<string, ExerciseGroup>();

  for (const exercise of exercises) {
    const muscle = exercise.muscle_group;
    const existing = groups.get(muscle.id);
    if (existing) {
      existing.exercises.push(exercise);
      continue;
    }

    groups.set(muscle.id, {
      id: muscle.id,
      code: muscle.code,
      nameAr: muscle.name_ar,
      nameEn: muscle.name_en,
      sortOrder: muscle.sort_order,
      exercises: [exercise],
    });
  }

  return [...groups.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

function ExerciseCard({ exercise }: { exercise: ExerciseLibraryItem }) {
  return (
    <Link
      to="/app/exercises/$exerciseId"
      params={{ exerciseId: exercise.id }}
      className="platform-card flex items-center gap-3 p-3 transition hover:border-primary/30 active:scale-[0.99]"
    >
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
        <Dumbbell className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-black text-foreground">{exercise.name_ar}</h3>
        <p dir="ltr" className="mt-0.5 truncate text-left text-xs font-medium text-muted-foreground">
          {exercise.name_en}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
            {formatExerciseDifficulty(exercise.difficulty)}
          </span>
          {exercise.equipment ? (
            <span className="rounded-full bg-secondary-soft px-2 py-0.5 text-[10px] font-bold text-success">
              {exercise.equipment}
            </span>
          ) : null}
        </div>
      </div>
      <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function ExerciseLibraryPage() {
  const [search, setSearch] = useState("");
  const exercisesQuery = useQuery({
    queryKey: ["exercise-library"],
    queryFn: fetchExerciseLibrary,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const groups = useMemo(() => {
    const term = normalizeSearch(search);
    const exercises = exercisesQuery.data ?? [];
    const filtered = term
      ? exercises.filter((exercise) =>
          normalizeSearch(`${exercise.name_ar} ${exercise.name_en} ${exercise.external_id}`)
            .includes(term),
        )
      : exercises;

    return groupExercises(filtered);
  }, [exercisesQuery.data, search]);

  const resultCount = groups.reduce((total, group) => total + group.exercises.length, 0);

  return (
    <PlatformStack>
      <PlatformPageHeader
        title="مكتبة التمارين"
        subtitle="ابحث عن التمرين واستعرض طريقة الأداء الصحيحة."
      />

      <label className="platform-card flex h-12 items-center gap-2 px-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="ابحث بالعربية أو الإنجليزية"
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
        />
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
      </label>

      {exercisesQuery.isLoading ? (
        <div className="platform-card flex min-h-52 flex-col items-center justify-center p-6 text-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm font-bold text-muted-foreground">جاري تحميل التمارين…</p>
        </div>
      ) : null}

      {exercisesQuery.isError ? (
        <div className="platform-card flex min-h-52 flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="h-8 w-8 text-danger" />
          <p className="mt-3 text-sm font-black text-foreground">تعذر تحميل مكتبة التمارين</p>
          <button
            type="button"
            onClick={() => void exercisesQuery.refetch()}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : null}

      {exercisesQuery.isSuccess && groups.length === 0 ? (
        <div className="platform-card flex min-h-44 flex-col items-center justify-center p-6 text-center">
          <Search className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-black text-foreground">لا توجد نتائج مطابقة</p>
          <p className="mt-1 text-xs text-muted-foreground">جرّب اسماً آخر بالعربية أو الإنجليزية.</p>
        </div>
      ) : null}

      {exercisesQuery.isSuccess && groups.length > 0 ? (
        <>
          <p className="px-1 text-xs font-bold text-muted-foreground">
            {search ? `${resultCount} نتيجة` : `${resultCount} تمرين`}
          </p>
          {groups.map((group) => (
            <PlatformSection
              key={group.id}
              title={group.nameAr}
              icon={Dumbbell}
              action={
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                  {group.exercises.length}
                </span>
              }
            >
              <p dir="ltr" className="-mt-1 text-right text-[10px] font-semibold text-muted-foreground">
                {group.nameEn}
              </p>
              <div className="space-y-2">
                {group.exercises.map((exercise) => (
                  <ExerciseCard key={exercise.id} exercise={exercise} />
                ))}
              </div>
            </PlatformSection>
          ))}
        </>
      ) : null}
    </PlatformStack>
  );
}
