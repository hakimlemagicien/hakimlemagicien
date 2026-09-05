import { supabase } from "@/integrations/supabase/client";
import { ADMIN_LIBRARY_PAGE_SIZE, clampAdminLibraryLimit } from "./admin-libraries";
import type { DiscoverContentItem } from "@/lib/platform/discover-content";
import { parseGalleryImages } from "@/lib/platform/discover-audience";

export const CONTENT_COVER_BUCKET = "content-covers";
export const CONTENT_COVER_FALLBACK_BUCKET = "program-covers";
export const CONTENT_COVER_MAX_BYTES = 5 * 1024 * 1024;
export const CONTENT_COVER_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

export function validateContentCoverFile(file: File): string | null {
  if (!file.size) return "الملف فارغ.";
  if (file.size > CONTENT_COVER_MAX_BYTES) return "حجم الصورة أكبر من 5 ميغابايت.";
  if (!CONTENT_COVER_MIME.includes(file.type as (typeof CONTENT_COVER_MIME)[number])) {
    return "الصيغة المسموحة: JPG أو PNG أو WebP.";
  }
  return null;
}

function contentCoverExtension(file: File): string {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function classifyStorageUploadError(message: string): "bucket_missing" | "forbidden" | "other" {
  const text = message.toLowerCase();
  if (text.includes("bucket not found")) return "bucket_missing";
  if (
    text.includes("row-level security") ||
    text.includes("violates row-level security") ||
    text.includes("unauthorized") ||
    text.includes("forbidden") ||
    text.includes("permission")
  ) {
    return "forbidden";
  }
  return "other";
}

async function uploadToBucket(bucket: string, path: string, file: File): Promise<{ publicUrl: string } | { error: string; kind: "bucket_missing" | "forbidden" | "other" }> {
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
    cacheControl: "3600",
  });
  if (uploadError) {
    return {
      error: uploadError.message || "upload_failed",
      kind: classifyStorageUploadError(uploadError.message || ""),
    };
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data.publicUrl) return { error: "تعذر الحصول على رابط الصورة بعد الرفع.", kind: "other" };
  return { publicUrl: data.publicUrl };
}

export async function uploadContentCoverImage(input: {
  file: File;
  contentId?: string | null;
}): Promise<string> {
  const validation = validateContentCoverFile(input.file);
  if (validation) throw new Error(validation);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("يجب تسجيل الدخول لرفع الصورة.");

  const folder = input.contentId?.trim() || `drafts/${user.id}`;
  const ext = contentCoverExtension(input.file);
  const fileName = `${Date.now()}.${ext}`;
  const primaryPath = `${folder}/${fileName}`;
  const fallbackPath = `content/${folder}/${fileName}`;

  const primary = await uploadToBucket(CONTENT_COVER_BUCKET, primaryPath, input.file);
  if ("publicUrl" in primary) return primary.publicUrl;

  if (primary.kind === "bucket_missing") {
    const fallback = await uploadToBucket(CONTENT_COVER_FALLBACK_BUCKET, fallbackPath, input.file);
    if ("publicUrl" in fallback) return fallback.publicUrl;
    if (fallback.kind === "forbidden") {
      throw new Error("ليست لديك صلاحية رفع صور المحتوى. سجّل الدخول بحساب المشرف ثم أعد المحاولة.");
    }
    throw new Error("فشل رفع الصورة. أعد المحاولة.");
  }

  if (primary.kind === "forbidden") {
    throw new Error("ليست لديك صلاحية رفع صور المحتوى. سجّل الدخول بحساب المشرف ثم أعد المحاولة.");
  }

  throw new Error("فشل رفع الصورة. أعد المحاولة.");
}

export type AdminContentListItem = {
  id: string;
  title: string;
  slug: string;
  content_type: string;
  status: string;
  author_name: string | null;
  publish_at: string | null;
  updated_at: string;
  featured: boolean;
  sort_priority: number;
  cover_image_path: string | null;
  short_description: string;
  type_payload: Record<string, unknown>;
};

export type AdminContentCategory = {
  id: string;
  slug: string;
  name_ar: string;
  icon: string;
  sort_order: number;
  status: string;
};

export type AdminContentDetail = AdminContentListItem & {
  body: string;
  category_id: string | null;
  access_level: string;
  language: string;
  reading_time_minutes: number | null;
  video_duration_seconds: number | null;
  video_source: string | null;
  tags: string[];
};

function mapList(row: Record<string, unknown>): AdminContentListItem {
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    content_type: String(row.content_type),
    status: String(row.status),
    author_name: (row.author_name as string | null) ?? null,
    publish_at: (row.publish_at as string | null) ?? null,
    updated_at: String(row.updated_at),
    featured: Boolean(row.featured),
    sort_priority: Number(row.sort_priority ?? 99),
    cover_image_path: (row.cover_image_path as string | null) ?? null,
    short_description: String(row.short_description ?? ""),
    type_payload: (row.type_payload as Record<string, unknown>) ?? {},
  };
}

