import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-DaoHZWri.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { _ as Link, v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-Droj9AM_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AuthPage() {
	const navigate = useNavigate();
	const [mode, setMode] = (0, import_react.useState)("signin");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [fullName, setFullName] = (0, import_react.useState)("");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		supabase.auth.getSession().then(({ data }) => {
			if (data.session) navigate({ to: "/dashboard" });
		});
		const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
			if (session) navigate({ to: "/dashboard" });
		});
		return () => sub.subscription.unsubscribe();
	}, [navigate]);
	async function onSubmit(e) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			if (mode === "signup") {
				const { error } = await supabase.auth.signUp({
					email,
					password,
					options: {
						emailRedirectTo: `${window.location.origin}/dashboard`,
						data: {
							full_name: fullName,
							phone
						}
					}
				});
				if (error) throw error;
			} else {
				const { error } = await supabase.auth.signInWithPassword({
					email,
					password
				});
				if (error) throw error;
			}
		} catch (err) {
			setError(err.message ?? "حدث خطأ");
		} finally {
			setLoading(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		dir: "rtl",
		className: "min-h-screen bg-background flex items-center justify-center px-4 py-12",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md lg:max-w-lg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "block text-center mb-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-2xl font-black text-foreground",
						children: "HAKIM"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mx-2 text-primary font-bold",
						children: "COACHING"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2 p-1 rounded-xl bg-muted mb-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setMode("signin"),
							className: `flex-1 py-2.5 rounded-lg text-sm font-bold transition ${mode === "signin" ? "bg-background text-foreground shadow" : "text-muted-foreground"}`,
							children: "تسجيل الدخول"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setMode("signup"),
							className: `flex-1 py-2.5 rounded-lg text-sm font-bold transition ${mode === "signup" ? "bg-background text-foreground shadow" : "text-muted-foreground"}`,
							children: "إنشاء حساب"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit,
						className: "space-y-4",
						children: [
							mode === "signup" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "الاسم الكامل",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									required: true,
									value: fullName,
									onChange: (e) => setFullName(e.target.value),
									className: "input",
									placeholder: "اسمك الكامل"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "رقم الهاتف",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "tel",
									value: phone,
									onChange: (e) => setPhone(e.target.value),
									className: "input",
									placeholder: "+971 ..."
								})
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "البريد الإلكتروني",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "email",
									required: true,
									value: email,
									onChange: (e) => setEmail(e.target.value),
									className: "input",
									placeholder: "you@example.com",
									dir: "ltr"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "كلمة المرور",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "password",
									required: true,
									minLength: 8,
									value: password,
									onChange: (e) => setPassword(e.target.value),
									className: "input",
									placeholder: "8 أحرف على الأقل",
									dir: "ltr"
								})
							}),
							error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2",
								children: error
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								disabled: loading,
								className: "w-full h-14 rounded-xl bg-primary text-primary-foreground font-bold text-base disabled:opacity-60 hover:opacity-90 transition",
								children: loading ? "..." : mode === "signin" ? "دخول" : "إنشاء الحساب"
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `.input{width:100%;height:48px;border-radius:12px;border:1px solid hsl(var(--border));background:hsl(var(--background));padding:0 14px;font-size:15px;outline:none;}.input:focus{border-color:hsl(var(--primary));box-shadow:0 0 0 3px hsl(var(--primary)/0.15)}` })
			]
		})
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-sm font-bold text-foreground mb-1.5",
			children: label
		}), children]
	});
}
//#endregion
export { AuthPage as component };
