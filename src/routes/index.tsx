import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HeroProblemTransition } from "@/components/HeroProblemTransition";
import { TrustStatistics } from "@/components/TrustStatistics";
import { SectionSkeleton } from "@/components/ui/section-skeleton";
import { SiteFooter } from "@/components/SiteFooter";
import coachImg from "@/assets/coach-photo.png";

const ProblemSection = lazy(() =>
  import("@/components/ProblemSection").then((m) => ({ default: m.ProblemSection })),
);
const HowItWorks = lazy(() => import("@/components/HowItWorks"));
const SuccessStories = lazy(() => import("@/components/SuccessStories"));
const PricingTransparency = lazy(() => import("@/components/PricingTransparency"));
const FAQ = lazy(() => import("@/components/FAQ"));
const FinalCTA = lazy(() => import("@/components/FinalCTA"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hakim Coaching — برنامج تدريبي وغذائي مخصص لهدفك" },
      {
        name: "description",
        content:
          "احصل على برنامج تدريبي وغذائي مخصص 100% لهدفك. تحليل شخصي مجاني خلال دقائق مع متابعة دورية ونتائج قابلة للقياس.",
      },
      { property: "og:title", content: "Hakim Coaching — برنامج تدريبي وغذائي مخصص" },
      {
        property: "og:description",
        content: "اكتشف الخطة المناسبة لجسمك وأهدافك بناءً على تحليل شخصي مجاني.",
      },
    ],
    links: [
      { rel: "preload", href: coachImg, as: "image", fetchPriority: "high" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-background font-sans">
      <Header />
      <main>
        <Hero />
        <TrustStatistics className="hidden lg:block" />
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
