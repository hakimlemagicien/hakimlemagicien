export const DISCOVER_AUDIENCES = ["female", "male", "all"] as const;
export type DiscoverAudience = (typeof DISCOVER_AUDIENCES)[number];

/** Legacy CMS value `food` maps to `all` (everyone). */
export const DISCOVER_AUDIENCE_OPTIONS: Array<{ id: DiscoverAudience; label: string; hint: string }> = [
  { id: "female", label: "بنات", hint: "يظهر للعملاء الإناث فقط" },
  { id: "male", label: "ذكور", hint: "يظهر للعملاء الذكور فقط" },
  { id: "all", label: "الكل", hint: "يظهر لجميع العملاء بغض النظر عن الجنس" },
];

export const CONTENT_COVER_SIZE = { width: 1080, height: 1350, ratio: "4:5" } as const;

export function parseDiscoverAudience(value: unknown): DiscoverAudience | null {
  if (value === "female" || value === "male" || value === "all") return value;
  if (value === "food") return "all";
  return null;
}

export function contentVisibleToAudience(
  audience: DiscoverAudience | null | undefined,
  gender: "male" | "female" | null,
): boolean {
  if (!audience || audience === "all") return true;
  if (!gender) return false;
  return audience === gender;
}

export function parseGalleryImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());
}

export function contentGalleryImages(input: {
  coverImage?: string | null;
  galleryImages?: string[] | null;
}): string[] {
  const cover = input.coverImage?.trim() || "";
  const gallery = (input.galleryImages ?? []).map((item) => item.trim()).filter(Boolean);
  const ordered = cover ? [cover, ...gallery.filter((item) => item !== cover)] : gallery;
  return [...new Set(ordered)];
}
