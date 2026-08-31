import { useEffect, useMemo, useState } from "react";
import { AgreementCheckbox } from "@/components/checkout/AgreementCheckbox";
import { buildCheckoutDisclosure, CHECKOUT_DISCLOSURE_COPY } from "@/lib/legal/billing";
import { recordCheckoutConsent } from "@/lib/legal/legal-api";
import {
  buildCheckoutReturnContext,
  preparePaidCheckout,
  startProviderCheckout,
  type PublicPaidTierId,
} from "@/lib/payments";
import { getTermOffer, formatOfficialTotal, type SubscriptionTermMonths } from "@/lib/pricing-presentation";
import { supabase } from "@/integrations/supabase/client";
import type { CheckoutReturnSurface } from "@/lib/payments/types";

type AppCheckoutPanelProps = {
  plan: PublicPaidTierId;
  termMonths: SubscriptionTermMonths;
  returnSurface?: CheckoutReturnSurface;
  onTermChange?: (term: SubscriptionTermMonths) => void;
};

export function AppCheckoutPanel({
  plan,
  termMonths,
  returnSurface = "DIRECT_UPGRADE",
  onTermChange,
}: AppCheckoutPanelProps) {
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });
  }, []);

  const offer = useMemo(() => getTermOffer(plan, termMonths), [plan, termMonths]);
  const disclosure = useMemo(() => buildCheckoutDisclosure(plan, termMonths), [plan, termMonths]);

  const providerPreview = useMemo(() => {
    return preparePaidCheckout({
      userId,
      plan,
      termMonths,
      returnContext: buildCheckoutReturnContext(returnSurface),
      legalAccepted: true,
    });
  }, [userId, plan, termMonths, returnSurface]);

  const handleContinue = async () => {
    if (!legalAccepted) {
      setMessage("يجب الموافقة على الشروط قبل المتابعة.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await recordCheckoutConsent(disclosure);
      const result = await startProviderCheckout({
        userId,
        plan,
        termMonths,
        returnContext: buildCheckoutReturnContext(returnSurface),
        legalAccepted,
      });
      if (!result.ok) {
        if (result.code === "PAYMENT_PROVIDER_UNAVAILABLE") {
          setMessage("الدفع الآلي غير متاح حالياً — في انتظار ربط Paddle (P4B).");
        } else if (result.code === "PROVIDER_BINDING_PENDING") {
          setMessage("ربط أسعار Paddle قيد الإعداد — PROVIDER_BINDING_PENDING.");
        } else {
          setMessage(result.message);
        }
      }
    } catch (error) {
      console.error(error);
      setMessage("تعذر تجهيز الدفع.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#E8E4DE] bg-white p-4 text-right" dir="rtl">
      <h3 className="font-[Tajawal] text-[15px] font-black text-[#0F172A]">متابعة الدفع</h3>
      <p className="mt-1 font-[Tajawal] text-[12px] text-[#64748B]">
        {plan === "essential" ? "Essential" : "Premium"} · {formatOfficialTotal(offer.totalPrice)} ·{" "}
        {termMonths} أشهر
      </p>

      <div className="mt-3 flex gap-2">
        {([3, 6] as const).map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => onTermChange?.(term)}
            className={`min-h-10 flex-1 rounded-xl border px-2 font-[Tajawal] text-[12px] font-bold ${
              termMonths === term
                ? "border-primary bg-primary/10 text-primary"
                : "border-[#E8E4DE] bg-[#FAF8F5] text-[#64748B]"
            }`}
          >
            {term} أشهر
          </button>
        ))}
      </div>

      <p className="mt-3 rounded-xl border border-[#FFE0CC] bg-[#FFF8F3] px-3 py-2.5 font-[Tajawal] text-[11px] leading-relaxed text-[#64748B]">
        {CHECKOUT_DISCLOSURE_COPY.ar(disclosure)}
      </p>

      <div className="mt-3">
        <AgreementCheckbox checked={legalAccepted} onChange={setLegalAccepted} />
      </div>

      {!providerPreview.ok && providerPreview.code !== "CHECKOUT_UNAUTHENTICATED" ? (
        <p className="mt-2 font-[Tajawal] text-[11px] font-semibold text-[#B45309]">
          {providerPreview.code === "PAYMENT_PROVIDER_UNAVAILABLE"
            ? "PAYMENT_PROVIDER_UNAVAILABLE — متوقع قبل P4B"
            : providerPreview.code === "PROVIDER_BINDING_PENDING"
              ? "PROVIDER_BINDING_PENDING"
              : null}
        </p>
      ) : null}

      <button
        type="button"
        disabled={busy || !legalAccepted}
        onClick={() => void handleContinue()}
        className="mt-3 flex min-h-12 w-full items-center justify-center rounded-xl bg-primary font-[Tajawal] text-[14px] font-extrabold text-white disabled:opacity-60"
      >
        {busy ? "جاري التجهيز…" : "متابعة الدفع"}
      </button>

      {message ? (
        <p className="mt-2 font-[Tajawal] text-[11px] font-bold text-[#991B1B]">{message}</p>
      ) : null}
    </section>
  );
}
