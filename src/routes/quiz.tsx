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
  Ruler,
  Scale,
  Lightbulb,
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
type Step = "loading" | "gender" | "goals" | "femaleGoals" | "age" | "measure" | "activity" | "challenge" | "femaleChallenge" | "location" | "investment" | "bodyType" | "femaleBodyType" | "analysis";

function QuizPage() {
  const [step, setStep] = useState<Step>("loading");
  const [gender, setGender] = useState<"male" | "female" | null>(null);

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
      {step === "gender" && <GenderScreen onSelect={(g) => { setGender(g); setStep(g === "male" ? "goals" : "femaleGoals"); }} />}
      {step === "goals" && <GoalsScreen onBack={() => setStep("gender")} onNext={() => setStep("age")} />}
      {step === "femaleGoals" && <FemaleGoalsScreen onBack={() => setStep("gender")} onNext={() => setStep("age")} />}
      {step === "age" && <AgeScreen onBack={() => setStep("gender")} onNext={() => setStep("measure")} />}
      {step === "measure" && <MeasureScreen onBack={() => setStep("age")} onNext={() => setStep("activity")} />}
      {step === "activity" && <ActivityScreen onBack={() => setStep("measure")} onNext={() => setStep(gender === "female" ? "femaleChallenge" : "challenge")} />}
      {step === "challenge" && <ChallengeScreen onBack={() => setStep("activity")} onNext={() => setStep("location")} />}
      {step === "femaleChallenge" && <FemaleChallengeScreen onBack={() => setStep("activity")} onNext={() => setStep("location")} />}
      {step === "location" && <LocationScreen onBack={() => setStep(gender === "female" ? "femaleChallenge" : "challenge")} onNext={() => setStep("investment")} />}
      {step === "investment" && <InvestmentScreen onBack={() => setStep("location")} onNext={() => setStep(gender === "female" ? "femaleBodyType" : "bodyType")} />}
      {step === "bodyType" && <BodyTypeScreen onBack={() => setStep("investment")} onNext={() => {}} />}
      {step === "femaleBodyType" && <FemaleBodyTypeScreen onBack={() => setStep("investment")} onNext={() => {}} />}
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

function GoalsScreen({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [selected, setSelected] = useState<string>("muscle");
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (!touched) return;
    const t = setTimeout(onNext, 350);
    return () => clearTimeout(t);
  }, [touched, selected, onNext]);



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
                onClick={() => { setSelected(g.id); setTouched(true); }}
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

function FemaleGoalsScreen({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    if (!selected) return;
    const t = setTimeout(onNext, 350);
    return () => clearTimeout(t);
  }, [selected, onNext]);



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

/* ===================== AGE SCREEN ===================== */

const AGES = Array.from({ length: 80 - 14 + 1 }, (_, i) => 14 + i);
const ITEM_H = 56;

function AgeScreen({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [age, setAge] = useState(24);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const snapTimer = useRef<number | null>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = (24 - 14) * ITEM_H;
  }, []);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / ITEM_H);
    const next = AGES[Math.max(0, Math.min(AGES.length - 1, idx))];
    if (next !== age) setAge(next);
    if (snapTimer.current) window.clearTimeout(snapTimer.current);
    snapTimer.current = window.setTimeout(() => {
      el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
    }, 90);
  };

  return (
    <div className="relative w-full h-full flex flex-col animate-[fadeIn_.5s_ease-out]">
      <GymBackdrop />
      <div className="relative flex flex-col h-full px-5 pt-3 pb-3">
        <ProgressHeader current={4} onBack={onBack} />

        {/* Hero */}
        <div className="mt-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5" style={{ color: "#FFB547", fill: "#FFB547" }} />
            <p className="text-2xl font-black" style={{ color: "#FF6B00" }}>رائع</p>
          </div>
          <h1 className="mt-2 text-[24px] font-black text-neutral-900 leading-tight">
            ما هو عمرك الحالي؟
          </h1>
          <p className="mt-2 text-[12.5px] text-neutral-500 leading-relaxed px-6">
            اختر عمرك للحصول على خطة مناسبة لمرحلتك.
          </p>
        </div>

        {/* Picker card */}
        <div className="relative mt-5 mx-1 flex-1 min-h-0 flex flex-col">
          <div
            className="relative rounded-[28px] bg-white/85 backdrop-blur-sm ring-1 ring-black/5 flex-1 min-h-0"
            style={{ boxShadow: "0 20px 50px -25px rgba(255,107,0,0.25), 0 10px 30px -15px rgba(0,0,0,0.08)" }}
          >
            {/* floating calendar badge */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 grid h-12 w-12 place-items-center rounded-full bg-white ring-1 ring-black/5"
              style={{ boxShadow: "0 8px 20px -8px rgba(255,107,0,0.4)" }}>
              <Calendar className="h-5 w-5" style={{ color: "#FF6B00" }} strokeWidth={2.4} />
            </div>

            {/* Wheel */}
            <div className="relative h-full overflow-hidden rounded-[28px] pt-4">
              {/* Selected band lines */}
              <div className="pointer-events-none absolute left-4 right-4 top-1/2 -translate-y-1/2 z-10" style={{ height: ITEM_H }}>
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: "rgba(255,107,0,0.35)" }} />
                <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: "rgba(255,107,0,0.35)" }} />
                {/* سنة label */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-base font-medium text-neutral-400">سنة</div>
              </div>

              {/* Top/bottom fade overlays */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 z-20"
                style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,255,255,0))" }} />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 z-20"
                style={{ background: "linear-gradient(0deg,rgba(255,255,255,0.95),rgba(255,255,255,0))" }} />

              <div
                ref={scrollerRef}
                onScroll={onScroll}
                className="h-full overflow-y-scroll scrollbar-none"
                style={{ scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch", paddingTop: "calc(50% - 28px)", paddingBottom: "calc(50% - 28px)" }}
              >
                {AGES.map((n) => {
                  const dist = Math.abs(n - age);
                  const active = n === age;
                  const opacity = active ? 1 : Math.max(0.15, 1 - dist * 0.28);
                  const scale = active ? 1 : Math.max(0.75, 1 - dist * 0.08);
                  return (
                    <div
                      key={n}
                      style={{
                        height: ITEM_H,
                        scrollSnapAlign: "center",
                        opacity,
                        transform: `scale(${scale})`,
                        transition: "opacity .2s, transform .2s, color .2s",
                        color: active ? "#0A0A0A" : "#9CA3AF",
                        fontWeight: active ? 900 : 600,
                        fontSize: active ? 32 : 24,
                      }}
                      className="flex items-center justify-center leading-none"
                    >
                      {n}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Info card */}
        <div className="mt-4 rounded-3xl bg-white/70 backdrop-blur ring-1 ring-black/5 px-4 py-3 flex items-center gap-3"
          style={{ boxShadow: "0 8px 20px -12px rgba(0,0,0,0.08)" }}>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white shrink-0"
            style={{ boxShadow: "0 6px 14px -6px rgba(255,107,0,0.4)" }}>
            <Heart className="h-5 w-5" style={{ color: "#FF6B00" }} strokeWidth={2.4} />
          </span>
          <div className="flex-1 text-right">
            <p className="text-[13px] font-extrabold" style={{ color: "#FF6B00" }}>العمر مجرد رقم...</p>
            <p className="text-[12px] text-neutral-700 font-medium mt-0.5">الالتزام هو ما يصنع الفارق الحقيقي 💪</p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onNext}
          className="mt-3 w-full rounded-full py-4 text-white text-base font-black flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
          style={{
            background: "linear-gradient(180deg,#FF8534,#FF6B00)",
            boxShadow: "0 14px 30px -10px rgba(255,107,0,0.55), 0 0 0 6px rgba(255,107,0,0.08)",
          }}
        >
          <span>متابعة</span>
          <ArrowLeft className="h-5 w-5" strokeWidth={2.6} />
        </button>

        <div className="mt-2 flex items-center justify-center gap-2 text-[11.5px] text-neutral-500">
          <Lock className="h-3.5 w-3.5" style={{ color: "#FF6B00" }} />
          <span>معلوماتك تبقى خاصة وآمنة</span>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .scrollbar-none::-webkit-scrollbar{display:none}
        .scrollbar-none{scrollbar-width:none;-ms-overflow-style:none}
      `}</style>
    </div>
  );
}

/* ===================== MEASURE SCREEN ===================== */

const ITEM_W = 88;

function HorizontalWheel({
  min, max, value, unit, onChange,
}: { min: number; max: number; value: number; unit: string; onChange: (v: number) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const snap = useRef<number | null>(null);
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollLeft = (value - min) * ITEM_W;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handle = () => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / ITEM_W);
    const v = values[Math.max(0, Math.min(values.length - 1, idx))];
    if (v !== value) onChange(v);
    if (snap.current) window.clearTimeout(snap.current);
    snap.current = window.setTimeout(() => {
      el.scrollTo({ left: idx * ITEM_W, behavior: "smooth" });
    }, 90);
  };

  return (
    <div className="relative h-[88px]" dir="ltr">
      {/* center underline accents */}
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-2 z-10 flex flex-col items-center gap-1" style={{ width: ITEM_W }}>
        <div className="h-[2px] w-12 rounded-full" style={{ background: "#FF6B00" }} />
      </div>
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 z-10" style={{ width: ITEM_W }}>
        <div className="h-[2px] w-full rounded-full" style={{ background: "rgba(255,107,0,0.6)" }} />
      </div>
      {/* fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 z-20" style={{ background: "linear-gradient(90deg,#fff,rgba(255,255,255,0))" }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 z-20" style={{ background: "linear-gradient(270deg,#fff,rgba(255,255,255,0))" }} />

      <div
        ref={ref}
        onScroll={handle}
        className="h-full overflow-x-scroll scrollbar-none flex items-center"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", paddingLeft: `calc(50% - ${ITEM_W / 2}px)`, paddingRight: `calc(50% - ${ITEM_W / 2}px)` }}
      >
        {values.map((n) => {
          const dist = Math.abs(n - value);
          const active = n === value;
          const opacity = active ? 1 : Math.max(0.2, 1 - dist * 0.25);
          const scale = active ? 1 : Math.max(0.7, 1 - dist * 0.1);
          return (
            <div
              key={n}
              style={{
                width: ITEM_W,
                scrollSnapAlign: "center",
                opacity,
                transform: `scale(${scale})`,
                transition: "opacity .2s, transform .2s",
              }}
              className="shrink-0 flex flex-col items-center justify-center"
            >
              <span style={{
                color: active ? "#FF6B00" : "#9CA3AF",
                fontWeight: active ? 900 : 600,
                fontSize: active ? 34 : 22,
                lineHeight: 1,
              }}>{n}</span>
              {active && (
                <span className="mt-1 text-[12px] font-bold" style={{ color: "#FF6B00" }}>{unit}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MeasureScreen({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [height, setHeight] = useState(164);
  const [weight, setWeight] = useState(63);

  return (
    <div className="relative w-full h-full flex flex-col animate-[fadeIn_.5s_ease-out]">
      <GymBackdrop />
      <div className="relative flex flex-col h-full px-5 pt-3 pb-3">
        <ProgressHeader current={5} onBack={onBack} />

        {/* Hero */}
        <div className="mt-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl">📏</span>
            <p className="text-xl font-black" style={{ color: "#FF6B00" }}>ممتاز</p>
          </div>
          <h1 className="mt-1 text-[22px] font-black text-neutral-900 leading-tight">
            ما هو طوله و وزنك الحالي؟
          </h1>
          <p className="mt-1.5 text-[12px] text-neutral-500 leading-relaxed px-6">
            أدخلي معلوماتك بدقة لتحصلي على خطة مخصصة لك.
          </p>
        </div>

        {/* Cards */}
        <div className="flex-1 min-h-0 flex flex-col justify-center gap-5 mt-6">
          <MeasureCard
            icon={<Ruler className="h-5 w-5" style={{ color: "#FF6B00" }} strokeWidth={2.4} />}
            label="الطول (سم)"
          >
            <HorizontalWheel min={130} max={230} value={height} unit="سم" onChange={setHeight} />
          </MeasureCard>

          <MeasureCard
            icon={<Scale className="h-5 w-5" style={{ color: "#FF6B00" }} strokeWidth={2.4} />}
            label="الوزن (كجم)"
          >
            <HorizontalWheel min={35} max={250} value={weight} unit="كجم" onChange={setWeight} />
          </MeasureCard>
        </div>

        {/* Tip */}
        <div className="mt-4 rounded-3xl bg-white/70 backdrop-blur ring-1 ring-black/5 px-4 py-3 flex items-center gap-3"
          style={{ boxShadow: "0 8px 20px -12px rgba(0,0,0,0.08)" }}>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white shrink-0"
            style={{ boxShadow: "0 6px 14px -6px rgba(255,107,0,0.4)" }}>
            <Lightbulb className="h-5 w-5" style={{ color: "#FF6B00" }} strokeWidth={2.4} />
          </span>
          <div className="flex-1 text-right">
            <p className="text-[13px] font-extrabold" style={{ color: "#FF6B00" }}>نصيحة مهمة</p>
            <p className="text-[11.5px] text-neutral-700 font-medium mt-0.5 leading-relaxed">
              كلما كانت المعلومات دقيقة، كانت خطتك أكثر فعالية ونتائجك أسرع.
            </p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onNext}
          className="mt-3 w-full rounded-full py-4 text-white text-base font-black flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
          style={{
            background: "linear-gradient(180deg,#FF8534,#FF6B00)",
            boxShadow: "0 14px 30px -10px rgba(255,107,0,0.55), 0 0 0 6px rgba(255,107,0,0.08)",
          }}
        >
          <span>متابعة</span>
          <ArrowLeft className="h-5 w-5" strokeWidth={2.6} />
        </button>

        <div className="mt-2 flex items-center justify-center gap-2 text-[11.5px] text-neutral-500">
          <Lock className="h-3.5 w-3.5" style={{ color: "#FF6B00" }} />
          <span>معلوماتك تبقى خاصة وآمنة</span>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .scrollbar-none::-webkit-scrollbar{display:none}
        .scrollbar-none{scrollbar-width:none;-ms-overflow-style:none}
      `}</style>
    </div>
  );
}

function MeasureCard({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10 grid h-11 w-11 place-items-center rounded-full bg-white ring-1 ring-black/5"
        style={{ boxShadow: "0 6px 16px -6px rgba(255,107,0,0.4)" }}>
        {icon}
      </div>
      <div className="rounded-[28px] bg-white/90 backdrop-blur-sm ring-1 ring-black/5 pt-7 pb-3 px-2"
        style={{ boxShadow: "0 18px 40px -25px rgba(255,107,0,0.25), 0 8px 24px -15px rgba(0,0,0,0.08)" }}>
        <p className="text-center text-[13px] font-bold text-neutral-700">{label}</p>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}

/* ===================== ACTIVITY SCREEN ===================== */

function SofaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <rect x="4" y="20" width="40" height="16" rx="6" fill="#FF6B00" opacity="0.15" />
      <path d="M8 24 L8 32 M8 24 C8 20 12 18 16 18 L32 18 C36 18 40 20 40 24 L40 32" stroke="#FF6B00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M8 28 L40 28" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M14 32 L14 36 M34 32 L34 36" stroke="#FF6B00" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function WalkingIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="10" r="5" fill="#FF6B00" opacity="0.9" />
      <path d="M24 16 L24 26 M24 26 L18 34 M24 26 L30 34 M20 20 L28 20" stroke="#FF6B00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 34 L16 42 M30 34 L32 42" stroke="#FF6B00" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function SneakerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <path d="M8 32 C8 28 14 26 20 26 L32 26 C38 26 42 28 42 32 L42 36 L8 36 Z" fill="#FF6B00" opacity="0.15" />
      <path d="M8 36 L42 36" stroke="#FF6B00" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M10 36 L14 26 C16 22 22 22 26 24 L34 28 L40 30" stroke="#FF6B00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M18 30 L30 30" stroke="#FF6B00" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

const ACTIVITIES = [
  {
    id: "sedentary",
    label: "خامل تماماً",
    desc: "لا أمارس أي نشاط بدني وأقضي معظم وقتي جالساً.",
    icon: <SofaIcon className="h-8 w-8" />,
  },
  {
    id: "light",
    label: "نشاط خفيف",
    desc: "أتحرك قليلاً في يومي (مثل المشي الخفيف).",
    icon: <WalkingIcon className="h-8 w-8" />,
  },
  {
    id: "moderate",
    label: "نشاط متوسط",
    desc: "أمارس التمارين 1 - 3 مرات في الأسبوع.",
    icon: <SneakerIcon className="h-8 w-8" />,
  },
  {
    id: "high",
    label: "نشاط عالي",
    desc: "أمارس التمارين 3 - 5 مرات في الأسبوع.",
    icon: <Dumbbell className="h-8 w-8" style={{ color: "#FF6B00" }} strokeWidth={2.4} />,
  },
  {
    id: "veryhigh",
    label: "نشاط عالي جداً",
    desc: "أمارس التمارين 6 - 7 مرات في الأسبوع.",
    icon: <Flame className="h-8 w-8" style={{ color: "#FF6B00" }} strokeWidth={2.4} />,
  },
  {
    id: "athlete",
    label: "رياضي محترف",
    desc: "أتمرن يومياً أو لدي نشاط رياضي مكثف جداً.",
    icon: <Trophy className="h-8 w-8" style={{ color: "#FF6B00" }} strokeWidth={2.4} />,
  },
];

function ActivityScreen({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="relative w-full h-full flex flex-col animate-[fadeIn_.5s_ease-out]">
      <GymBackdrop />
      <div className="relative flex flex-col h-full px-5 pt-3 pb-3">
        <ProgressHeader current={6} onBack={onBack} />

        {/* Hero */}
        <div className="mt-3 text-center">
          <p className="text-xl font-black" style={{ color: "#FF6B00" }}>
            ممتاز <span className="inline-block align-middle">🏃</span>
          </p>
          <h1 className="mt-1 text-[24px] font-black text-neutral-900 leading-tight">
            ما هو مستوى نشاطك الحالي؟
          </h1>
          <p className="mt-2 text-[12.5px] text-neutral-500 leading-relaxed px-2">
            اختر المستوى الأقرب لحالتك اليومية لنصمم لك خطة مناسبة لواقعك.
          </p>
        </div>

        {/* Grid */}
        <div className="mt-3 grid grid-cols-2 gap-2.5 flex-1 min-h-0 content-stretch">
          {ACTIVITIES.map((a, i) => {
            const active = selected === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setSelected(a.id)}
                className="relative flex flex-col items-center justify-center rounded-[20px] bg-white px-2 py-2.5 transition-all active:scale-[0.97]"
                style={{
                  boxShadow: active
                    ? "0 12px 30px -10px rgba(255,107,0,0.35), 0 0 0 2px #FF6B00 inset"
                    : "0 8px 20px -12px rgba(0,0,0,0.12)",
                  transform: active ? "scale(1.03)" : "scale(1)",
                  animation: `fadeUp .5s ease-out ${i * 60}ms both`,
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
                    background: "rgba(255,107,0,0.10)",
                  }}
                >
                  {a.icon}
                </span>
                <span className="mt-2 text-[13px] font-black text-neutral-900 text-center leading-tight">
                  {a.label}
                </span>
                <span className="mt-1 text-[10.5px] text-neutral-500 text-center leading-snug px-1">
                  {a.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom info card */}
        <div
          className="mt-2.5 rounded-2xl bg-white/80 backdrop-blur ring-1 ring-black/5 px-4 py-3 flex items-center gap-3"
          style={{ boxShadow: "0 8px 20px -12px rgba(0,0,0,0.1)" }}
        >
          <span
            className="grid h-10 w-10 place-items-center rounded-full bg-white shrink-0"
            style={{ boxShadow: "0 6px 14px -6px rgba(255,107,0,0.4)" }}
          >
            <Lightbulb className="h-5 w-5" style={{ color: "#FF6B00" }} strokeWidth={2.4} />
          </span>
          <div className="flex-1 text-right">
            <p className="text-[13px] font-extrabold" style={{ color: "#FF6B00" }}>
              معلومة مهمة
            </p>
            <p className="text-[11.5px] text-neutral-700 font-medium mt-0.5 leading-relaxed">
              اختيارك الصحيح يساعدنا في تصميم خطة فعالة وآمنة لك.
            </p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onNext}
          disabled={!selected}
          className={`mt-2.5 w-full rounded-full py-4 text-white text-base font-black flex items-center justify-center gap-3 transition-all ${selected ? "active:scale-[0.98]" : "opacity-50 cursor-not-allowed"}`}
          style={{
            background: "linear-gradient(180deg,#FF8534,#FF6B00)",
            boxShadow: selected
              ? "0 14px 30px -10px rgba(255,107,0,0.55), 0 0 0 6px rgba(255,107,0,0.08)"
              : "none",
          }}
        >
          <span>متابعة</span>
          <ArrowLeft className="h-5 w-5" strokeWidth={2.6} />
        </button>

        <div className="mt-2 flex items-center justify-center gap-2 text-[11.5px] text-neutral-500">
          <Lock className="h-3.5 w-3.5" style={{ color: "#FF6B00" }} />
          <span>معلوماتك تبقى خاصة وآمنة</span>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}

/* ===================== MEN'S CHALLENGE SCREEN (STEP 7) ===================== */

function MaleAbsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id="absG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFBCA8" />
          <stop offset="100%" stopColor="#FF9E7D" />
        </linearGradient>
      </defs>
      <path d="M15 8 C15 6 19 4 24 4 C29 4 33 6 33 8 L35 18 L33 38 L15 38 L13 18 Z" fill="url(#absG)" />
      <path d="M18 14 L30 14 M18 20 L30 20 M18 26 L30 26 M24 14 L24 32" stroke="#C45E3A" strokeWidth="1.2" opacity="0.5" />
      <path d="M20 10 C22 9 26 9 28 10" stroke="#C45E3A" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

function BicepIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id="bicepG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF9E7D" />
          <stop offset="100%" stopColor="#FF6B00" />
        </linearGradient>
      </defs>
      <path d="M12 32 C12 24 18 18 24 16 C30 18 36 24 36 32 C36 36 30 38 24 38 C18 38 12 36 12 32Z" fill="url(#bicepG)" />
      <path d="M18 24 C20 22 22 21 24 21 C26 21 28 22 30 24" stroke="#CC5500" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M14 28 C16 26 18 25 20 25" stroke="#CC5500" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function LowBatteryIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <rect x="8" y="14" width="28" height="16" rx="4" stroke="#FF6B00" strokeWidth="2.5" />
      <rect x="36" y="18" width="4" height="8" rx="1.5" fill="#FF6B00" />
      <rect x="12" y="18" width="10" height="8" rx="2" fill="#FF6B00" opacity="0.9" />
      <rect x="24" y="18" width="8" height="8" rx="2" fill="#FF6B00" opacity="0.2" />
    </svg>
  );
}

function BullseyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="24" r="14" stroke="#FF6B00" strokeWidth="2.5" opacity="0.25" />
      <circle cx="24" cy="24" r="9" stroke="#FF6B00" strokeWidth="2.5" opacity="0.5" />
      <circle cx="24" cy="24" r="4" fill="#FF6B00" opacity="0.9" />
      <path d="M34 14 L38 10 M38 10 L38 16 M38 10 L32 10" stroke="#FF6B00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 24 L36 12" stroke="#FF6B00" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.4" />
    </svg>
  );
}

function BrainIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id="brainG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFAB99" />
          <stop offset="100%" stopColor="#FF8A70" />
        </linearGradient>
      </defs>
      <path d="M12 24 C12 16 18 10 24 10 C30 10 36 16 36 24 C36 30 32 36 24 38 C16 36 12 30 12 24Z" fill="url(#brainG)" />
      <path d="M18 18 C20 16 22 16 24 16 C26 16 28 16 30 18" stroke="#D46040" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <path d="M16 24 C18 22 20 22 22 22 M26 22 C28 22 30 22 32 24" stroke="#D46040" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <path d="M18 30 C20 28 22 28 24 28 C26 28 28 28 30 30" stroke="#D46040" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function SadFaceIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id="sadG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFB547" />
          <stop offset="100%" stopColor="#FF8534" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="16" fill="url(#sadG)" />
      <circle cx="18" cy="20" r="2.5" fill="#8B4513" opacity="0.7" />
      <circle cx="30" cy="20" r="2.5" fill="#8B4513" opacity="0.7" />
      <path d="M17 32 C20 28 28 28 31 32" stroke="#8B4513" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <path d="M12 16 C14 12 18 10 24 10 C30 10 34 12 36 16" stroke="#FF6B00" strokeWidth="1" opacity="0.2" fill="none" />
    </svg>
  );
}

