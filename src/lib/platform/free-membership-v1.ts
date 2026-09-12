/** FREE Membership V1 — shared contract helpers (no UI / asset imports). */

/** Separated from Exercise Library / Training Engine — marketing promo only. */
export const FREE_TRAINING_PROMO_VIDEO_SRC = "/media/free-membership/training-promo.mp4";

export const FREE_MEMBERSHIP_V1_CONTRACT = {
  training: {
    structure_preview: true,
    promo_video: true,
    exercise_content: false,
  },
  nutrition: {
    breakfast: true,
    remaining_meals: false,
  },
  coach: false,
  full_program: false,
} as const;
