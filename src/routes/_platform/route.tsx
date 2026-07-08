import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { PlatformShell } from "@/components/platform/layout/PlatformShell";
import { useMembership } from "@/hooks/useMembership";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_platform")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: PlatformLayout,
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
