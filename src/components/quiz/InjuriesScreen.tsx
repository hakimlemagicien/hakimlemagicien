import { useEffect, useState } from "react";
import { ArrowLeft, Check, Lock } from "lucide-react";
import { QuizImportantInfoNote } from "@/components/quiz/QuizImportantInfoNote";
import { QuizProgressHeader } from "@/components/quiz/QuizProgressHeader";
import { HAPTIC_NAV_DELAY_MS, triggerSelectionHaptic } from "@/lib/haptic";
import injuryNoneImg from "@/assets/injury-none.png";
import injuryShoulderImg from "@/assets/injury-shoulder.png";
import injuryKneeImg from "@/assets/injury-knee.png";
import injuryLowerBackImg from "@/assets/injury-lower-back.png";
import injuryAnkleImg from "@/assets/injury-ankle.png";
import injuryElbowImg from "@/assets/injury-elbow.png";

const ORANGE = "#FF6B00";
const GREEN = "#22C55E";
const TEXT = "#0F172A";

export type InjuryId = "none" | "knee" | "shoulder" | "elbow" | "lower_back" | "ankle";

type InjuryOption = {
  id: InjuryId;
  title: string;
  description: string;
  imageSrc: string;
};

const INJURY_OPTIONS: InjuryOption[] = [
  { id: "none", title: "لا أعاني من أي إصابة", description: "ممتاز! سنتمكن من بناء برنامج تدريبي كامل دون قيود متعلقة بالإصابات.", imageSrc: injuryNoneImg },
  { id: "knee", title: "إصابة في الركبة", description: "مثل تمزق الأربطة، التهاب الوتر الرضفي، أو خشونة.", imageSrc: injuryKneeImg },
  { id: "shoulder", title: "إصابة في الكتف", description: "مثل التمزق، التهاب الأوتار، أو عدم الاستقرار.", imageSrc: injuryShoulderImg },
  { id: "lower_back", title: "آلام أسفل الظهر", description: "مثل الانزلاق الغضروفي، شد عضلي أو ألم أسفل العمود الفقري.", imageSrc: injuryLowerBackImg },
  { id: "ankle", title: "إصابة في الكاحل", description: "مثل التواء الكاحل، تمزق الأربطة، أو التهاب الأوتار.", imageSrc: injuryAnkleImg },
  { id: "elbow", title: "إصابة في المرفق", description: "مثل التهاب أوتار المرفق (مرفق التنس أو الجولف) أو الألم المزمن.", imageSrc: injuryElbowImg },
];

function InjuryRow({
  option,
  selected,
  onToggle,
}: {
  option: InjuryOption;
  selected: boolean;
  onToggle: () => void;
}) {
  const isNone = option.id === "none";
  const active = selected;
  const accent = isNone ? GREEN : ORANGE;
  const border = active ? accent : "#E5E7EB";
  const bg = active
    ? isNone
      ? "linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)"
      : "linear-gradient(135deg, #FFF7F0 0%, #FFFFFF 100%)"
    : "#FFFFFF";

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-2xl p-3 text-right transition-transform active:scale-[0.99]"
      style={{
        border: `1.5px solid ${border}`,
        background: bg,
        boxShadow: active ? `0 10px 24px -14px ${isNone ? "rgba(34,197,94,0.35)" : "rgba(255,107,0,0.28)"}` : "0 4px 14px -12px rgba(15,23,42,0.06)",
      }}
    >
      <div className="min-w-0 flex-1">
        <h3
          className="text-[13px] font-black leading-snug"
          style={{ color: active && isNone ? GREEN : TEXT }}
        >
          {option.title}
        </h3>
        <p
          className="mt-1 text-[11px] leading-[1.55]"
          style={{ color: active && isNone ? "#16A34A" : "#64748B" }}
        >
          {option.description}
        </p>
      </div>

      <div className="grid h-[72px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-xl bg-[#FAFAFA] ring-1 ring-black/[0.04]">
        <img
          src={option.imageSrc}
          alt=""
          loading="lazy"
          className="h-full w-full object-contain p-1"
          draggable={false}
        />
      </div>

      <span
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full border"
        style={{
          borderColor: active ? accent : "#D1D5DB",
          background: active ? accent : "#FFFFFF",
        }}
      >
        {active ? <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} /> : null}
      </span>
    </button>
  );
}

