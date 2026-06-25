/** Unified client social-proof count shown across the landing page. */
export const SOCIAL_PROOF_CLIENT_COUNT = 10000;

export function formatSocialProofClientCount(): string {
  return `+${SOCIAL_PROOF_CLIENT_COUNT.toLocaleString("en-US")}`;
}
