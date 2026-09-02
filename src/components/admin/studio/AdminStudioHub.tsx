import { lazy, Suspense } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ImageIcon, LayoutPanelTop, Loader2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPage";
import {
  HeroGoalStudioPanel,
  type HeroGoalStudioSearch,
} from "@/components/admin/studio/HeroGoalStudioPanel";
import { cn } from "@/lib/utils";

const PlatformDesignStudioPanel = lazy(() =>
  import("@/routes/_platform/app/studio").then((mod) => ({
    default: mod.PlatformDesignStudioPanel,
  })),
);

export type AdminStudioTab = "hero" | "design";

export type AdminStudioSearch = HeroGoalStudioSearch & {
  tab?: AdminStudioTab;
};

function DesignTabFallback() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20">
      <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        جاري تحميل محرر الواجهة…
      </div>
    </div>
  );
}

export function AdminStudioHub({ search }: { search: AdminStudioSearch }) {
  const navigate = useNavigate({ from: "/admin/studio" });
  const tab: AdminStudioTab = search.tab === "design" ? "design" : "hero";

  function setTab(next: AdminStudioTab) {
    void navigate({
      search: (prev) => ({
        ...prev,
        tab: next,
      }),
      replace: true,
    });
  }

  return (
    <div className="cc-page" dir="rtl">
      <AdminPageHeader
        kicker="المحتوى والتصميم"
        title="ستوديو"
        subtitle="معاينة بطاقة الهيرو ومحرر الواجهة — التعديلات المحفوظة تُطبَّق على جميع المستخدمين."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("hero")}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-black transition-colors",
            tab === "hero"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-foreground hover:bg-muted/60",
          )}
        >
          <ImageIcon className="h-4 w-4" />
          بطاقة الهيرو
        </button>
        <button
          type="button"
          onClick={() => setTab("design")}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-black transition-colors",
            tab === "design"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-foreground hover:bg-muted/60",
          )}
        >
          <LayoutPanelTop className="h-4 w-4" />
          محرر الواجهة
        </button>
      </div>

      {tab === "hero" ? (
        <HeroGoalStudioPanel search={search} />
      ) : (
        <div className="admin-studio-design-lab">
          <Suspense fallback={<DesignTabFallback />}>
            <PlatformDesignStudioPanel embedded />
          </Suspense>
        </div>
      )}
    </div>
  );
}
