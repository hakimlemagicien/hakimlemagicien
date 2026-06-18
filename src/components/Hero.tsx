import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarCheck,
  Dumbbell,
  LineChart,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Utensils,
  Zap,
  Star,
} from "lucide-react";
import { ProgressChart } from "./ProgressChart";
import coachImg from "@/assets/coach.png";
import avatar1 from "@/assets/avatar1.jpg";
import avatar2 from "@/assets/avatar2.jpg";
import avatar3 from "@/assets/avatar3.jpg";
import avatar4 from "@/assets/avatar4.jpg";

const features = [
  { icon: Dumbbell, label: "خطة تدريب مخصصة" },
  { icon: Utensils, label: "خطة تغذية مخصصة" },
  { icon: CalendarCheck, label: "متابعة دورية" },
  { icon: LineChart, label: "نتائج قابلة للقياس" },
];

function FeatureCard({ icon: Icon, label }: { icon: typeof Dumbbell; label: string }) {
  return (
    <div className="rounded-2xl bg-white shadow-card border border-border/40 p-4 sm:p-5 flex flex-col items-center text-center gap-3 transition-transform hover:-translate-y-1">
      <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary" strokeWidth={2} />
      <p className="text-xs sm:text-sm font-bold text-foreground leading-tight">{label}</p>
    </div>
  );
}

function ResultCard({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof Dumbbell;
  value: string;
  label: string;
  tone: "success" | "primary";
}) {
  const bg = tone === "success" ? "bg-success-soft text-success" : "bg-primary-soft text-primary";
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white shadow-soft border border-white px-4 py-3 min-w-[150px]">
      <span className={`grid h-10 w-10 place-items-center rounded-full ${bg}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="text-right">
        <p className="text-lg font-black text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

export function Hero() {
  const avatars = [avatar1, avatar2, avatar3, avatar4];

  return (
    <section className="relative overflow-hidden bg-background">
      {/* decorative dotted backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 right-0 lg:right-auto lg:left-0 w-40 h-40 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, oklch(0.7 0.2 41 / 0.25) 1.2px, transparent 1.5px)",
          backgroundSize: "14px 14px",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">
          {/* TEXT COLUMN */}
          <div className="order-1 text-center lg:text-right animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-2 text-sm font-bold text-primary">
              <Sparkles className="h-4 w-4" />
              برنامج مخصص 100% لك
            </div>

            <h1 className="mt-5 font-black text-foreground tracking-tight text-[42px] sm:text-5xl lg:text-[68px] leading-[1.1]">
              احصل على برنامج
              <br />
              <span className="text-primary">تدريبي وغذائي</span>
              <br />
              مخصص لهدفك
            </h1>

            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 lg:mr-0 leading-relaxed">
              اكتشف خلال دقائق الخطة المناسبة لجسمك وأهدافك بناءً على تحليل شخصي مجاني.
            </p>

            {/* feature cards */}
            <div className="mt-7 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-xl mx-auto lg:mx-0 lg:mr-0">
              {features.map((f) => (
                <FeatureCard key={f.label} {...f} />
              ))}
            </div>

            {/* mobile visual block */}
            <div className="lg:hidden mt-10">
              <CoachVisual />
            </div>

            {/* CTA */}
            <div className="mt-8">
              <Link
                to="/quiz"
                className="group inline-flex w-full sm:w-auto items-center justify-center gap-3 cta-gradient text-white font-bold text-lg rounded-full px-6 py-4 shadow-cta transition-all hover:scale-[1.02] hover:brightness-110"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-primary shrink-0 transition-transform group-hover:-translate-x-1">
                  <ArrowLeft className="h-5 w-5" />
                </span>
                <span className="flex-1 text-center sm:flex-none">ابدأ تقييمك المجاني</span>
                <span className="hidden sm:block w-9" aria-hidden />
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-6 flex items-center justify-center lg:justify-start gap-3 flex-wrap">
              <div className="flex -space-x-2 space-x-reverse">
                {avatars.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    width={40}
                    height={40}
                    loading="lazy"
                    className="h-10 w-10 rounded-full border-2 border-background object-cover"
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-success text-success" />
                ))}
              </div>
              <p className="text-sm font-bold text-foreground">
                <span className="text-success">+10,000</span> عميل حققوا نتائج مذهلة
              </p>
              <BadgeCheck className="h-5 w-5 text-success" />
            </div>
          </div>

          {/* DESKTOP VISUAL */}
          <div className="order-2 hidden lg:block">
            <CoachVisual />
          </div>
        </div>
      </div>
    </section>
  );
}

function CoachVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[560px] aspect-[4/5]">
      {/* Beige circle backdrop */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[88%] w-[88%] rounded-full bg-beige" />
      </div>

      {/* Coach image */}
      <img
        src={coachImg}
        alt="مدرب لياقة بدنية"
        width={1024}
        height={1024}
        className="relative z-10 w-full h-full object-contain object-bottom"
      />

      {/* Floating cards */}
      <div className="absolute z-20 top-[8%] left-[-8px] sm:left-[-20px] animate-float">
        <ResultCard icon={TrendingDown} value="-12kg" label="خسارة دهون" tone="success" />
      </div>
      <div
        className="absolute z-20 top-[38%] left-[-12px] sm:left-[-28px] animate-float"
        style={{ animationDelay: "0.8s" }}
      >
        <ResultCard icon={TrendingUp} value="+4.7kg" label="كتلة عضلية" tone="primary" />
      </div>
      <div
        className="absolute z-20 top-[66%] left-[-6px] sm:left-[-16px] animate-float"
        style={{ animationDelay: "1.6s" }}
      >
        <ResultCard icon={Zap} value="+85%" label="طاقة ولياقة" tone="success" />
      </div>

      {/* Chart */}
      <div className="absolute z-20 bottom-[-12px] right-[-8px] sm:right-[-16px] w-[78%] max-w-[360px]">
        <ProgressChart />
      </div>
    </div>
  );
}