const CHALLENGES = [
  {
    id: "belly",
    label: "دهون البطن",
    desc: "تراكم الدهون في منطقة البطن والكرش.",
    icon: <MaleAbsIcon className="h-8 w-8" />,
  },
  {
    id: "muscle",
    label: "صعوبة بناء العضلات",
    desc: "أجد صعوبة في زيادة الكتلة العضلية.",
    icon: <BicepIcon className="h-8 w-8" />,
  },
  {
    id: "energy",
    label: "قلة الطاقة والحيوية",
    desc: "أشعر بالتعب والخمول معظم الوقت.",
    icon: <LowBatteryIcon className="h-8 w-8" />,
  },
  {
    id: "goal",
    label: "عدم وضوح الهدف",
    desc: "ليس لدي هدف محدد أو خطة واضحة.",
    icon: <BullseyeIcon className="h-8 w-8" />,
  },
  {
    id: "commitment",
    label: "الالتزام والاستمرارية",
    desc: "أبدأ ثم أترك بسهولة ولا أستمر.",
    icon: <BrainIcon className="h-8 w-8" />,
  },
  {
    id: "confidence",
    label: "الثقة بالنفس والمظهر",
    desc: "غير راضٍ عن مظهري وأريد تغييراً حقيقياً.",
    icon: <SadFaceIcon className="h-8 w-8" />,
  },
];

