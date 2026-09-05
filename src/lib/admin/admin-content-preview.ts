import type { AdminContentDetail } from "@/lib/admin/admin-content-api";
import { DISCOVER_TYPES, discoverTypeLabel } from "@/lib/admin/admin-libraries";
import {
  CONTENT_COVER_SIZE,
  contentGalleryImages,
  parseDiscoverAudience,
  parseGalleryImages,
  type DiscoverAudience,
} from "@/lib/platform/discover-audience";
import type { DiscoverContentItem, DiscoverContentType } from "@/lib/platform/discover-content";
import type { DiscoverPreviewItem } from "@/lib/platform/home-hub";

export { CONTENT_COVER_SIZE };

export function slugFromContentTitle(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || `content-${Date.now().toString(36)}`;
}

export function countContentWords(body: string): number {
  return body.trim() ? body.trim().split(/\s+/).length : 0;
}

export function getDraftAudience(draft: AdminContentDetail): DiscoverAudience | null {
  return parseDiscoverAudience(draft.type_payload.audience);
}

export function setDraftAudience(draft: AdminContentDetail, audience: DiscoverAudience): AdminContentDetail {
  return {
    ...draft,
    type_payload: {
      ...draft.type_payload,
      audience,
    },
  };
}

export function contentDraftToPreviewItem(
  draft: AdminContentDetail,
  coverOverride?: string | null,
): DiscoverContentItem {
  const type = DISCOVER_TYPES.includes(draft.content_type as (typeof DISCOVER_TYPES)[number])
    ? (draft.content_type as DiscoverContentType)
    : "article";
  const now = draft.updated_at || new Date().toISOString();
  const minutes =
    draft.reading_time_minutes ?? Math.max(1, Math.round(countContentWords(draft.body) / 180));
  const gallery = contentGalleryImages({
    coverImage: coverOverride || draft.cover_image_path,
    galleryImages: parseGalleryImages(draft.type_payload.gallery_images),
  });
  return {
    id: draft.id || "preview",
    type,
    title: draft.title.trim() || "بدون عنوان",
    slug: draft.slug.trim() || "preview",
    shortDescription: draft.short_description,
    body: draft.body,
    categoryId: draft.category_id || "general",
    coverImage: gallery[0] || coverOverride || draft.cover_image_path || "",
    galleryImages: gallery.slice(1),
    authorName: draft.author_name?.trim() || "Coach Hakim",
    publishDate: draft.publish_at || now,
    createdAt: now,
    updatedAt: now,
    tags: draft.tags,
    featured: draft.featured,
    accessLevel: draft.access_level === "premium" ? "premium" : "free",
    status: "draft",
    language: "ar",
    readingTimeMinutes: minutes,
    videoDurationSeconds: draft.video_duration_seconds ?? undefined,
    videoSource: draft.video_source ?? undefined,
    audience: getDraftAudience(draft),
    source: "cms",
  };
}

export function contentDraftToHomePreview(
  draft: AdminContentDetail,
  coverOverride?: string | null,
): DiscoverPreviewItem {
  const item = contentDraftToPreviewItem(draft, coverOverride);
  const gallery = contentGalleryImages({
    coverImage: item.coverImage,
    galleryImages: item.galleryImages,
  });
  const minutes =
    item.readingTimeMinutes ??
    (item.videoDurationSeconds ? Math.max(1, Math.round(item.videoDurationSeconds / 60)) : null);
  return {
    id: item.id,
    title: item.title,
    description: minutes ? `${minutes} دقائق` : item.shortDescription.trim() || discoverTypeLabel(item.type),
    href: `/app/discover/${item.slug}`,
    coverSrc: gallery[0] || undefined,
    gallerySrcs: gallery.length > 1 ? gallery : undefined,
    badge: discoverTypeLabel(item.type),
    badgeTone: item.type === "recipe" ? "recipe" : item.type === "video" ? "workout" : "article",
    showPlay: item.type === "video",
  };
}
