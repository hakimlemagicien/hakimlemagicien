import { createFileRoute } from "@tanstack/react-router";
import { PlatformPageHeader, PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { UpgradeCta } from "@/components/platform/shared/PlaceholderState";
import { supabase } from "@/integrations/supabase/client";
import { useMembership } from "@/hooks/useMembership";

export const Route = createFileRoute("/_platform/app/profile")({
  head: () => ({ meta: [{ title: "Profile | Hakim Platform" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { tier, isPremium, displayName, loading } = useMembership();

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  if (loading) return null;

  return (
    <PlatformStack>
      <PlatformPageHeader title="الملف الشخصي" subtitle="معلوماتك وحالة اشتراكك." />

      <div className="platform-card p-4">
        <h2 className="text-sm font-bold text-muted-foreground">المعلومات الشخصية</h2>
        <p className="mt-2 text-lg font-black">{displayName}</p>
      </div>

      <div className="platform-card p-4">
        <h2 className="text-sm font-bold text-muted-foreground">حالة الاشتراك</h2>
        <p className="mt-2 text-lg font-black capitalize">{tier}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {isPremium
            ? "Premium — اشتراك نشط."
            : "عضو مجاني — ترقية للوصول الكامل."}
        </p>
        {!isPremium ? (
          <div className="mt-4">
            <UpgradeCta />
          </div>
        ) : null}
      </div>

      <div className="platform-card p-4">
        <h2 className="text-sm font-bold text-muted-foreground">سجل المدفوعات</h2>
        <p className="mt-2 text-sm text-muted-foreground">Placeholder — Phase 2.</p>
      </div>

      <button
        type="button"
        onClick={() => void signOut()}
        className="platform-touch inline-flex w-full items-center justify-center rounded-xl border border-border text-sm font-bold text-muted-foreground"
      >
        تسجيل الخروج
      </button>
    </PlatformStack>
  );
}