export function getContentGallery(draft: Pick<AdminContentDetail, "cover_image_path" | "type_payload">): string[] {
  const gallery = parseGalleryImages(draft.type_payload.gallery_images);
  const cover = draft.cover_image_path?.trim() || "";
  if (!cover) return gallery;
  return [cover, ...gallery.filter((item) => item !== cover)];
}

export function setContentGallery(
  draft: AdminContentDetail,
  images: string[],
): AdminContentDetail {
  const unique = [...new Set(images.map((item) => item.trim()).filter(Boolean))];
  const cover = unique[0] ?? null;
  const gallery = unique.slice(1);
  return {
    ...draft,
    cover_image_path: cover,
    type_payload: {
      ...draft.type_payload,
      gallery_images: gallery,
    },
  };
}

export async function listAdminDiscoverCategories(): Promise<AdminContentCategory[]> {
  const { data, error } = await supabase.rpc("admin_list_discover_categories");
  if (error) throw error;
  return (data as AdminContentCategory[]) ?? [];
}

export async function setAdminDiscoverContentStatus(
  id: string,
  status: "draft" | "scheduled" | "published" | "unpublished" | "archived",
): Promise<AdminContentDetail> {
  const { error } = await supabase.rpc("admin_set_discover_content_status", { p_id: id, p_status: status });
  if (error) throw error;
  return getAdminDiscoverContent(id);
}

export type AdminContentCounts = {
  total: number;
  published: number;
  archived: number;
  draft: number;
  scheduled: number;
  unpublished: number;
  suppressed: number;
};

export type AdminContentSort = "updated_desc" | "updated_asc" | "title" | "type" | "status" | "priority";

export async function countAdminDiscoverContent(): Promise<AdminContentCounts> {
  const { data, error } = await supabase.rpc("admin_count_discover_content");
  if (error) {
    // Fallback counts via direct select when RPC not yet applied.
    const { data: rows, error: selectError } = await supabase.from("discover_content").select("status");
    if (selectError) throw error;
    const list = (rows ?? []) as Array<{ status: string }>;
    const countOf = (status: string) => list.filter((row) => row.status === status).length;
    return {
      total: list.length,
      published: countOf("published"),
      archived: countOf("archived"),
      draft: countOf("draft"),
      scheduled: countOf("scheduled"),
      unpublished: countOf("unpublished"),
      suppressed: 0,
    };
  }
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    total: Number(row.total ?? 0),
    published: Number(row.published ?? 0),
    archived: Number(row.archived ?? 0),
    draft: Number(row.draft ?? 0),
    scheduled: Number(row.scheduled ?? 0),
    unpublished: Number(row.unpublished ?? 0),
    suppressed: Number(row.suppressed ?? 0),
  };
}

export async function listSuppressedDiscoverSlugs(): Promise<string[]> {
  const { data, error } = await supabase.rpc("admin_list_suppressed_discover_slugs");
  if (error) return [];
  return (data as string[] | null) ?? [];
}

export async function deleteAdminDiscoverContent(id: string): Promise<void> {
  const { error } = await supabase.rpc("admin_delete_discover_content", { p_id: id });
  if (error) throw error;
}

export async function suppressDiscoverSlug(slug: string): Promise<void> {
  const { error } = await supabase.rpc("admin_suppress_discover_slug", { p_slug: slug });
  if (error) throw error;
}

