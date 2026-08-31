import { CheckoutStateMachine, mapBrowserReturnToOutcome } from "./checkout-state";
import {
  buildTrustedCheckoutRequest,
  type CheckoutRequestInput,
  type CheckoutRequestResult,
} from "./checkout-request";
import { getActivePaymentProvider } from "./provider-registry";
import { isProviderBindingPending } from "./provider-product-map";
import type {
  CheckoutReturnOutcome,
  CheckoutState,
  PaymentErrorCode,
  ProviderCheckoutResult,
  TrustedCheckoutRequest,
} from "./types";

export type PrepareCheckoutResult =
  | {
      ok: true;
      state: CheckoutState;
      request: TrustedCheckoutRequest;
      bindingPending: boolean;
    }
  | {
      ok: false;
      state: CheckoutState;
      code: PaymentErrorCode;
      message: string;
    };

export function preparePaidCheckout(input: CheckoutRequestInput): PrepareCheckoutResult {
  const machine = new CheckoutStateMachine();
  machine.transition("PREPARING");

  const requestResult = buildTrustedCheckoutRequest(input);
  if (!requestResult.ok) {
    machine.transition("FAILED");
    return {
      ok: false,
      state: machine.state,
      code: requestResult.code,
      message: requestResult.message,
    };
  }

  const adapter = getActivePaymentProvider();
  if (!adapter?.isConfigured()) {
    machine.transition("FAILED");
    return {
      ok: false,
      state: machine.state,
      code: "PAYMENT_PROVIDER_UNAVAILABLE",
      message: "No payment provider is configured for this environment.",
    };
  }

  const mapping = adapter.mapProduct(
    requestResult.request.plan,
    requestResult.request.termMonths,
  );

  if (isProviderBindingPending(mapping)) {
    machine.transition("FAILED");
    return {
      ok: false,
      state: machine.state,
      code: "PROVIDER_BINDING_PENDING",
      message: "Provider product binding is pending (expected before P4B).",
    };
  }

  machine.transition("READY");
  return {
    ok: true,
    state: machine.state,
    request: requestResult.request,
    bindingPending: false,
  };
}

export async function startProviderCheckout(
  input: CheckoutRequestInput,
): Promise<
  | { ok: true; state: CheckoutState; providerResult: ProviderCheckoutResult }
  | { ok: false; state: CheckoutState; code: PaymentErrorCode; message: string }
> {
  const prepared = preparePaidCheckout(input);
  if (!prepared.ok) {
    return prepared;
  }

  const adapter = getActivePaymentProvider();
  if (!adapter) {
    return {
      ok: false,
      state: "FAILED",
      code: "PAYMENT_PROVIDER_UNAVAILABLE",
      message: "No payment provider is configured.",
    };
  }

  const machine = new CheckoutStateMachine();
  machine.transition("PREPARING");
  machine.transition("READY");
  machine.transition("OPENING");

  const session = await adapter.createCheckoutSession(prepared.request);
  session.customData = {
    ...session.customData,
    maakfit_return_url: prepared.request.returnUrl,
  };

  const providerResult = await adapter.openCheckout(session);
  if (!providerResult.ok) {
    machine.transition("FAILED");
    return {
      ok: false,
      state: machine.state,
      code: providerResult.code,
      message: providerResult.message,
    };
  }

  machine.transition("PROCESSING");
  return { ok: true, state: machine.state, providerResult };
}

/** Browser return alone never activates membership — maps to delayed confirmation only. */
export function resolveBrowserCheckoutReturn(cancelled: boolean): {
  state: CheckoutState;
  outcome: CheckoutReturnOutcome;
  trustedActivation: false;
} {
  const machine = new CheckoutStateMachine();
  machine.transition("PREPARING");
  machine.transition("READY");
  machine.transition("OPENING");
  machine.transition("PROCESSING");

  const outcome = mapBrowserReturnToOutcome(cancelled);
  if (outcome === "CANCELLED") {
    machine.transition("CANCELLED");
  } else {
    machine.transition("CONFIRMATION_DELAYED");
  }

  return { state: machine.state, outcome, trustedActivation: false };
}

export function validateCheckoutRequestStructure(
  input: CheckoutRequestInput,
): CheckoutRequestResult {
  return buildTrustedCheckoutRequest(input);
}
