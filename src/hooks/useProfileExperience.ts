import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePlatformActivity } from "@/hooks/usePlatformActivity";
import { useMembership } from "@/hooks/useMembership";
import {
  buildPersonalInfoFields,
  buildProfileActivityStats,
  buildProgramSummary,
  resolveMembershipDisplayStatus,
} from "@/lib/platform/profile-experience";
import {
  getMyMembership,
  MEMBERSHIP_QUERY_KEY,
  type MembershipResponse,
} from "@/lib/platform/membership";
import {
  fetchMyProfileDetails,
  fetchMyTrainingProfile,
  type ProfileDetails,
  type TrainingProfileSnapshot,
} from "@/lib/platform/profile-api";
import {
  getProfileSettings,
  subscribeProfileSettings,
  type ProfileSettingsSnapshot,
} from "@/lib/platform/profile-settings-storage";
import { getBodyMeasurements, getMarketingPhotoConsent } from "@/lib/platform/progress-storage";

export const PROFILE_DETAILS_KEY = ["profile", "details"] as const;
export const PROFILE_TRAINING_KEY = ["profile", "training"] as const;
export const PROFILE_MEMBERSHIP_RAW_KEY = ["profile", "membership-raw"] as const;

export function useProfileExperience() {
  const membershipUi = useMembership();
  const { userId, snapshot } = usePlatformActivity();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<ProfileSettingsSnapshot>(getProfileSettings);

  const profileQuery = useQuery({
    queryKey: PROFILE_DETAILS_KEY,
    queryFn: fetchMyProfileDetails,
    staleTime: 30_000,
  });

  const trainingQuery = useQuery({
    queryKey: PROFILE_TRAINING_KEY,
    queryFn: fetchMyTrainingProfile,
    staleTime: 30_000,
  });

  const membershipQuery = useQuery({
    queryKey: PROFILE_MEMBERSHIP_RAW_KEY,
    queryFn: getMyMembership,
    staleTime: 15_000,
    retry: 1,
  });

  useEffect(() => subscribeProfileSettings(() => setSettings(getProfileSettings())), []);

  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: PROFILE_DETAILS_KEY }),
      queryClient.invalidateQueries({ queryKey: PROFILE_TRAINING_KEY }),
      queryClient.invalidateQueries({ queryKey: PROFILE_MEMBERSHIP_RAW_KEY }),
      queryClient.invalidateQueries({ queryKey: MEMBERSHIP_QUERY_KEY }),
      membershipUi.refreshMembership(),
    ]);
  }, [queryClient, membershipUi]);

  const profile = profileQuery.data ?? null;
  const training = trainingQuery.data ?? null;
  const membershipRaw = membershipQuery.data ?? null;
  const membershipLoadFailed = membershipQuery.isError;

  const bodyWeight = useMemo(() => {
    if (!userId) return null;
    const body = getBodyMeasurements(userId);
    return body.weight ?? null;
  }, [userId, snapshot]);

  const personalFields = useMemo(
    () => buildPersonalInfoFields(profile, training, bodyWeight),
    [profile, training, bodyWeight],
  );

  const programSummary = useMemo(
    () => buildProgramSummary(profile, training),
    [profile, training],
  );

  const activityStats = useMemo(
    () => (userId ? buildProfileActivityStats(userId, snapshot) : []),
    [userId, snapshot],
  );

  const membershipStatus = resolveMembershipDisplayStatus(membershipRaw, membershipLoadFailed);

  const photoConsent = useMemo(() => {
    if (!userId) return { granted: false, at: null as string | null };
    return getMarketingPhotoConsent(userId);
  }, [userId, snapshot]);

  const sectionErrors = {
    profile: profileQuery.error instanceof Error ? profileQuery.error.message : null,
    training: trainingQuery.error instanceof Error ? trainingQuery.error.message : null,
    membership: membershipLoadFailed ? "تعذر التحقق من حالة العضوية" : null,
  };

  const loading = {
    profile: profileQuery.isLoading && !profileQuery.isFetched,
    training: trainingQuery.isLoading && !trainingQuery.isFetched,
    membership: membershipQuery.isLoading && !membershipQuery.isFetched,
  };

  return {
    profile,
    training,
    membership: membershipRaw as MembershipResponse | null,
    membershipStatus,
    membershipLoadFailed,
    membershipUi,
    personalFields,
    programSummary,
    activityStats,
    settings,
    photoConsent,
    sectionErrors,
    loading,
    refresh,
    invalidateProfile: () => {
      void queryClient.invalidateQueries({ queryKey: PROFILE_DETAILS_KEY });
      void queryClient.invalidateQueries({ queryKey: PROFILE_TRAINING_KEY });
    },
  };
}
