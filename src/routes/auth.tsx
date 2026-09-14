import { createFileRoute } from "@tanstack/react-router";
import { AuthExperience } from "@/components/auth/AuthExperience";
import { sanitizeAdminReturnPath } from "@/lib/admin/admin-access";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    view: search.view === "login" ? ("login" as const) : undefined,
    redirect:
      typeof search.redirect === "string" && search.redirect.startsWith("/admin")
        ? sanitizeAdminReturnPath(search.redirect)
        : undefined,
  }),
  head: () => ({ meta: [{ title: "تسجيل الدخول | MAAKFIT" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { view, redirect } = Route.useSearch();

  return <AuthExperience startOnLogin={view === "login"} postLoginRedirect={redirect} />;
}
