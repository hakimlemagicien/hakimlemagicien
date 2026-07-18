import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  Beef,
  Calendar,
  Check,
  Flame,
  Info,
  Pencil,
  RefreshCw,
  Ruler,
  Scale,
  Target,
  User,
  Wheat,
  X,
} from "lucide-react";
import { useCalorieCalculator } from "@/hooks/useCalorieCalculator";
import {
  PREVIEW_GOAL_LABELS_AR,
  type CaloriePreviewGoal,
  type MacroBreakdown,
} from "@/lib/platform/calorie-calculator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type CalorieCalculatorSheetProps = {
  open: boolean;
  onClose: () => void;
};

const PREVIEW_GOALS: CaloriePreviewGoal[] = ["cut", "maintain", "bulk"];

function CountUpValue({
  value,
  run,
  className,
}: {
  value: number;
  run: boolean;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(reduceMotion ? value : 0);
  const ranRef = useRef(false);

  useEffect(() => {
    if (!run) return;
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    if (ranRef.current) {
      setDisplay(value);
      return;
    }
    ranRef.current = true;
    const start = performance.now();
    const duration = 700;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run, value, reduceMotion]);

  return (
    <span className={cn("tabular-nums", className)} aria-live="polite">
      {display.toLocaleString("en-US")}
    </span>
  );
}

export function CalorieCalculatorSheet({ open, onClose }: CalorieCalculatorSheetProps) {
  const reduceMotion = useReducedMotion();
  const {
    validation,
    result,
    previewGoal,
    setPreviewGoal,
    actualGoal,
    accountRows,
    hasActiveNutritionPlan,
    loading,
    error,
    refresh,
    saveReference,
    saveMessage,
  } = useCalorieCalculator(open);

  const [showResultAnim, setShowResultAnim] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowResultAnim(false);
      return;
    }
    if (result && validation.complete) {
      const t = window.setTimeout(() => setShowResultAnim(true), 80);
      return () => window.clearTimeout(t);
    }
    setShowResultAnim(false);
  }, [open, result, validation.complete]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[125] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-hidden={false}
        >
          <button
            type="button"
            aria-label="إغلاق حاسبة السعرات"
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label="حاسبة السعرات الحرارية"
            dir="rtl"
            drag={reduceMotion ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.08}
            onDragEnd={(_event, info) => {
              if (info.offset.y > 120 || info.velocity.y > 500) onClose();
            }}
            initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative z-[1] flex max-h-[92dvh] w-full max-w-[430px] flex-col rounded-t-[28px] bg-white shadow-[0_-18px_48px_-18px_rgba(15,23,42,0.28)]"
          >
            <div className="shrink-0 px-4 pb-2 pt-3">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#E2E8F0]" aria-hidden />

              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="إغلاق"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#64748B] transition active:bg-[#F1F5F9]"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex-1 text-center">
                  <div className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-b from-[#FFF1E6] to-[#FFE4CC] shadow-[0_8px_24px_-8px_rgba(255,107,0,0.45)]">
                    <Flame className="h-7 w-7 text-[#FF6B00]" aria-hidden />
                  </div>
                  <h2 className="text-[17px] font-black text-[#0F172A]">حاسبة السعرات الحرارية</h2>
                  <p className="mt-1 px-2 text-[12px] font-medium leading-relaxed text-[#64748B]">
                    اكتشف احتياجك اليومي التقريبي من السعرات اعتماداً على بيانات حسابك.
                  </p>
                </div>

                <span className="h-11 w-11 shrink-0" aria-hidden />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {loading ? (
                <CalculatorSkeleton />
              ) : error ? (
                <ErrorState onRetry={() => void refresh()} />
              ) : !validation.complete ? (
                <MissingDataState missing={validation.missing} />
              ) : (
                <div className="space-y-4">
                  <AccountCard rows={accountRows} />

                  <GoalPreviewSelector
                    previewGoal={previewGoal}
                    actualGoal={actualGoal}
                    onSelect={setPreviewGoal}
                  />

                  {result ? (
                    <motion.div
                      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                      className="space-y-4"
                    >
                      <ResultCard
                        calories={result.targetCalories}
                        previewGoal={previewGoal}
                        isPreview={result.isPreview}
                        animate={showResultAnim}
                      />

                      <CalorieDetails bmr={result.bmr} tdee={result.tdee} target={result.targetCalories} />

                      {result.macros ? (
                        <MacrosSection macros={result.macros} />
                      ) : null}

                      {hasActiveNutritionPlan ? <ActivePlanNotice /> : null}

                      <ActionsSection
                        isPreview={result.isPreview}
                        onSave={saveReference}
                        onResetGoal={() => setPreviewGoal(actualGoal)}
                        saveMessage={saveMessage}
                      />

                      <Disclaimer />
                    </motion.div>
                  ) : null}
                </div>
              )}
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function CalculatorSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-[168px] w-full rounded-[24px]" />
      <Skeleton className="h-12 w-full rounded-2xl" />
      <Skeleton className="h-[140px] w-full rounded-[24px]" />
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-[88px] rounded-2xl" />
        <Skeleton className="h-[88px] rounded-2xl" />
        <Skeleton className="h-[88px] rounded-2xl" />
      </div>
      <Skeleton className="h-[120px] w-full rounded-[24px]" />
    </div>
  );
}

