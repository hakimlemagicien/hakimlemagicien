import { initializePaddle, type Paddle } from "@paddle/paddle-js";

let paddlePromise: Promise<Paddle | undefined> | null = null;

const PADDLE_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined;

export function isPaddleConfigured() {
  return Boolean(PADDLE_TOKEN?.trim());
}

export function getPaddlePriceId(tierId: string): string | undefined {
  const map: Record<string, string | undefined> = {
    transform: import.meta.env.VITE_PADDLE_PRICE_TRANSFORM as string | undefined,
    pro: import.meta.env.VITE_PADDLE_PRICE_PRO as string | undefined,
    vip: import.meta.env.VITE_PADDLE_PRICE_VIP as string | undefined,
  };
  return map[tierId]?.trim() || undefined;
}

async function getPaddle(): Promise<Paddle | undefined> {
  if (!isPaddleConfigured()) return undefined;
  if (!paddlePromise) {
    paddlePromise = initializePaddle({
      token: PADDLE_TOKEN!,
      checkout: { settings: { displayMode: "overlay", theme: "light", locale: "ar" } },
    });
  }
  return paddlePromise;
}

export async function openPaddleCheckout(opts: {
  tierId: string;
  customerEmail?: string;
  customData?: Record<string, string>;
}) {
  const priceId = getPaddlePriceId(opts.tierId);
  if (!priceId) {
    throw new Error("Paddle price ID not configured for this tier.");
  }
  const paddle = await getPaddle();
  if (!paddle) throw new Error("Paddle is not configured.");

  paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    customer: opts.customerEmail ? { email: opts.customerEmail } : undefined,
    customData: opts.customData,
  });
}
