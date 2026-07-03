export type CheckoutTier = {
  id: "transform" | "pro" | "vip";
  name: string;
  pricePerDay: string;
  totalPrice: string;
  topBadge?: string;
};
