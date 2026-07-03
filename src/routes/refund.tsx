import { createFileRoute } from "@tanstack/react-router";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import {
  PRODUCT_SUMMARY,
  SITE_BRAND,
  SITE_LEGAL_ENTITY,
  SITE_SUPPORT_EMAIL,
  SITE_WHATSAPP,
  PAYMENT_PROCESSING_SUMMARY,
  PAYMENT_PADDLE_DISCLOSURE,
} from "@/lib/site-legal";

export const Route = createFileRoute("/refund")({
  component: RefundPage,
});

function RefundPage() {
  return (
    <LegalPageShell
      kind="refund"
      title="سياسة الاسترجاع والإلغاء"
      description={`توضّح ${SITE_BRAND} (${SITE_LEGAL_ENTITY}) شروط استرجاع المبالغ وإلغاء الطلبات للخدمات الرقمية.`}
      sections={[
        {
          title: "1. طبيعة الخدمة",
          body: [
            PRODUCT_SUMMARY.type,
            `مدة البرنامج: ${PRODUCT_SUMMARY.duration}.`,
            PRODUCT_SUMMARY.delivery,
            "بمجرد بدء إعداد خطتك المخصصة وتسليمها، تُعتبر الخدمة قيد التنفيذ.",
          ],
        },
        {
          title: "2. فترة الاسترجاع — 7 أيام",
          body: [
            "يمكنك طلب استرجاع كامل خلال 7 أيام من تاريخ الدفع إذا لم تكن قد استلمت خطتك المخصصة بعد أو لم يبدأ فريقنا بإعدادها.",
            "بعد تسليم الخطة أو بدء التخصيص الفعلي، لا يُقبل الاسترجاع الكامل إلا في حالات استثنائية (انظر أدناه).",
          ],
        },
        {
          title: "3. حالات غير مؤهلة للاسترجاع",
          body: [
            "بعد استلام برنامجك المخصص (خطة التدريب/التغذية) عبر الواتساب أو البريد.",
            "إذا تمت الاستفادة من جلسات المتابعة أو التعديلات على الخطة.",
            "في حال انتهاك شروط الاستخدام أو مشاركة المحتوى مع الغير.",
          ],
        },
        {
          title: "4. الاستثناءات",
          body: [
            "خطأ تقني من طرفنا يمنع تسليم الخدمة.",
            "دفع مكرر بالخطأ.",
            "في هذه الحالات، راجعنا خلال 14 يوماً وسنعالج الطلب خلال 5–10 أيام عمل.",
          ],
        },
        {
          title: "5. كيفية طلب الاسترجاع",
          body: [
            `أرسل إلى ${SITE_SUPPORT_EMAIL} أو واتساب ${SITE_WHATSAPP} مع:`,
            "• الاسم الكامل والبريد المستخدم في الطلب",
            "• تاريخ الدفع وطريقة الدفع",
            "• سبب الطلب (اختياري)",
            "سنرد خلال 2–3 أيام عمل.",
          ],
        },
        {
          title: "6. طريقة الاسترداد",
          body: [
            "يُعاد المبلغ بنفس وسيلة الدفع الأصلية عندما يكون ذلك ممكناً.",
            "قد تستغرق المعالجة 5–14 يوماً حسب البنك أو مزود الدفع المعتمد.",
          ],
        },
        {
          title: "7. الإلغاء قبل التسليم",
          body: [
            "يمكنك إلغاء طلبك قبل تسليم الخطة والحصول على استرجاع كامل ضمن فترة 7 أيام.",
          ],
        },
        {
          title: "8. معالجة المدفوعات الآمنة",
          body: [PAYMENT_PROCESSING_SUMMARY, PAYMENT_PADDLE_DISCLOSURE],
        },
      ]}
    />
  );
}
