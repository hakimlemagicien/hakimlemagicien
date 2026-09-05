import { createFileRoute, isRedirect, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PlatformShell } from "@/components/platform/layout/PlatformShell";
import { useAssignedTrainingRuntime } from "@/hooks/useAssignedTrainingRuntime";
import { useHeroGoalSettings } from "@/hooks/useHeroGoalSettings";
import { useMembership } from "@/hooks/useMembership";
import { usePaidTrainingAutoAssign } from "@/hooks/usePaidTrainingAutoAssign";
import { usePlatformActivity } from "@/hooks/usePlatformActivity";
import { CREATE_PASSWORD_LOCATION, userNeedsPasswordSetup } from "@/lib/auth-password-gate";
import { resolvePostAuthDestination } from "@/lib/auth-post-login";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyAccountLifecycle } from "@/lib/platform/account-lifecycle";

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
      const destination = await resolvePostAuthDestination(session.user);
      if (destination.to !== "/app") {
        throw redirect(destination);
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
  useHeroGoalSettings();
  const membership = useMembership();
  const { userId } = usePlatformActivity();
  const hasWorkoutProgram = membership.features.workout_program;
  const runtimeQuery = useAssignedTrainingRuntime(hasWorkoutProgram && !membership.loading);
  usePaidTrainingAutoAssign({
    enabled: !membership.loading && Boolean(userId),
    userId,
    membershipTier: membership.tier,
    hasWorkoutProgram,
    runtimeReason: runtimeQuery.data?.reason,
    runtimeLoading: runtimeQuery.isLoading,
  });
  const [blocked, setBlocked] = useState(false);
  const [blockStatus, setBlockStatus] = useState("active");

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

  useEffect(() => {
    let cancelled = false;
    void fetchMyAccountLifecycle()
      .then((lifecycle) => {
        if (cancelled) return;
        setBlocked(lifecycle.blocked);
        setBlockStatus(lifecycle.status);
      })
      .catch(() => {
        if (!cancelled) setBlocked(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (blocked) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4" dir="rtl">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-black text-foreground">
            {blockStatus === "suspended" ? "الحساب موقوف مؤقتًا" : "الحساب غير متاح"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {blockStatus === "suspended"
              ? "تم إيقاف وصولك مؤقتًا. بياناتك محفوظة ويمكن إعادة التفعيل من الإدارة."
              : "تم تقييد هذا الحساب وفق سياسة الحساب."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PlatformShell>
      <Outlet />
    </PlatformShell>
  );
}
