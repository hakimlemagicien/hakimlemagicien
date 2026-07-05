import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-DaoHZWri.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { _ as Link, l as useLocation } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { F as Menu } from "../_libs/lucide-react.mjs";
import { a as SITE_BRAND, c as SITE_LEGAL_ENTITY, d as SITE_WHATSAPP_URL, l as SITE_SUPPORT_EMAIL, t as LEGAL_ROUTES } from "./site-legal-BJWCSk8k.mjs";
import { t as WhatsAppIcon } from "./WhatsAppIcon-BIM0XFiZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/SiteFooter-y2Y5g7Gu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var navItems = [
	{
		label: "الرئيسية",
		hash: void 0
	},
	{
		label: "كيف يعمل التقييم",
		hash: "how"
	},
	{
		label: "ماذا ستحصل عليه",
		hash: "features"
	},
	{
		label: "قصص النجاح",
		hash: "stories"
	},
	{
		label: "تحديد السعر",
		hash: "pricing"
	},
	{
		label: "أسئلة شائعة",
		hash: "faq"
	}
];
function Logo() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/",
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
function NavLink({ label, hash, onNavigate, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/",
		hash,
		onClick: onNavigate,
		className,
		children: label
	});
}
function isNavItemActive(pathname, currentHash, itemHash) {
	if (pathname !== "/") return false;
	if (!itemHash) return !currentHash;
	return currentHash === itemHash;
}
function AuthNavLink({ className, onNavigate }) {
	const [loggedIn, setLoggedIn] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		supabase.auth.getSession().then(({ data }) => {
			setLoggedIn(Boolean(data.session));
		});
		const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
			setLoggedIn(Boolean(session));
		});
		return () => sub.subscription.unsubscribe();
	}, []);
	if (loggedIn) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/dashboard",
		onClick: onNavigate,
		className,
		children: "حسابي"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/auth",
		onClick: onNavigate,
		className,
		children: "تسجيل الدخول"
	});
}
function Header() {
	const [open, setOpen] = (0, import_react.useState)(false);
	const whatsapp = "https://wa.me/971505129019";
	const pathname = useLocation({ select: (l) => l.pathname });
	const currentHash = useLocation({ select: (l) => l.hash.replace(/^#/, "") });
	const closeMenu = () => setOpen(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "sticky top-0 z-50 w-full bg-white lg:bg-background/90 border-b border-border/40 lg:border-border/60 lg:backdrop-blur-md",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 lg:h-24 flex items-center justify-between gap-3 max-lg:[direction:ltr] lg:gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "hidden lg:flex items-center gap-8",
					children: navItems.map((item) => {
						const active = isNavItemActive(pathname, currentHash, item.hash);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
								label: item.label,
								hash: item.hash,
								className: `text-[15px] font-bold transition-colors hover:text-primary ${active ? "text-primary" : "text-foreground"}`
							}), active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -bottom-2 left-1/2 -translate-x-1/2 h-[3px] w-6 rounded-full bg-primary" })]
						}, item.label);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "hidden lg:flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthNavLink, { className: "inline-flex items-center justify-center rounded-full border-2 border-border px-4 py-2 text-sm font-bold text-foreground transition-all hover:border-primary hover:text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: whatsapp,
						target: "_blank",
						rel: "noopener noreferrer",
						className: "inline-flex items-center gap-2 rounded-full border-2 border-primary px-5 py-2.5 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhatsAppIcon, { className: "h-4 w-4 text-[#25D366]" }), "تواصل عبر واتساب"]
					})]
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
					navItems.map((item) => {
						const active = isNavItemActive(pathname, currentHash, item.hash);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavLink, {
							label: item.label,
							hash: item.hash,
							onNavigate: closeMenu,
							className: `block rounded-lg px-4 py-3 text-base font-bold ${active ? "bg-primary-soft text-primary" : "text-foreground hover:bg-muted"}`
						}) }, item.label);
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "pt-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthNavLink, {
							onNavigate: closeMenu,
							className: "block rounded-lg px-4 py-3 text-base font-bold text-foreground hover:bg-muted"
						})
					}),
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
						onClick: closeMenu,
						className: "block rounded-lg px-4 py-3 text-base font-bold text-foreground hover:bg-muted",
						children: item.label
					}) }, item.to))
				]
			})
		})]
	});
}
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
							className: "text-start",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-[Cairo] text-[16px] font-black text-[#0F172A]",
								children: SITE_BRAND
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-[12.5px] leading-relaxed text-neutral-600",
								children: "برامج تدريب وتغذية رقمية مخصصة لتحقيق أهدافك خلال 90 يوماً، مع متابعة ودعم حسب الباقة المختارة."
							})]
						}),
						!compact && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-start",
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
							className: "text-start",
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
export { SiteFooter as n, Header as t };
