import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  Check,
  Lock,
  Dumbbell,
  Flame,
  PersonStanding,
  Trophy,
  Zap,
  TrendingUp,
  Target,
  Calendar,
  Heart,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { useRef } from "react";
import maleImg from "@/assets/quiz-male.jpg";
import femaleImg from "@/assets/quiz-female.jpg";
import gymBg from "@/assets/quiz-gym-bg.jpg";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "ابدأ تقييمك المجاني — Hakim Coaching" },
      { name: "description", content: "ابدأ تحليلك الشخصي المجاني للحصول على خطتك المخصصة." },
    ],
  }),
  component: QuizPage,
});

const FONT = "'Tajawal', sans-serif";
type Step = "loading" | "gender" | "goals" | "femaleGoals";

function QuizPage() {
  const [step, setStep] = useState<Step>("loading");

  return (
    <div
      dir="rtl"
      lang="ar"
      style={{ fontFamily: FONT, backgroundColor: "#FAF8F5" }}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden"
    >
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap"
      />
      {step === "loading" && <LoadingScreen onDone={() => setStep("gender")} />}
      {step === "gender" && <GenderScreen onSelect={(g) => setStep(g === "male" ? "goals" : "femaleGoals")} />}
      {step === "goals" && <GoalsScreen onBack={() => setStep("gender")} />}
      {step === "femaleGoals" && <FemaleGoalsScreen onBack={() => setStep("gender")} />}
    </div>
  );
}

function LoadingScreen({ onDone }: { onDone: () => void }) {
  const steps = ["تحليل الأهداف", "تخصيص الأسئلة", "إعداد الخطة المناسبة"];
  const [done, setDone] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setDone(1), 500),
      setTimeout(() => setDone(2), 1050),
      setTimeout(() => setDone(3), 1600),
      setTimeout(onDone, 2100),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-8 text-center animate-[fadeIn_.4s_ease-out]">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(255,107,0,0.12), transparent 60%), radial-gradient(ellipse at bottom, rgba(255,107,0,0.08), transparent 60%)",
        }}
      />
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur-2xl opacity-50" style={{ background: "#FF6B00" }} />
        <div
          className="relative grid place-items-center h-28 w-28 rounded-full shadow-[0_20px_60px_-15px_rgba(255,107,0,0.6)]"
          style={{ background: "linear-gradient(135deg,#FF8534,#FF6B00)" }}
        >
          <div
            className="absolute inset-0 rounded-full border-4 border-white/30 animate-[spin_2s_linear_infinite]"
            style={{ borderTopColor: "transparent", borderRightColor: "transparent" }}
          />
          <Dumbbell className="h-12 w-12 text-white" strokeWidth={2.4} />
        </div>
      </div>

      <h1 className="relative mt-10 text-2xl font-black text-neutral-900">جاري تجهيز تقييمك الشخصي</h1>
      <p className="relative mt-3 text-sm text-neutral-500 max-w-xs leading-loose">
        نقوم بتحليل بياناتك لإنشاء تجربة مخصصة بالكامل
      </p>

      <ul className="relative mt-10 space-y-3 w-full max-w-xs">
        {steps.map((s, i) => {
          const active = done > i;
          return (
            <li
              key={s}
              className={`flex items-center justify-end gap-3 rounded-2xl px-4 py-3 transition-all duration-500 ${
                active ? "bg-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.1)]" : "bg-white/40"
              }`}
              style={{ opacity: done >= i ? 1 : 0.4, transform: active ? "translateY(0)" : "translateY(4px)" }}
            >
              <span className="text-sm font-bold text-neutral-800">{s}</span>
              <span
                className={`grid h-6 w-6 place-items-center rounded-full transition-all ${active ? "scale-100" : "scale-90"}`}
                style={{ background: active ? "#FF6B00" : "#E5E5E5" }}
              >
                <Check className="h-3.5 w-3.5 text-white" strokeWidth={3.5} />
              </span>
            </li>
          );
        })}
      </ul>

      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
    </div>
  );
}

function ProgressHeader({ current, onBack }: { current: number; onBack?: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] ring-1 ring-black/5"
        >
          <ChevronLeft className="h-5 w-5 text-neutral-700" />
        </button>
        <div className="text-sm font-bold text-neutral-800">
          <span style={{ color: "#FF6B00" }}>{current}</span> من 10
        </div>
        <div className="w-10" />
      </div>
      <div className="mt-3 flex gap-1.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1.5 rounded-full"
            style={{ background: i < current ? "#FF6B00" : "rgba(0,0,0,0.1)" }}
          />
        ))}
      </div>
    </>
  );
}

