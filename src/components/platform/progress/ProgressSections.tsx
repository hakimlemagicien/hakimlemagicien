import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Camera,
  ChevronLeft,
  Droplets,
  Dumbbell,
  Flame,
  Plus,
  Ruler,
  Scale,
  Star,
  Trophy,
  UtensilsCrossed,
} from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useMembership } from "@/hooks/useMembership";
import type { ProgressDashboardData } from "@/lib/platform/progress-experience";
import type { ActivityEvent, PhotoAngle, TransformationPhotoSession } from "@/lib/platform/progress-storage";
import type { PlatformActivitySnapshot } from "@/lib/platform/platform-activity";
import {
  CountUpValue,
  ProgressRing,
  progressCardClass,
} from "@/components/platform/progress/ProgressShared";
import { cn } from "@/lib/utils";

const EVENT_ICONS: Record<ActivityEvent["type"], typeof Dumbbell> = {
  workout: Dumbbell,
  meal: UtensilsCrossed,
  water: Droplets,
  weight: Scale,
  measurement: Ruler,
  photo: Camera,
  achievement: Trophy,
  points: Star,
};

export function ProgressHeroCard({
  displayName,
  snapshot,
  data,
  onOpenLevel,
  onOpenPoints,
  onOpenWeekly,
}: {
  displayName: string;
  snapshot: PlatformActivitySnapshot;
  data: ProgressDashboardData;
  onOpenLevel: () => void;
  onOpenPoints: () => void;
  onOpenWeekly: () => void;
}) {
  return (
    <section
      className={cn(
        progressCardClass,
        "relative overflow-hidden bg-gradient-to-br from-[#FF8A3D] via-[#F97316] to-[#EA580C] p-4 text-white",
      )}
    >
      <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-start gap-3" dir="rtl">
        <button type="button" onClick={onOpenWeekly} className="shrink-0 text-right">
          <ProgressRing pct={data.weeklyAchievementPct} done={data.weeklyAchievementPct >= 100}>
            <p className="text-lg font-black leading-none">
              <CountUpValue value={data.weeklyAchievementPct} suffix="٪" />
            </p>
            <p className="mt-0.5 text-[8px] font-bold text-white/85">إنجاز الأسبوع</p>
          </ProgressRing>
        </button>

        <div className="min-w-0 flex-1 text-right">
          <p className="text-[11px] font-bold text-white/85">مرحباً {displayName}</p>
          <button type="button" onClick={onOpenLevel} className="mt-1 text-right">
            <p className="text-[15px] font-black">المستوى {data.level.level}</p>
            <p className="text-[10px] font-medium text-white/80">
              {data.level.pointsToNext} نقطة للمستوى {data.level.level + 1}
            </p>
          </button>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenPoints}
              className="inline-flex items-center gap-1 rounded-xl bg-white/15 px-2.5 py-1 text-[10px] font-black"
            >
              <Star className="h-3.5 w-3.5 fill-[#FCD34D] text-[#FCD34D]" />
              <CountUpValue value={snapshot.hakimPoints} /> نقاط
            </button>
            <span className="inline-flex items-center gap-1 rounded-xl bg-white/15 px-2.5 py-1 text-[10px] font-black">
              <Flame className="h-3.5 w-3.5" />
              {snapshot.activityStreak} يوم
            </span>
          </div>
          <p className="mt-2 text-[11px] font-medium leading-snug text-white/90">{data.weeklyMotivation}</p>
        </div>
      </div>
    </section>
  );
}

