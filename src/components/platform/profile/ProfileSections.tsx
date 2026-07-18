import { Link } from "@tanstack/react-router";
import {
  Award,
  Bell,
  Camera,
  Crown,
  Dumbbell,
  ExternalLink,
  FileText,
  HelpCircle,
  Lightbulb,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  Shield,
  Smartphone,
  Trash2,
  User,
  UtensilsCrossed,
} from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Switch } from "@/components/ui/switch";
import { UpgradeCta } from "@/components/platform/shared/PlaceholderState";
import {
  getMembershipTierLabel,
  isPaidMembershipTier,
  type MembershipResponse,
  type MembershipTier,
} from "@/lib/platform/membership";
import {
  formatMemberCode,
  formatProfileDate,
  getAppBuildVersion,
  getMembershipStatusLabel,
  MEMBERSHIP_FEATURE_LABELS,
  type MembershipDisplayStatus,
  type ProfileActivityStat,
  type ProfilePersonalField,
  type ProfileProgramSummary,
} from "@/lib/platform/profile-experience";
import type { ProfileDetails } from "@/lib/platform/profile-api";
import type {
  ProfileAppSettings,
  ProfileNotificationPrefs,
} from "@/lib/platform/profile-settings-storage";
import { LEGAL_ROUTES, SITE_SUPPORT_EMAIL, SITE_WHATSAPP_URL } from "@/lib/site-legal";
import { WHATSAPP_COACH_URL } from "@/lib/platform/seed-content";
import {
  ProfileField,
  ProfileFieldGrid,
  ProfileRowButton,
  ProfileSectionCard,
  profileCardClass,
} from "./ProfileShared";
import { cn } from "@/lib/utils";

function MembershipRing({ daysRemaining, totalDays = 365 }: { daysRemaining: number; totalDays?: number }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const pct = totalDays > 0 ? Math.min(daysRemaining / totalDays, 1) : 0;
  const offset = circumference * (1 - pct);

  return (
    <div className="relative grid h-[72px] w-[72px] place-items-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 72 72" aria-hidden>
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#F3F4F6" strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="#F97316"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="text-center">
        <p className="text-sm font-black leading-none text-primary">{daysRemaining || "—"}</p>
        <p className="mt-0.5 text-[8px] font-bold text-muted-foreground">يوم</p>
      </div>
    </div>
  );
}

export function ProfileHeroSection({
  profile,
  displayName,
  email,
  avatarUrl,
  tier,
  memberSince,
  onAvatarClick,
}: {
  profile: ProfileDetails | null;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  tier: MembershipTier;
  memberSince: string | null;
  onAvatarClick: () => void;
}) {
  const frameTier = tier === "visitor" ? "free" : tier;
  const paid = isPaidMembershipTier(frameTier);

  return (
    <section className={cn(profileCardClass, "relative overflow-hidden p-5 text-white")} style={{
      background:
        "radial-gradient(120% 90% at 100% 0%, rgba(249,115,22,0.18) 0%, transparent 55%), linear-gradient(165deg, #1a1a1a 0%, #111 48%, #1c1410 100%)",
    }}>
      <div className="flex flex-col items-center gap-3 text-center">
        <button
          type="button"
          onClick={onAvatarClick}
          aria-label="تغيير صورة الملف الشخصي"
          className="platform-touch relative grid h-24 w-24 place-items-center rounded-full border-2 border-white/90 bg-[#2a2a2a] transition-transform active:scale-95"
        >
          {avatarUrl ? (
            <OptimizedImage src={avatarUrl} alt="" width={96} height={96} className="h-full w-full rounded-full" priority />
          ) : (
            <User className="h-8 w-8 text-white/60" />
          )}
          <span className="absolute -bottom-1 -left-1 grid h-8 w-8 place-items-center rounded-full bg-primary text-white shadow-md">
            <Camera className="h-4 w-4" />
          </span>
        </button>

        <div>
          <h2 className="text-lg font-black">{displayName}</h2>
          {email ? <p className="mt-1 text-xs font-medium text-white/75">{email}</p> : null}
          <p className="mt-1 text-[10px] font-bold text-white/55">
            {memberSince ? `عضو منذ ${formatProfileDate(memberSince)}` : "عضو في المنصة"}
          </p>
          {profile ? (
            <p className="mt-1 text-[10px] font-bold text-white/45">{formatMemberCode(profile.id)}</p>
          ) : null}
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black",
            paid ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-white/85",
          )}
        >
          {paid ? <Crown className="h-3.5 w-3.5" /> : null}
          {getMembershipTierLabel(frameTier)}
        </span>

        <p className="max-w-[280px] text-xs font-medium leading-relaxed text-white/70">
          مرحباً بعودتك، استمر في رحلتك نحو أفضل نسخة من نفسك.
        </p>
      </div>
    </section>
  );
}

