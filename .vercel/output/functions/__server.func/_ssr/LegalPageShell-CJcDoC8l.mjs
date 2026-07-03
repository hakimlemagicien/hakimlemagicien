import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as SITE_LAST_UPDATED, t as LEGAL_ROUTES, u as SiteFooter } from "./SiteFooter-BXBcNfWp.mjs";
import { t as Header } from "./Header-CdnpWSDN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/LegalPageShell-CJcDoC8l.js
var import_jsx_runtime = require_jsx_runtime();
function LegalPageShell({ title, description, sections }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		dir: "rtl",
		lang: "ar",
		className: "min-h-screen bg-[#FAFAFA] font-sans text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto max-w-3xl px-5 py-10 sm:px-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "mb-6 flex flex-wrap gap-2 text-[12px] font-bold text-neutral-500",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/",
								className: "hover:text-primary",
								children: "الرئيسية"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: LEGAL_ROUTES.privacy,
								className: "hover:text-primary",
								children: "الخصوصية"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: LEGAL_ROUTES.terms,
								className: "hover:text-primary",
								children: "الشروط"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: LEGAL_ROUTES.refund,
								className: "hover:text-primary",
								children: "الاسترجاع"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-[Cairo] text-[28px] font-black leading-snug text-[#0F172A]",
						children: title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-[14px] leading-relaxed text-neutral-600",
						children: description
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-[12px] font-bold text-neutral-400",
						children: ["آخر تحديث: ", SITE_LAST_UPDATED]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-8 space-y-6",
						children: sections.map((section) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.12)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-[Cairo] text-[17px] font-black text-[#0F172A]",
								children: section.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 space-y-2.5 text-[13.5px] leading-[1.75] text-neutral-700",
								children: section.body.map((paragraph) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: paragraph }, paragraph))
							})]
						}, section.title))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {})
		]
	});
}
//#endregion
export { LegalPageShell as t };
