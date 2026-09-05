import { CheckCircle2, Crown, Lightbulb } from "lucide-react";
import coachHoldPortrait from "@/assets/Coach_Hakim_Branded_Profile_PNG/03_Black_Guidance.png";
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  padHoldUnit,
  PROGRAM_PREPARATION_HOLD_MS,
  PROGRAM_PREPARATION_STEPS,
  type ProgramPreparationHold,
} from "@/lib/platform/program-preparation-hold";
import { TRAINING_PRODUCT_COPY } from "@/lib/platform/training-product-copy";
import { cn } from "@/lib/utils";

/** Match WorkoutGoalHero side inset: 8px inside the platform gutter on each side. */
const HOLD_BLEED =
  "mx-[calc(8px-var(--platform-gutter))] w-[calc(100%+2*var(--platform-gutter)-16px)] -translate-y-[25px]";

const BLIPS = [
  { id: 1 as const, left: "72%", top: "22%" },
  { id: 2 as const, left: "80%", top: "58%" },
  { id: 3 as const, left: "28%", top: "70%" },
  { id: 4 as const, left: "22%", top: "28%" },
];

const PREMIUM_PERKS = [
  "أولوية في إعداد برنامجك",
  "مراجعة إضافية من المدرب",
  "تحديثات أسرع حسب طلبك",
  "دعم مباشر على مدار الساعة",
] as const;

const JOURNEY_PATH = "M304 58 C 250 58, 234 16, 180 16 S 124 64, 72 64 16 24, 16 24";

function holdProgress(hold: ProgramPreparationHold) {
  return Math.min(1, Math.max(0, hold.elapsedMs / PROGRAM_PREPARATION_HOLD_MS));
}

function FlipDigits({ value, className }: { value: number; className?: string }) {
  const text = padHoldUnit(value);
  return (
    <span className={cn("inline-flex tabular-nums", className)}>
      <span key={`${text}-a`} className="hold-flip">
        {text[0]}
      </span>
      <span key={`${text}-b`} className="hold-flip">
        {text[1]}
      </span>
    </span>
  );
}

