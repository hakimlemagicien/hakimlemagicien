import type { ProgressionAssignmentState, ProgressionReview } from "./types";

export function keepExerciseReview(
  state: ProgressionAssignmentState,
  exerciseExternalId: string,
  at = new Date().toISOString(),
): ProgressionAssignmentState {
  const review = state.reviews.find((item) => item.exercise_external_id === exerciseExternalId && item.status === "open");
  const reviews: ProgressionReview[] = state.reviews.map((item) =>
    item.exercise_external_id === exerciseExternalId ? { ...item, status: "kept" } : item,
  );
  return {
    ...state,
    reviews,
    kept: {
      ...state.kept,
      [exerciseExternalId]: {
        at,
        reason_code: review?.reason_code ?? "KEEP",
      },
    },
    status: reviews.some((item) => item.status === "open") ? "REVIEW_REQUIRED" : state.last_decisions.length ? "ACTIVE" : "WAITING_FOR_DATA",
  };
}

export function mergeEvaluationReviews(
  state: ProgressionAssignmentState,
  incoming: ProgressionReview[],
): ProgressionAssignmentState {
  const byId = new Map(state.reviews.map((item) => [item.exercise_external_id, item]));
  for (const review of incoming) {
    const previous = byId.get(review.exercise_external_id);
    if (previous?.status === "kept" && state.kept[review.exercise_external_id]?.reason_code === review.reason_code) {
      continue;
    }
    byId.set(review.exercise_external_id, review);
  }
  const reviews = [...byId.values()];
  return {
    ...state,
    reviews,
    status: reviews.some((item) => item.status === "open")
      ? "REVIEW_REQUIRED"
      : state.status === "WAITING_FOR_DATA"
        ? "WAITING_FOR_DATA"
        : "ACTIVE",
  };
}
