import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Check, Lock, Dumbbell, Flame, PersonStanding } from "lucide-react";
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

function QuizPage() {
  const [step, setStep] = useState<"loading" | "gender">("loading");

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
      {step === "loading" ? <LoadingScreen onDone={() => setStep("gender")} /> : <GenderScreen />}
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
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-50"
          style={{ background: "#FF6B00" }}
        />
        <div
          className="relative grid place-items-center h-28 w-28 rounded-full shadow-[0_20px_60px_-15px_rgba(255,107,0,0.6)]"
          style={{ background: "linear-gradient(135deg,#FF8534,#FF6B00)" }}
        >
          <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-[spin_2s_linear_infinite]" style={{ borderTopColor: "transparent", borderRightColor: "transparent" }} />
          <Dumbbell className="h-12 w-12 text-white" strokeWidth={2.4} />
        </div>
      </div>

      <h1 className="relative mt-10 text-2xl font-black text-neutral-900">
        جاري تجهيز تقييمك الشخصي
      </h1>
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
                className={`grid h-6 w-6 place-items-center rounded-full transition-all ${
                  active ? "scale-100" : "scale-90"
                }`}
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

function GenderScreen() {
  return (
    <div className="relative w-full h-full flex flex-col animate-[fadeIn_.5s_ease-out]">
      {/* Gym BG */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${gymBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.35,
        }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,#FAF8F5 0%,rgba(250,248,245,0.7) 40%,rgba(250,248,245,0.85) 100%)" }} />

      {/* Content */}
      <div className="relative flex flex-col h-full px-5 pt-3 pb-3">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button className="grid h-10 w-10 place-items-center rounded-full bg-white/70 backdrop-blur ring-1 ring-black/5">
            <ChevronLeft className="h-5 w-5 text-neutral-700" />
          </button>
          <div className="text-sm font-bold text-neutral-800">
            <span style={{ color: "#FF6B00" }}>2</span> من 10
          </div>
          <div className="w-10" />
        </div>

        {/* Progress segments */}
        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1.5 rounded-full"
              style={{ background: i < 2 ? "#FF6B00" : "rgba(0,0,0,0.12)" }}
            />
          ))}
        </div>

        {/* Title */}
        <div className="mt-5 text-center">
          <p className="text-base font-bold text-neutral-800">لنخصص رحلتك 👇</p>
          <h1 className="mt-2 text-3xl font-black text-neutral-900 leading-tight">
            ما هو <span style={{ color: "#FF6B00" }}>جنسك</span> ؟
          </h1>
          <p className="mt-2 text-[13px] text-neutral-500 leading-relaxed px-4">
            سنخصص الأسئلة والخطة بناء على هدفك وطبيعة جسمك.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-4 grid grid-cols-2 gap-3 flex-1 min-h-0">
          <GenderCard
            image={maleImg}
            label="ذكر"
            color="#2563EB"
            tintFrom="#EFF6FF"
            tintTo="#FFFFFF"
            symbol="♂"
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
            features={[
              { Icon: Dumbbell, text: "شد الجسم" },
              { Icon: Flame, text: "خصر أنحف" },
              { Icon: PersonStanding, text: "جسم متناسق" },
            ]}
          />
        </div>

        {/* Footer */}
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
  image,
  label,
  color,
  tintFrom,
  tintTo,
  symbol,
  features,
}: {
  image: string;
  label: string;
  color: string;
  tintFrom: string;
  tintTo: string;
  symbol: string;
  features: Feature[];
}) {
  return (
    <button
      className="relative flex flex-col rounded-3xl overflow-hidden bg-white ring-1 ring-black/5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.15)] active:scale-[0.98] transition-transform"
      style={{ background: `linear-gradient(180deg,${tintFrom},${tintTo})` }}
    >
      {/* Image area */}
      <div className="relative w-full" style={{ aspectRatio: "1/1.15" }}>
        <img
          src={image}
          alt={label}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* dots pattern */}
        <div
          className="absolute top-3 right-3 grid grid-cols-6 gap-1 opacity-40"
          style={{ direction: "ltr" }}
        >
          {Array.from({ length: 30 }).map((_, i) => (
            <span key={i} className="h-1 w-1 rounded-full" style={{ background: color }} />
          ))}
        </div>
        {/* gender symbol circle */}
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 grid h-12 w-12 place-items-center rounded-full ring-4 ring-white shadow-lg" style={{ background: color }}>
          <span className="text-white text-xl font-black leading-none">{symbol}</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 pt-7 pb-4 flex-1 flex flex-col">
        <h3 className="text-center text-xl font-black text-neutral-900">{label}</h3>
        <div className="mx-auto mt-1.5 h-[2px] w-8 rounded-full" style={{ background: color, opacity: 0.5 }} />

        <ul className="mt-3 space-y-2">
          {features.map((f) => (
            <li key={f.text} className="flex items-center justify-end gap-2 text-[12px] text-neutral-800 font-medium">
              <span>{f.text}</span>
              <span
                className="grid h-6 w-6 shrink-0 place-items-center rounded-lg"
                style={{ background: `${color}1A`, color }}
              >
                <f.Icon className="h-3 w-3" strokeWidth={2.4} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </button>
  );
}
