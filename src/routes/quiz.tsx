import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "ابدأ تقييمك المجاني — Hakim Coaching" },
      { name: "description", content: "ابدأ تحليلك الشخصي المجاني للحصول على خطتك المخصصة." },
    ],
  }),
  component: QuizPage,
});

function QuizPage() {
  return (
    <div dir="rtl" lang="ar" className="min-h-screen grid place-items-center bg-background px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-3xl sm:text-4xl font-black text-foreground">التقييم المجاني</h1>
        <p className="mt-3 text-muted-foreground">قريباً — سيبدأ تقييمك الشخصي من هنا.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-full cta-gradient text-white font-bold px-6 py-3 shadow-cta"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
