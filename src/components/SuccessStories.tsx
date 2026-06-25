import { useEffect, useRef, useState } from "react";
import { MapPin, Star, Quote, Users, Trophy, TrendingUp, Smile, Sparkles } from "lucide-react";
import { SOCIAL_PROOF_CLIENT_COUNT } from "@/lib/social-proof";
import t1 from "@/assets/transform-1.jpg";
import t2 from "@/assets/transform-2.jpg";
import t3 from "@/assets/transform-3.jpg";
import t4 from "@/assets/transform-4.jpg";

function useInView<T extends HTMLElement>(threshold = 0.12) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView, threshold]);
  return { ref, inView };
}

function useCountUp(target: number, start: boolean, duration = 1500) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration]);
  return val;
}

type Story = {
  image: string;
  loss: string;
  duration: string;
  name: string;
  age: string;
  location: string;
  quote: string;
};

const STORIES: Story[] = [
  {
    image: t1,
    loss: "-18 كغ",
    duration: "خلال 3 أشهر",
    name: "أحمد م.",
    age: "29",
    location: "دبي - الإمارات",
    quote:
      "كنت أواجه صعوبة في فقدان الوزن رغم محاولاتي العديدة، مع حكيم غيرت حياتي. فقدت 18 كيلو وأصبحت أكثر طاقة وثقة.",
  },
  {
    image: t2,
    loss: "-14 كغ",
    duration: "خلال 3 أشهر",
    name: "سارة ع.",
    age: "31",
    location: "الرياض - السعودية",
    quote:
      "خطة التغذية والتدريب كانت مناسبة لحياتي تماماً. وشعرت بتغير كبير في جسمي وثقتي ينفسي خلال وقت قصير.",
  },
  {
    image: t3,
    loss: "-22 كغ",
    duration: "خلال 4 أشهر",
    name: "خالد ف.",
    age: "34",
    location: "جدة - السعودية",
    quote:
      "الدعم والمتابعة المستمرة كانت العامل الأهم في نجاحي. خسرت 22 كيلو وبنيت عضلات وحسّنت أدائي بشكل ملحوظ.",
  },
  {
    image: t4,
    loss: "-11 كغ",
    duration: "خلال 3 أشهر",
    name: "نورة أ.",
    age: "27",
    location: "أبوظبي - الإمارات",
    quote:
      "أكثر شيء عجبني هو أن الخطة كانت مرنة وسهلة الالتزام. ومع المتابعة المستمرة حقّقت أفضل نسخة من نفسي.",
  },
];

