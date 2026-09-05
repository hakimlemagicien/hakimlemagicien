import { supabase } from "@/integrations/supabase/client";
import { ADMIN_LIBRARY_PAGE_SIZE, clampAdminLibraryLimit } from "./admin-libraries";
import type { DiscoverContentItem } from "@/lib/platform/discover-content";

export const CONTENT_COVER_BUCKET = "content-covers";
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
  const ext = input.file.type === "image/png" ? "png" : input.file.type === "image/webp" ? "webp" : "jpg";
  const path = `${folder}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(CONTENT_COVER_BUCKET).upload(path, input.file, {
    upsert: true,
    contentType: input.file.type || undefined,
    cacheControl: "3600",
  });
  if (uploadError) {
    throw new Error(
      uploadError.message.includes("Bucket not found") || uploadError.message.includes("not found")
        ? "مخزن صور المحتوى غير مفعّل بعد. طبّق هجرة content-covers ثم أعد المحاولة."
        : "فشل رفع الصورة. أعد المحاولة.",
    );
  }

  const { data } = supabase.storage.from(CONTENT_COVER_BUCKET).getPublicUrl(path);
  if (!data.publicUrl) throw new Error("تعذر الحصول على رابط الصورة بعد الرفع.");
  return data.publicUrl;
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
  short_description: string;
  body: string;
  category_id: string | null;
  cover_image_path: string | null;
  access_level: string;
  language: string;
  reading_time_minutes: number | null;
  video_duration_seconds: number | null;
  video_source: string | null;
  tags: string[];
  sort_priority: number;
  type_payload: Record<string, unknown>;
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
  };
}

export async function listAdminDiscoverCategories(): Promise<AdminContentCategory[]> {
  const { data, error } = await supabase.rpc("admin_list_discover_categories");
  if (error) throw error;
  return (data as AdminContentCategory[]) ?? [];
}

export async function listAdminDiscoverContent(opts: {
  query?: string;
  type?: string | null;
  status?: string | null;
  offset?: number;
}) {
  const { data, error } = await supabase.rpc("admin_list_discover_content", {
    p_query: opts.query?.trim() || null,
    p_type: opts.type || null,
    p_status: opts.status || null,
    p_limit: clampAdminLibraryLimit(ADMIN_LIBRARY_PAGE_SIZE),
    p_offset: Math.max(opts.offset ?? 0, 0),
  });
  if (error) throw error;
  const rows = ((data ?? []) as Record<string, unknown>[]).map(mapList);
  return {
    rows,
    totalCount: Number((data as Array<{ total_count?: number }> | null)?.[0]?.total_count ?? rows.length),
  };
}

export async function getAdminDiscoverContent(id: string): Promise<AdminContentDetail> {
  const { data, error } = await supabase.rpc("admin_get_discover_content", { p_id: id });
  if (error) throw error;
  const row = data as Record<string, unknown>;
  return {
    ...mapList(row),
    short_description: String(row.short_description ?? ""),
    body: String(row.body ?? ""),
    category_id: (row.category_id as string | null) ?? null,
    cover_image_path: (row.cover_image_path as string | null) ?? null,
    access_level: String(row.access_level ?? "free"),
    language: String(row.language ?? "ar"),
    reading_time_minutes: row.reading_time_minutes == null ? null : Number(row.reading_time_minutes),
    video_duration_seconds: row.video_duration_seconds == null ? null : Number(row.video_duration_seconds),
    video_source: (row.video_source as string | null) ?? null,
    tags: (row.tags as string[]) ?? [],
    sort_priority: Number(row.sort_priority ?? 0),
    type_payload: (row.type_payload as Record<string, unknown>) ?? {},
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

export async function setAdminDiscoverContentStatus(
  id: string,
  status: "draft" | "scheduled" | "published" | "unpublished" | "archived",
): Promise<AdminContentDetail> {
  const { error } = await supabase.rpc("admin_set_discover_content_status", { p_id: id, p_status: status });
  if (error) throw error;
  return getAdminDiscoverContent(id);
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
    type_payload: seed?.audience ? { audience: seed.audience } : {},
  };
}
