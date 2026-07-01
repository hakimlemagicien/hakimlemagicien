import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as DialogOverlay$1, i as DialogDescription$1, n as DialogClose, o as DialogPortal$1, r as DialogContent$1, s as DialogTitle$1, t as Dialog$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { a as confused_coach_default, i as avatar4_default, n as avatar2_default, r as avatar3_default, t as avatar1_default } from "./confused-coach-kMd8JcLH.mjs";
import { $ as BadgeCheck, B as CircleCheck, C as Plus, D as MessageCircleQuestionMark, F as Flame, I as Dumbbell, J as ChartColumn, K as Check, M as Headphones, N as Globe, O as Menu, Q as BatteryFull, R as Clock, S as RefreshCw, T as MessageSquare, V as ChevronsLeft, X as CalendarX, Y as Calendar, Z as CalendarCheck, a as UtensilsCrossed, b as Salad, c as Trophy, d as TrendingDown, et as Award, f as Target, g as Shield, h as Signal, i as Utensils, l as TrendingUp, m as Sparkles, n as X, nt as Activity, o as Users, p as Star, q as ChartLine, r as Wifi, s as User, t as Zap, tt as ArrowLeft, u as TriangleAlert, v as ShieldCheck, x as Ruler, y as Scale, z as ClipboardList } from "../_libs/lucide-react.mjs";
import { n as motion } from "../_libs/framer-motion.mjs";
import { t as WhatsAppIcon } from "./WhatsAppIcon-BIM0XFiZ.mjs";
import { n as Swiper, r as SwiperSlide, t as Autoplay } from "../_libs/swiper.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Dn2ZDig-.js
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
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "px-4 py-4 space-y-1",
				children: navItems.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: item.href,
					onClick: () => setOpen(false),
					className: `block rounded-lg px-4 py-3 text-base font-bold ${item.active ? "bg-primary-soft text-primary" : "text-foreground hover:bg-muted"}`,
					children: item.label
				}) }, item.label))
			})
		})]
	});
}
/** Unified client social-proof count shown across the landing page. */
var SOCIAL_PROOF_CLIENT_COUNT = 1e4;
function formatSocialProofClientCount() {
	return `+${SOCIAL_PROOF_CLIENT_COUNT.toLocaleString("en-US")}`;
}
var POINTS = [
	25,
	28,
	32,
	38,
	42,
	48,
	58,
	62,
	70,
	78,
	88,
	98
];
var W = 320;
var H = 140;
var PAD_L = 32;
var PAD_R = 12;
var PAD_T = 8;
var PAD_B = 24;
var INNER_W = W - PAD_L - PAD_R;
var INNER_H = H - PAD_T - PAD_B;
var LINE_DRAW_MS = 2e3;
var Y_TICKS = [
	0,
	25,
	50,
	75,
	100
];
var X_LABELS = [
	{
		i: 0,
		label: "الأسبوع 1"
	},
	{
		i: 3,
		label: "الأسبوع 4"
	},
	{
		i: 7,
		label: "الأسبوع 8"
	},
	{
		i: 11,
		label: "الأسبوع 12"
	}
];
function useInViewOnce$3(threshold = .15) {
	const ref = (0, import_react.useRef)(null);
	const [inView, setInView] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el) return;
		const observer = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting) {
				setInView(true);
				observer.disconnect();
			}
		}, { threshold });
		observer.observe(el);
		return () => observer.disconnect();
	}, [threshold]);
	return {
		ref,
		inView
	};
}
function buildGeometry() {
	const coords = POINTS.map((p, i) => {
		return [PAD_L + i / (POINTS.length - 1) * INNER_W, PAD_T + (1 - p / 100) * INNER_H];
	});
	const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
	return {
		coords,
		path,
		area: `${path} L ${coords[coords.length - 1][0]} 116 L ${coords[0][0]} 116 Z`
	};
}
function AnimatedProgressSvg({ gradientId, compact }) {
	const { coords, path, area } = buildGeometry();
	const pathRef = (0, import_react.useRef)(null);
	const [pathLength, setPathLength] = (0, import_react.useState)(0);
	const { ref: viewRef, inView } = useInViewOnce$3();
	const gridFont = compact ? 8 : 9;
	const labelFont = compact ? 8 : 9;
	(0, import_react.useEffect)(() => {
		if (pathRef.current) setPathLength(pathRef.current.getTotalLength());
	}, [path]);
	const lineStyle = {
		strokeDasharray: pathLength,
		strokeDashoffset: inView && pathLength > 0 ? 0 : pathLength,
		transition: pathLength > 0 ? `stroke-dashoffset ${LINE_DRAW_MS}ms cubic-bezier(0.4, 0, 0.2, 1)` : "none"
	};
	const areaStyle = {
		opacity: inView ? 1 : 0,
		transition: `opacity 1s ease ${LINE_DRAW_MS * .35}ms`
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: viewRef,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: `0 0 ${W} ${H}`,
			className: "w-full h-auto",
			role: "img",
			"aria-label": "تقدمك خلال 12 أسبوع",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
					id: gradientId,
					x1: "0",
					x2: "0",
					y1: "0",
					y2: "1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "0%",
						stopColor: "#F97316",
						stopOpacity: "0.25"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "100%",
						stopColor: "#F97316",
						stopOpacity: "0"
					})]
				}) }),
				Y_TICKS.map((t) => {
					const y = PAD_T + (1 - t / 100) * INNER_H;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
						x1: PAD_L,
						x2: W - PAD_R,
						y1: y,
						y2: y,
						stroke: "#E5E7EB",
						strokeDasharray: "2 3"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("text", {
						x: PAD_L - 6,
						y: y + 3,
						textAnchor: "end",
						fontSize: gridFont,
						fill: "#9CA3AF",
						children: [t, "%"]
					})] }, t);
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: area,
					fill: `url(#${gradientId})`,
					style: areaStyle
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					ref: pathRef,
					d: path,
					fill: "none",
					stroke: "#F97316",
					strokeWidth: "2.5",
					strokeLinecap: "round",
					strokeLinejoin: "round",
					style: lineStyle
				}),
				coords.map(([x, y], i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: x,
					cy: y,
					r: "3",
					fill: "#F97316",
					style: {
						opacity: inView ? 1 : 0,
						transform: inView ? "scale(1)" : "scale(0)",
						transformBox: "fill-box",
						transformOrigin: "center",
						transition: `opacity 0.35s ease ${LINE_DRAW_MS * .3 + i * 120}ms, transform 0.35s cubic-bezier(0.34, 1.3, 0.64, 1) ${LINE_DRAW_MS * .3 + i * 120}ms`
					}
				}, i)),
				X_LABELS.map(({ i, label }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
					x: coords[i][0],
					y: H - 6,
					textAnchor: "middle",
					fontSize: labelFont,
					fill: "#6B7280",
					fontWeight: compact ? "500" : "600",
					style: {
						opacity: inView ? 1 : 0,
						transition: `opacity 0.5s ease ${LINE_DRAW_MS * .45 + i * 60}ms`
					},
					children: label
				}, i))
			]
		})
	});
}
function ProgressChart({ compact = false }) {
	if (compact) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-full -translate-x-[10px] translate-y-[3px] rounded-xl bg-white/90 p-2.5 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.1)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-1 font-[Tajawal] text-[10px] font-medium text-foreground text-right",
			children: "تقدمك خلال 12 أسبوع"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatedProgressSvg, {
			gradientId: "areaGradMobile",
			compact: true
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-white/85 backdrop-blur-md border border-white shadow-soft p-4 w-full max-w-[360px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs font-bold text-foreground mb-2 text-right",
			children: "تقدمك خلال 12 أسبوع"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatedProgressSvg, {
			gradientId: "areaGrad",
			compact: false
		})]
	});
}
var STATS$1 = [
	{
		icon: Users,
		value: 1500,
		label: "مشترك جديد هذا الشهر"
	},
	{
		icon: Calendar,
		value: 10,
		label: "سنوات خبرة في التدريب"
	},
	{
		icon: Globe,
		value: 5,
		suffix: "M",
		label: "متابع عبر منصات التواصل"
	}
];
var STAGGER_DELAYS = [
	.15,
	.3,
	.45
];
function easeOutCubic$1(t) {
	return 1 - Math.pow(1 - t, 3);
}
function useInViewOnce$2(threshold = .2) {
	const ref = (0, import_react.useRef)(null);
	const [inView, setInView] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el || inView) return;
		const io = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting) {
				setInView(true);
				io.disconnect();
			}
		}, { threshold });
		io.observe(el);
		return () => io.disconnect();
	}, [inView, threshold]);
	return {
		ref,
		inView
	};
}
function useCountUp(target, active, duration = 2e3, delayMs = 0) {
	const [value, setValue] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		if (!active) return;
		let raf = 0;
		const timeoutId = window.setTimeout(() => {
			const start = performance.now();
			const tick = (now) => {
				const t = Math.min(1, (now - start) / duration);
				setValue(Math.round(easeOutCubic$1(t) * target));
				if (t < 1) raf = requestAnimationFrame(tick);
			};
			raf = requestAnimationFrame(tick);
		}, delayMs);
		return () => {
			window.clearTimeout(timeoutId);
			cancelAnimationFrame(raf);
		};
	}, [
		active,
		target,
		duration,
		delayMs
	]);
	return value;
}
function renderSignedFormatted(value) {
	const signed = value.match(/^([+-])(.+)$/);
	if (!signed) return value;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex flex-row items-baseline [direction:ltr]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: signed[1] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: signed[2] })]
	});
}
function AnimatedStatValue({ value, suffix, active, compact, delayMs }) {
	const count = useCountUp(value, active, 2e3, delayMs);
	const formatted = suffix === "M" ? `+${count}M` : `+${count.toLocaleString("en-US")}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: ["font-[Cairo] font-extrabold leading-none tabular-nums text-[#FF6B00]", compact ? "text-[26px]" : "text-[44px]"].join(" "),
		"aria-label": formatted,
		children: renderSignedFormatted(formatted)
	});
}
function TrustStatCard({ stat, index, active, compact, dark }) {
	const Icon = stat.icon;
	const delay = STAGGER_DELAYS[index] ?? 0;
	const delayMs = Math.round(delay * 1e3);
	const content = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: [
				"flex shrink-0 items-center justify-center rounded-full",
				dark ? "bg-[#FF6B00]/15 ring-1 ring-[#FF6B00]/25" : "bg-[rgba(255,107,0,0.08)]",
				compact ? "h-10 w-10" : "h-[52px] w-[52px]"
			].join(" "),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				className: compact ? "h-5 w-5 text-[#FF6B00]" : "h-[26px] w-[26px] text-[#FF6B00]",
				strokeWidth: 1.75
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatedStatValue, {
			value: stat.value,
			suffix: stat.suffix,
			active,
			compact,
			delayMs
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "h-[2px] w-9 shrink-0 rounded-full bg-[#FF6B00]",
			"aria-hidden": true
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: [
				"px-2 text-center font-[Tajawal] font-medium leading-snug",
				dark ? "text-white/85 [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]" : "text-[#444444]",
				compact ? "text-[11px]" : "text-[17px]"
			].join(" "),
			children: stat.label
		})
	] });
	if (compact) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
		className: ["w-full", active ? "animate-trust-stat-enter" : "pointer-events-none opacity-0"].join(" "),
		style: { animationDelay: `${delay}s` },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: ["flex min-h-[128px] w-full flex-col items-center justify-center gap-1.5 rounded-xl px-1 py-2", dark ? "border border-white/[0.12] bg-white/[0.06] shadow-[0_4px_16px_-6px_rgba(255,107,0,0.35)] ring-1 ring-[#FF6B00]/15 backdrop-blur-sm" : "border border-black/[0.04] bg-white shadow-[0_2px_8px_-3px_rgba(0,0,0,0.07)]"].join(" "),
			children: content
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
		className: [
			"group h-[170px] w-[170px] shrink-0 snap-center",
			"flex flex-col items-center justify-center gap-1.5",
			"rounded-[24px] border border-black/[0.04] bg-white",
			"shadow-[0_8px_32px_-10px_rgba(0,0,0,0.08)]",
			"transition-[transform,box-shadow] duration-300 ease-out",
			"active:scale-[0.98] lg:active:scale-100",
			"lg:hover:-translate-y-[6px] lg:hover:shadow-[0_20px_48px_-14px_rgba(0,0,0,0.14)]",
			active ? "animate-trust-stat-enter" : "pointer-events-none opacity-0"
		].join(" "),
		style: { animationDelay: `${delay}s` },
		children: content
	});
}
function TrustStatistics({ embedded = false, variant = "default", className = "" }) {
	const dark = variant === "dark";
	const { ref, inView } = useInViewOnce$2(.15);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		ref,
		className: [
			"w-full",
			embedded ? "bg-transparent" : "bg-[#FAF8F5] pb-0",
			className
		].join(" "),
		"aria-label": "إحصائيات الثقة",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: [embedded ? "grid grid-cols-3 gap-3" : [
				"flex gap-4 overflow-x-auto px-5 py-5",
				"snap-x snap-mandatory",
				"[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
				"lg:justify-center lg:overflow-visible lg:snap-none"
			].join(" ")].join(" "),
			children: STATS$1.map((stat, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrustStatCard, {
				stat,
				index,
				active: inView,
				compact: embedded,
				dark
			}, stat.label))
		})
	});
}
var coach_photo_default = "/assets/coach-photo-Bhucvh3g.png";
var features = [
	{
		icon: Dumbbell,
		label: "خطة تدريب مخصصة"
	},
	{
		icon: Utensils,
		label: "خطة تغذية مخصصة"
	},
	{
		icon: CalendarCheck,
		label: "متابعة دورية"
	},
	{
		icon: ChartLine,
		label: "نتائج قابلة للقياس"
	}
];
/** RTL visual order: نتائج → متابعة → تغذية → تدريب (right to left) */
var mobileFeatures = [
	{
		icon: ChartLine,
		label: "نتائج قابلة للقياس"
	},
	{
		icon: CalendarCheck,
		label: "متابعة دورية"
	},
	{
		icon: Utensils,
		label: "خطة تغذية مخصصة"
	},
	{
		icon: Dumbbell,
		label: "خطة تدريب مخصصة"
	}
];
var CLIENT_COUNT_LABEL = formatSocialProofClientCount();
var HERO_CYCLING_PHRASES = [
	"مخصص لهدفك وجسدك 100% ",
	"مصمم ليصنع أفضل نسخة منك ",
	"يضمن لك النتيجة خلال 90 يوماً "
];
var PHRASE_CYCLE_MS = 2500;
var TYPE_INTERVAL_MS = 55;
function splitGraphemes(text) {
	if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
		const segmenter = new Intl.Segmenter("ar", { granularity: "grapheme" });
		return Array.from(segmenter.segment(text), (s) => s.segment);
	}
	return Array.from(text);
}
var HERO_WIDTH_HOLDER_PHRASE = HERO_CYCLING_PHRASES.reduce((longest, phrase) => splitGraphemes(phrase).length > splitGraphemes(longest).length ? phrase : longest);
var HERO_LINE_FONT_CLASS = "font-[Tajawal] text-[clamp(20px,5vw,76px)] sm:text-[clamp(28px,5.5vw,92px)] lg:text-[clamp(48px,6.5vw,118px)] leading-none text-[#FF6B00]";
function CyclingHeroLine({ className = "" }) {
	const [phraseIndex, setPhraseIndex] = (0, import_react.useState)(0);
	const [charIndex, setCharIndex] = (0, import_react.useState)(0);
	const [visible, setVisible] = (0, import_react.useState)(true);
	const displayed = splitGraphemes(HERO_CYCLING_PHRASES[phraseIndex]).slice(0, charIndex).join("");
	(0, import_react.useEffect)(() => {
		setCharIndex(0);
		setVisible(true);
		const graphemeCount = splitGraphemes(HERO_CYCLING_PHRASES[phraseIndex]).length;
		const cycleStart = performance.now();
		let count = 0;
		let typeInterval;
		let switchTimeout;
		let fadeTimeout;
		typeInterval = window.setInterval(() => {
			count += 1;
			setCharIndex(count);
			if (count >= graphemeCount) {
				window.clearInterval(typeInterval);
				const elapsed = performance.now() - cycleStart;
				const holdMs = Math.max(400, PHRASE_CYCLE_MS - elapsed);
				switchTimeout = window.setTimeout(() => {
					setVisible(false);
					fadeTimeout = window.setTimeout(() => {
						setPhraseIndex((prev) => (prev + 1) % HERO_CYCLING_PHRASES.length);
					}, 280);
				}, holdMs);
			}
		}, TYPE_INTERVAL_MS);
		return () => {
			if (typeInterval) window.clearInterval(typeInterval);
			if (switchTimeout) window.clearTimeout(switchTimeout);
			if (fadeTimeout) window.clearTimeout(fadeTimeout);
		};
	}, [phraseIndex]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: [
			"flex h-[76px] w-full translate-x-[10px] -translate-y-[30px] items-center justify-end",
			"sm:h-[92px] lg:h-[118px]",
			className
		].join(" "),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			dir: "rtl",
			lang: "ar",
			className: [
				"relative inline-block max-w-full text-right",
				HERO_LINE_FONT_CLASS,
				"transition-opacity duration-300",
				visible ? "opacity-100" : "opacity-0"
			].join(" "),
			"aria-live": "polite",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "invisible whitespace-nowrap select-none",
				"aria-hidden": true,
				children: HERO_WIDTH_HOLDER_PHRASE
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "absolute right-0 top-0 inline-flex translate-x-[55px] -translate-y-[20px] items-center gap-0.5 whitespace-nowrap",
				children: [displayed, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "inline-block h-[0.85em] w-[2px] shrink-0 animate-cursor-blink bg-[#FF6B00]",
					"aria-hidden": true
				})]
			})]
		})
	});
}
function easeOutCubic(t) {
	return 1 - Math.pow(1 - t, 3);
}
function useInViewOnce$1(threshold = .25) {
	const ref = (0, import_react.useRef)(null);
	const [inView, setInView] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el || inView) return;
		const io = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting) {
				setInView(true);
				io.disconnect();
			}
		}, { threshold });
		io.observe(el);
		return () => io.disconnect();
	}, [inView, threshold]);
	return {
		ref,
		inView
	};
}
function useAnimatedClientCount(active, duration = 2500) {
	const [value, setValue] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		if (!active) return;
		let raf = 0;
		const start = performance.now();
		const tick = (now) => {
			const t = Math.min(1, (now - start) / duration);
			const eased = easeOutCubic(t);
			setValue(Math.round(eased * SOCIAL_PROOF_CLIENT_COUNT));
			if (t < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [active, duration]);
	return value;
}
function AnimatedClientCount({ active }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-block min-w-[4.5rem] text-left font-[Tajawal] text-[13px] font-extrabold tabular-nums text-success",
		"aria-label": CLIENT_COUNT_LABEL,
		children: ["+", useAnimatedClientCount(active).toLocaleString("en-US")]
	});
}
function MobileSocialProof({ avatars }) {
	const { ref, inView } = useInViewOnce$1(.2);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref,
		className: "mt-3 flex items-center justify-center gap-3 [direction:ltr]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex shrink-0 -space-x-2",
			children: avatars.map((src, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src,
				alt: "",
				width: 36,
				height: 36,
				loading: "lazy",
				className: "h-9 w-9 rounded-full border-2 border-white object-cover"
			}, i))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-start gap-0.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1",
				children: [Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-3.5 w-3.5 fill-success text-success" }, i)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatedClientCount, { active: inView })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-[Tajawal] text-[11px] font-medium text-foreground",
					children: "عميل حققوا نتائج مذهلة"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, {
					className: "h-3.5 w-3.5 text-success",
					strokeWidth: 2.5
				})]
			})]
		})]
	});
}
function FeatureCard({ icon: Icon, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl bg-white shadow-card border border-border/40 p-4 sm:p-5 flex flex-col items-center text-center gap-3 transition-transform hover:-translate-y-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
			className: "h-7 w-7 sm:h-8 sm:w-8 text-primary",
			strokeWidth: 2
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs sm:text-sm font-bold text-foreground leading-tight",
			children: label
		})]
	});
}
function MobileFeatureCard({ icon: Icon, label, index = 0 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl border border-black/[0.04] bg-white px-1 py-1.5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.07)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative h-[27px] w-[27px] shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#FF6B00]/20 via-[#FF6B00]/10 to-[#FF6B00]/5 animate-feature-icon-glow",
			style: { animationDelay: `${index * .35}s` },
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "pointer-events-none absolute inset-0 overflow-hidden rounded-full",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute -inset-y-3 -left-1/2 h-[200%] w-[200%] animate-feature-icon-shine bg-gradient-to-r from-transparent via-white/70 to-transparent",
					style: { animationDelay: `${index * .35 + .5}s` }
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "relative z-10 flex h-full w-full items-center justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
					className: "h-3.5 w-3.5 text-[#FF6B00]",
					strokeWidth: 2.25
				})
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "max-w-full text-center font-[Tajawal] text-[8px] font-medium leading-tight text-foreground line-clamp-2",
			children: label
		})]
	});
}
function ResultCard({ icon: Icon, value, label, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3 rounded-2xl bg-white shadow-soft border border-white px-4 py-3 min-w-[150px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `grid h-10 w-10 place-items-center rounded-full ${tone === "success" ? "bg-success-soft text-success" : "bg-primary-soft text-primary"}`,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-5 w-5" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-right",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-lg font-black text-foreground leading-none",
				children: value
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground mt-1",
				children: label
			})]
		})]
	});
}
function renderSignedValue(value) {
	const signed = value.match(/^([+-])(.+)$/);
	if (!signed) return value;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex flex-row items-baseline [direction:ltr]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: signed[1] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: signed[2] })]
	});
}
function MobileResultCard({ icon: Icon, value, label, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3 rounded-xl bg-white px-[14px] py-3 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.1)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full ${tone === "success" ? "bg-success-soft text-success" : "bg-primary-soft text-primary"}`,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				className: "h-5 w-5",
				strokeWidth: 2
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 text-right",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-[Cairo] text-[18px] font-extrabold leading-none text-foreground",
				children: renderSignedValue(value)
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-0.5 font-[Tajawal] text-[11px] font-medium leading-tight text-muted-foreground",
				children: label
			})]
		})]
	});
}
function MobileCoachVisual() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative mx-auto -mb-[150px] h-[530px] w-full max-w-[320px]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute left-0 top-[28%] z-0 grid grid-cols-5 gap-[5px] opacity-35",
				children: Array.from({ length: 20 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-[5px] w-[5px] rounded-full bg-neutral-300" }, i))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-x-4 top-2 bottom-6 z-0 flex items-center justify-center -translate-x-[50px] -translate-y-[30px]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-[320px] w-[320px] rounded-full bg-beige" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: coach_photo_default,
				alt: "مدرب لياقة بدنية",
				width: 1024,
				height: 1024,
				className: "absolute inset-x-6 bottom-[140px] z-10 h-[400px] w-auto max-w-none object-contain object-bottom"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute -right-[38px] top-[6%] z-20 flex flex-col gap-5 -translate-y-[26px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "animate-float",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileResultCard, {
							icon: TrendingDown,
							value: "-12kg",
							label: "خسارة دهون",
							tone: "success"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "animate-float",
						style: { animationDelay: "0.8s" },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileResultCard, {
							icon: TrendingUp,
							value: "+4.7kg",
							label: "كتلة عضلية",
							tone: "primary"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "animate-float",
						style: { animationDelay: "1.6s" },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileResultCard, {
							icon: Zap,
							value: "+85%",
							label: "طاقة ولياقة",
							tone: "success"
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute bottom-[150px] left-1/2 z-10 w-[74%] max-w-[220px] translate-x-[calc(-50%-50px)] opacity-90",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressChart, { compact: true })
			})
		]
	});
}
function HeroQuizCTA({ className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/quiz",
		className: ["relative flex h-[52px] w-full items-center overflow-hidden rounded-full cta-gradient px-2 shadow-cta [direction:ltr] animate-cta-premium-pulse", className].join(" "),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "pointer-events-none absolute inset-0 overflow-hidden rounded-full",
				"aria-hidden": true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-y-[-20%] left-0 h-[140%] w-[45%] animate-cta-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "relative z-10 ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
					className: "h-4 w-4 text-primary",
					strokeWidth: 2.5
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "relative z-10 flex-1 text-center font-[Tajawal] text-[15px] font-extrabold text-white",
				children: "ابدأ تقييمك المجاني"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "relative z-10 w-9 shrink-0",
				"aria-hidden": true
			})
		]
	});
}
function HeroStickyQuizBar({ visible }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		id: "hero-sticky-quiz-bar",
		className: ["fixed inset-x-0 bottom-0 z-50 border-t border-white/70 bg-white/80 backdrop-blur-md px-4 pt-3 shadow-[0_-12px_40px_-10px_rgba(15,23,42,0.16)] pb-[max(1rem,env(safe-area-inset-bottom))] transition-[transform,opacity] duration-500 ease-out lg:hidden", visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"].join(" "),
		role: "region",
		"aria-label": "ابدأ تقييمك المجاني",
		"aria-hidden": !visible,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroQuizCTA, {})
	});
}
function MobileHero({ onCtaOutOfView }) {
	const avatars = [
		avatar1_default,
		avatar2_default,
		avatar3_default,
		avatar4_default
	];
	const ctaAnchorRef = (0, import_react.useRef)(null);
	const onCtaOutOfViewRef = (0, import_react.useRef)(onCtaOutOfView);
	onCtaOutOfViewRef.current = onCtaOutOfView;
	(0, import_react.useEffect)(() => {
		const el = ctaAnchorRef.current;
		if (!el) return;
		const observer = new IntersectionObserver(([entry]) => onCtaOutOfViewRef.current(!entry.isIntersecting), {
			threshold: 0,
			rootMargin: "0px"
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "lg:hidden px-4 pb-8 pt-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
				className: "mt-[10px] text-center font-[Tajawal] text-[26px] font-extrabold leading-[1.12] tracking-tight text-foreground",
				children: ["أحصل على برنامج تدريبي وغذائي", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CyclingHeroLine, { className: "mt-[30px]" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mx-auto -mt-[69px] max-w-[310px] text-center font-[Tajawal] text-[13px] font-medium leading-[1.55] text-muted-foreground",
				children: "أجب على مجموعة أسئلة قصيرة، واحصل على خطة تدريب وغذاء مصممة خصيصًا لهدفك."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 grid grid-cols-4 gap-2.5",
				children: mobileFeatures.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileFeatureCard, {
					...f,
					index: i
				}, f.label))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileCoachVisual, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: ctaAnchorRef,
				id: "hero-inline-quiz-cta",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroQuizCTA, { className: "relative z-10 mt-[2px]" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileSocialProof, { avatars }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 px-1 pt-2 pb-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							"aria-hidden": true,
							className: "pointer-events-none absolute inset-x-2 top-3 bottom-0 rounded-2xl bg-[#1A1816]/20 shadow-[inset_0_3px_10px_rgba(15,23,42,0.12)]"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							"aria-hidden": true,
							className: "pointer-events-none absolute -inset-1 rounded-2xl bg-[#FF6B00]/20 blur-2xl animate-warning-card-outer-glow"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#2A2521] via-[#1F1C18] to-[#2E2824] p-3 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_22px_48px_-14px_rgba(255,107,0,0.28),0_16px_40px_-18px_rgba(15,23,42,0.45)] ring-1 ring-white/[0.05] sm:p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "pointer-events-none absolute inset-0 overflow-hidden rounded-2xl",
									"aria-hidden": true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-y-[-30%] left-0 h-[160%] w-[50%] animate-warning-card-shimmer bg-gradient-to-r from-transparent via-white/14 to-transparent" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "pointer-events-none absolute inset-0 rounded-2xl animate-warning-card-inner-glow",
									"aria-hidden": true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									"aria-hidden": true,
									className: "pointer-events-none absolute inset-x-0 top-0 h-px animate-warning-card-border-pulse bg-gradient-to-r from-transparent via-white/25 to-transparent"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									"aria-hidden": true,
									className: "pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#FF6B00]/[0.12] blur-3xl animate-warning-card-outer-glow"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "relative z-10",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrustStatistics, {
										embedded: true,
										variant: "dark"
									})
								})
							]
						})
					]
				})
			})
		]
	});
}
function DesktopHero() {
	const avatars = [
		avatar1_default,
		avatar2_default,
		avatar3_default,
		avatar4_default
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid lg:grid-cols-2 gap-10 lg:gap-8 items-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "order-1 text-center lg:text-right animate-fade-up",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "mt-5 font-[Tajawal] font-black text-foreground tracking-tight text-[42px] sm:text-5xl lg:text-[68px] leading-[1.1]",
						children: [
							"أحصل على برنامج تدريبي وغذائي",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CyclingHeroLine, {})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 lg:mr-0 leading-relaxed",
						children: "أجب على مجموعة أسئلة قصيرة، واحصل على خطة تدريب وغذاء مصممة خصيصًا لهدفك."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-7 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-xl mx-auto lg:mx-0 lg:mr-0",
						children: features.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeatureCard, { ...f }, f.label))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-8",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/quiz",
							className: "group inline-flex w-full sm:w-auto items-center justify-center gap-3 cta-gradient text-white font-bold text-lg rounded-full px-6 py-4 shadow-cta transition-all hover:scale-[1.02] hover:brightness-110",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "grid h-9 w-9 place-items-center rounded-full bg-white text-primary shrink-0 transition-transform group-hover:-translate-x-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-5 w-5" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "flex-1 text-center sm:flex-none",
									children: "ابدأ تقييمك المجاني"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hidden sm:block w-9",
									"aria-hidden": true
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex items-center justify-center lg:justify-start gap-3 flex-wrap",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex -space-x-2 space-x-reverse",
								children: avatars.map((src, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src,
									alt: "",
									width: 40,
									height: 40,
									loading: "lazy",
									className: "h-10 w-10 rounded-full border-2 border-background object-cover"
								}, i))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center gap-1",
								children: [...Array(5)].map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-4 w-4 fill-success text-success" }, i))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm font-bold text-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-success",
									children: formatSocialProofClientCount()
								}), " عميل حققوا نتائج مذهلة"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "h-5 w-5 text-success" })
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "order-2 hidden lg:block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoachVisual, {})
			})]
		})
	});
}
function Hero() {
	const [stickyCtaVisible, setStickyCtaVisible] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "relative overflow-hidden bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute top-1/3 right-0 lg:right-auto lg:left-0 w-40 h-40 opacity-40",
				style: {
					backgroundImage: "radial-gradient(circle, oklch(0.7 0.2 41 / 0.25) 1.2px, transparent 1.5px)",
					backgroundSize: "14px 14px"
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileHero, { onCtaOutOfView: setStickyCtaVisible }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "hidden lg:block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DesktopHero, {})
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroStickyQuizBar, { visible: stickyCtaVisible })] });
}
function CoachVisual() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative mx-auto w-full max-w-[560px] aspect-[4/5]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 flex items-center justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-[88%] w-[88%] rounded-full bg-beige" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: coach_photo_default,
				alt: "مدرب لياقة بدنية",
				width: 1024,
				height: 1024,
				className: "relative z-10 w-full h-full object-contain object-bottom"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute z-20 top-[8%] left-[-8px] sm:left-[-20px] animate-float",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultCard, {
					icon: TrendingDown,
					value: "-12kg",
					label: "خسارة دهون",
					tone: "success"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute z-20 top-[38%] left-[-12px] sm:left-[-28px] animate-float",
				style: { animationDelay: "0.8s" },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultCard, {
					icon: TrendingUp,
					value: "+4.7kg",
					label: "كتلة عضلية",
					tone: "primary"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute z-20 top-[66%] left-[-6px] sm:left-[-16px] animate-float",
				style: { animationDelay: "1.6s" },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultCard, {
					icon: Zap,
					value: "+85%",
					label: "طاقة ولياقة",
					tone: "success"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute z-20 bottom-[-12px] right-[-8px] sm:right-[-16px] w-[78%] max-w-[360px]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressChart, {})
			})
		]
	});
}
/**
* Soft gradient + curve from white Hero stats into the Problem section.
*/
function HeroProblemTransition() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "relative z-10 w-full overflow-hidden bg-gradient-to-b from-background via-[#FAF8F5] to-[#F3EFE8] lg:from-[#FAF8F5]",
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 1440 72",
			preserveAspectRatio: "none",
			className: "block h-9 w-full sm:h-11 lg:h-12",
			role: "presentation",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
				id: "hero-problem-wave",
				x1: "0",
				y1: "0",
				x2: "0",
				y2: "1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "0%",
					stopColor: "#FAF8F5",
					stopOpacity: "0.35"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "100%",
					stopColor: "#F3EFE8"
				})]
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "url(#hero-problem-wave)",
				d: "M0,26 C220,58 440,10 660,32 C880,48 1100,14 1320,36 C1380,42 1420,30 1440,26 L1440,72 L0,72 Z"
			})]
		})
	});
}
var PROBLEMS = [
	{
		title: "برامج عشوائية",
		description: "نسخ نفس البرنامج للجميع دون مراعاة الاختلافات الفردية.",
		icon: ClipboardList
	},
	{
		title: "أنظمة غذائية غير مناسبة",
		description: "حرمان شديد أو خطط يصعب الاستمرار عليها.",
		icon: UtensilsCrossed
	},
	{
		title: "عدم الاستمرارية",
		description: "تبدأ بحماس ثم تتوقف لأن الخطة غير واقعية.",
		icon: Clock
	},
	{
		title: "غياب المتابعة والتعديل",
		description: "لا أحد يراجع تقدمك أو يصحح المسار عند الحاجة.",
		icon: ChartColumn
	}
];
function useInView$5(threshold = .15) {
	const ref = (0, import_react.useRef)(null);
	const [inView, setInView] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el || inView) return;
		const io = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting) {
				setInView(true);
				io.disconnect();
			}
		}, { threshold });
		io.observe(el);
		return () => io.disconnect();
	}, [inView, threshold]);
	return {
		ref,
		inView
	};
}
function ProblemSection() {
	const { ref, inView } = useInView$5(.12);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		ref,
		className: "relative overflow-hidden pb-16 font-[Tajawal] sm:pb-20 lg:pb-28",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary/5 blur-3xl"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute bottom-10 -left-24 h-80 w-80 rounded-full bg-beige blur-3xl"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute top-1/3 left-10 h-32 w-32 opacity-25",
				style: {
					backgroundImage: "radial-gradient(circle, rgba(249,115,22,0.35) 1.2px, transparent 1.5px)",
					backgroundSize: "12px 12px"
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mx-auto max-w-7xl -mt-5 px-4 pt-6 sm:px-6 sm:pt-10 lg:px-8 lg:pt-14",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto max-w-3xl text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "transition-all duration-700",
							style: {
								opacity: inView ? 1 : 0,
								transform: inView ? "translateY(0)" : "translateY(16px)",
								transitionDelay: "120ms"
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "text-center font-[Tajawal] text-[26px] font-extrabold leading-[1.12] tracking-tight text-foreground lg:origin-top lg:text-[78px] lg:font-black lg:leading-[1.08] lg:scale-[0.926]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-foreground",
									children: "لماذا لا يحقق أغلب الناس"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-[#FF6B00]",
									children: "النتائج التي يريدونها؟"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								"aria-hidden": true,
								className: "relative mx-auto mt-[5px] h-[2px] w-full max-w-xs overflow-hidden sm:max-w-sm lg:max-w-md",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full w-full bg-gradient-to-l from-[#FF6B00]/30 via-[#FF6B00]/12 to-transparent" }), inView && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pointer-events-none absolute inset-y-0 right-0 w-1/4 animate-title-line-shimmer-pingpong bg-gradient-to-l from-transparent via-[#FF6B00]/55 to-transparent" })]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-5 text-base leading-relaxed text-muted-foreground sm:text-xl transition-all duration-700",
							style: {
								opacity: inView ? 1 : 0,
								transform: inView ? "translateY(0)" : "translateY(16px)",
								transitionDelay: "240ms"
							},
							children: [
								"ليست المشكلة في الإرادة أو الحماس...",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								"بل في اتباع خطة لا تناسب جسمك وأهدافك ونمط حياتك."
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative mt-9 space-y-4 sm:space-y-5 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:space-y-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative order-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute right-3 sm:right-4 top-6 bottom-6 w-[2px] bg-primary/15" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "absolute right-3 sm:right-4 top-6 w-[2px] bg-primary transition-[height] duration-[1600ms] ease-out",
									style: { height: inView ? "calc(100% - 3rem)" : "0%" }
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
									className: "space-y-4 sm:space-y-5",
									children: PROBLEMS.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "relative pr-10 sm:pr-12 transition-all duration-700",
										style: {
											opacity: inView ? 1 : 0,
											transform: inView ? "translateY(0)" : "translateY(20px)",
											transitionDelay: `${i * 1e3}ms`
										},
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute right-1.5 sm:right-2.5 top-10 h-3 w-3 rounded-full bg-primary ring-4 ring-[#F7F5F2] shadow-[0_0_0_3px_rgba(249,115,22,0.15)]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProblemCard, {
											problem: p,
											index: i
										})]
									}, p.title))
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "order-2 lg:-mr-6 xl:-mr-10",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfusedVisual, { active: inView })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WarningBlock, { active: inView })
				]
			})
		]
	});
}
function ProblemCard({ problem, index }) {
	const Icon = problem.icon;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "group rounded-[24px] border border-border/40 bg-white p-5 shadow-card transition-all duration-500 sm:p-6 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start gap-4 sm:gap-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative shrink-0 animate-float-soft",
				style: { animationDelay: `${index * .6}s` },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					"aria-hidden": true,
					className: "absolute inset-0 rounded-full bg-[#FF6B00]/25 blur-lg scale-90 opacity-60 transition-opacity duration-500 group-hover:opacity-80"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative grid h-16 w-16 place-items-center rounded-full border border-white/70 bg-gradient-to-br from-orange-50/90 via-white/85 to-[#FFF0E3]/90 shadow-[0_8px_22px_-10px_rgba(255,107,0,0.38),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-[#FF6B00]/10 backdrop-blur-sm transition-all duration-500 group-hover:scale-105 group-hover:shadow-[0_12px_30px_-10px_rgba(255,107,0,0.48)] sm:h-[72px] sm:w-[72px]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
						className: "h-[30px] w-[30px] text-[#FF6B00] sm:h-[34px] sm:w-[34px]",
						strokeWidth: 2.25
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1 text-right",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-lg font-extrabold leading-tight text-foreground sm:text-xl",
					children: problem.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]",
					children: problem.description
				})]
			})]
		})
	});
}
/** CCW slots — only top/left so cards glide fully into each other's place */
var FLOAT_CARD_POSITIONS = [
	{
		top: "1rem",
		left: "calc(100% - 7.75rem)"
	},
	{
		top: "1rem",
		left: "0.5rem"
	},
	{
		top: "calc(100% - 10rem)",
		left: "0"
	},
	{
		top: "calc(100% - 10rem)",
		left: "calc(100% - 7.75rem)"
	}
];
var FLOAT_CARDS = [
	{
		icon: Zap,
		title: "برنامج من الإنترنت",
		desc: "1,200 سعرة حرارية\nتمارين عامة"
	},
	{
		icon: UtensilsCrossed,
		title: "دايت قاسي",
		desc: "حرمان كبير\nنتائج مؤقتة"
	},
	{
		icon: CalendarX,
		title: "جدول جاهز",
		desc: "لا يناسب وقتك\nولا نمط حياتك"
	},
	{
		icon: User,
		title: "خطة صديق",
		desc: "تمارين مختلفة\nلنظام مختلف"
	}
];
function ConfusedVisual({ active }) {
	const [orbitStep, setOrbitStep] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		if (!active) return;
		const timer = window.setInterval(() => {
			setOrbitStep((s) => (s + 1) % 4);
		}, 2500);
		return () => window.clearInterval(timer);
	}, [active]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative -mx-4 w-[calc(100%+2rem)] min-h-[min(92vw,420px)] sm:mx-0 sm:w-full sm:min-h-[460px] lg:min-h-[540px] transition-all duration-1000",
		style: {
			opacity: active ? 1 : 0,
			transform: active ? "translateY(0)" : "translateY(24px)"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-0 overflow-hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: confused_coach_default,
						alt: "شخص حائر أمام خطط متضاربة",
						width: 1024,
						height: 1024,
						loading: "lazy",
						className: "absolute left-1/2 top-1/2 h-[calc(100%+70px)] w-[calc(100%+70px)] max-w-none -translate-x-1/2 translate-y-[calc(-50%+20px)] object-cover object-[center_24%]"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"aria-hidden": true,
						className: "pointer-events-none absolute inset-x-0 top-0 z-[1] h-[10px] bg-gradient-to-b from-[#F7F5F2] to-transparent"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"aria-hidden": true,
						className: "pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[10px] bg-gradient-to-t from-[#F7F5F2] to-transparent"
					})
				]
			}),
			[
				"18%",
				"62%",
				"82%"
			].map((top, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "absolute z-10 text-3xl sm:text-4xl font-black text-primary/30 animate-float-soft",
				style: {
					top,
					left: i % 2 === 0 ? "8%" : "auto",
					right: i % 2 === 1 ? "12%" : "auto",
					animationDelay: `${i * .8}s`
				},
				children: "?"
			}, i)),
			FLOAT_CARDS.map((card, i) => {
				const Icon = card.icon;
				const pos = FLOAT_CARD_POSITIONS[(i + orbitStep) % 4];
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute z-10 w-[118px] rounded-2xl border border-border/40 bg-white p-2.5 text-center font-[Tajawal] shadow-card will-change-[top,left] sm:w-[132px] sm:p-3",
					style: {
						top: pos.top,
						left: pos.left,
						opacity: active ? 1 : 0,
						transform: active ? "scale(0.92)" : "scale(0.85)",
						transition: "top 700ms ease-in-out, left 700ms ease-in-out, opacity 700ms ease-in-out, transform 700ms ease-in-out",
						transitionDelay: active && orbitStep === 0 ? `${400 + i * 180}ms` : "0ms"
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mx-auto grid h-8 w-8 place-items-center rounded-full bg-primary-soft sm:h-9 sm:w-9",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								className: "h-3.5 w-3.5 text-primary sm:h-4 sm:w-4",
								strokeWidth: 2
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1.5 text-[11px] font-bold leading-tight text-foreground sm:text-xs",
							children: card.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-[9px] leading-snug text-muted-foreground whitespace-pre-line sm:text-[10px]",
							children: card.desc
						})
					]
				}, card.title);
			})
		]
	});
}
function WarningBlock({ active }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative mt-10 sm:mt-12 lg:mt-14",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute inset-x-3 top-4 bottom-0 rounded-2xl bg-[#1A1816]/20 shadow-[inset_0_3px_10px_rgba(15,23,42,0.12)] lg:inset-x-4 lg:rounded-3xl"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute -inset-2 rounded-2xl bg-[#FF6B00]/20 blur-2xl animate-warning-card-outer-glow lg:-inset-3 lg:rounded-3xl"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#2A2521] via-[#1F1C18] to-[#2E2824] p-4 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_22px_48px_-14px_rgba(255,107,0,0.28),0_16px_40px_-18px_rgba(15,23,42,0.45)] ring-1 ring-white/[0.05] transition-[transform,opacity,box-shadow] duration-700 ease-out sm:p-5 lg:rounded-3xl lg:p-6",
				style: {
					opacity: active ? 1 : 0,
					transform: active ? "translateY(-8px) scale(1)" : "translateY(18px) scale(0.97)",
					boxShadow: active ? "0 1px 0 rgba(255,255,255,0.08) inset, 0 28px 56px -16px rgba(255,107,0,0.32), 0 20px 48px -18px rgba(15,23,42,0.55), 0 0 0 1px rgba(255,107,0,0.14)" : void 0,
					transitionDelay: "400ms"
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "pointer-events-none absolute inset-0 overflow-hidden rounded-2xl lg:rounded-3xl",
						"aria-hidden": true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-y-[-30%] left-0 h-[160%] w-[50%] animate-warning-card-shimmer bg-gradient-to-r from-transparent via-white/14 to-transparent" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "pointer-events-none absolute inset-0 rounded-2xl animate-warning-card-inner-glow lg:rounded-3xl",
						"aria-hidden": true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"aria-hidden": true,
						className: "pointer-events-none absolute inset-x-0 top-0 h-px animate-warning-card-border-pulse bg-gradient-to-r from-transparent via-white/25 to-transparent"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"aria-hidden": true,
						className: "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#FF6B00]/[0.12] blur-3xl animate-warning-card-outer-glow"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"aria-hidden": true,
						className: "pointer-events-none absolute bottom-4 left-1/4 h-20 w-20 opacity-30",
						style: {
							backgroundImage: "radial-gradient(circle, rgba(255,107,0,0.5) 1px, transparent 1.5px)",
							backgroundSize: "10px 10px"
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative z-10 flex flex-col items-center gap-5 lg:flex-row lg:items-center lg:gap-8",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white shadow-[0_8px_24px_-6px_rgba(255,107,0,0.65)] sm:h-14 sm:w-14 sm:rounded-2xl",
								style: { backgroundImage: "linear-gradient(135deg, #ff8a3d 0%, #f97316 60%, #ea580c 100%)" },
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
									className: "h-6 w-6 sm:h-7 sm:w-7",
									strokeWidth: 2.2
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1 text-center font-[Tajawal] lg:text-right",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
									className: "text-[25px] font-black leading-[1.15] tracking-tight sm:text-[27px] lg:text-[29px]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-white/95",
										children: "المشكلة ليست فيك..."
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-[#FF6B00]",
										children: "المشكلة في الخطة التي تتبعها."
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1.5 text-[13px] leading-relaxed text-white/60 sm:text-sm",
									children: "كل جسم مختلف، وكل هدف يحتاج استراتيجية خاصة — نتائج أسرع واستدامة أعلى."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "w-full shrink-0 sm:w-auto lg:self-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: "/quiz",
									className: "group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-[#FF6B00]/35 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white/95 shadow-[0_8px_24px_-10px_rgba(255,107,0,0.45)] backdrop-blur-sm transition-[transform,background-color,border-color,box-shadow] duration-300 sm:w-auto sm:px-6 hover:scale-[1.02] hover:border-[#FF6B00] hover:bg-[#FF6B00]/12 hover:shadow-[0_0_0_5px_rgba(255,107,0,0.18),0_16px_40px_-12px_rgba(255,107,0,0.5)] active:scale-[0.98] lg:py-3.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "pointer-events-none absolute -inset-1 rounded-full bg-[#FF6B00]/25 blur-md animate-warning-cta-glow",
											"aria-hidden": true
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "pointer-events-none absolute inset-0 overflow-hidden rounded-full",
											"aria-hidden": true,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-y-[-20%] left-0 h-[140%] w-[45%] animate-cta-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "pointer-events-none absolute inset-0 rounded-full animate-warning-cta-inner-glow",
											"aria-hidden": true
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "relative z-10 transition-transform duration-300 group-hover:scale-[1.02]",
											children: "اكتشف الحل المناسب لك"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
											className: "relative z-10 h-4 w-4 text-[#FF6B00] transition-transform duration-300 animate-warning-cta-arrow group-hover:-translate-x-1",
											strokeWidth: 2.5
										})
									]
								})
							})
						]
					})
				]
			})
		]
	});
}
var stage1_default = "/assets/stage1-C7ZOq-m6.png";
var stage2_default = "/assets/stage2-DCZMNx1O.png";
var stage3_default = "/assets/stage3-CnlkNCBl.png";
var DarkPremiumPanel = (0, import_react.forwardRef)(function DarkPremiumPanel({ children, active = true, className = "", innerClassName = "", transitionDelay = "400ms" }, ref) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref,
		className: `relative ${className}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute inset-x-3 top-4 bottom-0 rounded-2xl bg-[#1A1816]/20 shadow-[inset_0_3px_10px_rgba(15,23,42,0.12)] lg:inset-x-4 lg:rounded-3xl"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute -inset-2 rounded-2xl bg-[#FF6B00]/20 blur-2xl animate-warning-card-outer-glow lg:-inset-3 lg:rounded-3xl"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: ["relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#2A2521] via-[#1F1C18] to-[#2E2824] p-4 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_22px_48px_-14px_rgba(255,107,0,0.28),0_16px_40px_-18px_rgba(15,23,42,0.45)] ring-1 ring-white/[0.05] transition-[transform,opacity,box-shadow] duration-700 ease-out sm:p-5 lg:rounded-3xl lg:p-6", innerClassName].join(" "),
				style: {
					opacity: active ? 1 : 0,
					transform: active ? "translateY(-8px) scale(1)" : "translateY(18px) scale(0.97)",
					boxShadow: active ? "0 1px 0 rgba(255,255,255,0.08) inset, 0 28px 56px -16px rgba(255,107,0,0.32), 0 20px 48px -18px rgba(15,23,42,0.55), 0 0 0 1px rgba(255,107,0,0.14)" : void 0,
					transitionDelay
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "pointer-events-none absolute inset-0 overflow-hidden rounded-2xl lg:rounded-3xl",
						"aria-hidden": true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-y-[-30%] left-0 h-[160%] w-[50%] animate-warning-card-shimmer bg-gradient-to-r from-transparent via-white/14 to-transparent" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "pointer-events-none absolute inset-0 rounded-2xl animate-warning-card-inner-glow lg:rounded-3xl",
						"aria-hidden": true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"aria-hidden": true,
						className: "pointer-events-none absolute inset-x-0 top-0 h-px animate-warning-card-border-pulse bg-gradient-to-r from-transparent via-white/25 to-transparent"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"aria-hidden": true,
						className: "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#FF6B00]/[0.12] blur-3xl animate-warning-card-outer-glow"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"aria-hidden": true,
						className: "pointer-events-none absolute bottom-4 left-1/4 h-20 w-20 opacity-30",
						style: {
							backgroundImage: "radial-gradient(circle, rgba(255,107,0,0.5) 1px, transparent 1.5px)",
							backgroundSize: "10px 10px"
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative z-10",
						children
					})
				]
			})
		]
	});
});
var STAGES = [
	{
		phase: "المرحلة الأولى",
		title: "بناء الأساس",
		days: "أيام 1 - 30",
		dayNumber: "30",
		checks: [
			"تقييم شامل لحالتك الحالية",
			"بناء عادات صحية جديدة",
			"خطة تغذية منظمة",
			"بداية فقدان الدهون"
		],
		resultLine1: "2 - 5 كغ",
		resultLine2: "خسارة دهون",
		resultIcon: Flame,
		resultTone: "primary",
		image: stage1_default,
		badgeTone: "primary"
	},
	{
		phase: "المرحلة الثانية",
		title: "تسريع النتائج",
		days: "أيام 31 - 60",
		dayNumber: "60",
		checks: [
			"زيادة الكتلة العضلية",
			"تحسين القوة والتحمل",
			"استمرار فقدان الدهون",
			"تحسين مستويات الطاقة"
		],
		resultLine1: "3 - 7 كغ",
		resultLine2: "كتلة عضلية",
		resultIcon: Dumbbell,
		resultTone: "success",
		image: stage2_default,
		badgeTone: "success"
	},
	{
		phase: "المرحلة الثالثة",
		title: "الوصول لأفضل نسخة",
		days: "أيام 61 - 90",
		dayNumber: "90",
		checks: [
			"شكل جسم أكثر تناسقاً",
			"تحسين الأداء البدني",
			"ثبات النتائج واستدامتها",
			"ثقة عالية بنفسك"
		],
		resultLine1: "أفضل نسخة",
		resultLine2: "من نفسك",
		resultIcon: Target,
		resultTone: "primary",
		image: stage3_default,
		badgeTone: "primary"
	}
];
var STATS = [
	{
		icon: TrendingUp,
		value: "+85%",
		label: "زيادة الطاقة والنشاط",
		num: 85,
		prefix: "+",
		suffix: "%"
	},
	{
		icon: Activity,
		value: "-12kg",
		label: "متوسط خسارة دهون",
		num: 12,
		prefix: "-",
		suffix: "kg"
	},
	{
		icon: Dumbbell,
		value: "+4.7kg",
		label: "متوسط زيادة الكتلة العضلية",
		num: 4.7,
		prefix: "+",
		suffix: "kg",
		decimals: 1
	},
	{
		icon: Shield,
		value: "90 يوم",
		label: "نحو حياة جديدة",
		num: 90,
		prefix: "",
		suffix: " يوم"
	}
];
function useInView$4(threshold = .2) {
	const ref = (0, import_react.useRef)(null);
	const [inView, setInView] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el || inView) return;
		const io = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting) {
				setInView(true);
				io.disconnect();
			}
		}, { threshold });
		io.observe(el);
		return () => io.disconnect();
	}, [inView, threshold]);
	return {
		ref,
		inView
	};
}
function useCounter(target, active, decimals = 0, duration = 1600) {
	const [value, setValue] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		if (!active) return;
		let raf = 0;
		const start = performance.now();
		const tick = (now) => {
			const t = Math.min(1, (now - start) / duration);
			const eased = 1 - Math.pow(1 - t, 3);
			setValue(Number((eased * target).toFixed(decimals)));
			if (t < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [
		active,
		target,
		decimals,
		duration
	]);
	return value;
}
function Results90() {
	const { ref: sectionRef, inView } = useInView$4(.1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		ref: sectionRef,
		className: "relative overflow-hidden bg-background py-16 sm:py-20 lg:py-28",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FloatingBg, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute -top-20 -right-24 h-72 w-72 rounded-full bg-beige opacity-70 blur-2xl"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute bottom-32 -left-20 h-64 w-64 rounded-full bg-primary-soft opacity-60 blur-2xl"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute top-24 left-6 h-28 w-40 opacity-50 hidden lg:block",
				style: {
					backgroundImage: "radial-gradient(circle, rgba(249,115,22,0.35) 1.2px, transparent 1.5px)",
					backgroundSize: "12px 12px"
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-center max-w-3xl mx-auto",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "-mt-[30px] text-center font-[Tajawal] text-[26px] font-extrabold leading-[1.12] tracking-tight text-foreground lg:origin-top lg:-mt-[20px] lg:text-[78px] lg:font-black lg:leading-[1.08] lg:scale-[0.926]",
								children: [
									"ماذا يمكنك تحقيقه",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "inline-block translate-y-[2px] text-primary",
										children: "خلال 90 يوماً؟"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								"aria-hidden": true,
								className: "relative mx-auto mt-[5px] h-[2px] w-full max-w-xs overflow-hidden sm:max-w-sm lg:max-w-md",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full w-full bg-gradient-to-l from-[#FF6B00]/30 via-[#FF6B00]/12 to-transparent" }), inView && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pointer-events-none absolute inset-y-0 right-0 w-1/4 animate-title-line-shimmer-pingpong bg-gradient-to-l from-transparent via-[#FF6B00]/55 to-transparent" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-5 text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed",
								children: "برنامجك المخصص مصمم لمساعدتك على تحقيق أفضل نتائج في وقت قياسي وبشكل صحي ومستدام."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative mt-14 hidden lg:block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-12 right-[10%] left-[10%] h-[2px] border-t-2 border-dashed border-primary/25" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "absolute top-12 right-[10%] h-[2px] border-t-2 border-dashed border-primary transition-[width] duration-[1800ms] ease-out",
									style: { width: inView ? "80%" : "0%" }
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "relative grid grid-cols-3",
									children: STAGES.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col items-center",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "grid h-24 w-24 place-items-center rounded-full bg-white ring-2 ring-primary/30 shadow-[0_10px_30px_-12px_rgba(249,115,22,0.45)] transition-all duration-700 animate-pulse-soft",
											style: {
												opacity: inView ? 1 : 0,
												transform: inView ? "scale(1)" : "scale(0.7)",
												transitionDelay: `${400 + i * 250}ms`
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-center",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-primary font-black text-2xl leading-none",
													children: s.dayNumber
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-primary/80 text-xs font-bold mt-1",
													children: "يوم"
												})]
											})
										}), i < 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "absolute top-[34px] hidden lg:grid h-8 w-8 place-items-center rounded-full bg-primary text-white shadow-[0_6px_16px_-4px_rgba(249,115,22,0.6)]",
											style: {
												right: `${i === 0 ? "33%" : "66%"}`,
												transform: "translateX(50%)",
												opacity: inView ? 1 : 0,
												transition: "opacity 700ms ease-out",
												transitionDelay: `${900 + i * 250}ms`
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
												width: "14",
												height: "14",
												viewBox: "0 0 24 24",
												fill: "none",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
													d: "M15 6l-6 6 6 6",
													stroke: "currentColor",
													strokeWidth: "3",
													strokeLinecap: "round",
													strokeLinejoin: "round"
												})
											})
										})]
									}, s.dayNumber))
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-10 grid grid-cols-3 gap-6",
							children: STAGES.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StageCard, {
								stage: s,
								index: i,
								active: inView
							}, s.dayNumber))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-12 lg:hidden relative",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute right-[22px] top-5 bottom-5 w-[2px] border-r-2 border-dashed border-primary/25" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "absolute right-[22px] top-5 w-[2px] border-r-2 border-dashed border-primary transition-[height] duration-[1800ms] ease-out",
								style: { height: inView ? "calc(100% - 2.5rem)" : "0%" }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
								className: "space-y-4",
								children: STAGES.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "relative pr-[4.5rem]",
									style: {
										opacity: inView ? 1 : 0,
										transform: inView ? "translateY(0)" : "translateY(20px)",
										transition: "all 700ms ease-out",
										transitionDelay: `${300 + i * 200}ms`
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: `absolute right-0 top-4 grid h-12 w-12 place-items-center rounded-full text-white font-black ring-[3px] ring-background shadow-[0_6px_16px_-4px_rgba(249,115,22,0.5)] animate-pulse-soft ${s.badgeTone === "success" ? "bg-success" : "bg-primary"}`,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-center leading-none",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-sm",
												children: s.dayNumber
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-[9px] font-bold mt-0.5 opacity-90",
												children: "يوم"
											})]
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StageCard, {
										stage: s,
										index: i,
										active: inView,
										mobile: true
									})]
								}, s.dayNumber))
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomStats, {})
				]
			})
		]
	});
}
function StageCard({ stage, index, active, mobile = false }) {
	const ResultIcon = stage.resultIcon;
	const isSuccessBadge = stage.badgeTone === "success";
	const resultPrimary = stage.resultTone === "primary";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: ["group relative flex flex-col overflow-visible bg-white border border-border/40 shadow-card transition-all duration-500", mobile ? "mb-3 rounded-2xl p-3.5 ring-1 ring-neutral-100/70 shadow-[0_4px_18px_-10px_rgba(15,23,42,0.08)]" : "mb-4 rounded-[28px] p-6 lg:p-7 hover:-translate-y-2 hover:shadow-[0_24px_60px_-15px_rgba(0,0,0,0.18)]"].join(" "),
		style: {
			opacity: active ? 1 : 0,
			transform: active ? "translateY(0)" : "translateY(28px)",
			transition: "opacity 700ms ease-out, transform 700ms ease-out",
			transitionDelay: `${600 + index * 150}ms`
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: mobile ? "flex items-stretch gap-2" : "flex items-stretch gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: ["relative shrink-0 self-stretch overflow-visible", mobile ? "w-[40%] min-w-[100px] min-h-[128px]" : "w-[44%] min-w-[150px] min-h-[210px] lg:min-h-[230px]"].join(" "),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: stage.image,
					alt: stage.title,
					width: 768,
					height: 1024,
					loading: "lazy",
					className: ["absolute bottom-0 left-0 right-0 w-full object-contain object-bottom animate-float-soft", mobile ? "h-[125%] max-w-none" : "h-[118%] max-w-none"].join(" "),
					style: { animationDelay: `${index * .6}s` }
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1 flex flex-col",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: [
							"inline-flex items-center rounded-full font-extrabold self-start",
							mobile ? "px-3 py-1 text-[10px]" : "px-4 py-1.5 text-xs",
							isSuccessBadge ? "bg-success-soft text-success" : "bg-primary-soft text-primary"
						].join(" "),
						children: stage.phase
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: ["mt-2 text-right font-black text-foreground tracking-tight", mobile ? "text-base leading-snug" : "mt-3 text-xl lg:text-2xl"].join(" "),
						children: stage.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: ["text-right text-muted-foreground font-medium", mobile ? "mt-0.5 text-[11px]" : "mt-1 text-sm"].join(" "),
						children: stage.days
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: mobile ? "mt-2.5 space-y-1.5" : "mt-3 space-y-2",
						children: stage.checks.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: ["flex items-center justify-end gap-2 text-foreground/90", mobile ? "text-[12px] leading-snug" : "text-[14px]"].join(" "),
							style: {
								opacity: active ? 1 : 0,
								transform: active ? "translateX(0)" : "translateX(-8px)",
								transition: "all 400ms ease-out",
								transitionDelay: `${900 + index * 150 + i * 120}ms`
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-right",
								children: c
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: ["grid shrink-0 place-items-center rounded-full bg-success/15 text-success", mobile ? "h-4 w-4" : "h-5 w-5"].join(" "),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
									className: mobile ? "h-3 w-3" : "h-3.5 w-3.5",
									strokeWidth: 3
								})
							})]
						}, c))
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: mobile ? "relative z-10 mt-2 px-0.5" : "relative z-10 mt-3 px-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				"aria-hidden": true,
				className: ["pointer-events-none absolute -inset-x-1 top-1 bottom-[-10px] rounded-2xl blur-2xl opacity-90", resultPrimary ? "bg-[#FF6B00]/30 animate-warning-card-outer-glow" : "bg-[#22C55E]/25 animate-warning-card-outer-glow"].join(" ")
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: [
					"relative mx-auto flex w-full max-w-[92%] items-center justify-center gap-2.5 overflow-hidden",
					mobile ? "rounded-xl px-3 py-2.5" : "gap-3 rounded-2xl px-4 py-3",
					"border border-white/75 bg-gradient-to-br from-white/85 via-white/55 to-white/35 backdrop-blur-md",
					"ring-1 ring-white/60",
					resultPrimary ? "animate-stage-result-glass-glow" : "animate-stage-result-glass-glow-success"
				].join(" "),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "pointer-events-none absolute inset-0 overflow-hidden rounded-xl lg:rounded-2xl",
						"aria-hidden": true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-y-[-30%] left-0 h-[160%] w-[50%] animate-warning-card-shimmer bg-gradient-to-r from-transparent via-white/45 to-transparent" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: ["pointer-events-none absolute inset-0 rounded-xl lg:rounded-2xl animate-warning-card-inner-glow", !resultPrimary && "opacity-80"].join(" "),
						"aria-hidden": true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"aria-hidden": true,
						className: "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative z-10 text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: [
								"font-black leading-tight",
								mobile ? "text-sm" : "text-base",
								resultPrimary ? "text-primary" : "text-success"
							].join(" "),
							children: stage.resultLine1
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: ["text-muted-foreground font-bold", mobile ? "text-[10px] mt-0.5" : "text-xs mt-0.5"].join(" "),
							children: stage.resultLine2
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: [
							"relative z-10 grid shrink-0 place-items-center rounded-full text-white",
							mobile ? "h-9 w-9" : "h-11 w-11",
							resultPrimary ? "bg-primary shadow-[0_8px_22px_-4px_rgba(249,115,22,0.65)]" : "bg-success shadow-[0_8px_22px_-4px_rgba(34,197,94,0.55)]"
						].join(" "),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultIcon, { className: mobile ? "h-4 w-4" : "h-5 w-5" })
					})
				]
			})]
		})]
	});
}
function BottomStats() {
	const { ref, inView } = useInView$4(.3);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DarkPremiumPanel, {
		ref,
		active: inView,
		className: "mx-auto mt-10 max-w-2xl sm:max-w-3xl lg:mt-14",
		innerClassName: "px-4 py-5 sm:px-6 sm:py-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-center text-base font-black tracking-tight text-white/95 sm:text-lg [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]",
				children: "نتائج تتجاوز التوقعات"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:grid-cols-4 sm:gap-2",
				children: STATS.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatItem, {
					stat: s,
					index: i,
					active: inView
				}, s.label))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex items-start justify-center gap-2 border-t border-white/10 pt-4 text-center text-[11px] leading-relaxed text-white/70 sm:items-center sm:text-xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "mt-0.5 h-3.5 w-3.5 shrink-0 text-success sm:mt-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "النتائج تختلف من شخص لآخر وتعتمد على الالتزام بالخطة الموصوفة والمتابعة المستمرة." })]
			})
		]
	});
}
function StatItem({ stat, index, active }) {
	const value = useCounter(stat.num, active, stat.decimals ?? 0);
	const Icon = stat.icon;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center px-1 text-center sm:px-2",
		style: {
			opacity: active ? 1 : 0,
			transform: active ? "translateY(0)" : "translateY(12px)",
			transition: "all 600ms ease-out",
			transitionDelay: `${200 + index * 120}ms`
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 text-success shadow-[0_6px_16px_-8px_rgba(34,197,94,0.35)] ring-1 ring-[#22C55E]/20 backdrop-blur-sm sm:h-10 sm:w-10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
					className: "h-4 w-4 shrink-0",
					strokeWidth: 2.2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 text-lg font-black leading-none tabular-nums text-white sm:text-xl [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]",
				children: [
					stat.prefix,
					stat.decimals ? value.toFixed(stat.decimals) : Math.round(value),
					stat.suffix
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 text-[10px] font-medium leading-snug text-white/75 sm:text-xs",
				children: stat.label
			})
		]
	});
}
function FloatingBg() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"aria-hidden": true,
		className: "pointer-events-none absolute inset-0 overflow-hidden",
		children: [
			{
				Icon: Dumbbell,
				top: "10%",
				left: "5%",
				delay: "0s"
			},
			{
				Icon: Target,
				top: "30%",
				right: "8%",
				delay: "1.5s"
			},
			{
				Icon: Ruler,
				bottom: "30%",
				left: "10%",
				delay: "2.5s"
			},
			{
				Icon: Zap,
				top: "55%",
				right: "5%",
				delay: "3.5s"
			},
			{
				Icon: Shield,
				bottom: "10%",
				right: "20%",
				delay: "4.5s"
			}
		].map(({ Icon, delay, ...pos }, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
			className: "absolute h-14 w-14 text-primary/[0.06] animate-float blur-[0.5px]",
			style: {
				...pos,
				animationDelay: delay
			},
			strokeWidth: 1.5
		}, i))
	});
}
function useInView$3(opts = { threshold: .15 }) {
	const ref = (0, import_react.useRef)(null);
	const [inView, setInView] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!ref.current) return;
		const io = new IntersectionObserver(([e]) => {
			if (e.isIntersecting) {
				setInView(true);
				io.disconnect();
			}
		}, opts);
		io.observe(ref.current);
		return () => io.disconnect();
	}, []);
	return {
		ref,
		inView
	};
}
var steps = [
	{
		n: "01",
		Icon: MessageCircleQuestionMark,
		title: "أجب على الأسئلة",
		text: "أجب على مجموعة من الأسئلة عن هدفك، نمط حياتك، ومستواك الحالي."
	},
	{
		n: "02",
		Icon: ChartColumn,
		title: "نحلل بياناتك",
		text: "نقوم بتحليل إجاباتك وبياناتك لفهم احتياجاتك وتحديد نقاط التحسين."
	},
	{
		n: "03",
		Icon: ClipboardList,
		title: "نبني خطتك",
		text: "نبني لك برنامج تدريب وخطة تغذية مخصصة بناءً على تحليل بياناتك."
	},
	{
		n: "04",
		Icon: CircleCheck,
		title: "تحصل على توصيتك",
		text: "تحصل على برنامجك المخصص جاهز للتطبيق ومتابعة مستمرة لتحقيق أفضل النتائج."
	}
];
var trustFeatures = [
	{
		Icon: Award,
		title: "فعال",
		text: "نظام proven لتحقيق النتائج"
	},
	{
		Icon: Zap,
		title: "سريع",
		text: "خطة جاهزة خلال دقائق"
	},
	{
		Icon: ShieldCheck,
		title: "آمن",
		text: "بياناتك محمية 100%"
	},
	{
		Icon: Target,
		title: "دقيق",
		text: "تحليل شامل لبياناتك"
	}
];
var ASSESSMENT_CHECKLIST = [
	{
		label: "المعلومات الأساسية",
		progress: 25
	},
	{
		label: "الهدف والمدة",
		progress: 50
	},
	{
		label: "النشاط الحالي",
		progress: 75
	},
	{
		label: "التغذية ونمط الحياة",
		progress: 100
	}
];
var STEP_INTERVAL_MS = 2500;
var PROGRESS_R = 54;
var PROGRESS_C = 2 * Math.PI * PROGRESS_R;
function PhoneMockup({ activeStep, compact = false }) {
	const progress = ASSESSMENT_CHECKLIST[activeStep].progress;
	const dash = progress / 100 * PROGRESS_C;
	const prevProgressRef = (0, import_react.useRef)(progress);
	const [pulseKey, setPulseKey] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		if (prevProgressRef.current !== progress) {
			prevProgressRef.current = progress;
			setPulseKey((k) => k + 1);
		}
	}, [progress]);
	const shellW = compact ? "w-[220px]" : "w-[280px] sm:w-[300px]";
	const beigeSize = compact ? "w-[280px] h-[280px]" : "w-[360px] h-[360px]";
	const ringBox = compact ? "w-[112px] h-[112px]" : "w-[140px] h-[140px]";
	const pctText = compact ? "text-xl" : "text-2xl";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `relative mx-auto ${shellW} animate-float-phone font-[Tajawal,Cairo,sans-serif]`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0 -z-10 flex items-center justify-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `${beigeSize} rounded-full bg-beige` })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative rounded-[40px] bg-black p-1.5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.35)] sm:rounded-[44px] sm:p-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative overflow-hidden rounded-[32px] bg-white aspect-[9/19.5] sm:rounded-[36px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between px-5 pt-2.5 text-[10px] font-semibold text-black sm:px-6 sm:pt-3 sm:text-[11px]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "9:41" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-2 left-1/2 -translate-x-1/2 h-5 w-24 rounded-full bg-black sm:h-6 sm:w-28" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Signal, { size: 11 }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wifi, { size: 11 }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BatteryFull, { size: 13 })
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "px-4 pt-4 pb-3 sm:px-5 sm:pt-6 sm:pb-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-center text-[12px] font-bold text-foreground sm:text-[13px]",
							children: "تقدم التقييم"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `relative mx-auto mt-3 ${ringBox} sm:mt-4`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
								viewBox: "0 0 140 140",
								className: "-rotate-90 w-full h-full",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "70",
									cy: "70",
									r: PROGRESS_R,
									stroke: "#FFF1E5",
									strokeWidth: "10",
									fill: "none"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "70",
									cy: "70",
									r: PROGRESS_R,
									stroke: "#F97316",
									strokeWidth: "10",
									fill: "none",
									strokeLinecap: "round",
									strokeDasharray: `${dash} ${PROGRESS_C}`,
									className: "transition-[stroke-dasharray] duration-700 ease-out"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "absolute inset-0 flex flex-col items-center justify-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: `${pctText} font-extrabold text-foreground animate-how-step-slide-in`,
									children: [progress, "%"]
								}, pulseKey), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[9px] text-muted-foreground mt-0.5 sm:text-[10px] sm:mt-1",
									children: "تم إكمال التقييم"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 space-y-1.5 sm:mt-4 sm:space-y-2",
							children: ASSESSMENT_CHECKLIST.map((it, i) => {
								const isDone = i < activeStep;
								const isActive = i === activeStep;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: `flex items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5 transition-all duration-500 ease-out sm:px-3 sm:py-2 ${isActive ? "border-primary/45 bg-[#FFF7ED] shadow-[0_4px_14px_-6px_rgba(249,115,22,0.35)] ring-1 ring-primary/15 scale-[1.02]" : isDone ? "border-[#E8F5E9] bg-white" : "border-[#F1F1F1] bg-white opacity-80"} ${isActive ? "animate-how-step-slide-in" : ""}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `text-[10px] font-semibold leading-snug sm:text-[11px] ${isActive ? "text-primary font-bold" : isDone ? "text-foreground" : "text-muted-foreground"}`,
										children: it.label
									}), isDone ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "grid h-4 w-4 place-items-center rounded-full bg-[#22C55E] text-white sm:h-5 sm:w-5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
											size: 10,
											strokeWidth: 3,
											className: "sm:hidden"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
											size: 12,
											strokeWidth: 3,
											className: "hidden sm:block"
										})]
									}) : isActive ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "relative grid h-4 w-4 place-items-center sm:h-5 sm:w-5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-0 rounded-full bg-primary/25 animate-pulse-soft" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2.5 w-2.5 rounded-full bg-primary sm:h-3 sm:w-3" })]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-4 w-4 rounded-full border-2 border-[#E5E7EB] sm:h-5 sm:w-5" })]
								}, it.label);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/quiz",
							className: "mt-3 flex w-full items-center justify-center rounded-2xl bg-primary py-2.5 text-[11px] font-bold text-white shadow-cta sm:mt-4 sm:py-3 sm:text-[12px]",
							children: "متابعة التقييم"
						})
					]
				})]
			})
		})]
	});
}
function StepDots({ activeStep, onSelect }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex items-center justify-center gap-2 mt-4",
		dir: "rtl",
		children: ASSESSMENT_CHECKLIST.map((it, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"aria-label": `الخطوة ${i + 1}: ${it.label}`,
			"aria-current": i === activeStep ? "step" : void 0,
			onClick: () => onSelect(i),
			className: `rounded-full transition-all duration-500 ease-out ${i === activeStep ? "h-2.5 w-7 bg-primary shadow-[0_0_12px_rgba(249,115,22,0.45)]" : "h-2.5 w-2.5 bg-primary/25 hover:bg-primary/40"}`
		}, it.label))
	});
}
function StepCard({ step, index }) {
	const { ref, inView } = useInView$3();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref,
		style: { transitionDelay: `${index * 100}ms` },
		className: `group rounded-[28px] border border-[#F1F1F1] bg-white p-6 shadow-card transition-all duration-700 ease-out hover:-translate-y-1 hover:shadow-soft ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto grid h-16 w-16 place-items-center rounded-full bg-beige",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(step.Icon, {
					className: "text-primary",
					size: 28,
					strokeWidth: 1.8
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-5 text-center text-lg font-bold text-foreground",
				children: step.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-center text-sm leading-relaxed text-muted-foreground",
				children: step.text
			})
		]
	});
}
function StepNumber({ n }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mx-auto grid h-16 w-16 place-items-center rounded-full bg-white border-2 border-primary text-primary text-lg font-extrabold shadow-sm",
		children: n
	});
}
function Arrow() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "hidden lg:grid h-7 w-7 place-items-center rounded-full bg-primary text-white shadow-sm animate-pulse-soft",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
			size: 14,
			strokeWidth: 2.5
		})
	});
}
function HowItWorks() {
	const { ref: secRef, inView: secIn } = useInView$3({ threshold: .05 });
	const [activeStep, setActiveStep] = (0, import_react.useState)(0);
	const pauseUntilRef = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		if (!secIn) return;
		const tick = () => {
			if (Date.now() < pauseUntilRef.current) return;
			setActiveStep((s) => (s + 1) % ASSESSMENT_CHECKLIST.length);
		};
		const id = setInterval(tick, STEP_INTERVAL_MS);
		return () => clearInterval(id);
	}, [secIn]);
	const handleStepSelect = (i) => {
		setActiveStep(i);
		pauseUntilRef.current = Date.now() + STEP_INTERVAL_MS * 2;
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "how",
		ref: secRef,
		dir: "rtl",
		className: `relative bg-white py-10 lg:py-28 overflow-hidden font-[Tajawal,Cairo,sans-serif] transition-opacity duration-700 ${secIn ? "opacity-100" : "opacity-0"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute top-20 right-8 w-20 h-20 opacity-30 lg:top-32 lg:opacity-40",
				style: {
					backgroundImage: "radial-gradient(#F97316 1.2px, transparent 1.2px)",
					backgroundSize: "12px 12px"
				},
				"aria-hidden": true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute top-20 left-8 w-20 h-20 opacity-30 lg:top-32 lg:opacity-40",
				style: {
					backgroundImage: "radial-gradient(#F97316 1.2px, transparent 1.2px)",
					backgroundSize: "12px 12px"
				},
				"aria-hidden": true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "container mx-auto px-4 -mt-[30px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-center max-w-2xl mx-auto -mt-[30px]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "origin-top text-[37px] font-[Tajawal] font-extrabold leading-[1.08] tracking-tight text-foreground scale-[0.853] sm:scale-[0.896] sm:text-[52px] lg:scale-[0.926] lg:text-[71px]",
								children: [
									"كيف ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "inline-block translate-y-[2px] text-primary",
										children: "يعمل"
									}),
									" التقييم؟"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								"aria-hidden": true,
								className: "relative mx-auto mt-[5px] h-[2px] w-full max-w-xs overflow-hidden sm:max-w-sm lg:max-w-md",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full w-full bg-gradient-to-l from-[#FF6B00]/30 via-[#FF6B00]/12 to-transparent" }), secIn && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pointer-events-none absolute inset-y-0 right-0 w-1/4 animate-title-line-shimmer-pingpong bg-gradient-to-l from-transparent via-[#FF6B00]/55 to-transparent" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted-foreground sm:mt-4 sm:text-base",
								children: "عملية بسيطة وسريعة للحصول على برنامجك المخصص بخطوات مدروسة."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "lg:hidden mt-5 flex flex-col items-center justify-center max-h-[85vh] min-h-0 px-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneMockup, {
								activeStep,
								compact: true
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepDots, {
								activeStep,
								onSelect: handleStepSelect
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-center text-[11px] text-muted-foreground max-w-[240px] leading-relaxed",
								children: ASSESSMENT_CHECKLIST[activeStep].label
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative mt-16 hidden lg:block",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "absolute left-0 right-0 top-[40px] h-0 border-t-2 border-dashed border-primary/40",
								"aria-hidden": true
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-[1fr_auto_1fr_auto_320px_auto_1fr_auto_1fr] items-center gap-4 relative z-10",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepNumber, { n: "01" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arrow, {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepNumber, { n: "02" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arrow, {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arrow, {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepNumber, { n: "03" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arrow, {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepNumber, { n: "04" })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-8 grid grid-cols-[1fr_1fr_320px_1fr_1fr] gap-6 items-start",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepCard, {
										step: steps[0],
										index: 0
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepCard, {
										step: steps[1],
										index: 1
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "-mt-32 flex flex-col items-center justify-center",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneMockup, { activeStep }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepDots, {
											activeStep,
											onSelect: handleStepSelect
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepCard, {
										step: steps[2],
										index: 2
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepCard, {
										step: steps[3],
										index: 3
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative mt-10 lg:mt-16",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								"aria-hidden": true,
								className: "pointer-events-none absolute inset-x-3 top-4 bottom-0 rounded-2xl bg-[#1A1816]/20 shadow-[inset_0_3px_10px_rgba(15,23,42,0.12)] lg:inset-x-4 lg:rounded-3xl"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								"aria-hidden": true,
								className: "pointer-events-none absolute -inset-2 rounded-2xl bg-[#FF6B00]/20 blur-2xl animate-warning-card-outer-glow lg:-inset-3 lg:rounded-3xl"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative overflow-hidden rounded-2xl border border-white/[0.10] bg-gradient-to-br from-[#252220] via-[#1A1818] to-[#232019] p-4 shadow-[0_1px_0_rgba(255,255,255,0.07)_inset,0_20px_44px_-16px_rgba(255,107,0,0.24),0_14px_36px_-16px_rgba(15,23,42,0.42)] ring-1 ring-white/[0.06] transition-[transform,opacity,box-shadow] duration-700 ease-out sm:p-5 lg:rounded-3xl lg:p-6",
								style: {
									opacity: secIn ? 1 : 0,
									transform: secIn ? "translateY(-8px) scale(1)" : "translateY(18px) scale(0.97)",
									boxShadow: secIn ? "0 1px 0 rgba(255,255,255,0.09) inset, 0 24px 52px -18px rgba(255,107,0,0.28), 0 18px 44px -18px rgba(15,23,42,0.52), 0 0 0 1px rgba(255,107,0,0.12)" : void 0,
									transitionDelay: "400ms"
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "pointer-events-none absolute inset-0 overflow-hidden rounded-2xl lg:rounded-3xl",
										"aria-hidden": true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-y-[-30%] left-0 h-[160%] w-[50%] animate-warning-card-shimmer bg-gradient-to-r from-transparent via-white/14 to-transparent" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "pointer-events-none absolute inset-0 rounded-2xl animate-warning-card-inner-glow lg:rounded-3xl",
										"aria-hidden": true
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										"aria-hidden": true,
										className: "pointer-events-none absolute inset-x-0 top-0 h-px animate-warning-card-border-pulse bg-gradient-to-r from-transparent via-white/25 to-transparent"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										"aria-hidden": true,
										className: "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#FF6B00]/[0.12] blur-3xl animate-warning-card-outer-glow"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										"aria-hidden": true,
										className: "pointer-events-none absolute bottom-4 left-1/4 h-20 w-20 opacity-30",
										style: {
											backgroundImage: "radial-gradient(circle, rgba(255,107,0,0.5) 1px, transparent 1.5px)",
											backgroundSize: "10px 10px"
										}
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative z-10 flex flex-col gap-4 sm:gap-5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0 text-center font-[Tajawal]",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
												className: "text-[22px] font-black leading-[1.2] tracking-tight sm:text-[25px] lg:text-[27px]",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "block text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]",
													children: "تقييم دقيق، برنامج مخصص،"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "mt-0.5 block text-[#FF6B00] [text-shadow:0_1px_3px_rgba(0,0,0,0.35)]",
													children: "نتائج حقيقية."
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1.5 text-[13px] leading-relaxed text-white/80 sm:text-[14px] lg:text-[15px] [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]",
												children: "كل خطوة تقربك أكثر من أفضل نسخة من نفسك."
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3",
											children: trustFeatures.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] p-2.5 backdrop-blur-[2px] sm:gap-3 sm:p-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 shadow-[0_4px_14px_-6px_rgba(255,107,0,0.35)] ring-1 ring-[#FF6B00]/15 sm:h-10 sm:w-10",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(f.Icon, {
														className: "h-4 w-4 shrink-0 text-[#FF8A3D] sm:h-[18px] sm:w-[18px]",
														strokeWidth: 2.2
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "min-w-0 text-right",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[12px] font-extrabold text-white sm:text-[13px] [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]",
														children: f.title
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "mt-0.5 text-[10px] leading-snug text-white/75 sm:text-[11px] [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]",
														children: f.text
													})]
												})]
											}, f.title))
										})]
									})
								]
							})
						]
					})
				]
			})
		]
	});
}
function useInView$2(threshold = .1) {
	const ref = (0, import_react.useRef)(null);
	const [inView, setInView] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el || inView) return;
		const io = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting) {
				setInView(true);
				io.disconnect();
			}
		}, { threshold });
		io.observe(el);
		return () => io.disconnect();
	}, [inView, threshold]);
	return {
		ref,
		inView
	};
}
var FEATURES = [
	{
		num: "01",
		icon: Dumbbell,
		title: "خطة تدريب مخصصة",
		desc: "برنامج تدريبي مصمم خصيصاً لهدفك، مستواك، ووقتك المتاح مع شرح تفصيلي لكل تمرين."
	},
	{
		num: "02",
		icon: Salad,
		title: "خطة تغذية مرنة",
		desc: "خطة غذائية تناسب نمط حياتك وتفضيلاتك الغذائية مع خيارات متنوعة وسهلة التحضير."
	},
	{
		num: "03",
		icon: ChartColumn,
		title: "متابعة وتقييم النتائج",
		desc: "متابعة دورية لقياس تقدمك وتحليل النتائج مع تقارير واضحة لضمان الوصول لهدفك."
	},
	{
		num: "04",
		icon: MessageSquare,
		title: "دعم مباشر",
		desc: "دعم مباشر من فريق متخصص للرد على استفساراتك ومساعدتك في أي وقت تحتاجه."
	},
	{
		num: "05",
		icon: RefreshCw,
		title: "تعديل الخطة باستمرار",
		desc: "نقوم بتعديل خطتك بشكل مستمر حسب تقدمك لضمان أفضل النتائج."
	},
	{
		num: "06",
		icon: Target,
		title: "استراتيجية واضحة لتحقيق هدفك",
		desc: "خطة واضحة خطوة بخطوة مع أهداف قصيرة وطويلة المدى لتحقيق أفضل النتائج."
	}
];
var ORBIT_POSITIONS = [
	{
		x: 50,
		y: 7
	},
	{
		x: 88,
		y: 26
	},
	{
		x: 88,
		y: 74
	},
	{
		x: 50,
		y: 93
	},
	{
		x: 12,
		y: 74
	},
	{
		x: 12,
		y: 26
	}
];
function FeatureOrbitCard({ feature, index, active }) {
	const Icon = feature.icon;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
		className: `group relative w-[168px] transition-all duration-700 ease-out sm:w-[180px] ${active ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"}`,
		style: { transitionDelay: `${index * 110}ms` },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-3.5 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.12)] ring-1 ring-neutral-100/80 backdrop-blur-sm transition-[transform,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-[0_16px_40px_-12px_rgba(249,115,22,0.28)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				"aria-hidden": true,
				className: "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-200/80 to-transparent"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-row-reverse items-start gap-3 text-right",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative shrink-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": true,
						className: "absolute inset-0 rounded-xl bg-[#FF6B00]/30 blur-md opacity-0 transition-opacity duration-500 group-hover:opacity-100"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-b from-[#FFF6EE] to-white shadow-[inset_0_1px_0_rgba(255,255,255,1),0_8px_20px_-10px_rgba(249,115,22,0.3)] ring-1 ring-orange-100/80 transition-transform duration-500 group-hover:scale-105",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
							className: "h-5 w-5 text-[#FF6B00]",
							strokeWidth: 2.1
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] font-black tracking-wide text-primary/70",
							children: feature.num
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-0.5 text-[13px] font-extrabold leading-snug text-neutral-900",
							children: feature.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1.5 text-[11px] leading-relaxed text-neutral-500 line-clamp-3",
							children: feature.desc
						})
					]
				})]
			})]
		})
	});
}
function FeatureSnapCard({ feature, index, active, highlighted }) {
	const Icon = feature.icon;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
		className: [
			"group relative w-[min(88vw,300px)] shrink-0 snap-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
			active ? "translate-y-0" : "translate-y-6",
			highlighted ? "scale-100 opacity-100 z-[2]" : "scale-[0.92] opacity-65"
		].join(" "),
		style: { transitionDelay: active ? `${index * 90}ms` : "0ms" },
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: ["relative overflow-hidden rounded-[24px] border bg-gradient-to-br from-white via-white to-[#FFF8F2] p-5 ring-1 transition-all duration-500 ease-out", highlighted ? "border-[#FF6B00]/35 shadow-[0_16px_44px_-14px_rgba(255,107,0,0.35)] ring-[#FF6B00]/25" : "border-white/80 shadow-[0_10px_36px_-14px_rgba(15,23,42,0.12)] ring-neutral-100/70"].join(" "),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				"aria-hidden": true,
				className: ["pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#FF6B00]/10 blur-2xl transition-opacity duration-500", highlighted ? "opacity-100" : "opacity-40"].join(" ")
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex flex-row-reverse items-center gap-4 text-right",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative shrink-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": true,
							className: ["absolute inset-0 rounded-2xl bg-[#FF6B00]/25 blur-lg transition-opacity duration-500", highlighted ? "opacity-100 animate-feature-icon-glow" : "opacity-0"].join(" ")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: ["relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#FFF6EE] via-white to-orange-50/80 text-[#FF6B00] ring-1 transition-transform duration-500", highlighted ? "scale-105 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_16px_32px_-8px_rgba(255,107,0,0.45)] ring-[#FF6B00]/30" : "shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_12px_28px_-8px_rgba(255,107,0,0.35)] ring-[#FF6B00]/15"].join(" "),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								className: "h-7 w-7",
								strokeWidth: 2.1
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: ["absolute -bottom-1 -left-1 grid h-6 w-6 place-items-center rounded-full bg-[#FF6B00] text-[10px] font-black text-white transition-transform duration-500", highlighted ? "scale-110 shadow-[0_6px_16px_-4px_rgba(255,107,0,0.65)]" : "shadow-[0_4px_12px_-4px_rgba(255,107,0,0.55)]"].join(" "),
							children: feature.num
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: ["text-base font-extrabold leading-snug transition-colors duration-500", highlighted ? "text-neutral-900" : "text-neutral-700"].join(" "),
						children: feature.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm leading-relaxed text-neutral-500",
						children: feature.desc
					})]
				})]
			})]
		})
	});
}
var SNAP_AUTO_MS = 3200;
var SNAP_USER_PAUSE_MS = 12e3;
function FeatureSnapRail({ active }) {
	const railRef = (0, import_react.useRef)(null);
	const [activeIndex, setActiveIndex] = (0, import_react.useState)(0);
	const autoScrollRef = (0, import_react.useRef)(false);
	const pauseUntilRef = (0, import_react.useRef)(0);
	const pauseAuto = () => {
		pauseUntilRef.current = Date.now() + SNAP_USER_PAUSE_MS;
	};
	const scrollToCard = (index) => {
		const rail = railRef.current;
		if (!rail || index < 0 || index >= FEATURES.length) return;
		const card = rail.children[index];
		if (!card) return;
		autoScrollRef.current = true;
		const railRect = rail.getBoundingClientRect();
		const cardRect = card.getBoundingClientRect();
		const delta = cardRect.left + cardRect.width / 2 - (railRect.left + railRect.width / 2);
		rail.scrollBy({
			left: delta,
			behavior: "smooth"
		});
		window.setTimeout(() => {
			autoScrollRef.current = false;
		}, 750);
	};
	const syncActiveFromScroll = () => {
		const rail = railRef.current;
		if (!rail) return;
		const railCenter = rail.getBoundingClientRect().left + rail.clientWidth / 2;
		let closest = 0;
		let minDist = Infinity;
		for (let i = 0; i < rail.children.length; i++) {
			const rect = rail.children[i].getBoundingClientRect();
			const childCenter = rect.left + rect.width / 2;
			const dist = Math.abs(childCenter - railCenter);
			if (dist < minDist) {
				minDist = dist;
				closest = i;
			}
		}
		setActiveIndex(closest);
	};
	(0, import_react.useEffect)(() => {
		if (!active) return;
		const startTimer = window.setTimeout(() => scrollToCard(0), 400);
		const interval = window.setInterval(() => {
			if (Date.now() < pauseUntilRef.current) return;
			setActiveIndex((prev) => {
				const next = (prev + 1) % FEATURES.length;
				scrollToCard(next);
				return next;
			});
		}, SNAP_AUTO_MS);
		return () => {
			window.clearTimeout(startTimer);
			window.clearInterval(interval);
		};
	}, [active]);
	(0, import_react.useEffect)(() => {
		const rail = railRef.current;
		if (!rail) return;
		const onScroll = () => {
			syncActiveFromScroll();
			if (!autoScrollRef.current) pauseAuto();
		};
		const onUserIntent = () => pauseAuto();
		rail.addEventListener("scroll", onScroll, { passive: true });
		rail.addEventListener("pointerdown", onUserIntent);
		rail.addEventListener("touchstart", onUserIntent, { passive: true });
		rail.addEventListener("wheel", onUserIntent, { passive: true });
		return () => {
			rail.removeEventListener("scroll", onScroll);
			rail.removeEventListener("pointerdown", onUserIntent);
			rail.removeEventListener("touchstart", onUserIntent);
			rail.removeEventListener("wheel", onUserIntent);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative xl:hidden",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white via-white/80 to-transparent sm:w-12"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white via-white/80 to-transparent sm:w-12"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: railRef,
				className: [
					"flex gap-4 overflow-x-auto scroll-smooth pb-3 snap-x snap-mandatory",
					"[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
					"-mx-4 px-4 sm:-mx-6 sm:px-6"
				].join(" "),
				children: FEATURES.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeatureSnapCard, {
					feature: f,
					index: i,
					active,
					highlighted: i === activeIndex
				}, f.num))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 flex items-center justify-center gap-2",
				"aria-hidden": true,
				children: FEATURES.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": `البطاقة ${i + 1}`,
					onClick: () => {
						pauseAuto();
						setActiveIndex(i);
						scrollToCard(i);
					},
					className: ["rounded-full transition-all duration-500 ease-out", i === activeIndex ? "h-2.5 w-7 bg-[#FF6B00] shadow-[0_0_12px_rgba(255,107,0,0.45)]" : "h-2.5 w-2.5 bg-neutral-300/80 hover:bg-primary/40"].join(" ")
				}, f.num))
			})
		]
	});
}
function FeatureOrbitLayout({ active }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative mx-auto hidden min-h-[620px] max-w-[920px] xl:block",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 100 100",
				className: "pointer-events-none absolute inset-0 h-full w-full",
				"aria-hidden": true,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "50",
					cy: "50",
					r: "38",
					fill: "none",
					stroke: "rgba(249,115,22,0.18)",
					strokeWidth: "0.35",
					strokeDasharray: "2 2.5"
				}), ORBIT_POSITIONS.map((pos, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: "50",
					y1: "50",
					x2: pos.x,
					y2: pos.y,
					stroke: "rgba(249,115,22,0.12)",
					strokeWidth: "0.25",
					strokeDasharray: "1.2 1.8"
				}, FEATURES[i].num))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF6B00]/10 blur-3xl animate-warning-card-outer-glow"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `relative grid h-[88px] w-[88px] place-items-center rounded-2xl text-white shadow-[0_12px_32px_-8px_rgba(255,107,0,0.55)] ring-4 ring-white transition-all duration-700 ${active ? "scale-100 opacity-100" : "scale-90 opacity-0"}`,
					style: { backgroundImage: "linear-gradient(135deg, #ff8a3d 0%, #f97316 58%, #ea580c 100%)" },
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-center font-[Tajawal]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Target, {
								className: "mx-auto h-7 w-7",
								strokeWidth: 2.2
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-1 block text-[11px] font-black leading-tight",
								children: "6 ميزات"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-[9px] font-bold opacity-90",
								children: "متكاملة"
							})
						]
					})
				})
			}),
			FEATURES.map((f, i) => {
				const pos = ORBIT_POSITIONS[i];
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute z-10 -translate-x-1/2 -translate-y-1/2",
					style: {
						left: `${pos.x}%`,
						top: `${pos.y}%`
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": true,
						className: "absolute left-1/2 top-1/2 z-0 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF6B00] ring-4 ring-[#FF6B00]/20 shadow-[0_0_12px_rgba(255,107,0,0.45)]"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative z-10",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeatureOrbitCard, {
							feature: f,
							index: i,
							active
						})
					})]
				}, f.num);
			})
		]
	});
}
function WhatYouGet() {
	const head = useInView$2(.1);
	const cards = useInView$2(.1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "features",
		dir: "rtl",
		className: "relative w-full overflow-hidden bg-white py-16 md:py-24 font-[Tajawal,Cairo,sans-serif]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute right-6 top-28 hidden lg:grid grid-cols-6 gap-2 opacity-40",
				children: Array.from({ length: 36 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-orange-300" }, `r-${i}`))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute left-6 top-28 hidden lg:grid grid-cols-6 gap-2 opacity-40",
				children: Array.from({ length: 36 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-orange-300" }, `l-${i}`))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					ref: head.ref,
					className: `text-center -mt-[60px] transition-all duration-700 ease-out ${head.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: "-mt-[30px] text-center font-[Tajawal] text-[26px] font-extrabold leading-[1.12] tracking-tight text-foreground lg:origin-top lg:-mt-[20px] lg:text-[78px] lg:font-black lg:leading-[1.08] lg:scale-[0.926]",
							children: [
								"ماذا ستحصل عليه",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "inline-block translate-y-[2px] text-primary",
									children: "داخل برنامجك؟"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							"aria-hidden": true,
							className: "relative mx-auto mt-[5px] h-[2px] w-full max-w-xs overflow-hidden sm:max-w-sm lg:max-w-md",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full w-full bg-gradient-to-l from-[#FF6B00]/30 via-[#FF6B00]/12 to-transparent" }), head.inView && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "pointer-events-none absolute inset-y-0 right-0 w-1/4 animate-title-line-shimmer-pingpong bg-gradient-to-l from-transparent via-[#FF6B00]/55 to-transparent" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-base md:text-lg text-neutral-500 leading-relaxed max-w-2xl mx-auto",
							children: "كل ما تحتاجه للوصول إلى هدفك في مكان واحد."
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					ref: cards.ref,
					className: "mt-12 md:mt-16",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeatureOrbitLayout, { active: cards.inView }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeatureSnapRail, { active: cards.inView })]
				})]
			})
		]
	});
}
var خالد_قبل_default = "/assets/%D8%AE%D8%A7%D9%84%D8%AF%20%D9%82%D8%A8%D9%84-C3jVVYk2.jpg";
var خالد_بعد_default = "/assets/%D8%AE%D8%A7%D9%84%D8%AF%20%D8%A8%D8%B9%D8%AF-B1kyx0ri.jpg";
var سمير_قبل_default = "/assets/%D8%B3%D9%85%D9%8A%D8%B1%20%D9%82%D8%A8%D9%84-rYzageLc.jpg";
var سمير_بعد_default = "/assets/%D8%B3%D9%85%D9%8A%D8%B1%20%D8%A8%D8%B9%D8%AF-DmUEsjYc.jpg";
var بو_خالد_قبل_default = "/assets/%D8%A8%D9%88%20%D8%AE%D8%A7%D9%84%D8%AF%20%D9%82%D8%A8%D9%84-Cgl9-3pJ.jpg";
var بو_خالد_بعد_default = "/assets/%D8%A8%D9%88%20%D8%AE%D8%A7%D9%84%D8%AF%20%D8%A8%D8%B9%D8%AF-DPGSVA9C.jpg";
var بيدرو_قبل_default = "/assets/%D8%A8%D9%8A%D8%AF%D8%B1%D9%88%20%D9%82%D8%A8%D9%84-BvQCH57q.jpg";
var بيدرو_بعد_default = "/assets/%D8%A8%D9%8A%D8%AF%D8%B1%D9%88%20%D8%A8%D8%B9%D8%AF-CVVkRZa1.jpg";
var انوار_قبل_default = "/assets/%D8%A7%D9%86%D9%88%D8%A7%D8%B1%20%D9%82%D8%A8%D9%84-DlRq_daR.jpg";
var انوار_بعد_default = "/assets/%D8%A7%D9%86%D9%88%D8%A7%D8%B1%20%D8%A8%D8%B9%D8%AF-A6ujCa3Z.jpg";
var ناصر_قبل_default = "/assets/%D9%86%D8%A7%D8%B5%D8%B1%20%D9%82%D8%A8%D9%84-C-YdqJbx.jpg";
var ناصر_بعد_default = "/assets/%D9%86%D8%A7%D8%B5%D8%B1%20%D8%A8%D8%B9%D8%AF-DbEwEE8h.jpg";
var جوليا_قبل_default = "/assets/%D8%AC%D9%88%D9%84%D9%8A%D8%A7%20%D9%82%D8%A8%D9%84-B7I80Mw6.jpg";
var جوليا_بعد_default = "/assets/%D8%AC%D9%88%D9%84%D9%8A%D8%A7%20%D8%A8%D8%B9%D8%AF-5ANl4xOr.jpg";
var ياسمين_قبل_default = "/assets/%D9%8A%D8%A7%D8%B3%D9%85%D9%8A%D9%86%20%D9%82%D8%A8%D9%84-BTEXZaYk.jpg";
var ياسمين_بعد_default = "/assets/%D9%8A%D8%A7%D8%B3%D9%85%D9%8A%D9%86%20%D8%A8%D8%B9%D8%AF-B8fJql6b.jpg";
var فاطمة_قبل_default = "/assets/%D9%81%D8%A7%D8%B7%D9%85%D8%A9%20%D9%82%D8%A8%D9%84-DtUDNgL6.jpg";
var فاطمة_بعد_default = "/assets/%D9%81%D8%A7%D8%B7%D9%85%D8%A9%20%D8%A8%D8%B9%D8%AF-Clp8iaR4.jpg";
var سلمى_قبل_default = "/assets/%D8%B3%D9%84%D9%85%D9%89%20%D9%82%D8%A8%D9%84-yPZMEcD2.jpg";
var سلمى_بعد_default = "/assets/%D8%B3%D9%84%D9%85%D9%89%20%D8%A8%D8%B9%D8%AF-Fr8YUoky.jpg";
var مايا_قبل_default = "/assets/%D9%85%D8%A7%D9%8A%D8%A7%20%D9%82%D8%A8%D9%84-CEGh7ZaJ.jpg";
var مايا_عبد_default = "/assets/%D9%85%D8%A7%D9%8A%D8%A7%20%D8%B9%D8%A8%D8%AF-BXboAwHo.jpg";
var كوثر_قبل_default = "/assets/%D9%83%D9%88%D8%AB%D8%B1%20%D9%82%D8%A8%D9%84-DIYO-a1E.jpg";
var كوثر_بعد_default = "/assets/%D9%83%D9%88%D8%AB%D8%B1%20%D8%A8%D8%B9%D8%AF-BvbOEyF1.jpg";
var PRIMARY_STORY_SLIDES = [
	{
		name: "خالد",
		before: خالد_قبل_default,
		after: خالد_بعد_default,
		weightValue: "-16kg",
		weightLabel: "خسارة وزن",
		muscleValue: "+7kg",
		muscleLabel: "كتلة عضلية",
		durationValue: "12",
		durationLabel: "أسبوع",
		quote: "كنت أجرب أنظمة كثيرة بدون نتيجة، مع خطة حكيم المخصصة قدرت أخسر 16 كغ وأبني جسم قوي وصحي."
	},
	{
		name: "سمير",
		before: سمير_قبل_default,
		after: سمير_بعد_default,
		weightValue: "-12kg",
		weightLabel: "خسارة وزن",
		muscleValue: "+5kg",
		muscleLabel: "كتلة عضلية",
		durationValue: "10",
		durationLabel: "أسابيع",
		quote: "البرنامج كان واضحاً وسهل الالتزام. تحسّن أدائي وزادت كتلتي العضلية خلال أسابيع قليلة."
	},
	{
		name: "بو خالد",
		before: بو_خالد_قبل_default,
		after: بو_خالد_بعد_default,
		weightValue: "+6kg",
		weightLabel: "كتلة عضلية",
		muscleValue: "+6kg",
		muscleLabel: "كتلة عضلية",
		durationValue: "16",
		durationLabel: "أسبوع",
		quote: "المتابعة الأسبوعية ساعدتني أضبط الخطة. النتائج جاءت تدريجياً وبثبات دون إرهاق."
	},
	{
		name: "بيدرو",
		before: بيدرو_قبل_default,
		after: بيدرو_بعد_default,
		weightValue: "-18kg",
		weightLabel: "خسارة وزن",
		muscleValue: "+4kg",
		muscleLabel: "كتلة عضلية",
		durationValue: "14",
		durationLabel: "أسبوع",
		quote: "أخيراً خطة تغذية لا تشعرني بالحرمان. خسرت وزناً حقيقياً مع الحفاظ على طاقتي اليومية."
	},
	{
		name: "انوار",
		before: انوار_قبل_default,
		after: انوار_بعد_default,
		weightValue: "-11kg",
		weightLabel: "خسارة وزن",
		muscleValue: "+4kg",
		muscleLabel: "كتلة عضلية",
		durationValue: "8",
		durationLabel: "أسابيع",
		quote: "مع حكيم تغير كل شيء. خطة مخصصة ودعم مستمر، والنتائج فاقت توقعاتي."
	},
	{
		name: "ناصر",
		before: ناصر_قبل_default,
		after: ناصر_بعد_default,
		weightValue: "-9kg",
		weightLabel: "خسارة وزن",
		muscleValue: "جسم متناسق",
		muscleLabel: "جسم متناسق",
		durationValue: "12",
		durationLabel: "أسبوع",
		quote: "خطة مرنة تناسب عملي وحياتي. استعدت ثقتي بنفسي وشكل جسمي خلال فترة قصيرة."
	}
];
/** نسخة السلايدر السفلي — قصص نساء (منفصلة عن السلايدر العلوي) */
var CLONE_STORY_SLIDES = [
	{
		name: "جوليا",
		before: جوليا_قبل_default,
		after: جوليا_بعد_default,
		weightValue: "-14kg",
		weightLabel: "خسارة وزن",
		muscleValue: "+3kg",
		muscleLabel: "كتلة عضلية",
		durationValue: "12",
		durationLabel: "أسبوع",
		quote: "كنت أتعب من تجربة أنظمة بدون نتيجة، مع خطة حكيم المخصصة خسرت وزناً حقيقياً واستعدت نشاطي."
	},
	{
		name: "ياسمين",
		before: ياسمين_قبل_default,
		after: ياسمين_بعد_default,
		weightValue: "-10kg",
		weightLabel: "خسارة وزن",
		muscleValue: "جسم مشدود",
		muscleLabel: "جسم مشدود",
		durationValue: "10",
		durationLabel: "أسابيع",
		quote: "البرنامج كان واضحاً وسهل الالتزام. تحسّن شكل جسمي وزادت ثقتي بنفسي خلال أسابيع قليلة."
	},
	{
		name: "فاطمة",
		before: فاطمة_قبل_default,
		after: فاطمة_بعد_default,
		weightValue: "+4kg",
		weightLabel: "كتلة عضلية",
		muscleValue: "+4kg",
		muscleLabel: "كتلة عضلية",
		durationValue: "14",
		durationLabel: "أسبوع",
		quote: "المتابعة الأسبوعية ساعدتني أضبط الخطة. النتائج جاءت تدريجياً وبثبات دون إرهاق."
	},
	{
		name: "سلمى",
		before: سلمى_قبل_default,
		after: سلمى_بعد_default,
		weightValue: "-15kg",
		weightLabel: "خسارة وزن",
		muscleValue: "+2kg",
		muscleLabel: "كتلة عضلية",
		durationValue: "16",
		durationLabel: "أسبوع",
		quote: "أخيراً خطة تغذية لا تشعرني بالحرمان. خسرت وزناً حقيقياً مع الحفاظ على طاقتي اليومية."
	},
	{
		name: "مايا",
		before: مايا_قبل_default,
		after: مايا_عبد_default,
		weightValue: "-9kg",
		weightLabel: "خسارة وزن",
		muscleValue: "جسم متناسق",
		muscleLabel: "جسم متناسق",
		durationValue: "8",
		durationLabel: "أسابيع",
		quote: "مع حكيم تغير كل شيء. خطة مخصصة ودعم مستمر، والنتائج فاقت توقعاتي."
	},
	{
		name: "كوثر",
		before: كوثر_قبل_default,
		after: كوثر_بعد_default,
		weightValue: "-7kg",
		weightLabel: "خسارة وزن",
		muscleValue: "+3kg",
		muscleLabel: "كتلة عضلية",
		durationValue: "12",
		durationLabel: "أسبوع",
		quote: "خطة مرنة تناسب حياتي. استعدت ثقتي بنفسي وشكل جسمي خلال فترة قصيرة."
	}
];
function useInViewOnce(threshold = .2) {
	const ref = (0, import_react.useRef)(null);
	const [inView, setInView] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el || inView) return;
		const io = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting) {
				setInView(true);
				io.disconnect();
			}
		}, { threshold });
		io.observe(el);
		return () => io.disconnect();
	}, [inView, threshold]);
	return {
		ref,
		inView
	};
}
function renderSignedStatValue(value) {
	const signed = value.match(/^([+-])(.+)$/);
	if (!signed) return value;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex flex-row items-baseline [direction:ltr]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: signed[1] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: signed[2] })]
	});
}
function StatColumn({ icon: Icon, value, label, animateKey }) {
	const isNumericStat = /^[+-]?\d/.test(value);
	const hideLabel = label === value;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center justify-center px-1.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				className: "h-3 w-3 text-[#FF6B00]",
				strokeWidth: 2.2
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
				initial: {
					opacity: 0,
					y: 8
				},
				animate: {
					opacity: 1,
					y: 0
				},
				transition: {
					duration: .45,
					ease: [
						.22,
						1,
						.36,
						1
					]
				},
				className: ["mt-1.5 font-[Cairo] font-extrabold leading-none text-[#FF6B00]", isNumericStat ? "text-[18px]" : "text-[13px] leading-tight"].join(" "),
				children: renderSignedStatValue(value)
			}, animateKey),
			!hideLabel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-0.5 font-[Tajawal] text-[13px] text-[#666]",
				children: label
			})
		]
	});
}
function StorySlideCard({ story, isActive, surface }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `${surface === "primary" ? "success-stories-primary-card" : "success-stories-clone-card"} w-full overflow-hidden rounded-[26px] bg-white shadow-[0_14px_48px_rgba(15,23,42,0.08)]`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
				className: "relative flex h-[310px] w-full overflow-hidden bg-neutral-100",
				animate: { scale: isActive ? 1 : .98 },
				transition: {
					duration: .55,
					ease: [
						.22,
						1,
						.36,
						1
					]
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative w-1/2 overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: story.before,
							alt: "",
							loading: "lazy",
							className: "h-full w-full object-cover object-top"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute left-3 top-3 grid h-[38px] w-[48px] place-items-center rounded-[10px] bg-[#111] text-[13px] font-bold text-white",
							children: "قبل"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative w-1/2 overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: story.after,
							alt: "",
							loading: "lazy",
							className: "h-full w-full object-cover object-top"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute right-3 top-3 grid h-[38px] w-[48px] place-items-center rounded-[10px] bg-[#FF6B00] text-[13px] font-bold text-white",
							children: "بعد"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute left-1/2 top-1/2 z-10 grid h-[46px] w-[46px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white shadow-[0_6px_20px_rgba(0,0,0,0.12)]",
						"aria-hidden": true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronsLeft, {
							className: "h-5 w-5 text-[#FF6B00]",
							strokeWidth: 2.5
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid h-[75px] grid-cols-3 divide-x divide-[#EFE5DD]/80 bg-white",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatColumn, {
						icon: Scale,
						value: story.weightValue,
						label: story.weightLabel,
						animateKey: `${surface}-${story.name}-w-${isActive}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatColumn, {
						icon: Dumbbell,
						value: story.muscleValue,
						label: story.muscleLabel,
						animateKey: `${surface}-${story.name}-m-${isActive}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatColumn, {
						icon: Calendar,
						value: story.durationValue,
						label: story.durationLabel,
						animateKey: `${surface}-${story.name}-d-${isActive}`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-4 pb-4 pt-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-[24px] bg-white/85 px-4 py-4 shadow-[0_8px_28px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.03]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-center font-[Cairo] text-[32px] leading-none text-[#FF6B00]/35",
							"aria-hidden": true,
							children: "“"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-center font-[Tajawal] text-[15px] leading-[1.65] text-[#111]",
							children: surface === "primary" && story.name === "خالد" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								"كنت أجرب أنظمة كثيرة بدون نتيجة،",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								"مع خطة حكيم المخصصة قدرت أخسر 16 كغ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								"وأبني جسم قوي وصحي."
							] }) : story.quote
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
							initial: "hidden",
							animate: isActive ? "visible" : "hidden",
							variants: {
								hidden: {},
								visible: { transition: { staggerChildren: .06 } }
							},
							className: "mt-2.5 flex justify-center gap-1",
							children: Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.span, {
								variants: {
									hidden: {
										opacity: 0,
										scale: .6
									},
									visible: {
										opacity: 1,
										scale: 1
									}
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
									className: "h-[18px] w-[18px] fill-[#FF6B00] text-[#FF6B00]",
									strokeWidth: 0
								})
							}, i))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3.5 text-center font-[Cairo] text-[18px] font-extrabold text-[#111]",
							children: story.name
						})
					]
				})
			})
		]
	});
}
function StoriesPrimarySlider() {
	const swiperRef = (0, import_react.useRef)(null);
	const [activeIndex, setActiveIndex] = (0, import_react.useState)(0);
	const [autoplayEnabled, setAutoplayEnabled] = (0, import_react.useState)(true);
	const stopAutoplay = () => {
		if (!autoplayEnabled) return;
		setAutoplayEnabled(false);
		swiperRef.current?.autoplay?.stop();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "success-stories-primary-slider-wrap relative mx-auto mt-6 w-[calc(100%-24px)] max-w-[388px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Swiper, {
			modules: [Autoplay],
			dir: "rtl",
			onSwiper: (swiper) => {
				swiperRef.current = swiper;
			},
			onSlideChange: (swiper) => setActiveIndex(swiper.realIndex),
			onTouchStart: stopAutoplay,
			onSliderMove: stopAutoplay,
			loop: true,
			speed: 680,
			spaceBetween: 0,
			slidesPerView: 1,
			autoplay: autoplayEnabled ? {
				delay: 2e3,
				disableOnInteraction: true
			} : false,
			className: "success-stories-primary-swiper overflow-hidden rounded-[26px]",
			children: PRIMARY_STORY_SLIDES.map((story) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwiperSlide, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StorySlideCard, {
				story,
				surface: "primary",
				isActive: story.name === PRIMARY_STORY_SLIDES[activeIndex].name
			}) }, `primary-${story.name}`))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "success-stories-primary-pagination absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/20 px-2 py-1 backdrop-blur-[2px]",
			children: PRIMARY_STORY_SLIDES.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": `الشريحة ${i + 1}`,
				onClick: () => {
					stopAutoplay();
					swiperRef.current?.slideToLoop(i);
				},
				className: ["success-stories-primary-pagination-dot rounded-full transition-all duration-300", i === activeIndex ? "h-1.5 w-4 bg-[#FF6B00]" : "h-1.5 w-1.5 bg-white/55"].join(" ")
			}, i))
		})]
	});
}
function StoriesCloneSlider() {
	const swiperRef = (0, import_react.useRef)(null);
	const [activeIndex, setActiveIndex] = (0, import_react.useState)(0);
	const [autoplayEnabled, setAutoplayEnabled] = (0, import_react.useState)(true);
	const stopAutoplay = () => {
		if (!autoplayEnabled) return;
		setAutoplayEnabled(false);
		swiperRef.current?.autoplay?.stop();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "success-stories-clone-slider-wrap relative mx-auto mt-[30px] w-[calc(100%-24px)] max-w-[388px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Swiper, {
			modules: [Autoplay],
			dir: "ltr",
			onSwiper: (swiper) => {
				swiperRef.current = swiper;
			},
			onSlideChange: (swiper) => setActiveIndex(swiper.realIndex),
			onTouchStart: stopAutoplay,
			onSliderMove: stopAutoplay,
			loop: true,
			speed: 680,
			spaceBetween: 0,
			slidesPerView: 1,
			autoplay: autoplayEnabled ? {
				delay: 2e3,
				disableOnInteraction: true
			} : false,
			className: "success-stories-clone-swiper overflow-hidden rounded-[26px]",
			children: CLONE_STORY_SLIDES.map((story) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwiperSlide, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StorySlideCard, {
				story,
				surface: "clone",
				isActive: story.name === CLONE_STORY_SLIDES[activeIndex].name
			}) }, `clone-${story.name}`))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "success-stories-clone-pagination absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/20 px-2 py-1 backdrop-blur-[2px]",
			children: CLONE_STORY_SLIDES.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": `الشريحة ${i + 1}`,
				onClick: () => {
					stopAutoplay();
					swiperRef.current?.slideToLoop(i);
				},
				className: ["success-stories-clone-pagination-dot rounded-full transition-all duration-300", i === activeIndex ? "h-1.5 w-4 bg-[#FF6B00]" : "h-1.5 w-1.5 bg-white/55"].join(" ")
			}, i))
		})]
	});
}
function StoriesCloneCTA() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "success-stories-clone-cta mx-auto mt-[22px] w-[calc(100%-36px)] max-w-[360px] rounded-[28px] bg-[#FF6B00]/[0.06] px-3.5 py-[18px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 flex items-center justify-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, {
				className: "h-5 w-5 text-[#FF6B00]",
				strokeWidth: 2.2
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center font-[Tajawal] text-[18px] font-bold text-[#111]",
				children: "أنت يمكن أن تكون العميل القادم!"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/quiz",
			className: "relative flex h-[72px] w-full items-center overflow-hidden rounded-[36px] cta-gradient px-2 shadow-cta [direction:ltr] animate-cta-premium-pulse [animation-duration:4s]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "pointer-events-none absolute inset-0 overflow-hidden rounded-[36px]",
					"aria-hidden": true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-y-[-20%] left-0 h-[140%] w-[45%] animate-cta-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "relative z-10 ml-2 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
						className: "h-5 w-5 text-primary",
						strokeWidth: 2.5
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "relative z-10 flex-1 text-center font-[Tajawal] text-white",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-[15px] font-extrabold leading-tight",
						children: "ابدأ رحلتك الآن"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-0.5 block text-[11px] font-medium text-white/90",
						children: "خطوتك الأولى نحو أفضل نسخة منك"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "relative z-10 w-12 shrink-0",
					"aria-hidden": true
				})
			]
		})]
	});
}
function StoriesPrimaryBadge({ inView }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "success-stories-primary-badge flex items-center justify-center gap-2.5 transition-all duration-700",
		style: {
			opacity: inView ? 1 : 0,
			transform: inView ? "translateY(0) scale(1)" : "translateY(16px) scale(0.96)"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				"aria-hidden": true,
				className: "h-px w-7 bg-gradient-to-l from-[#FF6B00]/50 via-[#FF6B00]/18 to-transparent"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					"aria-hidden": true,
					className: "pointer-events-none absolute -inset-1 rounded-full bg-[#FF6B00]/18 blur-md"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "relative inline-flex min-h-[29px] min-w-[175px] items-center justify-center gap-1 rounded-full bg-gradient-to-br from-[#FF6B00]/14 via-white to-[#FF6B00]/10 px-3 py-1 shadow-[0_10px_30px_-12px_rgba(255,107,0,0.45)] ring-1 ring-[#FF6B00]/25 transition-all duration-700 [direction:ltr]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "pointer-events-none absolute inset-0 overflow-hidden rounded-full",
							"aria-hidden": true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -inset-y-2 -left-1/2 h-[200%] w-[55%] animate-cta-shimmer bg-gradient-to-r from-transparent via-white/55 to-transparent" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "relative z-10 grid h-[21px] w-[21px] shrink-0 place-items-center rounded-full bg-white shadow-[0_3px_10px_rgba(255,107,0,0.24)] ring-1 ring-[#FF6B00]/20",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								"aria-hidden": true,
								className: "absolute inset-[0.5px] rounded-full bg-[#FF6B00]/18 animate-pulse-soft"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
								className: "relative z-10 h-3 w-3 fill-[#FF6B00] text-[#FF6B00]",
								strokeWidth: 0
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "relative z-10 font-[Tajawal] text-[12px] font-extrabold tracking-[0.02em] text-[#FF6B00] [direction:rtl]",
							children: "قصص نجاح عملائنا"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				"aria-hidden": true,
				className: "h-px w-7 bg-gradient-to-r from-[#FF6B00]/50 via-[#FF6B00]/18 to-transparent"
			})
		]
	});
}
function StoriesPrimaryScreen() {
	const { ref, inView } = useInViewOnce(.12);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref,
		className: "success-stories-primary-screen relative mx-auto max-w-[430px] px-[18px] pb-0 pt-7",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "success-stories-primary-header text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoriesPrimaryBadge, { inView }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "success-stories-primary-title-wrap transition-all duration-700",
					style: {
						opacity: inView ? 1 : 0,
						transform: inView ? "translateY(0)" : "translateY(16px)",
						transitionDelay: "120ms"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "success-stories-primary-title origin-top mt-[22px] font-[Tajawal] text-[clamp(14px,6vw,20px)] font-black leading-[1.25] tracking-tight scale-[0.853] transition-all duration-700",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "success-stories-primary-title-line text-[#111]",
								children: "نتائج حقيقية"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "success-stories-primary-title-highlight text-[#FF6B00]",
								children: "من أشخاص كانوا مثلك تماماً"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						"aria-hidden": true,
						className: "success-stories-primary-title-line-wrap relative mx-auto mt-[5px] h-[2px] w-full max-w-xs overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "success-stories-primary-title-line-base h-full w-full bg-gradient-to-l from-[#FF6B00]/30 via-[#FF6B00]/12 to-transparent" }), inView && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "success-stories-primary-title-line-shimmer pointer-events-none absolute inset-y-0 right-0 w-1/4 animate-title-line-shimmer-pingpong bg-gradient-to-l from-transparent via-[#FF6B00]/55 to-transparent" })]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "success-stories-primary-subtitle mx-auto mt-3.5 max-w-[330px] font-[Tajawal] text-[13px] leading-[1.7] text-[#666] transition-all duration-700",
					style: {
						opacity: inView ? 1 : 0,
						transform: inView ? "translateY(0)" : "translateY(16px)",
						transitionDelay: "240ms"
					},
					children: [
						"أكثر من 10,000 عميل حول العالم",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						"غيروا حياتهم مع حكيم ."
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoriesPrimarySlider, {})]
	});
}
function StoriesCloneScreen() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "success-stories-clone-screen relative mx-auto max-w-[430px] px-[18px] pb-6 pt-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoriesCloneSlider, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoriesCloneCTA, {})]
	});
}
function SuccessStories() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "stories",
		dir: "rtl",
		className: "relative w-full overflow-x-hidden bg-[#FAF8F5] font-[Tajawal,Cairo,sans-serif] lg:hidden",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute -left-16 top-16 h-48 w-48 rounded-full bg-[#FF6B00]/10 blur-3xl"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute -right-10 top-[40%] h-40 w-40 rounded-full bg-beige blur-2xl"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoriesPrimaryScreen, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoriesCloneScreen, {})
		]
	});
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var Dialog = Dialog$1;
var DialogPortal = DialogPortal$1;
var DialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
	ref,
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props
}));
DialogOverlay.displayName = DialogOverlay$1.displayName;
var DialogContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	})]
})] }));
DialogContent.displayName = DialogContent$1.displayName;
var DialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className),
	...props
});
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
DialogFooter.displayName = "DialogFooter";
var DialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
	ref,
	className: cn("text-lg font-semibold leading-none tracking-tight", className),
	...props
}));
DialogTitle.displayName = DialogTitle$1.displayName;
var DialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
DialogDescription.displayName = DialogDescription$1.displayName;
function useInView$1(threshold = .12) {
	const ref = (0, import_react.useRef)(null);
	const [inView, setInView] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el || inView) return;
		const io = new IntersectionObserver(([e]) => {
			if (e.isIntersecting) {
				setInView(true);
				io.disconnect();
			}
		}, { threshold });
		io.observe(el);
		return () => io.disconnect();
	}, [inView, threshold]);
	return {
		ref,
		inView
	};
}
var FAQS = [
	{
		q: "كيف يعمل برنامج التدريب الأونلاين؟",
		a: "تبدأ بتقييم شامل لحالتك وأهدافك، ثم نصمم لك خطة تدريب وغذاء مخصصة بالكامل تصلك عبر التطبيق مع متابعة دورية من المدرب."
	},
	{
		q: "هل أحتاج إلى معدات رياضية خاصة؟",
		a: "لا، يمكننا تصميم برنامجك ليناسب المعدات المتوفرة لديك سواء كنت في النادي أو في المنزل بأبسط الأدوات."
	},
	{
		q: "كيف يتم تصميم خطة التغذية؟",
		a: "نأخذ في الاعتبار تفضيلاتك الغذائية، نمط حياتك، وأهدافك لنصمم خطة مرنة وسهلة الالتزام بها على المدى الطويل."
	},
	{
		q: "كم مرة سيتم متابعة تقدمي؟",
		a: "نتابع تقدمك أسبوعياً ونعدل الخطة عند الحاجة، مع إمكانية التواصل المباشر مع المدرب طوال أيام الأسبوع."
	},
	{
		q: "ماذا لو لم أحقق النتائج المتوقعة؟",
		a: "نلتزم بالعمل معك حتى تحقق هدفك. نراجع خطتك باستمرار ونعدلها لضمان وصولك إلى النتائج المرجوة."
	},
	{
		q: "هل يمكنني تغيير خطتي أثناء البرنامج؟",
		a: "بالتأكيد. الخطة مرنة وقابلة للتعديل حسب تطورك واحتياجاتك وأي ظروف جديدة قد تطرأ خلال رحلتك."
	},
	{
		q: "هل البرنامج مناسب للمبتدئين؟",
		a: "نعم، نصمم البرنامج بناءً على مستواك الحالي ونتدرج معك خطوة بخطوة لضمان الأمان والاستمرارية."
	},
	{
		q: "كيف يمكنني التواصل مع المدرب؟",
		a: "يمكنك التواصل مع المدرب مباشرة عبر التطبيق أو واتساب طوال أيام الأسبوع للحصول على دعم سريع."
	}
];
function FaqItem({ item, index, onOpen }) {
	const { ref, inView } = useInView$1();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		ref,
		type: "button",
		onClick: onOpen,
		className: `flex w-full items-center justify-between gap-4 overflow-hidden rounded-[20px] bg-white px-5 py-5 text-right ring-1 ring-neutral-100 shadow-[0_4px_14px_rgba(0,0,0,0.04)] transition-all duration-500 ease-out hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:ring-orange-100 md:px-6 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`,
		style: { transitionDelay: `${index * 60}ms` },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-500",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
				className: "h-5 w-5",
				strokeWidth: 2.4
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "flex-1 text-right text-sm font-bold text-neutral-900 md:text-base",
			children: item.q
		})]
	});
}
function FAQ() {
	const head = useInView$1();
	const [activeFaqIdx, setActiveFaqIdx] = (0, import_react.useState)(null);
	const activeFaq = activeFaqIdx !== null ? FAQS[activeFaqIdx] : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "faq",
		dir: "rtl",
		className: "relative w-full overflow-hidden bg-white py-20 md:py-28 font-[Tajawal,Cairo,sans-serif]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute left-6 top-32 hidden md:grid grid-cols-5 gap-2 opacity-40",
				children: Array.from({ length: 25 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-orange-300" }, i))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute right-6 top-32 hidden md:grid grid-cols-5 gap-2 opacity-40",
				children: Array.from({ length: 25 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-orange-300" }, i))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-7xl px-5 md:px-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						ref: head.ref,
						className: `text-center transition-all duration-700 ease-out ${head.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-orange-600",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4" }), "إجابات على أكثر الأسئلة شيوعاً"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "-mt-[30px] text-center font-[Tajawal] text-[26px] font-extrabold leading-[1.12] tracking-tight text-foreground lg:origin-top lg:-mt-[20px] lg:text-[78px] lg:font-black lg:leading-[1.08] lg:scale-[0.926]",
								children: [
									"الأسئلة",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "inline-block translate-y-[2px] text-primary",
										children: "الشائعة"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mx-auto mt-6 max-w-2xl text-base md:text-lg text-neutral-500 leading-loose",
								children: "كل ما تحتاج معرفته قبل البدء في برنامجك التدريبي والغذائي."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mx-auto mt-14 md:mt-16 max-w-3xl space-y-3",
						children: FAQS.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FaqItem, {
							item,
							index: i,
							onOpen: () => setActiveFaqIdx(i)
						}, item.q))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
						open: activeFaqIdx !== null,
						onOpenChange: (open) => {
							if (!open) setActiveFaqIdx(null);
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
							dir: "rtl",
							className: "max-w-md gap-0 overflow-hidden rounded-[24px] border-orange-100 p-0 sm:max-w-lg [&>button]:left-4 [&>button]:right-auto",
							children: activeFaq && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-1.5 w-full bg-gradient-to-l from-orange-500 to-orange-400" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, {
									className: "space-y-3 px-6 pb-2 pt-6 text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
										className: "text-lg font-black leading-snug text-neutral-900 md:text-xl",
										children: activeFaq.q
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
									asChild: true,
									className: "px-6 pb-6 text-right text-sm leading-loose text-neutral-600 md:text-base",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: activeFaq.a })
								})
							] })
						})
					})
				]
			})
		]
	});
}
var هل_انت_جاهز_default = "/assets/%D9%87%D9%84%20%D8%A7%D9%86%D8%AA%20%D8%AC%D8%A7%D9%87%D8%B2-CiTY6RRO.png";
function useInView(threshold = .15) {
	const ref = (0, import_react.useRef)(null);
	const [inView, setInView] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el || inView) return;
		const io = new IntersectionObserver(([e]) => {
			if (e.isIntersecting) {
				setInView(true);
				io.disconnect();
			}
		}, { threshold });
		io.observe(el);
		return () => io.disconnect();
	}, [inView, threshold]);
	return {
		ref,
		inView
	};
}
function useCount(target, active, duration = 1600) {
	const [v, setV] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		if (!active) return;
		let raf = 0;
		const start = performance.now();
		const tick = (now) => {
			const t = Math.min(1, (now - start) / duration);
			const eased = 1 - Math.pow(1 - t, 3);
			setV(Math.round(eased * target));
			if (t < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [
		active,
		target,
		duration
	]);
	return v;
}
var TRUST_STRIP = [
	{
		Icon: ShieldCheck,
		title: "آمن وموثوق",
		desc: "بياناتك محفية 100%"
	},
	{
		Icon: Headphones,
		title: "دعم مستمر",
		desc: "فريق الدعم معك طوال رحلتك"
	},
	{
		Icon: Trophy,
		title: "نتائج حقيقية",
		desc: "برامج مثبتة ونتائج مضمونة"
	},
	{
		Icon: Target,
		title: "خطط مخصصة",
		desc: "كل برنامج مصمم خصيصاً لك"
	}
];
var CARD_SHADOW = "0 10px 40px rgba(0,0,0,0.08)";
function ProgressCard({ progress, dash, circumference }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "cta-float w-[123px] rounded-2xl bg-white p-3 sm:w-[143px]",
		style: {
			borderRadius: 24,
			boxShadow: CARD_SHADOW,
			animationDelay: "0s"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-2 text-right text-sm font-bold text-[#111827]",
				children: "تقدمك"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mx-auto h-[86px] w-[86px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
					width: "86",
					height: "86",
					viewBox: "0 0 86 86",
					className: "-rotate-90",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "43",
						cy: "43",
						r: "38",
						stroke: "#FFF7ED",
						strokeWidth: "8",
						fill: "none"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "43",
						cy: "43",
						r: "38",
						stroke: "#F97316",
						strokeWidth: "8",
						fill: "none",
						strokeLinecap: "round",
						strokeDasharray: `${dash} ${circumference}`,
						style: { transition: "stroke-dasharray 1.5s ease-out" }
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute inset-0 flex items-center justify-center text-base font-black text-[#111827]",
					children: [progress, "%"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 text-right text-xs text-[#6B7280]",
				children: "أنت على الطريق الصحيح!"
			})
		]
	});
}
var GOAL_CYCLE_MS = 2500;
var GOAL_SLIDES = [
	{
		label: "خسارة الدهون",
		value: "-12 كغ",
		color: "#22C55E",
		Icon: TrendingDown,
		chartPoints: "0,30 20,28 40,24 60,18 80,14 100,8 120,4"
	},
	{
		label: "زيادة وزن صحي",
		value: "+8 كغ",
		color: "#F97316",
		Icon: TrendingUp,
		chartPoints: "0,8 20,12 40,16 60,20 80,24 100,28 120,32"
	},
	{
		label: "تكبير منطقة معينة",
		value: "+6 سم",
		color: "#F97316",
		Icon: TrendingUp,
		chartPoints: "0,10 20,14 40,18 60,22 80,26 100,28 120,30"
	},
	{
		label: "بناء العضلات",
		value: "+4 كغ",
		color: "#F97316",
		Icon: TrendingUp,
		chartPoints: "0,12 20,14 40,18 60,20 80,22 100,26 120,28"
	},
	{
		label: "شد وتنحيف",
		value: "-8 كغ",
		color: "#22C55E",
		Icon: TrendingDown,
		chartPoints: "0,30 20,28 40,24 60,18 80,14 100,8 120,4"
	}
];
function GoalCard() {
	const [index, setIndex] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		const interval = window.setInterval(() => {
			setIndex((i) => (i + 1) % GOAL_SLIDES.length);
		}, GOAL_CYCLE_MS);
		return () => clearInterval(interval);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "cta-float w-[123px] rounded-2xl bg-white p-3 sm:w-[143px]",
		style: {
			borderRadius: 24,
			boxShadow: CARD_SHADOW,
			animationDelay: "1.5s"
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-right text-xs font-bold text-[#6B7280]",
			children: "هدفك"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative mt-1 h-[118px]",
			children: GOAL_SLIDES.map((slide, i) => {
				const TrendIcon = slide.Icon;
				const active = i === index;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute inset-0 transition-opacity duration-300 ease-out",
					style: {
						opacity: active ? 1 : 0,
						pointerEvents: active ? "auto" : "none"
					},
					"aria-hidden": !active,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-[34px] items-end justify-end text-right text-xs font-bold leading-tight text-[#111827] line-clamp-2",
							children: slide.label
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex h-[28px] items-center justify-end gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-lg font-black leading-none",
								style: { color: slide.color },
								children: slide.value
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendIcon, {
								className: "h-4 w-4 shrink-0",
								style: { color: slide.color }
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
							viewBox: "0 0 120 40",
							className: "mt-1 h-8 w-full shrink-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", {
								points: slide.chartPoints,
								fill: "none",
								stroke: slide.color,
								strokeWidth: "2",
								strokeLinecap: "round"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-0 text-right text-[10px] leading-[14px] text-[#6B7280]",
							children: "خلال 3 أشهر"
						})
					]
				}, slide.label);
			})
		})]
	});
}
var SOCIAL_PROOF_AVATARS = [
	avatar1_default,
	avatar2_default,
	avatar3_default,
	avatar4_default,
	خالد_بعد_default,
	سمير_بعد_default,
	ناصر_بعد_default,
	جوليا_بعد_default,
	ياسمين_بعد_default,
	فاطمة_بعد_default,
	سلمى_بعد_default,
	انوار_بعد_default,
	كوثر_بعد_default
];
var VISIBLE_AVATAR_COUNT = 4;
var AVATAR_CYCLE_MS = 2400;
function useCyclingAvatarStack(pool, visibleCount = VISIBLE_AVATAR_COUNT, intervalMs = AVATAR_CYCLE_MS) {
	const [stack, setStack] = (0, import_react.useState)(() => pool.slice(0, visibleCount));
	const poolCursor = (0, import_react.useRef)(visibleCount);
	const slotCursor = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		if (pool.length <= visibleCount) return;
		const id = window.setInterval(() => {
			setStack((prev) => {
				const next = [...prev];
				const slot = slotCursor.current % visibleCount;
				slotCursor.current += 1;
				let tries = 0;
				let candidate = pool[poolCursor.current % pool.length];
				while (next.includes(candidate) && tries < pool.length) {
					poolCursor.current += 1;
					candidate = pool[poolCursor.current % pool.length];
					tries += 1;
				}
				poolCursor.current += 1;
				next[slot] = candidate;
				return next;
			});
		}, intervalMs);
		return () => window.clearInterval(id);
	}, [
		pool,
		visibleCount,
		intervalMs
	]);
	return stack;
}
function FinalCtaSocialProof({ active, count }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-6 flex items-center justify-center gap-3 [direction:ltr]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex shrink-0 -space-x-2",
			children: useCyclingAvatarStack(SOCIAL_PROOF_AVATARS).map((src, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src,
				alt: "",
				width: 36,
				height: 36,
				loading: "lazy",
				className: "cta-avatar-cycle h-9 w-9 rounded-full border-2 border-white object-cover"
			}, `${i}-${src}`))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-start gap-0.5 text-right [direction:rtl]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1",
					children: [Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-3.5 w-3.5 fill-success text-success" }, i)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-block min-w-[4.5rem] text-left font-[Tajawal] text-[13px] font-extrabold tabular-nums text-success",
						"aria-hidden": !active,
						children: ["+", count.toLocaleString("en-US")]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-[Tajawal] text-[11px] font-medium text-foreground",
						children: "عميل حققوا نتائج مذهلة"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, {
						className: "h-3.5 w-3.5 text-success",
						strokeWidth: 2.5
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-[Tajawal] text-[11px] font-bold text-[#F97316]",
					children: "كن أنت التالي!"
				})
			]
		})]
	});
}
function TodayCard() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "cta-float w-[123px] rounded-2xl bg-white p-3 sm:w-[143px]",
		style: {
			borderRadius: 24,
			boxShadow: CARD_SHADOW,
			animationDelay: "3s"
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-2 text-right text-sm font-bold text-[#111827]",
			children: "اليوم"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "space-y-1.5",
			children: [
				"تمرين القوة",
				"الكارديو",
				"خطة التغذية"
			].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-center justify-end gap-2 text-xs text-[#111827]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid h-4 w-4 place-items-center rounded-full bg-[#22C55E]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
						className: "h-2.5 w-2.5 text-white",
						strokeWidth: 3
					})
				})]
			}, t))
		})]
	});
}
function FinalCTA() {
	const { ref, inView } = useInView(.1);
	const count = useCount(SOCIAL_PROOF_CLIENT_COUNT, inView);
	const progress = useCount(76, inView, 1800);
	const circumference = 2 * Math.PI * 38;
	const dash = progress / 100 * circumference;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		ref,
		dir: "rtl",
		className: "relative bg-white py-16 sm:py-20 lg:py-24",
		style: { fontFamily: "'Tajawal', 'Cairo', sans-serif" },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        @keyframes ctaFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes ctaGlow { 0%,100%{box-shadow:0 10px 30px -8px rgba(249,115,22,0.45)} 50%{box-shadow:0 16px 44px -8px rgba(249,115,22,0.65)} }
        @keyframes ctaMotivationBounce { 0%,100%{transform:translateY(0) scale(1) rotate(0deg)} 35%{transform:translateY(-4px) scale(1.14) rotate(-6deg)} 70%{transform:translateY(-1px) scale(1.06) rotate(6deg)} }
        @keyframes ctaMotivationPulse { 0%,100%{transform:scale(0.72);opacity:0.55} 50%{transform:scale(1.35);opacity:0} }
        @keyframes ctaAvatarCycle { from { opacity: 0; transform: scale(0.82); } to { opacity: 1; transform: scale(1); } }
        .cta-float { animation: ctaFloat 6s ease-in-out infinite; }
        .cta-glow { animation: ctaGlow 3s ease-in-out infinite; }
        .cta-motivation-bounce { animation: ctaMotivationBounce 1.35s ease-in-out infinite; }
        .cta-motivation-pulse { animation: ctaMotivationPulse 1.35s ease-out infinite; }
        .cta-avatar-cycle { animation: ctaAvatarCycle 0.45s ease-out; }
      ` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-3xl text-center",
					style: {
						opacity: inView ? 1 : 0,
						transform: inView ? "translateY(0)" : "translateY(20px)",
						transition: "all 800ms ease-out"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "-mt-[30px] text-center font-[Tajawal] text-[26px] font-extrabold leading-[1.12] tracking-tight text-foreground lg:origin-top lg:-mt-[20px] lg:text-[78px] lg:font-black lg:leading-[1.08] lg:scale-[0.926]",
						children: [
							"جاهز تحول حقيقي",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "inline-block translate-y-[2px] text-primary",
								children: "في 90 يوماً؟"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mx-auto mt-5 max-w-2xl text-base leading-relaxed sm:text-lg",
						style: { color: "#6B7280" },
						children: "انضم إلى آلاف العملاء الذين حققوا نتائج حقيقية ومستدامة مع برنامج حكيم كوتشينج."
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative mx-auto mt-10 max-w-5xl sm:mt-12 lg:mt-14",
					style: {
						opacity: inView ? 1 : 0,
						transform: inView ? "translateY(0)" : "translateY(24px)",
						transition: "all 800ms ease-out 150ms"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"aria-hidden": true,
						className: "pointer-events-none absolute left-4 top-2 h-24 w-24 opacity-50 sm:left-8",
						style: {
							backgroundImage: "radial-gradient(circle, rgba(249,115,22,0.35) 1.2px, transparent 1.5px)",
							backgroundSize: "12px 12px"
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-end justify-center gap-4 sm:gap-6 lg:gap-10",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "z-20 flex shrink-0 -translate-x-[30px] flex-col gap-3 sm:gap-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressCard, {
									progress,
									dash,
									circumference
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoalCard, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TodayCard, {})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative flex shrink-0 items-end justify-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								"aria-hidden": true,
								className: "pointer-events-none absolute bottom-0 left-1/2 z-0 h-[300px] w-[300px] -translate-x-1/2 rounded-full sm:h-[380px] sm:w-[380px] lg:h-[460px] lg:w-[460px]",
								style: { background: "rgba(249,115,22,0.08)" }
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: هل_انت_جاهز_default,
								alt: "هل أنت جاهز؟",
								className: "relative z-10 w-auto max-h-[420px] sm:max-h-[520px] lg:max-h-[620px] object-contain object-bottom",
								style: {
									opacity: inView ? 1 : 0,
									transform: inView ? "scale(1)" : "scale(0.96)",
									transition: "all 900ms ease-out 200ms"
								}
							})]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto -mt-[10px] max-w-xl text-center sm:-mt-[2px]",
					style: {
						opacity: inView ? 1 : 0,
						transform: inView ? "translateY(0)" : "translateY(20px)",
						transition: "all 800ms ease-out 250ms"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/quiz",
						className: "cta-glow group inline-flex w-full items-center justify-between gap-6 rounded-full px-8 py-5 text-lg font-bold text-white transition-transform hover:-translate-y-0.5 sm:w-auto",
						style: {
							background: "linear-gradient(135deg, #F97316 0%, #FB923C 100%)",
							minWidth: "min(100%, 420px)"
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-5 w-5 shrink-0 transition-transform group-hover:-translate-x-1" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex-1 text-center",
								children: "أنا جاهز للتغيير"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "relative flex h-7 w-7 shrink-0 items-center justify-center",
								"aria-hidden": true,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-0 rounded-full bg-white/30 cta-motivation-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, {
									className: "relative h-5 w-5 cta-motivation-bounce",
									strokeWidth: 2.5,
									fill: "currentColor"
								})]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinalCtaSocialProof, {
						active: inView,
						count
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: [
						"mt-10 rounded-3xl border border-orange-100/80 bg-gradient-to-br from-white via-[#FFF8F1] to-white p-6 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.14)] ring-1 ring-orange-100/50 sm:mt-12 sm:p-8",
						"transition-all duration-700 ease-out delay-300",
						inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
					].join(" "),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mb-6 text-center font-[Tajawal] text-sm font-extrabold tracking-tight text-foreground sm:text-base",
							children: ["قبل أن تبدأ — ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-primary",
								children: "هذا ما تحصل عليه"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-3",
							children: TRUST_STRIP.map(({ Icon, title, desc }, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "group flex flex-col items-center gap-2.5 rounded-2xl border border-orange-50/90 bg-white/90 p-3 text-center shadow-[0_4px_18px_-10px_rgba(15,23,42,0.1)] transition-transform duration-300 hover:-translate-y-0.5 sm:gap-3 sm:p-4 lg:items-center",
								style: {
									opacity: inView ? 1 : 0,
									transition: `opacity 600ms ease-out ${400 + i * 100}ms, transform 300ms ease-out`
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#FFF6EE] via-white to-orange-50/90 text-primary ring-1 ring-orange-200/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_24px_-8px_rgba(249,115,22,0.38)] transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										"aria-hidden": true,
										className: "absolute inset-0 rounded-2xl bg-[#FF6B00]/15 blur-md opacity-80"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
										className: "relative h-5 w-5 sm:h-6 sm:w-6",
										strokeWidth: 2.2
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-[Tajawal] text-xs font-extrabold text-foreground sm:text-sm",
										children: title
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-1 text-[10px] font-medium leading-snug text-muted-foreground sm:text-xs",
										children: desc
									})]
								})]
							}, title))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-6 text-center font-[Tajawal] text-xs font-medium text-muted-foreground sm:text-sm",
							children: "خطوتك الأولى مجانية — ابدأ التقييم واكتشف برنامجك المخصص"
						})
					]
				})
			]
		})]
	});
}
function Index() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		dir: "rtl",
		lang: "ar",
		className: "min-h-screen bg-background font-sans",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hero, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrustStatistics, { className: "hidden lg:block" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroProblemTransition, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-[linear-gradient(180deg,#F3EFE8_0%,#F7F5F2_30%,#FAF8F5_55%,#FFFFFF_92%)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProblemSection, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HowItWorks, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Results90, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhatYouGet, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SuccessStories, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FAQ, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinalCTA, {})
		] })]
	});
}
//#endregion
export { Index as component };
