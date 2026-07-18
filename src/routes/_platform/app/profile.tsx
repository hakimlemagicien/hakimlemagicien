import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { useUpgradeFlow } from "@/components/platform/upgrade/UpgradeContext";
import {
  ProfileAboutSection,
  ProfileAccountSecuritySection,
  ProfileActivitySummarySection,
  ProfileAppSettingsSection,
  ProfileGoalsProgramSection,
  ProfileHeroSection,
  ProfileLogoutButton,
  ProfileMembershipSection,
  ProfileNotificationsSection,
  ProfilePersonalInfoSection,
  ProfilePrivacySection,
  ProfileSupportSection,
} from "@/components/platform/profile/ProfileSections";
import {
  ProfileAvatarSheet,
  ProfileConfirmDialog,
  ProfileDeleteAccountFlow,
  ProfileEditInfoSheet,
  ProfileSecurityFormSheet,
} from "@/components/platform/profile/ProfileSheets";
import {
  ProfileCardSkeleton,
  ProfileErrorCard,
  ProfileHeroSkeleton,
  ProfileMotionSection,
  ProfileOfflineBanner,
  ProfilePageHeader,
  ProfileToast,
} from "@/components/platform/profile/ProfileShared";
import { useProfileExperience } from "@/hooks/useProfileExperience";
import { useOnlineStatus } from "@/hooks/useNutritionPlan";
import {
  removeMyAvatar,
  signOutAllDevices,
  updateMyAvatar,
  updateMyEmail,
  updateMyPassword,
  updateMyPersonalInfo,
} from "@/lib/platform/profile-api";
import {
  updateProfileAppSettings,
  updateProfileNotificationPrefs,
} from "@/lib/platform/profile-settings-storage";
import { setMarketingPhotoConsent } from "@/lib/platform/progress-storage";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_platform/app/profile")({
  head: () => ({ meta: [{ title: "الملف الشخصي | Hakim Platform" }] }),
  component: ProfilePage,
});

type SheetState =
  | "avatar"
  | "edit-info"
  | "email"
  | "password"
  | "logout"
  | "sign-out-all"
  | "delete"
  | "sessions"
  | null;

