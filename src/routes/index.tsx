import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { resolveAuthenticatedDestination } from "@/lib/auth-onboarding-gate";
import { supabase } from "@/integrations/supabase/client";
import { QuizPage } from "@/routes/quiz";
import { AuthExperience } from "@/components/auth/AuthExperience";
import { productionCanonicalUrl } from "@/lib/env/assert-environment";

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
      throw redirect(await resolveAuthenticatedDestination(data.user));
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
    links: [{ rel: "canonical", href: productionCanonicalUrl("/") }],
  }),
  component: AppEntry,
});
