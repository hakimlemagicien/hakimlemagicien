import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Bitcoin,
  ChevronRight,
  Clock,
  CreditCard,
  Headphones,
  Info,
  Landmark,
  Lock,
  Shield,
  ShieldCheck,
} from "lucide-react";
import type { BankId } from "@/lib/bank-details";
import {
  savePaymentMethod,
  saveSelectedPlan,
  submitPaymentProof,
} from "@/lib/lead-api";
import { getLeadCredentials } from "@/lib/lead-storage";
import { mapBankToPaymentMethod } from "@/lib/payment-method-map";
import { MEMBERSHIP_QUERY_KEY } from "@/lib/platform/membership";
import { buildCheckoutDisclosure, CHECKOUT_DISCLOSURE_COPY, resolvePaidTierId } from "@/lib/legal/billing";
import { recordCheckoutConsent } from "@/lib/legal/legal-api";
import { supabase } from "@/integrations/supabase/client";
import {
  buildCheckoutReturnContext,
  LEGACY_BANK_TRANSFER_MODE,
  preparePaidCheckout,
  startProviderCheckout,
} from "@/lib/payments";
import { AgreementCheckbox } from "./AgreementCheckbox";
import { BankTransferModal } from "./BankTransferModal";
import { CheckoutFooter } from "./CheckoutFooter";
import { CheckoutSummaryCard } from "./CheckoutSummaryCard";
import {
  PaymentMethodOption,
  type CheckoutMethodId,
} from "./PaymentMethodOption";
import { ReceiptUploadSection } from "./ReceiptUploadSection";
import { SecurityBanner } from "./SecurityBanner";
import { TrustFeatures } from "./TrustCard";
import type { CheckoutTier } from "./types";

const PAYMENT_METHODS: {
  id: CheckoutMethodId;
  name: string;
  description: string;
  disabled?: boolean;
  badge?: { label: string; tone: "available" | "soon" | "legacy" };
  icon: React.ReactNode;
}[] = [
  {
    id: "card",
    name: "بطاقة بنكية / Apple Pay",
    description: "الدفع الآلي عبر مزود الدفع — يتطلب حساباً مسجلاً.",
    badge: { label: "الافتراضي", tone: "available" },
    icon: <CreditCard className="h-5 w-5 text-[#64748B]" />,
  },
  {
    id: "bank",
    name: "تحويل بنكي (Legacy)",
    description: "مسار استثنائي قديم — مراجعة يدوية. ليس المسار التجاري الافتراضي.",
    badge: { label: "Legacy", tone: "legacy" },
    icon: <Landmark className="h-5 w-5 text-[#64748B]" />,
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "الدفع عبر PayPal قريباً",
    disabled: true,
    badge: { label: "قريباً", tone: "soon" },
    icon: (
      <span className="text-[11px] font-black tracking-tight text-[#003087]">
        Pay<span className="text-[#009CDE]">Pal</span>
      </span>
    ),
  },
  {
    id: "crypto",
    name: "العملات الرقمية",
    description: "دعم العملات الرقمية قريباً",
    disabled: true,
    badge: { label: "قريباً", tone: "soon" },
    icon: <Bitcoin className="h-5 w-5 text-[#F7931A]" />,
  },
];

type CheckoutScreenProps = {
  name: string;
  tier: CheckoutTier;
  total?: number;
  onBack: () => void;
};

