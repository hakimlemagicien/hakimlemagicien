import type { CheckoutReturnOutcome, CheckoutState } from "./types";

const TRANSITIONS: Record<CheckoutState, CheckoutState[]> = {
  IDLE: ["PREPARING", "FAILED"],
  PREPARING: ["READY", "FAILED", "CANCELLED"],
  READY: ["OPENING", "FAILED", "CANCELLED"],
  OPENING: ["PROCESSING", "FAILED", "CANCELLED"],
  PROCESSING: ["CONFIRMATION_DELAYED", "SUCCESS_CONFIRMED", "FAILED", "CANCELLED"],
  CONFIRMATION_DELAYED: ["SUCCESS_CONFIRMED", "FAILED", "CANCELLED"],
  SUCCESS_CONFIRMED: [],
  FAILED: ["IDLE"],
  CANCELLED: ["IDLE"],
};

export class CheckoutStateMachine {
  #state: CheckoutState = "IDLE";

  get state(): CheckoutState {
    return this.#state;
  }

  transition(next: CheckoutState): CheckoutState {
    const allowed = TRANSITIONS[this.#state];
    if (!allowed.includes(next)) {
      throw new Error(`Invalid checkout transition: ${this.#state} -> ${next}`);
    }
    this.#state = next;
    return this.#state;
  }

  reset(): void {
    this.#state = "IDLE";
  }
}

/** Maps untrusted browser return to a non-activating outcome. */
export function mapBrowserReturnToOutcome(cancelled: boolean): CheckoutReturnOutcome {
  return cancelled ? "CANCELLED" : "CONFIRMATION_DELAYED";
}

/** SUCCESS_CONFIRMED requires verified provider event — not available in P4A. */
export function canTransitionToSuccessConfirmed(hasVerifiedProviderEvent: boolean): boolean {
  return hasVerifiedProviderEvent;
}