function AccountCard({ rows }: { rows: { label: string; value: string }[] }) {
  const icons: Record<string, typeof User> = {
    الجنس: User,
    العمر: Calendar,
    الطول: Ruler,
    الوزن: Scale,
    النشاط: Activity,
    "الهدف الحالي": Target,
  };

  return (
    <section className="rounded-[24px] border border-[#F1F5F9] bg-[#FAFAFA] p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[13px] font-extrabold text-[#0F172A]">بياناتك المستخدمة في الحساب</p>
        <Link
          to="/app/profile"
          className="inline-flex min-h-11 items-center gap-1 text-[12px] font-bold text-[#FF6B00]"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          تعديل البيانات
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {rows.map((row) => {
          const Icon = icons[row.label] ?? Info;
          return (
            <div
              key={row.label}
              className="rounded-2xl bg-white px-3 py-2.5 ring-1 ring-[#F1F5F9]"
            >
              <div className="mb-1 flex items-center gap-1.5 text-[#64748B]">
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="text-[10px] font-bold">{row.label}</span>
              </div>
              <p className="text-[13px] font-black text-[#0F172A]">{row.value}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function GoalPreviewSelector({
  previewGoal,
  actualGoal,
  onSelect,
}: {
  previewGoal: CaloriePreviewGoal;
  actualGoal: CaloriePreviewGoal;
  onSelect: (goal: CaloriePreviewGoal) => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <section aria-label="تجربة هدف مختلف">
      <p className="mb-2 text-[12px] font-extrabold text-[#0F172A]">تجربة هدف مختلف</p>
      <div className="grid grid-cols-3 gap-2">
        {PREVIEW_GOALS.map((goal) => {
          const selected = previewGoal === goal;
          const isActual = actualGoal === goal;
          return (
            <motion.button
              key={goal}
              type="button"
              onClick={() => onSelect(goal)}
              aria-pressed={selected}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              className={cn(
                "min-h-11 rounded-2xl px-2 py-2.5 text-center text-[11px] font-extrabold transition",
                selected
                  ? "bg-[#FF6B00] text-white shadow-[0_8px_20px_-10px_rgba(255,107,0,0.8)]"
                  : "bg-[#F1F5F9] text-[#64748B]",
              )}
            >
              {PREVIEW_GOAL_LABELS_AR[goal]}
              {isActual ? (
                <span className="mt-0.5 block text-[9px] font-bold opacity-80">هدفك الحالي</span>
              ) : null}
            </motion.button>
          );
        })}
      </div>
      {previewGoal !== actualGoal ? (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] font-medium leading-relaxed text-[#64748B]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF6B00]" aria-hidden />
          هذه معاينة فقط ولن يتم تغيير هدفك أو برنامجك الحالي.
        </p>
      ) : null}
    </section>
  );
}

function ResultCard({
  calories,
  previewGoal,
  isPreview,
  animate,
}: {
  calories: number;
  previewGoal: CaloriePreviewGoal;
  isPreview: boolean;
  animate: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-[24px] bg-gradient-to-b from-[#FFF7ED] to-white p-5 text-center ring-1 ring-[#FFE4CC]">
      <div className="mb-1 flex items-center justify-center gap-2">
        <p className="text-[13px] font-extrabold text-[#0F172A]">احتياجك اليومي التقريبي</p>
        {isPreview ? (
          <span className="rounded-full bg-[#FFEDD5] px-2 py-0.5 text-[10px] font-black text-[#C2410C]">
            معاينة
          </span>
        ) : null}
      </div>
      <p className="mb-3 text-[11px] font-medium text-[#64748B]">
        الهدف: {PREVIEW_GOAL_LABELS_AR[previewGoal]}
      </p>

      <div className="flex items-center justify-center gap-2">
        <Flame
          className={cn(
            "h-8 w-8 text-[#FF6B00]",
            animate && "motion-safe:animate-[pulse_1.2s_ease-out_1]",
          )}
          aria-hidden
        />
        <CountUpValue value={calories} run={animate} className="text-[42px] font-black text-[#FF6B00]" />
      </div>
      <p className="text-[13px] font-bold text-[#64748B]">سعرة حرارية</p>
      <p className="mt-2 text-[11px] font-medium leading-relaxed text-[#94A3B8]">
        هذا هو متوسط السعرات المقترح لتحقيق الهدف المحدد.
      </p>
    </section>
  );
}

function CalorieDetails({
  bmr,
  tdee,
  target,
}: {
  bmr: number;
  tdee: number;
  target: number;
}) {
  const items = [
    {
      title: "معدل الحرق الأساسي",
      abbr: "BMR",
      value: bmr,
      desc: "الطاقة التقريبية التي يحتاجها جسمك في حالة الراحة.",
    },
    {
      title: "سعرات الحفاظ",
      abbr: "TDEE",
      value: tdee,
      desc: "السعرات التقريبية للمحافظة على وزنك الحالي.",
    },
    {
      title: "السعرات المقترحة للهدف",
      abbr: null,
      value: target,
      desc: "السعرات المقترحة وفق الهدف المحدد داخل الحاسبة.",
      highlight: true,
    },
  ] as const;

  return (
    <section aria-label="تفاصيل السعرات">
      <p className="mb-2 text-[12px] font-extrabold text-[#0F172A]">تفاصيل السعرات</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.title}
            className={cn(
              "rounded-2xl p-3 ring-1",
              item.highlight
                ? "bg-[#FFF7ED] ring-[#FFEDD5]"
                : "bg-[#FAFAFA] ring-[#F1F5F9]",
            )}
          >
            <p className="text-[11px] font-extrabold text-[#0F172A]">{item.title}</p>
            {item.abbr ? (
              <p className="text-[10px] font-bold text-[#94A3B8]">{item.abbr}</p>
            ) : null}
            <p
              className={cn(
                "mt-1 text-[18px] font-black tabular-nums",
                item.highlight ? "text-[#FF6B00]" : "text-[#0F172A]",
              )}
            >
              {item.value.toLocaleString("en-US")}{" "}
              <span className="text-[11px] font-bold">kcal</span>
            </p>
            <p className="mt-1 text-[10px] font-medium leading-relaxed text-[#64748B]">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MacrosSection({ macros }: { macros: MacroBreakdown }) {
  if (!macros) return null;

  const items = [
    {
      label: "البروتين",
      icon: Beef,
      grams: macros.proteinG,
      pct: macros.proteinPct,
      color: "bg-[#EF4444]",
      track: "bg-[#FEE2E2]",
    },
    {
      label: "الكربوهيدرات",
      icon: Wheat,
      grams: macros.carbsG,
      pct: macros.carbsPct,
      color: "bg-[#FF6B00]",
      track: "bg-[#FFEDD5]",
    },
    {
      label: "الدهون",
      icon: Scale,
      grams: macros.fatG,
      pct: macros.fatPct,
      color: "bg-[#22C55E]",
      track: "bg-[#DCFCE7]",
    },
  ] as const;

  return (
    <section aria-label="توزيع الماكروز المقترح">
      <p className="mb-2 text-[12px] font-extrabold text-[#0F172A]">توزيع الماكروز المقترح</p>
      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-2xl bg-[#FAFAFA] p-3 ring-1 ring-[#F1F5F9]">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-white">
                    <Icon className="h-4 w-4 text-[#64748B]" aria-hidden />
                  </span>
                  <span className="text-[12px] font-extrabold text-[#0F172A]">{item.label}</span>
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-black tabular-nums text-[#0F172A]">{item.grams}g</p>
                  <p className="text-[10px] font-bold text-[#64748B]">{item.pct}%</p>
                </div>
              </div>
              <div className={cn("h-2 overflow-hidden rounded-full", item.track)}>
                <div
                  className={cn("h-full rounded-full transition-[width] duration-500", item.color)}
                  style={{ width: `${Math.min(100, item.pct)}%` }}
                  role="progressbar"
                  aria-valuenow={item.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${item.label} ${item.pct}%`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ActivePlanNotice() {
  return (
    <div className="flex gap-2 rounded-2xl bg-[#EFF6FF] p-3 ring-1 ring-[#DBEAFE]">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" aria-hidden />
      <p className="text-[11px] font-medium leading-relaxed text-[#1E40AF]">
        لديك خطة غذائية شخصية فعالة داخل المنصة، وقد تختلف هذه النتيجة عن السعرات والماكروز
        المعتمدة في برنامجك. الأولوية دائماً للخطة الغذائية الشخصية المعتمدة.
      </p>
    </div>
  );
}

function ActionsSection({
  isPreview,
  onSave,
  onResetGoal,
  saveMessage,
}: {
  isPreview: boolean;
  onSave: () => void;
  onResetGoal: () => void;
  saveMessage: string | null;
}) {
  return (
    <section className="space-y-2 pt-1">
      {saveMessage ? (
        <p
          className={cn(
            "rounded-xl px-3 py-2 text-center text-[12px] font-bold",
            saveMessage.includes("تعذر")
              ? "bg-[#FEF2F2] text-[#B91C1C]"
              : "bg-[#ECFDF5] text-[#047857]",
          )}
          role="status"
        >
          {saveMessage}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onSave}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B00] text-[14px] font-black text-white shadow-[0_10px_24px_-12px_rgba(255,107,0,0.9)] transition active:scale-[0.99]"
      >
        <Check className="h-4 w-4" aria-hidden />
        حفظ النتيجة كمرجع
      </button>

      {isPreview ? (
        <button
          type="button"
          onClick={onResetGoal}
          className="flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#F1F5F9] text-[13px] font-extrabold text-[#475569] transition active:bg-[#E2E8F0]"
        >
          العودة لهدفي الحالي
        </button>
      ) : null}
    </section>
  );
}

function Disclaimer() {
  return (
    <p className="pb-2 pt-1 text-center text-[11px] font-medium leading-relaxed text-[#64748B]">
      هذه النتيجة تقديرية وتعتمد على بيانات ملفك الشخصي والمعادلة المستخدمة. لا تعد بديلاً عن
      التقييم الطبي أو الخطة الغذائية الشخصية داخل Hakim Coaching Platform.
    </p>
  );
}

function MissingDataState({ missing }: { missing: string[] }) {
  return (
    <section className="rounded-[24px] border border-[#FEF3C7] bg-[#FFFBEB] p-5 text-center">
      <AlertCircle className="mx-auto mb-3 h-8 w-8 text-[#D97706]" aria-hidden />
      <h3 className="text-[15px] font-black text-[#0F172A]">
        يرجى استكمال بياناتك الشخصية للحصول على نتيجة دقيقة
      </h3>
      <ul className="mt-3 space-y-1 text-[12px] font-medium text-[#92400E]">
        {missing.map((item) => (
          <li key={item}>• {item} غير محدد</li>
        ))}
      </ul>
      <Link
        to="/app/profile"
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#FF6B00] px-6 text-[13px] font-black text-white"
      >
        استكمال بياناتي
      </Link>
    </section>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="rounded-[24px] border border-[#FECACA] bg-[#FEF2F2] p-5 text-center">
      <AlertCircle className="mx-auto mb-3 h-8 w-8 text-[#DC2626]" aria-hidden />
      <h3 className="text-[15px] font-black text-[#0F172A]">تعذر تحميل بيانات حسابك</h3>
      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#FF6B00] text-[13px] font-black text-white"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          إعادة المحاولة
        </button>
        <Link
          to="/app/profile"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white text-[13px] font-extrabold text-[#475569] ring-1 ring-[#E2E8F0]"
        >
          الانتقال إلى الملف الشخصي
        </Link>
      </div>
    </section>
  );
}
