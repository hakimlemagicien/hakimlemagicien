import type { HeroGender } from "@/lib/platform/hero-goal-images";
import type { SessionAnatomyVisualKey } from "@/lib/platform/session-muscle-presentation";

/** Top-level folders under `src/assets/content/`. */
export type ContentCollectionId =
  | "home-goal-hero"
  | "workout-goal-hero"
  | "workout-session-muscle";

/** Gender segment folder names inside gendered collections. */
export type ContentGenderSegment = "ذكور" | "بنات";

export type ContentSlotDefinition = {
  collection: ContentCollectionId;
  /** Folder name under the collection (and gender segment when applicable). */
  dirName: string;
  /** Human label in Arabic (for docs and alt text). */
  labelAr: string;
  /** Set for goal collections — content is only served for this gender. */
  gender?: HeroGender;
  goalId?: string;
  visualKey?: SessionAnatomyVisualKey;
  /** Flat collections: canonical file name (e.g. `صدر.webp`). */
  fileName?: string;
};

export type ContentSlotKey = string;

export type ContentAssetEntry = {
  slotKey: ContentSlotKey;
  collection: ContentCollectionId;
  dirName: string;
  gender?: HeroGender;
  genderSegment?: ContentGenderSegment;
  fileName: string;
  url: string;
  repoPath: string;
};

export type ContentSlotSnapshot = {
  slotKey: ContentSlotKey;
  collection: ContentCollectionId;
  dirName: string;
  labelAr: string;
  gender?: HeroGender;
  goalId?: string;
  visualKey?: SessionAnatomyVisualKey;
  repoPath: string;
  fileCount: number;
  fileNames: string[];
  isReady: boolean;
};
