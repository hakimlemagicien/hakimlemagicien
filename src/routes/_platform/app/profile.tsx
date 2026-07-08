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
  const {
    tier,
    is_paid,
    displayName,
    days_remaining,
    starts_at,
    ends_at,
  } = useMembership();

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  const tierLabel: Record<typeof tier, string> = {
    visitor: "Visitor",
    free: "Free",
    essential: "Essential",
    premium: "Premium",
    vip: "VIP",
    admin: "Admin",
  }[tier];

  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString("ar-EG") : "—";

  return (
    <PlatformStack>
      <PlatformPageHeader title="الملف الشخصي" subtitle="معلوماتك وحالة اشتراكك." />

      <div className="platform-card p-4">
        <h2 className="text-sm font-bold text-muted-foreground">المعلومات الشخصية</h2>
        <p className="mt-2 text-lg font-black">{displayName}</p>
      </div>

      <div className="platform-card p-4">
        <h2 className="text-sm font-bold text-muted-foreground">حالة الاشتراك</h2>
        <p className="mt-2 text-lg font-black">{tierLabel}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {is_paid ? "اشتراك مدفوع نشط حسب بيانات العضوية." : "Free Membership"}
        </p>
        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          <p>الأيام المتبقية: <span className="font-bold text-foreground">{days_remaining}</span></p>
          <p>تاريخ البداية: <span className="font-bold text-foreground">{formatDate(starts_at)}</span></p>
          <p>تاريخ النهاية: <span className="font-bold text-foreground">{formatDate(ends_at)}</span></p>
        </div>
        {!is_paid ? (
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
