import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-DaoHZWri.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { _ as Link, c as HeadContent, f as createRouter, g as createRootRouteWithContext, h as createFileRoute, j as redirect, m as lazyRouteComponent, p as Outlet, s as Scripts, u as useRouterState, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { t as WhatsAppIcon } from "./WhatsAppIcon-BIM0XFiZ.mjs";
import { ot as ChevronUp } from "../_libs/lucide-react.mjs";
import { r as premiumTransition } from "./motion-C5gqCalS.mjs";
import { r as MotionConfig, t as useReducedMotion } from "../_libs/framer-motion.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-Dtdou40c.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-Dx5Xj42q.css";
var WHATSAPP_URL = "https://wa.me/971505129019";
var HERO_INLINE_CTA_ID$1 = "hero-inline-quiz-cta";
var STICKY_QUIZ_BAR_ID$1 = "hero-sticky-quiz-bar";
var WHATSAPP_SIZE$1 = 52;
var GAP_ABOVE_STICKY$1 = 16;
function FloatingWhatsApp() {
	const [stickyQuizActive, setStickyQuizActive] = (0, import_react.useState)(false);
	const [liftedBottomPx, setLiftedBottomPx] = (0, import_react.useState)(20);
	(0, import_react.useEffect)(() => {
		const cta = document.getElementById(HERO_INLINE_CTA_ID$1);
		if (!cta) return;
		const mobileMq = window.matchMedia("(max-width: 1023px)");
		const sync = (intersecting) => {
			setStickyQuizActive(mobileMq.matches && !intersecting);
		};
		const observer = new IntersectionObserver(([entry]) => sync(entry.isIntersecting), { threshold: 0 });
		observer.observe(cta);
		const onMqChange = () => {
			const rect = cta.getBoundingClientRect();
			sync(rect.bottom > 0 && rect.top < window.innerHeight);
		};
		mobileMq.addEventListener("change", onMqChange);
		return () => {
			observer.disconnect();
			mobileMq.removeEventListener("change", onMqChange);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (!stickyQuizActive) return;
		const stickyBar = document.getElementById(STICKY_QUIZ_BAR_ID$1);
		if (!stickyBar) return;
		const updateBottom = () => {
			const barHeight = stickyBar.getBoundingClientRect().height;
			setLiftedBottomPx(barHeight + GAP_ABOVE_STICKY$1);
		};
		updateBottom();
		const resizeObserver = new ResizeObserver(updateBottom);
		resizeObserver.observe(stickyBar);
		window.addEventListener("resize", updateBottom);
		return () => {
			resizeObserver.disconnect();
			window.removeEventListener("resize", updateBottom);
		};
	}, [stickyQuizActive]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
		href: WHATSAPP_URL,
		target: "_blank",
		rel: "noopener noreferrer",
		"aria-label": "تواصل عبر واتساب",
		className: "fixed z-[60] grid place-items-center rounded-full bg-[#25D366] shadow-[0_8px_22px_-6px_rgba(37,211,102,0.5)] transition-[transform,bottom] duration-500 ease-out hover:scale-105 active:scale-95 animate-whatsapp-pulse animate-whatsapp-enter max-lg:right-4 lg:right-5",
		style: {
			width: WHATSAPP_SIZE$1,
			height: WHATSAPP_SIZE$1,
			bottom: stickyQuizActive ? `${liftedBottomPx}px` : "calc(1.25rem + env(safe-area-inset-bottom, 0px))"
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhatsAppIcon, { className: "h-7 w-7 text-white" })
	});
}
var BOTTOM_THRESHOLD_PX = 24;
var HERO_INLINE_CTA_ID = "hero-inline-quiz-cta";
var STICKY_QUIZ_BAR_ID = "hero-sticky-quiz-bar";
var GAP_ABOVE_STICKY = 16;
var WHATSAPP_SIZE = 52;
var GAP_ABOVE_WHATSAPP = 12;
function ScrollToTopButton() {
	const [visible, setVisible] = (0, import_react.useState)(false);
	const [stickyQuizActive, setStickyQuizActive] = (0, import_react.useState)(false);
	const [liftedBottomPx, setLiftedBottomPx] = (0, import_react.useState)(20);
	(0, import_react.useEffect)(() => {
		const checkBottom = () => {
			const scrollTop = window.scrollY || document.documentElement.scrollTop;
			const viewportHeight = window.innerHeight;
			const documentHeight = document.documentElement.scrollHeight;
			setVisible(scrollTop + viewportHeight >= documentHeight - BOTTOM_THRESHOLD_PX);
		};
		checkBottom();
		window.addEventListener("scroll", checkBottom, { passive: true });
		window.addEventListener("resize", checkBottom);
		return () => {
			window.removeEventListener("scroll", checkBottom);
			window.removeEventListener("resize", checkBottom);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		const cta = document.getElementById(HERO_INLINE_CTA_ID);
		if (!cta) return;
		const mobileMq = window.matchMedia("(max-width: 1023px)");
		const sync = (intersecting) => {
			setStickyQuizActive(mobileMq.matches && !intersecting);
		};
		const observer = new IntersectionObserver(([entry]) => sync(entry.isIntersecting), { threshold: 0 });
		observer.observe(cta);
		const onMqChange = () => {
			const rect = cta.getBoundingClientRect();
			sync(rect.bottom > 0 && rect.top < window.innerHeight);
		};
		mobileMq.addEventListener("change", onMqChange);
		return () => {
			observer.disconnect();
			mobileMq.removeEventListener("change", onMqChange);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (!stickyQuizActive) return;
		const stickyBar = document.getElementById(STICKY_QUIZ_BAR_ID);
		if (!stickyBar) return;
		const updateBottom = () => {
			const barHeight = stickyBar.getBoundingClientRect().height;
			setLiftedBottomPx(barHeight + GAP_ABOVE_STICKY);
		};
		updateBottom();
		const resizeObserver = new ResizeObserver(updateBottom);
		resizeObserver.observe(stickyBar);
		window.addEventListener("resize", updateBottom);
		return () => {
			resizeObserver.disconnect();
			window.removeEventListener("resize", updateBottom);
		};
	}, [stickyQuizActive]);
	const bottomStyle = stickyQuizActive ? { bottom: `${liftedBottomPx + WHATSAPP_SIZE + GAP_ABOVE_WHATSAPP}px` } : {};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick: () => window.scrollTo({
			top: 0,
			behavior: "smooth"
		}),
		"aria-label": "العودة إلى أعلى الصفحة",
		"aria-hidden": !visible,
		className: [
			"fixed z-[59] left-4 grid h-12 w-12 place-items-center rounded-full text-white shadow-[0_10px_28px_-8px_rgba(249,115,22,0.55)] transition-[opacity,transform,bottom] duration-300 ease-out lg:left-5",
			"bg-gradient-to-br from-[#F97316] to-[#FB923C]",
			"hover:scale-105 active:scale-95",
			!stickyQuizActive && "max-lg:bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))]",
			visible ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
		].filter(Boolean).join(" "),
		style: bottomStyle,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, {
			className: "h-6 w-6",
			strokeWidth: 2.5
		})
	});
}
/**
* Global motion defaults. Uses MotionConfig only so existing `motion.*` usage
* across the app stays compatible (LazyMotion strict breaks `motion.div`).
*/
function MotionProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MotionConfig, {
		reducedMotion: useReducedMotion() ? "always" : "user",
		transition: premiumTransition,
		children
	});
}
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
}
function registerServiceWorker() {
	if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
	const register = () => {
		navigator.serviceWorker.register("/sw.js", {
			scope: "/",
			updateViaCache: "none"
		}).then((registration) => {
			registration.update().catch(() => {});
		}).catch(() => {});
	};
	if (document.readyState === "complete") register();
	else window.addEventListener("load", register, { once: true });
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$9 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover"
			},
			{
				name: "theme-color",
				content: "#FF6B00"
			},
			{
				name: "apple-mobile-web-app-capable",
				content: "yes"
			},
			{
				name: "apple-mobile-web-app-status-bar-style",
				content: "default"
			},
			{
				name: "author",
				content: "Hakim Coaching"
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{ title: "Hakim Coaching — برنامج تدريبي وغذائي مخصص" },
			{
				property: "og:title",
				content: "Hakim Coaching — برنامج تدريبي وغذائي مخصص"
			},
			{
				name: "twitter:title",
				content: "Hakim Coaching — برنامج تدريبي وغذائي مخصص"
			},
			{
				name: "description",
				content: "Hakim Coaching Landing Page: A responsive Arabic RTL hero section for premium fitness coaching."
			},
			{
				property: "og:description",
				content: "Hakim Coaching Landing Page: A responsive Arabic RTL hero section for premium fitness coaching."
			},
			{
				name: "twitter:description",
				content: "Hakim Coaching Landing Page: A responsive Arabic RTL hero section for premium fitness coaching."
			},
			{
				property: "og:image",
				content: "https://storage.googleapis.com/gpt-engineer-file-uploads/QicwtF0hdOh8u9TxR6SXxZWUZQJ2/social-images/social-1781802129820-a84bdb8c92175869f403771a73d7ef78787a53779ebf7913c0cdfc83c019eea7.webp"
			},
			{
				name: "twitter:image",
				content: "https://storage.googleapis.com/gpt-engineer-file-uploads/QicwtF0hdOh8u9TxR6SXxZWUZQJ2/social-images/social-1781802129820-a84bdb8c92175869f403771a73d7ef78787a53779ebf7913c0cdfc83c019eea7.webp"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/manifest.webmanifest"
			},
			{
				rel: "icon",
				href: "/icon.svg",
				type: "image/svg+xml"
			},
			{
				rel: "apple-touch-icon",
				href: "/icon.svg"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Cairo:wght@400;700;800;900&display=swap"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "ar",
		dir: "rtl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function PwaRegistrar() {
	(0, import_react.useEffect)(() => {
		registerServiceWorker();
	}, []);
	return null;
}
function HashScrollHandler() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const hash = useRouterState({ select: (s) => s.location.hash });
	(0, import_react.useEffect)(() => {
		if (pathname !== "/" || !hash) return;
		const id = hash.replace(/^#/, "");
		const timer = window.setTimeout(() => {
			document.getElementById(id)?.scrollIntoView({
				behavior: "smooth",
				block: "start"
			});
		}, 80);
		return () => window.clearTimeout(timer);
	}, [pathname, hash]);
	return null;
}
function RootComponent() {
	const { queryClient } = Route$9.useRouteContext();
	const isQuiz = useRouterState({ select: (s) => s.location.pathname }).startsWith("/quiz");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MotionProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PwaRegistrar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HashScrollHandler, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}),
			!isQuiz && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FloatingWhatsApp, {}),
			!isQuiz && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollToTopButton, {})
		]
	}) });
}
var $$splitComponentImporter$7 = () => import("./terms-BNT-dcs9.mjs");
var Route$8 = createFileRoute("/terms")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./refund-D0igSGbK.mjs");
var Route$7 = createFileRoute("/refund")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./quiz-B9cV5lGZ.mjs");
var Route$6 = createFileRoute("/quiz")({
	head: () => ({ meta: [{ title: "ابدأ تقييمك المجاني — Hakim Coaching" }, {
		name: "description",
		content: "احصل على برنامج تدريب وتغذية رقمي مخصص — تحليل مجاني ثم اشتراك رقمي يُسلَّم عبر واتساب والبريد."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./privacy-0uOSx_Ww.mjs");
var Route$5 = createFileRoute("/privacy")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var Route$4 = createFileRoute("/pricing")({
	head: () => ({ meta: [{ title: "كيف يتم تحديد السعر؟ — Hakim Coaching" }, {
		name: "description",
		content: "تعرّف على كيفية تحديد سعر برنامجك قبل الدفع — عملية واضحة وبسيطة بدون أي التزام."
	}] }),
	beforeLoad: () => {
		throw redirect({
			to: "/",
			hash: "pricing"
		});
	}
});
var $$splitComponentImporter$3 = () => import("./auth-Bo8x8Gfx.mjs");
var Route$3 = createFileRoute("/auth")({
	head: () => ({ meta: [{ title: "تسجيل الدخول | Hakim Coaching" }] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./route-Di7iQBCH.mjs");
var Route$2 = createFileRoute("/_authenticated")({
	ssr: false,
	beforeLoad: async () => {
		const { data, error } = await supabase.auth.getUser();
		if (error || !data.user) throw redirect({ to: "/auth" });
		return { user: data.user };
	},
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./routes-BnU80Kvx.mjs");
var Route$1 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "Hakim Coaching — برنامج تدريبي وغذائي مخصص لهدفك" },
		{
			name: "description",
			content: "برنامج تدريب وتغذية رقمي مخصص — تحليل مجاني، تسليم إلكتروني عبر واتساب والبريد، بدون شحن أو جلسات حضورية."
		},
		{
			property: "og:title",
			content: "Hakim Coaching — برنامج تدريبي وغذائي مخصص"
		},
		{
			property: "og:description",
			content: "اكتشف الخطة المناسبة لجسمك وأهدافك بناءً على تحليل شخصي مجاني."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./dashboard-BG_Pviq3.mjs");
var Route = createFileRoute("/_authenticated/dashboard")({
	head: () => ({ meta: [{ title: "حسابي | Hakim Coaching" }] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var TermsRoute = Route$8.update({
	id: "/terms",
	path: "/terms",
	getParentRoute: () => Route$9
});
var RefundRoute = Route$7.update({
	id: "/refund",
	path: "/refund",
	getParentRoute: () => Route$9
});
var QuizRoute = Route$6.update({
	id: "/quiz",
	path: "/quiz",
	getParentRoute: () => Route$9
});
var PrivacyRoute = Route$5.update({
	id: "/privacy",
	path: "/privacy",
	getParentRoute: () => Route$9
});
var PricingRoute = Route$4.update({
	id: "/pricing",
	path: "/pricing",
	getParentRoute: () => Route$9
});
var AuthRoute = Route$3.update({
	id: "/auth",
	path: "/auth",
	getParentRoute: () => Route$9
});
var AuthenticatedRouteRoute = Route$2.update({
	id: "/_authenticated",
	getParentRoute: () => Route$9
});
var IndexRoute = Route$1.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$9
});
var AuthenticatedRouteRouteChildren = { AuthenticatedDashboardRoute: Route.update({
	id: "/dashboard",
	path: "/dashboard",
	getParentRoute: () => AuthenticatedRouteRoute
}) };
var rootRouteChildren = {
	IndexRoute,
	AuthenticatedRouteRoute: AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren),
	AuthRoute,
	PricingRoute,
	PrivacyRoute,
	QuizRoute,
	RefundRoute,
	TermsRoute
};
var routeTree = Route$9._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