export function ProfileMembershipSection({
  membership,
  status,
  loadFailed,
  tier,
  onManage,
}: {
  membership: MembershipResponse | null;
  status: MembershipDisplayStatus;
  loadFailed: boolean;
  tier: MembershipTier;
  onManage?: () => void;
}) {
  if (loadFailed) {
    return (
      <ProfileSectionCard title="نوع العضوية" eyebrow="العضوية">
        <p className="text-sm font-black text-foreground">تعذر التحقق من حالة العضوية</p>
        <p className="mt-1 text-xs text-muted-foreground">تحقق من الاتصال وحاول مجدداً.</p>
      </ProfileSectionCard>
    );
  }

  const paid = membership?.is_paid ?? false;
  const features = membership?.features;
  const enabledFeatures = MEMBERSHIP_FEATURE_LABELS.filter((f) => features?.[f.key]);

  return (
    <ProfileSectionCard
      title={getMembershipTierLabel(tier === "visitor" ? "free" : tier)}
      eyebrow="نوع العضوية"
      className={paid ? "border-primary/20" : undefined}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-black",
            status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground",
          )}
        >
          {getMembershipStatusLabel(status)}
        </span>
        {paid && membership?.days_remaining ? (
          <MembershipRing daysRemaining={membership.days_remaining} />
        ) : null}
      </div>

      {paid ? (
        <div className="mb-3 grid grid-cols-2 gap-2 text-[11px] font-bold text-muted-foreground">
          <div className="rounded-2xl bg-muted/40 px-3 py-2">
            <span className="block text-[10px]">تاريخ التفعيل</span>
            <strong className="text-foreground">{formatProfileDate(membership?.starts_at)}</strong>
          </div>
          <div className="rounded-2xl bg-muted/40 px-3 py-2">
            <span className="block text-[10px]">تاريخ الانتهاء</span>
            <strong className="text-foreground">{formatProfileDate(membership?.ends_at)}</strong>
          </div>
        </div>
      ) : (
        <p className="mb-3 text-xs font-medium text-muted-foreground">
          أنت على الخطة المجانية — فعّل برنامجك للوصول الكامل.
        </p>
      )}

      {enabledFeatures.length ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {enabledFeatures.map((f) => (
            <span
              key={f.key}
              className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-black text-primary"
            >
              {f.label}
            </span>
          ))}
        </div>
      ) : null}

      {paid ? (
        <div className="space-y-2">
          <p className="text-xs font-bold text-emerald-700">عضويتك مفعلة</p>
          {onManage ? (
            <button
              type="button"
              onClick={onManage}
              className="text-xs font-black text-primary"
            >
              إدارة العضوية
            </button>
          ) : null}
        </div>
      ) : (
        <UpgradeCta className="w-full" reason="اكتشف الباقات وفعّل برنامجك الكامل." />
      )}
    </ProfileSectionCard>
  );
}

