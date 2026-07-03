import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { c as SITE_WHATSAPP, n as PRODUCT_SUMMARY, o as SITE_LEGAL_ENTITY, r as SITE_BRAND, s as SITE_SUPPORT_EMAIL } from "./SiteFooter-BXBcNfWp.mjs";
import { t as LegalPageShell } from "./LegalPageShell-CJcDoC8l.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/refund-BV2B_3tL.js
var import_jsx_runtime = require_jsx_runtime();
function RefundPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LegalPageShell, {
		title: "سياسة الاسترجاع والإلغاء",
		description: `توضّح ${SITE_BRAND} (${SITE_LEGAL_ENTITY}) شروط استرجاع المبالغ وإلغاء الطلبات للخدمات الرقمية.`,
		sections: [
			{
				title: "1. طبيعة الخدمة",
				body: [
					PRODUCT_SUMMARY.type,
					`مدة البرنامج: ${PRODUCT_SUMMARY.duration}.`,
					PRODUCT_SUMMARY.delivery,
					"بمجرد بدء إعداد خطتك المخصصة وتسليمها، تُعتبر الخدمة قيد التنفيذ."
				]
			},
			{
				title: "2. فترة الاسترجاع — 7 أيام",
				body: ["يمكنك طلب استرجاع كامل خلال 7 أيام من تاريخ الدفع إذا لم تكن قد استلمت خطتك المخصصة بعد أو لم يبدأ فريقنا بإعدادها.", "بعد تسليم الخطة أو بدء التخصيص الفعلي، لا يُقبل الاسترجاع الكامل إلا في حالات استثنائية (انظر أدناه)."]
			},
			{
				title: "3. حالات غير مؤهلة للاسترجاع",
				body: [
					"بعد استلام برنامجك المخصص (خطة التدريب/التغذية) عبر الواتساب أو البريد.",
					"إذا تمت الاستفادة من جلسات المتابعة أو التعديلات على الخطة.",
					"في حال انتهاك شروط الاستخدام أو مشاركة المحتوى مع الغير."
				]
			},
			{
				title: "4. الاستثناءات",
				body: [
					"خطأ تقني من طرفنا يمنع تسليم الخدمة.",
					"دفع مكرر بالخطأ.",
					"في هذه الحالات، راجعنا خلال 14 يوماً وسنعالج الطلب خلال 5–10 أيام عمل."
				]
			},
			{
				title: "5. كيفية طلب الاسترجاع",
				body: [
					`أرسل إلى ${SITE_SUPPORT_EMAIL} أو واتساب ${SITE_WHATSAPP} مع:`,
					"• الاسم الكامل والبريد المستخدم في الطلب",
					"• تاريخ الدفع وطريقة الدفع",
					"• سبب الطلب (اختياري)",
					"سنرد خلال 2–3 أيام عمل."
				]
			},
			{
				title: "6. طريقة الاسترداد",
				body: ["يُعاد المبلغ بنفس وسيلة الدفع الأصلية عندما يكون ذلك ممكناً.", "قد تستغرق المعالجة 5–14 يوماً حسب البنك أو مزود الدفع (مثل Paddle)."]
			},
			{
				title: "7. الإلغاء قبل التسليم",
				body: ["يمكنك إلغاء طلبك قبل تسليم الخطة والحصول على استرجاع كامل ضمن فترة 7 أيام."]
			},
			{
				title: "8. التوافق مع Paddle",
				body: ["عند الدفع عبر Paddle، تُطبَّق أيضاً سياسات Paddle كـ Merchant of Record حيث ينطبق ذلك.", "هذه السياسة على موقعنا هي المرجع الأساسي لعملائنا."]
			}
		]
	});
}
//#endregion
export { RefundPage as component };
