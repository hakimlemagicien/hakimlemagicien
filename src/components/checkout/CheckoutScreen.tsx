import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Headphones,
  Lock,
  Shield,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { isPaddleConfigured, openPaddleCheckout } from "@/lib/paddle-checkout";
import { AgreementCheckbox } from "./AgreementCheckbox";
import { CheckoutFooter } from "./CheckoutFooter";
import { CheckoutSummaryCard } from "./CheckoutSummaryCard";
import { PaymentCard, type CheckoutPayMethod } from "./PaymentCard";
import { SecurityBanner } from "./SecurityBanner";
import { TrustFeatures } from "./TrustCard";
import {
  ApplePayLogo,
  CardBrandsRow,
  GooglePayLogo,
  PaddleLogo,
} from "./payment-logos";

import type { CheckoutTier } from "./types";

type CheckoutScreenProps = {
  name: string;
  tier: CheckoutTier;
  total?: number;
  onBack: () => void;
};

export function CheckoutScreen({ name, tier, total = 17, onBack }: CheckoutScreenProps) {
  const [method, setMethod] = useState<CheckoutPayMethod>("card");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const paddleReady = isPaddleConfigured();

  const handlePay = async () => {
    if (!legalAccepted || loading) return;
    setLoading(true);
    try {
      await openPaddleCheckout({
        tierId: tier.id,
        customData: { tierId: tier.id, customerName: name, payMethod: method },
      });
    } catch {
      // Paddle not configured or checkout failed
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods: {
    id: CheckoutPayMethod;
    name: string;
    description: string;
    logo: React.ReactNode;
  }[] = [
    {
      id: "card",
      name: "بطاقة بنكية",
      description: "ادفع باستخدام بطاقة فيزا، ماستركارد أو أمريكان إكسبريس",
      logo: <CardBrandsRow />,
    },
    {
      id: "apple_pay",
      name: "Apple Pay",
      description: "ادفع بسهولة وأمان باستخدام Apple Pay",
      logo: <ApplePayLogo className="h-[42px] text-[#0F172A]" />,
    },
    {
      id: "google_pay",
      name: "Google Pay",
      description: "ادفع بسهولة وأمان باستخدام Google Pay",
      logo: <GooglePayLogo className="h-[42px]" />,
    },
  ];

  const ctaDisabled = !legalAccepted || loading;

  return (
    <div
      dir="rtl"
      lang="ar"
      className="h-full w-full overflow-y-auto bg-[#FAFAFA] font-[Cairo,Tajawal,sans-serif]"
    >
      <div className="mx-auto w-full max-w-md px-5 pb-[34px]">
        {/* Top bar — matches other quiz screens */}
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
              آمن 100%
            </div>
          </div>
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} className="h-1.5 flex-1 rounded-full bg-[#FF6B00]" />
            ))}
          </div>
        </div>

        {/* Title — original layout */}
        <div className="mt-4 text-center font-[Tajawal]">
          <h1 className="text-[24px] font-black tracking-tight text-[#0F172A]">
            أكمل <span className="text-[#FF6B00]">طلبك</span> الآن
          </h1>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-neutral-500">
            اختر طريقة الدفع المناسبة لك لبدء برنامجك الرقمي المخصص
          </p>
        </div>

        {/* Summary card — original layout */}
        <CheckoutSummaryCard tier={tier} />

        {/* Payment methods */}
        <section className="mt-6" aria-labelledby="payment-methods-title">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Wallet className="h-5 w-5 text-[#FF5A1F]" aria-hidden />
            <h2 id="payment-methods-title" className="text-[18px] font-bold leading-tight text-[#0F172A]">
              اختر طريقة الدفع
            </h2>
          </div>

          <div className="space-y-2" role="radiogroup" aria-label="طرق الدفع">
            {paymentMethods.map((m, i) => (
              <PaymentCard
                key={m.id}
                {...m}
                selected={method === m.id}
                onSelect={setMethod}
                index={i}
              />
            ))}
          </div>
        </section>

        {/* Security */}
        <div className="mt-2.5">
          <SecurityBanner />
        </div>

        {/* Agreement */}
        <div className="mt-3 rounded-2xl border border-[#ECECEC] bg-white p-3.5">
          <AgreementCheckbox checked={legalAccepted} onChange={setLegalAccepted} />
        </div>

        {/* CTA */}
        <div className="mt-4">
          <p className="mb-3 flex items-center justify-center gap-1.5 text-center text-[11px] leading-[1.45] text-[#6B7280]">
            <Lock className="h-3 w-3 shrink-0" aria-hidden />
            لن يتم تحصيل أي مبلغ حتى تُكمل عملية الدفع بأمان.
          </p>

          <motion.button
            type="button"
            disabled={ctaDisabled}
            whileTap={{ scale: ctaDisabled ? 1 : 0.98 }}
            onClick={() => void handlePay()}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#FF5A1F] text-[18px] font-bold text-white checkout-cta-shadow transition disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="إتمام الدفع الآمن"
          >
            <Lock className="h-5 w-5" aria-hidden />
            {loading ? "جاري التحضير..." : "إتمام الدفع الآمن"}
          </motion.button>

          {paddleReady ? (
            <div className="mt-3 flex flex-col items-center gap-1 text-center">
              <PaddleLogo />
              <p className="text-[11px] leading-[1.45] text-[#9CA3AF]">
                سيتم فتح صفحة دفع آمنة عبر Paddle لإكمال العملية
              </p>
            </div>
          ) : null}
        </div>

        {/* Trust features */}
        <TrustFeatures
          items={[
            { icon: Headphones, title: "دعم مباشر", description: "نرد خلال 24 ساعة", tone: "orange" },
            { icon: Lock, title: "دفع آمن", description: "تشفير على مستوى البنوك", tone: "green" },
            { icon: Shield, title: "خصوصية كاملة", description: "لا نخزّن بيانات البطاقة", tone: "blue" },
          ]}
        />

        <CheckoutFooter />
      </div>
    </div>
  );
}
