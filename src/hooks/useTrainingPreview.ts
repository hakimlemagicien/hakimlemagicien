import { useQuery } from "@tanstack/react-query";
import { fetchMyTrainingPreview } from "@/lib/platform/assigned-program-api";

export function useTrainingPreview(enabled: boolean) {
  return useQuery({
    queryKey: ["client-training-preview"],
    queryFn: fetchMyTrainingPreview,
    enabled,
    staleTime: 30_000,
  });
}
