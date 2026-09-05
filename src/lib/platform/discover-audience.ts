export const DISCOVER_AUDIENCES = ["female", "male", "food"] as const;
export type DiscoverAudience = (typeof DISCOVER_AUDIENCES)[number];

export const DISCOVER_AUDIENCE_OPTIONS: Array<{ id: DiscoverAudience; label: string; hint: string }> = [
  { id: "female", label: "بنات", hint: "يظهر للعملاء الإناث فقط" },
  { id: "male", label: "ذكور", hint: "يظهر للعملاء الذكور فقط" },
  { id: "food", label: "الأكل", hint: "يظهر للجميع ضمن محتوى التغذية" },
];

export const CONTENT_COVER_SIZE = { width: 1080, height: 1350, ratio: "4:5" } as const;

export function parseDiscoverAudience(value: unknown): DiscoverAudience | null {
  if (value === "female" || value === "male" || value === "food") return value;
  return null;
}

export function contentVisibleToAudience(
  audience: DiscoverAudience | null | undefined,
  gender: "male" | "female" | null,
): boolean {
  if (!audience || audience === "food") return true;
  if (!gender) return false;
  return audience === gender;
}
