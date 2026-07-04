import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as SITE_BRAND, c as SITE_LEGAL_ENTITY, i as PRODUCT_SUMMARY, l as SITE_SUPPORT_EMAIL, o as SITE_JURISDICTION } from "./site-legal-BJWCSk8k.mjs";
import { t as LegalPageShell } from "./LegalPageShell-0zA0qG9n.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/terms-CiUU3Ddu.js
var import_jsx_runtime = require_jsx_runtime();
function TermsPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LegalPageShell, {
		kind: "terms",
		title: "الشروط والأحكام",
		description: `باستخدامك لموقع ${SITE_BRAND} وشراء أي باقة، فإنك توافق على هذه الشروط.`,
		sections: [
			{
				title: "1. التعريفات",
				body: [
					`«${SITE_BRAND}» أو «نحن»: ${SITE_LEGAL_ENTITY}.`,
					"«أنت» أو «العميل»: مستخدم الموقع أو مشتري الخدمة.",
					"«الخدمة»: برنامج تدريب وتغذية رقمي مخصص مع متابعة حسب الباقة."
				]
			},
			{
				title: "2. طبيعة المنتج",
				body: [
					PRODUCT_SUMMARY.type,
					`مدة البرنامج: ${PRODUCT_SUMMARY.duration}.`,
					`الفوترة: ${PRODUCT_SUMMARY.billing}.`,
					"الخدمة رقمية بالكامل — لا يتم شحن منتجات مادية."
				]
			},
			{
				title: "3. تقديم الخدمة",
				body: [
					PRODUCT_SUMMARY.delivery,
					"يشمل البرنامج حسب الباقة: " + PRODUCT_SUMMARY.includes.join("، ") + ".",
					"قد تختلف تفاصيل المتابعة (عدد المراجعات، سرعة الرد) حسب الباقة (Transform / Pro / VIP)."
				]
			},
			{
				title: "4. الدفع والأسعار",
				body: [
					"الأسعار معروضة بالدولار الأمريكي (USD) ما لم يُذكر غير ذلك.",
					"الدفع حالياً عبر تحويل بنكي مباشر إلى حسابات الشركة المعروضة عند إتمام الطلب.",
					"بعد التحويل، يرفع العميل إثبات الدفع. يبدأ تجهيز البرنامج بعد تأكيدنا استلام المبلغ (عادة خلال 24–48 ساعة).",
					"لا يوجد تجديد تلقائي — الدفع دفعة واحدة مقابل 90 يوماً."
				]
			},
			{
				title: "5. التزاماتك",
				body: [
					"تقديم معلومات صحيحة ودقيقة في الاستبيان.",
					"استخدام الخدمة لأغراض شخصية وقانونية.",
					"عدم مشاركة حسابك أو محتوى البرنامج مع أطراف ثالثة دون إذن."
				]
			},
			{
				title: "6. إخلاء مسؤولية صحية",
				body: [
					"البرنامج لأغراض اللياقة والتغذية العامة وليس تشخيصاً أو علاجاً طبياً.",
					"استشر طبيبك قبل بدء أي برنامج إذا كان لديك حالة صحية أو إصابة أو حمل أو رضاعة.",
					"أنت مسؤول عن تنفيذ التمارين والتغذية بأمان."
				]
			},
			{
				title: "7. النتائج",
				body: ["النتائج تختلف من شخص لآخر وتعتمد على الالتزام والنوم والتغذية والظروف الشخصية.", "لا نضمن نتائج محددة (مثل خسارة وزن أو زيادة عضل بكمية معينة) — نضمن تقديم خطة مخصصة ومتابعة حسب الباقة."]
			},
			{
				title: "8. الملكية الفكرية",
				body: [`جميع المحتويات (خطط، فيديوهات، نصوص، تصاميم) ملك لـ ${SITE_BRAND}. يُمنع نسخها أو إعادة بيعها.`]
			},
			{
				title: "9. الإنهاء",
				body: ["يمكننا إيقاف الخدمة في حال إساءة الاستخدام أو انتهاك الشروط.", "تفاصيل الاسترجاع والإلغاء في سياسة الاسترجاع المنفصلة."]
			},
			{
				title: "10. القانون الحاكم",
				body: [`تخضع هذه الشروط لقوانين ${SITE_JURISDICTION}، مع مراعاة حقوق المستهلك المعمول بها.`, `للاستفسارات: ${SITE_SUPPORT_EMAIL}.`]
			}
		]
	});
}
//#endregion
export { TermsPage as component };
