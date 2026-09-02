import type { ContentCollectionId, ContentSlotDefinition } from "@/lib/platform/content/types";

export const CONTENT_ASSETS_ROOT = "src/assets/content";

export const WORKOUT_SESSION_MUSCLE_COLLECTION: ContentCollectionId = "workout-session-muscle";

/** 14 flat anatomy files — one image per session title (Arabic file name). */
export const SESSION_MUSCLE_SLOTS: ContentSlotDefinition[] = [
  { collection: WORKOUT_SESSION_MUSCLE_COLLECTION, dirName: "صدر", labelAr: "صدر", fileName: "صدر.webp", visualKey: "PUSH" },
  { collection: WORKOUT_SESSION_MUSCLE_COLLECTION, dirName: "ظهر", labelAr: "ظهر", fileName: "ظهر.webp", visualKey: "PULL" },
  { collection: WORKOUT_SESSION_MUSCLE_COLLECTION, dirName: "أكتاف", labelAr: "أكتاف", fileName: "أكتاف.webp", visualKey: "SHOULDERS" },
  { collection: WORKOUT_SESSION_MUSCLE_COLLECTION, dirName: "بايسبس", labelAr: "بايسبس", fileName: "بايسبس.webp", visualKey: "ARMS" },
  { collection: WORKOUT_SESSION_MUSCLE_COLLECTION, dirName: "ترايسبس", labelAr: "ترايسبس", fileName: "ترايسبس.webp", visualKey: "ARMS" },
  { collection: WORKOUT_SESSION_MUSCLE_COLLECTION, dirName: "أرجل", labelAr: "أرجل", fileName: "أرجل.webp", visualKey: "LEGS" },
  { collection: WORKOUT_SESSION_MUSCLE_COLLECTION, dirName: "بطن", labelAr: "بطن", fileName: "بطن.webp", visualKey: "CORE" },
  {
    collection: WORKOUT_SESSION_MUSCLE_COLLECTION,
    dirName: "صدر-وترايسبس",
    labelAr: "صدر وترايسبس",
    fileName: "صدر-وترايسبس.webp",
    visualKey: "PUSH",
  },
  {
    collection: WORKOUT_SESSION_MUSCLE_COLLECTION,
    dirName: "صدر-وبايسبس",
    labelAr: "صدر وبايسبس",
    fileName: "صدر-وبايسبس.webp",
    visualKey: "PUSH",
  },
  {
    collection: WORKOUT_SESSION_MUSCLE_COLLECTION,
    dirName: "ظهر-وبايسبس",
    labelAr: "ظهر وبايسبس",
    fileName: "ظهر-وبايسبس.webp",
    visualKey: "PULL",
  },
  {
    collection: WORKOUT_SESSION_MUSCLE_COLLECTION,
    dirName: "بايسبس-وترايسبس",
    labelAr: "بايسبس وترايسبس",
    fileName: "بايسبس-وترايسبس.webp",
    visualKey: "ARMS",
  },
  {
    collection: WORKOUT_SESSION_MUSCLE_COLLECTION,
    dirName: "الجزء-العلوي",
    labelAr: "الجزء العلوي",
    fileName: "الجزء-العلوي.webp",
    visualKey: "UPPER",
  },
  {
    collection: WORKOUT_SESSION_MUSCLE_COLLECTION,
    dirName: "الجسم-كامل",
    labelAr: "الجسم كامل",
    fileName: "الجسم-كامل.webp",
    visualKey: "FULL_BODY",
  },
  {
    collection: WORKOUT_SESSION_MUSCLE_COLLECTION,
    dirName: "يوم-راحة",
    labelAr: "يوم راحة",
    fileName: "يوم-راحة.webp",
    visualKey: "REST",
  },
];

const GOAL_SLOTS: Omit<ContentSlotDefinition, "collection">[] = [
  { dirName: "خسارة-الدهون", labelAr: "خسارة الدهون", gender: "male", goalId: "fat" },
  { dirName: "بناء-العضلات", labelAr: "بناء العضلات", gender: "male", goalId: "muscle" },
  { dirName: "تحسين-اللياقة-والطاقة", labelAr: "تحسين اللياقة والطاقة", gender: "male", goalId: "fitness" },
  { dirName: "جسم-رياضي-ومتناسق", labelAr: "جسم رياضي ومتناسق", gender: "male", goalId: "athletic" },
  { dirName: "تغيير-شكل-الجسم", labelAr: "تغيير شكل الجسم", gender: "male", goalId: "shape" },
  { dirName: "زيادة-وزن-صحي", labelAr: "زيادة وزن صحي", gender: "male", goalId: "gain" },
  { dirName: "خسارة-الدهون", labelAr: "خسارة الدهون", gender: "female", goalId: "fat" },
  { dirName: "تكبير-المؤخرة", labelAr: "تكبير المؤخرة", gender: "female", goalId: "glutes" },
  { dirName: "خصر-أنحف-ومشدود", labelAr: "خصر أنحف ومشدود", gender: "female", goalId: "waist" },
  { dirName: "جسم-متناسق-وأنثوي", labelAr: "جسم متناسق وأنثوي", gender: "female", goalId: "body" },
  { dirName: "جسم-صحي-ورياضي", labelAr: "جسم صحي ورياضي", gender: "female", goalId: "fit" },
  { dirName: "تحسين-شكل-الصدر", labelAr: "تحسين شكل الصدر", gender: "female", goalId: "tone" },
];

function withCollection(
  collection: ContentCollectionId,
  rows: Omit<ContentSlotDefinition, "collection">[],
): ContentSlotDefinition[] {
  return rows.map((row) => ({ ...row, collection }));
}

/** Master catalog — every upload slot the app knows about. */
export const PLATFORM_CONTENT_CATALOG: ContentSlotDefinition[] = [
  ...withCollection("home-goal-hero", GOAL_SLOTS),
  ...withCollection("workout-goal-hero", GOAL_SLOTS),
  ...SESSION_MUSCLE_SLOTS,
];

export function isGenderedCollection(collection: ContentCollectionId): boolean {
  return collection === "home-goal-hero" || collection === "workout-goal-hero";
}

export function isFlatFileCollection(collection: ContentCollectionId): boolean {
  return collection === WORKOUT_SESSION_MUSCLE_COLLECTION;
}

export function repoPathForSlot(slot: ContentSlotDefinition): string {
  if (isFlatFileCollection(slot.collection)) {
    const fileName = slot.fileName ?? `${slot.dirName}.webp`;
    return `${CONTENT_ASSETS_ROOT}/${slot.collection}/${fileName}`;
  }
  if (isGenderedCollection(slot.collection) && slot.gender) {
    const segment = slot.gender === "female" ? "بنات" : "ذكور";
    return `${CONTENT_ASSETS_ROOT}/${slot.collection}/${segment}/${slot.dirName}`;
  }
  return `${CONTENT_ASSETS_ROOT}/${slot.collection}/${slot.dirName}`;
}

export function resolveSessionMuscleFileName(dirName: string): string | null {
  const slot = SESSION_MUSCLE_SLOTS.find((row) => row.dirName === dirName);
  return slot?.fileName ?? null;
}
