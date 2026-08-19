import { createFileRoute, isRedirect, Outlet, redirect } from "@tanstack/react-router";
import { PlatformShell } from "@/components/platform/layout/PlatformShell";
import { useMembership } from "@/hooks/useMembership";
import { supabase } from "@/integrations/supabase/client";

function errorDetail(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === "string" && error.trim()) return error.trim();
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message.trim();
  }
  return "";
}

function PlatformErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const detail = errorDetail(error);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4" dir="rtl">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-black text-foreground">تعذر فتح الصفحة</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {detail || "حدث خطأ أثناء الانتقال. حاول مرة أخرى."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              reset();
              window.location.assign("/app");
            }}
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_platform")({
  ssr: false,
  staleTime: 5 * 60 * 1000,
  beforeLoad: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw redirect({ to: "/auth" });
      return { user: session.user };
    } catch (error) {
      if (isRedirect(error)) throw error;
      console.error(error);
      throw redirect({ to: "/auth" });
    }
  },
  component: PlatformLayout,
  errorComponent: PlatformErrorComponent,
});

function PlatformLayout() {
  // Membership now uses placeholder Free data, so we never blank the whole /app shell.
  useMembership();

  return (
    <PlatformShell>
      <Outlet />
    </PlatformShell>
  );
}
