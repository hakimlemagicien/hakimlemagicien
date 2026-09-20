import { createFileRoute, isRedirect, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PlatformShell } from "@/components/platform/layout/PlatformShell";
import { useAssignedTrainingRuntime } from "@/hooks/useAssignedTrainingRuntime";
import { useHeroGoalSettings } from "@/hooks/useHeroGoalSettings";
import { useMembership } from "@/hooks/useMembership";
import { usePaidTrainingAutoAssign } from "@/hooks/usePaidTrainingAutoAssign";
import { useNutritionAutoAssign } from "@/hooks/useNutritionAutoAssign";
import { useProgramPreparationHold } from "@/hooks/useProgramPreparationHold";
import { useCustomerJourney } from "@/hooks/useCustomerJourney";
import { usePlatformActivity } from "@/hooks/usePlatformActivity";
import { CREATE_PASSWORD_LOCATION, userNeedsPasswordSetup } from "@/lib/auth-password-gate";
import { resolveAuthenticatedDestination } from "@/lib/auth-onboarding-gate";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyAccountLifecycle } from "@/lib/platform/account-lifecycle";

const approvedPlatformUsers = new Set<string>();

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
      if (approvedPlatformUsers.has(session.user.id)) {
        return { user: session.user };
      }
      const destination = await resolveAuthenticatedDestination(session.user);
      if (destination.to !== "/app") {
        throw redirect(destination);
      }
      approvedPlatformUsers.add(session.user.id);
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
  const journey = useCustomerJourney();
  const runtimeQuery = useAssignedTrainingRuntime(hasWorkoutProgram && !membership.loading);
  const { hold, loading: holdLoading } = useProgramPreparationHold({
    coachAssigned: runtimeQuery.data?.reason === "ok",
  });
  // Customer Journey V1 owns first assignment timing. Existing/grandfathered users are already ready.
  usePaidTrainingAutoAssign({
    enabled:
      !membership.loading && Boolean(userId) && !holdLoading && journey.data?.phase === "ready",
    userId,
    membershipTier: membership.tier,
    hasWorkoutProgram,
    runtimeReason: runtimeQuery.data?.reason,
    runtimeLoading: runtimeQuery.isLoading || holdLoading,
  });
  // Nutrition assignment is a customer-journey operation, not an Admin action.
  // It runs only after preparation and the safety/time inputs are complete.
  useNutritionAutoAssign({
    enabled:
      Boolean(userId) &&
      journey.data?.phase === "ready" &&
      Boolean(journey.data.trainingMealWindow),
    userId,
    trainingMealWindow: journey.data?.trainingMealWindow,
  });

  useEffect(() => {
    if (!hold.active || !hasWorkoutProgram) return;
    const timer = window.setInterval(() => {
      void runtimeQuery.refetch();
    }, 20_000);
    return () => window.clearInterval(timer);
  }, [hold.active, hasWorkoutProgram, runtimeQuery.refetch]);

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
