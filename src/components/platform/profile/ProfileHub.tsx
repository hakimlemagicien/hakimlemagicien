import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  CreditCard,
  Crown,
  Droplets,
  Headphones,
  HeartPulse,
  Images,
  Pencil,
  Scale,
  Shield,
  Target,
  User,
  Watch,
} from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { cn } from "@/lib/utils";
import {
  formatMemberSinceShort,
  formatProfileDate,
  membershipBadgeLabel,
  type ProfileHubAchievement,
  type ProfileHubStat,
} from "@/lib/platform/profile-experience";
import type { MembershipTier } from "@/lib/platform/membership";
import type { BodyProgressItem } from "@/lib/platform/progress-experience";
import type { TransformationPhotoSession } from "@/lib/platform/progress-storage";

export type ProfilePanelId = "health" | "photos" | "settings";

const ACHIEVEMENT_ICON = {
  blue: Scale,
  orange: Target,
  green: Droplets,
} as const;

export function ProfileIdentityCard({
  displayName,
  avatarUrl,
  tier,
  memberSince,
  onAvatarClick,
  onEdit,
}: {
  displayName: string;
  avatarUrl: string | null;
  tier: MembershipTier;
  memberSince: string | null;
  onAvatarClick: () => void;
  onEdit: () => void;
}) {
  return (
    <section className="profile-hero">
      <button
        type="button"
        onClick={onAvatarClick}
        aria-label="تغيير صورة الملف الشخصي"
        className="profile-hero__avatar"
      >
        {avatarUrl ? (
          <OptimizedImage src={avatarUrl} alt="" width={72} height={72} className="h-full w-full" priority />
        ) : (
          <User className="h-7 w-7 text-muted-foreground" />
        )}
      </button>
      <div className="profile-hero__copy">
        <h2>{displayName}</h2>
        <span className="profile-hero__badge">{membershipBadgeLabel(tier)}</span>
        <p>{formatMemberSinceShort(memberSince)}</p>
      </div>
      <button type="button" className="profile-hero__edit platform-touch" onClick={onEdit}>
        <Pencil className="h-3.5 w-3.5" />
        تعديل الملف
      </button>
    </section>
  );
}

export function ProfileGoalBanner({ goal }: { goal: string }) {
  return (
    <div className="profile-goal">
      <span className="profile-goal__icon" aria-hidden>
        <Target className="h-4 w-4" />
      </span>
      <p>
        الهدف الحالي: <strong>{goal}</strong>
      </p>
    </div>
  );
}

export function ProfileStatStrip({ stats }: { stats: ProfileHubStat[] }) {
  if (!stats.length) return null;
  return (
    <div className="profile-metrics" aria-label="ملخص نشاطك">
      {stats.map((stat) => (
        <div key={stat.id} className="profile-metrics__item">
          <strong className={cn(stat.accent && "is-accent")}>{stat.value}</strong>
          <span>{stat.label}</span>
        </div>
      ))}
    </div>
  );
}