type InjuriesScreenProps = {
  initialValue?: InjuryId[];
  onBack: () => void;
  onNext: (injuries: InjuryId[]) => void;
};

export function InjuriesScreen({ initialValue, onBack, onNext }: InjuriesScreenProps) {
  const [selected, setSelected] = useState<InjuryId[]>(initialValue?.length ? initialValue : ["none"]);

  useEffect(() => {
    if (initialValue?.length) setSelected(initialValue);
  }, [initialValue]);

  function toggle(id: InjuryId) {
    triggerSelectionHaptic();
    if (id === "none") {
      setSelected(["none"]);
      return;
    }
    setSelected((prev) => {
      const withoutNone = prev.filter((item) => item !== "none");
      const next = withoutNone.includes(id)
        ? withoutNone.filter((item) => item !== id)
        : [...withoutNone, id];
      return next.length === 0 ? ["none"] : next;
    });
  }

  const canContinue = selected.length > 0;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-white animate-[fadeIn_.4s_ease-out]">
      <div className="relative flex h-full flex-col px-5 pt-5 pb-3">
        <QuizProgressHeader step="injuries" onBack={onBack} />

        <div className="mt-3 text-center">
          <h1 className="font-[Tajawal] text-[22px] font-black leading-snug" style={{ color: TEXT }}>
            هل تعاني من إحدى <span style={{ color: ORANGE }}>الإصابات</span> التالية؟
          </h1>
          <p className="mt-2 px-1 text-[12.5px] leading-relaxed text-neutral-500">
            اختر جميع الإصابات التي تنطبق عليك، أو اختر لا أعاني من أي إصابة.
          </p>
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-1">
          {INJURY_OPTIONS.map((option) => (
            <InjuryRow
              key={option.id}
              option={option}
              selected={selected.includes(option.id)}
              onToggle={() => toggle(option.id)}
            />
          ))}
        </div>

        <QuizImportantInfoNote
          layout="stacked"
          label="لماذا نسألك هذا السؤال؟"
          text="هذه المعلومات تساعدنا على تصميم برنامج آمن وفعّال يناسب حالتك الصحية ويجنبك أي تمارين قد تسبب لك الألم أو تفاقم الإصابة."
          delayMs={1200}
        />

        <button
          type="button"
          disabled={!canContinue}
          onClick={() => {
            triggerSelectionHaptic();
            window.setTimeout(() => onNext(selected), HAPTIC_NAV_DELAY_MS);
          }}
          className={`mt-2.5 w-full rounded-full py-4 text-base font-black text-white flex items-center justify-center gap-3 transition-all ${
            canContinue ? "active:scale-[0.98]" : "opacity-50 cursor-not-allowed"
          }`}
          style={{
            background: "linear-gradient(180deg,#FF8534,#FF6B00)",
            boxShadow: canContinue
              ? "0 14px 30px -10px rgba(255,107,0,0.55), 0 0 0 6px rgba(255,107,0,0.08)"
              : "none",
          }}
        >
          <span>متابعة</span>
          <ArrowLeft className="h-5 w-5" strokeWidth={2.6} />
        </button>

        <div className="mt-2 flex items-center justify-center gap-2 text-[11.5px] text-neutral-500">
          <Lock className="h-3.5 w-3.5" style={{ color: ORANGE }} />
          <span>معلوماتك تبقى خاصة وآمنة</span>
        </div>
      </div>

      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
    </div>
  );
}
