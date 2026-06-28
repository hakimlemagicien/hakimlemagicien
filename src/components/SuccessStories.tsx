import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import {
  ArrowLeft,
  Calendar,
  ChevronsRight,
  Dumbbell,
  Scale,
  Star,
  Users,
} from "lucide-react";
import t1 from "@/assets/transform-1.jpg";
import t2 from "@/assets/transform-2.jpg";
import t3 from "@/assets/transform-3.jpg";
import t4 from "@/assets/transform-4.jpg";
import beforeOver from "@/assets/body-overweight.jpg";
import beforeAvg from "@/assets/body-average.jpg";
import beforeSkinny from "@/assets/body-skinny-fat.jpg";
import "swiper/css";

type StorySlide = {
  name: string;
  before: string;
  after: string;
  weightValue: string;
  weightLabel: string;
  muscleValue: string;
  muscleLabel: string;
  durationValue: string;
  durationLabel: string;
  quote: string;
};

const STORY_SLIDES: StorySlide[] = [
  {
    name: "أحمد العتيبي",
    before: beforeOver,
    after: t1,
    weightValue: "-16kg",
    weightLabel: "خسارة وزن",
    muscleValue: "+7kg",
    muscleLabel: "كتلة عضلية",
    durationValue: "12",
    durationLabel: "أسبوع",
    quote:
      "كنت أجرب أنظمة كثيرة بدون نتيجة، مع خطة حكيم المخصصة قدرت أخسر 16 كغ وأبني جسم قوي وصحي.",
  },
  {
    name: "محمد",
    before: beforeAvg,
    after: t2,
    weightValue: "-12kg",
    weightLabel: "خسارة وزن",
    muscleValue: "+5kg",
    muscleLabel: "كتلة عضلية",
    durationValue: "10",
    durationLabel: "أسابيع",
    quote: "البرنامج كان واضحاً وسهل الالتزام. تحسّن أدائي وزادت كتلتي العضلية خلال أسابيع قليلة.",
  },
  {
    name: "سلمان",
    before: beforeSkinny,
    after: t3,
    weightValue: "+6kg",
    weightLabel: "كتلة عضلية",
    muscleValue: "+6kg",
    muscleLabel: "كتلة عضلية",
    durationValue: "16",
    durationLabel: "أسبوع",
    quote: "المتابعة الأسبوعية ساعدتني أضبط الخطة. النتائج جاءت تدريجياً وبثبات دون إرهاق.",
  },
  {
    name: "يوسف",
    before: beforeOver,
    after: t4,
    weightValue: "-18kg",
    weightLabel: "خسارة وزن",
    muscleValue: "+4kg",
    muscleLabel: "كتلة عضلية",
    durationValue: "14",
    durationLabel: "أسبوع",
    quote: "أخيراً خطة تغذية لا تشعرني بالحرمان. خسرت وزناً حقيقياً مع الحفاظ على طاقتي اليومية.",
  },
  {
    name: "فهد",
    before: beforeAvg,
    after: t2,
    weightValue: "-11kg",
    weightLabel: "خسارة وزن",
    muscleValue: "+4kg",
    muscleLabel: "كتلة عضلية",
    durationValue: "8",
    durationLabel: "أسابيع",
    quote: "مع حكيم تغير كل شيء. خطة مخصصة ودعم مستمر، والنتائج فاقت توقعاتي.",
  },
  {
    name: "ناصر",
    before: beforeSkinny,
    after: t3,
    weightValue: "-9kg",
    weightLabel: "خسارة وزن",
    muscleValue: "جسم متناسق",
    muscleLabel: "جسم متناسق",
    durationValue: "12",
    durationLabel: "أسبوع",
    quote: "خطة مرنة تناسب عملي وحياتي. استعدت ثقتي بنفسي وشكل جسمي خلال فترة قصيرة.",
  },
];

function useInViewOnce<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
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

function renderSignedStatValue(value: string) {
  const signed = value.match(/^([+-])(.+)$/);
  if (!signed) return value;

  return (
    <span className="inline-flex flex-row items-baseline [direction:ltr]">
      <span>{signed[1]}</span>
      <span>{signed[2]}</span>
    </span>
  );
}