function GymBackdrop() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${gymBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.3,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg,#FAF8F5 0%,rgba(250,248,245,0.75) 40%,rgba(250,248,245,0.9) 100%)",
        }}
      />
      {/* Decorative dots top-right */}
      <div className="absolute top-2 right-2 grid grid-cols-8 gap-1.5 opacity-30" style={{ direction: "ltr" }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <span key={i} className="h-1 w-1 rounded-full" style={{ background: "#FF6B00" }} />
        ))}
      </div>
    </>
  );
}

function GenderScreen({ onSelect }: { onSelect: (gender: "male" | "female") => void }) {
  return (
    <div className="relative w-full h-full flex flex-col animate-[fadeIn_.5s_ease-out]">
      <GymBackdrop />
      <div className="relative flex flex-col h-full px-5 pt-3 pb-3">
        <ProgressHeader current={2} />
        <div className="mt-5 text-center">
          <p className="text-base font-bold text-neutral-800">لنخصص رحلتك 👇</p>
          <h1 className="mt-2 text-3xl font-black text-neutral-900 leading-tight">
            ما هو <span style={{ color: "#FF6B00" }}>جنسك</span> ؟
          </h1>
          <p className="mt-2 text-[13px] text-neutral-500 leading-relaxed px-4">
            سنخصص الأسئلة والخطة بناء على هدفك وطبيعة جسمك.
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 flex-1 min-h-0">
          <GenderCard
            image={maleImg}
            label="ذكر"
            color="#2563EB"
            tintFrom="#EFF6FF"
            tintTo="#FFFFFF"
            symbol="♂"
            onClick={() => onSelect("male")}
            features={[
              { Icon: Dumbbell, text: "بناء عضلات" },
              { Icon: Flame, text: "خسارة الدهون" },
              { Icon: PersonStanding, text: "جسم رياضي" },
            ]}
          />
          <GenderCard
            image={femaleImg}
            label="أنثى"
            color="#F472B6"
            tintFrom="#FDF2F8"
            tintTo="#FFFFFF"
            symbol="♀"
            onClick={() => onSelect("female")}
            features={[
              { Icon: Dumbbell, text: "شد الجسم" },
              { Icon: Flame, text: "خصر أنحف" },
              { Icon: PersonStanding, text: "جسم متناسق" },
            ]}
          />
        </div>
        <div className="mt-3 rounded-2xl bg-white/70 backdrop-blur ring-1 ring-black/5 px-4 py-3 flex items-center justify-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: "#FF6B00" }}>
            <Lock className="h-3.5 w-3.5 text-white" />
          </span>
          <p className="text-[12px] text-neutral-700 font-medium">
            اختيارك يساعدني على بناء <span className="font-bold" style={{ color: "#FF6B00" }}>تجربة مناسبة</span> لك.
          </p>
        </div>
      </div>
    </div>
  );
}

type Feature = { Icon: typeof Dumbbell; text: string };