export function ProfilePersonalInfoSection({
  fields,
  onEdit,
}: {
  fields: ProfilePersonalField[];
  onEdit: () => void;
}) {
  return (
    <ProfileSectionCard
      title="المعلومات الشخصية"
      action={
        <button type="button" onClick={onEdit} className="text-xs font-black text-primary">
          تعديل المعلومات
        </button>
      }
    >
      <ProfileFieldGrid>
        {fields.map((field) => (
          <ProfileField key={field.id} label={field.label} value={field.value} missing={field.missing} />
        ))}
      </ProfileFieldGrid>
    </ProfileSectionCard>
  );
}

export function ProfileGoalsProgramSection({ summary }: { summary: ProfileProgramSummary }) {
  return (
    <ProfileSectionCard
      title="الأهداف والبرنامج"
      action={
        <Link to="/app/support" className="text-xs font-black text-primary">
          طلب مراجعة
        </Link>
      }
    >
      <ProfileFieldGrid>
        <ProfileField label="الهدف الحالي" value={summary.currentGoal} />
        <ProfileField label="البرنامج" value={summary.programName} />
        <ProfileField label="مستوى اللياقة" value={summary.fitnessLevel} />
        <ProfileField label="أيام التدريب" value={summary.weeklyDays} />
        <ProfileField label="هدف السعرات" value={summary.calorieTarget} />
        <ProfileField label="بداية البرنامج" value={summary.programStart} />
      </ProfileFieldGrid>
      <p className="mt-3 text-[10px] font-medium text-muted-foreground">
        البيانات من ملف التدريب النشط — لا يمكن تعديل الخطة المعتمدة مباشرة.
      </p>
    </ProfileSectionCard>
  );
}

export function ProfileActivitySummarySection({ stats }: { stats: ProfileActivityStat[] }) {
  return (
    <ProfileSectionCard title="ملخص النشاط" eyebrow="نشاطك">
      <div className="grid grid-cols-2 gap-2.5">
        {stats.slice(0, 5).map((stat) => {
          const content = (
            <>
              <span className="text-lg" aria-hidden>
                {stat.icon}
              </span>
              <span className="mt-1 block text-base font-black text-foreground">{stat.value}</span>
              <span className="text-[10px] font-bold text-muted-foreground">{stat.label}</span>
            </>
          );
          if (stat.href) {
            return (
              <Link
                key={stat.id}
                to={stat.href}
                className="platform-touch rounded-2xl bg-muted/35 p-3 text-center transition-transform active:scale-[0.985]"
              >
                {content}
              </Link>
            );
          }
          return (
            <div key={stat.id} className="rounded-2xl bg-muted/35 p-3 text-center">
              {content}
            </div>
          );
        })}
      </div>
    </ProfileSectionCard>
  );
}

export function ProfileAccountSecuritySection({
  onEditEmail,
  onChangePassword,
  onSessions,
  onSignOutAll,
  onDeleteAccount,
}: {
  onEditEmail: () => void;
  onChangePassword: () => void;
  onSessions: () => void;
  onSignOutAll: () => void;
  onDeleteAccount: () => void;
}) {
  return (
    <ProfileSectionCard title="الحساب والأمان">
      <div className="divide-y divide-border/50">
        <ProfileRowButton icon={<Mail className="h-4 w-4" />} title="تعديل البريد الإلكتروني" onClick={onEditEmail} />
        <ProfileRowButton icon={<Lock className="h-4 w-4" />} title="تغيير كلمة المرور" onClick={onChangePassword} />
        <ProfileRowButton icon={<Smartphone className="h-4 w-4" />} title="الأجهزة والجلسات" onClick={onSessions} />
        <ProfileRowButton
          icon={<LogOut className="h-4 w-4" />}
          title="تسجيل الخروج من جميع الأجهزة"
          description="ستحتاج لتسجيل الدخول مجدداً"
          onClick={onSignOutAll}
        />
        <ProfileRowButton
          icon={<Trash2 className="h-4 w-4" />}
          title="حذف الحساب"
          description="إجراء نهائي — يتطلب تأكيداً"
          onClick={onDeleteAccount}
          danger
        />
      </div>
    </ProfileSectionCard>
  );
}

