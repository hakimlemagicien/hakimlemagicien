import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { DiscoverContentDetailView } from "@/components/platform/discover/DiscoverContentDetail";
import { HomeDiscoverCard } from "@/components/platform/home/HomeSections";
import type { AdminContentDetail } from "@/lib/admin/admin-content-api";
import { contentDraftToHomePreview, contentDraftToPreviewItem } from "@/lib/admin/admin-content-preview";

const noop = () => {};

export function AdminContentAppScreen({
  draft,
  coverSrc,
  surface = "detail",
}: {
  draft: AdminContentDetail;
  coverSrc: string | null;
  surface?: "home" | "detail";
}) {
  const content = contentDraftToPreviewItem(draft, coverSrc);
  const homeItem = contentDraftToHomePreview(draft, coverSrc);

  if (surface === "home") {
    return (
      <div className="cc-cms-home-preview" dir="rtl">
        <div className="platform-home-section-head">
          <h2 className="platform-home-section-head__title">مختار لك</h2>
          <span className="platform-home-section-head__action">عرض الكل</span>
        </div>
        <HomeDiscoverCard item={homeItem} preview />
      </div>
    );
  }

  return (
    <DiscoverContentDetailView
      preview
      content={content}
      related={[]}
      saved={false}
      liked={false}
      joinedChallenge={false}
      locked={false}
      onToggleSave={noop}
      onToggleLike={noop}
      onShare={noop}
      onUpgrade={noop}
    />
  );
}

export function AdminContentAppPreview({
  draft,
  coverSrc,
  mode,
  onModeChange,
}: {
  draft: AdminContentDetail;
  coverSrc: string | null;
  mode: "mobile" | "desktop";
  onModeChange: (mode: "mobile" | "desktop") => void;
}) {
  const [surface, setSurface] = useState<"home" | "detail">("home");

  return (
    <section className="cc-cms-preview">
      <div className="cc-cms-tabs">
        <button type="button" className={surface === "home" ? "is-active" : undefined} onClick={() => setSurface("home")}>
          بطاقة الرئيسية
        </button>
        <button type="button" className={surface === "detail" ? "is-active" : undefined} onClick={() => setSurface("detail")}>
          تفاصيل المحتوى
        </button>
      </div>
      <div className={mode === "desktop" ? "cc-cms-preview__desktop" : "cc-builder-phone cc-cms-preview__phone"}>
        <AdminContentAppScreen draft={draft} coverSrc={coverSrc} surface={surface} />
      </div>
      <div className="cc-cms-preview__switch">
        <button
          type="button"
          className={mode === "mobile" ? "is-active" : undefined}
          onClick={() => onModeChange("mobile")}
        >
          <Smartphone size={14} /> معاينة الجوال
        </button>
        <button
          type="button"
          className={mode === "desktop" ? "is-active" : undefined}
          onClick={() => onModeChange("desktop")}
        >
          <Monitor size={14} /> معاينة الجهاز
        </button>
      </div>
    </section>
  );
}