function GenderCard({
  image, label, color, tintFrom, tintTo, symbol, features, onClick,
}: {
  image: string; label: string; color: string; tintFrom: string; tintTo: string;
  symbol: string; features: Feature[]; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col rounded-3xl overflow-hidden bg-white ring-1 ring-black/5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.15)] active:scale-[0.98] transition-transform"
      style={{ background: `linear-gradient(180deg,${tintFrom},${tintTo})` }}
    >
      <div className="relative w-full" style={{ aspectRatio: "1/1.15" }}>
        <img src={image} alt={label} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute top-3 right-3 grid grid-cols-6 gap-1 opacity-40" style={{ direction: "ltr" }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <span key={i} className="h-1 w-1 rounded-full" style={{ background: color }} />
          ))}
        </div>
        <div
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 grid h-12 w-12 place-items-center rounded-full ring-4 ring-white shadow-lg"
          style={{ background: color }}
        >
          <span className="text-white text-xl font-black leading-none">{symbol}</span>
        </div>
      </div>
      <div className="px-3 pt-7 pb-4 flex-1 flex flex-col">
        <h3 className="text-center text-xl font-black text-neutral-900">{label}</h3>
        <div className="mx-auto mt-1.5 h-[2px] w-8 rounded-full" style={{ background: color, opacity: 0.5 }} />
        <ul className="mt-3 space-y-2">
          {features.map((f) => (
            <li key={f.text} className="flex items-center justify-end gap-2 text-[12px] text-neutral-800 font-medium">
              <span>{f.text}</span>
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg" style={{ background: `${color}1A`, color }}>
                <f.Icon className="h-3 w-3" strokeWidth={2.4} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </button>
  );
}

/* ===================== GOALS SCREEN ===================== */

type Goal = { id: string; label: string; Icon: typeof Dumbbell };

const GOALS: Goal[] = [
  { id: "muscle", label: "بناء العضلات", Icon: Dumbbell },
  { id: "fat", label: "خسارة الدهون", Icon: Flame },
  { id: "athletic", label: "جسم رياضي ومتناسق", Icon: Trophy },
  { id: "fitness", label: "تحسين اللياقة والطاقة", Icon: Zap },
  { id: "gain", label: "زيادة وزن صحي", Icon: TrendingUp },
  { id: "shape", label: "تغيير شكل الجسم", Icon: Target },
];

function GoalsScreen({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState<string>("muscle");

  return (
    <div className="relative w-full h-full flex flex-col animate-[fadeIn_.5s_ease-out]">
      <GymBackdrop />

      <div className="relative flex flex-col h-full px-5 pt-3 pb-3">
        <ProgressHeader current={3} onBack={onBack} />

        {/* Hero */}
        <div className="mt-4 text-center">
          <p className="text-xl font-black" style={{ color: "#FF6B00" }}>
            ممتاز <span className="inline-block align-middle">🤩</span>
          </p>
          <h1 className="mt-1 text-[26px] font-black text-neutral-900 leading-tight">
            ما هو هدفك الأساسي؟
          </h1>
          <p className="mt-2 text-[13px] text-neutral-500 leading-relaxed px-6">
            اختر الهدف الأقرب لك وسأخصص خطتك بناءً عليه.
          </p>
        </div>

        {/* Grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 flex-1 min-h-0 content-stretch">
          {GOALS.map((g, i) => {
            const active = selected === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setSelected(g.id)}
                className="relative flex flex-col items-center justify-center rounded-3xl bg-white px-3 py-3 transition-all active:scale-[0.97]"
                style={{
                  boxShadow: active
                    ? "0 12px 30px -10px rgba(255,107,0,0.35), 0 0 0 2px #FF6B00 inset"
                    : "0 8px 20px -12px rgba(0,0,0,0.12)",
                  animation: `fadeUp .5s ease-out ${i * 70}ms both`,
                }}
              >
                {active && (
                  <span
                    className="absolute top-2 right-2 grid h-6 w-6 place-items-center rounded-full shadow"
                    style={{ background: "#FF6B00" }}
                  >
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3.5} />
                  </span>
                )}
                <span
                  className="grid place-items-center rounded-full"
                  style={{
                    height: 64,
                    width: 64,
                    background: "rgba(255,107,0,0.10)",
                  }}
                >
                  <g.Icon className="h-8 w-8" style={{ color: "#FF6B00" }} strokeWidth={2.4} />
                </span>
                <span className="mt-3 text-[14px] font-bold text-neutral-900 text-center leading-tight">
                  {g.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom badge */}
        <div className="mt-3 mx-auto rounded-full bg-white/80 backdrop-blur ring-1 ring-black/5 px-5 py-3 flex items-center justify-center gap-2 shadow-[0_8px_20px_-12px_rgba(0,0,0,0.1)]">
          <span className="text-base">🎯</span>
          <p className="text-[13px] font-bold text-neutral-800">كل هدف يحتاج خطة مختلفة</p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}

/* ===================== FEMALE GOALS SCREEN ===================== */

function FeminineBackdrop() {
  return (
    <>
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #FFF8F5 0%, #FFF0EC 50%, #FDF0EB 100%)" }} />
      <div className="absolute -left-16 top-1/4 w-60 h-72 rounded-full blur-3xl opacity-40" style={{ background: "#FFB5A7" }} />
      <div className="absolute -right-20 top-1/3 w-56 h-64 rounded-full blur-3xl opacity-30" style={{ background: "#FFD4C4" }} />
      <div className="absolute left-1/4 bottom-0 w-48 h-48 rounded-full blur-3xl opacity-25" style={{ background: "#FFC4B0" }} />
      <div className="absolute top-2 right-2 grid grid-cols-8 gap-1.5 opacity-20" style={{ direction: "ltr" }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <span key={i} className="h-1 w-1 rounded-full" style={{ background: "#FF6B00" }} />
        ))}
      </div>
    </>
  );
}

function PeachIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <radialGradient id="peachGrad" cx="30%" cy="30%">
          <stop offset="0%" stopColor="#FFBCA8" />
          <stop offset="100%" stopColor="#FF9E7D" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="27" r="14" fill="url(#peachGrad)" />
      <path d="M24 13 Q24 27 24 41" stroke="#E07050" strokeWidth="1.5" />
      <path d="M24 13 Q20 7 15 9" stroke="#7CB342" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function WaistIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <path d="M17 10 L31 10 L27 24 L31 38 L17 38 L21 24 Z" fill="#FFAB99" />
      <path d="M8 24 L18 24 M14 20 L18 24 L14 28" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 24 L40 24 M34 20 L30 24 L34 28" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FemaleBodyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <path d="M24 8 C27 8 29 11 29 13 C29 15 27 17 26 18 L30 38 L18 38 L22 18 C21 17 19 15 19 13 C19 11 21 8 24 8Z" fill="#FFAB99" />
      <path d="M12 14 L13 17 L16 18 L13 19 L12 22 L11 19 L8 18 L11 17 Z" fill="#FFB74D" />
      <path d="M36 12 L37 15 L40 16 L37 17 L36 20 L35 17 L32 16 L35 15 Z" fill="#FFB74D" />
    </svg>
  );
}

function TorsoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <path d="M18 10 L30 10 L28 20 L30 36 L18 36 L20 20 Z" fill="#FFAB99" />
      <path d="M10 32 L10 22 M8 26 L10 22 L12 26" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M38 32 L38 22 M36 26 L38 22 L40 26" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const FEMALE_GOALS = [
  { id: "fat", label: "خسارة الدهون", icon: <Flame className="h-7 w-7" style={{ color: "#FF6B00" }} strokeWidth={2.4} /> },
  { id: "glutes", label: "تكبير المؤخرة", icon: <PeachIcon className="h-7 w-7" /> },
  { id: "waist", label: "خصر أنحف ومشدود", icon: <WaistIcon className="h-7 w-7" /> },
  { id: "body", label: "جسم متناسق وأنثوي", icon: <FemaleBodyIcon className="h-7 w-7" /> },
  { id: "fit", label: "جسم صحي ورياضي", icon: <Dumbbell className="h-7 w-7" style={{ color: "#F472B6" }} strokeWidth={2.4} /> },
  { id: "tone", label: "شد الجسم ونحته", icon: <TorsoIcon className="h-7 w-7" /> },
];

function FemaleGoalsScreen({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="relative w-full h-full flex flex-col animate-[fadeIn_.5s_ease-out]">
      <FeminineBackdrop />
      <div className="relative flex flex-col h-full px-5 pt-3 pb-3">
        <ProgressHeader current={3} onBack={onBack} />

        {/* Hero */}
        <div className="mt-3 text-center">
          <p className="text-lg font-black" style={{ color: "#FF6B00" }}>
            ممتاز <span className="inline-block align-middle">✨</span>
          </p>
          <h1 className="mt-1 text-[24px] font-black text-neutral-900 leading-tight">
            ما هو هدفك الأساسي؟
          </h1>
          <p className="mt-2 text-[12px] text-neutral-500 leading-relaxed px-4">
            اختاري الهدف الأقرب لك وسأخصص خطتك بناء عليه.
          </p>
        </div>

        {/* Grid */}
        <div className="mt-3 grid grid-cols-2 gap-3 flex-1 min-h-0 content-stretch">
          {FEMALE_GOALS.map((g, i) => {
            const active = selected === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setSelected(g.id)}
                className="relative flex flex-col items-center justify-center rounded-3xl bg-white px-2 py-4 transition-all active:scale-[0.97]"
                style={{
                  boxShadow: active
                    ? "0 12px 30px -10px rgba(255,107,0,0.35), 0 0 0 2px #FF6B00 inset"
                    : "0 8px 20px -12px rgba(0,0,0,0.12)",
                  animation: `fadeUp .5s ease-out ${i * 70}ms both`,
                }}
              >
                {active && (
                  <span
                    className="absolute top-2 right-2 grid h-6 w-6 place-items-center rounded-full shadow"
                    style={{ background: "#FF6B00" }}
                  >
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3.5} />
                  </span>
                )}
                <span
                  className="grid place-items-center rounded-full"
                  style={{
                    height: 56,
                    width: 56,
                    background: "rgba(255,107,0,0.08)",
                  }}
                >
                  {g.icon}
                </span>
                <span className="mt-2 text-[13px] font-bold text-neutral-900 text-center leading-tight px-1">
                  {g.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom badge */}
        <div className="mt-3 mx-auto rounded-full bg-white/80 backdrop-blur ring-1 ring-black/5 px-5 py-3 flex items-center justify-center gap-2 shadow-[0_8px_20px_-12px_rgba(0,0,0,0.1)]">
          <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: "#FF6B00" }}>
            <Lock className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </span>
          <p className="text-[12px] font-bold text-neutral-800">كل هدف يحتاج خطة مختلفة</p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}
