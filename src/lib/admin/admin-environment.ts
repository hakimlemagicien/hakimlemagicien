import {
  PRODUCTION_SUPABASE_REF,
  STAGING_SUPABASE_REF,
} from "@/lib/env/assert-environment";

export type AdminAppEnvironment = "staging" | "production" | "development";

function readViteEnv(): Record<string, string | undefined> {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env as Record<string, string | undefined>;
  }
  return {};
}

/** Authoritative admin environment label — VITE_APP_ENV first, then Supabase ref. */
export function resolveAdminEnvironment(): AdminAppEnvironment {
  const vite = readViteEnv();
  const appEnv = String(vite.VITE_APP_ENV || process.env.VITE_APP_ENV || process.env.APP_ENV || "").toLowerCase();
  if (appEnv === "staging") return "staging";
  if (appEnv === "production") return "production";

  const url = String(vite.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "");
  if (url.includes(STAGING_SUPABASE_REF)) return "staging";
  if (url.includes(PRODUCTION_SUPABASE_REF)) return "production";
  return "development";
}

export function adminEnvironmentLabel(env: AdminAppEnvironment): string {
  if (env === "staging") return "STAGING";
  if (env === "production") return "PRODUCTION";
  return "DEV";
}

export function adminEnvironmentHint(env: AdminAppEnvironment): string {
  if (env === "staging") return "بيئة اختبار — ليست الإنتاج";
  if (env === "production") return "بيئة الإنتاج";
  return "بيئة تطوير محلية";
}
