import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { $ as Database, A as Package, C as Send, D as RefreshCw, Dt as Ban, I as Mail, S as Share2, St as CalendarClock, U as HeartPulse, X as FileText, a as Wallet, b as Shield, ct as ClipboardCheck, d as UserCheck, it as Cookie, j as MonitorSmartphone, lt as CircleX, m as TriangleAlert, nt as Copyright, ot as Clock3, q as Gavel, r as Workflow, tt as CreditCard, v as Sparkles, w as Scale, wt as Building2, x as ShieldCheck } from "../_libs/lucide-react.mjs";
import { d as SITE_WHATSAPP_URL, l as SITE_SUPPORT_EMAIL, s as SITE_LAST_UPDATED, t as LEGAL_ROUTES } from "./site-legal-BJWCSk8k.mjs";
import { n as SiteFooter, t as Header } from "./SiteFooter-CRYx4hkF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/LegalPageShell-BHNpW3YS.js
var import_jsx_runtime = require_jsx_runtime();
var ORANGE = "#FF6B00";
var TEXT = "#0F172A";
var PAGE_META = {
	privacy: {
		heroIcon: ShieldCheck,
		accent: "#16A34A",
		accentSoft: "#F0FAF4",
		label: "الخصوصية والأمان"
	},
	terms: {
		heroIcon: Scale,
		accent: "#2563EB",
		accentSoft: "#EFF6FF",
		label: "الشروط والالتزام"
	},
	refund: {
		heroIcon: RefreshCw,
		accent: ORANGE,
		accentSoft: "#FFF6EE",
		label: "الاسترجاع والإلغاء"
	}
};
var SECTION_ICONS = {
	privacy: [
		Building2,
		Database,
		Workflow,
		Scale,
		Share2,
		Clock3,
		Shield,
		UserCheck,
		Cookie,
		HeartPulse
	],
	terms: [
		FileText,
		Package,
		Send,
		CreditCard,
		ClipboardCheck,
		TriangleAlert,
		Sparkles,
		Copyright,
		Ban,
		Gavel
	],
	refund: [
		MonitorSmartphone,
		CalendarClock,
		CircleX,
		TriangleAlert,
		Mail,
		Wallet,
		Ban,
		ShieldCheck
	]
};
var NAV = [
	{
		kind: "privacy",
		to: LEGAL_ROUTES.privacy,
		label: "سياسة الخصوصية"
	},
	{
		kind: "terms",
		to: LEGAL_ROUTES.terms,
		label: "الشروط والأحكام"
	},
	{
		kind: "refund",
		to: LEGAL_ROUTES.refund,
		label: "سياسة الاسترجاع"
	}
];
function SectionBody({ paragraphs }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-4 space-y-3 text-[13.5px] leading-[1.85] text-neutral-700",
		children: paragraphs.map((paragraph) => {
			if (paragraph.startsWith("•")) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-2.5 rounded-xl bg-neutral-50/80 px-3 py-2.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full",
					style: { background: ORANGE }
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "flex-1 text-start",
					children: paragraph.slice(1).trim()
				})]
			}, paragraph);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-start",
				children: paragraph
			}, paragraph);
		})
	});
}
function LegalPageShell({ kind, title, description, sections }) {
	const meta = PAGE_META[kind];
	const HeroIcon = meta.heroIcon;
	const icons = SECTION_ICONS[kind];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		dir: "rtl",
		lang: "ar",
		className: "min-h-screen font-[Tajawal,Cairo,sans-serif] text-foreground",
		style: { background: "linear-gradient(180deg, #F3EFE8 0%, #F7F5F2 28%, #FAF8F5 58%, #FFFFFF 100%)" },
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto max-w-3xl lg:max-w-4xl xl:max-w-5xl px-5 py-10 sm:px-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "mb-5 flex flex-wrap items-center justify-start gap-1.5 text-[11.5px] font-bold text-neutral-500",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full bg-white/80 px-2.5 py-1 text-neutral-600 shadow-sm",
								children: "الصفحات القانونية"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-neutral-300",
								"aria-hidden": true,
								children: "/"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/",
								className: "rounded-full px-2.5 py-1 transition hover:bg-white/70 hover:text-primary",
								children: "الرئيسية"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-8 grid grid-cols-1 gap-2 sm:grid-cols-3",
						children: NAV.map((item) => {
							const active = item.kind === kind;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: item.to,
								className: "rounded-2xl border px-4 py-3 text-center text-[12.5px] font-black transition-all active:scale-[0.99]",
								style: {
									background: active ? meta.accentSoft : "rgba(255,255,255,0.75)",
									borderColor: active ? `${meta.accent}33` : "rgba(15,23,42,0.06)",
									color: active ? TEXT : "#64748B",
									boxShadow: active ? `0 12px 28px -18px ${meta.accent}55` : "0 4px 14px -12px rgba(15,23,42,0.08)"
								},
								children: item.label
							}, item.kind);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "relative overflow-hidden rounded-3xl border p-6 sm:p-7",
						style: {
							background: "linear-gradient(135deg, #FFFFFF 0%, #FFFBF7 55%, #FFF6EE 100%)",
							borderColor: "rgba(255,107,0,0.12)",
							boxShadow: "0 20px 50px -28px rgba(255,107,0,0.35), 0 8px 24px -16px rgba(15,23,42,0.1)"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "pointer-events-none absolute -start-10 -top-10 h-36 w-36 rounded-full opacity-40 blur-3xl",
							style: { background: meta.accent }
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-1 items-start gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid h-14 w-14 shrink-0 place-items-center rounded-2xl",
									style: {
										background: `linear-gradient(145deg, ${meta.accent} 0%, ${ORANGE} 100%)`,
										boxShadow: `0 14px 30px -14px ${meta.accent}88`
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroIcon, {
										className: "h-7 w-7 text-white",
										strokeWidth: 2.2
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1 text-start",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-extrabold",
											style: {
												background: meta.accentSoft,
												color: meta.accent
											},
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-3 w-3" }), meta.label]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
											className: "mt-2 font-[Cairo] text-[26px] font-black leading-snug sm:text-[28px]",
											style: { color: TEXT },
											children: title
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-[13.5px] leading-relaxed text-neutral-600",
											children: description
										})
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "shrink-0 self-start rounded-2xl border px-3 py-2 text-start text-[10.5px] font-bold text-neutral-500",
								style: {
									background: "rgba(255,255,255,0.85)",
									borderColor: "rgba(15,23,42,0.06)"
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[9.5px] font-extrabold text-neutral-400",
									children: "آخر تحديث"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-0.5 font-black text-neutral-700",
									children: SITE_LAST_UPDATED
								})]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-8 space-y-4",
						children: sections.map((section, index) => {
							const Icon = icons[index] ?? FileText;
							const sectionNum = section.title.split(".")[0]?.trim() ?? String(index + 1);
							const sectionTitle = section.title.includes(".") ? section.title.slice(section.title.indexOf(".") + 1).trim() : section.title;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
								className: "group rounded-3xl border bg-white/90 p-5 transition-all duration-300 hover:-translate-y-0.5 sm:p-6",
								style: {
									borderColor: "rgba(15,23,42,0.06)",
									boxShadow: "0 10px 30px -22px rgba(15,23,42,0.18)"
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-105",
										style: {
											background: `linear-gradient(160deg, ${meta.accentSoft} 0%, #FFFFFF 100%)`,
											border: `1px solid ${meta.accent}22`,
											boxShadow: `0 8px 20px -14px ${meta.accent}44`
										},
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
											className: "h-5 w-5",
											style: { color: meta.accent },
											strokeWidth: 2.2
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-start gap-2.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "rounded-lg px-2 py-0.5 text-[10px] font-black",
												style: {
													background: "#FFF6EE",
													color: ORANGE
												},
												children: sectionNum
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "font-[Cairo] text-[16.5px] font-black leading-snug sm:text-[17px]",
												style: { color: TEXT },
												children: sectionTitle
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionBody, { paragraphs: section.body })]
									})]
								})
							}, section.title);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8 flex flex-col items-stretch gap-3 rounded-3xl border p-5 sm:flex-row sm:items-center sm:justify-between",
						style: {
							background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
							borderColor: "rgba(255,255,255,0.08)",
							boxShadow: "0 18px 40px -24px rgba(15,23,42,0.55)"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-start",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-[Cairo] text-[15px] font-black text-white",
								children: "هل لديك سؤال قانوني؟"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-[12px] leading-relaxed text-white/70",
								children: "فريق الدعم جاهز للرد على استفساراتك المتعلقة بالخصوصية أو الشروط أو الاسترجاع."
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap justify-start gap-2 sm:justify-end",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: `mailto:${SITE_SUPPORT_EMAIL}`,
								className: "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-black text-white transition active:scale-[0.98]",
								style: {
									background: ORANGE,
									boxShadow: `0 12px 28px -14px ${ORANGE}aa`
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									dir: "ltr",
									className: "text-start",
									children: SITE_SUPPORT_EMAIL
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: SITE_WHATSAPP_URL,
								target: "_blank",
								rel: "noopener noreferrer",
								className: "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-[12px] font-black text-white/90 transition hover:bg-white/10 active:scale-[0.98]",
								style: { borderColor: "rgba(255,255,255,0.18)" },
								children: "واتساب الدعم"
							})]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {})
		]
	});
}
//#endregion
export { LegalPageShell as t };
