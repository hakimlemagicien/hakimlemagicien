import type { Enums } from "@/integrations/supabase/types";

export type PayMethodId = "binance" | "paypal" | "skrill" | "wise";
export type BankId = "uae" | "morocco" | "brazil";

export type PaymentMethod = Enums<"payment_method">;

const PAY_METHOD_MAP: Record<PayMethodId, PaymentMethod> = {
  binance: "binance",
  paypal: "paypal",
  skrill: "skrill",
  wise: "wise",
};

const BANK_METHOD_MAP: Record<BankId, PaymentMethod> = {
  uae: "bank_nbd_uae",
  morocco: "bank_cih_morocco",
  brazil: "pix_brazil",
};

export function mapPayMethodToEnum(method: PayMethodId): PaymentMethod {
  return PAY_METHOD_MAP[method];
}

export function mapBankToPaymentMethod(bank: BankId): PaymentMethod {
  return BANK_METHOD_MAP[bank];
}

export function isPayMethodId(value: string): value is PayMethodId {
  return value in PAY_METHOD_MAP;
}

export function isBankId(value: string): value is BankId {
  return value in BANK_METHOD_MAP;
}
