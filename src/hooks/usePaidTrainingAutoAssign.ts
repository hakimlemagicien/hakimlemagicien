import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { runPaidTrainingAutoAssignment } from "@/lib/platform/paid-training-auto-assign";

export const PAID_TRAINING_AUTO_ASSIGN_KEY = ["paid-training-auto-assign"] as const;

export function usePaidTrainingAutoAssign(input: {
  enabled: boolean;
  userId: string;
  membershipTier: string;
  hasWorkoutProgram: boolean;
  runtimeReason?: string | null;
  runtimeLoading?: boolean;
}) {
  const queryClient = useQueryClient();
  const attemptedRef = useRef(false);

  const mutation = useMutation({
    mutationKey: PAID_TRAINING_AUTO_ASSIGN_KEY,
    mutationFn: () =>
      runPaidTrainingAutoAssignment({
        userId: input.userId,
        membershipTier: input.membershipTier,
        hasWorkoutProgram: input.hasWorkoutProgram,
        runtimeReason: input.runtimeReason,
      }),
    onSuccess: async (result) => {
      if (result.status === "assigned") {
        await queryClient.invalidateQueries({ queryKey: ["client-training-runtime"] });
      }
    },
  });

  useEffect(() => {
    if (!input.enabled || input.runtimeLoading) return;
    if (!input.hasWorkoutProgram) return;
    if (input.runtimeReason === "ok") return;
    if (attemptedRef.current || mutation.isPending || mutation.isSuccess) return;

    attemptedRef.current = true;
    mutation.mutate();
  }, [
    input.enabled,
    input.hasWorkoutProgram,
    input.runtimeLoading,
    input.runtimeReason,
    input.userId,
    mutation,
  ]);

  return {
    isRunning: mutation.isPending,
    result: mutation.data,
    error: mutation.error instanceof Error ? mutation.error.message : null,
    retry: () => {
      attemptedRef.current = false;
      mutation.reset();
      mutation.mutate();
    },
  };
}
