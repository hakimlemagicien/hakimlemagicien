import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import type { PaymentProviderAdapter, ProviderConfiguration } from "./provider-adapter";
import {
  isProviderBindingPending,
  resolvePublicProviderProductMapping,
} from "./provider-product-map";
import type {
  ProviderCheckoutResult,
  ProviderCheckoutSession,
  ProviderProductMapping,
  PublicPaidTierId,
  TrustedCheckoutRequest,
} from "./types";
import type { SubscriptionTermMonths } from "@/lib/pricing-presentation";

let paddlePromise: Promise<Paddle | undefined> | null = null;

function readClientEnv(name: string): string | undefined {
  const env =
    typeof import.meta !== "undefined" && import.meta.env
      ? (import.meta.env as Record<string, string | undefined>)
      : undefined;
  return env?.[name]?.trim() || undefined;
}

const PADDLE_TOKEN = readClientEnv("VITE_PADDLE_CLIENT_TOKEN");

function getPaddleClientToken(): string | undefined {
  return PADDLE_TOKEN?.trim() || undefined;
}

export function isPaddleConfigured(): boolean {
  return Boolean(getPaddleClientToken());
}

async function getPaddle(): Promise<Paddle | undefined> {
  const token = getPaddleClientToken();
  if (!token) return undefined;
  if (!paddlePromise) {
    paddlePromise = initializePaddle({
      token,
      checkout: { settings: { displayMode: "overlay", theme: "light", locale: "ar" } },
    });
  }
  return paddlePromise;
}

export class PaddleAdapter implements PaymentProviderAdapter {
  readonly id = "paddle" as const;

  isConfigured(): boolean {
    return isPaddleConfigured();
  }

  getConfiguration(): ProviderConfiguration {
    const tokenPresent = isPaddleConfigured();
    const essential3 = resolvePublicProviderProductMapping("essential", 3, "paddle");
    const bindingReady =
      tokenPresent &&
      !isProviderBindingPending(essential3) &&
      !isProviderBindingPending(resolvePublicProviderProductMapping("premium", 6, "paddle"));

    return {
      provider: "paddle",
      configured: tokenPresent,
      clientTokenPresent: tokenPresent,
      bindingReady,
    };
  }

  mapProduct(plan: PublicPaidTierId, termMonths: SubscriptionTermMonths): ProviderProductMapping {
    return resolvePublicProviderProductMapping(plan, termMonths, "paddle");
  }

  async createCheckoutSession(request: TrustedCheckoutRequest): Promise<ProviderCheckoutSession> {
    const mapping = this.mapProduct(request.plan, request.termMonths);
    return {
      provider: "paddle",
      bindingStatus: mapping.bindingStatus,
      priceId: mapping.providerPriceId ?? undefined,
      customData: {
        maakfit_user_id: request.userId,
        maakfit_user_ref: request.providerUserReference,
        maakfit_plan: request.plan,
        maakfit_term: String(request.termMonths),
        maakfit_return_surface: request.returnContext.surface,
        maakfit_catalog_version: request.catalogVersion,
      },
    };
  }

  async openCheckout(session: ProviderCheckoutSession): Promise<ProviderCheckoutResult> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        code: "PAYMENT_PROVIDER_UNAVAILABLE",
        message: "Paddle client token is not configured.",
      };
    }

    if (session.bindingStatus === "PROVIDER_BINDING_PENDING" || !session.priceId) {
      return {
        ok: false,
        code: "PROVIDER_BINDING_PENDING",
        message: "Paddle price binding is pending (P4B).",
      };
    }

    const paddle = await getPaddle();
    if (!paddle) {
      return {
        ok: false,
        code: "PROVIDER_INITIALIZATION_FAILED",
        message: "Failed to initialize Paddle checkout.",
      };
    }

    paddle.Checkout.open({
      items: [{ priceId: session.priceId, quantity: 1 }],
      customData: session.customData,
      settings: {
        successUrl: session.customData.maakfit_return_url,
      },
    });

    return { ok: true, state: "OPENING" };
  }

  normalizeCheckoutReturn(params: URLSearchParams) {
    const cancelled =
      params.get("checkout") === "cancelled" ||
      params.get("paddle_cancel") === "1" ||
      params.get("status") === "cancelled";
    return { outcome: cancelled ? ("CANCELLED" as const) : ("CONFIRMATION_DELAYED" as const) };
  }
}

export const paddleAdapter = new PaddleAdapter();

/** @deprecated Use payment-service / PaddleAdapter — kept for transitional imports. */
export async function openPaddleCheckout(opts: {
  tierId: string;
  customerEmail?: string;
  customData?: Record<string, string>;
}) {
  if (opts.tierId === "vip" || opts.tierId === "transform" || opts.tierId === "pro") {
    if (opts.tierId === "vip") {
      throw new Error("VIP public checkout is blocked in Commercial V1.");
    }
  }

  const plan: PublicPaidTierId =
    opts.tierId === "transform" || opts.tierId === "essential"
      ? "essential"
      : opts.tierId === "pro" || opts.tierId === "premium"
        ? "premium"
        : (() => {
            throw new Error(`Unsupported legacy tier for Paddle: ${opts.tierId}`);
          })();

  const mapping = resolvePublicProviderProductMapping(plan, 3, "paddle");
  if (!mapping.providerPriceId) {
    throw new Error("Paddle price ID not configured for this plan (PROVIDER_BINDING_PENDING).");
  }

  const paddle = await getPaddle();
  if (!paddle) throw new Error("Paddle is not configured.");

  paddle.Checkout.open({
    items: [{ priceId: mapping.providerPriceId, quantity: 1 }],
    customer: opts.customerEmail ? { email: opts.customerEmail } : undefined,
    customData: opts.customData,
  });
}

/** @deprecated Legacy tier map removed — use resolvePublicProviderProductMapping. */
export function getPaddlePriceId(_tierId: string): string | undefined {
  return undefined;
}
