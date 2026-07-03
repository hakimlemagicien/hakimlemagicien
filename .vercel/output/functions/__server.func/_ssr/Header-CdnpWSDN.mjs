import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as LEGAL_ROUTES } from "./SiteFooter-BXBcNfWp.mjs";
import { t as WhatsAppIcon } from "./WhatsAppIcon-BIM0XFiZ.mjs";
import { O as Menu } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/Header-CdnpWSDN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var navItems = [
	{
		label: "الرئيسية",
		href: "#",
		active: true
	},
	{
		label: "كيف يعمل التقييم",
		href: "#how"
	},
	{
		label: "ماذا ستحصل عليه",
		href: "#features"
	},
	{
		label: "قصص النجاح",
		href: "#stories"
	},
	{
		label: "أسئلة شائعة",
		href: "#faq"
	}
];
function Logo() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
		href: "#",
		className: "flex items-center gap-2 shrink-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "grid h-11 w-11 max-lg:h-10 max-lg:w-10 place-items-center rounded-xl max-lg:rounded-full bg-primary text-primary-foreground font-black text-2xl max-lg:text-xl",
			children: "H"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex flex-col leading-tight",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-lg max-lg:text-base font-black tracking-tight text-foreground",
				children: "HAKIM"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[10px] font-bold tracking-[0.25em] text-primary",
				children: "COACHING"
			})]
		})]
	});
}
function Header() {
	const [open, setOpen] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "sticky top-0 z-50 w-full bg-white lg:bg-background/90 border-b border-border/40 lg:border-border/60 lg:backdrop-blur-md",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 lg:h-24 flex items-center justify-between gap-3 max-lg:[direction:ltr] lg:gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "hidden lg:flex items-center gap-8",
					children: navItems.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: item.href,
						className: `relative text-[15px] font-bold transition-colors hover:text-primary ${item.active ? "text-primary" : "text-foreground"}`,
						children: [item.label, item.active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -bottom-2 left-1/2 -translate-x-1/2 h-[3px] w-6 rounded-full bg-primary" })]
					}, item.label))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hidden lg:block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: "https://wa.me/971505129019",
						target: "_blank",
						rel: "noopener noreferrer",
						className: "inline-flex items-center gap-2 rounded-full border-2 border-primary px-5 py-2.5 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhatsAppIcon, { className: "h-4 w-4 text-[#25D366]" }), "تواصل عبر واتساب"]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setOpen((o) => !o),
					"aria-label": "Menu",
					className: "grid h-11 w-11 place-items-center rounded-full border border-border text-foreground bg-background lg:hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {
						className: "h-5 w-5",
						strokeWidth: 2
					})
				})
			]
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
			className: "lg:hidden border-t border-border bg-background",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "px-4 py-4 space-y-1",
				children: [
					navItems.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: item.href,
						onClick: () => setOpen(false),
						className: `block rounded-lg px-4 py-3 text-base font-bold ${item.active ? "bg-primary-soft text-primary" : "text-foreground hover:bg-muted"}`,
						children: item.label
					}) }, item.label)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "pt-2 mt-2 border-t border-border",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "px-4 py-2 text-[11px] font-black text-neutral-400",
							children: "روابط قانونية"
						})
					}),
					[
						{
							label: "سياسة الخصوصية",
							to: LEGAL_ROUTES.privacy
						},
						{
							label: "الشروط والأحكام",
							to: LEGAL_ROUTES.terms
						},
						{
							label: "سياسة الاسترجاع",
							to: LEGAL_ROUTES.refund
						}
					].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: item.to,
						onClick: () => setOpen(false),
						className: "block rounded-lg px-4 py-3 text-base font-bold text-foreground hover:bg-muted",
						children: item.label
					}) }, item.to))
				]
			})
		})]
	});
}
//#endregion
export { Header as t };