function StatColumn({
  icon: Icon,
  value,
  label,
  animateKey,
}: {
  icon: typeof Scale;
  value: string;
  label: string;
  animateKey: string;
}) {
  const isNumericStat = /^[+-]?\d/.test(value);
  const hideLabel = label === value;

  return (
    <div className="flex flex-col items-center justify-center px-1.5">
      <Icon className="h-3 w-3 text-[#FF6B00]" strokeWidth={2.2} />
      <motion.div
        key={animateKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={[
          "mt-1.5 font-[Cairo] font-extrabold leading-none text-[#FF6B00]",
          isNumericStat ? "text-[18px]" : "text-[13px] leading-tight",
        ].join(" ")}
      >
        {renderSignedStatValue(value)}
      </motion.div>
      {!hideLabel && (
        <p className="mt-0.5 font-[Tajawal] text-[13px] text-[#666]">{label}</p>
      )}
    </div>
  );
}

function StorySlideCard({
  story,
  isActive,
  surface,
}: {
  story: StorySlide;
  isActive: boolean;
  surface: "primary" | "clone";
}) {
  const cardClass =
    surface === "primary" ? "success-stories-primary-card" : "success-stories-clone-card";

  return (
    <div
      className={`${cardClass} w-full overflow-hidden rounded-[26px] bg-white shadow-[0_14px_48px_rgba(15,23,42,0.08)]`}
    >
      <motion.div
        className="relative flex h-[310px] w-full overflow-hidden bg-neutral-100"
        animate={{ scale: isActive ? 1 : 0.98 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative w-1/2 overflow-hidden">
          <img
            src={story.before}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover object-top"
          />
          <span
            className="absolute left-3 top-3 grid h-[38px] w-[48px] place-items-center rounded-[10px] bg-[#111] text-[13px] font-bold text-white"
          >
            قبل
          </span>
        </div>
        <div className="relative w-1/2 overflow-hidden">
          <img
            src={story.after}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover object-top"
          />
          <span
            className="absolute right-3 top-3 grid h-[38px] w-[48px] place-items-center rounded-[10px] bg-[#FF6B00] text-[13px] font-bold text-white"
          >
            بعد
          </span>
        </div>
        <div
          className="absolute left-1/2 top-1/2 z-10 grid h-[46px] w-[46px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white shadow-[0_6px_20px_rgba(0,0,0,0.12)]"
          aria-hidden
        >
          <ChevronsRight className="h-5 w-5 text-[#FF6B00]" strokeWidth={2.5} />
        </div>
      </motion.div>

      <div className="grid h-[75px] grid-cols-3 divide-x divide-[#EFE5DD]/80 bg-white">
        <StatColumn
          icon={Scale}
          value={story.weightValue}
          label={story.weightLabel}
          animateKey={`${story.name}-w-${isActive}`}
        />
        <StatColumn
          icon={Dumbbell}
          value={story.muscleValue}
          label={story.muscleLabel}
          animateKey={`${story.name}-m-${isActive}`}
        />
        <StatColumn
          icon={Calendar}
          value={story.durationValue}
          label={story.durationLabel}
          animateKey={`${story.name}-d-${isActive}`}
        />
      </div>

      <div className="px-4 pb-4 pt-2">
        <div className="rounded-[24px] bg-white/85 px-4 py-4 shadow-[0_8px_28px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.03]">
          <p className="text-center font-[Cairo] text-[32px] leading-none text-[#FF6B00]/35" aria-hidden>
            “
          </p>
          <p className="mt-1 text-center font-[Tajawal] text-[15px] leading-[1.65] text-[#111]">
            {story.name === "أحمد العتيبي" ? (
              <>
                كنت أجرب أنظمة كثيرة بدون نتيجة،
                <br />
                مع خطة حكيم المخصصة قدرت أخسر 16 كغ
                <br />
                وأبني جسم قوي وصحي.
              </>
            ) : (
              story.quote
            )}
          </p>
          <motion.div
            initial="hidden"
            animate={isActive ? "visible" : "hidden"}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.06 } },
            }}
            className="mt-2.5 flex justify-center gap-1"
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.span
                key={i}
                variants={{
                  hidden: { opacity: 0, scale: 0.6 },
                  visible: { opacity: 1, scale: 1 },
                }}
              >
                <Star className="h-[18px] w-[18px] fill-[#FF6B00] text-[#FF6B00]" strokeWidth={0} />
              </motion.span>
            ))}
          </motion.div>
          <p className="mt-3.5 text-center font-[Cairo] text-[18px] font-extrabold text-[#111]">
            {story.name}
          </p>
        </div>
      </div>
    </div>
  );
}

