/** Environment identity. Production Supabase must never be used by a Staging build. */

export const PRODUCTION_SUPABASE_REF = "ufgrbpakuemamggwypdh";
export const STAGING_SUPABASE_REF = "dxerwrdpcflpnjvsnrjq";

export const PRODUCTION_APP_ORIGIN = "https://hakimlemagicien.com";
export const STAGING_APP_ORIGIN = "https://staging.hakimlemagicien.com";

/** Auth email redirects must use the canonical Staging host, not a Preview *.vercel.app origin. */
export function resolveAppOrigin(appEnv: string, windowOrigin?: string | null): string {
  const env = String(appEnv || "").toLowerCase();
  if (env === "staging") return STAGING_APP_ORIGIN;
  if (windowOrigin) return windowOrigin.replace(/\/$/, "");
  return PRODUCTION_APP_ORIGIN;
}

export function currentAppOrigin(): string {
  const vite = import.meta.env as Record<string, string | undefined>;
  const appEnv = String(vite.VITE_APP_ENV || process.env.VITE_APP_ENV || process.env.APP_ENV || "").toLowerCase();
  const windowOrigin = typeof window !== "undefined" ? window.location.origin : null;
  return resolveAppOrigin(appEnv, windowOrigin);
}

function readRuntimeUrl(): { appEnv: string; url: string } {
  const vite = import.meta.env as Record<string, string | undefined>;
  return {
    appEnv: String(vite.VITE_APP_ENV || process.env.VITE_APP_ENV || process.env.APP_ENV || "").toLowerCase(),
    url: String(vite.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ""),
  };
}

export function supabaseRefFromUrl(url: string): string | null {
  const match = url.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match?.[1] ?? null;
}

export function assertEnvironmentIsolation(): void {
  const { appEnv, url } = readRuntimeUrl();
  if (!appEnv || !url) return;

  const ref = supabaseRefFromUrl(url);
  const hitsProduction = ref === PRODUCTION_SUPABASE_REF || url.includes(PRODUCTION_SUPABASE_REF);
  const hitsStaging = ref === STAGING_SUPABASE_REF || url.includes(STAGING_SUPABASE_REF);

  if (appEnv === "staging" && hitsProduction) {
    throw new Error("STAGING_ISOLATION_FAILED: Staging runtime resolved Production Supabase ufgrbpakuemamggwypdh");
  }
  if (appEnv === "production" && hitsStaging) {
    throw new Error("PRODUCTION_ISOLATION_FAILED: Production runtime resolved Staging Supabase");
  }
}
