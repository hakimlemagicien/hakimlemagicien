import type { HeroGender } from "@/lib/platform/hero-goal-images";
import type { ContentGenderSegment } from "@/lib/platform/content/types";

export const CONTENT_GENDER_SEGMENT: Record<HeroGender, ContentGenderSegment> = {
  male: "ذكور",
  female: "بنات",
};

export function contentGenderSegment(gender: HeroGender): ContentGenderSegment {
  return CONTENT_GENDER_SEGMENT[gender];
}

export function heroGenderFromSegment(segment: ContentGenderSegment): HeroGender {
  return segment === "بنات" ? "female" : "male";
}