function ChallengeScreen({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="relative w-full h-full flex flex-col animate-[fadeIn_.5s_ease-out]">
      <GymBackdrop />
      <div className="relative flex flex-col h-full px-5 pt-3 pb-3">
        <ProgressHeader current={7} onBack={onBack} />

        {/* Hero */}
        <div className="mt-3 text-center">
          <p className="text-xl font-black" style={{ color: "#FF6B00" }}>
            ممتاز <span className="inline-block align-middle">✨</span>
          </p>
          <h1 className="mt-1 text-[24px] font-black text-neutral-900 leading-tight">
            ما هي أكبر مشكلة تواجهك حالياً؟
          </h1>
          <p className="mt-2 text-[12.5px] text-neutral-500 leading-relaxed px-2">
            اختر التحدي الذي يؤثر عليك أكثر لنساعدك على التغلب عليه.
          </p>
        </div>

        {/* Grid */}
        <div className="mt-3 grid grid-cols-2 gap-2.5 flex-1 min-h-0 content-stretch">
          {CHALLENGES.map((c, i) => {
            const active = selected === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className="relative flex flex-col items-center justify-center rounded-[20px] bg-white px-2 py-3 transition-all active:scale-[0.97]"
                style={{
                  boxShadow: active
                    ? "0 12px 30px -10px rgba(255,107,0,0.35), 0 0 0 2px #FF6B00 inset"
                    : "0 8px 20px -12px rgba(0,0,0,0.12)",
                  transform: active ? "scale(1.03)" : "scale(1)",
                  animation: `fadeUp .5s ease-out ${i * 60}ms both`,
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
                    background: "rgba(255,107,0,0.10)",
                  }}
                >
                  {c.icon}
                </span>
                <span className="mt-2 text-[13px] font-black text-neutral-900 text-center leading-tight px-1">
                  {c.label}
                </span>
                <span className="mt-1 text-[10.5px] text-neutral-500 text-center leading-snug px-1">
                  {c.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom info card */}
        <div
          className="mt-2.5 rounded-2xl bg-white/80 backdrop-blur ring-1 ring-black/5 px-4 py-3 flex items-center gap-3"
          style={{ boxShadow: "0 8px 20px -12px rgba(0,0,0,0.1)" }}
        >
          <span
            className="grid h-10 w-10 place-items-center rounded-full bg-white shrink-0"
            style={{ boxShadow: "0 6px 14px -6px rgba(255,107,0,0.4)" }}
          >
            <Lightbulb className="h-5 w-5" style={{ color: "#FF6B00" }} strokeWidth={2.4} />
          </span>
          <div className="flex-1 text-right">
            <p className="text-[13px] font-extrabold" style={{ color: "#FF6B00" }}>
              معلومة مهمة
            </p>
            <p className="text-[11.5px] text-neutral-700 font-medium mt-0.5 leading-relaxed">
              معرفة أكبر تحدي لديك هي الخطوة الأولى للتغيير الحقيقي.
            </p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onNext}
          disabled={!selected}
          className={`mt-2.5 w-full rounded-full py-4 text-white text-base font-black flex items-center justify-center gap-3 transition-all ${selected ? "active:scale-[0.98]" : "opacity-50 cursor-not-allowed"}`}
          style={{
            background: "linear-gradient(180deg,#FF8534,#FF6B00)",
            boxShadow: selected
              ? "0 14px 30px -10px rgba(255,107,0,0.55), 0 0 0 6px rgba(255,107,0,0.08)"
              : "none",
          }}
        >
          <span>متابعة</span>
          <ArrowLeft className="h-5 w-5" strokeWidth={2.6} />
        </button>

        <div className="mt-2 flex items-center justify-center gap-2 text-[11.5px] text-neutral-500">
          <Lock className="h-3.5 w-3.5" style={{ color: "#FF6B00" }} />
          <span>معلوماتك تبقى خاصة وآمنة</span>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}

/* ===================== WOMEN'S CHALLENGE SCREEN (STEP 7) ===================== */

function FemaleWaistIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id="fwG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFBCA8" />
          <stop offset="100%" stopColor="#FF9E7D" />
        </linearGradient>
      </defs>
      {/* Female torso */}
      <path d="M18 6 C18 4 21 3 24 3 C27 3 30 4 30 6 L32 16 L30 34 L18 34 L16 16 Z" fill="url(#fwG)" />
      {/* Waist indentation */}
      <path d="M16 16 Q24 20 32 16" stroke="#E07050" strokeWidth="1.2" fill="none" opacity="0.5" />
      {/* Left arrow */}
      <path d="M6 22 L14 22 M10 18 L14 22 L10 26" stroke="#FF6B00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Right arrow */}
      <path d="M34 22 L42 22 M38 18 L34 22 L38 26" stroke="#FF6B00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots on belly */}
      <circle cx="24" cy="24" r="1.5" fill="#E07050" opacity="0.4" />
      <circle cx="22" cy="26" r="1" fill="#E07050" opacity="0.3" />
      <circle cx="26" cy="26" r="1" fill="#E07050" opacity="0.3" />
    </svg>
  );
}

function FemaleToneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id="ftG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFAB99" />
          <stop offset="100%" stopColor="#FF8A70" />
        </linearGradient>
      </defs>
      {/* Female body silhouette */}
      <path d="M24 6 C26 6 28 8 28 10 C28 12 27 13 26 14 L29 34 L19 34 L22 14 C21 13 20 12 20 10 C20 8 22 6 24 6Z" fill="url(#ftG)" />
      {/* Sparkles */}
      <path d="M10 14 L11 17 L14 18 L11 19 L10 22 L9 19 L6 18 L9 17 Z" fill="#FFB547" />
      <path d="M36 10 L37 13 L40 14 L37 15 L36 18 L35 15 L32 14 L35 13 Z" fill="#FFB547" />
      <path d="M38 26 L39 28 L41 29 L39 30 L38 32 L37 30 L35 29 L37 28 Z" fill="#FFB547" opacity="0.7" />
    </svg>
  );
}

function PinkScaleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id="psG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFBCA8" />
          <stop offset="100%" stopColor="#FF9E7D" />
        </linearGradient>
      </defs>
      {/* Scale base */}
      <rect x="10" y="32" width="28" height="6" rx="3" fill="url(#psG)" />
      {/* Scale platform */}
      <rect x="12" y="28" width="24" height="5" rx="2" fill="#FFAB99" />
      {/* Scale pillar */}
      <rect x="22" y="16" width="4" height="13" rx="1.5" fill="#FFAB99" />
      {/* Scale dial */}
      <circle cx="24" cy="14" r="8" fill="white" stroke="#FF9E7D" strokeWidth="2" />
      {/* Dial tick marks */}
      <path d="M24 8 L24 10 M24 18 L24 20 M18 14 L20 14 M28 14 L30 14" stroke="#FF9E7D" strokeWidth="1.2" strokeLinecap="round" />
      {/* Needle */}
      <path d="M24 14 L26 11" stroke="#FF6B00" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="24" cy="14" r="1.5" fill="#FF6B00" />
    </svg>
  );
}

function PinkSadFaceIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <radialGradient id="psfG" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#FFD1C4" />
          <stop offset="100%" stopColor="#FFAB99" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="16" fill="url(#psfG)" />
      {/* Left eye */}
      <circle cx="18" cy="20" r="2.5" fill="#C45E3A" opacity="0.7" />
      {/* Right eye */}
      <circle cx="30" cy="20" r="2.5" fill="#C45E3A" opacity="0.7" />
      {/* Frowning mouth */}
      <path d="M17 32 C20 28 28 28 31 32" stroke="#C45E3A" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      {/* Eyebrows (sad) */}
      <path d="M15 16 C17 15 19 16 20 17" stroke="#C45E3A" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      <path d="M28 17 C29 16 31 15 33 16" stroke="#C45E3A" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      {/* Cheek blush */}
      <circle cx="14" cy="26" r="3" fill="#FF6B00" opacity="0.08" />
      <circle cx="34" cy="26" r="3" fill="#FF6B00" opacity="0.08" />
    </svg>
  );
}

function CupcakeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <defs>
        <linearGradient id="ccG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFBCA8" />
          <stop offset="100%" stopColor="#FF9E7D" />
        </linearGradient>
      </defs>
      {/* Cupcake wrapper */}
      <path d="M12 28 L14 40 L34 40 L36 28 Z" fill="url(#ccG)" />
      {/* Wrapper lines */}
      <path d="M16 28 L17 40 M20 28 L21 40 M24 28 L24 40 M28 28 L27 40 M32 28 L31 40" stroke="#E07050" strokeWidth="0.8" opacity="0.4" />
      {/* Frosting */}
      <path d="M10 28 C10 22 14 18 18 20 C20 16 24 14 28 18 C32 14 38 18 38 28 Z" fill="#FFD1C4" />
      {/* Frosting swirl lines */}
      <path d="M14 24 C16 22 18 22 20 24 C22 22 24 22 26 24" stroke="#FFAB99" strokeWidth="1" strokeLinecap="round" opacity="0.5" fill="none" />
      {/* Cherry on top */}
      <circle cx="24" cy="16" r="3.5" fill="#FF6B00" />
      <path d="M24 12.5 C24 10 26 8 28 7" stroke="#7CB342" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Cherry highlight */}
      <circle cx="22.5" cy="14.8" r="1" fill="white" opacity="0.5" />
    </svg>
  );
}

const FEMALE_CHALLENGES = [
  {
    id: "belly",
    label: "الكرش والدهون البطن",
    desc: "تراكم الدهون في منطقة البطن وصعوبة التخلص منها.",
    icon: <FemaleWaistIcon className="h-8 w-8" />,
  },
  {
    id: "glutes",
    label: "شكل المؤخرة",
    desc: "أريد تكبير المؤخرة وشدها وتحسين شكلها.",
    icon: <PeachIcon className="h-8 w-8" />,
  },
  {
    id: "sagging",
    label: "ترهلات الجسم",
    desc: "ترهل الجلد وفقدان الشد بعد خسارة الوزن.",
    icon: <FemaleToneIcon className="h-8 w-8" />,
  },
  {
    id: "weight",
    label: "عدم نزول الوزن",
    desc: "أبذل مجهوداً لكن وزني لا ينخفض.",
    icon: <PinkScaleIcon className="h-8 w-8" />,
  },
  {
    id: "confidence",
    label: "الثقة بالنفس",
    desc: "أشعر بعدم الرضا عن مظهري وأريد أن أكون واثقة أكثر.",
    icon: <PinkSadFaceIcon className="h-8 w-8" />,
  },
  {
    id: "cravings",
    label: "الرغبة الشديدة في الأكل",
    desc: "أجد صعوبة في التحكم في شهيتي وخاصة الحلويات.",
    icon: <CupcakeIcon className="h-8 w-8" />,
  },
];

