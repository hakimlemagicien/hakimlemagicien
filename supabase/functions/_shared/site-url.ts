const PRODUCTION_SITE_URL = "https://hakimlemagicien.com";

export function siteUrl(): string {
  const raw = Deno.env.get("SITE_URL") ?? PRODUCTION_SITE_URL;
  const url = raw.replace(/\/$/, "");

  if (/localhost|127\.0\.0\.1/i.test(url)) {
    console.warn(
      "[site-url] SITE_URL is localhost — forcing production URL for client auth links.",
    );
    return PRODUCTION_SITE_URL;
  }

  return url;
}

export function authRedirectUrl(): string {
  return `${siteUrl()}/auth`;
}

/** Fix Supabase action links when project Site URL is still localhost. */
export function normalizeActionLink(actionLink: string): string {
  const target = authRedirectUrl();
  const encodedTarget = encodeURIComponent(target);

  return actionLink
    .replace(/redirect_to=http%3A%2F%2F[^&]+/gi, `redirect_to=${encodedTarget}`)
    .replace(/redirect_to=https%3A%2F%2Flocalhost[^&]*/gi, `redirect_to=${encodedTarget}`)
    .replace(/redirect_to=http:\/\/localhost[^&]*/gi, target)
    .replace(/redirect_to=https:\/\/localhost[^&]*/gi, target);
}
