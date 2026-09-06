import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PROFILE_DETAILS_KEY } from "@/hooks/useProfileExperience";
import { fetchMyProfileDetails } from "@/lib/platform/profile-api";
import {
  resolveProgramPreparationHold,
  type ProgramPreparationHold,
} from "@/lib/platform/program-preparation-hold";

/**
 * Hold room for brand-new accounts only (createdAt within 2h, no coach assign).
 * Existing accounts — including founder/admin — never enter the hold room.
 */
export function useProgramPreparationHold(input?: { coachAssigned?: boolean }) {
  const profileQuery = useQuery({
    queryKey: PROFILE_DETAILS_KEY,
    queryFn: fetchMyProfileDetails,
    staleTime: 30_000,
  });
  const [now, setNow] = useState(() => Date.now());

  const hold = resolveProgramPreparationHold({
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
