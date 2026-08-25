import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import {
  ProfileAboutSection,
  ProfileAccountSecuritySection,
  ProfileAppSettingsSection,
  ProfileGoalsProgramSection,
  ProfileLogoutButton,
  ProfileNotificationsSection,
  ProfilePrivacySection,
} from "@/components/platform/profile/ProfileSections";
import { ProfileMemberCard } from "@/components/platform/profile/ProfileMemberCard";
import {
  ProfileAchievementsRow,
  ProfileBodySnapshot,
  ProfileClientMenu,
  ProfilePhotosPanel,
  ProfileSupportMenu,
  type ProfilePanelId,
} from "@/components/platform/profile/ProfileHub";
import { ProfileMembershipPass } from "@/components/platform/profile/ProfileMembershipPass";
import {
  ProfileAvatarSheet,
  ProfileBottomSheet,
  ProfileConfirmDialog,
  ProfileDeleteAccountFlow,
  ProfileEditInfoSheet,
  ProfilePersonalInfoForm,
  ProfileSecurityFormSheet,
} from "@/components/platform/profile/ProfileSheets";
import {
  ProfileCardSkeleton,
  ProfileErrorCard,
  ProfileHeroSkeleton,
  ProfileOfflineBanner,
  ProfilePageHeader,
  ProfileSectionCard,
  ProfileToast,
} from "@/components/platform/profile/ProfileShared";
import { useProfileExperience } from "@/hooks/useProfileExperience";
import { useOnlineStatus } from "@/hooks/useNutritionPlan";
import {
  removeMyAvatar,
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
import { requestAccountDeletion, recordMediaMarketingConsent } from "@/lib/legal/legal-api";
import { canUseCoachChat } from "@/lib/platform/coaching-messaging";
import { signOutAndResetClient } from "@/lib/quiz-onboarding-api";

export const Route = createFileRoute("/_platform/app/profile")({
  head: () => ({ meta: [{ title: "الملف الشخصي | MAAKFIT" }] }),
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
  const {
    profile,
    training,
    membership,
    membershipStatus,
    membershipLoadFailed,
    membershipUi,
    programSummary,
    hubStats,
    hubAchievements,
    dashboard,
    settings,
    photoConsent,
    sectionErrors,
    loading,
    refresh,
    invalidateProfile,
  } = useProfileExperience();

  const [sheet, setSheet] = useState<SheetState>(null);
  const [panel, setPanel] = useState<ProfilePanelId | null>(null);
  const [membershipPass, setMembershipPass] = useState(false);
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
    await signOutAndResetClient();
    window.location.href = "/auth";
  };

  const handleSignOutAll = async () => {
    try {
      await signOutAndResetClient("global");
      window.location.href = "/auth";
    } catch (err) {
      showToast(err instanceof Error ? err.message : "تعذر تسجيل الخروج", "error");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await requestAccountDeletion("profile_settings");
      showToast("تم تسجيل طلب الحذف. حذف الحساب ≠ إلغاء التجديد ≠ طلب استرداد. سنتواصل معك لإكمال العملية وفق سياسة الاحتفاظ.", "success");
    } catch {
      showToast("تعذر إرسال طلب الحذف. راسل الدعم من صفحة التواصل.", "error");
    }
    setSheet(null);
    setDeleteStep(1);
  };

  const canContactCoach = canUseCoachChat(membership?.features ?? { limited_coach_contact: false, personal_followup: false }, membership?.tier);

  if (loading.profile && !profile) {
    return (
      <PlatformStack className="space-y-4 pb-6">
        <ProfilePageHeader />
        <ProfileHeroSkeleton />
        <ProfileCardSkeleton />
        <ProfileCardSkeleton />
      </PlatformStack>
    );
  }

  return (
    <PlatformStack className="profile-hub space-y-4 pb-6">
      <ProfilePageHeader />
      {!online ? <ProfileOfflineBanner /> : null}
      {toast ? <ProfileToast message={toast.message} tone={toast.tone} /> : null}

      <ProfileMemberCard
        displayName={displayName}
        avatarUrl={displayAvatar}
        tier={membershipUi.tier}
        memberSince={profile?.createdAt ?? null}
        goal={programSummary.currentGoal}
        stats={hubStats}
        onAvatarClick={() => setSheet("avatar")}
        onEdit={() => {
          setPanel(null);
          setSheet("edit-info");
        }}
      />
      <ProfileAchievementsRow items={hubAchievements} />
      <ProfileClientMenu
        onHealth={() => setPanel("health")}
        onMembership={() => setMembershipPass(true)}
        onPhotos={() => setPanel("photos")}
        onDevices={() => setSheet("sessions")}
      />
      <ProfileSupportMenu
        canContactCoach={Boolean(canContactCoach)}
        onSettings={() => setPanel("settings")}
      />

      <ProfileBottomSheet
        open={panel === "health"}
        title="بياناتي الصحية"
        panel
        onClose={() => setPanel(null)}
      >
        {sectionErrors.profile ? (
          <ProfileErrorCard message={sectionErrors.profile} onRetry={() => void refresh()} />
        ) : (
          <>
            <ProfileSectionCard title="المعلومات الشخصية">
              <ProfilePersonalInfoForm
                active={panel === "health"}
                profile={profile}
                training={training}
                currentGoal={programSummary.currentGoal}
                saving={savingInfo}
                onSave={handleSaveInfo}
              />
            </ProfileSectionCard>
            {dashboard ? <ProfileBodySnapshot items={dashboard.bodyItems} /> : null}
            <ProfileGoalsProgramSection summary={programSummary} />
          </>
        )}
      </ProfileBottomSheet>

      <ProfileMembershipPass
        open={membershipPass}
        displayName={displayName}
        avatarUrl={displayAvatar}
        memberId={profile?.id ?? null}
        membership={membershipUi}
        loadFailed={membershipLoadFailed}
        tier={membershipUi.tier}
        onClose={() => setMembershipPass(false)}
        onRetry={() => void refresh()}
        onManage={() => setMembershipPass(false)}
      />

      <ProfileBottomSheet
        open={panel === "photos"}
        title="صور التقدم"
        panel
        onClose={() => setPanel(null)}
      >
        <ProfilePhotosPanel sessions={dashboard?.photoSessions ?? []} />
      </ProfileBottomSheet>

      <ProfileBottomSheet
        open={panel === "settings"}
        title="الإعدادات والخصوصية"
        panel
        onClose={() => setPanel(null)}
      >
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
        <ProfileAppSettingsSection
          settings={settings.app}
          onChange={(patch) => updateProfileAppSettings(patch)}
        />
        <ProfileNotificationsSection
          prefs={settings.notifications}
          onChange={(patch) => updateProfileNotificationPrefs(patch)}
        />
        <ProfilePrivacySection
          photoConsentGranted={photoConsent.granted}
          photoConsentAt={photoConsent.at}
          onTogglePhotoConsent={(granted) => {
            if (profile?.id) setMarketingPhotoConsent(profile.id, granted);
            void recordMediaMarketingConsent(granted);
          }}
          onDeleteAccount={() => {
            setDeleteStep(1);
            setSheet("delete");
          }}
        />
        <ProfileAboutSection />
        <ProfileLogoutButton onClick={() => setSheet("logout")} />
      </ProfileBottomSheet>

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
        currentGoal={programSummary.currentGoal}
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
