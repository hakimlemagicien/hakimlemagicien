import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { resolvePostAuthDestination } from "@/lib/auth-post-login";
import { supabase } from "@/integrations/supabase/client";
import { QuizPage } from "@/routes/quiz";
import { AuthExperience } from "@/components/auth/AuthExperience";

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

function shouldOpenQuizImmediately(step?: string) {
  if (step) return true;
  if (typeof window === "undefined") return false;
  const blob = `${window.location.search}${window.location.hash}`;
  return /[?&#](code|type|access_token|token_hash)=/.test(blob);
}

function AppEntry() {
  const { step } = Route.useSearch();
  const [showQuiz, setShowQuiz] = useState(Boolean(step));

  useEffect(() => {
    if (shouldOpenQuizImmediately(step)) setShowQuiz(true);
  }, [step]);

  if (showQuiz) {
    return <QuizPage />;
  }

  return <AuthExperience />;
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    step: typeof search.step === "string" ? search.step : undefined,
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) {
      const destination = await resolvePostAuthDestination(data.user);
      if (destination.to === "/app") {
        throw redirect({ to: "/app" });
      }
      if (destination.to === "/quiz") {
        throw redirect(destination);
      }
      throw redirect(destination);
    }
  },
  pendingComponent: AppEntryPending,
  pendingMs: 0,
  head: () => ({
    meta: [
      { title: "MAAKFIT — ابدأ رحلتك" },
      {
        name: "description",
        content: "سجّل دخولك أو ابدأ تقييمك المجاني للحصول على خطتك المخصصة.",
      },
    ],
    links: [{ rel: "canonical", href: "https://hakimlemagicien.com/" }],
  }),
  component: AppEntry,
});
