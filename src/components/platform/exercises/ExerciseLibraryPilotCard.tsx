import { Link } from "@tanstack/react-router";
import { ChevronLeft, Images } from "lucide-react";
import { canAccessExerciseLibrary } from "@/lib/platform/exercise-library-access";

export function ExerciseLibraryPilotCard() {
  if (!canAccessExerciseLibrary()) return null;

  return (
    <Link
      to="/app/program/workout/exercise"
      search={{ exerciseId: "CH-001", index: 0 }}
      className="platform-card flex items-center gap-3 p-3 transition hover:border-primary/30 active:scale-[0.99]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
        <Images className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-foreground">تجربة شاشة الحصة</p>
        <p className="mt-0.5 text-[11px] font-bold text-muted-foreground">
          بنش برس كما يراها العميل أثناء التمرين
        </p>
      </div>
      <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}
