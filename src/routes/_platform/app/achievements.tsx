import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Flame, Star, Trophy } from "lucide-react";
import { PlatformPageHeader } from "@/components/platform/layout/PlatformLayout";
import { usePlatformActivity } from "@/hooks/usePlatformActivity";
import { useStreak } from "@/hooks/useStreak";
import {
  HAKIM_POINTS_LABEL,
  HAKIM_POINTS_REWARDS,
  formatHakimPoints,
  resolveStreakMotivation,
} from "@/lib/platform/daily-motivation";

export const Route = createFileRoute("/_platform/app/achievements")({
  head: () => ({ meta: [{ title: "الإنجازات | Hakim Platform" }] }),
  component: AchievementsPage,
});

const HOW_TO_EARN = [
  { label: "إكمال تمرين", points: HAKIM_POINTS_REWARDS.workout },
  { label: "إكمال هدف يومي / وجبات", points: HAKIM_POINTS_REWARDS.nutrition },
  { label: "الالتزام بشرب الماء", points: HAKIM_POINTS_REWARDS.water },
  { label: "تحديث الوزن والقياسات", points: HAKIM_POINTS_REWARDS.measurements },
  { label: "إكمال تحديات المنصة", points: HAKIM_POINTS_REWARDS.challenge },
  { label: "تحقيق الإنجازات", points: HAKIM_POINTS_REWARDS.achievement },
] as const;

function AchievementsPage() {
  const { count, hakimPoints } = useStreak();
  const { snapshot } = usePlatformActivity();
  const streakCopy = resolveStreakMotivation(count);
  const bestStreak = snapshot.bestStreak;

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex items-start gap-2">
        <Link
          to="/app"
          className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-foreground"
          aria-label="رجوع"
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <PlatformPageHeader
            title="الإنجازات"
            subtitle="سلسلة الإنجاز وHakim Points في مكان واحد"
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl cta-gradient p-5 text-white shadow-cta">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
            <Flame className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-bold text-white/75">سلسلة الإنجاز الحالية</p>
            <p className="mt-1 text-lg font-black">{streakCopy.title}</p>
            <p className="mt-1 text-xs text-white/85">{streakCopy.message}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/12 px-3 py-2.5 ring-1 ring-white/15">
            <p className="text-[10px] font-bold text-white/70">أفضل سلسلة</p>
            <p className="mt-1 text-base font-black">{bestStreak} يوماً</p>
          </div>
          <div className="rounded-xl bg-white/12 px-3 py-2.5 ring-1 ring-white/15">
            <p className="text-[10px] font-bold text-white/70">{HAKIM_POINTS_LABEL}</p>
            <p className="mt-1 flex items-center gap-1 text-base font-black">
              <Star className="h-3.5 w-3.5 fill-[#FCD34D] text-[#FCD34D]" />
              {formatHakimPoints(hakimPoints)}
            </p>
          </div>
        </div>
      </section>

      <section className="platform-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-black text-foreground">كيف تحصل على {HAKIM_POINTS_LABEL}</h2>
        </div>
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          لا تُمنح النقاط لمجرد تسجيل الدخول — فقط عند إنجازات حقيقية داخل البرنامج.
        </p>
        <ul className="space-y-2">
          {HOW_TO_EARN.map((item) => (
            <li
              key={item.label}
              className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3 py-2.5"
            >
              <span className="text-sm font-bold text-foreground">{item.label}</span>
              <span className="text-xs font-extrabold text-primary">+{item.points}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="platform-card p-4">
        <h2 className="text-sm font-black text-foreground">قريباً</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          المستويات، الشارات، التحديات الموسمية، والمكافآت — مصمّمة لتوسعة نفس البطاقة دون إعادة بناء
          الهوية.
        </p>
      </section>
    </div>
  );
}