function RadarDish({ hold }: { hold: ProgramPreparationHold }) {
  return (
    <div className="relative mx-auto h-[260px] w-[260px]">
      <div className="absolute inset-[15px]">
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-primary/[0.08] to-transparent" />
        <div className="hold-radar-rings absolute inset-0 rounded-full border border-primary/30" />
        <div className="hold-radar-rings absolute inset-8 rounded-full border border-primary/22" />
        <div className="hold-radar-rings absolute inset-16 rounded-full border border-primary/16" />
        <span className="absolute inset-x-0 top-1/2 h-px bg-primary/20" />
        <span className="absolute inset-y-0 left-1/2 w-px bg-primary/20" />
        <span className="hold-radar-sweep absolute inset-0 rounded-full" />
        {BLIPS.map((blip) => {
          const step = PROGRAM_PREPARATION_STEPS[blip.id - 1]!;
          const active = step.id === hold.currentStep;
          const done = step.id < hold.currentStep;
          const showLabel = active || done;
          return (
            <div
              key={step.id}
              className="absolute z-[3] -translate-x-1/2 -translate-y-1/2"
              style={{ left: blip.left, top: blip.top }}
            >
              <div className={cn("flex flex-col items-center", active && "hold-station-bounce")}>
                <span
                  className={cn(
                    "relative grid h-3.5 w-3.5 place-items-center rounded-full",
                    done || active ? "bg-primary" : "bg-primary/25",
                  )}
                >
                  {active ? <span className="hold-radar-ping" /> : null}
                </span>
                {showLabel ? (
                  <p
                    className={cn(
                      "mt-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-black leading-none",
                      active
                        ? "hold-blip-label bg-primary text-primary-foreground shadow-[0_8px_18px_-10px_rgba(249,115,22,0.65)]"
                        : "bg-white/90 text-muted-foreground ring-1 ring-border/60",
                    )}
                  >
                    {step.titleAr}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
        <div className="absolute left-1/2 top-1/2 z-[2] h-14 w-14 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-2 border-primary shadow-[0_0_24px_rgba(255,107,0,0.28)]">
          <OptimizedImage
            src={coachHoldPortrait}
            alt=""
            width={120}
            height={120}
            sizes="56px"
            className="h-full w-full"
            objectFit="cover"
          />
          <span className="hold-radar-ping" />
        </div>
      </div>
    </div>
  );
}

function HoldWhyCard() {
  return (
    <section
      className={cn(
        "platform-card space-y-2 rounded-3xl p-4 border-border/50 bg-[#FFF6EE]",
        HOLD_BLEED,
      )}
    >
      <p className="text-[10px] font-black text-primary">{TRAINING_PRODUCT_COPY.holdBadge}</p>
      <h2 className="text-[17px] font-black leading-snug text-foreground">
        {TRAINING_PRODUCT_COPY.holdTitle}
      </h2>
      <p className="text-[12px] leading-relaxed text-muted-foreground">{TRAINING_PRODUCT_COPY.holdBody}</p>
    </section>
  );
}

function OriginalPremiumCard({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <section className={cn("relative overflow-hidden rounded-3xl p-4 text-white", HOLD_BLEED)}>
      <OptimizedImage
        src={coachHoldPortrait}
        alt=""
        width={720}
        height={480}
        sizes="100vw"
        className="absolute inset-0 h-full w-full"
        objectFit="cover"
      />
      <div className="absolute inset-0 bg-gradient-to-l from-black/88 via-black/72 to-black/40" />
      <div className="relative z-[1] space-y-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-black text-primary-foreground">
          <Crown className="h-3 w-3" strokeWidth={2.2} />
          مميز
        </span>
        <div className="space-y-1">
          <h3 className="text-[17px] font-black leading-snug">{TRAINING_PRODUCT_COPY.holdUpgradeTitle}</h3>
          <p className="text-[12px] text-white/80">{TRAINING_PRODUCT_COPY.holdUpgradeLead}</p>
        </div>
        <ul className="space-y-1.5">
          {PREMIUM_PERKS.map((perk) => (
            <li key={perk} className="flex items-center justify-end gap-2 text-[12px] font-bold">
              <span>{perk}</span>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.2} />
            </li>
          ))}
        </ul>
        <p className="pt-1 text-[13px] font-semibold italic text-white/90">
          التزام اليوم يصنع نتائج الغد
          <span className="mt-0.5 block text-[11px] font-bold not-italic text-white/70">Hakim</span>
        </p>
        <button
          type="button"
          onClick={onUpgrade}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-black text-primary-foreground"
        >
          <Crown className="h-4 w-4" strokeWidth={2.2} />
          {TRAINING_PRODUCT_COPY.holdUpgradeCta}
        </button>
      </div>
    </section>
  );
}

function MapJourney({ hold }: { hold: ProgramPreparationHold }) {
  const progress = holdProgress(hold);
  return (
    <div aria-label="خريطة تنفيذ البرنامج" dir="rtl">
      <svg viewBox="0 0 320 78" className="h-[78px] w-full">
        <path
          d={JOURNEY_PATH}
          fill="none"
          stroke="color-mix(in srgb, var(--border) 85%, transparent)"
          strokeWidth="4"
        />
        <path
          d={JOURNEY_PATH}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="4"
          className="hold-path-flow"
          pathLength={100}
          strokeDasharray={`${Math.max(8, progress * 100)} 100`}
        />
        <circle cx={304 - progress * 288} cy={progress < 0.4 ? 42 : 48} r="7" fill="var(--primary)" />
      </svg>
      <div className="grid grid-cols-4 gap-1 text-center">
        {PROGRAM_PREPARATION_STEPS.map((step) => (
          <p
            key={step.id}
            className={cn(
              "text-[8px] font-black",
              step.id === hold.currentStep ? "text-primary" : "text-muted-foreground",
            )}
          >
            {step.titleAr}
          </p>
        ))}
      </div>
    </div>
  );
}

function TimerCells({ hold }: { hold: ProgramPreparationHold }) {
  const cells = [
    { value: hold.hours, label: "ساعات" },
    { value: hold.minutes, label: "دقائق" },
    { value: hold.seconds, label: "ثواني" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2" dir="ltr">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="rounded-2xl border border-border/50 bg-white/80 py-2 text-center shadow-[0_8px_20px_-16px_rgba(15,23,42,0.28)]"
        >
          <FlipDigits value={cell.value} className="text-[24px] font-black text-primary" />
          <p className="mt-1 text-[9px] font-bold text-muted-foreground">{cell.label}</p>
        </div>
      ))}
    </div>
  );
}

function JourneyRadarCard({ hold }: { hold: ProgramPreparationHold }) {
  return (
    <section
      className={cn(
        "platform-card overflow-hidden rounded-3xl border-border/50 bg-[#FFF6EE] p-4 text-foreground",
        HOLD_BLEED,
      )}
    >
      <div className="flex items-center justify-between text-[10px] font-black text-primary">
        <span>SCAN {padHoldUnit(hold.seconds)}</span>
        <span>خريطة الرحلة</span>
      </div>
      <div className="mt-3">
        <RadarDish hold={hold} />
      </div>
      <div className="mt-3 space-y-3">
        <TimerCells hold={hold} />
        <MapJourney hold={hold} />
      </div>
    </section>
  );
}

function HoldTip() {
  return (
    <section className={cn("platform-card flex items-start gap-3 rounded-3xl p-4", HOLD_BLEED)}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
        <Lightbulb className="h-5 w-5" />
      </span>
      <p className="text-[12px] leading-relaxed text-muted-foreground">
        <span className="font-black text-foreground">{TRAINING_PRODUCT_COPY.holdNotify}</span>
        <span className="mt-0.5 block">{TRAINING_PRODUCT_COPY.holdExplore}</span>
      </p>
    </section>
  );
}

/** Locked workout-only hold room: open journey radar + original premium promo. */
export function ProgramPreparationHoldCard({
  hold,
  showUpgrade,
  onUpgrade,
}: {
  hold: ProgramPreparationHold;
  showUpgrade: boolean;
  onUpgrade: () => void;
}) {
  return (
    <div className="space-y-3.5">
      <HoldWhyCard />
      <JourneyRadarCard hold={hold} />
      {showUpgrade ? <OriginalPremiumCard onUpgrade={onUpgrade} /> : null}
      <HoldTip />
    </div>
  );
}