function StoryCard({ story, delay }: { story: Story; delay: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`group relative rounded-[28px] bg-white border border-[#F3F4F6] shadow-[0_10px_40px_rgba(0,0,0,0.06)] transition-all duration-700 ease-out hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.10)] ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Image wrapper */}
      <div className="relative p-3">
        <div className="relative overflow-hidden rounded-2xl">
          <img
            src={story.image}
            alt={story.name}
            width={1024}
            height={768}
            loading="lazy"
            className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* labels */}
          <span className="absolute bottom-3 right-3 rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-bold text-neutral-700 shadow-sm">
            بعد
          </span>
          <span className="absolute bottom-3 left-3 rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-bold text-neutral-700 shadow-sm">
            قبل
          </span>
        </div>

        {/* Floating loss badge */}
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 rounded-2xl bg-white px-4 py-2 text-center shadow-[0_10px_30px_rgba(0,0,0,0.12)] ring-1 ring-neutral-100">
          <div className="text-base font-black text-[#22C55E]">{story.loss}</div>
          <div className="text-[11px] text-neutral-500 mt-0.5">{story.duration}</div>
        </div>
      </div>

      <div className="px-6 pt-10 pb-6 text-center">
        {/* Name + age + location */}
        <div className="flex items-start justify-between gap-3">
          <div className="text-right">
            <div className="text-base font-black text-orange-500">{story.age}</div>
            <div className="text-[11px] text-neutral-500">سنة</div>
          </div>
          <div className="flex-1 text-center">
            <h4 className="text-base font-extrabold text-neutral-900">{story.name}</h4>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-neutral-500">
              <MapPin className="h-3.5 w-3.5 text-orange-500" />
              {story.location}
            </div>
          </div>
          <div className="w-8" />
        </div>

        {/* stars */}
        <div className="mt-4 flex items-center justify-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-orange-500 text-orange-500" />
          ))}
        </div>

        {/* quote */}
        <div className="mt-4 flex items-start gap-2 text-right">
          <Quote className="h-4 w-4 shrink-0 fill-orange-500 text-orange-500 mt-1" />
          <p className="text-[13px] leading-loose text-[#374151]">{story.quote}</p>
        </div>
      </div>
    </div>
  );
}

type Stat = { Icon: typeof Users; value: number; prefix: string; suffix: string; text: string };
const STATS: Stat[] = [
  { Icon: Users, value: SOCIAL_PROOF_CLIENT_COUNT, prefix: "+", suffix: "", text: "عميل حققوا نتائجهم مع برنامج حكيم" },
  { Icon: Trophy, value: 92, prefix: "+", suffix: "%", text: "نسبة رضا العملاء عن البرنامج والمتابعة" },
  { Icon: TrendingUp, value: 85, prefix: "+", suffix: "%", text: "حققوا أهدافهم خلال أول 3 أشهر" },
  { Icon: Smile, value: SOCIAL_PROOF_CLIENT_COUNT, prefix: "+", suffix: "", text: "تحول حقيقي نحو حياة أفضل وأكثر صحة" },
];

function StatItem({ stat, index, inView }: { stat: Stat; index: number; inView: boolean }) {
  const count = useCountUp(stat.value, inView);
  const Icon = stat.Icon;
  return (
    <div
      className={`flex items-center justify-center gap-5 px-4 transition-all duration-500 ease-out ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } ${index > 0 ? "lg:border-r lg:border-orange-200/60" : ""}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white ring-2 ring-orange-100 text-orange-500 shadow-[0_8px_20px_-10px_rgba(249,115,22,0.4)]">
        <Icon className="h-7 w-7" strokeWidth={2.2} />
      </div>
      <div className="text-right">
        <div className="text-2xl md:text-3xl font-black text-neutral-900">
          {stat.prefix}
          {count.toLocaleString("en-US")}
          {stat.suffix}
        </div>
        <p className="mt-1 text-xs md:text-[13px] text-neutral-500 leading-snug">{stat.text}</p>
      </div>
    </div>
  );
}

export default function SuccessStories() {
  const head = useInView<HTMLDivElement>();
  const stats = useInView<HTMLDivElement>(0.2);

  return (
    <section
      id="stories"
      dir="rtl"
      className="relative w-full overflow-hidden bg-white py-20 md:py-28 font-[Tajawal,Cairo,sans-serif]"
    >
      <div className="pointer-events-none absolute left-6 top-32 hidden md:grid grid-cols-5 gap-2 opacity-40">
        {Array.from({ length: 25 }).map((_, i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-orange-300" />
        ))}
      </div>
      <div className="pointer-events-none absolute right-6 top-32 hidden md:grid grid-cols-5 gap-2 opacity-40">
        {Array.from({ length: 25 }).map((_, i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full bg-orange-300" />
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {/* HEADER */}
        <div
          ref={head.ref}
          className={`text-center transition-all duration-700 ease-out ${
            head.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-orange-600">
            <Sparkles className="h-4 w-4" />
            نتائج حقيقية لأشخاص حقيقيين
          </span>
          <h2 className="mt-5 text-4xl md:text-6xl lg:text-7xl font-black leading-[1.15] text-neutral-900">
            قصص <span className="text-orange-500">نجاح</span> عملائنا
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base md:text-lg text-neutral-500 leading-loose">
            تحولات حقيقية، نتائج مستدامة، وثقة تتحدث عن نفسها.
          </p>
        </div>

        {/* STORIES GRID */}
        <div className="mt-14 md:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STORIES.map((s, i) => (
            <StoryCard key={s.name} story={s} delay={i * 120} />
          ))}
        </div>

        {/* STATS */}
        <div
          ref={stats.ref}
          className={`mt-14 md:mt-16 rounded-[36px] bg-[#FAF6F2] px-5 py-10 md:px-8 md:py-12 transition-all duration-700 ease-out ${
            stats.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-2">
            {STATS.map((s, i) => (
              <StatItem key={s.text} stat={s} index={i} inView={stats.inView} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
