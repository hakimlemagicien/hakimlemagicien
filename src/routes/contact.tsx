import { createFileRoute } from "@tanstack/react-router";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { ContactSupportForm } from "@/components/legal/ContactSupportForm";
import { parseLegalSearch } from "@/lib/legal/legal-search";
import {
  CURRENT_SUPPORT_EMAIL,
  LEGAL_OPERATOR,
  PUBLIC_LOCATION,
} from "@/lib/legal/policy-catalog";
import { productionCanonicalUrl } from "@/lib/env/assert-environment";

export const Route = createFileRoute("/contact")({
  validateSearch: parseLegalSearch,
  head: () => ({
    links: [{ rel: "canonical", href: productionCanonicalUrl("/contact") }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { lang } = Route.useSearch();
  const isEn = lang === "en";
  return (
    <LegalPageShell
      kind="contact"
      locale={lang}
      title={isEn ? "Contact & Support" : "التواصل والدعم"}
      description={
        isEn
          ? "Account, billing, refund, technical, privacy, and general product support are available to every member."
          : "دعم الحساب والفوترة والاسترداد والمشاكل التقنية والخصوصية والدعم العام للتطبيق متاح لكل الأعضاء."
      }
      sections={[
        {
          title: isEn ? "1. How to reach us" : "1. كيف تتواصل معنا",
          body: [
            isEn
              ? `MAAKFIT is operated by ${LEGAL_OPERATOR}, acting as an individual. Public location: ${PUBLIC_LOCATION}.`
              : `يتم تشغيل MAAKFIT بواسطة ${LEGAL_OPERATOR} بصفته مشغّلاً فردياً. الموقع العام: ${PUBLIC_LOCATION}.`,
            isEn
              ? `Public support email: ${CURRENT_SUPPORT_EMAIL}`
              : `البريد العام للدعم: ${CURRENT_SUPPORT_EMAIL}`,
            isEn
              ? "You do not need a paid plan to contact us about your account, billing, refunds, technical issues, or privacy."
              : "لا تحتاج إلى باقة مدفوعة للتواصل بشأن الحساب أو الفوترة أو الاسترداد أو المشاكل التقنية أو الخصوصية.",
            isEn
              ? "WhatsApp is limited to account, technical, and billing support. It does not provide personalized fitness advice."
              : "واتساب مخصص لدعم الحساب والمشاكل التقنية والفوترة فقط، ولا يقدّم إرشاداً رياضياً شخصياً.",
          ],
        },
        {
          title: isEn ? "2. What we cannot do here" : "2. ما لا نقدّمه هنا",
          body: [
            isEn
              ? "MAAKFIT Support is not medical emergency care and is not guaranteed to be available 24/7."
              : "دعم MAAKFIT ليس رعاية طوارئ طبية، ولا نضمن توفره على مدار الساعة.",
            isEn
              ? "Do not send passwords, full card numbers, or CVV."
              : "لا ترسل كلمة المرور أو رقم البطاقة الكامل أو رمز CVV.",
          ],
        },
      ]}
    >
      <div className="mt-6">
        <ContactSupportForm locale={lang} />
      </div>
    </LegalPageShell>
  );
}
