import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-DaoHZWri.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard-BUJnJOWG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Dashboard() {
	const navigate = useNavigate();
	const [profile, setProfile] = (0, import_react.useState)(null);
	const [plan, setPlan] = (0, import_react.useState)(null);
	const [payments, setPayments] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		(async () => {
			const { data: u } = await supabase.auth.getUser();
			if (!u.user) return;
			const [{ data: prof }, { data: pl }, { data: pays }] = await Promise.all([
				supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle(),
				supabase.from("plans").select("*").eq("user_id", u.user.id).eq("is_active", true).maybeSingle(),
				supabase.from("payments").select("*").eq("user_id", u.user.id).order("created_at", { ascending: false })
			]);
			setProfile(prof);
			setPlan(pl);
			setPayments(pays ?? []);
		})();
	}, []);
	async function signOut() {
		await supabase.auth.signOut();
		navigate({ to: "/auth" });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		dir: "rtl",
		className: "min-h-screen bg-background px-4 py-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-3xl lg:max-w-4xl mx-auto space-y-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-2xl font-black",
						children: "حسابي"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: signOut,
						className: "text-sm font-bold text-muted-foreground hover:text-foreground",
						children: "تسجيل الخروج"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					title: "الملف الشخصي",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "الاسم",
							value: profile?.full_name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "البريد",
							value: profile?.email
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "الهاتف",
							value: profile?.phone
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "المدينة",
							value: profile?.city
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "الهدف",
							value: profile?.goal
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					title: "الباقة الحالية",
					children: plan ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "الباقة",
							value: plan.tier_name ?? plan.tier_id
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "النوع",
							value: plan.training_mode
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							label: "السعر",
							value: plan.price ? `${plan.price} ${plan.currency}` : "—"
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "لم تختر باقة بعد."
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					title: "المدفوعات",
					children: payments.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "لا توجد مدفوعات بعد."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "divide-y divide-border",
						children: payments.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "py-3 flex justify-between text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								p.method,
								" — ",
								p.amount,
								" ",
								p.currency
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold",
								children: p.status
							})]
						}, p.id))
					})
				})
			]
		})
	});
}
function Card({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-border bg-card p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-lg font-bold mb-3",
			children: title
		}), children]
	});
}
function Row({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex justify-between py-1.5 text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-bold",
			children: value || "—"
		})]
	});
}
//#endregion
export { Dashboard as component };
