import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PROFILE_DETAILS_KEY } from "@/hooks/useProfileExperience";
import { fetchMyProfileDetails } from "@/lib/platform/profile-api";
import {
  createLocalHoldPreview,
  isLocalProgramHoldPreview,
  resolveProgramPreparationHold,
  type ProgramPreparationHold,
} from "@/lib/platform/program-preparation-hold";

export function useProgramPreparationHold(input?: { coachAssigned?: boolean }) {
  const profileQuery = useQuery({
    queryKey: PROFILE_DETAILS_KEY,
    queryFn: fetchMyProfileDetails,
    staleTime: 30_000,
  });
  const [now, setNow] = useState(() => Date.now());
  const [previewStartedAt] = useState(() => Date.now());
  const localPreview = isLocalProgramHoldPreview();

  const hold = localPreview
    ? createLocalHoldPreview({ startedAt: previewStartedAt, now })
    : resolveProgramPreparationHold({
        createdAt: profileQuery.data?.createdAt ?? null,
        now,
        coachAssigned: input?.coachAssigned,
      });

  useEffect(() => {
    if (!hold.active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [hold.active]);

  return {
    hold,
    loading: profileQuery.isLoading,
    createdAt: profileQuery.data?.createdAt ?? null,
  };
}

export type { ProgramPreparationHold };
