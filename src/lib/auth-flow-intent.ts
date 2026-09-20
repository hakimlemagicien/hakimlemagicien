export type PasswordFlowIntent = "recovery" | "invite";

export const PASSWORD_FLOW_QUERY_KEY = "flow";
export const PASSWORD_RECOVERY_FLOW_VALUE = "password-recovery";

function toUrl(value: string | URL): URL {
  if (value instanceof URL) return value;
  return new URL(value, "https://maakfit.com");
}

/**
 * Recovery links using PKCE may return only `code`, so the explicit `flow`
 * marker is the durable source of truth. Legacy hash/query `type` values stay
 * supported for existing email links.
 */
export function getPasswordFlowIntent(value: string | URL): PasswordFlowIntent | null {
  const url = toUrl(value);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  const type = hashParams.get("type") ?? url.searchParams.get("type");
  const flow = url.searchParams.get(PASSWORD_FLOW_QUERY_KEY);

  if (flow === PASSWORD_RECOVERY_FLOW_VALUE || type === "recovery") return "recovery";
  if (type === "invite") return "invite";
  return null;
}

export function passwordRecoveryRedirectUrl(origin: string): string {
  const url = new URL("/auth", origin);
  url.searchParams.set(PASSWORD_FLOW_QUERY_KEY, PASSWORD_RECOVERY_FLOW_VALUE);
  return url.toString();
}

/** Remove one-time Auth material only after the new password is saved. */
export function cleanPasswordFlowLocation(value: string | URL): string {
  const url = toUrl(value);
  for (const key of ["code", "token_hash", "type", PASSWORD_FLOW_QUERY_KEY]) {
    url.searchParams.delete(key);
  }
  url.hash = "";
  return `${url.pathname}${url.search}`;
}
