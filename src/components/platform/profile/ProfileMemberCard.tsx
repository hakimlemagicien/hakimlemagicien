import { Crown, Pencil, Target, User } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { cn } from "@/lib/utils";
import { formatMemberSinceShort, type ProfileHubStat } from "@/lib/platform/profile-experience";
import { getMembershipTierLabel, type MembershipTier } from "@/lib/platform/membership";

type MemberCardSkin = "free" | "essential" | "premium" | "vip";

function memberCardSkin(tier: MembershipTier): MemberCardSkin {
  if (tier === "vip" || tier === "admin") return "vip";
  if (tier === "premium") return "premium";
  if (tier === "essential") return "essential";
  return "free";
}

export function ProfileMemberCard({
  displayName,
  avatarUrl,
  tier,
  memberSince,
  goal,
  stats,
  onAvatarClick,
  onEdit,
}: {
  displayName: string;
  avatarUrl: string | null;
  tier: MembershipTier;
  memberSince: string | null;
  goal: string;
  stats: ProfileHubStat[];
  onAvatarClick: () => void;
  onEdit: () => void;
}) {
  const skin = memberCardSkin(tier);
  const tierLabel = getMembershipTierLabel(tier === "visitor" ? "free" : tier);
  const since = formatMemberSinceShort(memberSince);
  const fiery = skin === "vip";

  return (
    <article className={cn("member-card", `is-tier-${skin}`)}>
      <span className="member-card__glow" aria-hidden />
      <span className="member-card__ember" aria-hidden />
      <span className="member-card__ribbon">
        <Crown className="h-3.5 w-3.5" />
        {fiery ? "باقة VIP" : `باقة ${tierLabel}`}
      </span>

      <div className="member-card__identity">
        <button
          type="button"
          onClick={onAvatarClick}
          aria-label="تغيير صورة الملف الشخصي"
          className="member-card__avatar"
        >
          {avatarUrl ? (
            <OptimizedImage src={avatarUrl} alt="" width={72} height={72} className="h-full w-full" priority />
          ) : (
            <User className="h-7 w-7" />
          )}
        </button>
        <div className="member-card__copy">
          <h2>{displayName}</h2>
          <p>
            <b>عضو {tierLabel}</b>
            <span>{since}</span>
          </p>
        </div>
        <button type="button" className="member-card__edit platform-touch" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
          تعديل الملف
        </button>
      </div>

      <div className="member-card__goal">
        <Target className="h-4 w-4" strokeWidth={2.2} />
        <p>
          الهدف الحالي: <strong>{goal}</strong>
        </p>
      </div>

      {stats.length ? (
        <div className="member-card__stats" aria-label="ملخص نشاطك">
          {stats.map((stat) => (
            <div key={stat.id}>
              <strong className={stat.accent ? "is-accent" : undefined}>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
