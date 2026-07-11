import { ExercisePlayerView } from "@/components/platform/workout/ExercisePlayerView";
import { PreviewGate } from "@/components/platform/shared/PreviewGate";
import { useWorkoutPlayer } from "@/hooks/useWorkoutPlayer";
import { useMembership } from "@/hooks/useMembership";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_platform/app/program/workout/exercise")({
  head: () => ({ meta: [{ title: "تمرين الحصة | Hakim Platform" }] }),
  component: ExercisePlayerPage,
});

function ExercisePlayerPage() {
  const { features } = useMembership();
  const previewOnly = !features.workout_program;
  const player = useWorkoutPlayer(0);

  return (
    <PreviewGate
      active={previewOnly}
      reason="هذه معاينة لتجربة التمرين. فعّل برنامجك الآن للاستفادة الكاملة."
    >
      <div data-preview-safe>
        <ExercisePlayerView player={player} />
      </div>
    </PreviewGate>
  );
}
