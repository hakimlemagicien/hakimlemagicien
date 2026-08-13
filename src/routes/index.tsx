import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { QuizPage } from "@/routes/quiz";

function AppEntryPending() {
  return (
    <div
      dir="rtl"
      lang="ar"
      className="fixed inset-0 flex items-center justify-center bg-[#FAF8F5]"
      aria-busy="true"
      aria-label="جاري التحميل"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    step: typeof search.step === "string" ? search.step : undefined,
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) {
      throw redirect({ to: "/app" });
    }
  },
  pendingComponent: AppEntryPending,
  pendingMs: 0,
  head: () => ({
    meta: [
      { title: "ابدأ تقييمك المجاني — Hakim Coaching" },
      {
        name: "description",
        content: "ابدأ تحليلك الشخصي المجاني للحصول على خطتك المخصصة.",
      },
    ],
    links: [{ rel: "canonical", href: "https://hakimlemagicien.com/" }],
  }),
  component: QuizPage,
});