export async function listAdminDiscoverContent(opts: {
  query?: string;
  type?: string | null;
  status?: string | null;
  offset?: number;
  limit?: number;
  sort?: AdminContentSort;
}) {
  const limit = clampAdminLibraryLimit(opts.limit ?? ADMIN_LIBRARY_PAGE_SIZE, 100);
  const offset = Math.max(opts.offset ?? 0, 0);
  const sort = opts.sort ?? "updated_desc";
  let query = supabase
    .from("discover_content")
    .select(
      "id, title, slug, content_type, status, author_name, publish_at, updated_at, featured, sort_priority, cover_image_path, short_description, type_payload",
      { count: "exact" },
    )
    .range(offset, offset + limit - 1);

  if (sort === "title") query = query.order("title", { ascending: true });
  else if (sort === "type") query = query.order("content_type", { ascending: true }).order("updated_at", { ascending: false });
  else if (sort === "status") query = query.order("status", { ascending: true }).order("updated_at", { ascending: false });
  else if (sort === "priority") query = query.order("featured", { ascending: false }).order("sort_priority", { ascending: true }).order("updated_at", { ascending: false });
  else if (sort === "updated_asc") query = query.order("updated_at", { ascending: true });
  else query = query.order("updated_at", { ascending: false });

  if (opts.type) query = query.eq("content_type", opts.type);
  if (opts.status) query = query.eq("status", opts.status);
  const trimmed = opts.query?.trim();
  if (trimmed) {
    query = query.or(`title.ilike.%${trimmed}%,slug.ilike.%${trimmed}%,author_name.ilike.%${trimmed}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    const rpc = await supabase.rpc("admin_list_discover_content", {
      p_query: opts.query?.trim() || null,
      p_type: opts.type || null,
      p_status: opts.status || null,
      p_limit: limit,
      p_offset: offset,
    });
    if (rpc.error) throw error;
    const rows = ((rpc.data ?? []) as Record<string, unknown>[]).map((row) =>
      mapList({
        ...row,
        cover_image_path: row.cover_image_path ?? null,
        short_description: row.short_description ?? "",
        type_payload: row.type_payload ?? {},
      }),
    );
    return {
      rows,
      totalCount: Number((rpc.data as Array<{ total_count?: number }> | null)?.[0]?.total_count ?? rows.length),
    };
  }

  const rows = ((data ?? []) as Record<string, unknown>[]).map(mapList);
  return {
    rows,
    totalCount: count ?? rows.length,
  };
}

export async function getAdminDiscoverContent(id: string): Promise<AdminContentDetail> {
  const { data, error } = await supabase.rpc("admin_get_discover_content", { p_id: id });
  if (error) throw error;
  const row = data as Record<string, unknown>;
  return {
    ...mapList(row),
    body: String(row.body ?? ""),
    category_id: (row.category_id as string | null) ?? null,
    access_level: String(row.access_level ?? "free"),
    language: String(row.language ?? "ar"),
    reading_time_minutes: row.reading_time_minutes == null ? null : Number(row.reading_time_minutes),
    video_duration_seconds: row.video_duration_seconds == null ? null : Number(row.video_duration_seconds),
    video_source: (row.video_source as string | null) ?? null,
    tags: (row.tags as string[]) ?? [],
  };
}

export async function saveAdminDiscoverContent(
  payload: Record<string, unknown>,
  expectedUpdatedAt: string | null,
): Promise<AdminContentDetail> {
  const { data, error } = await supabase.rpc("admin_save_discover_content", {
    p_payload: payload,
    p_expected_updated_at: expectedUpdatedAt,
  });
  if (error) throw error;
  return getAdminDiscoverContent(String((data as { id: string }).id));
}

export async function updateAdminDiscoverPlacement(
  id: string,
  patch: { sort_priority?: number; featured?: boolean },
): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (typeof patch.sort_priority === "number" && Number.isFinite(patch.sort_priority)) {
    updates.sort_priority = Math.max(0, Math.trunc(patch.sort_priority));
  }
  if (typeof patch.featured === "boolean") updates.featured = patch.featured;
  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase.from("discover_content").update(updates).eq("id", id);
  if (error) {
    const current = await getAdminDiscoverContent(id);
    await saveAdminDiscoverContent(
      {
        id: current.id,
        title: current.title,
        slug: current.slug,
        content_type: current.content_type,
        status: current.status,
        short_description: current.short_description,
        body: current.body,
        category_id: current.category_id,
        cover_image_path: current.cover_image_path,
        author_name: current.author_name,
        publish_at: current.publish_at,
        featured: patch.featured ?? current.featured,
        access_level: current.access_level,
        reading_time_minutes: current.reading_time_minutes,
        video_duration_seconds: current.video_duration_seconds,
        video_source: current.video_source,
        tags: current.tags,
        sort_priority: patch.sort_priority ?? current.sort_priority,
        type_payload: current.type_payload,
      },
      current.updated_at || null,
    );
  }
}

export function emptyContentDraft(seed?: Partial<DiscoverContentItem>): AdminContentDetail {
  return {
    id: "",
    title: seed?.title ?? "",
    slug: seed?.slug ?? "",
    content_type: seed?.type ?? "article",
    status: "draft",
    author_name: seed?.authorName ?? "Coach Hakim",
    publish_at: seed?.publishDate ?? null,
    updated_at: "",
    featured: seed?.featured ?? false,
    short_description: seed?.shortDescription ?? "",
    body: seed?.body ?? "",
    category_id: null,
    cover_image_path: typeof seed?.coverImage === "string" ? seed.coverImage : null,
    access_level: seed?.accessLevel ?? "free",
    language: "ar",
    reading_time_minutes: seed?.readingTimeMinutes ?? null,
    video_duration_seconds: seed?.videoDurationSeconds ?? null,
    video_source: seed?.videoSource ?? null,
    tags: seed?.tags ?? [],
    sort_priority: seed?.sortPriority ?? 0,
    type_payload: {
      ...(seed?.audience ? { audience: seed.audience } : {}),
      ...(seed?.galleryImages?.length ? { gallery_images: seed.galleryImages } : {}),
    },
  };
}
