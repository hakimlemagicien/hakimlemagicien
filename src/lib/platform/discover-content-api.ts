import { supabase } from "@/integrations/supabase/client";
import { parseDiscoverAudience, parseGalleryImages } from "./discover-audience";
import {
  DISCOVER_CONTENT_SEED,
  setDiscoverCatalog,
  type DiscoverAccessLevel,
  type DiscoverContentItem,
  type DiscoverContentStatus,
  type DiscoverContentType,
} from "./discover-content";
import { overlayDiscoverCatalog } from "./library-overlays";

type DiscoverRow = {
  id: string;
  content_type: DiscoverContentType;
  title: string;
  slug: string;
  short_description: string;
  body: string;
  category_id: string | null;
  cover_image_path: string | null;
  author_name: string | null;
  publish_at: string | null;
  created_at: string;
  updated_at: string;
  featured: boolean;
  access_level: DiscoverAccessLevel;
  status: DiscoverContentStatus;
  language: string;
  reading_time_minutes: number | null;
  video_duration_seconds: number | null;
  video_source: string | null;
  view_count: number | null;
  tags: string[] | null;
  sort_priority: number | null;
  type_payload?: Record<string, unknown> | null;
};

function mapDiscoverRow(row: DiscoverRow): DiscoverContentItem {
  const cover = row.cover_image_path ?? "";
  return {
    id: row.id,
    type: row.content_type,
    title: row.title,
    slug: row.slug,
    shortDescription: row.short_description,
    body: row.body,
    categoryId: row.category_id ?? "health",
    coverImage: cover,
    authorName: row.author_name ?? "Coach Hakim",
    publishDate: row.publish_at ?? row.created_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: row.tags ?? [],
    featured: row.featured,
    accessLevel: row.access_level,
    status: row.status,
    language: "ar",
    readingTimeMinutes: row.reading_time_minutes ?? undefined,
    videoDurationSeconds: row.video_duration_seconds ?? undefined,
    videoSource: row.video_source ?? undefined,
    viewCount: row.view_count ?? undefined,
    sortPriority: row.sort_priority ?? undefined,
    audience: parseDiscoverAudience(row.type_payload?.audience),
    galleryImages: parseGalleryImages(row.type_payload?.gallery_images),
    source: "cms",
  };
}

function mergeDiscoverItem(seed: DiscoverContentItem | undefined, dbItem: DiscoverContentItem): DiscoverContentItem {
  if (!seed) return dbItem;
  return {
    ...seed,
    ...dbItem,
    coverImage: dbItem.coverImage || seed.coverImage,
    categoryId: seed.categoryId || dbItem.categoryId,
    recipe: dbItem.recipe ?? seed.recipe,
    challenge: dbItem.challenge ?? seed.challenge,
    successStory: dbItem.successStory ?? seed.successStory,
    learnings: dbItem.learnings ?? seed.learnings,
    audience: dbItem.audience ?? seed.audience ?? null,
    galleryImages: dbItem.galleryImages?.length ? dbItem.galleryImages : seed.galleryImages,
    source: "cms",
  };
}

export async function hydrateDiscoverFromSupabase(): Promise<"supabase" | "json"> {
  try {
    const [{ data, error }, hidden] = await Promise.all([
      supabase
        .from("discover_content")
        .select(
          "id, content_type, title, slug, short_description, body, category_id, cover_image_path, author_name, publish_at, created_at, updated_at, featured, access_level, status, language, reading_time_minutes, video_duration_seconds, video_source, view_count, tags, sort_priority, type_payload",
        )
        .order("publish_at", { ascending: false }),
      supabase.rpc("client_list_hidden_library_keys"),
    ]);
    if (error) throw error;
    const hiddenSlugs = hidden.error
      ? []
      : (((hidden.data ?? {}) as { discover_slugs?: string[] }).discover_slugs ?? []);
    const dbItems = ((data ?? []) as unknown as DiscoverRow[]).map(mapDiscoverRow);
    setDiscoverCatalog(overlayDiscoverCatalog(DISCOVER_CONTENT_SEED, dbItems, hiddenSlugs, mergeDiscoverItem));
    return dbItems.length > 0 || hiddenSlugs.length > 0 ? "supabase" : "json";
  } catch {
    setDiscoverCatalog(null);
    return "json";
  }
}
