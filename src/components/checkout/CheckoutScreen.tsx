import { useState } from "react";
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
  badge?: { label: string; tone: "available" | "soon" };
  icon: React.ReactNode;
}[] = [
  {
    id: "bank",
    name: "تحويل بنكي",
    description: "حوّل المبلغ إلى حسابنا البنكي وارفع إيصال التحويل لتأكيد طلبك.",
    badge: { label: "متاح الآن", tone: "available" },
    icon: <Landmark className="h-5 w-5 text-[#64748B]" />,
  },
  {
    id: "card",
    name: "بطاقة بنكية",
    description: "الدفع بالبطاقات الائتمانية قريباً",
    disabled: true,
    badge: { label: "قريباً", tone: "soon" },
    icon: <CreditCard className="h-5 w-5 text-[#64748B]" />,
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
  const [method, setMethod] = useState<CheckoutMethodId>("bank");
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [transferConfirmed, setTransferConfirmed] = useState(false);
  const [receiptSubmitted, setReceiptSubmitted] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [transferSaving, setTransferSaving] = useState(false);
  const [receiptSaving, setReceiptSaving] = useState(false);

  const amount = Number(tier.totalPrice);
  const credentials = getLeadCredentials();

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
    } catch (error) {
      console.error(error);
    } finally {
      setTransferSaving(false);
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
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء إرسال الإيصال. حاول مرة أخرى.");
    } finally {
      setReceiptSaving(false);
    }
  };

  const handlePayClick = () => {
    if (receiptSubmitted || transferConfirmed || !legalAccepted || transferSaving) return;
    if (method === "bank") {
      setBankModalOpen(true);
    }
  };

  const ctaDisabled =
    !legalAccepted || transferSaving || receiptSaving || receiptSubmitted || transferConfirmed;
  const ctaLabel = receiptSubmitted
    ? "قيد مراجعة الدفع"
    : transferSaving
      ? "جاري التسجيل..."
      : receiptSaving
        ? "جاري الإرسال..."
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
                description={option.description}
                selected={method === option.id}
                disabled={option.disabled}
                badge={option.badge}
                icon={option.icon}
                index={i}
                onSelect={setMethod}
              />
            ))}
          </div>
        </section>

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
            { icon: Headphones, title: "دعم مباشر", description: "نرد خلال 24 ساعة", tone: "orange" },
            { icon: Shield, title: "تحويل آمن", description: "حسابات رسمية للشركة", tone: "green" },
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
