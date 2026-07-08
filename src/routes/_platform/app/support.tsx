import { createFileRoute } from "@tanstack/react-router";
import { PlatformPageHeader, PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { PlaceholderState, UpgradeCta } from "@/components/platform/shared/PlaceholderState";
import { WHATSAPP_COACH_URL } from "@/lib/platform/seed-content";
import { useMembership } from "@/hooks/useMembership";

export const Route = createFileRoute("/_platform/app/support")({
  head: () => ({ meta: [{ title: "Support | Hakim Platform" }] }),
  component: SupportPage,
});

function SupportPage() {
  const { isPremium } = useMembership();

  return (
    <PlatformStack>
      <PlatformPageHeader title="الدعم" subtitle="أسئلة شائعة وتواصل — Premium: واتساب الكوتش." />
      <PlaceholderState
        title="الأسئلة الشائعة والتواصل — Phase 2"
        description="Placeholder للأسئلة الشائعة ونموذج التواصل."
      />
      {isPremium ? (
        <a
          href={WHATSAPP_COACH_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="platform-touch inline-flex w-full items-center justify-center rounded-xl bg-[#25D366] text-sm font-bold text-white"
        >
          تواصل مع الكوتش عبر واتساب
        </a>
      ) : (
        <div className="platform-card p-4 text-center">
          <p className="text-sm text-muted-foreground">الدردشة مع الكوتش متاحة لـ Premium فقط.</p>
          <div className="mt-4">
            <UpgradeCta />
          </div>
        </div>
      )}
    </PlatformStack>
  );
}
