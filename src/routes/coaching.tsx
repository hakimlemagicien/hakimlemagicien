import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HeroProblemTransition } from "@/components/HeroProblemTransition";
import { SectionSkeleton } from "@/components/ui/section-skeleton";
import { SiteFooter } from "@/components/SiteFooter";
import { PRODUCTION_APP_ORIGIN } from "@/lib/env/assert-environment";

const ProblemSection = lazy(() =>
  import("@/components/ProblemSection").then((m) => ({ default: m.ProblemSection })),
);
const HowItWorks = lazy(() => import("@/components/HowItWorks"));
const SuccessStories = lazy(() => import("@/components/SuccessStories"));
const PricingTransparency = lazy(() => import("@/components/PricingTransparency"));
const FAQ = lazy(() => import("@/components/FAQ"));
const FinalCTA = lazy(() => import("@/components/FinalCTA"));

export const Route = createFileRoute("/coaching")({
  head: () => ({
    meta: [
      { title: "MAAKFIT — تطبيق Fitness رقمي للتدريب والتغذية والتقدم" },
      {
        name: "description",
        content:
          "MAAKFIT تطبيق Fitness رقمي كامل يجمع التدريب والتغذية وتتبع التقدم والترطيب داخل حساب واحد، مع باقات FREE وPLUS وPRO.",
      },
      { property: "og:title", content: "MAAKFIT — تطبيق Fitness رقمي كامل" },
      {
        property: "og:description",
        content:
          "تدريب وتغذية وتقدم وترطيب داخل تطبيق MAAKFIT. ابدأ مجاناً واختر PLUS أو PRO عندما تكون جاهزاً.",
      },
    ],
    links: [{ rel: "canonical", href: `${PRODUCTION_APP_ORIGIN}/coaching` }],
  }),
  component: CoachingPage,
});

function CoachingPage() {
  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-background font-sans">
      <Header />
      <main>
        <Hero />
        <HeroProblemTransition />
        <div className="bg-[linear-gradient(180deg,#F3EFE8_0%,#F7F5F2_30%,#FAF8F5_55%,#FFFFFF_92%)]">
          <Suspense fallback={<SectionSkeleton variant="cards" />}>
            <ProblemSection />
          </Suspense>
        </div>
        <Suspense fallback={<SectionSkeleton variant="text" />}>
          <HowItWorks />
        </Suspense>
        <Suspense fallback={<SectionSkeleton variant="cards" />}>
          <SuccessStories />
        </Suspense>
        <Suspense fallback={<SectionSkeleton variant="text" />}>
          <PricingTransparency />
        </Suspense>
        <Suspense fallback={<SectionSkeleton variant="text" />}>
          <FAQ />
        </Suspense>
        <Suspense fallback={<SectionSkeleton variant="hero" />}>
          <FinalCTA />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
