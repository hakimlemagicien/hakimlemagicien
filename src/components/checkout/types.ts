export type CheckoutTier = {
  id: "transform" | "pro" | "vip" | "essential" | "premium";
  name: string;
  pricePerDay: string;
  totalPrice: string;
  billingPeriodMonths?: 3 | 6;
  topBadge?: string;
};
