/**
 * V1 public launch gates — product / ops (not legal advice).
 * Paddle remains PENDING PROVIDER VALIDATION per PAYMENTS_AND_SUBSCRIPTIONS_V1.md.
 */
export const V1_LAUNCH_MODE = "MANUAL_MEMBERSHIP_ONLY" as const;

export type V1LaunchMode = typeof V1_LAUNCH_MODE | "PADDLE_SELF_SERVE";

/** When true, checkout UI must not expose live Paddle until provider validation passes. */
export const CHECKOUT_SELF_SERVE_ENABLED = false as const;

export const LAUNCH_DECISIONS = {
  paddle: "MANUAL_ONLY_UNTIL_PROVIDER_APPROVED",
  membershipGrant: "ADMIN_OVERRIDE_OR_OPS_SCRIPT",
  productionV1Migrations: "REQUIRED_BEFORE_V1_FEATURES",
} as const;
