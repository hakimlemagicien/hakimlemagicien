import { createFileRoute } from "@tanstack/react-router";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { ContactSupportForm } from "@/components/legal/ContactSupportForm";
import { parseLegalSearch } from "@/lib/legal/legal-search";
import { CURRENT_SUPPORT_EMAIL } from "@/lib/legal/policy-catalog";

export const Route = createFileRoute("/contact")({
  validateSearch: parseLegalSearch,
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
          ? "Account, billing, refund, technical, and privacy support are available to every member — including Free and Essential. Coaching Chat is a Premium/VIP feature."
          : "دعم الحساب والفوترة والاسترداد والمشاكل التقنية والخصوصية متاح لكل الأعضاء بما فيهم Free وEssential. دردشة الكوتش ميزة Premium/VIP."
      }
      sections={[
        {
          title: isEn ? "1. How to reach us" : "1. كيف تتواصل معنا",
          body: [
            isEn
              ? `Public support email: ${CURRENT_SUPPORT_EMAIL}`
              : `البريد العام للدعم: ${CURRENT_SUPPORT_EMAIL}`,
            isEn
              ? "You do not need a paid coaching plan to contact us about your account, billing, refunds, technical issues, or privacy."
              : "لا تحتاج باقة كوتش مدفوعة للتواصل بشأن الحساب أو الفوترة أو الاسترداد أو المشاكل التقنية أو الخصوصية.",
          ],
        },
        {
          title: isEn ? "2. What we cannot do here" : "2. ما لا نقدّمه هنا",
          body: [
            isEn
              ? "MAAKFIT Support is not medical emergency care and not a 24/7 guaranteed coaching channel."
              : "دعم MAAKFIT ليس رعاية طوارئ طبية وليس قناة كوتش مضمونة على مدار الساعة.",
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
