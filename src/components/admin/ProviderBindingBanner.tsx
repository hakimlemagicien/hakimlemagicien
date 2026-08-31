import { getPaymentProviderAvailability } from "@/lib/payments/provider-registry";

export function ProviderBindingBanner() {
  const availability = getPaymentProviderAvailability();
  if (availability.available) return null;

  return (
    <div className="cc-notice cc-notice--info" role="status">
      <strong>مزود الدفع غير مربوط بعد</strong>
      <p>
        نظام العضويات والاستحقاقات الداخلي يعمل على Staging، بينما عمليات الدفع الحقيقية عبر PSP غير
        مفعلة بعد. ستظهر معاملات مزود الدفع هنا بعد الربط.
      </p>
    </div>
  );
}
