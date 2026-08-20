import { useQuery } from "@tanstack/react-query";
import { fetchMyTrainingRuntime } from "@/lib/platform/assigned-program-api";

export function useAssignedTrainingRuntime(enabled: boolean) {
  return useQuery({
    queryKey: ["client-training-runtime"],
    queryFn: fetchMyTrainingRuntime,
    enabled,
    staleTime: 60 * 1000,
    retry: 1,
  });
}
