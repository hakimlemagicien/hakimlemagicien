import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/SiteFooter-BXBcNfWp.js
var import_jsx_runtime = require_jsx_runtime();
var SITE_BRAND = "Hakim Coaching";
var SITE_LEGAL_ENTITY = "Hakim Coaching FZ-LLC";
var SITE_JURISDICTION = "الإمارات العربية المتحدة";
var SITE_SUPPORT_EMAIL = "support@hakimcoaching.com";
var SITE_WHATSAPP = "+971505129019";
var SITE_WHATSAPP_URL = "https://wa.me/971505129019";
var SITE_LAST_UPDATED = "3 يوليو 2026";
var LEGAL_ROUTES = {
	privacy: "/privacy",
	terms: "/terms",
	refund: "/refund"
};
var PRODUCT_SUMMARY = {
	type: "برنامج تدريب وتغذية رقمي مخصص (خدمة رقمية)",
	duration: "90 يوماً",
	billing: "دفعة واحدة — بدون تجديد تلقائي",
	delivery: "خلال 24–48 ساعة من تأكيد الدفع، تصلك خطة العمل والبرنامج عبر الواتساب والبريد الإلكتروني مع متابعة دورية حسب الباقة المختارة.",
	includes: [
		"خطة تدريب مخصصة وفق هدفك وجسمك",
		"خطة تغذية مخصصة",
		"متابعة ومراجعات دورية حسب مستوى الباقة",
		"دعم عبر واتساب",
		"تعديلات على الخطة حسب التقدم"
	]
};
function SiteFooter({ compact = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
		dir: "rtl",
		className: `border-t border-black/[0.06] bg-white ${compact ? "py-6" : "py-10 mt-10"}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-5 sm:px-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `grid gap-6 ${compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-[Cairo] text-[16px] font-black text-[#0F172A]",
								children: SITE_BRAND
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-[12.5px] leading-relaxed text-neutral-600",
								children: "برامج تدريب وتغذية رقمية مخصصة لتحقيق أهدافك خلال 90 يوماً، مع متابعة ودعم حسب الباقة المختارة."
							})]
						}),
						!compact && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[13px] font-black text-[#0F172A]",
								children: "روابط قانونية"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "mt-3 space-y-2 text-[13px] font-bold text-neutral-600",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: LEGAL_ROUTES.privacy,
										className: "hover:text-primary",
										children: "سياسة الخصوصية"
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: LEGAL_ROUTES.terms,
										className: "hover:text-primary",
										children: "الشروط والأحكام"
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: LEGAL_ROUTES.refund,
										className: "hover:text-primary",
										children: "سياسة الاسترجاع والإلغاء"
									}) })
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[13px] font-black text-[#0F172A]",
								children: "التواصل"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "mt-3 space-y-2 text-[12.5px] text-neutral-600",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: SITE_LEGAL_ENTITY }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: `mailto:${SITE_SUPPORT_EMAIL}`,
										className: "font-bold hover:text-primary",
										children: SITE_SUPPORT_EMAIL
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: SITE_WHATSAPP_URL,
										target: "_blank",
										rel: "noopener noreferrer",
										className: "font-bold hover:text-primary",
										children: "واتساب الدعم"
									}) })
								]
							})]
						})
					]
				}),
				compact && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[11.5px] font-bold text-neutral-500",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: LEGAL_ROUTES.privacy,
							className: "hover:text-primary",
							children: "الخصوصية"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: LEGAL_ROUTES.terms,
							className: "hover:text-primary",
							children: "الشروط"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: LEGAL_ROUTES.refund,
							className: "hover:text-primary",
							children: "الاسترجاع"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-6 text-center text-[11px] text-neutral-400",
					children: [
						"© ",
						(/* @__PURE__ */ new Date()).getFullYear(),
						" ",
						SITE_BRAND,
						". جميع الحقوق محفوظة."
					]
				})
			]
		})
	});
}
//#endregion
export { SITE_LAST_UPDATED as a, SITE_WHATSAPP as c, SITE_JURISDICTION as i, SITE_WHATSAPP_URL as l, PRODUCT_SUMMARY as n, SITE_LEGAL_ENTITY as o, SITE_BRAND as r, SITE_SUPPORT_EMAIL as s, LEGAL_ROUTES as t, SiteFooter as u };