function FemaleChallengeScreen({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="relative w-full h-full flex flex-col animate-[fadeIn_.5s_ease-out]">
      <FeminineBackdrop />
      <div className="relative flex flex-col h-full px-5 pt-3 pb-3">
        <ProgressHeader current={7} onBack={onBack} />

        {/* Hero */}
        <div className="mt-3 text-center">
          <p className="text-xl font-black" style={{ color: "#FF6B00" }}>
            ممتاز <span className="inline-block align-middle">✨</span>
          </p>
          <h1 className="mt-1 text-[24px] font-black text-neutral-900 leading-tight">
            ما هي أكبر مشكلة تواجهك حالياً؟
          </h1>
          <p className="mt-2 text-[12.5px] text-neutral-500 leading-relaxed px-2">
            اختاري التحدي الذي يؤثر عليك أكثر لنساعدك على التغلب عليه.
          </p>
        </div>

        {/* Grid */}
        <div className="mt-3 grid grid-cols-2 gap-2.5 flex-1 min-h-0 content-stretch">
          {FEMALE_CHALLENGES.map((c, i) => {
            const active = selected === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className="relative flex flex-col items-center justify-center rounded-[20px] bg-white px-2 py-3 transition-all active:scale-[0.97]"
                style={{
                  boxShadow: active
                    ? "0 12px 30px -10px rgba(255,107,0,0.35), 0 0 0 2px #FF6B00 inset"
                    : "0 8px 20px -12px rgba(0,0,0,0.12)",
                  transform: active ? "scale(1.03)" : "scale(1)",
                  animation: `fadeUp .5s ease-out ${i * 60}ms both`,
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
                    background: "rgba(255,107,0,0.10)",
                  }}
                >
                  {c.icon}
                </span>
                <span className="mt-2 text-[13px] font-black text-neutral-900 text-center leading-tight px-1">
                  {c.label}
                </span>
                <span className="mt-1 text-[10.5px] text-neutral-500 text-center leading-snug px-1">
                  {c.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom info card */}
        <div
          className="mt-2.5 rounded-2xl bg-white/80 backdrop-blur ring-1 ring-black/5 px-4 py-3 flex items-center gap-3"
          style={{ boxShadow: "0 8px 20px -12px rgba(0,0,0,0.1)" }}
        >
          <span
            className="grid h-10 w-10 place-items-center rounded-full bg-white shrink-0"
            style={{ boxShadow: "0 6px 14px -6px rgba(255,107,0,0.4)" }}
          >
            <Lightbulb className="h-5 w-5" style={{ color: "#FF6B00" }} strokeWidth={2.4} />
          </span>
          <div className="flex-1 text-right">
            <p className="text-[13px] font-extrabold" style={{ color: "#FF6B00" }}>
              معلومة مهمة
            </p>
            <p className="text-[11.5px] text-neutral-700 font-medium mt-0.5 leading-relaxed">
              معرفة أكبر تحدي لديك هي الخطوة الأولى للتغيير الحقيقي.
            </p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onNext}
          disabled={!selected}
          className={`mt-2.5 w-full rounded-full py-4 text-white text-base font-black flex items-center justify-center gap-3 transition-all ${selected ? "active:scale-[0.98]" : "opacity-50 cursor-not-allowed"}`}
          style={{
            background: "linear-gradient(180deg,#FF8534,#FF6B00)",
            boxShadow: selected
              ? "0 14px 30px -10px rgba(255,107,0,0.55), 0 0 0 6px rgba(255,107,0,0.08)"
              : "none",
          }}
        >
          <span>متابعة</span>
          <ArrowLeft className="h-5 w-5" strokeWidth={2.6} />
        </button>

        <div className="mt-2 flex items-center justify-center gap-2 text-[11.5px] text-neutral-500">
          <Lock className="h-3.5 w-3.5" style={{ color: "#FF6B00" }} />
          <span>معلوماتك تبقى خاصة وآمنة</span>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}


function LocationScreen({ onBack, onNext }: { onBack: () => void; onNext: (loc: "dubai" | "remote") => void }) {
  const [selected, setSelected] = useState<"dubai" | "remote" | null>(null);
  const ORANGE = "#FF6B00";

  const Check2 = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" stroke={ORANGE} strokeWidth="1.8" />
      <path d="M8 12.5l2.8 2.8L16.5 9.5" />
    </svg>
  );

  const PinIcon = ({ size = 22, color = ORANGE }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z" />
      <circle cx="12" cy="9" r="2.6" />
    </svg>
  );

  const DubaiArt = () => (
    <svg viewBox="0 0 130 150" className="w-full h-full" preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id="sky1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#FFE7D1" />
          <stop offset="1" stopColor="#FFD0A8" />
        </linearGradient>
        <linearGradient id="burj" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#C9613B" />
          <stop offset="1" stopColor="#7A3318" />
        </linearGradient>
      </defs>
      <rect width="130" height="150" fill="url(#sky1)" />
      <circle cx="95" cy="42" r="14" fill="#FFB07A" opacity="0.55" />
      {/* Burj Khalifa */}
      <polygon points="62,20 66,140 58,140" fill="url(#burj)" />
      <polygon points="62,20 60,55 64,55" fill="#3A1608" opacity="0.4" />
      {/* side towers */}
      <rect x="40" y="70" width="10" height="70" fill="#A04A28" />
      <polygon points="40,70 50,70 45,58" fill="#A04A28" />
      <rect x="75" y="80" width="9" height="60" fill="#8E3E22" />
      <polygon points="75,80 84,80 79.5,68" fill="#8E3E22" />
      <rect x="88" y="90" width="14" height="50" fill="#B65733" />
      <rect x="22" y="95" width="12" height="45" fill="#9E4628" />
      {/* palms */}
      <g stroke="#5C2810" strokeWidth="1.6">
        <line x1="20" y1="140" x2="22" y2="120" />
        <line x1="106" y1="140" x2="108" y2="118" />
      </g>
      <g fill="#7A3D1C">
        <ellipse cx="22" cy="118" rx="9" ry="3" />
        <ellipse cx="108" cy="116" rx="10" ry="3" />
      </g>
      {/* water */}
      <rect y="138" width="130" height="12" fill="#E89870" opacity="0.55" />
    </svg>
  );

  const GlobeArt = () => (
    <svg viewBox="0 0 130 130" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="g1" cx="0.35" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#FFD9B8" />
          <stop offset="1" stopColor="#E58348" />
        </radialGradient>
      </defs>
      <circle cx="65" cy="68" r="42" fill="url(#g1)" />
      <g fill="#A0451E" opacity="0.85">
        <path d="M40 55 q8 -6 18 -3 q6 2 4 9 q-2 6 -10 6 q-8 0 -12 -12z" />
        <path d="M68 78 q10 -2 16 4 q4 5 -2 9 q-8 4 -14 -3z" />
        <path d="M50 82 q6 1 8 6 q1 4 -4 5 q-7 1 -6 -8z" />
      </g>
      <g fill="none" stroke="#7A3318" strokeWidth="1" opacity="0.5">
        <ellipse cx="65" cy="68" rx="42" ry="14" />
        <ellipse cx="65" cy="68" rx="42" ry="28" />
        <line x1="65" y1="26" x2="65" y2="110" />
      </g>
      {/* flight path */}
      <path d="M18 60 Q 65 0 112 60" fill="none" stroke="#5C2810" strokeWidth="1.4" strokeDasharray="3 3" />
      <path d="M18 60 Q 65 120 112 60" fill="none" stroke="#5C2810" strokeWidth="1.2" strokeDasharray="2 3" opacity="0.6" />
      {/* plane */}
      <g transform="translate(100 36) rotate(35)" fill="#3A1608">
        <path d="M0 0 L14 4 L18 2 L20 6 L18 10 L14 8 L0 12 L4 6 Z" />
      </g>
    </svg>
  );

  const Card = ({
    id,
    title,
    subtitle,
    benefits,
    art,
    watermark,
  }: {
    id: "dubai" | "remote";
    title: string;
    subtitle: string;
    benefits: string[];
    art: React.ReactNode;
    watermark: React.ReactNode;
  }) => {
    const active = selected === id;
    return (
      <button
        onClick={() => setSelected(id)}
        className="relative w-full rounded-[26px] bg-white text-right overflow-hidden transition-all duration-250"
        style={{
          border: `2px solid ${active ? ORANGE : "rgba(0,0,0,0.04)"}`,
          boxShadow: active
            ? "0 18px 40px -16px rgba(255,107,0,0.45), 0 6px 16px -8px rgba(0,0,0,0.08)"
            : "0 10px 26px -16px rgba(0,0,0,0.18), 0 2px 6px -2px rgba(0,0,0,0.06)",
          transform: active ? "scale(1.02)" : "scale(1)",
        }}
      >
        {/* selection indicator */}
        <div className="absolute top-3 left-3 z-10">
          {active ? (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: ORANGE, boxShadow: "0 4px 12px rgba(255,107,0,0.45)" }}
            >
              <Check size={16} color="#fff" strokeWidth={3} />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full border-2 border-gray-300 bg-white" />
          )}
        </div>

        {/* watermark right */}
        <div className="absolute right-2 bottom-2 w-16 h-16 opacity-15 pointer-events-none">
          {watermark}
        </div>

        <div className="flex flex-row-reverse items-stretch min-h-[150px]">
          {/* art left */}
          <div className="w-[130px] shrink-0 self-stretch overflow-hidden rounded-l-[24px]">
            {art}
          </div>
          {/* text */}
          <div className="flex-1 px-4 py-3 flex flex-col justify-center gap-1.5">
            <h3 className="text-[19px] font-extrabold text-[#2A2A2A] leading-tight">{title}</h3>
            <p className="text-[13px] font-bold" style={{ color: ORANGE }}>{subtitle}</p>
            <ul className="mt-1 space-y-1.5">
              {benefits.map((b, i) => (
                <li key={i} className="flex flex-row-reverse items-center gap-1.5 text-[11.5px] text-[#4A4A4A] font-medium">
                  <Check2 />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        backgroundColor: "#FAF8F5",
        backgroundImage: `url(${gymBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        animation: "fadeIn .35s ease-out",
      }}
    >
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(250,248,245,0.88) 0%, rgba(250,248,245,0.94) 60%, rgba(250,248,245,0.98) 100%)" }} />

      <div className="relative h-full flex flex-col px-5 pt-3 pb-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md"
            aria-label="رجوع"
          >
            <ChevronLeft size={20} className="text-gray-700" />
          </button>
          <div className="text-[15px] font-bold text-gray-700">
            <span style={{ color: ORANGE }}>8</span> من 10
          </div>
          <div className="w-10" />
        </div>

        {/* Progress */}
        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex-1 h-[5px] rounded-full overflow-hidden bg-gray-200">
              <div
                className="h-full rounded-full"
                style={{
                  width: i < 7 ? "100%" : i === 7 ? "55%" : "0%",
                  background: ORANGE,
                }}
              />
            </div>
          ))}
        </div>

        {/* Title */}
        <div className="mt-4 text-center" style={{ animation: "fadeUp .5s ease-out" }}>
          <div className="inline-flex items-center justify-center gap-2">
            <PinIcon size={22} />
            <span className="text-[22px] font-extrabold" style={{ color: ORANGE }}>ممتاز</span>
          </div>
          <h1 className="mt-1 text-[26px] font-extrabold text-[#1F1F1F] leading-tight">أين تتواجد حالياً؟</h1>
          <p className="mt-1.5 text-[13px] text-gray-500 font-medium leading-relaxed px-6">
            ساعدنا في تحديد أفضل خطة تدريب تناسب موقعك.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-4 flex flex-col gap-3">
          <div style={{ animation: "fadeUp .5s ease-out .1s both" }}>
            <Card
              id="dubai"
              title="أعيش في دبي"
              subtitle="تدريب شخصي مباشر"
              benefits={["جلسات تدريبية في أفضل الأندية", "متابعة مباشرة مع مدربك"]}
              art={<DubaiArt />}
              watermark={
                <svg viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="1.5">
                  <path d="M12 2 L8 8 L10 8 L8 14 L11 14 L9 22 L15 22 L13 14 L16 14 L14 8 L16 8 Z" />
                </svg>
              }
            />
          </div>
          <div style={{ animation: "fadeUp .5s ease-out .2s both" }}>
            <Card
              id="remote"
              title="خارج دبي"
              subtitle="تدريب أونلاين مخصص لك"
              benefits={["خطة تدريب وغذائية مخصصة", "متابعة أونلاين أينما كنت"]}
              art={<GlobeArt />}
              watermark={
                <svg viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="1.4">
                  <circle cx="12" cy="12" r="10" />
                  <ellipse cx="12" cy="12" rx="10" ry="4" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <line x1="12" y1="2" x2="12" y2="22" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Info card */}
        <div
          className="mt-3 rounded-[20px] bg-white/85 backdrop-blur px-4 py-3 flex flex-row-reverse items-center gap-3"
          style={{ boxShadow: "0 6px 18px -10px rgba(0,0,0,0.12)" }}
        >
          <div
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0"
            style={{ boxShadow: "0 4px 12px rgba(255,107,0,0.18)", border: "1px solid #F5E6D6" }}
          >
            <PinIcon size={22} />
          </div>
          <div className="flex-1 text-right">
            <div className="text-[13px] font-extrabold" style={{ color: ORANGE }}>معلومة مهمة</div>
            <div className="text-[12.5px] text-[#3D3D3D] font-medium leading-snug">
              ✨ نقدم أفضل تجربة سواء كنت في دبي أو خارجها.
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-auto pt-3">
          <button
            disabled={!selected}
            onClick={() => selected && onNext(selected)}
            className="w-full h-[58px] rounded-[20px] flex items-center justify-center gap-3 text-white text-[17px] font-extrabold transition-all duration-200 active:scale-[0.98]"
            style={{
              background: selected ? `linear-gradient(135deg, #FF8A3D 0%, ${ORANGE} 100%)` : "#E5D9CC",
              boxShadow: selected ? "0 14px 30px -10px rgba(255,107,0,0.55)" : "none",
              opacity: selected ? 1 : 0.7,
            }}
          >
            <span>متابعة</span>
            <ArrowLeft size={20} />
          </button>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-[11.5px] text-gray-500">
            <Lock size={12} />
            <span>معلوماتك تبقى خاصة وآمنة</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}

/* ===================== INVESTMENT SCREEN ===================== */

function TrophyIcon({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size}>
      <defs>
        <linearGradient id="trophyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFC107" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
        <linearGradient id="trophyBase" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8B6914" />
          <stop offset="100%" stopColor="#5C4008" />
        </linearGradient>
      </defs>
      {/* Base */}
      <rect x="22" y="50" width="20" height="6" rx="2" fill="url(#trophyBase)" />
      <rect x="18" y="54" width="28" height="5" rx="2" fill="url(#trophyBase)" opacity="0.8" />
      {/* Cup body */}
      <path d="M16 16 Q16 42 32 46 Q48 42 48 16 Z" fill="url(#trophyGrad)" />
      {/* Star */}
      <path d="M32 22 L34 28 L40 28 L35 32 L37 38 L32 34 L27 38 L29 32 L24 28 L30 28 Z" fill="#FFF8DC" opacity="0.9" />
      {/* Handles */}
      <path d="M16 18 Q8 18 8 28 Q8 38 18 38" fill="none" stroke="url(#trophyGrad)" strokeWidth="4" strokeLinecap="round" />
      <path d="M48 18 Q56 18 56 28 Q56 38 46 38" fill="none" stroke="url(#trophyGrad)" strokeWidth="4" strokeLinecap="round" />
      {/* Rim */}
      <ellipse cx="32" cy="16" rx="16" ry="3" fill="#FFD700" />
    </svg>
  );
}

function CoinIcon({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size}>
      <defs>
        <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="40%" stopColor="#FFC107" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
        <linearGradient id="coinEdge" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
      </defs>
      {/* Outer ring */}
      <circle cx="32" cy="32" r="28" fill="url(#coinGrad)" stroke="url(#coinEdge)" strokeWidth="2" />
      {/* Inner ring */}
      <circle cx="32" cy="32" r="20" fill="none" stroke="#B8860B" strokeWidth="1.5" opacity="0.5" />
      {/* Dollar sign */}
      <text x="32" y="40" textAnchor="middle" fontSize="28" fontWeight="bold" fill="#5C4008" fontFamily="Arial">$</text>
      {/* Shine */}
      <ellipse cx="24" cy="22" rx="8" ry="5" fill="white" opacity="0.25" transform="rotate(-30 24 22)" />
    </svg>
  );
}

function PiggyBankIcon({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size}>
      <defs>
        <linearGradient id="piggyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFB6C1" />
          <stop offset="50%" stopColor="#FF91A4" />
          <stop offset="100%" stopColor="#F06279" />
        </linearGradient>
        <linearGradient id="coinSmall" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
      </defs>
      {/* Body */}
      <ellipse cx="32" cy="38" rx="22" ry="16" fill="url(#piggyGrad)" />
      {/* Head */}
      <circle cx="48" cy="30" r="10" fill="url(#piggyGrad)" />
      {/* Snout */}
      <ellipse cx="56" cy="30" rx="4" ry="5" fill="#FF91A4" />
      <circle cx="55" cy="28" r="1.5" fill="#D4506B" />
      <circle cx="57" cy="28" r="1.5" fill="#D4506B" />
      {/* Eye */}
      <circle cx="50" cy="26" r="2" fill="#333" />
      <circle cx="50.5" cy="25.5" r="0.7" fill="white" />
      {/* Ear */}
      <ellipse cx="42" cy="20" rx="5" ry="7" fill="#FF91A4" transform="rotate(-20 42 20)" />
      {/* Legs */}
      <rect x="18" y="50" width="6" height="8" rx="3" fill="#F06279" />
      <rect x="40" y="50" width="6" height="8" rx="3" fill="#F06279" />
      {/* Tail */}
      <path d="M12 38 Q8 36 10 32 Q12 30 10 28" fill="none" stroke="#FF91A4" strokeWidth="2" strokeLinecap="round" />
      {/* Coin slot */}
      <rect x="26" y="22" width="12" height="3" rx="1.5" fill="#D4506B" />
      {/* Coin on top */}
      <circle cx="32" cy="14" r="6" fill="url(#coinSmall)" stroke="#D4AF37" strokeWidth="1" />
      <text x="32" y="17" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#8B6914">$</text>
    </svg>
  );
}

function MagnifyingGlassIcon({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size}>
      <defs>
        <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8E8E8" />
          <stop offset="50%" stopColor="#F5F5F5" />
          <stop offset="100%" stopColor="#D0D0D0" />
        </linearGradient>
        <linearGradient id="handleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#888" />
          <stop offset="100%" stopColor="#555" />
        </linearGradient>
      </defs>
      {/* Handle */}
      <rect x="42" y="42" width="8" height="20" rx="4" fill="url(#handleGrad)" transform="rotate(45 46 52)" />
      {/* Rim */}
      <circle cx="28" cy="28" r="18" fill="none" stroke="url(#handleGrad)" strokeWidth="4" />
      {/* Glass */}
      <circle cx="28" cy="28" r="15" fill="url(#glassGrad)" />
      {/* Reflection */}
      <ellipse cx="22" cy="20" rx="6" ry="4" fill="white" opacity="0.5" transform="rotate(-45 22 20)" />
      <ellipse cx="24" cy="22" rx="3" ry="2" fill="white" opacity="0.7" transform="rotate(-45 24 22)" />
    </svg>
  );
}

