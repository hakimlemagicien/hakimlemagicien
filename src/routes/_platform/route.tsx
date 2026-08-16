import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { PlatformShell } from "@/components/platform/layout/PlatformShell";
import { useMembership } from "@/hooks/useMembership";
import { supabase } from "@/integrations/supabase/client";

function PlatformErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  return (
    <PlatformShell>
      <div className="px-2 py-16 text-center">
        <h1 className="text-xl font-black text-foreground">تعذر فتح الصفحة</h1>
        <p className="mt-2 text-sm text-muted-foreground">حدث خطأ أثناء الانتقال. حاول مرة أخرى.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground"
        >
          إعادة المحاولة
        </button>
      </div>
    </PlatformShell>
  );
}

export const Route = createFileRoute("/_platform")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
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
