/**
 * Exercise media variants — one canonical exercise, STANDARD + FEMALE media.
 * Stored in exercises.metadata.media_variants (no duplicate exercise rows).
 */

export const EXERCISE_MEDIA_VARIANTS = ["STANDARD", "FEMALE"] as const;
export type ExerciseMediaVariant = (typeof EXERCISE_MEDIA_VARIANTS)[number];

export const EXERCISE_MEDIA_VARIANT_TYPES = ["IMAGE", "VIDEO"] as const;
export type ExerciseMediaVariantType = (typeof EXERCISE_MEDIA_VARIANT_TYPES)[number];

/**
 * Variant asset lifecycle.
 * PLACEHOLDER never counts as READY.
 * TEMPORARY_STILL_AS_VIDEO is playable in the player but never REAL_VIDEO_READY.
 */
export const EXERCISE_MEDIA_VARIANT_STATUSES = [
  "READY",
  "MISSING",
  "PROCESSING",
  "PLACEHOLDER",
  "TEMPORARY_STILL_AS_VIDEO",
] as const;
export type ExerciseMediaVariantStatus = (typeof EXERCISE_MEDIA_VARIANT_STATUSES)[number];

export const EXERCISE_MEDIA_VARIANTS_METADATA_KEY = "media_variants" as const;

export type ExerciseMediaVariantAsset = {
  media_type: ExerciseMediaVariantType;
  status: ExerciseMediaVariantStatus;
  /** Public path (`/exercises/...`) or Storage object path (`exercises/...`). */
  path: string | null;
  /** Optional display URL when already signed / absolute. */
  url?: string | null;
  version?: number;
  updated_at?: string;
  /** VIDEO only — real demo video still required (temp still occupying path). */
  real_video_required?: boolean;
  /** VIDEO only — awaiting file replace at the same path. */
  replacement_pending?: boolean;
};

export type ExerciseMediaVariantBundle = {
  IMAGE?: ExerciseMediaVariantAsset;
  VIDEO?: ExerciseMediaVariantAsset;
};

export type ExerciseMediaVariantsMap = Partial<
  Record<ExerciseMediaVariant, ExerciseMediaVariantBundle>
>;

export type ExerciseMediaVariantsMetadata = {
  media_variants: ExerciseMediaVariantsMap;
};

export type ResolveExerciseMediaInput = {
  externalId: string;
  preferredVariant: ExerciseMediaVariant;
  mediaType: ExerciseMediaVariantType;
  /** exercises.metadata (may be empty). */
  metadata?: Record<string, unknown> | null;
  /**
   * STANDARD hints from existing architecture (DB columns / public stage packs).
   * Used when metadata.STANDARD is absent so we do not break current media.
   */
  standardHint?: {
    path?: string | null;
    url?: string | null;
    /** When false, STANDARD is treated as missing even if path exists. */
    ready?: boolean;
  };
  /**
   * Optional existence probe (Node/tests). Browser may omit — then READY requires
   * metadata status READY + non-empty path/url.
   */
  assetExists?: (path: string) => boolean;
};

export type ResolveExerciseMediaResult = {
  selectedVariant: ExerciseMediaVariant | null;
  outcome: "READY" | "MEDIA_MISSING";
  mediaType: ExerciseMediaVariantType;
  path: string | null;
  url: string | null;
  fallbackUsed: boolean;
  /** Why this outcome — for tests / admin diagnostics. */
  reason: string;
};

export type FemaleMediaCompleteness = {
  required_exercises: number;
  /** IMAGE_COMPLETENESS — FEMALE image status READY */
  female_images_ready: number;
  /**
   * DISPLAY_COMPLETENESS — V1 female display (image READY).
   * Temporary still-as-video does not reduce display readiness.
   */
  female_display_ready: number;
  /**
   * REAL_VIDEO_COMPLETENESS — FEMALE video status READY only.
   * TEMPORARY_STILL_AS_VIDEO never counts.
   */
  female_videos_ready: number;
  /** Alias of female_videos_ready for explicit reporting. */
  female_real_videos_ready: number;
  /** Image+real-video both READY (post-upgrade full media). */
  fully_complete_exercises: number;
  image_percent: number;
  display_percent: number;
  video_percent: number;
  real_video_percent: number;
  full_percent: number;
  formula: {
    image: string;
    display: string;
    video: string;
    real_video: string;
    full: string;
  };
};

export type GluteReleaseReadiness = {
  status: "GLUTE_RELEASE_READY" | "BLOCKED_BY_FEMALE_MEDIA";
  completeness: FemaleMediaCompleteness;
  /** V1: female images/display required; real video is post-launch upgrade. */
  real_video_upgrade_pending: boolean;
  /** Explicit: runtime STANDARD fallback does NOT flip this to READY. */
  runtime_fallback_does_not_satisfy_release: true;
};

export type RegisterExerciseMediaAssetInput = {
  exerciseExternalId: string;
  variant: ExerciseMediaVariant;
  mediaType: ExerciseMediaVariantType;
  path: string;
  status: ExerciseMediaVariantStatus;
  /** Current exercises.metadata object (mutated copy returned). */
  metadata?: Record<string, unknown> | null;
  /** Known valid exercise IDs — reject unknown. */
  knownExternalIds: ReadonlySet<string> | readonly string[];
  /** Optional: reject READY when file missing. */
  assetExists?: (path: string) => boolean;
  version?: number;
  real_video_required?: boolean;
  replacement_pending?: boolean;
};

export type RegisterExerciseMediaAssetResult =
  | {
      ok: true;
      metadata: Record<string, unknown>;
      idempotent: boolean;
      asset: ExerciseMediaVariantAsset;
    }
  | {
      ok: false;
      code:
        | "UNKNOWN_EXERCISE"
        | "UNKNOWN_VARIANT"
        | "UNKNOWN_MEDIA_TYPE"
        | "UNKNOWN_STATUS"
        | "EMPTY_PATH"
        | "CONFLICTING_ASSET"
        | "PLACEHOLDER_MARKED_READY"
        | "MISSING_FILE_MARKED_READY"
        | "PATH_VARIANT_MISMATCH";
      message: string;
    };

export function isExerciseMediaVariant(value: unknown): value is ExerciseMediaVariant {
  return value === "STANDARD" || value === "FEMALE";
}

export function isExerciseMediaVariantType(value: unknown): value is ExerciseMediaVariantType {
  return value === "IMAGE" || value === "VIDEO";
}

export function isExerciseMediaVariantStatus(value: unknown): value is ExerciseMediaVariantStatus {
  return (
    value === "READY" ||
    value === "MISSING" ||
    value === "PROCESSING" ||
    value === "PLACEHOLDER" ||
    value === "TEMPORARY_STILL_AS_VIDEO"
  );
}

export function isTemporaryStillAsVideoStatus(
  value: unknown,
): value is "TEMPORARY_STILL_AS_VIDEO" {
  return value === "TEMPORARY_STILL_AS_VIDEO";
}