function StoriesPrimarySlider() {
  const swiperRef = useRef<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);

  const stopAutoplay = () => {
    if (!autoplayEnabled) return;
    setAutoplayEnabled(false);
    swiperRef.current?.autoplay?.stop();
  };

  return (
    <div className="success-stories-primary-slider-wrap relative mx-auto mt-6 w-[calc(100%-24px)] max-w-[388px]">
      <Swiper
        modules={[Autoplay]}
        dir="rtl"
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        onTouchStart={stopAutoplay}
        onSliderMove={stopAutoplay}
        loop
        speed={680}
        spaceBetween={0}
        slidesPerView={1}
        autoplay={
          autoplayEnabled ? { delay: 2000, disableOnInteraction: true } : false
        }
        className="success-stories-primary-swiper overflow-hidden rounded-[26px]"
      >
        {STORY_SLIDES.map((story) => (
          <SwiperSlide key={story.name}>
            <StorySlideCard
              story={story}
              surface="primary"
              isActive={story.name === STORY_SLIDES[activeIndex].name}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="success-stories-primary-pagination absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/20 px-2 py-1 backdrop-blur-[2px]">
        {STORY_SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`الشريحة ${i + 1}`}
            onClick={() => {
              stopAutoplay();
              swiperRef.current?.slideToLoop(i);
            }}
            className={[
              "success-stories-primary-pagination-dot rounded-full transition-all duration-300",
              i === activeIndex
                ? "h-1.5 w-4 bg-[#FF6B00]"
                : "h-1.5 w-1.5 bg-white/55",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
}

function StoriesCloneSlider() {
  const swiperRef = useRef<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);

  const stopAutoplay = () => {
    if (!autoplayEnabled) return;
    setAutoplayEnabled(false);
    swiperRef.current?.autoplay?.stop();
  };

  return (
    <div className="success-stories-clone-slider-wrap relative mx-auto mt-[30px] w-[calc(100%-24px)] max-w-[388px]">
      <Swiper
        modules={[Autoplay]}
        dir="ltr"
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        onTouchStart={stopAutoplay}
        onSliderMove={stopAutoplay}
        loop
        speed={680}
        spaceBetween={0}
        slidesPerView={1}
        autoplay={
          autoplayEnabled ? { delay: 2000, disableOnInteraction: true } : false
        }
        className="success-stories-clone-swiper overflow-hidden rounded-[26px]"
      >
        {STORY_SLIDES.map((story) => (
          <SwiperSlide key={story.name}>
            <StorySlideCard
              story={story}
              surface="clone"
              isActive={story.name === STORY_SLIDES[activeIndex].name}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="success-stories-clone-pagination absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/20 px-2 py-1 backdrop-blur-[2px]">
        {STORY_SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`الشريحة ${i + 1}`}
            onClick={() => {
              stopAutoplay();
              swiperRef.current?.slideToLoop(i);
            }}
            className={[
              "success-stories-clone-pagination-dot rounded-full transition-all duration-300",
              i === activeIndex
                ? "h-1.5 w-4 bg-[#FF6B00]"
                : "h-1.5 w-1.5 bg-white/55",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
}

function StoriesCloneCTA() {
  return (
    <div className="success-stories-clone-cta mx-auto mt-[22px] w-[calc(100%-36px)] max-w-[360px] rounded-[28px] bg-[#FF6B00]/[0.06] px-3.5 py-[18px]">
      <div className="mb-3 flex items-center justify-center gap-2">
        <Users className="h-5 w-5 text-[#FF6B00]" strokeWidth={2.2} />
        <p className="text-center font-[Tajawal] text-[18px] font-bold text-[#111]">
          أنت يمكن أن تكون العميل القادم!
        </p>
      </div>
      <Link
        to="/quiz"
        className="relative flex h-[72px] w-full items-center overflow-hidden rounded-[36px] cta-gradient px-2 shadow-cta [direction:ltr] animate-cta-premium-pulse [animation-duration:4s]"
      >
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[36px]" aria-hidden>
          <span
            className="absolute inset-y-[-20%] left-0 h-[140%] w-[45%] animate-cta-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent"
          />
        </span>
        <span className="relative z-10 ml-2 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white">
          <ArrowLeft className="h-5 w-5 text-primary" strokeWidth={2.5} />
        </span>
        <span className="relative z-10 flex-1 text-center font-[Tajawal] text-white">
          <span className="block text-[15px] font-extrabold leading-tight">
            ابدأ رحلتك الآن
          </span>
          <span className="mt-0.5 block text-[11px] font-medium text-white/90">
            خطوتك الأولى نحو أفضل نسخة منك
          </span>
        </span>
        <span className="relative z-10 w-12 shrink-0" aria-hidden />
      </Link>
    </div>
  );
}

function StoriesPrimaryBadge({ inView }: { inView: boolean }) {
  return (
    <div
      className="success-stories-primary-badge flex items-center justify-center gap-2.5 transition-all duration-700"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0) scale(1)" : "translateY(16px) scale(0.96)",
      }}
    >
      <span
        aria-hidden
        className="h-px w-7 bg-gradient-to-l from-[#FF6B00]/50 via-[#FF6B00]/18 to-transparent"
      />
      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-full bg-[#FF6B00]/18 blur-md"
        />
        <span
          className="relative inline-flex min-h-[29px] min-w-[175px] items-center justify-center gap-1 rounded-full bg-gradient-to-br from-[#FF6B00]/14 via-white to-[#FF6B00]/10 px-3 py-1 shadow-[0_10px_30px_-12px_rgba(255,107,0,0.45)] ring-1 ring-[#FF6B00]/25 transition-all duration-700 [direction:ltr]"
        >
          <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full" aria-hidden>
            <span
              className="absolute -inset-y-2 -left-1/2 h-[200%] w-[55%] animate-cta-shimmer bg-gradient-to-r from-transparent via-white/55 to-transparent"
            />
          </span>
          <span
            className="relative z-10 grid h-[21px] w-[21px] shrink-0 place-items-center rounded-full bg-white shadow-[0_3px_10px_rgba(255,107,0,0.24)] ring-1 ring-[#FF6B00]/20"
          >
            <span
              aria-hidden
              className="absolute inset-[0.5px] rounded-full bg-[#FF6B00]/18 animate-pulse-soft"
            />
            <Star className="relative z-10 h-3 w-3 fill-[#FF6B00] text-[#FF6B00]" strokeWidth={0} />
          </span>
          <span className="relative z-10 font-[Tajawal] text-[12px] font-extrabold tracking-[0.02em] text-[#FF6B00] [direction:rtl]">
            قصص نجاح عملائنا
          </span>
        </span>
      </div>
      <span
        aria-hidden
        className="h-px w-7 bg-gradient-to-r from-[#FF6B00]/50 via-[#FF6B00]/18 to-transparent"
      />
    </div>
  );
}

function StoriesPrimaryScreen() {
  const { ref, inView } = useInViewOnce<HTMLDivElement>(0.12);

  return (
    <div
      ref={ref}
      className="success-stories-primary-screen relative mx-auto max-w-[430px] px-[18px] pb-0 pt-7"
    >
      <div className="success-stories-primary-header text-center">
        <StoriesPrimaryBadge inView={inView} />

        <div
          className="success-stories-primary-title-wrap transition-all duration-700"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(16px)",
            transitionDelay: "120ms",
          }}
        >
          <h2
            className="success-stories-primary-title origin-top mt-[22px] font-[Tajawal] text-[clamp(19px,6vw,25px)] font-black leading-[1.25] tracking-tight scale-[0.853] transition-all duration-700"
          >
            <span className="success-stories-primary-title-line text-[#111]">نتائج حقيقية</span>
            <br />
            <span className="success-stories-primary-title-highlight text-[#FF6B00]">
              من أشخاص كانوا مثلك تماماً
            </span>
          </h2>
          <div
            aria-hidden
            className="success-stories-primary-title-line-wrap relative mx-auto mt-[5px] h-[2px] w-full max-w-xs overflow-hidden"
          >
            <div
              className="success-stories-primary-title-line-base h-full w-full bg-gradient-to-l from-[#FF6B00]/30 via-[#FF6B00]/12 to-transparent"
            />
            {inView && (
              <span
                className="success-stories-primary-title-line-shimmer pointer-events-none absolute inset-y-0 right-0 w-1/4 animate-title-line-shimmer-pingpong bg-gradient-to-l from-transparent via-[#FF6B00]/55 to-transparent"
              />
            )}
          </div>
        </div>

        <p
          className="success-stories-primary-subtitle mx-auto mt-3.5 max-w-[330px] font-[Tajawal] text-[13px] leading-[1.7] text-[#666] transition-all duration-700"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(16px)",
            transitionDelay: "240ms",
          }}
        >
          أكثر من 10,000 عميل حول العالم
          <br />
          غيروا حياتهم مع حكيم .
        </p>
      </div>

      <StoriesPrimarySlider />
    </div>
  );
}

function StoriesCloneScreen() {
  return (
    <div className="success-stories-clone-screen relative mx-auto max-w-[430px] px-[18px] pb-6 pt-0">
      <StoriesCloneSlider />
      <StoriesCloneCTA />
    </div>
  );
}

export default function SuccessStories() {
  return (
    <section
      id="stories"
      dir="rtl"
      className="relative w-full overflow-x-hidden bg-[#FAF8F5] font-[Tajawal,Cairo,sans-serif] lg:hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 top-16 h-48 w-48 rounded-full bg-[#FF6B00]/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 top-[40%] h-40 w-40 rounded-full bg-beige blur-2xl"
      />

      <StoriesPrimaryScreen />
      <StoriesCloneScreen />
    </section>
  );
}