function SettingSwitch({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-black text-foreground">{label}</p>
        {description ? (
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}

export function ProfileAppSettingsSection({
  settings,
  onChange,
}: {
  settings: ProfileAppSettings;
  onChange: (patch: Partial<ProfileAppSettings>) => void;
}) {
  return (
    <ProfileSectionCard title="إعدادات التطبيق">
      <div className="divide-y divide-border/50">
        <SettingSwitch
          label="أصوات التطبيق"
          description="إنجازات، نقاط، ماء، إكمال الأنشطة"
          checked={settings.appSounds}
          onCheckedChange={(v) => onChange({ appSounds: v })}
        />
        <SettingSwitch
          label="الاهتزاز"
          checked={settings.haptics}
          onCheckedChange={(v) => onChange({ haptics: v })}
        />
        <SettingSwitch
          label="تحميل الفيديو عبر Wi-Fi فقط"
          checked={settings.wifiOnlyVideo}
          onCheckedChange={(v) => onChange({ wifiOnlyVideo: v })}
        />
      </div>
      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-black text-foreground">جودة الفيديو</span>
        <select
          value={settings.videoQuality}
          onChange={(e) =>
            onChange({ videoQuality: e.target.value as ProfileAppSettings["videoQuality"] })
          }
          className="h-11 w-full rounded-2xl border border-border/70 bg-muted/30 px-3 text-sm font-bold"
        >
          <option value="auto">تلقائية</option>
          <option value="data-saver">توفير البيانات</option>
          <option value="high">جودة عالية</option>
        </select>
      </label>
    </ProfileSectionCard>
  );
}

export function ProfileNotificationsSection({
  prefs,
  onChange,
}: {
  prefs: ProfileNotificationPrefs;
  onChange: (patch: Partial<ProfileNotificationPrefs>) => void;
}) {
  return (
    <ProfileSectionCard title="الإشعارات">
      <div className="divide-y divide-border/50">
        <SettingSwitch
          label="تذكيرات التمارين"
          checked={prefs.workoutReminders}
          onCheckedChange={(v) => onChange({ workoutReminders: v })}
        />
        <SettingSwitch
          label="تذكيرات الوجبات"
          checked={prefs.mealReminders}
          onCheckedChange={(v) => onChange({ mealReminders: v })}
        />
        <SettingSwitch
          label="تذكيرات الماء"
          checked={prefs.waterReminders}
          onCheckedChange={(v) => onChange({ waterReminders: v })}
        />
        <SettingSwitch
          label="إشعارات التقدم"
          checked={prefs.progressUpdates}
          onCheckedChange={(v) => onChange({ progressUpdates: v })}
        />
        <SettingSwitch
          label="التحديات"
          checked={prefs.challenges}
          onCheckedChange={(v) => onChange({ challenges: v })}
        />
        <SettingSwitch
          label="المحتوى الجديد"
          checked={prefs.newContent}
          onCheckedChange={(v) => onChange({ newContent: v })}
        />
        <SettingSwitch
          label="العروض والرسائل التسويقية"
          description="اختياري — غير مفعّل افتراضياً"
          checked={prefs.marketing}
          onCheckedChange={(v) => onChange({ marketing: v })}
        />
      </div>
    </ProfileSectionCard>
  );
}

export function ProfilePrivacySection({
  photoConsentGranted,
  photoConsentAt,
  onTogglePhotoConsent,
  onDeleteAccount,
}: {
  photoConsentGranted: boolean;
  photoConsentAt: string | null;
  onTogglePhotoConsent: (granted: boolean) => void;
  onDeleteAccount: () => void;
}) {
  return (
    <ProfileSectionCard title="الخصوصية والبيانات">
      <div className="space-y-3">
        <div className="rounded-2xl bg-muted/35 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black">موافقة صور التقدم</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {photoConsentGranted
                  ? `موافقة نشطة${photoConsentAt ? ` — ${formatProfileDate(photoConsentAt)}` : ""}`
                  : "لا توجد موافقة حالية"}
              </p>
            </div>
            <Switch
              checked={photoConsentGranted}
              onCheckedChange={onTogglePhotoConsent}
              aria-label="موافقة صور التقدم"
            />
          </div>
        </div>
        <ProfileRowButton
          icon={<FileText className="h-4 w-4" />}
          title="سياسة الخصوصية"
          href={LEGAL_ROUTES.privacy}
        />
        <ProfileRowButton
          icon={<Shield className="h-4 w-4" />}
          title="حذف الحساب"
          onClick={onDeleteAccount}
          danger
        />
      </div>
    </ProfileSectionCard>
  );
}

export function ProfileSupportSection({ canContactCoach }: { canContactCoach: boolean }) {
  return (
    <ProfileSectionCard title="مركز الدعم">
      <div className="divide-y divide-border/50">
        {canContactCoach ? (
          <ProfileRowButton
            icon={<MessageCircle className="h-4 w-4" />}
            title="التواصل مع الكوتش"
            description="WhatsApp"
            href={WHATSAPP_COACH_URL}
          />
        ) : null}
        <ProfileRowButton
          icon={<HelpCircle className="h-4 w-4" />}
          title="مركز المساعدة"
          description="أسئلة شائعة"
          to="/app/support"
        />
        <ProfileRowButton
          icon={<Mail className="h-4 w-4" />}
          title="اتصل بنا"
          description={SITE_SUPPORT_EMAIL}
          href={`mailto:${SITE_SUPPORT_EMAIL}`}
        />
        <ProfileRowButton
          icon={<Lightbulb className="h-4 w-4" />}
          title="اقتراح ميزة"
          href={`mailto:${SITE_SUPPORT_EMAIL}?subject=${encodeURIComponent("اقتراح ميزة")}`}
        />
      </div>
    </ProfileSectionCard>
  );
}

export function ProfileAboutSection() {
  return (
    <ProfileSectionCard title="عن المنصة">
      <div className="space-y-2 text-sm">
        <p className="font-black text-foreground">Hakim Coaching</p>
        <p className="text-xs font-bold text-muted-foreground">الإصدار {getAppBuildVersion()}</p>
      </div>
      <div className="mt-3 divide-y divide-border/50">
        <ProfileRowButton
          icon={<ExternalLink className="h-4 w-4" />}
          title="الموقع الرسمي"
          href="https://hakimlemagicien.com"
        />
        <ProfileRowButton
          icon={<FileText className="h-4 w-4" />}
          title="الشروط والأحكام"
          href={LEGAL_ROUTES.terms}
        />
        <ProfileRowButton
          icon={<Shield className="h-4 w-4" />}
          title="سياسة الاسترجاع"
          href={LEGAL_ROUTES.refund}
        />
        <ProfileRowButton
          icon={<MessageCircle className="h-4 w-4" />}
          title="واتساب الدعم"
          href={SITE_WHATSAPP_URL}
        />
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground">© {new Date().getFullYear()} Hakim Coaching</p>
    </ProfileSectionCard>
  );
}

export function ProfileLogoutButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="platform-touch flex h-12 w-full items-center justify-center gap-2 rounded-[24px] border border-red-200 bg-white text-sm font-black text-destructive transition-transform active:scale-[0.985]"
    >
      <LogOut className="h-4 w-4" />
      تسجيل الخروج
    </button>
  );
}

export function ProfileActivityIconsFallback() {
  return (
    <ProfileSectionCard title="ملخص النشاط">
      <div className="grid grid-cols-2 gap-2">
        {[Dumbbell, UtensilsCrossed, Award, Bell].map((Icon, i) => (
          <div key={i} className="rounded-2xl bg-muted/35 p-3 text-center opacity-50">
            <Icon className="mx-auto h-5 w-5" />
            <p className="mt-1 text-xs font-bold">—</p>
          </div>
        ))}
      </div>
    </ProfileSectionCard>
  );
}
