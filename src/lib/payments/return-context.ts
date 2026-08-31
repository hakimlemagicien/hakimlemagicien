import { currentAppOrigin } from "@/lib/env/assert-environment";
import type { CheckoutReturnContext, CheckoutReturnSurface } from "./types";

const SURFACE_DEFAULT_PATH: Record<CheckoutReturnSurface, string> = {
  TRAINING: "/app/program/workout",
  NUTRITION: "/app/nutrition",
  DIRECT_UPGRADE: "/app/upgrade",
  BILLING: "/app/billing",
};

export function defaultReturnPath(surface: CheckoutReturnSurface): string {
  return SURFACE_DEFAULT_PATH[surface];
}

export function buildCheckoutReturnContext(
  surface: CheckoutReturnSurface,
  returnPath?: string,
): CheckoutReturnContext {
  return {
    surface,
    returnPath: returnPath ?? defaultReturnPath(surface),
  };
}

export function buildCheckoutReturnUrl(context: CheckoutReturnContext): string {
  const origin = currentAppOrigin();
  const path = context.returnPath ?? defaultReturnPath(context.surface);
  const url = new URL(path.startsWith("/") ? path : `/${path}`, origin);
  url.searchParams.set("checkout", "return");
  url.searchParams.set("surface", context.surface);
  return url.toString();
}

export function buildUpgradeCheckoutLink(plan: "essential" | "premium", termMonths: 3 | 6): string {
  const url = new URL("/app/upgrade", currentAppOrigin());
  url.searchParams.set("plan", plan);
  url.searchParams.set("term", String(termMonths));
  return url.pathname + url.search;
}
