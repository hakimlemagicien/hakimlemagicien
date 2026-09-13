import { getVariantAsset, isVariantAssetReady } from "./metadata";
import {
  GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS,
  GLUTE_P0_FEMALE_MEDIA_EXTERNAL_IDS,
  isGluteFemaleMediaTemplateSlug,
} from "./glute-required-set";
import type {
  FemaleMediaCompleteness,
  GluteReleaseReadiness,
} from "./types";

export type ExerciseVariantStateInput = {
  externalId: string;
  metadata?: Record<string, unknown> | null;
  /** Optional disk/URL probe for female assets not yet in metadata. */
  femaleImageReady?: boolean;
  /** Real READY video only — never temporary still. */
  femaleVideoReady?: boolean;
};

function pct(ready: number, total: number): number {
  if (total <= 0) return 0;
  return Number(((ready / total) * 100).toFixed(2));
}

/**
 * Completeness for a required exercise set.
 * PLACEHOLDER and TEMPORARY_STILL_AS_VIDEO never count as REAL video ready.
 * DISPLAY = IMAGE READY (V1).
 */
export function calculateFemaleMediaCompleteness(
  requiredExternalIds: readonly string[],
  states: readonly ExerciseVariantStateInput[],
  options?: { assetExists?: (path: string) => boolean },
): FemaleMediaCompleteness {
  const byId = new Map(states.map((s) => [s.externalId.toUpperCase(), s]));
  let female_images_ready = 0;
  let female_videos_ready = 0;
  let fully_complete_exercises = 0;
  const required_exercises = requiredExternalIds.length;

  for (const id of requiredExternalIds) {
    const state = byId.get(id.toUpperCase());
    const imageAsset = getVariantAsset(state?.metadata, "FEMALE", "IMAGE");
    const videoAsset = getVariantAsset(state?.metadata, "FEMALE", "VIDEO");
    const imageReady =
      state?.femaleImageReady === true ||
      isVariantAssetReady(imageAsset, { assetExists: options?.assetExists });
    const videoReady =
      state?.femaleVideoReady === true ||
      isVariantAssetReady(videoAsset, { assetExists: options?.assetExists });

    if (imageReady) female_images_ready += 1;
    if (videoReady) female_videos_ready += 1;
    if (imageReady && videoReady) fully_complete_exercises += 1;
  }

  const female_display_ready = female_images_ready;

  return {
    required_exercises,
    female_images_ready,
    female_display_ready,
    female_videos_ready,
    female_real_videos_ready: female_videos_ready,
    fully_complete_exercises,
    image_percent: pct(female_images_ready, required_exercises),
    display_percent: pct(female_display_ready, required_exercises),
    video_percent: pct(female_videos_ready, required_exercises),
    real_video_percent: pct(female_videos_ready, required_exercises),
    full_percent: pct(fully_complete_exercises, required_exercises),
    formula: {
      image: "female_images_ready / required_exercises * 100",
      display: "female_display_ready (IMAGE READY) / required_exercises * 100",
      video: "female_real_videos_ready (VIDEO READY only) / required_exercises * 100",
      real_video: "same as video — TEMPORARY_STILL_AS_VIDEO excluded",
      full: "image+REAL video both READY / required_exercises * 100",
    },
  };
}

export function calculateGluteFemaleMediaCompleteness(
  states: readonly ExerciseVariantStateInput[] = [],
  options?: { assetExists?: (path: string) => boolean },
): FemaleMediaCompleteness {
  return calculateFemaleMediaCompleteness(
    GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS,
    states,
    options,
  );
}

export function calculateP0FemaleMediaCompleteness(
  states: readonly ExerciseVariantStateInput[] = [],
  options?: { assetExists?: (path: string) => boolean },
): FemaleMediaCompleteness {
  return calculateFemaleMediaCompleteness(
    GLUTE_P0_FEMALE_MEDIA_EXTERNAL_IDS,
    states,
    options,
  );
}

/**
 * V1 Glute release gate — female IMAGE/DISPLAY completeness required.
 * Real female video is POST-LAUNCH_MEDIA_UPGRADE (does not block).
 * Independent of runtime STANDARD fallback success.
 */
