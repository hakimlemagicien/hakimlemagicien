import { createFileRoute } from "@tanstack/react-router";
import { AuthExperience } from "@/components/auth/AuthExperience";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    view: search.view === "login" ? "login" : undefined,
  }),
  head: () => ({ meta: [{ title: "تسجيل الدخول | MAAKFIT" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { view } = Route.useSearch();

  return <AuthExperience startOnLogin={view === "login"} />;
}