export function CheckoutScreen({ tier, total = 17, onBack }: CheckoutScreenProps) {
  const queryClient = useQueryClient();
  const [method, setMethod] = useState<CheckoutMethodId>("card");
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [transferConfirmed, setTransferConfirmed] = useState(false);
  const [receiptSubmitted, setReceiptSubmitted] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [transferSaving, setTransferSaving] = useState(false);
  const [receiptSaving, setReceiptSaving] = useState(false);
  const [providerMessage, setProviderMessage] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [cardBusy, setCardBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setAuthUserId(data.session?.user?.id ?? null);
    });
  }, []);

  const amount = Number(tier.totalPrice);
  const credentials = getLeadCredentials();
  const planId = resolvePaidTierId(tier.id);
  const months = tier.billingPeriodMonths ?? 3;
  const disclosure = planId ? buildCheckoutDisclosure(planId, months) : null;
  const vipCheckoutBlocked = planId === "vip";

  const cardProviderStatus = useMemo(() => {
    if (vipCheckoutBlocked) {
      return { disabled: true, note: "VIP غير متاح للبيع العام." };
    }
    const prepared = preparePaidCheckout({
      userId: authUserId,
      plan: planId ?? tier.id,
      termMonths: months,
      returnContext: buildCheckoutReturnContext("DIRECT_UPGRADE"),
      legalAccepted: true,
    });
    if (!prepared.ok) {
      if (prepared.code === "CHECKOUT_UNAUTHENTICATED") {
        return { disabled: true, note: "سجّل الدخول أولاً لإتمام الدفع الآلي." };
      }
      if (prepared.code === "PAYMENT_PROVIDER_UNAVAILABLE") {
        return { disabled: true, note: "PAYMENT_PROVIDER_UNAVAILABLE — متوقع قبل P4B." };
      }
      if (prepared.code === "PROVIDER_BINDING_PENDING") {
        return { disabled: true, note: "PROVIDER_BINDING_PENDING — ربط Paddle في P4B." };
      }
      return { disabled: true, note: prepared.message };
    }
    return { disabled: false, note: null as string | null };
  }, [authUserId, months, planId, tier.id, vipCheckoutBlocked]);

  const persistConsent = async () => {
    if (!disclosure) return;
    try {
      await recordCheckoutConsent(disclosure);
    } catch (error) {
      console.warn("[checkout consent]", error);
    }
  };

  const handleTransferDone = async (bankId: BankId) => {
    setBankModalOpen(false);
    setTransferConfirmed(true);

    if (!credentials) return;

    setTransferSaving(true);
    try {
      await saveSelectedPlan(credentials, {
        tierId: tier.id,
        tierName: tier.name,
        planPrice: amount,
        trainingMode: "online",
      });
      await savePaymentMethod(credentials, {
        method: mapBankToPaymentMethod(bankId),
        amount,
        currency: "USD",
      });
      await persistConsent();
    } catch (error) {
      console.error(error);
    } finally {
      setTransferSaving(false);
      await queryClient.invalidateQueries({ queryKey: MEMBERSHIP_QUERY_KEY });
    }
  };

  const handleProofSubmit = async (file: File) => {
    if (!credentials) {
      alert("تعذر العثور على بيانات طلبك. ارجع خطوة وأكمل النموذج مرة أخرى.");
      return;
    }
    setReceiptSaving(true);
    try {
      await submitPaymentProof(credentials, file);
      setReceiptSubmitted(true);
      await queryClient.invalidateQueries({ queryKey: MEMBERSHIP_QUERY_KEY });
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء إرسال الإيصال. حاول مرة أخرى.");
    } finally {
      setReceiptSaving(false);
    }
  };

  const handlePayClick = async () => {
    if (receiptSubmitted || transferConfirmed || !legalAccepted || transferSaving || cardBusy) return;
    if (vipCheckoutBlocked) {
      setProviderMessage("VIP غير متاح للشراء العام في Commercial V1.");
      return;
    }
    if (method === "bank") {
      if (LEGACY_BANK_TRANSFER_MODE !== "LEGACY_ONLY") return;
      setBankModalOpen(true);
      return;
    }
    if (method === "card") {
      setCardBusy(true);
      setProviderMessage(null);
      try {
        await persistConsent();
        const result = await startProviderCheckout({
          userId: authUserId,
          plan: planId ?? tier.id,
          termMonths: months,
          returnContext: buildCheckoutReturnContext("DIRECT_UPGRADE"),
          legalAccepted,
        });
        if (!result.ok) {
          setProviderMessage(result.message);
        }
      } catch (error) {
        console.error(error);
        setProviderMessage("تعذر بدء الدفع الآلي.");
      } finally {
        setCardBusy(false);
      }
    }
  };

  const ctaDisabled =
    !legalAccepted ||
    transferSaving ||
    receiptSaving ||
    receiptSubmitted ||
    transferConfirmed ||
    cardBusy ||
    vipCheckoutBlocked ||
    (method === "card" && cardProviderStatus.disabled);
  const ctaLabel = receiptSubmitted
    ? "قيد مراجعة الدفع"
    : transferSaving
      ? "جاري التسجيل..."
      : receiptSaving
        ? "جاري الإرسال..."
        : cardBusy
          ? "جاري تجهيز الدفع..."
          : "إتمام الدفع";

  return (
    <div
      dir="rtl"
      lang="ar"
      className="h-full w-full overflow-y-auto bg-[#FAFAFA] font-[Cairo,Tajawal,sans-serif]"
    >
      <div className="mx-auto w-full max-w-md md:max-w-lg lg:max-w-xl px-5 md:px-8 pb-[34px]">
        <div className="pb-3 pt-5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 text-[13px] font-bold text-neutral-500 active:scale-95"
              aria-label="رجوع"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
              رجوع
            </button>
            <div className="text-[12px] font-extrabold text-[#FF6B00]">
              {total} من {total}
            </div>
            <div className="flex w-12 items-center justify-end gap-1.5 text-[10.5px] font-extrabold text-[#16A34A]">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              آمن
            </div>
          </div>
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} className="h-1.5 flex-1 rounded-full bg-[#FF6B00]" />
            ))}
          </div>
        </div>

        <div className="mt-4 text-center font-[Tajawal]">
          <h1 className="text-[24px] font-black tracking-tight text-[#0F172A]">
            أكمل <span className="text-[#FF6B00]">طلبك</span> الآن
          </h1>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-neutral-500">
            اختر طريقة الدفع المناسبة وأكمل خطوات التحويل
          </p>
        </div>

        <CheckoutSummaryCard tier={tier} />

        {disclosure ? (
          <p className="mt-3 rounded-2xl border border-[#FFE0CC] bg-[#FFF8F3] px-3.5 py-3 text-[11.5px] leading-[1.7] text-neutral-700">
            {CHECKOUT_DISCLOSURE_COPY.ar(disclosure)} الضرائب قد تُضاف حسب الموقع ومزود الدفع لاحقاً. رسوم تحويل البنك ليست تحت سيطرة MAAKFIT.
          </p>
        ) : null}

        <section className="mt-6" aria-labelledby="payment-methods-title">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Lock className="h-4 w-4 text-[#FF5A1F]" aria-hidden />
            <h2 id="payment-methods-title" className="text-[17px] font-bold leading-tight text-[#0F172A]">
              اختر طريقة الدفع
            </h2>
          </div>

          <div className="space-y-2" role="radiogroup" aria-label="طرق الدفع">
            {PAYMENT_METHODS.map((option, i) => (
              <PaymentMethodOption
                key={option.id}
                id={option.id}
                name={option.name}
                description={
                  option.id === "card" && cardProviderStatus.note
                    ? cardProviderStatus.note
                    : option.description
                }
                selected={method === option.id}
                disabled={
                  option.disabled ||
                  (option.id === "card" && cardProviderStatus.disabled) ||
                  vipCheckoutBlocked
                }
                badge={option.badge}
                icon={option.icon}
                index={i}
                onSelect={setMethod}
              />
            ))}
          </div>
        </section>

        {providerMessage ? (
          <p className="mt-3 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-3 text-[11.5px] leading-[1.7] text-[#991B1B]">
            {providerMessage}
          </p>
        ) : null}

        {vipCheckoutBlocked ? (
          <p className="mt-3 rounded-2xl border border-[#E8E4DE] bg-white px-3.5 py-3 text-[11.5px] leading-[1.7] text-neutral-700">
            باقة VIP ليست متاحة للشراء العام. Essential و Premium متاحان عبر /app/upgrade للمستخدمين
            المسجّلين.
          </p>
        ) : null}

        <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-[#ECECEC] bg-[#F9FAFB] px-3.5 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]" aria-hidden />
          <p className="text-[11.5px] leading-[1.65] text-neutral-600">
            بعد رفع إيصال التحويل سيتم مراجعته وتفعيل اشتراكك وإرسال رسالة تأكيد عبر البريد الإلكتروني.
          </p>
        </div>

        <div className="mt-2.5">
          <SecurityBanner />
        </div>

        <div className="mt-3 rounded-2xl border border-[#ECECEC] bg-white p-3.5">
          <AgreementCheckbox checked={legalAccepted} onChange={setLegalAccepted} />
        </div>

        <div className="mt-4">
          <motion.button
            type="button"
            disabled={ctaDisabled}
            whileTap={{ scale: ctaDisabled ? 1 : 0.98 }}
            onClick={handlePayClick}
            className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[17px] font-bold transition checkout-cta-shadow disabled:cursor-not-allowed disabled:opacity-60 ${
              receiptSubmitted
                ? "bg-[#16A34A] text-white"
                : "bg-[#FF5A1F] text-white"
            }`}
          >
            <Lock className="h-5 w-5" aria-hidden />
            {ctaLabel}
          </motion.button>

          {transferConfirmed ? (
            <ReceiptUploadSection
              onSubmit={handleProofSubmit}
              submitted={receiptSubmitted}
              loading={receiptSaving}
            />
          ) : null}
        </div>

        <TrustFeatures
          items={[
            { icon: Headphones, title: "دعم الحساب", description: "متاح لكل الباقات", tone: "orange" },
            { icon: Shield, title: "تحويل بمراجعة", description: "لا تُفعَّل المزايا قبل التأكيد", tone: "green" },
            { icon: Clock, title: "تفعيل سريع", description: "بعد تأكيد الدفع", tone: "blue" },
          ]}
        />

        <CheckoutFooter />
      </div>

      {bankModalOpen ? (
        <BankTransferModal
          tierPriceUsd={tier.totalPrice}
          onClose={() => setBankModalOpen(false)}
          onTransferDone={(bankId) => void handleTransferDone(bankId)}
        />
      ) : null}
    </div>
  );
}
