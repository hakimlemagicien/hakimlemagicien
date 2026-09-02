export {
  CONTENT_ASSETS_ROOT,
  PLATFORM_CONTENT_CATALOG,
  isGenderedCollection,
  repoPathForSlot,
} from "@/lib/platform/content/catalog";
export { CONTENT_GENDER_SEGMENT, contentGenderSegment } from "@/lib/platform/content/gender";
export {
  getContentRegistrySnapshot,
  listContentSlotAssets,
  pickContentSlotAsset,
} from "@/lib/platform/content/asset-index";
export {
  CORE_100_EXERCISE_CONTENT_ROOT,
  CORE_100_EXERCISE_SLOTS,
  CORE_100_REQUIRED_IMAGE_FILES,
  CORE_100_VIDEO_FILES,
  isCore100ExerciseId,
  repoPathForCore100Exercise,
  storageVideoPathForCore100Exercise,
} from "@/lib/platform/content/core-100";
export type {
  ContentAssetEntry,
  ContentCollectionId,
  ContentGenderSegment,
  ContentSlotDefinition,
  ContentSlotKey,
  ContentSlotSnapshot,
} from "@/lib/platform/content/types";
