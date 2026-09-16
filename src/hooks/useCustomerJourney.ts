import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getOrStartCustomerJourney,
  savePreferredTrainingDays,
  saveTrainingMealWindow,
} from "@/lib/platform/customer-journey-api";
import type { PreferredTrainingDays, TrainingMealWindow } from "@/lib/platform/customer-journey";

export const CUSTOMER_JOURNEY_QUERY_KEY = ["customer-journey-v1"] as const;

export function useCustomerJourney() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: CUSTOMER_JOURNEY_QUERY_KEY,
    queryFn: getOrStartCustomerJourney,
    staleTime: 5_000,
    refetchInterval: (q) =>
      q.state.data?.phase === "preparing" || q.state.data?.phase === "needs_training_days"
        ? 15_000
        : false,
    retry: 1,
  });
  const saveTrainingDays = useMutation({
    mutationFn: savePreferredTrainingDays,
    onSuccess: (state) => client.setQueryData(CUSTOMER_JOURNEY_QUERY_KEY, state),
  });
  const saveMealWindow = useMutation({
    mutationFn: saveTrainingMealWindow,
    onSuccess: (state) => client.setQueryData(CUSTOMER_JOURNEY_QUERY_KEY, state),
  });
  return { ...query, saveTrainingDays, saveMealWindow };
}
