import { createFileRoute, isRedirect, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { PlatformShell } from "@/components/platform/layout/PlatformShell";
import { useMembership } from "@/hooks/useMembership";
import { CREATE_PASSWORD_LOCATION, userNeedsPasswordSetup } from "@/lib/auth-password-gate";
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
      if (userNeedsPasswordSetup(session.user)) {
        throw redirect(CREATE_PASSWORD_LOCATION);
      }
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
  const navigate = useNavigate();
  useMembership();

  useEffect(() => {
    function kickIfPasswordMissing(user: Parameters<typeof userNeedsPasswordSetup>[0]) {
      if (!userNeedsPasswordSetup(user)) return;
      void navigate(CREATE_PASSWORD_LOCATION);
    }

    void supabase.auth.getSession().then(({ data }) => {
      kickIfPasswordMissing(data.session?.user);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      kickIfPasswordMissing(session?.user);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <PlatformShell>
      <Outlet />
    </PlatformShell>
  );
}
