import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Results90 } from "@/components/Results90";

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
        <HowItWorks />
        <Results90 />
      </main>
    </div>
  );
}