export function TodayActivitySection({
  events,
  expanded,
  onToggleExpand,
}: {
  events: ActivityEvent[];
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const visible = expanded ? events : events.slice(0, 6);
  const reduceMotion = useReducedMotion();

  return (
    <section className={cn(progressCardClass, "p-4")}>
      <h2 className="text-[12px] font-black text-foreground">نشاط اليوم</h2>
      {events.length === 0 ? (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          ابدأ أول خطوة اليوم، وسنقوم بتسجيلها هنا.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {visible.map((event) => {
            const Icon = EVENT_ICONS[event.type];
            return (
              <motion.li
                key={event.id}
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 rounded-2xl bg-muted/45 px-3 py-2.5"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#FFF1E6] text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 text-right">
                  <p className="text-[12px] font-black text-foreground">{event.title}</p>
                  {event.subtitle ? (
                    <p className="text-[10px] font-medium text-muted-foreground">{event.subtitle}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-[10px] font-bold text-muted-foreground">{event.timeLabel}</span>
              </motion.li>
            );
          })}
        </ul>
      )}
      {events.length > 6 ? (
        <button
          type="button"
          onClick={onToggleExpand}
          className="mt-3 w-full text-center text-[11px] font-black text-primary"
        >
          {expanded ? "عرض أقل" : "عرض المزيد"}
        </button>
      ) : null}
    </section>
  );
}

export function WeeklyProgressSection({ cards }: { cards: ProgressDashboardData["weeklyCards"] }) {
  return (
    <section className="space-y-2">
      <h2 className="px-0.5 text-[12px] font-black text-foreground">التقدم الأسبوعي</h2>
      <div className="grid grid-cols-2 gap-2">
        {cards.map((card) => (
          <WeeklyProgressCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}

function WeeklyProgressCard({ card }: { card: ProgressDashboardData["weeklyCards"][number] }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className={cn(progressCardClass, "flex flex-col items-center p-3 text-center")}>
      <div className="relative grid h-[72px] w-[72px] place-items-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 72 72" aria-hidden>
          <circle cx="36" cy="36" r="30" fill="none" stroke="#F3F4F6" strokeWidth="6" />
          <motion.circle
            cx="36"
            cy="36"
            r="30"
            fill="none"
            stroke="#F97316"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 30}
            initial={false}
            animate={{ strokeDashoffset: 2 * Math.PI * 30 * (1 - card.pct / 100) }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.65, ease: "easeOut" }}
          />
        </svg>
        <span className="text-lg">{card.icon}</span>
      </div>
      <p className="mt-1 text-[11px] font-black text-foreground">{card.label}</p>
      <p className="text-[10px] font-bold text-primary">{card.summary}</p>
    </div>
  );
}

export function JourneyStatisticsSection({ stats }: { stats: ProgressDashboardData["journeyStats"] }) {
  return (
    <section className={cn(progressCardClass, "p-4")}>
      <h2 className="text-[12px] font-black text-foreground">إحصائيات رحلتك</h2>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="min-w-[96px] shrink-0 rounded-2xl bg-muted/50 px-3 py-3 text-center"
          >
            <p className="text-base">{stat.icon}</p>
            <p className="mt-1 text-sm font-black text-foreground">{stat.value}</p>
            <p className="text-[9px] font-bold text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function BodyProgressSection({
  items,
  onAddWeight,
}: {
  items: ProgressDashboardData["bodyItems"];
  onAddWeight: (value: number) => void;
}) {
  const [weightInput, setWeightInput] = useState("");
  const weightItem = items.find((item) => item.key === "weight");
  const otherItems = items.filter((item) => item.key !== "weight");

  return (
    <section className={cn(progressCardClass, "space-y-3 p-4")}>
      <h2 className="text-[12px] font-black text-foreground">تطور القياسات</h2>

      <div className="rounded-2xl bg-muted/45 p-3">
        <div className="flex items-center justify-between gap-2">
          <Scale className="h-4 w-4 text-primary" />
          <div className="text-right">
            <p className="text-[11px] font-bold text-muted-foreground">الوزن</p>
            <p className="text-lg font-black text-foreground">
              {weightItem?.recorded ? `${weightItem.current} ${weightItem.unit}` : "لم يتم التسجيل بعد"}
            </p>
          </div>
        </div>
        <form
          className="mt-2 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const value = Number.parseFloat(weightInput.replace(",", "."));
            if (!Number.isFinite(value) || value <= 0) return;
            onAddWeight(value);
            setWeightInput("");
          }}
        >
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="1"
            value={weightInput}
            onChange={(event) => setWeightInput(event.target.value)}
            placeholder="إضافة قياس"
            className="min-w-0 flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm font-bold"
            aria-label="الوزن بالكيلوغرام"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-black text-primary-foreground"
          >
            حفظ
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {otherItems.map((item) => (
          <div key={item.key} className="rounded-2xl bg-muted/40 px-3 py-2.5 text-right">
            <p className="text-[10px] font-bold text-muted-foreground">{item.label}</p>
            <p className="mt-0.5 text-sm font-black text-foreground">
              {item.recorded ? `${item.current} ${item.unit}` : "لم يتم التسجيل بعد"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TransformationJourneySection({
  sessions,
  onboardingDismissed,
  onStartPhotos,
  onDismissOnboarding,
  onOpenComparison,
}: {
  sessions: TransformationPhotoSession[];
  onboardingDismissed: boolean;
  onStartPhotos: () => void;
  onDismissOnboarding: () => void;
  onOpenComparison: (before: TransformationPhotoSession, after: TransformationPhotoSession) => void;
}) {
  const showWelcome = sessions.length === 0 && !onboardingDismissed;

  if (showWelcome) {
    return (
      <section className={cn(progressCardClass, "space-y-3 p-4 text-right")}>
        <h2 className="text-[12px] font-black text-foreground">رحلة التحول</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          ابدأ رحلة التحول الخاصة بك. التقط صورك اليوم لتتمكن من مقارنة تقدمك مع مرور الوقت.
        </p>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          صورك خاصة بك، ولن تتم مشاركتها أو استخدامها دون موافقتك الصريحة.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onStartPhotos}
            className="flex h-11 flex-1 items-center justify-center rounded-2xl bg-primary text-xs font-black text-primary-foreground"
          >
            ابدأ الآن
          </button>
          <button
            type="button"
            onClick={onDismissOnboarding}
            className="flex h-11 flex-1 items-center justify-center rounded-2xl border border-border text-xs font-bold text-foreground"
          >
            لاحقاً
          </button>
        </div>
      </section>
    );
  }

  if (sessions.length === 0) {
    return (
      <section className={cn(progressCardClass, "space-y-3 p-4 text-right")}>
        <h2 className="text-[12px] font-black text-foreground">رحلة التحول</h2>
        <p className="text-xs text-muted-foreground">ابدأ رحلة التحول — أضف صورتك الأولى.</p>
        <button
          type="button"
          onClick={onStartPhotos}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-xs font-black text-primary-foreground"
        >
          <Camera className="h-4 w-4" />
          إضافة صورة
        </button>
      </section>
    );
  }

  if (sessions.length === 1) {
    const session = sessions[0]!;
    const thumb = session.photos.front?.thumbUrl ?? session.photos.side?.thumbUrl;
    return (
      <section className={cn(progressCardClass, "space-y-3 p-4")}>
        <div className="flex items-center justify-between">
          <h2 className="text-[12px] font-black text-foreground">رحلة التحول</h2>
          <button type="button" onClick={onStartPhotos} className="text-[10px] font-black text-primary">
            + صورة
          </button>
        </div>
        {thumb ? (
          <OptimizedImage src={thumb} alt="" width={320} height={400} className="h-40 w-full rounded-2xl object-cover" />
        ) : null}
        <p className="text-xs text-muted-foreground">أضف صورة جديدة مستقبلاً لبدء المقارنة.</p>
      </section>
    );
  }

  const comparable = sessions.length >= 2;
  const before = sessions[0]!;
  const after = sessions[sessions.length - 1]!;

  return (
    <section className={cn(progressCardClass, "space-y-3 p-4")}>
      <div className="flex items-center justify-between">
        <h2 className="text-[12px] font-black text-foreground">رحلة التحول</h2>
        <button type="button" onClick={onStartPhotos} className="text-[10px] font-black text-primary">
          + صورة
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sessions.map((session) => {
          const thumb = session.photos.front?.thumbUrl ?? session.photos.side?.thumbUrl;
          return (
            <div key={session.id} className="w-24 shrink-0 text-center">
              <div className="overflow-hidden rounded-2xl bg-muted">
                {thumb ? (
                  <OptimizedImage src={thumb} alt="" width={96} height={120} className="h-28 w-24 object-cover" />
                ) : (
                  <div className="grid h-28 w-24 place-items-center text-muted-foreground">
                    <Camera className="h-5 w-5" />
                  </div>
                )}
              </div>
              <p className="mt-1 text-[9px] font-bold text-muted-foreground">{session.label}</p>
            </div>
          );
        })}
        <button
          type="button"
          onClick={onStartPhotos}
          className="grid h-28 w-24 shrink-0 place-items-center rounded-2xl border border-dashed border-border text-primary"
          aria-label="إضافة صورة"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      {comparable ? (
        <button
          type="button"
          onClick={() => onOpenComparison(before, after)}
          className="flex h-11 w-full items-center justify-center rounded-2xl border border-primary/25 bg-primary/8 text-xs font-black text-primary"
        >
          مقارنة الصور
        </button>
      ) : null}
    </section>
  );
}

export function AchievementsSection({ achievements }: { achievements: ProgressDashboardData["achievements"] }) {
  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <section className={cn(progressCardClass, "p-4")}>
      <div className="flex items-center justify-between">
        <h2 className="text-[12px] font-black text-foreground">الإنجازات</h2>
        <span className="text-[10px] font-bold text-muted-foreground">{unlocked.length} مفتوح</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[...unlocked, ...locked].slice(0, 6).map((item) => (
          <div
            key={item.id}
            className={cn(
              "rounded-2xl px-2 py-3 text-center",
              item.unlocked ? "bg-[#FFF7ED]" : "bg-muted/40 opacity-60",
            )}
          >
            <p className="text-xl">{item.icon}</p>
            <p className="mt-1 line-clamp-2 text-[9px] font-black text-foreground">{item.title}</p>
            {item.progressLabel ? (
              <p className="mt-0.5 text-[8px] font-bold text-muted-foreground">{item.progressLabel}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function MonthlySummarySection({ summary }: { summary: ProgressDashboardData["monthlySummary"] }) {
  return (
    <section className={cn(progressCardClass, "space-y-3 p-4")}>
      <h2 className="text-[12px] font-black text-foreground">ملخص {summary.monthLabel}</h2>
      {summary.partial ? (
        <p className="text-xs text-muted-foreground">ما زلنا نبني ملخص هذا الشهر.</p>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <SummaryStat label="تمارين" value={String(summary.workouts)} />
        <SummaryStat label="وجبات" value={String(summary.meals)} />
        <SummaryStat label="أيام ماء" value={String(summary.waterDays)} />
        <SummaryStat label="Hakim Points" value={summary.points.toLocaleString("en-US")} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-right">
        <div className="rounded-2xl bg-muted/45 px-3 py-2.5">
          <p className="text-[9px] font-bold text-muted-foreground">أفضل أسبوع</p>
          <p className="text-sm font-black text-foreground">{summary.bestWeekLabel}</p>
        </div>
        <div className="rounded-2xl bg-muted/45 px-3 py-2.5">
          <p className="text-[9px] font-bold text-muted-foreground">أفضل يوم</p>
          <p className="text-sm font-black text-foreground">{summary.bestDayLabel}</p>
        </div>
      </div>
      {summary.topAchievement ? (
        <p className="text-[11px] font-medium text-muted-foreground">
          أهم إنجاز: <span className="font-black text-foreground">{summary.topAchievement}</span>
        </p>
      ) : null}
    </section>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/45 px-3 py-2.5 text-right">
      <p className="text-[9px] font-bold text-muted-foreground">{label}</p>
      <p className="text-sm font-black text-foreground">{value}</p>
    </div>
  );
}

export function ProgressDetailSheet({
  open,
  title,
  body,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/35 p-0 backdrop-blur-[2px]" dir="rtl">
      <button type="button" aria-label="إغلاق" className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-[32px] bg-white p-5 shadow-[0_-12px_40px_-12px_rgba(15,23,42,0.25)]">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />
        <h3 className="text-sm font-black text-foreground">{title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{body}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 flex h-11 w-full items-center justify-center rounded-2xl bg-primary text-xs font-black text-primary-foreground"
        >
          حسناً
        </button>
      </div>
    </div>
  );
}

export function useProgressDisplayName() {
  const { displayName } = useMembership();
  return useMemo(() => displayName || "بطل", [displayName]);
}

export type ComparisonPair = {
  before: TransformationPhotoSession;
  after: TransformationPhotoSession;
  angle: PhotoAngle;
};

export function ComparisonViewer({
  pair,
  onClose,
}: {
  pair: ComparisonPair | null;
  onClose: () => void;
}) {
  const [slider, setSlider] = useState(50);
  const reduceMotion = useReducedMotion();

  if (!pair) return null;

  const beforeUrl = pair.before.photos[pair.angle]?.thumbUrl;
  const afterUrl = pair.after.photos[pair.angle]?.thumbUrl;

  return (
    <div className="fixed inset-0 z-[90] bg-black/90 p-4" dir="rtl">
      <div className="flex items-center justify-between text-white">
        <button type="button" onClick={onClose} className="text-sm font-bold">
          إغلاق
        </button>
        <p className="text-sm font-black">مقارنة الصور</p>
        <ChevronLeft className="h-5 w-5 opacity-0" />
      </div>
      <div className="relative mx-auto mt-4 aspect-[3/4] max-w-sm overflow-hidden rounded-2xl bg-black">
        {beforeUrl ? (
          <OptimizedImage src={beforeUrl} alt="قبل" width={390} height={520} className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        {afterUrl ? (
          <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}>
            <OptimizedImage src={afterUrl} alt="بعد" width={390} height={520} className="h-full w-full object-cover" />
          </div>
        ) : null}
        <input
          type="range"
          min={0}
          max={100}
          value={slider}
          onChange={(event) => setSlider(Number(event.target.value))}
          className="absolute inset-x-4 bottom-4 z-10"
          aria-label="مقارنة قبل وبعد"
        />
      </div>
      <div className="mx-auto mt-3 flex max-w-sm justify-between text-[11px] font-bold text-white/85">
        <span>قبل — {pair.before.label}</span>
        <span>بعد — {pair.after.label}</span>
      </div>
      {!reduceMotion ? null : null}
    </div>
  );
}

export function PhotoCaptureFlow({
  open,
  step,
  onClose,
  onNext,
  onPickPhoto,
  onToggleConsent,
  consent,
}: {
  open: boolean;
  step: "guide" | "capture" | "done";
  onClose: () => void;
  onNext: () => void;
  onPickPhoto: (angle: PhotoAngle, file: File) => void;
  onToggleConsent: (value: boolean) => void;
  consent: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-end bg-black/35 backdrop-blur-[2px]" dir="rtl">
      <button type="button" aria-label="إغلاق" className="absolute inset-0" onClick={onClose} />
      <div className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-[32px] bg-white p-5">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />
        {step === "guide" ? (
          <>
            <h3 className="text-sm font-black text-foreground">إرشادات التقاط الصور</h3>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li>• استخدم إضاءة جيدة.</li>
              <li>• قف في المكان نفسه كل مرة.</li>
              <li>• حافظ على وضعية متشابهة.</li>
              <li>• تجنب خلفيات تحتوي معلومات شخصية.</li>
            </ul>
            <label className="mt-4 flex items-start gap-2 rounded-2xl bg-muted/45 p-3 text-[11px]">
              <input type="checkbox" checked={consent} onChange={(e) => onToggleConsent(e.target.checked)} className="mt-0.5" />
              <span>
                أوافق على مراجعة صور تقدمي لاستخدامها المحتمل ضمن قصص نجاح Hakim Coaching. (اختياري — غير مفعّل
                افتراضياً)
              </span>
            </label>
            <button type="button" onClick={onNext} className="mt-4 flex h-11 w-full items-center justify-center rounded-2xl bg-primary text-xs font-black text-primary-foreground">
              متابعة
            </button>
          </>
        ) : step === "capture" ? (
          <>
            <h3 className="text-sm font-black text-foreground">التقط صور التقدم</h3>
            <p className="mt-1 text-xs text-muted-foreground">أمامية، جانبية، خلفية — يمكنك تخطي أي زاوية.</p>
            <div className="mt-4 space-y-2">
              {(["front", "side", "back"] as PhotoAngle[]).map((angle) => (
                <label
                  key={angle}
                  className="flex h-12 cursor-pointer items-center justify-between rounded-2xl border border-border px-3 text-xs font-bold"
                >
                  <span>{angle === "front" ? "أمامية" : angle === "side" ? "جانبية" : "خلفية"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) onPickPhoto(angle, file);
                    }}
                  />
                  <Camera className="h-4 w-4 text-primary" />
                </label>
              ))}
            </div>
            <button type="button" onClick={onNext} className="mt-4 flex h-11 w-full items-center justify-center rounded-2xl bg-primary text-xs font-black text-primary-foreground">
              حفظ الجلسة
            </button>
          </>
        ) : (
          <>
            <p className="text-center text-2xl">✓</p>
            <h3 className="mt-2 text-center text-sm font-black text-foreground">تم حفظ الصور بنجاح</h3>
            <button type="button" onClick={onClose} className="mt-4 flex h-11 w-full items-center justify-center rounded-2xl bg-primary text-xs font-black text-primary-foreground">
              العودة للتقدم
            </button>
          </>
        )}
      </div>
    </div>
  );
}