function ProfilePage() {
  const online = useOnlineStatus();
  const { openUpgrade } = useUpgradeFlow();
  const {
    profile,
    training,
    membership,
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
    invalidateProfile,
  } = useProfileExperience();

  const [sheet, setSheet] = useState<SheetState>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2 | 3>(1);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(membershipUi.avatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, tone: "success" | "error") => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const displayAvatar = avatarUrl ?? membershipUi.avatarUrl;
  const displayName = profile?.fullName ?? membershipUi.displayName;
  const email = profile?.email ?? null;

  const handleAvatarPick = async (file: File) => {
    setUploadingAvatar(true);
    try {
      const { url } = await updateMyAvatar(file);
      setAvatarUrl(url);
      setSheet(null);
      showToast("تم تحديث صورة الملف الشخصي", "success");
      await membershipUi.refreshMembership();
      invalidateProfile();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "تعذر رفع الصورة", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    setUploadingAvatar(true);
    try {
      await removeMyAvatar();
      setAvatarUrl(null);
      setSheet(null);
      showToast("تم حذف الصورة", "success");
      await membershipUi.refreshMembership();
      invalidateProfile();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "تعذر حذف الصورة", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveInfo = async (input: Parameters<typeof updateMyPersonalInfo>[0]) => {
    setSavingInfo(true);
    try {
      await updateMyPersonalInfo(input);
      showToast("تم تحديث المعلومات", "success");
      invalidateProfile();
      await membershipUi.refreshMembership();
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  const handleSignOutAll = async () => {
    try {
      await signOutAllDevices();
      window.location.href = "/auth";
    } catch (err) {
      showToast(err instanceof Error ? err.message : "تعذر تسجيل الخروج", "error");
    }
  };

  const handleDeleteAccount = async () => {
    showToast("تم تسجيل طلب الحذف — سيتم التواصل معك لإكمال العملية.", "success");
    setSheet(null);
    setDeleteStep(1);
  };

  const canContactCoach =
    membership?.features.limited_coach_contact || membership?.features.personal_followup;

  if (loading.profile && !profile) {
    return (
      <PlatformStack className="space-y-4">
        <ProfilePageHeader />
        <ProfileHeroSkeleton />
        <ProfileCardSkeleton />
        <ProfileCardSkeleton />
      </PlatformStack>
    );
  }

  return (
    <PlatformStack className="space-y-4 pb-6">
      <ProfilePageHeader />
      {!online ? <ProfileOfflineBanner /> : null}
      {toast ? <ProfileToast message={toast.message} tone={toast.tone} /> : null}

      <ProfileMotionSection>
        <ProfileHeroSection
          profile={profile}
          displayName={displayName}
          email={email}
          avatarUrl={displayAvatar}
          tier={membershipUi.tier}
          memberSince={profile?.createdAt ?? null}
          onAvatarClick={() => setSheet("avatar")}
        />
      </ProfileMotionSection>

      <ProfileMotionSection delay={0.04}>
        {sectionErrors.membership ? (
          <ProfileErrorCard message={sectionErrors.membership} onRetry={() => void refresh()} />
        ) : (
          <ProfileMembershipSection
            membership={membership}
            status={membershipStatus}
            loadFailed={membershipLoadFailed}
            tier={membershipUi.tier}
            onManage={() => openUpgrade("إدارة العضوية — تواصل مع الدعم لتعديل اشتراكك.")}
          />
        )}
      </ProfileMotionSection>

      <ProfileMotionSection delay={0.08}>
        {sectionErrors.profile ? (
          <ProfileErrorCard message={sectionErrors.profile} onRetry={() => void refresh()} />
        ) : (
          <ProfilePersonalInfoSection fields={personalFields} onEdit={() => setSheet("edit-info")} />
        )}
      </ProfileMotionSection>

      <ProfileMotionSection delay={0.1}>
        <ProfileGoalsProgramSection summary={programSummary} />
      </ProfileMotionSection>

      <ProfileMotionSection delay={0.12}>
        {activityStats.length ? (
          <ProfileActivitySummarySection stats={activityStats} />
        ) : null}
      </ProfileMotionSection>

      <ProfileMotionSection delay={0.14}>
        <ProfileAccountSecuritySection
          onEditEmail={() => setSheet("email")}
          onChangePassword={() => setSheet("password")}
          onSessions={() => setSheet("sessions")}
          onSignOutAll={() => setSheet("sign-out-all")}
          onDeleteAccount={() => {
            setDeleteStep(1);
            setSheet("delete");
          }}
        />
      </ProfileMotionSection>

      <ProfileMotionSection delay={0.16}>
        <ProfileAppSettingsSection
          settings={settings.app}
          onChange={(patch) => updateProfileAppSettings(patch)}
        />
      </ProfileMotionSection>

      <ProfileMotionSection delay={0.18}>
        <ProfileNotificationsSection
          prefs={settings.notifications}
          onChange={(patch) => updateProfileNotificationPrefs(patch)}
        />
      </ProfileMotionSection>

      <ProfileMotionSection delay={0.2}>
        <ProfilePrivacySection
          photoConsentGranted={photoConsent.granted}
          photoConsentAt={photoConsent.at}
          onTogglePhotoConsent={(granted) => {
            if (profile?.id) setMarketingPhotoConsent(profile.id, granted);
          }}
          onDeleteAccount={() => {
            setDeleteStep(1);
            setSheet("delete");
          }}
        />
      </ProfileMotionSection>

      <ProfileMotionSection delay={0.22}>
        <ProfileSupportSection canContactCoach={Boolean(canContactCoach)} />
      </ProfileMotionSection>

      <ProfileMotionSection delay={0.24}>
        <ProfileAboutSection />
      </ProfileMotionSection>

      <ProfileMotionSection delay={0.26}>
        <ProfileLogoutButton onClick={() => setSheet("logout")} />
      </ProfileMotionSection>

      <ProfileAvatarSheet
        open={sheet === "avatar"}
        uploading={uploadingAvatar}
        onClose={() => setSheet(null)}
        onPick={(file) => void handleAvatarPick(file)}
        onRemove={() => void handleAvatarRemove()}
      />

      <ProfileEditInfoSheet
        open={sheet === "edit-info"}
        profile={profile}
        training={training}
        saving={savingInfo}
        onClose={() => setSheet(null)}
        onSave={handleSaveInfo}
      />

      <ProfileSecurityFormSheet
        open={sheet === "email"}
        mode="email"
        onClose={() => setSheet(null)}
        onSubmit={async (values) => {
          await updateMyEmail(values.email ?? "");
          showToast("تحقق من بريدك لإكمال التغيير", "success");
        }}
      />

      <ProfileSecurityFormSheet
        open={sheet === "password"}
        mode="password"
        onClose={() => setSheet(null)}
        onSubmit={async (values) => {
          if (values.next !== values.confirm) throw new Error("كلمتا المرور غير متطابقتين");
          await updateMyPassword(values.current ?? "", values.next ?? "");
          showToast("تم تغيير كلمة المرور", "success");
        }}
      />

      <ProfileConfirmDialog
        open={sheet === "logout"}
        title="تسجيل الخروج"
        description="هل تريد تسجيل الخروج من هذا الجهاز؟"
        confirmLabel="تسجيل الخروج"
        danger
        onClose={() => setSheet(null)}
        onConfirm={() => void handleSignOut()}
      />

      <ProfileConfirmDialog
        open={sheet === "sign-out-all"}
        title="تسجيل الخروج من جميع الأجهزة"
        description="ستحتاج إلى تسجيل الدخول مجدداً على جميع أجهزتك."
        confirmLabel="متابعة"
        danger
        onClose={() => setSheet(null)}
        onConfirm={() => void handleSignOutAll()}
      />

      <ProfileConfirmDialog
        open={sheet === "sessions"}
        title="الأجهزة والجلسات"
        description="الجهاز الحالي نشط. إدارة الجلسات الأخرى متاحة عبر «تسجيل الخروج من جميع الأجهزة»."
        confirmLabel="حسناً"
        onClose={() => setSheet(null)}
        onConfirm={() => setSheet(null)}
      />

      <ProfileDeleteAccountFlow
        open={sheet === "delete"}
        step={deleteStep}
        onClose={() => {
          setSheet(null);
          setDeleteStep(1);
        }}
        onAdvance={() => setDeleteStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s))}
        onConfirmDelete={() => void handleDeleteAccount()}
      />
    </PlatformStack>
  );
}
