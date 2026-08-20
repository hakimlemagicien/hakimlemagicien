import type { LegalLocale } from "./policy-catalog";

export function parseLegalSearch(search: Record<string, unknown>): { lang: LegalLocale } {
  return { lang: search.lang === "en" ? "en" : "ar" };
}