function TargetIconSmall({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#FF6B00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  );
}

const INVESTMENT_OPTIONS = [
  {
    id: "premium" as const,
    title: "مستعد لفعل كل ما يلزم",
    highlight: "أريد أسرع وأفضل نتيجة ممكنة.",
    description: "أنا جاد وأؤمن أن الاستثمار في نفسي هو أفضل قرار سأتخذه.",
    Icon: TrophyIcon,
    iconBg: "#FFF8E7",
  },
  {
    id: "standard" as const,
    title: "مستعد لكن بميزانية متوسطة",
    highlight: "أبحث عن خطة مناسبة أستطيع الالتزام بها.",
    description: "أريد نتائج قوية مع خطة تناسب ميزانيتي الحالية.",
    Icon: CoinIcon,
    iconBg: "#FFF8E7",
  },
  {
    id: "budget" as const,
    title: "أبحث عن أرخص خيار",
    highlight: "أريد البدء بأقل تكلفة ممكنة.",
    description: "ميزانيتي محدودة حالياً وأبحث عن خيار اقتصادي.",
    Icon: PiggyBankIcon,
    iconBg: "#FFF0F3",
  },
  {
    id: "price_only" as const,
    title: "أريد فقط معرفة السعر",
    highlight: "لست متأكداً بعد.",
    description: "أحتاج معلومات أكثر قبل أن أقرر إذا كنت سأبدأ أم لا.",
    Icon: MagnifyingGlassIcon,
    iconBg: "#F0F0F0",
  },
];

function InvestmentScreen({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const ORANGE = "#FF6B00";

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        backgroundColor: "#FAF8F5",
        backgroundImage: `url(${gymBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        animation: "fadeIn .35s ease-out",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(250,248,245,0.88) 0%, rgba(250,248,245,0.94) 60%, rgba(250,248,245,0.98) 100%)",
        }}
      />

      <div className="relative h-full flex flex-col px-5 pt-3 pb-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] ring-1 ring-black/5"
            aria-label="رجوع"
          >
            <ChevronLeft size={20} className="text-neutral-700" />
          </button>
          <div className="text-[15px] font-bold text-neutral-800">
            <span style={{ color: ORANGE }}>9</span> من 10
          </div>
          <div className="w-10" />
        </div>

        {/* Progress */}
        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex-1 h-[5px] rounded-full overflow-hidden bg-gray-200">
              <div
                className="h-full rounded-full"
                style={{
                  width: i < 8 ? "100%" : i === 8 ? "55%" : "0%",
                  background: ORANGE,
                }}
              />
            </div>
          ))}
        </div>

        {/* Title */}
        <div className="mt-4 text-center" style={{ animation: "fadeUp .5s ease-out" }}>
          <div className="inline-flex items-center justify-center gap-2">
            <TargetIconSmall size={22} />
            <span className="text-[20px] font-extrabold" style={{ color: ORANGE }}>كن صريحاً معي</span>
            <span className="text-[20px]">👇</span>
          </div>
          <h1 className="mt-2 text-[24px] font-extrabold text-[#1F1F1F] leading-tight">
            كم أنت مستعد للاستثمار في تغيير جسمك؟
          </h1>
          <p className="mt-2 text-[13px] text-gray-500 font-medium leading-relaxed px-4">
            النتائج الحقيقية تحتاج التزاماً واستثماراً حقيقياً.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-4 flex flex-col gap-2.5 flex-1 min-h-0 overflow-hidden">
          {INVESTMENT_OPTIONS.map((opt, i) => {
            const active = selected === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                className="relative w-full rounded-[22px] bg-white text-right overflow-hidden transition-all duration-250 active:scale-[0.98]"
                style={{
                  border: `2px solid ${active ? ORANGE : "rgba(0,0,0,0.04)"}`,
                  boxShadow: active
                    ? "0 14px 36px -14px rgba(255,107,0,0.4), 0 6px 16px -8px rgba(0,0,0,0.08)"
                    : "0 8px 22px -14px rgba(0,0,0,0.14), 0 2px 6px -2px rgba(0,0,0,0.05)",
                  transform: active ? "scale(1.02)" : "scale(1)",
                  animation: `fadeUp .5s ease-out ${i * 70}ms both`,
                }}
              >
                {/* Selection indicator - left side in RTL */}
                <div className="absolute top-3 left-3 z-10">
                  {active ? (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: ORANGE, boxShadow: "0 4px 12px rgba(255,107,0,0.45)" }}
                    >
                      <Check size={16} color="#fff" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full border-2 border-gray-300 bg-white" />
                  )}
                </div>

                <div className="flex flex-row-reverse items-stretch">
                  {/* Icon - right side in RTL */}
                  <div
                    className="w-[72px] shrink-0 self-stretch flex items-center justify-center"
                    style={{ background: opt.iconBg }}
                  >
                    <opt.Icon size={48} />
                  </div>
                  {/* Text */}
                  <div className="flex-1 px-4 py-3 flex flex-col justify-center gap-0.5 text-right">
                    <h3 className="text-[15px] font-extrabold text-[#2A2A2A] leading-tight">{opt.title}</h3>
                    <p className="text-[12.5px] font-bold" style={{ color: ORANGE }}>{opt.highlight}</p>
                    <p className="text-[11.5px] text-[#4A4A4A] font-medium leading-snug">{opt.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info card */}
        <div
          className="mt-2.5 rounded-[20px] bg-white/85 backdrop-blur px-4 py-3 flex flex-row-reverse items-center gap-3"
          style={{ boxShadow: "0 6px 18px -10px rgba(0,0,0,0.12)", animation: "fadeUp .5s ease-out .35s both" }}
        >
          <div
            className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0"
            style={{ boxShadow: "0 4px 12px rgba(255,107,0,0.18)", border: "1px solid #F5E6D6" }}
          >
            <Lightbulb size={20} style={{ color: ORANGE }} />
          </div>
          <div className="flex-1 text-right">
            <div className="text-[13px] font-extrabold" style={{ color: ORANGE }}>معلومة مهمة</div>
            <div className="text-[11.5px] text-[#3D3D3D] font-medium leading-snug">
              كلما كان استثمارك أعلى، كانت نتائجك أسرع وأفضل. أنا هنا لمساعدتك على تحقيق أفضل نسخة منك.
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-auto pt-2.5">
          <button
            disabled={!selected}
            onClick={() => selected && onNext()}
            className="w-full h-[56px] rounded-[18px] flex items-center justify-center gap-2 text-white text-[17px] font-extrabold transition-all duration-200 active:scale-[0.98]"
            style={{
              background: selected ? `linear-gradient(135deg, #FF8A3D 0%, ${ORANGE} 100%)` : "#E5D9CC",
              boxShadow: selected ? "0 14px 30px -10px rgba(255,107,0,0.55)" : "none",
              opacity: selected ? 1 : 0.7,
            }}
          >
            <span>متابعة</span>
            <ArrowLeft size={20} />
          </button>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-[11.5px] text-gray-500">
            <Lock size={12} />
            <span>معلوماتك تبقى خاصة وآمنة</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}



import bodyVerySkinny from "@/assets/body-very-skinny.jpg";
import bodyLean from "@/assets/body-lean.jpg";
import bodySkinnyFat from "@/assets/body-skinny-fat.jpg";
import bodyAverage from "@/assets/body-average.jpg";
import bodyOverweight from "@/assets/body-overweight.jpg";
import bodyMuscular from "@/assets/body-muscular.jpg";

const BODY_TYPES = [
  { id: "skinny_fat", title: "دهون بسيطة بالبطن", sub: "بطن بارز وعضلات خفيفة", img: bodySkinnyFat },
  { id: "lean", title: "نحيف رياضي", sub: "جسم رشيق وعضلات قليلة", img: bodyLean },
  { id: "very_skinny", title: "نحيف جداً", sub: "وزن أقل من الطبيعي", img: bodyVerySkinny },
  { id: "muscular", title: "عضلي", sub: "كتلة عضلية واضحة", img: bodyMuscular },
  { id: "overweight", title: "ممتلئ", sub: "زيادة في الوزن والدهون", img: bodyOverweight },
  { id: "average", title: "جسم متوسط", sub: "وزن طبيعي وكتلة معتدلة", img: bodyAverage },
];

function BodyTypeScreen({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const ORANGE = "#FF6B00";

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundColor: "#FAF8F5", animation: "fadeIn .35s ease-out" }}
    >
      <div className="relative h-full flex flex-col px-5 pt-3 pb-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] ring-1 ring-black/5"
            aria-label="رجوع"
          >
            <ChevronLeft size={20} className="text-neutral-700" />
          </button>
          <div className="text-[15px] font-bold text-neutral-800">
            <span style={{ color: ORANGE }}>10</span> من 10
          </div>
          <div className="w-10" />
        </div>

        {/* Progress - all 10 filled */}
        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex-1 h-[5px] rounded-full overflow-hidden bg-gray-200">
              <div className="h-full rounded-full" style={{ width: "100%", background: ORANGE }} />
            </div>
          ))}
        </div>

        {/* Title */}
        <div className="mt-3 text-center" style={{ animation: "fadeUp .5s ease-out" }}>
          <h1 className="text-[22px] font-extrabold text-[#1F1F1F] leading-tight">
            أي شكل أقرب لجسمك الحالي؟
          </h1>
          <p className="mt-1.5 text-[12.5px] text-gray-500 font-medium">
            اختر الشكل الأقرب لك حتى أخصص لك الخطة المناسبة.
          </p>
          <div className="mx-auto mt-1.5 h-[3px] w-10 rounded-full" style={{ background: ORANGE }} />
        </div>

        {/* Grid */}
        <div className="mt-3 grid grid-cols-3 gap-2 flex-1 min-h-0">
          {BODY_TYPES.map((b, i) => {
            const active = selected === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setSelected(b.id)}
                className="relative rounded-[18px] bg-white p-1.5 flex flex-col items-center transition-all duration-250"
                style={{
                  border: `2px solid ${active ? ORANGE : "rgba(0,0,0,0.04)"}`,
                  boxShadow: active
                    ? "0 12px 28px -12px rgba(255,107,0,0.45), 0 4px 12px -6px rgba(0,0,0,0.08)"
                    : "0 6px 16px -10px rgba(0,0,0,0.14), 0 2px 4px -2px rgba(0,0,0,0.05)",
                  transform: active ? "scale(1.03)" : "scale(1)",
                  animation: `fadeUp .5s ease-out ${i * 50}ms both`,
                }}
              >
                <div className="w-full rounded-[12px] overflow-hidden bg-[#F2EDE6] aspect-[3/4]">
                  <img
                    src={b.img}
                    alt={b.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-1 text-[11.5px] font-extrabold text-[#1F1F1F] text-center leading-tight">
                  {b.title}
                </div>
                <div className="text-[9.5px] text-gray-500 font-medium text-center leading-tight px-0.5 line-clamp-2">
                  {b.sub}
                </div>
                <div className="mt-1 mb-0.5">
                  {active ? (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: ORANGE, boxShadow: "0 3px 8px rgba(255,107,0,0.45)" }}
                    >
                      <Check size={12} color="#fff" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Info card */}
        <div
          className="mt-2.5 rounded-[18px] bg-white/85 backdrop-blur px-3 py-2.5 flex flex-row-reverse items-center gap-3 relative overflow-hidden"
          style={{ boxShadow: "0 6px 18px -10px rgba(0,0,0,0.12)", animation: "fadeUp .5s ease-out .35s both" }}
        >
          <div
            className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0"
            style={{ boxShadow: "0 4px 12px rgba(255,107,0,0.18)", border: "1px solid #F5E6D6" }}
          >
            <Target size={22} style={{ color: ORANGE }} />
          </div>
          <div className="flex-1 text-right">
            <div className="text-[12.5px] font-extrabold" style={{ color: ORANGE }}>لماذا نسأل هذا؟</div>
            <div className="text-[11px] text-[#3D3D3D] font-medium leading-snug">
              اختبارك يساعدنا على تحليل حالتك بدقة وبناء خطة مناسبة لجسمك وهدفك.
            </div>
          </div>
          <Sparkles size={14} className="absolute left-2 top-2 opacity-50" style={{ color: ORANGE }} />
          <Sparkles size={10} className="absolute left-3 bottom-2 opacity-40" style={{ color: ORANGE }} />
        </div>

        {/* CTA */}
        <div className="mt-2.5">
          <button
            disabled={!selected}
            onClick={() => selected && onNext()}
            className="w-full h-[54px] rounded-[18px] flex items-center justify-center gap-2 text-white text-[17px] font-extrabold transition-all duration-200 active:scale-[0.98]"
            style={{
              background: selected ? `linear-gradient(135deg, #FF8A3D 0%, ${ORANGE} 100%)` : "#E5D9CC",
              boxShadow: selected ? "0 14px 30px -10px rgba(255,107,0,0.55)" : "none",
              opacity: selected ? 1 : 0.7,
            }}
          >
            <span>متابعة</span>
            <ArrowLeft size={20} />
          </button>
          <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[11.5px] text-gray-500">
            <Lock size={12} />
            <span>معلوماتك تبقى خاصة وآمنة</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import fbodySlim from "@/assets/fbody-slim.jpg";
import fbodyBellyLight from "@/assets/fbody-belly-light.jpg";
import fbodyToning from "@/assets/fbody-toning.jpg";
import fbodyShaping from "@/assets/fbody-shaping.jpg";
import fbodyAthletic from "@/assets/fbody-athletic.jpg";
import fbodyOverweight from "@/assets/fbody-overweight.jpg";

const FEMALE_BODY_TYPES = [
  { id: "needs_toning", title: "جسم يحتاج شد", sub: "ترهلات خفيفة في البطن أو الذراعين والجسم", img: fbodyToning },
  { id: "belly_fat_light", title: "كرش خفيفة", sub: "دهون بسيطة في منطقة البطن فقط", img: fbodyBellyLight },
  { id: "slim", title: "نحيفة", sub: "وزن أقل من الطبيعي ودهون قليلة جداً", img: fbodySlim },
  { id: "overweight", title: "جسم ممتلئ بدهون", sub: "زيادة واضحة في الوزن وتراكم الدهون", img: fbodyOverweight },
  { id: "athletic", title: "جسم رياضي", sub: "جسم مشدود وعضلات بارزة وقوام رياضي", img: fbodyAthletic },
  { id: "body_shaping", title: "عدم تناسق الأرداف", sub: "أرغب بجسم أكثر تناسقاً وخصراً أنحف", img: fbodyShaping },
];

function FemaleBodyTypeScreen({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const ORANGE = "#FF6B00";

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundColor: "#FAF8F5", animation: "fadeIn .35s ease-out" }}
    >
      <div className="relative h-full flex flex-col px-5 pt-3 pb-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] ring-1 ring-black/5"
            aria-label="رجوع"
          >
            <ChevronLeft size={20} className="text-neutral-700" />
          </button>
          <div className="text-[15px] font-bold text-neutral-800">
            <span style={{ color: ORANGE }}>10</span> من 10
          </div>
          <div className="w-10" />
        </div>

        {/* Progress - all 10 filled */}
        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex-1 h-[5px] rounded-full overflow-hidden bg-gray-200">
              <div className="h-full rounded-full" style={{ width: "100%", background: ORANGE }} />
            </div>
          ))}
        </div>

        {/* Title */}
        <div className="mt-3 text-center" style={{ animation: "fadeUp .5s ease-out" }}>
          <h1 className="text-[22px] font-extrabold text-[#1F1F1F] leading-tight">
            أي شكل أقرب لجسمك الحالي؟
          </h1>
          <p className="mt-1.5 text-[12.5px] text-gray-500 font-medium">
            اختري الشكل الأقرب لك حتى أخصص لك الخطة المثالية.
          </p>
          <div className="mx-auto mt-1.5 h-[3px] w-10 rounded-full" style={{ background: ORANGE }} />
        </div>

        {/* Grid */}
        <div className="mt-3 grid grid-cols-3 gap-2 flex-1 min-h-0">
          {FEMALE_BODY_TYPES.map((b, i) => {
            const active = selected === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setSelected(b.id)}
                className="relative rounded-[18px] bg-white p-1.5 flex flex-col items-center transition-all duration-250"
                style={{
                  border: `2px solid ${active ? ORANGE : "rgba(0,0,0,0.04)"}`,
                  boxShadow: active
                    ? "0 12px 28px -12px rgba(255,107,0,0.45), 0 4px 12px -6px rgba(0,0,0,0.08)"
                    : "0 6px 16px -10px rgba(0,0,0,0.14), 0 2px 4px -2px rgba(0,0,0,0.05)",
                  transform: active ? "scale(1.03)" : "scale(1)",
                  animation: `fadeUp .5s ease-out ${i * 50}ms both`,
                }}
              >
                <div className="w-full rounded-[12px] overflow-hidden bg-[#F2EDE6] aspect-[3/4]">
                  <img
                    src={b.img}
                    alt={b.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-1 text-[11px] font-extrabold text-[#1F1F1F] text-center leading-tight px-0.5 line-clamp-2">
                  {b.title}
                </div>
                <div className="text-[9px] text-gray-500 font-medium text-center leading-tight px-0.5 line-clamp-2 mt-0.5">
                  {b.sub}
                </div>
                <div className="mt-1 mb-0.5">
                  {active ? (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: ORANGE, boxShadow: "0 3px 8px rgba(255,107,0,0.45)" }}
                    >
                      <Check size={12} color="#fff" strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Info card */}
        <div
          className="mt-2.5 rounded-[18px] bg-white/85 backdrop-blur px-3 py-2.5 flex flex-row-reverse items-center gap-3 relative overflow-hidden"
          style={{ boxShadow: "0 6px 18px -10px rgba(0,0,0,0.12)", animation: "fadeUp .5s ease-out .35s both" }}
        >
          <div
            className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0"
            style={{ boxShadow: "0 4px 12px rgba(255,107,0,0.18)", border: "1px solid #F5E6D6" }}
          >
            <Target size={22} style={{ color: ORANGE }} />
          </div>
          <div className="flex-1 text-right">
            <div className="text-[12.5px] font-extrabold" style={{ color: ORANGE }}>لماذا نسألك هذا؟</div>
            <div className="text-[11px] text-[#3D3D3D] font-medium leading-snug">
              اختيارك يساعدنا على تحليل حالتك بدقة وبناء خطة مناسبة لجسمك وهدفك.
            </div>
          </div>
          <Sparkles size={14} className="absolute left-2 top-2 opacity-50" style={{ color: ORANGE }} />
          <Sparkles size={10} className="absolute left-3 bottom-2 opacity-40" style={{ color: ORANGE }} />
        </div>

        {/* CTA */}
        <div className="mt-2.5">
          <button
            disabled={!selected}
            onClick={() => selected && onNext()}
            className="w-full h-[54px] rounded-[18px] flex items-center justify-center gap-2 text-white text-[17px] font-extrabold transition-all duration-200 active:scale-[0.98]"
            style={{
              background: selected ? `linear-gradient(135deg, #FF8A3D 0%, ${ORANGE} 100%)` : "#E5D9CC",
              boxShadow: selected ? "0 14px 30px -10px rgba(255,107,0,0.55)" : "none",
              opacity: selected ? 1 : 0.7,
            }}
          >
            <span>متابعة</span>
            <ArrowLeft size={20} />
          </button>
          <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[11.5px] text-gray-500">
            <Lock size={12} />
            <span>معلوماتك تبقى خاصة وآمنة</span>
          </div>
        </div>
      </div>
    </div>
  );
}