export function evaluateGluteReleaseReadiness(
  completeness: FemaleMediaCompleteness = calculateGluteFemaleMediaCompleteness([]),
): GluteReleaseReadiness {
  const displayReady =
    completeness.required_exercises > 0 &&
    completeness.female_display_ready === completeness.required_exercises &&
    completeness.display_percent === 100;

  const real_video_upgrade_pending =
    completeness.required_exercises > 0 &&
    completeness.female_real_videos_ready < completeness.required_exercises;

  return {
    status: displayReady ? "GLUTE_RELEASE_READY" : "BLOCKED_BY_FEMALE_MEDIA",
    completeness,
    real_video_upgrade_pending,
    runtime_fallback_does_not_satisfy_release: true,
  };
}

export type FemaleMediaAdminReadinessView = {
  applies: boolean;
  images_label: string;
  display_label: string;
  videos_label: string;
  real_videos_label: string;
  full_label: string;
  video_upgrade_label_ar: string;
  release_label_ar: string;
  preferred_variant: "FEMALE" | "STANDARD";
  completeness: FemaleMediaCompleteness;
  release: GluteReleaseReadiness;
  /** P0 subset (17) — registration batch diagnostics. */
  p0?: {
    completeness: FemaleMediaCompleteness;
    images_label: string;
    display_label: string;
    real_videos_label: string;
  };
};

export function presentFemaleMediaAdminReadiness(input: {
  templateSlug?: string | null;
  preferredMediaVariant?: "FEMALE" | "STANDARD" | null;
  states?: readonly ExerciseVariantStateInput[];
  /** When provided, also compute P0 (17) counters for Admin. */
  includeP0?: boolean;
}): FemaleMediaAdminReadinessView {
  const preferred =
    input.preferredMediaVariant === "FEMALE" || isGluteFemaleMediaTemplateSlug(input.templateSlug ?? "")
      ? "FEMALE"
      : "STANDARD";
  const applies = preferred === "FEMALE";
  const empty: FemaleMediaCompleteness = {
    required_exercises: 0,
    female_images_ready: 0,
    female_display_ready: 0,
    female_videos_ready: 0,
    female_real_videos_ready: 0,
    fully_complete_exercises: 0,
    image_percent: 100,
    display_percent: 100,
    video_percent: 100,
    real_video_percent: 100,
    full_percent: 100,
    formula: {
      image: "n/a",
      display: "n/a",
      video: "n/a",
      real_video: "n/a",
      full: "n/a",
    },
  };
  const completeness = applies
    ? calculateGluteFemaleMediaCompleteness(input.states ?? [])
    : empty;
  const release = applies
    ? evaluateGluteReleaseReadiness(completeness)
    : {
        status: "GLUTE_RELEASE_READY" as const,
        completeness,
        real_video_upgrade_pending: false,
        runtime_fallback_does_not_satisfy_release: true as const,
      };

  const p0Completeness =
    applies && input.includeP0 !== false
      ? calculateP0FemaleMediaCompleteness(input.states ?? [])
      : null;

  return {
    applies,
    preferred_variant: preferred,
    completeness,
    release,
    images_label: applies
      ? `${completeness.female_images_ready} / ${completeness.required_exercises}`
      : "—",
    display_label: applies
      ? `${completeness.female_display_ready} / ${completeness.required_exercises}`
      : "—",
    videos_label: applies
      ? `${completeness.female_real_videos_ready} / ${completeness.required_exercises}`
      : "—",
    real_videos_label: applies
      ? `${completeness.female_real_videos_ready} / ${completeness.required_exercises}`
      : "—",
    full_label: applies
      ? `${completeness.fully_complete_exercises} / ${completeness.required_exercises}`
      : "—",
    video_upgrade_label_ar: !applies
      ? "—"
      : release.real_video_upgrade_pending
        ? "معلّقة — ترقية فيديو حقيقي"
        : "مكتملة",
    release_label_ar: !applies
      ? "لا ينطبق"
      : release.status === "BLOCKED_BY_FEMALE_MEDIA"
        ? "محظور بسبب صور أنثوية ناقصة"
        : release.real_video_upgrade_pending
          ? "جاهز للعرض (ترقية فيديو معلّقة)"
          : "جاهز للإطلاق",
    p0: p0Completeness
      ? {
          completeness: p0Completeness,
          images_label: `${p0Completeness.female_images_ready} / ${p0Completeness.required_exercises}`,
          display_label: `${p0Completeness.female_display_ready} / ${p0Completeness.required_exercises}`,
          real_videos_label: `${p0Completeness.female_real_videos_ready} / ${p0Completeness.required_exercises}`,
        }
      : undefined,
  };
}
