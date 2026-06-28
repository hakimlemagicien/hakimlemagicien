import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HeroProblemTransition } from "@/components/HeroProblemTransition";
import { TrustStatistics } from "@/components/TrustStatistics";
import { ProblemSection } from "@/components/ProblemSection";
import { Results90 } from "@/components/Results90";
import HowItWorks from "@/components/HowItWorks";
import WhatYouGet from "@/components/WhatYouGet";
import SuccessStories from "@/components/SuccessStories";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";

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
          <ProblemSection />
        </div>
        <HowItWorks />
        <Results90 />
        <WhatYouGet />
        <SuccessStories />
        <FAQ />
        <FinalCTA />
      </main>
    </div>
  );
}
