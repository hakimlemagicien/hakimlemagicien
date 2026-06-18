import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProblemSection } from "@/components/ProblemSection";
import { Results90 } from "@/components/Results90";
import CustomProgram from "@/components/CustomProgram";
import HowItWorks from "@/components/HowItWorks";
import WhatYouGet from "@/components/WhatYouGet";
import ChooseTraining from "@/components/ChooseTraining";
import SuccessStories from "@/components/SuccessStories";
import FAQ from "@/components/FAQ";

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
        <ProblemSection />
        <CustomProgram />
        <HowItWorks />
        <Results90 />
        <WhatYouGet />
        <ChooseTraining />
        <SuccessStories />
        <FAQ />
      </main>
    </div>
  );
}