export function ProfileAchievementsRow({ items }: { items: ProfileHubAchievement[] }) {
  if (!items.length) return null;
  return (
    <section className="profile-block">
      <div className="profile-block__head">
        <h2>إنجازاتك</h2>
        <Link to="/app/achievements" className="profile-block__more">
          الكل
        </Link>
      </div>
      <div className="profile-achievements">
        {items.map((item) => {
          const Icon = ACHIEVEMENT_ICON[item.tone];
          return (
            <Link
              key={item.id}
              to="/app/achievements"
              className={cn("profile-achievement", `is-${item.tone}`, !item.unlocked && "is-locked")}
            >
              <span className="profile-achievement__icon" aria-hidden>
                <Icon className="h-4 w-4" />
              </span>
              <strong>{item.title}</strong>
              <span>{item.subtitle}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ProfileNavRow({
  icon,
  title,
  onClick,
  to,
}: {
  icon: ReactNode;
  title: string;
  onClick?: () => void;
  to?: string;
}) {
  const inner = (
    <>
      <span className="profile-nav__icon">{icon}</span>
      <span className="profile-nav__title">{title}</span>
      <ChevronLeft className="profile-nav__chevron" />
    </>
  );

  if (to) {
    return (
      <Link to={to} className="profile-nav__row platform-touch">
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" className="profile-nav__row platform-touch" onClick={onClick}>
      {inner}
    </button>
  );
}

export function ProfileClientMenu({
  onHealth,
  onMembership,
  onPhotos,
  onDevices,
}: {
  onHealth: () => void;
  onMembership: () => void;
  onPhotos: () => void;
  onDevices: () => void;
}) {
  return (
    <nav className="profile-nav" aria-label="بيانات العميل">
      <ProfileNavRow icon={<HeartPulse className="h-5 w-5" />} title="بياناتي الصحية" onClick={onHealth} />
      <ProfileNavRow icon={<Crown className="h-5 w-5" />} title="عضويتي" onClick={onMembership} />
      <ProfileNavRow icon={<CreditCard className="h-5 w-5" />} title="الاشتراك والفوترة" to="/app/billing" />
      <ProfileNavRow icon={<Images className="h-5 w-5" />} title="صور التقدم" onClick={onPhotos} />
      <ProfileNavRow icon={<Watch className="h-5 w-5" />} title="الأجهزة المتصلة" onClick={onDevices} />
    </nav>
  );
}

export function ProfileSupportMenu({
  canContactCoach,
  onSettings,
}: {
  canContactCoach: boolean;
  onSettings: () => void;
}) {
  return (
    <section className="profile-block">
      <div className="profile-block__head">
        <h2>الدعم والإعدادات</h2>
      </div>
      <nav className="profile-nav" aria-label="الدعم والإعدادات">
        <ProfileNavRow
          icon={<Headphones className="h-5 w-5" />}
          title="دعم الحساب والفوترة"
          to="/contact"
        />
        <ProfileNavRow
          icon={<Headphones className="h-5 w-5" />}
          title="محادثة الكوتش"
          to={canContactCoach ? "/app/support/chat" : "/app/support"}
        />
        <ProfileNavRow
          icon={<Shield className="h-5 w-5" />}
          title="الإعدادات والخصوصية"
          onClick={onSettings}
        />
      </nav>
    </section>
  );
}

export function ProfileBodySnapshot({ items }: { items: BodyProgressItem[] }) {
  const recorded = items.filter((item) => item.recorded && item.current != null);
  if (!recorded.length) return null;
  return (
    <div className="profile-body-grid" aria-label="قياسات الجسم">
      {recorded.map((item) => (
        <div key={item.key} className="profile-body-grid__item">
          <strong>
            {item.current}
            <small> {item.unit}</small>
          </strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function ProfilePhotosPanel({ sessions }: { sessions: TransformationPhotoSession[] }) {
  if (!sessions.length) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-bold text-muted-foreground">لا توجد صور تقدم بعد. ابدأ جلسة التصوير من صفحة التقدم.</p>
        <Link
          to="/app/progress"
          className="flex h-11 w-full items-center justify-center rounded-2xl bg-primary text-xs font-black text-primary-foreground"
        >
          فتح سجل التقدم
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.slice(0, 6).map((session) => {
        const thumb =
          session.photos.front?.thumbUrl ?? session.photos.side?.thumbUrl ?? session.photos.back?.thumbUrl;
        return (
          <div key={session.id} className="flex items-center gap-3 rounded-2xl bg-muted/40 p-2.5">
            {thumb ? (
              <OptimizedImage src={thumb} alt="" width={56} height={56} className="h-14 w-14 rounded-xl object-cover" />
            ) : (
              <span className="grid h-14 w-14 place-items-center rounded-xl bg-muted">
                <Images className="h-5 w-5 text-muted-foreground" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black">{session.label || `اليوم ${session.dayNumber}`}</p>
              <p className="text-[11px] font-bold text-muted-foreground">{formatProfileDate(session.createdAt)}</p>
            </div>
          </div>
        );
      })}
      <Link
        to="/app/progress"
        className="flex h-11 w-full items-center justify-center rounded-2xl bg-primary text-xs font-black text-primary-foreground"
      >
        عرض كل الصور
      </Link>
    </div>
  );
}
