import { o as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-DaoHZWri.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { i as PRODUCT_SUMMARY, l as SITE_SUPPORT_EMAIL, t as LEGAL_ROUTES } from "./site-legal-BJWCSk8k.mjs";
import { $ as CreditCard, B as Info, Ct as Bitcoin, E as Ruler, G as Gem, I as Mail, J as FileUp, L as Lock, N as MessageCircle, Ot as ArrowLeft, Q as Crown, R as Lightbulb, U as Headphones, V as Heart, X as Dumbbell, _ as Star, _t as Camera, b as Shield, dt as ChevronRight, f as Trophy, ft as ChevronLeft, g as Target, k as PersonStanding, mt as Check, n as X, pt as ChevronDown, q as Flame, rt as Clock, t as Zap, tt as Copy, u as Upload, v as Sparkles, vt as Calendar, w as Scale, x as ShieldCheck, z as Landmark } from "../_libs/lucide-react.mjs";
import { a as triggerSelectionHaptic, i as quiz_gym_bg_default, n as pageVariants, t as pageTransition } from "./quiz-gym-bg-YHrisbSo.mjs";
import { a as cn, i as avatar4_default, n as avatar2_default, o as سمير_بعد_default, r as avatar3_default, s as سمير_قبل_default, t as avatar1_default } from "./utils-PO22zh49.mjs";
import { n as motion } from "../_libs/framer-motion.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/quiz-BGReLwSw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var LEAD_ID_KEY = "hakim_lead_id";
var LEAD_TOKEN_KEY = "hakim_lead_token";
function canUseStorage$1() {
	return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}
function getLeadCredentials() {
	if (!canUseStorage$1()) return null;
	const leadId = window.localStorage.getItem(LEAD_ID_KEY);
	const accessToken = window.localStorage.getItem(LEAD_TOKEN_KEY);
	if (!leadId || !accessToken) return null;
	return {
		leadId,
		accessToken
	};
}
function setLeadCredentials(credentials) {
	if (!canUseStorage$1()) return;
	window.localStorage.setItem(LEAD_ID_KEY, credentials.leadId);
	window.localStorage.setItem(LEAD_TOKEN_KEY, credentials.accessToken);
}
var PAYMENT_PROOFS_BUCKET = "payment-proofs";
function isCreateLeadRpcResponse(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
	const record = value;
	return typeof record.lead_id === "string" && typeof record.access_token === "string";
}
function getFileExtension(file) {
	const fromName = file.name.split(".").pop()?.toLowerCase();
	if (fromName) return fromName;
	if (file.type === "application/pdf") return "pdf";
	if (file.type === "image/png") return "png";
	if (file.type === "image/webp") return "webp";
	return "jpg";
}
function toRpcPayload(payload) {
	return payload;
}
async function createLead(payload) {
	const { data, error } = await supabase.rpc("create_lead", { p_payload: payload });
	if (error) throw error;
	if (!isCreateLeadRpcResponse(data)) throw new Error("Lead created without credentials.");
	const credentials = {
		leadId: data.lead_id,
		accessToken: data.access_token
	};
	setLeadCredentials(credentials);
	return credentials;
}
async function updateLead(credentials, payload) {
	const { error } = await supabase.rpc("update_lead", {
		p_lead_id: credentials.leadId,
		p_access_token: credentials.accessToken,
		p_payload: toRpcPayload(payload)
	});
	if (error) throw error;
}
async function saveSelectedPlan(credentials, plan) {
	await updateLead(credentials, {
		tier_id: plan.tierId,
		tier_name: plan.tierName,
		plan_price: plan.planPrice,
		training_mode: plan.trainingMode,
		status: "plan_selected"
	});
}
async function savePaymentMethod(credentials, payment) {
	await updateLead(credentials, {
		payment_method: payment.method,
		payment_amount: payment.amount,
		payment_currency: payment.currency ?? "USD"
	});
}
async function reserveProofUpload(credentials, file) {
	const { data, error } = await supabase.rpc("reserve_proof_upload", {
		p_lead_id: credentials.leadId,
		p_access_token: credentials.accessToken,
		p_file_ext: getFileExtension(file)
	});
	if (error) throw error;
	if (typeof data !== "string" || data.length === 0) throw new Error("Proof upload path was not reserved.");
	return data;
}
async function uploadPaymentProof(credentials, file) {
	const path = await reserveProofUpload(credentials, file);
	const { error: uploadError } = await supabase.storage.from(PAYMENT_PROOFS_BUCKET).upload(path, file, { upsert: false });
	if (uploadError) throw uploadError;
	return path;
}
async function markPaymentSubmitted(credentials, proofPath) {
	const { error } = await supabase.rpc("submit_payment_proof_metadata", {
		p_lead_id: credentials.leadId,
		p_access_token: credentials.accessToken,
		p_proof_path: proofPath
	});
	if (error) throw error;
}
async function submitPaymentProof(credentials, file) {
	const proofPath = await uploadPaymentProof(credentials, file);
	await markPaymentSubmitted(credentials, proofPath);
	return proofPath;
}
function buildQuizAnswersPayload(input) {
	return {
		gender: input.gender ?? null,
		goalId: input.goalId ?? null,
		challengeId: input.challengeId ?? null,
		age: input.age ?? null,
		heightCm: input.heightCm ?? null,
		weightKg: input.weightKg ?? null,
		activityLevel: input.activityLevel ?? null,
		investment: input.investment ?? null,
		bodyType: input.bodyType ?? null,
		trainingType: input.trainingType ?? null,
		userLocation: input.userLocation ?? null,
		selectedTierId: input.selectedTierId ?? null,
		lastStep: input.lastStep ?? null
	};
}
function buildLeadInsertFromQuiz(answersInput, contact) {
	return {
		status: "pending_lead",
		answers: buildQuizAnswersPayload({
			...answersInput,
			userLocation: contact.locationPreference,
			lastStep: "contact"
		}),
		gender: answersInput.gender ?? null,
		goal_id: answersInput.goalId ?? null,
		challenge_id: answersInput.challengeId ?? null,
		full_name: contact.fullName,
		email: contact.email,
		phone: contact.phone,
		city: contact.city,
		country: contact.country,
		location_preference: contact.locationPreference
	};
}
var STORAGE_KEY = "hakim_quiz_progress_v1";
var SCHEMA_VERSION = 1;
function canUseStorage() {
	return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}
function isValidSnapshot(value) {
	if (!value || typeof value !== "object") return false;
	const s = value;
	return s.version === SCHEMA_VERSION && typeof s.step === "string" && typeof s.savedAt === "number";
}
function readQuizProgress() {
	if (!canUseStorage()) return null;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (!isValidSnapshot(parsed)) return null;
		return parsed;
	} catch {
		return null;
	}
}
function writeQuizProgress(snapshot) {
	if (!canUseStorage()) return;
	try {
		const payload = {
			...snapshot,
			version: SCHEMA_VERSION,
			savedAt: Date.now()
		};
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
	} catch {}
}
function useQuizStepTransition(initial) {
	const [step, setStep] = (0, import_react.useState)(initial);
	const [phase, setPhase] = (0, import_react.useState)("in");
	const transitionTo = (0, import_react.useCallback)((next, sideEffect) => {
		setPhase("out");
		window.setTimeout(() => {
			sideEffect?.();
			setStep(next);
			setPhase("in");
		}, 180);
	}, []);
	return {
		step,
		phase,
		transitionTo,
		selectAndGo: (0, import_react.useCallback)((next, sideEffect) => {
			triggerSelectionHaptic();
			window.setTimeout(() => transitionTo(next, sideEffect), 150);
		}, [transitionTo]),
		goBack: (0, import_react.useCallback)((next) => {
			transitionTo(next);
		}, [transitionTo]),
		replaceStep: (0, import_react.useCallback)((next) => {
			setStep(next);
			setPhase("in");
		}, [])
	};
}
var PERSIST_DEBOUNCE_MS = 280;
function applySnapshot(saved, setters) {
	setters.setGender(saved.gender);
	setters.setUserName(saved.userName);
	setters.setUserPhone(saved.userPhone);
	setters.setUserCity(saved.userCity);
	setters.setGoalId(saved.goalId);
	setters.setChallengeId(saved.challengeId);
	setters.setAge(saved.age);
	setters.setHeightCm(saved.heightCm);
	setters.setWeightKg(saved.weightKg);
	setters.setActivityLevel(saved.activityLevel);
	setters.setInvestment(saved.investment);
	setters.setBodyType(saved.bodyType);
	setters.setUserLocation(saved.userLocation);
	setters.setSelectedTierId(saved.selectedTierId);
}
function useQuizProgress() {
	const hydratedRef = (0, import_react.useRef)(false);
	const { step, phase, transitionTo, selectAndGo, goBack, replaceStep } = useQuizStepTransition("loading");
	const [gender, setGender] = (0, import_react.useState)(null);
	const [userName, setUserName] = (0, import_react.useState)("");
	const [userPhone, setUserPhone] = (0, import_react.useState)("");
	const [userCity, setUserCity] = (0, import_react.useState)("");
	const [goalId, setGoalId] = (0, import_react.useState)("");
	const [challengeId, setChallengeId] = (0, import_react.useState)("");
	const [age, setAge] = (0, import_react.useState)();
	const [heightCm, setHeightCm] = (0, import_react.useState)();
	const [weightKg, setWeightKg] = (0, import_react.useState)();
	const [activityLevel, setActivityLevel] = (0, import_react.useState)();
	const [investment, setInvestment] = (0, import_react.useState)();
	const [bodyType, setBodyType] = (0, import_react.useState)();
	const [userLocation, setUserLocation] = (0, import_react.useState)(null);
	const [selectedTierId, setSelectedTierId] = (0, import_react.useState)("transform");
	(0, import_react.useEffect)(() => {
		const saved = readQuizProgress();
		if (saved) {
			applySnapshot(saved, {
				setGender,
				setUserName,
				setUserPhone,
				setUserCity,
				setGoalId,
				setChallengeId,
				setAge,
				setHeightCm,
				setWeightKg,
				setActivityLevel,
				setInvestment,
				setBodyType,
				setUserLocation,
				setSelectedTierId
			});
			if (saved.step && saved.step !== "loading") replaceStep(saved.step);
		}
		hydratedRef.current = true;
	}, [replaceStep]);
	(0, import_react.useEffect)(() => {
		if (!hydratedRef.current) return;
		const snapshot = {
			step,
			gender,
			userName,
			userPhone,
			userCity,
			goalId,
			challengeId,
			age,
			heightCm,
			weightKg,
			activityLevel,
			investment,
			bodyType,
			userLocation,
			selectedTierId
		};
		const timer = window.setTimeout(() => writeQuizProgress(snapshot), PERSIST_DEBOUNCE_MS);
		return () => window.clearTimeout(timer);
	}, [
		step,
		gender,
		userName,
		userPhone,
		userCity,
		goalId,
		challengeId,
		age,
		heightCm,
		weightKg,
		activityLevel,
		investment,
		bodyType,
		userLocation,
		selectedTierId
	]);
	return {
		step,
		phase,
		transitionTo,
		selectAndGo,
		goBack,
		gender,
		setGender,
		userName,
		setUserName,
		userPhone,
		setUserPhone,
		userCity,
		setUserCity,
		goalId,
		setGoalId,
		challengeId,
		setChallengeId,
		age,
		setAge,
		heightCm,
		setHeightCm,
		weightKg,
		setWeightKg,
		activityLevel,
		setActivityLevel,
		investment,
		setInvestment,
		bodyType,
		setBodyType,
		userLocation,
		setUserLocation,
		selectedTierId,
		setSelectedTierId
	};
}
function MotionStepView({ phase, children, className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
		className: `w-full h-full ${className}`,
		variants: pageVariants,
		initial: false,
		animate: phase === "in" ? "animate" : "exit",
		transition: pageTransition,
		children
	});
}
var BANK_METHOD_MAP = {
	uae: "bank_nbd_uae",
	morocco: "bank_cih_morocco",
	bmce: "bank_bmce_morocco"
};
function mapBankToPaymentMethod(bank) {
	return BANK_METHOD_MAP[bank];
}
function AgreementCheckbox({ checked, onChange, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: cn("flex cursor-pointer items-start gap-3 text-start", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "checkbox",
			checked,
			onChange: (e) => onChange(e.target.checked),
			className: "mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-[#D1D5DB] accent-[#FF5A1F]",
			"aria-label": "الموافقة على الشروط والسياسات"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "text-[13px] leading-[1.45] text-[#374151]",
			children: [
				"أوافق على",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: LEGAL_ROUTES.terms,
					target: "_blank",
					className: "font-bold text-[#FF5A1F] underline-offset-2 hover:underline",
					children: "الشروط والأحكام"
				}),
				" ",
				"و",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: LEGAL_ROUTES.privacy,
					target: "_blank",
					className: "font-bold text-[#FF5A1F] underline-offset-2 hover:underline",
					children: "سياسة الخصوصية"
				}),
				" ",
				"و",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: LEGAL_ROUTES.refund,
					target: "_blank",
					className: "font-bold text-[#FF5A1F] underline-offset-2 hover:underline",
					children: "سياسة الاسترجاع"
				}),
				"."
			]
		})]
	});
}
var BANK_TRANSFER_ACCOUNTS = [
	{
		id: "uae",
		bankName: "Emirates NBD",
		countryLabel: "الإمارات",
		countryBadgeClass: "bg-[#FF6B00] text-white",
		currency: "USD",
		holder: "Hakim Coaching FZ-LLC",
		iban: "AE07 0260 0010 1543 2109 876",
		account: "1015432109876",
		swift: "EBILAEAD"
	},
	{
		id: "morocco",
		bankName: "CIH Bank",
		countryLabel: "المغرب",
		countryBadgeClass: "bg-[#2563EB] text-white",
		currency: "MAD",
		holder: "Hakim Coaching",
		iban: "MA64 2308 1021 1321 7221 0160 0012",
		account: "230 810 2113217221016000 12",
		swift: "CIHMMAMC"
	},
	{
		id: "bmce",
		bankName: "BMCE Bank",
		countryLabel: "المغرب",
		countryBadgeClass: "bg-[#2563EB] text-white",
		currency: "MAD",
		holder: "Hakim Coaching",
		iban: "MA64 0118 1000 0001 2345 6789 0134",
		account: "011 810 0000123456789012 34",
		swift: "BMCEMAMC"
	}
];
/** Approximate MAD equivalent for display on Moroccan account */
function getMadAmount(usdPrice) {
	return Math.round(Number(usdPrice) * 9.7);
}
function formatTransferAmount(account, usdTierPrice) {
	if (account.currency === "USD") return `${usdTierPrice} USD`;
	return `${getMadAmount(usdTierPrice).toLocaleString("ar-EG")} MAD`;
}
function CopyRow({ label, value, highlight }) {
	const [copied, setCopied] = (0, import_react.useState)(false);
	const copy = () => {
		if (value === "—" || typeof navigator === "undefined" || !navigator.clipboard) return;
		navigator.clipboard.writeText(value.replace(/\s/g, "")).then(() => {
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1500);
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-2 border-t border-[#F1F3F5] py-2.5 first:border-t-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: copy,
			disabled: value === "—",
			className: "grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#FFF6EE] text-[#FF6B00] active:scale-95 disabled:opacity-40",
			"aria-label": `نسخ ${label}`,
			children: copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3.5 w-3.5 text-[#16A34A]" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-3.5 w-3.5" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 flex-1 text-right",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[10.5px] font-bold text-neutral-500",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `truncate text-[12.5px] font-extrabold ${highlight ? "text-[#FF6B00]" : "text-[#0F172A]"}`,
				dir: "ltr",
				style: {
					direction: "ltr",
					textAlign: "right"
				},
				children: value
			})]
		})]
	});
}
function BankTransferModal({ tierPriceUsd, onClose, onTransferDone }) {
	const [selectedBank, setSelectedBank] = (0, import_react.useState)("uae");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center sm:items-center",
		style: { background: "rgba(15,23,42,.55)" },
		role: "dialog",
		"aria-modal": true,
		"aria-labelledby": "bank-transfer-title",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto mt-2 h-1 w-10 rounded-full bg-[#E5E7EB] sm:hidden",
					"aria-hidden": true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3 border-b border-[#F1F3F5] px-5 py-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: onClose,
							className: "grid h-9 w-9 place-items-center rounded-full bg-[#F3F4F6] text-neutral-500",
							"aria-label": "إغلاق",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								id: "bank-transfer-title",
								className: "font-[Tajawal] text-[18px] font-black text-[#0F172A]",
								children: "تفاصيل التحويل البنكي"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-[11.5px] leading-relaxed text-neutral-500",
								children: "اختر الحساب البنكي المناسب لك وقم بإجراء التحويل للمبلغ المحدد"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-9" })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3 overflow-y-auto px-5 py-4",
					children: [BANK_TRANSFER_ACCOUNTS.map((account) => {
						const active = selectedBank === account.id;
						const amount = formatTransferAmount(account, tierPriceUsd);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setSelectedBank(account.id),
							className: `w-full rounded-2xl border p-4 text-right transition-all ${active ? "border-[#FF6B00] bg-[#FFF8F4] shadow-[0_8px_24px_-12px_rgba(255,107,0,0.35)]" : "border-[#ECECEC] bg-white"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${active ? "border-[#FF6B00]" : "border-[#D1D5DB]"}`,
									children: active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-2 rounded-full bg-[#FF6B00]" }) : null
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-1 items-start justify-end gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-wrap items-center justify-end gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[15px] font-black text-[#0F172A]",
												children: account.bankName
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: `rounded-md px-2 py-0.5 text-[10px] font-extrabold ${account.countryBadgeClass}`,
												children: account.countryLabel
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-1 text-[11px] text-neutral-500",
											children: ["العملة: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-bold text-[#FF6B00]",
												children: account.currency
											})]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#F3F4F6]",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Landmark, { className: "h-6 w-6 text-[#64748B]" })
									})]
								})]
							}), active ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 rounded-xl bg-white/80 px-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyRow, {
										label: "اسم صاحب الحساب",
										value: account.holder
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyRow, {
										label: "IBAN",
										value: account.iban
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyRow, {
										label: "رقم الحساب",
										value: account.account
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyRow, {
										label: "المبلغ المطلوب",
										value: amount,
										highlight: true
									})
								]
							}) : null]
						}, account.id);
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-2.5 rounded-2xl border border-[#FFEDD5] bg-[#FFF7ED] px-3.5 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#FF6B00] text-[12px] font-black text-white",
							children: "i"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11.5px] leading-[1.65] text-neutral-600",
							children: "بعد إتمام التحويل، يرجى رفع إيصال التحويل في الأسفل. سيتم تفعيل اشتراكك بعد التحقق من الدفع."
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "border-t border-[#F1F3F5] p-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => onTransferDone(selectedBank),
						className: "flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#FF6B00] text-[16px] font-black text-white shadow-[0_12px_28px_-12px_rgba(255,107,0,0.65)] active:scale-[0.98]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
							className: "h-5 w-5",
							strokeWidth: 3
						}), "تم التحويل"]
					})
				})
			]
		})
	});
}
function CheckoutFooter({ className }) {
	const links = [
		{
			to: LEGAL_ROUTES.terms,
			label: "الشروط"
		},
		{
			to: LEGAL_ROUTES.privacy,
			label: "الخصوصية"
		},
		{
			to: LEGAL_ROUTES.refund,
			label: "الاسترجاع"
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
		className: cn("mt-5 space-y-3 font-[Tajawal]", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "overflow-hidden rounded-2xl border border-[#ECECEC] bg-white checkout-shadow",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: `mailto:${SITE_SUPPORT_EMAIL}`,
				className: "flex items-center gap-3 px-3.5 py-3 transition hover:bg-[#FAFAFA]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF3ED] text-[#FF5A1F]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, {
							className: "h-4 w-4",
							strokeWidth: 2.2,
							"aria-hidden": true
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1 text-start",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[13px] font-bold leading-tight text-[#0F172A]",
							children: "تحتاج مساعدة؟"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-0.5 truncate text-[12px] font-semibold text-[#FF5A1F]",
							children: SITE_SUPPORT_EMAIL
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
						className: "h-4 w-4 shrink-0 text-[#C4C4C4]",
						"aria-hidden": true
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				"aria-label": "روابط قانونية",
				className: "flex items-center justify-center gap-2 border-t border-[#ECECEC] px-3 py-2.5 text-[11px] text-[#6B7280]",
				children: links.map((link, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex items-center gap-2",
					children: [i > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[#D1D5DB]",
						"aria-hidden": true,
						children: "·"
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: link.to,
						className: "font-semibold hover:text-[#FF5A1F]",
						children: link.label
					})]
				}, link.to))
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "px-1 text-center text-[10px] leading-[1.4] text-[#9CA3AF]",
			children: "الدفع بالتحويل البنكي · تفعيل بعد المراجعة اليدوية"
		})]
	});
}
function TrophySvg() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 64 64",
		width: "56",
		height: "56",
		"aria-hidden": true,
		className: "h-14 w-14",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
				id: "checkout-trg",
				x1: "0",
				y1: "0",
				x2: "0",
				y2: "1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "0",
					stopColor: "#FFD56B"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "1",
					stopColor: "#E69300"
				})]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "url(#checkout-trg)",
				d: "M20 8h24v6c0 9-5.4 16-12 16S20 23 20 14V8z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "26",
				y: "30",
				width: "12",
				height: "10",
				rx: "2",
				fill: "#E69300"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "18",
				y: "40",
				width: "28",
				height: "6",
				rx: "2",
				fill: "#B36A00"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M20 12H12v4c0 5 4 9 9 9",
				fill: "none",
				stroke: "#E69300",
				strokeWidth: "3"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M44 12h8v4c0 5-4 9-9 9",
				fill: "none",
				stroke: "#E69300",
				strokeWidth: "3"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
				fill: "#FFF3B0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M32 14l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z" })
			})
		]
	});
}
function CheckoutSummaryCard({ tier }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
		initial: {
			opacity: 0,
			y: 12
		},
		animate: {
			opacity: 1,
			y: 0
		},
		transition: { duration: .2 },
		className: "checkout-summary-card relative mt-5 flex items-center gap-4 overflow-hidden rounded-3xl border border-[#FF6B0033] bg-gradient-to-br from-[#FFF9F4] via-[#FFF6EE] to-[#FFEDE3] p-4 font-[Tajawal]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "checkout-summary-shine",
				"aria-hidden": true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-b from-[#1E293B] to-[#0F172A] shadow-[0_8px_20px_-8px_rgba(15,23,42,0.55)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrophySvg, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-[#FF6B00] text-white shadow-[0_4px_10px_-2px_rgba(255,107,0,0.55)]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
						className: "h-3.5 w-3.5",
						strokeWidth: 3.5,
						"aria-hidden": true
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative min-w-0 flex-1 text-right",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[10.5px] font-bold text-neutral-500",
						children: "الباقة المختارة"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-0.5 text-[17px] font-extrabold tracking-tight text-[#0F172A]",
						children: tier.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 text-[11px] leading-snug text-neutral-500",
						children: [
							PRODUCT_SUMMARY.duration,
							" · ",
							PRODUCT_SUMMARY.type
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative shrink-0 border-r border-orange-200/80 pr-2 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[10px] font-bold text-neutral-500",
						children: "السعر الإجمالي"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 text-[26px] font-extrabold leading-none text-[#FF6B00]",
						children: tier.totalPrice
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 text-[10px] font-bold text-neutral-500",
						children: "USD · دفعة واحدة"
					})
				]
			})
		]
	});
}
function PaymentMethodOption({ id, name, description, selected, disabled, badge, icon, index = 0, onSelect }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.button, {
		type: "button",
		initial: {
			opacity: 0,
			y: 6
		},
		animate: {
			opacity: 1,
			y: 0
		},
		transition: {
			duration: .18,
			delay: index * .04
		},
		whileTap: { scale: disabled ? 1 : .99 },
		disabled,
		"aria-pressed": selected,
		"aria-disabled": disabled,
		onClick: () => !disabled && onSelect(id),
		className: cn("flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-start transition-all", disabled && "cursor-not-allowed opacity-55", selected && !disabled ? "border-2 border-[#FF5A1F] bg-[#FFF8F4] shadow-[0_4px_14px_-8px_rgba(255,90,31,0.35)]" : "border border-[#E8E8E8] bg-white"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
				className: "h-4 w-4 shrink-0 text-[#C4C4C4]",
				"aria-hidden": true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-end gap-2",
					children: [badge ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("rounded-md px-2 py-0.5 text-[10px] font-extrabold", badge.tone === "available" ? "bg-[#DCFCE7] text-[#16A34A]" : "bg-[#FFF1E6] text-[#FF6B00]"),
						children: badge.label
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[15px] font-bold text-[#0F172A]",
						children: name
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-right text-[11.5px] leading-[1.5] text-[#6B7280]",
					children: description
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex shrink-0 items-center gap-2.5",
				children: [!disabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("flex h-5 w-5 items-center justify-center rounded-full border-2", selected ? "border-[#FF5A1F]" : "border-[#D1D5DB]"),
					"aria-hidden": true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("h-2 w-2 rounded-full transition-all", selected ? "scale-100 bg-[#FF5A1F]" : "scale-0") })
				}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid h-11 w-11 place-items-center rounded-xl bg-[#F3F4F6]",
					children: icon
				})]
			})
		]
	});
}
function ReceiptUploadSection({ onSubmit, submitted, loading }) {
	const [file, setFile] = (0, import_react.useState)(null);
	const sectionRef = (0, import_react.useRef)(null);
	const fileInputRef = (0, import_react.useRef)(null);
	const cameraInputRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		sectionRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "nearest"
		});
	}, []);
	const pickFile = (f) => setFile(f);
	const handleSubmit = async () => {
		if (!file || loading || submitted) return;
		await onSubmit(file);
	};
	if (submitted) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		ref: sectionRef,
		className: "mt-4 rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] p-5 text-center",
		"aria-live": "polite",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#16A34A] text-white",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
					className: "h-6 w-6",
					strokeWidth: 3
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-3 font-[Tajawal] text-[16px] font-black text-[#14532D]",
				children: "تم استلام إيصال التحويل"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-[12.5px] leading-[1.75] text-[#166534]",
				children: [
					"سيتم التحقق من عملية الدفع خلال أقل من 24 ساعة.",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
					"ستصلك رسالة عبر البريد الإلكتروني عند تفعيل اشتراكك."
				]
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		ref: sectionRef,
		className: "mt-4 rounded-2xl border border-[#ECECEC] bg-white p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-end gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-[Tajawal] text-[16px] font-black text-[#0F172A]",
					children: "📤 رفع إيصال التحويل"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, {
					className: "h-5 w-5 text-[#FF6B00]",
					"aria-hidden": true
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-right text-[12px] font-bold text-[#16A34A]",
				children: "تم تسجيل طلب الدفع."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-right text-[11.5px] leading-relaxed text-neutral-500",
				children: "الخطوة الأخيرة هي رفع إيصال التحويل البنكي حتى نتمكن من مراجعة العملية."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-4 border-t border-[#ECECEC]" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => fileInputRef.current?.click(),
				disabled: loading,
				className: "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] text-[14px] font-bold text-white active:scale-[0.99] disabled:opacity-50",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileUp, { className: "h-4 w-4" }), "اختر صورة أو PDF"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "my-3 text-center text-[11px] font-medium text-neutral-400",
				children: "أو"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => cameraInputRef.current?.click(),
				disabled: loading,
				className: "flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] text-[14px] font-bold text-[#0F172A] active:scale-[0.99] disabled:opacity-50",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "h-4 w-4" }), "📷 التقط صورة للإيصال"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: fileInputRef,
				type: "file",
				accept: "image/*,application/pdf",
				className: "hidden",
				onChange: (e) => pickFile(e.target.files?.[0] ?? null)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: cameraInputRef,
				type: "file",
				accept: "image/*",
				capture: "environment",
				className: "hidden",
				onChange: (e) => pickFile(e.target.files?.[0] ?? null)
			}),
			file ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-4 border-t border-[#ECECEC]" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-xl border border-[#DCFCE7] bg-[#F0FDF4] px-3 py-2.5 text-right",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex items-center justify-end gap-1.5 text-[12px] font-bold text-[#16A34A]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: file.name })]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: loading,
					onClick: () => void handleSubmit(),
					className: "mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B00] text-[14px] font-bold text-white disabled:opacity-50",
					children: loading ? "جاري الإرسال..." : "إرسال الإيصال"
				})
			] }) : null
		]
	});
}
function SecurityBanner({ title = "تحويل بنكي آمن", description = "ادفع إلى حساباتنا الرسمية فقط — لا نشارك بياناتك مع أطراف ثالثة.", className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
		initial: {
			opacity: 0,
			y: 4
		},
		animate: {
			opacity: 1,
			y: 0
		},
		transition: {
			duration: .18,
			delay: .08
		},
		role: "note",
		className: cn("flex items-center gap-2.5 rounded-xl border border-[#D8F3E1]/80 bg-[#F4FFF7]/90 px-2.5 py-2 font-[Tajawal]", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#DCFCE7] text-[#16A34A] ring-1 ring-inset ring-[#BBF7D0]",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
				className: "h-4 w-4",
				strokeWidth: 2.4,
				"aria-hidden": true
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "min-w-0 flex-1 text-start text-[11px] leading-[1.45] text-[#4B5563]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-bold text-[#14532D]",
					children: title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mx-1 text-[#C4C4C4]",
					"aria-hidden": true,
					children: "·"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: description })
			]
		})]
	});
}
var toneStyles = {
	orange: {
		wrap: "bg-[#FFF3ED] text-[#FF5A1F]",
		ring: "ring-[#FFE4D4]"
	},
	green: {
		wrap: "bg-[#ECFDF3] text-[#16A34A]",
		ring: "ring-[#D1FAE5]"
	},
	blue: {
		wrap: "bg-[#EFF6FF] text-[#2563EB]",
		ring: "ring-[#DBEAFE]"
	}
};
function TrustCard({ icon: Icon, title, description, tone = "orange", className }) {
	const styles = toneStyles[tone];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex flex-col items-center px-2 py-1 text-center font-[Tajawal]", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset", styles.wrap, styles.ring),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
					className: "h-5 w-5",
					strokeWidth: 2.2,
					"aria-hidden": true
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[13px] font-bold leading-tight text-[#0F172A]",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-[11px] leading-[1.45] text-[#6B7280]",
				children: description
			})
		]
	});
}
function TrustFeatures({ items, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.section, {
		initial: {
			opacity: 0,
			y: 8
		},
		animate: {
			opacity: 1,
			y: 0
		},
		transition: {
			duration: .2,
			delay: .05
		},
		"aria-label": "مزايا الثقة والأمان",
		className: cn("mt-8 overflow-hidden rounded-2xl border border-[#ECECEC] bg-white checkout-shadow", className),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-3 divide-x divide-[#ECECEC] divide-x-reverse py-4",
			children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrustCard, { ...item }, item.title))
		})
	});
}
var PAYMENT_METHODS = [
	{
		id: "bank",
		name: "تحويل بنكي",
		description: "حوّل المبلغ إلى حسابنا البنكي وارفع إيصال التحويل لتأكيد طلبك.",
		badge: {
			label: "متاح الآن",
			tone: "available"
		},
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Landmark, { className: "h-5 w-5 text-[#64748B]" })
	},
	{
		id: "card",
		name: "بطاقة بنكية",
		description: "الدفع بالبطاقات الائتمانية قريباً",
		disabled: true,
		badge: {
			label: "قريباً",
			tone: "soon"
		},
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "h-5 w-5 text-[#64748B]" })
	},
	{
		id: "paypal",
		name: "PayPal",
		description: "الدفع عبر PayPal قريباً",
		disabled: true,
		badge: {
			label: "قريباً",
			tone: "soon"
		},
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "text-[11px] font-black tracking-tight text-[#003087]",
			children: ["Pay", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[#009CDE]",
				children: "Pal"
			})]
		})
	},
	{
		id: "crypto",
		name: "العملات الرقمية",
		description: "دعم العملات الرقمية قريباً",
		disabled: true,
		badge: {
			label: "قريباً",
			tone: "soon"
		},
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bitcoin, { className: "h-5 w-5 text-[#F7931A]" })
	}
];
function CheckoutScreen({ tier, total = 17, onBack }) {
	const [method, setMethod] = (0, import_react.useState)("bank");
	const [bankModalOpen, setBankModalOpen] = (0, import_react.useState)(false);
	const [transferConfirmed, setTransferConfirmed] = (0, import_react.useState)(false);
	const [receiptSubmitted, setReceiptSubmitted] = (0, import_react.useState)(false);
	const [legalAccepted, setLegalAccepted] = (0, import_react.useState)(false);
	const [transferSaving, setTransferSaving] = (0, import_react.useState)(false);
	const [receiptSaving, setReceiptSaving] = (0, import_react.useState)(false);
	const amount = Number(tier.totalPrice);
	const credentials = getLeadCredentials();
	const handleTransferDone = async (bankId) => {
		setBankModalOpen(false);
		setTransferConfirmed(true);
		if (!credentials) return;
		setTransferSaving(true);
		try {
			await saveSelectedPlan(credentials, {
				tierId: tier.id,
				tierName: tier.name,
				planPrice: amount,
				trainingMode: "online"
			});
			await savePaymentMethod(credentials, {
				method: mapBankToPaymentMethod(bankId),
				amount,
				currency: "USD"
			});
		} catch (error) {
			console.error(error);
		} finally {
			setTransferSaving(false);
		}
	};
	const handleProofSubmit = async (file) => {
		if (!credentials) {
			alert("تعذر العثور على بيانات طلبك. ارجع خطوة وأكمل النموذج مرة أخرى.");
			return;
		}
		setReceiptSaving(true);
		try {
			await submitPaymentProof(credentials, file);
			setReceiptSubmitted(true);
		} catch (error) {
			console.error(error);
			alert("حدث خطأ أثناء إرسال الإيصال. حاول مرة أخرى.");
		} finally {
			setReceiptSaving(false);
		}
	};
	const handlePayClick = () => {
		if (receiptSubmitted || transferConfirmed || !legalAccepted || transferSaving) return;
		if (method === "bank") setBankModalOpen(true);
	};
	const ctaDisabled = !legalAccepted || transferSaving || receiptSaving || receiptSubmitted || transferConfirmed;
	const ctaLabel = receiptSubmitted ? "قيد مراجعة الدفع" : transferSaving ? "جاري التسجيل..." : receiptSaving ? "جاري الإرسال..." : "إتمام الدفع";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		dir: "rtl",
		lang: "ar",
		className: "h-full w-full overflow-y-auto bg-[#FAFAFA] font-[Cairo,Tajawal,sans-serif]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto w-full max-w-md px-5 pb-[34px]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pb-3 pt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: onBack,
								className: "flex items-center gap-1 text-[13px] font-bold text-neutral-500 active:scale-95",
								"aria-label": "رجوع",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
									className: "h-4 w-4",
									"aria-hidden": true
								}), "رجوع"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-[12px] font-extrabold text-[#FF6B00]",
								children: [
									total,
									" من ",
									total
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex w-12 items-center justify-end gap-1.5 text-[10.5px] font-extrabold text-[#16A34A]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
									className: "h-3.5 w-3.5",
									"aria-hidden": true
								}), "آمن"]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex gap-1.5",
						children: Array.from({ length: total }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-1.5 flex-1 rounded-full bg-[#FF6B00]" }, i))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 text-center font-[Tajawal]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "text-[24px] font-black tracking-tight text-[#0F172A]",
						children: [
							"أكمل ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[#FF6B00]",
								children: "طلبك"
							}),
							" الآن"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1.5 text-[12.5px] leading-relaxed text-neutral-500",
						children: "اختر طريقة الدفع المناسبة وأكمل خطوات التحويل"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckoutSummaryCard, { tier }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-6",
					"aria-labelledby": "payment-methods-title",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex items-center justify-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
							className: "h-4 w-4 text-[#FF5A1F]",
							"aria-hidden": true
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							id: "payment-methods-title",
							className: "text-[17px] font-bold leading-tight text-[#0F172A]",
							children: "اختر طريقة الدفع"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-2",
						role: "radiogroup",
						"aria-label": "طرق الدفع",
						children: PAYMENT_METHODS.map((option, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentMethodOption, {
							id: option.id,
							name: option.name,
							description: option.description,
							selected: method === option.id,
							disabled: option.disabled,
							badge: option.badge,
							icon: option.icon,
							index: i,
							onSelect: setMethod
						}, option.id))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex items-start gap-2.5 rounded-2xl border border-[#ECECEC] bg-[#F9FAFB] px-3.5 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
						className: "mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]",
						"aria-hidden": true
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11.5px] leading-[1.65] text-neutral-600",
						children: "بعد رفع إيصال التحويل سيتم مراجعته وتفعيل اشتراكك وإرسال رسالة تأكيد عبر البريد الإلكتروني."
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2.5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SecurityBanner, {})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 rounded-2xl border border-[#ECECEC] bg-white p-3.5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgreementCheckbox, {
						checked: legalAccepted,
						onChange: setLegalAccepted
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.button, {
						type: "button",
						disabled: ctaDisabled,
						whileTap: { scale: ctaDisabled ? 1 : .98 },
						onClick: handlePayClick,
						className: `flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[17px] font-bold transition checkout-cta-shadow disabled:cursor-not-allowed disabled:opacity-60 ${receiptSubmitted ? "bg-[#16A34A] text-white" : "bg-[#FF5A1F] text-white"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
							className: "h-5 w-5",
							"aria-hidden": true
						}), ctaLabel]
					}), transferConfirmed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReceiptUploadSection, {
						onSubmit: handleProofSubmit,
						submitted: receiptSubmitted,
						loading: receiptSaving
					}) : null]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrustFeatures, { items: [
					{
						icon: Headphones,
						title: "دعم مباشر",
						description: "نرد خلال 24 ساعة",
						tone: "orange"
					},
					{
						icon: Shield,
						title: "تحويل آمن",
						description: "حسابات رسمية للشركة",
						tone: "green"
					},
					{
						icon: Clock,
						title: "تفعيل سريع",
						description: "بعد تأكيد الدفع",
						tone: "blue"
					}
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckoutFooter, {})
			]
		}), bankModalOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BankTransferModal, {
			tierPriceUsd: tier.totalPrice,
			onClose: () => setBankModalOpen(false),
			onTransferDone: (bankId) => void handleTransferDone(bankId)
		}) : null]
	});
}
var ذكر_default = "/assets/%D8%B0%D9%83%D8%B1-BKVowxgR.png";
var آنثى_default = "/assets/%D8%A2%D9%86%D8%AB%D9%89-KAWfG-Vn.png";
var coach_default = "/assets/coach-BIPmcWDQ.png";
var خسارة_الدهون_default = "/assets/%D8%AE%D8%B3%D8%A7%D8%B1%D8%A9%20%D8%A7%D9%84%D8%AF%D9%87%D9%88%D9%86-COMM0BSy.jpg";
var بناء_العضلات_default = "/assets/%D8%A8%D9%86%D8%A7%D8%A1%20%D8%A7%D9%84%D8%B9%D8%B6%D9%84%D8%A7%D8%AA-BYdK9eew.webp";
var تحسين_اللياقة_والطاقة_default = "/assets/%D8%AA%D8%AD%D8%B3%D9%8A%D9%86%20%D8%A7%D9%84%D9%84%D9%8A%D8%A7%D9%82%D8%A9%20%D9%88%D8%A7%D9%84%D8%B7%D8%A7%D9%82%D8%A9-DXgPoeiw.PNG";
var جسم_رياضي_ومتناسق_default = "/assets/%D8%AC%D8%B3%D9%85%20%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%20%D9%88%D9%85%D8%AA%D9%86%D8%A7%D8%B3%D9%82-DOYjakbf.PNG";
var تغير_شكل_الجسم_default = "/assets/%D8%AA%D8%BA%D9%8A%D8%B1%20%D8%B4%D9%83%D9%84%20%D8%A7%D9%84%D8%AC%D8%B3%D9%85-BqYqs_YX.jpg";
var زيادة_وزن_صحي_default = "/assets/%D8%B2%D9%8A%D8%A7%D8%AF%D8%A9%20%D9%88%D8%B2%D9%86%20%D8%B5%D8%AD%D9%8A-C5BXtAdV.jpg";
var مشكلة_دهون_البطن_للرجال_default = "/assets/%D9%85%D8%B4%D9%83%D9%84%D8%A9%20%D8%AF%D9%87%D9%88%D9%86%20%D8%A7%D9%84%D8%A8%D8%B7%D9%86%20%D9%84%D9%84%D8%B1%D8%AC%D8%A7%D9%84-BIC9ESvm.png";
var صعوبة_في_بناء_العضلات_default = "/assets/%D8%B5%D8%B9%D9%88%D8%A8%D8%A9%20%D9%81%D9%8A%20%D8%A8%D9%86%D8%A7%D8%A1%20%D8%A7%D9%84%D8%B9%D8%B6%D9%84%D8%A7%D8%AA-CUNAPxyf.jpeg";
var قلة_الطاقة_والحيوية_default = "/assets/%D9%82%D9%84%D8%A9.%D8%A7%D9%84%D8%B7%D8%A7%D9%82%D8%A9%20%D9%88%D8%A7%D9%84%D8%AD%D9%8A%D9%88%D9%8A%D8%A9-Dv14pRMp.png";
var عدم_وضوح_الهدف_default = "/assets/%D8%B9%D8%AF%D9%85%20%D9%88%D8%B6%D9%88%D8%AD%20%D8%A7%D9%84%D9%87%D8%AF%D9%81-Byk2vezI.png";
var الالتزام_والاستمرارية_default = "/assets/%D8%A7%D9%84%D8%A7%D9%84%D8%AA%D8%B2%D8%A7%D9%85%20%D9%88%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%85%D8%B1%D8%A7%D8%B1%D9%8A%D8%A9-BdKrA0vb.png";
var الثقة_بالنفس_والمظهر_default = "/assets/%D8%A7%D9%84%D8%AB%D9%82%D8%A9%20%D8%A8%D8%A7%D9%84%D9%86%D9%81%D8%B3%20%D9%88%D8%A7%D9%84%D9%85%D8%B8%D9%87%D8%B1-CtBUXa1F.png";
var الكرش_و_الدهون_البطن_default = "/assets/%D8%A7%D9%84%D9%83%D8%B1%D8%B4%20%D9%88%20%D8%A7%D9%84%D8%AF%D9%87%D9%88%D9%86%20%D8%A7%D9%84%D8%A8%D8%B7%D9%86-DEdvswt9.jpg";
var شكل_المؤخرة_default = "/assets/%D8%B4%D9%83%D9%84%20%D8%A7%D9%84%D9%85%D8%A4%D8%AE%D8%B1%D8%A9-Daf7pRBq.JPG";
var ترهلات_الجسم_للبنات_default = "/assets/%D8%AA%D8%B1%D9%87%D9%84%D8%A7%D8%AA%20%D8%A7%D9%84%D8%AC%D8%B3%D9%85%20%D9%84%D9%84%D8%A8%D9%86%D8%A7%D8%AA-8wLr6oiM.jpg";
var عدم_الثقة_بالنفس_للبنات_default = "/assets/%D8%B9%D8%AF%D9%85%20%D8%A7%D9%84%D8%AB%D9%82%D8%A9%20%D8%A8%D8%A7%D9%84%D9%86%D9%81%D8%B3%20%D9%84%D9%84%D8%A8%D9%86%D8%A7%D8%AA-CGH_AACI.png";
var عدم_تناسق_الجسم_default = "/assets/%D8%B9%D8%AF%D9%85%20%D8%AA%D9%86%D8%A7%D8%B3%D9%82%20%D8%A7%D9%84%D8%AC%D8%B3%D9%85-Bul8AbAh.jpg";
var عدم_تناسق_الارداف_default = "/assets/%D8%B9%D8%AF%D9%85%20%D8%AA%D9%86%D8%A7%D8%B3%D9%82%20%D8%A7%D9%84%D8%A7%D8%B1%D8%AF%D8%A7%D9%81-Dzq9yH61.jpg";
var جسم_يحتاج_شد_default = "/assets/%D8%AC%D8%B3%D9%85%20%D9%8A%D8%AD%D8%AA%D8%A7%D8%AC%20%D8%B4%D8%AF-DVjUUMYN.png";
var كرش_خفيفة_default = "/assets/%D9%83%D8%B1%D8%B4%20%D8%AE%D9%81%D9%8A%D9%81%D8%A9-DMSwcMGN.png";
var fbody_slim_default = "/assets/fbody-slim-Z8X-NHHI.jpg";
var fbody_athletic_default = "/assets/fbody-athletic-CoZMsJyo.jpg";
var fbody_overweight_default = "/assets/fbody-overweight-COgvi1CS.jpg";
var خسارة_دهون_للبنات_default = "/assets/%D8%AE%D8%B3%D8%A7%D8%B1%D8%A9%20%D8%AF%D9%87%D9%88%D9%86%20%D9%84%D9%84%D8%A8%D9%86%D8%A7%D8%AA-CDfYA_c_.JPG";
var glute_growth_default = "/assets/glute-growth-B3hXYJl5.png";
var خصر_انحف_ومشدود_default = "/assets/%D8%AE%D8%B5%D8%B1%20%D8%A7%D9%86%D8%AD%D9%81%20%D9%88%D9%85%D8%B4%D8%AF%D9%88%D8%AF-BXgAjdRr.png";
var feminine_toned_body_default = "/assets/feminine-toned-body-ULTMdfL-.png";
var جسم_صحي_ورياضي_للبنات_default = "/assets/%D8%AC%D8%B3%D9%85%20%D8%B5%D8%AD%D9%8A%20%D9%88%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%20%D9%84%D9%84%D8%A8%D9%86%D8%A7%D8%AA-D1R1oUOx.png";
var تحسين_شكل_الصدر_default = "/assets/%D8%AA%D8%AD%D8%B3%D9%8A%D9%86%20%D8%B4%D9%83%D9%84%20%D8%A7%D9%84%D8%B5%D8%AF%D8%B1-BNPobXQ4.jpg";
var قبل_شاشة_12_المؤخرة_default = "/assets/%D9%82%D8%A8%D9%84%20%D8%B4%D8%A7%D8%B4%D8%A9%2012%20%D8%A7%D9%84%D9%85%D8%A4%D8%AE%D8%B1%D8%A9%201-BswI5UL8.jpg";
var قبل_شاشة_12_المؤخرة_1_default = "/assets/%D9%82%D8%A8%D9%84%20%D8%B4%D8%A7%D8%B4%D8%A9%2012%20%D8%A7%D9%84%D9%85%D8%A4%D8%AE%D8%B1%D8%A9%201-BswI5UL8.jpg";
var قبل_شاشة_12_المؤخرة_2_default = "/assets/%D9%82%D8%A8%D9%84%20%D8%B4%D8%A7%D8%B4%D8%A9%2012%20%D8%A7%D9%84%D9%85%D8%A4%D8%AE%D8%B1%D8%A9%201-BswI5UL8.jpg";
var قبل_شاشة_12_المؤخرة_3_default = "/assets/%D9%82%D8%A8%D9%84%20%D8%B4%D8%A7%D8%B4%D8%A9%2012%20%D8%A7%D9%84%D9%85%D8%A4%D8%AE%D8%B1%D8%A9%201-BswI5UL8.jpg";
var قبل_شاشة_12_المؤخرة_4_default = "/assets/%D9%82%D8%A8%D9%84%20%D8%B4%D8%A7%D8%B4%D8%A9%2012%20%D8%A7%D9%84%D9%85%D8%A4%D8%AE%D8%B1%D8%A9%201-BswI5UL8.jpg";
var بعد_شاشة_12_المؤخرة_default = "/assets/%D8%A8%D8%B9%D8%AF%20%D8%B4%D8%A7%D8%B4%D8%A9%2012%20%D8%A7%D9%84%D9%85%D8%A4%D8%AE%D8%B1%D8%A9-wpBAPdbL.jpg";
var بعد_شاشة_12_المؤخرة_1_default = "/assets/%D8%A8%D8%B9%D8%AF%20%D8%B4%D8%A7%D8%B4%D8%A9%2012%20%D8%A7%D9%84%D9%85%D8%A4%D8%AE%D8%B1%D8%A9-wpBAPdbL.jpg";
var بعد_شاشة_12_المؤخرة_2_default = "/assets/%D8%A8%D8%B9%D8%AF%20%D8%B4%D8%A7%D8%B4%D8%A9%2012%20%D8%A7%D9%84%D9%85%D8%A4%D8%AE%D8%B1%D8%A9-wpBAPdbL.jpg";
var بعد_شاشة_12_المؤخرة_3_default = "/assets/%D8%A8%D8%B9%D8%AF%20%D8%B4%D8%A7%D8%B4%D8%A9%2012%20%D8%A7%D9%84%D9%85%D8%A4%D8%AE%D8%B1%D8%A9-wpBAPdbL.jpg";
var بعد_شاشة_12_المؤخرة_4_default = "/assets/%D8%A8%D8%B9%D8%AF%20%D8%B4%D8%A7%D8%B4%D8%A9%2012%20%D8%A7%D9%84%D9%85%D8%A4%D8%AE%D8%B1%D8%A9-wpBAPdbL.jpg";
var سندويش_المقارنة_default = "/assets/%D8%B3%D9%86%D8%AF%D9%88%D9%8A%D8%B4%20%D8%A7%D9%84%D9%85%D9%82%D8%A7%D8%B1%D9%86%D8%A9-C4pwHzne.png";
var body_very_skinny_default = "/assets/body-very-skinny-DfHgEwJL.jpg";
var body_lean_default = "/assets/body-lean-CqHp6z19.jpg";
var body_skinny_fat_default = "/assets/body-skinny-fat-Ykep_DEn.jpg";
var body_average_default = "/assets/body-average-DeODgUDX.jpg";
var body_overweight_default = "/assets/body-overweight-D_ThJNGl.jpg";
var body_muscular_default = "/assets/body-muscular-DUx6xA0k.jpg";
var REVEAL_GLUTES_BEFORE = [
	قبل_شاشة_12_المؤخرة_default,
	قبل_شاشة_12_المؤخرة_1_default,
	قبل_شاشة_12_المؤخرة_2_default,
	قبل_شاشة_12_المؤخرة_3_default,
	قبل_شاشة_12_المؤخرة_4_default
];
var REVEAL_GLUTES_AFTER = [
	بعد_شاشة_12_المؤخرة_default,
	بعد_شاشة_12_المؤخرة_1_default,
	بعد_شاشة_12_المؤخرة_2_default,
	بعد_شاشة_12_المؤخرة_3_default,
	بعد_شاشة_12_المؤخرة_4_default
];
var FONT = "'Tajawal', sans-serif";
function QuizPage() {
	const { step, phase, transitionTo, selectAndGo, goBack, gender, setGender, userName, setUserName, userPhone, setUserPhone, userCity, setUserCity, goalId, setGoalId, challengeId, setChallengeId, age, setAge, heightCm, setHeightCm, weightKg, setWeightKg, activityLevel, setActivityLevel, investment, setInvestment, bodyType, setBodyType, userLocation, setUserLocation, selectedTierId, setSelectedTierId } = useQuizProgress();
	const quizAnswers = {
		gender,
		goalId,
		challengeId,
		age,
		heightCm,
		weightKg,
		activityLevel,
		investment,
		bodyType
	};
	const totalSteps = userLocation === "dubai" ? 15 : 14;
	const afterReveal = () => selectAndGo(userLocation === "dubai" ? "trainingType" : "pricing");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		dir: "rtl",
		lang: "ar",
		style: {
			fontFamily: FONT,
			backgroundColor: "#FAF8F5"
		},
		className: "fixed inset-0 w-full h-[100dvh] overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("link", {
			rel: "stylesheet",
			href: "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Cairo:wght@700;800;900&display=swap"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MotionStepView, {
			phase,
			children: [
				step === "loading" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingScreen, { onDone: () => transitionTo("gender") }),
				step === "gender" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GenderScreen, { onSelect: (g) => selectAndGo(g === "male" ? "goals" : "femaleGoals", () => setGender(g)) }),
				step === "goals" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoalsScreen, {
					onBack: () => goBack("gender"),
					onNext: () => transitionTo("age"),
					onSelect: setGoalId
				}),
				step === "femaleGoals" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FemaleGoalsScreen, {
					onBack: () => goBack("gender"),
					onNext: () => transitionTo("age"),
					onSelect: setGoalId
				}),
				step === "age" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AgeScreen, {
					onBack: () => goBack("gender"),
					onNext: (value) => selectAndGo("measure", () => setAge(value)),
					initialAge: age ?? 24,
					onAgeChange: setAge
				}),
				step === "measure" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MeasureScreen, {
					onBack: () => goBack("age"),
					initialHeight: heightCm ?? 164,
					initialWeight: weightKg ?? 63,
					onHeightChange: setHeightCm,
					onWeightChange: setWeightKg,
					onNext: (height, weight) => selectAndGo("activity", () => {
						setHeightCm(height);
						setWeightKg(weight);
					})
				}),
				step === "activity" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActivityScreen, {
					onBack: () => goBack("measure"),
					onNext: (value) => selectAndGo(gender === "female" ? "femaleChallenge" : "challenge", () => setActivityLevel(value))
				}),
				step === "challenge" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChallengeScreen, {
					onBack: () => goBack("activity"),
					onNext: () => selectAndGo("investment"),
					onSelect: setChallengeId
				}),
				step === "femaleChallenge" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FemaleChallengeScreen, {
					onBack: () => goBack("activity"),
					onNext: () => selectAndGo("investment"),
					onSelect: setChallengeId
				}),
				step === "investment" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InvestmentScreen, {
					onBack: () => goBack(gender === "female" ? "femaleChallenge" : "challenge"),
					onNext: (value) => selectAndGo(gender === "female" ? "femaleBodyType" : "bodyType", () => setInvestment(value))
				}),
				step === "bodyType" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BodyTypeScreen, {
					onBack: () => goBack("investment"),
					onNext: (value) => selectAndGo("analysis", () => setBodyType(value))
				}),
				step === "femaleBodyType" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FemaleBodyTypeScreen, {
					onBack: () => goBack("investment"),
					onNext: (value) => selectAndGo("analysis", () => setBodyType(value))
				}),
				step === "analysis" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnalysisScreen, {
					onBack: () => goBack(gender === "female" ? "femaleBodyType" : "bodyType"),
					onDone: () => transitionTo("contact")
				}),
				step === "contact" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContactScreen, {
					quizAnswers,
					onBack: () => goBack(gender === "female" ? "femaleBodyType" : "bodyType"),
					onDone: (name, isDubai, phone, city) => selectAndGo("congrats", () => {
						setUserName(name);
						setUserPhone(phone);
						setUserCity(city);
						setUserLocation(isDubai ? "dubai" : "remote");
					})
				}),
				step === "congrats" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CongratsScreen, {
					name: userName,
					gender,
					total: totalSteps,
					onNext: () => selectAndGo("reveal")
				}),
				step === "reveal" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgramRevealScreen, {
					name: userName,
					gender,
					goalId,
					challengeId,
					total: totalSteps,
					onNext: afterReveal
				}),
				step === "trainingType" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrainingTypeScreen, {
					onBack: () => goBack("reveal"),
					onSelect: (t) => transitionTo(t === "inperson" ? "offlinePackages" : "pricing")
				}),
				step === "pricing" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PricingScreen, {
					name: userName,
					total: totalSteps,
					onBack: () => goBack(userLocation === "dubai" ? "trainingType" : "reveal"),
					onSelectTier: (id) => transitionTo("payment", () => setSelectedTierId(id))
				}),
				step === "pricingDubai" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PricingScreen, {
					name: userName,
					total: totalSteps,
					onBack: () => goBack("trainingType"),
					dubai: true,
					onSelectTier: (id) => transitionTo("payment", () => setSelectedTierId(id))
				}),
				step === "offlinePackages" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfflinePackagesScreen, {
					name: userName,
					phone: userPhone,
					city: userCity,
					goalId,
					challengeId,
					total: totalSteps,
					onBack: () => goBack("trainingType")
				}),
				step === "payment" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentScreen, {
					name: userName,
					tierId: selectedTierId,
					total: totalSteps,
					onBack: () => goBack(userLocation === "dubai" ? "pricingDubai" : "pricing")
				})
			]
		})]
	});
}
function LoadingScreen({ onDone }) {
	const steps = [
		"تحليل الأهداف",
		"تخصيص الأسئلة",
		"إعداد الخطة المناسبة"
	];
	const [done, setDone] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		const timers = [
			setTimeout(() => setDone(1), 500),
			setTimeout(() => setDone(2), 1050),
			setTimeout(() => setDone(3), 1600),
			setTimeout(onDone, 2100)
		];
		return () => timers.forEach(clearTimeout);
	}, [onDone]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative w-full h-full flex flex-col items-center justify-center px-8 text-center animate-[fadeIn_.4s_ease-out]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 opacity-60",
				style: { background: "radial-gradient(ellipse at top, rgba(255,107,0,0.12), transparent 60%), radial-gradient(ellipse at bottom, rgba(255,107,0,0.08), transparent 60%)" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 rounded-full blur-2xl opacity-50",
					style: { background: "#FF6B00" }
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative grid place-items-center h-28 w-28 rounded-full shadow-[0_20px_60px_-15px_rgba(255,107,0,0.6)]",
					style: { background: "linear-gradient(135deg,#FF8534,#FF6B00)" },
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute inset-0 rounded-full border-4 border-white/30 animate-[spin_2s_linear_infinite]",
						style: {
							borderTopColor: "transparent",
							borderRightColor: "transparent"
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dumbbell, {
						className: "h-12 w-12 text-white",
						strokeWidth: 2.4
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "relative mt-10 text-2xl font-black text-neutral-900",
				children: "جاري تجهيز تقييمك الشخصي"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "relative mt-3 text-sm text-neutral-500 max-w-xs leading-loose",
				children: "نقوم بتحليل بياناتك لإنشاء تجربة مخصصة بالكامل"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "relative mt-10 space-y-3 w-full max-w-xs",
				children: steps.map((s, i) => {
					const active = done > i;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: `flex items-center justify-end gap-3 rounded-2xl px-4 py-3 transition-all duration-500 ${active ? "bg-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.1)]" : "bg-white/40"}`,
						style: {
							opacity: done >= i ? 1 : .4,
							transform: active ? "translateY(0)" : "translateY(4px)"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-bold text-neutral-800",
							children: s
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `grid h-6 w-6 place-items-center rounded-full transition-all ${active ? "scale-100" : "scale-90"}`,
							style: { background: active ? "#FF6B00" : "#E5E5E5" },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
								className: "h-3.5 w-3.5 text-white",
								strokeWidth: 3.5
							})
						})]
					}, s);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `@keyframes fadeIn{from{opacity:0}to{opacity:1}}` })
		]
	});
}
function ProgressHeader({ current, total = 13, onBack }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: onBack,
				className: "grid h-10 w-10 place-items-center rounded-full bg-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] ring-1 ring-black/5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-5 w-5 text-neutral-700" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-sm font-bold text-neutral-800",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						style: { color: "#FF6B00" },
						children: current
					}),
					" من ",
					total
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-10" })
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-3 flex gap-1.5",
		children: Array.from({ length: total }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex-1 h-1.5 rounded-full",
			style: { background: i < current ? "#FF6B00" : "rgba(0,0,0,0.1)" }
		}, i))
	})] });
}
function GymBackdrop() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0",
			style: {
				backgroundImage: `url(${quiz_gym_bg_default})`,
				backgroundSize: "cover",
				backgroundPosition: "center",
				opacity: .3
			}
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0",
			style: { background: "linear-gradient(180deg,#FAF8F5 0%,rgba(250,248,245,0.75) 40%,rgba(250,248,245,0.9) 100%)" }
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute top-2 right-2 grid grid-cols-8 gap-1.5 opacity-30",
			style: { direction: "ltr" },
			children: Array.from({ length: 40 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "h-1 w-1 rounded-full",
				style: { background: "#FF6B00" }
			}, i))
		})
	] });
}
function GenderScreen({ onSelect }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative w-full h-full flex flex-col animate-[fadeIn_.5s_ease-out]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GymBackdrop, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex flex-col h-full px-5 pt-3 pb-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressHeader, { current: 1 }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
								className: "text-2xl sm:text-3xl font-black text-neutral-900 leading-tight",
								children: ["لنبدأ رحلتك مع ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									style: { color: "#FF6B00" },
									children: "حكيم"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-3 text-xl sm:text-2xl font-bold text-neutral-900 leading-snug",
								children: "ما هو جنسك؟"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-neutral-500 leading-relaxed px-2",
								children: "هذا يساعدنا على تخصيص تجربتك بشكل أفضل"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid grid-cols-2 gap-3 flex-1 min-h-0 items-start content-start",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GenderCard, {
							image: ذكر_default,
							label: "ذكر",
							color: "#3B82F6",
							tintFrom: "#DDEAF8",
							tintTo: "#F5F9FF",
							symbol: "♂",
							enterVariant: "male",
							enterDelay: 120,
							onClick: () => onSelect("male"),
							features: [
								{
									Icon: Dumbbell,
									text: "بناء عضلات"
								},
								{
									Icon: Zap,
									text: "زيادة القوة"
								},
								{
									Icon: PersonStanding,
									text: "جسم رياضي"
								}
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GenderCard, {
							image: آنثى_default,
							label: "أنثى",
							color: "#EC4899",
							tintFrom: "#FADCE8",
							tintTo: "#FFF5F9",
							symbol: "♀",
							enterVariant: "female",
							enterDelay: 260,
							onClick: () => onSelect("female"),
							features: [
								{
									Icon: Dumbbell,
									text: "شد الجسم"
								},
								{
									Icon: Flame,
									text: "خسارة الدهون"
								},
								{
									Icon: PersonStanding,
									text: "جسم متناسق"
								}
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "gender-footer-enter mt-3 rounded-2xl bg-white/70 backdrop-blur ring-1 ring-black/5 px-4 py-3 flex items-center justify-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid h-7 w-7 place-items-center rounded-lg",
							style: { background: "#FF6B00" },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-3.5 w-3.5 text-white" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[12px] text-neutral-700 font-medium",
							children: [
								"اختيارك يساعدني على بناء ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold",
									style: { color: "#FF6B00" },
									children: "تجربة مناسبة"
								}),
								" لك."
							]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        @keyframes genderCardEnterMale {
          0% { opacity: 0; transform: translate(22px, 40px) scale(0.86); }
          55% { opacity: 1; transform: translate(0, -5px) scale(1.03); }
          100% { opacity: 1; transform: translate(0, 0) scale(1); }
        }
        @keyframes genderCardEnterFemale {
          0% { opacity: 0; transform: translate(-22px, 40px) scale(0.86); }
          55% { opacity: 1; transform: translate(0, -5px) scale(1.03); }
          100% { opacity: 1; transform: translate(0, 0) scale(1); }
        }
        @keyframes genderIconPop {
          0% { opacity: 0; transform: scale(0.35); }
          65% { transform: scale(1.14); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes genderImgReveal {
          from { opacity: 0; transform: translateY(18px) scale(0.94); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes genderFeatureSlide {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes genderShimmerSweep {
          from { transform: translateX(-140%); }
          to { transform: translateX(240%); }
        }
        @keyframes genderFooterEnter {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .gender-card-enter-male {
          animation: genderCardEnterMale 0.75s cubic-bezier(0.22, 1.15, 0.36, 1) both;
        }
        .gender-card-enter-female {
          animation: genderCardEnterFemale 0.75s cubic-bezier(0.22, 1.15, 0.36, 1) both;
        }
        .gender-icon-pop {
          animation: genderIconPop 0.55s cubic-bezier(0.34, 1.4, 0.44, 1) both;
        }
        .gender-img-reveal {
          animation: genderImgReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .gender-feature-enter {
          animation: genderFeatureSlide 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .gender-card-shimmer-sweep {
          animation: genderShimmerSweep 0.85s ease-out both;
        }
        .gender-footer-enter {
          animation: genderFooterEnter 0.55s ease-out 0.55s both;
        }
        .gender-card-interactive {
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease;
        }
        .gender-card-interactive:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 20px 44px -18px rgba(15, 23, 42, 0.28);
        }
        .gender-card-interactive:active {
          transform: translateY(-1px) scale(0.98);
        }
        @keyframes genderBorderOrbit {
          to { transform: rotate(360deg); }
        }
        .gender-card-border-orbit {
          animation: genderBorderOrbit 3.8s linear infinite;
        }
        .gender-card-border-orbit-female {
          animation: genderBorderOrbit 4.6s linear infinite reverse;
        }
      ` })
		]
	});
}
function GenderCard({ image, label, color, tintFrom, tintTo, symbol, features, onClick, enterVariant = "male", enterDelay = 0 }) {
	const enterClass = enterVariant === "male" ? "gender-card-enter-male" : "gender-card-enter-female";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "gender-card-wrap relative w-full overflow-hidden rounded-[24px] p-[2px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "pointer-events-none absolute inset-0 overflow-hidden rounded-[24px]",
			"aria-hidden": true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `${enterVariant === "male" ? "gender-card-border-orbit" : "gender-card-border-orbit-female"} absolute left-1/2 top-1/2 h-[200%] w-[200%] -translate-x-1/2 -translate-y-1/2`,
				style: {
					background: `conic-gradient(from 0deg, transparent 0deg, transparent 73%, ${color} 81%, rgba(255,255,255,0.95) 86%, transparent 94%)`,
					animationDelay: `${enterDelay}ms`
				}
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			onClick,
			className: ["gender-card-interactive relative z-10 flex min-h-0 w-full flex-col overflow-hidden rounded-[22px] bg-white text-right shadow-[0_8px_24px_-12px_rgba(15,23,42,0.12)] ring-1 ring-black/[0.05]", enterClass].join(" "),
			style: { animationDelay: `${enterDelay}ms` },
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[22px]",
					"aria-hidden": true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "gender-card-shimmer-sweep absolute inset-y-[-10%] left-0 h-[120%] w-1/2 bg-gradient-to-r from-transparent via-white/45 to-transparent",
						style: { animationDelay: `${enterDelay + 320}ms` }
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex flex-col items-center overflow-hidden px-2 pt-3 pb-0",
					style: { background: `linear-gradient(180deg, ${tintFrom} 0%, ${tintTo} 70%, #ffffff 100%)` },
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							"aria-hidden": true,
							className: "pointer-events-none absolute -left-4 top-6 h-20 w-20 rounded-full opacity-30 blur-md",
							style: { background: color }
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							"aria-hidden": true,
							className: "pointer-events-none absolute -right-3 bottom-8 h-24 w-24 rounded-full opacity-20 blur-lg",
							style: { background: color }
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "gender-icon-pop relative z-10 grid h-10 w-10 place-items-center rounded-full shadow-[0_6px_16px_-4px_rgba(15,23,42,0.18)]",
							style: {
								background: color,
								animationDelay: `${enterDelay + 220}ms`
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[17px] font-black leading-none text-white",
								children: symbol
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "relative z-10 mt-2 text-[15px] font-black",
							style: { color },
							children: label
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "relative z-10 mt-1 h-[2px] w-9 rounded-full",
							style: { background: color }
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: image,
							alt: label,
							loading: "lazy",
							className: "gender-img-reveal relative z-10 mt-1 h-[min(58vw,395px)] w-full object-contain object-bottom",
							style: { animationDelay: `${enterDelay + 380}ms` }
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative z-10 -mt-2 rounded-t-[16px] bg-white px-2.5 pt-2 pb-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-1.5",
						children: features.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "gender-feature-enter flex items-center justify-end gap-2 text-[11px] font-semibold text-neutral-800",
							style: { animationDelay: `${enterDelay + 520 + i * 90}ms` },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: f.text }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-7 w-7 shrink-0 place-items-center rounded-full",
								style: {
									background: `${color}1A`,
									color
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(f.Icon, {
									className: "h-3.5 w-3.5",
									strokeWidth: 2.5
								})
							})]
						}, f.text))
					})
				})
			]
		})]
	});
}
function QuizImageOptionCard({ label, image, active, index, onClick, imageWrapClassName = "relative h-[min(38vw,148px)] w-full overflow-hidden", imageClassName = "h-full w-full object-cover" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: "relative flex min-h-0 flex-col overflow-hidden rounded-[18px] bg-white text-center transition-all active:scale-[0.98]",
		style: {
			border: active ? "2px solid #FF6B00" : "2px solid transparent",
			boxShadow: active ? "0 12px 28px -10px rgba(255,107,0,0.28)" : "0 8px 20px -12px rgba(0,0,0,0.1)",
			animation: `fadeUp .5s ease-out ${index * 70}ms both`
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: imageWrapClassName,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: image,
				alt: label,
				loading: "lazy",
				className: imageClassName
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex shrink-0 items-center justify-center px-1.5 py-0.5 min-h-[26px] text-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] font-black leading-tight",
				style: { color: active ? "#FF6B00" : "#1F1F1F" },
				children: label
			})
		})]
	});
}
var GOALS = [
	{
		id: "fat",
		label: "خسارة الدهون",
		image: خسارة_الدهون_default,
		imageWrapClassName: "male-goal-fat-wrap relative h-[min(38vw,148px)] w-full overflow-hidden",
		imageClassName: "male-goal-fat-img h-full w-full object-cover"
	},
	{
		id: "muscle",
		label: "بناء العضلات",
		image: بناء_العضلات_default,
		imageWrapClassName: "male-goal-muscle-wrap relative h-[min(38vw,148px)] w-full overflow-hidden",
		imageClassName: "male-goal-muscle-img h-full w-full object-cover"
	},
	{
		id: "fitness",
		label: "تحسين اللياقة والطاقة",
		image: تحسين_اللياقة_والطاقة_default,
		imageWrapClassName: "male-goal-fitness-wrap relative h-[min(38vw,148px)] w-full overflow-hidden",
		imageClassName: "male-goal-fitness-img h-full w-full object-cover"
	},
	{
		id: "athletic",
		label: "جسم رياضي ومتناسق",
		image: جسم_رياضي_ومتناسق_default,
		imageWrapClassName: "male-goal-athletic-wrap relative h-[min(38vw,148px)] w-full overflow-hidden",
		imageClassName: "male-goal-athletic-img h-full w-full object-cover"
	},
	{
		id: "shape",
		label: "تغيير شكل الجسم",
		image: تغير_شكل_الجسم_default,
		imageWrapClassName: "male-goal-shape-wrap relative h-[min(38vw,148px)] w-full overflow-hidden",
		imageClassName: "male-goal-shape-img h-full w-full object-cover"
	},
	{
		id: "gain",
		label: "زيادة وزن صحي",
		image: زيادة_وزن_صحي_default,
		imageWrapClassName: "male-goal-gain-wrap relative h-[min(38vw,148px)] w-full overflow-hidden",
		imageClassName: "male-goal-gain-img h-full w-full object-cover"
	}
];
function GoalsScreen({ onBack, onNext, onSelect }) {
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [touched, setTouched] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!touched || !selected) return;
		onSelect?.(selected);
		const t = setTimeout(onNext, 150);
		return () => clearTimeout(t);
	}, [
		touched,
		selected,
		onNext,
		onSelect
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative w-full h-full flex flex-col animate-[fadeIn_.5s_ease-out]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GymBackdrop, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex flex-col h-full px-5 pt-3 pb-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressHeader, {
						current: 2,
						onBack
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xl font-black",
								style: { color: "#FF6B00" },
								children: ["ممتاز ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "inline-block align-middle",
									children: "🤩"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-1 text-[26px] font-black text-neutral-900 leading-tight",
								children: "ما هو هدفك الأساسي؟"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-[13px] text-neutral-500 leading-relaxed px-6",
								children: "اختر الهدف الأقرب لك وسأخصص خطتك بناءً عليه."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 grid grid-cols-2 gap-3 flex-1 min-h-0 content-stretch overflow-y-auto pb-1",
						children: GOALS.map((g, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuizImageOptionCard, {
							label: g.label,
							image: g.image,
							active: selected === g.id,
							index: i,
							imageWrapClassName: g.imageWrapClassName,
							imageClassName: g.imageClassName,
							onClick: () => {
								triggerSelectionHaptic();
								setSelected(g.id);
								setTouched(true);
							}
						}, g.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 mx-auto rounded-full bg-white/80 backdrop-blur ring-1 ring-black/5 px-5 py-3 flex items-center justify-center gap-2 shadow-[0_8px_20px_-12px_rgba(0,0,0,0.1)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-base",
							children: "🎯"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[13px] font-bold text-neutral-800",
							children: "كل هدف يحتاج خطة مختلفة"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      ` })
		]
	});
}
function FeminineBackdrop() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0",
			style: { background: "linear-gradient(180deg, #FFF8F5 0%, #FFF0EC 50%, #FDF0EB 100%)" }
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute -left-16 top-1/4 w-60 h-72 rounded-full blur-3xl opacity-40",
			style: { background: "#FFB5A7" }
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute -right-20 top-1/3 w-56 h-64 rounded-full blur-3xl opacity-30",
			style: { background: "#FFD4C4" }
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute left-1/4 bottom-0 w-48 h-48 rounded-full blur-3xl opacity-25",
			style: { background: "#FFC4B0" }
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute top-2 right-2 grid grid-cols-8 gap-1.5 opacity-20",
			style: { direction: "ltr" },
			children: Array.from({ length: 40 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "h-1 w-1 rounded-full",
				style: { background: "#FF6B00" }
			}, i))
		})
	] });
}
var FEMALE_GOALS = [
	{
		id: "fat",
		label: "خسارة الدهون",
		image: خسارة_دهون_للبنات_default,
		imageWrapClassName: "female-goal-fat-wrap relative h-[min(38vw,148px)] w-full overflow-hidden",
		imageClassName: "female-goal-fat-img h-full w-full object-cover"
	},
	{
		id: "glutes",
		label: "تكبير المؤخرة",
		image: glute_growth_default,
		imageWrapClassName: "female-goal-glutes-wrap relative h-[min(38vw,148px)] w-full overflow-hidden",
		imageClassName: "female-goal-glutes-img absolute left-1/2 top-1/2 h-[calc(100%+180px)] w-[calc(100%+180px)] -translate-x-1/2 -translate-y-1/2 object-cover"
	},
	{
		id: "waist",
		label: "خصر أنحف ومشدود",
		image: خصر_انحف_ومشدود_default,
		imageWrapClassName: "female-goal-waist-wrap relative h-[min(38vw,148px)] w-full overflow-hidden",
		imageClassName: "female-goal-waist-img h-full w-full object-cover"
	},
	{
		id: "body",
		label: "جسم متناسق وأنثوي",
		image: feminine_toned_body_default,
		imageWrapClassName: "female-goal-body-wrap relative h-[min(38vw,148px)] w-full overflow-hidden",
		imageClassName: "female-goal-body-img h-[calc(100%+40px)] w-full object-cover -translate-y-[40px]"
	},
	{
		id: "fit",
		label: "جسم صحي ورياضي",
		image: جسم_صحي_ورياضي_للبنات_default,
		imageWrapClassName: "female-goal-fit-wrap relative h-[min(38vw,148px)] w-full overflow-hidden",
		imageClassName: "female-goal-fit-img h-full w-full object-cover"
	},
	{
		id: "tone",
		label: "تحسين شكل الصدر",
		image: تحسين_شكل_الصدر_default,
		imageWrapClassName: "female-goal-chest-wrap relative h-[min(38vw,148px)] w-full overflow-hidden",
		imageClassName: "female-goal-chest-img h-full w-full object-cover"
	}
];
function FemaleGoalsScreen({ onBack, onNext, onSelect }) {
	const [selected, setSelected] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!selected) return;
		onSelect?.(selected);
		const t = setTimeout(onNext, 150);
		return () => clearTimeout(t);
	}, [
		selected,
		onNext,
		onSelect
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative w-full h-full flex flex-col animate-[fadeIn_.5s_ease-out]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeminineBackdrop, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex flex-col h-full px-5 pt-3 pb-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressHeader, {
						current: 2,
						onBack
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-lg font-black",
								style: { color: "#FF6B00" },
								children: ["ممتاز ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "inline-block align-middle",
									children: "✨"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-1 text-[24px] font-black text-neutral-900 leading-tight",
								children: "ما هو هدفك الأساسي؟"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-[12px] text-neutral-500 leading-relaxed px-4",
								children: "اختاري الهدف الأقرب لك وسأخصص خطتك بناء عليه."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 grid grid-cols-2 gap-3 flex-1 min-h-0 content-stretch overflow-y-auto pb-1",
						children: FEMALE_GOALS.map((g, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuizImageOptionCard, {
							label: g.label,
							image: g.image,
							active: selected === g.id,
							index: i,
							imageWrapClassName: g.imageWrapClassName,
							imageClassName: g.imageClassName,
							onClick: () => {
								triggerSelectionHaptic();
								setSelected(g.id);
							}
						}, g.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 mx-auto rounded-full bg-white/80 backdrop-blur ring-1 ring-black/5 px-5 py-3 flex items-center justify-center gap-2 shadow-[0_8px_20px_-12px_rgba(0,0,0,0.1)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid h-7 w-7 place-items-center rounded-lg",
							style: { background: "#FF6B00" },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
								className: "h-3.5 w-3.5 text-white",
								strokeWidth: 2.5
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[12px] font-bold text-neutral-800",
							children: "كل هدف يحتاج خطة مختلفة"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      ` })
		]
	});
}
var AGES = Array.from({ length: 67 }, (_, i) => 14 + i);
var ITEM_H = 56;
function AgeScreen({ onBack, onNext, initialAge = 24, onAgeChange }) {
	const [age, setAge] = (0, import_react.useState)(initialAge);
	const scrollerRef = (0, import_react.useRef)(null);
	const snapTimer = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		onAgeChange?.(age);
	}, [age, onAgeChange]);
	(0, import_react.useEffect)(() => {
		const el = scrollerRef.current;
		if (!el) return;
		el.scrollTop = (initialAge - 14) * ITEM_H;
	}, [initialAge]);
	const onScroll = () => {
		const el = scrollerRef.current;
		if (!el) return;
		const idx = Math.round(el.scrollTop / ITEM_H);
		const next = AGES[Math.max(0, Math.min(AGES.length - 1, idx))];
		if (next !== age) setAge(next);
		if (snapTimer.current) window.clearTimeout(snapTimer.current);
		snapTimer.current = window.setTimeout(() => {
			el.scrollTo({
				top: idx * ITEM_H,
				behavior: "smooth"
			});
		}, 90);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative w-full h-full flex flex-col animate-[fadeIn_.5s_ease-out]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GymBackdrop, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex flex-col h-full px-5 pt-3 pb-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressHeader, {
						current: 3,
						onBack
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
									className: "h-5 w-5",
									style: {
										color: "#FFB547",
										fill: "#FFB547"
									}
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-2xl font-black",
									style: { color: "#FF6B00" },
									children: "رائع"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-2 text-[24px] font-black text-neutral-900 leading-tight",
								children: "ما هو عمرك الحالي؟"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-[12.5px] text-neutral-500 leading-relaxed px-6",
								children: "اختر عمرك للحصول على خطة مناسبة لمرحلتك."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative mt-5 mx-1 flex-1 min-h-0 flex flex-col",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative rounded-[28px] bg-white/85 backdrop-blur-sm ring-1 ring-black/5 flex-1 min-h-0",
							style: { boxShadow: "0 20px 50px -25px rgba(255,107,0,0.25), 0 10px 30px -15px rgba(0,0,0,0.08)" },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "absolute -top-6 left-1/2 -translate-x-1/2 grid h-12 w-12 place-items-center rounded-full bg-white ring-1 ring-black/5",
								style: { boxShadow: "0 8px 20px -8px rgba(255,107,0,0.4)" },
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, {
									className: "h-5 w-5",
									style: { color: "#FF6B00" },
									strokeWidth: 2.4
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative h-full overflow-hidden rounded-[28px] pt-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "pointer-events-none absolute left-4 right-4 top-1/2 -translate-y-1/2 z-10",
										style: { height: ITEM_H },
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "absolute inset-x-0 top-0 h-px",
												style: { background: "rgba(255,107,0,0.35)" }
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "absolute inset-x-0 bottom-0 h-px",
												style: { background: "rgba(255,107,0,0.35)" }
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "absolute right-6 top-1/2 -translate-y-1/2 text-base font-medium text-neutral-400",
												children: "سنة"
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "pointer-events-none absolute inset-x-0 top-0 h-1/3 z-20",
										style: { background: "linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,255,255,0))" }
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "pointer-events-none absolute inset-x-0 bottom-0 h-1/3 z-20",
										style: { background: "linear-gradient(0deg,rgba(255,255,255,0.95),rgba(255,255,255,0))" }
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										ref: scrollerRef,
										onScroll,
										className: "h-full overflow-y-scroll scrollbar-none",
										style: {
											scrollSnapType: "y mandatory",
											WebkitOverflowScrolling: "touch",
											paddingTop: "calc(50% - 28px)",
											paddingBottom: "calc(50% - 28px)"
										},
										children: AGES.map((n) => {
											const dist = Math.abs(n - age);
											const active = n === age;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												style: {
													height: ITEM_H,
													scrollSnapAlign: "center",
													opacity: active ? 1 : Math.max(.15, 1 - dist * .28),
													transform: `scale(${active ? 1 : Math.max(.75, 1 - dist * .08)})`,
													transition: "opacity .2s, transform .2s, color .2s",
													color: active ? "#0A0A0A" : "#9CA3AF",
													fontWeight: active ? 900 : 600,
													fontSize: active ? 32 : 24
												},
												className: "flex items-center justify-center leading-none",
												children: n
											}, n);
										})
									})
								]
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 rounded-3xl bg-white/70 backdrop-blur ring-1 ring-black/5 px-4 py-3 flex items-center gap-3",
						style: { boxShadow: "0 8px 20px -12px rgba(0,0,0,0.08)" },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid h-11 w-11 place-items-center rounded-full bg-white shrink-0",
							style: { boxShadow: "0 6px 14px -6px rgba(255,107,0,0.4)" },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, {
								className: "h-5 w-5",
								style: { color: "#FF6B00" },
								strokeWidth: 2.4
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[13px] font-extrabold",
								style: { color: "#FF6B00" },
								children: "العمر مجرد رقم..."
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[12px] text-neutral-700 font-medium mt-0.5",
								children: "الالتزام هو ما يصنع الفارق الحقيقي 💪"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => onNext(age),
						className: "mt-3 w-full rounded-full py-4 text-white text-base font-black flex items-center justify-center gap-3 active:scale-[0.98] transition-transform",
						style: {
							background: "linear-gradient(180deg,#FF8534,#FF6B00)",
							boxShadow: "0 14px 30px -10px rgba(255,107,0,0.55), 0 0 0 6px rgba(255,107,0,0.08)"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "متابعة" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
							className: "h-5 w-5",
							strokeWidth: 2.6
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex items-center justify-center gap-2 text-[11.5px] text-neutral-500",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
							className: "h-3.5 w-3.5",
							style: { color: "#FF6B00" }
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "معلوماتك تبقى خاصة وآمنة" })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .scrollbar-none::-webkit-scrollbar{display:none}
        .scrollbar-none{scrollbar-width:none;-ms-overflow-style:none}
      ` })
		]
	});
}
var ITEM_W = 88;
function HorizontalWheel({ min, max, value, unit, onChange }) {
	const ref = (0, import_react.useRef)(null);
	const snap = (0, import_react.useRef)(null);
	const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el) return;
		el.scrollLeft = (value - min) * ITEM_W;
	}, []);
	const handle = () => {
		const el = ref.current;
		if (!el) return;
		const idx = Math.round(el.scrollLeft / ITEM_W);
		const v = values[Math.max(0, Math.min(values.length - 1, idx))];
		if (v !== value) onChange(v);
		if (snap.current) window.clearTimeout(snap.current);
		snap.current = window.setTimeout(() => {
			el.scrollTo({
				left: idx * ITEM_W,
				behavior: "smooth"
			});
		}, 90);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-[88px]",
		dir: "ltr",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-2 z-10 flex flex-col items-center gap-1",
				style: { width: ITEM_W },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-[2px] w-12 rounded-full",
					style: { background: "#FF6B00" }
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 z-10",
				style: { width: ITEM_W },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-[2px] w-full rounded-full",
					style: { background: "rgba(255,107,0,0.6)" }
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-y-0 left-0 w-16 z-20",
				style: { background: "linear-gradient(90deg,#fff,rgba(255,255,255,0))" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-y-0 right-0 w-16 z-20",
				style: { background: "linear-gradient(270deg,#fff,rgba(255,255,255,0))" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref,
				onScroll: handle,
				className: "h-full overflow-x-scroll scrollbar-none flex items-center",
				style: {
					scrollSnapType: "x mandatory",
					WebkitOverflowScrolling: "touch",
					paddingLeft: `calc(50% - ${ITEM_W / 2}px)`,
					paddingRight: `calc(50% - ${ITEM_W / 2}px)`
				},
				children: values.map((n) => {
					const dist = Math.abs(n - value);
					const active = n === value;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						style: {
							width: ITEM_W,
							scrollSnapAlign: "center",
							opacity: active ? 1 : Math.max(.2, 1 - dist * .25),
							transform: `scale(${active ? 1 : Math.max(.7, 1 - dist * .1)})`,
							transition: "opacity .2s, transform .2s"
						},
						className: "shrink-0 flex flex-col items-center justify-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							style: {
								color: active ? "#FF6B00" : "#9CA3AF",
								fontWeight: active ? 900 : 600,
								fontSize: active ? 34 : 22,
								lineHeight: 1
							},
							children: n
						}), active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-1 text-[12px] font-bold",
							style: { color: "#FF6B00" },
							children: unit
						})]
					}, n);
				})
			})
		]
	});
}
function MeasureScreen({ onBack, onNext, initialHeight = 164, initialWeight = 63, onHeightChange, onWeightChange }) {
	const [height, setHeight] = (0, import_react.useState)(initialHeight);
	const [weight, setWeight] = (0, import_react.useState)(initialWeight);
	(0, import_react.useEffect)(() => {
		onHeightChange?.(height);
	}, [height, onHeightChange]);
	(0, import_react.useEffect)(() => {
		onWeightChange?.(weight);
	}, [weight, onWeightChange]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative w-full h-full flex flex-col animate-[fadeIn_.5s_ease-out]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GymBackdrop, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex flex-col h-full px-5 pt-3 pb-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressHeader, {
						current: 4,
						onBack
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xl",
									children: "📏"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xl font-black",
									style: { color: "#FF6B00" },
									children: "ممتاز"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-1 text-[22px] font-black text-neutral-900 leading-tight",
								children: "ما هو طوله و وزنك الحالي؟"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1.5 text-[12px] text-neutral-500 leading-relaxed px-6",
								children: "أدخلي معلوماتك بدقة لتحصلي على خطة مخصصة لك."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 min-h-0 flex flex-col justify-center gap-5 mt-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MeasureCard, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ruler, {
								className: "h-5 w-5",
								style: { color: "#FF6B00" },
								strokeWidth: 2.4
							}),
							label: "الطول (سم)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HorizontalWheel, {
								min: 130,
								max: 230,
								value: height,
								unit: "سم",
								onChange: setHeight
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MeasureCard, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scale, {
								className: "h-5 w-5",
								style: { color: "#FF6B00" },
								strokeWidth: 2.4
							}),
							label: "الوزن (كجم)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HorizontalWheel, {
								min: 35,
								max: 250,
								value: weight,
								unit: "كجم",
								onChange: setWeight
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 rounded-3xl bg-white/70 backdrop-blur ring-1 ring-black/5 px-4 py-3 flex items-center gap-3",
						style: { boxShadow: "0 8px 20px -12px rgba(0,0,0,0.08)" },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid h-11 w-11 place-items-center rounded-full bg-white shrink-0",
							style: { boxShadow: "0 6px 14px -6px rgba(255,107,0,0.4)" },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, {
								className: "h-5 w-5",
								style: { color: "#FF6B00" },
								strokeWidth: 2.4
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[13px] font-extrabold",
								style: { color: "#FF6B00" },
								children: "نصيحة مهمة"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11.5px] text-neutral-700 font-medium mt-0.5 leading-relaxed",
								children: "كلما كانت المعلومات دقيقة، كانت خطتك أكثر فعالية ونتائجك أسرع."
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => onNext(height, weight),
						className: "mt-3 w-full rounded-full py-4 text-white text-base font-black flex items-center justify-center gap-3 active:scale-[0.98] transition-transform",
						style: {
							background: "linear-gradient(180deg,#FF8534,#FF6B00)",
							boxShadow: "0 14px 30px -10px rgba(255,107,0,0.55), 0 0 0 6px rgba(255,107,0,0.08)"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "متابعة" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
							className: "h-5 w-5",
							strokeWidth: 2.6
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex items-center justify-center gap-2 text-[11.5px] text-neutral-500",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
							className: "h-3.5 w-3.5",
							style: { color: "#FF6B00" }
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "معلوماتك تبقى خاصة وآمنة" })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .scrollbar-none::-webkit-scrollbar{display:none}
        .scrollbar-none{scrollbar-width:none;-ms-overflow-style:none}
      ` })
		]
	});
}
function MeasureCard({ icon, label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute -top-5 left-1/2 -translate-x-1/2 z-10 grid h-11 w-11 place-items-center rounded-full bg-white ring-1 ring-black/5",
			style: { boxShadow: "0 6px 16px -6px rgba(255,107,0,0.4)" },
			children: icon
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-[28px] bg-white/90 backdrop-blur-sm ring-1 ring-black/5 pt-7 pb-3 px-2",
			style: { boxShadow: "0 18px 40px -25px rgba(255,107,0,0.25), 0 8px 24px -15px rgba(0,0,0,0.08)" },
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-center text-[13px] font-bold text-neutral-700",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2",
				children
			})]
		})]
	});
}
function SofaIcon({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 48 48",
		fill: "none",
		className,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "4",
				y: "20",
				width: "40",
				height: "16",
				rx: "6",
				fill: "#FF6B00",
				opacity: "0.15"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M8 24 L8 32 M8 24 C8 20 12 18 16 18 L32 18 C36 18 40 20 40 24 L40 32",
				stroke: "#FF6B00",
				strokeWidth: "2.5",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				fill: "none"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M8 28 L40 28",
				stroke: "#FF6B00",
				strokeWidth: "2",
				strokeLinecap: "round",
				opacity: "0.4"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M14 32 L14 36 M34 32 L34 36",
				stroke: "#FF6B00",
				strokeWidth: "2.5",
				strokeLinecap: "round"
			})
		]
	});
}
function WalkingIcon({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 48 48",
		fill: "none",
		className,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "24",
				cy: "10",
				r: "5",
				fill: "#FF6B00",
				opacity: "0.9"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M24 16 L24 26 M24 26 L18 34 M24 26 L30 34 M20 20 L28 20",
				stroke: "#FF6B00",
				strokeWidth: "2.5",
				strokeLinecap: "round",
				strokeLinejoin: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M18 34 L16 42 M30 34 L32 42",
				stroke: "#FF6B00",
				strokeWidth: "2.5",
				strokeLinecap: "round"
			})
		]
	});
}
function SneakerIcon({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 48 48",
		fill: "none",
		className,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M8 32 C8 28 14 26 20 26 L32 26 C38 26 42 28 42 32 L42 36 L8 36 Z",
				fill: "#FF6B00",
				opacity: "0.15"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M8 36 L42 36",
				stroke: "#FF6B00",
				strokeWidth: "2.5",
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M10 36 L14 26 C16 22 22 22 26 24 L34 28 L40 30",
				stroke: "#FF6B00",
				strokeWidth: "2.5",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				fill: "none"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M18 30 L30 30",
				stroke: "#FF6B00",
				strokeWidth: "2",
				strokeLinecap: "round",
				opacity: "0.5"
			})
		]
	});
}
function ActivityIconShell({ animClass, stagger = 0, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "activity-icon-shell relative grid place-items-center rounded-full overflow-hidden",
		style: {
			height: 44,
			width: 44,
			background: "rgba(255,107,0,0.10)",
			animationDelay: `${stagger * 140}ms`
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "pointer-events-none absolute inset-0 overflow-hidden rounded-full",
			"aria-hidden": true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "activity-icon-shine-beam absolute inset-y-[-25%] w-[55%]",
				style: { animationDelay: `${stagger * 140 + 400}ms` }
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `relative z-[1] grid place-items-center ${animClass}`,
			style: { animationDelay: `${stagger * 140}ms` },
			children
		})]
	});
}
var ACTIVITIES = [
	{
		id: "sedentary",
		label: "خامل تماماً",
		desc: "لا أمارس أي نشاط بدني وأقضي معظم وقتي جالساً.",
		animClass: "act-anim-float",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SofaIcon, { className: "h-7 w-7" })
	},
	{
		id: "light",
		label: "نشاط خفيف",
		desc: "أتحرك قليلاً في يومي (مثل المشي الخفيف).",
		animClass: "act-anim-walk",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WalkingIcon, { className: "h-7 w-7" })
	},
	{
		id: "moderate",
		label: "نشاط متوسط",
		desc: "أمارس التمارين 1 - 3 مرات في الأسبوع.",
		animClass: "act-anim-step",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SneakerIcon, { className: "h-7 w-7" })
	},
	{
		id: "high",
		label: "نشاط عالي",
		desc: "أمارس التمارين 3 - 5 مرات في الأسبوع.",
		animClass: "act-anim-lift",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dumbbell, {
			className: "h-7 w-7",
			style: { color: "#FF6B00" },
			strokeWidth: 2.4
		})
	},
	{
		id: "veryhigh",
		label: "نشاط عالي جداً",
		desc: "أمارس التمارين 6 - 7 مرات في الأسبوع.",
		animClass: "act-anim-flame",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, {
			className: "h-7 w-7",
			style: { color: "#FF6B00" },
			strokeWidth: 2.4
		})
	},
	{
		id: "athlete",
		label: "رياضي محترف",
		desc: "أتمرن يومياً أو لدي نشاط رياضي مكثف جداً.",
		animClass: "act-anim-trophy",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, {
			className: "h-7 w-7",
			style: { color: "#FF6B00" },
			strokeWidth: 2.4
		})
	}
];
function ActivityScreen({ onBack, onNext }) {
	const [selected, setSelected] = (0, import_react.useState)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative w-full h-full flex flex-col animate-[fadeIn_.5s_ease-out]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GymBackdrop, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex flex-col h-full px-5 pt-3 pb-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressHeader, {
						current: 5,
						onBack
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xl font-black",
								style: { color: "#FF6B00" },
								children: ["ممتاز ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "inline-block align-middle",
									children: "🏃"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-1 text-[24px] font-black text-neutral-900 leading-tight",
								children: "ما هو مستوى نشاطك الحالي؟"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-[12.5px] text-neutral-500 leading-relaxed px-2",
								children: "اختر المستوى الأقرب لحالتك اليومية لنصمم لك خطة مناسبة لواقعك."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 grid grid-cols-2 gap-2.5 flex-1 min-h-0 content-stretch overflow-y-auto pb-1",
						children: ACTIVITIES.map((a, i) => {
							const active = selected === a.id;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => {
									triggerSelectionHaptic();
									setSelected(a.id);
								},
								className: "relative flex flex-col items-center justify-center rounded-[18px] bg-white px-2 py-1.5 transition-all active:scale-[0.97]",
								style: {
									boxShadow: active ? "0 12px 30px -10px rgba(255,107,0,0.35), 0 0 0 2px #FF6B00 inset" : "0 8px 20px -12px rgba(0,0,0,0.12)",
									transform: active ? "scale(1.03)" : "scale(1)",
									animation: `fadeUp .5s ease-out ${i * 60}ms both`
								},
								children: [
									active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "absolute top-2 right-2 grid h-6 w-6 place-items-center rounded-full shadow",
										style: { background: "#FF6B00" },
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
											className: "h-3.5 w-3.5 text-white",
											strokeWidth: 3.5
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActivityIconShell, {
										animClass: a.animClass,
										stagger: i,
										children: a.icon
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mt-1.5 text-[12.5px] font-black text-neutral-900 text-center leading-tight",
										children: a.label
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mt-0.5 text-[10px] text-neutral-500 text-center leading-snug px-1",
										children: a.desc
									})
								]
							}, a.id);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2.5 rounded-2xl bg-white/80 backdrop-blur ring-1 ring-black/5 px-4 py-3 flex items-center gap-3",
						style: { boxShadow: "0 8px 20px -12px rgba(0,0,0,0.1)" },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid h-10 w-10 place-items-center rounded-full bg-white shrink-0",
							style: { boxShadow: "0 6px 14px -6px rgba(255,107,0,0.4)" },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, {
								className: "h-5 w-5",
								style: { color: "#FF6B00" },
								strokeWidth: 2.4
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[13px] font-extrabold",
								style: { color: "#FF6B00" },
								children: "معلومة مهمة"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11.5px] text-neutral-700 font-medium mt-0.5 leading-relaxed",
								children: "اختيارك الصحيح يساعدنا في تصميم خطة فعالة وآمنة لك."
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => selected && onNext(selected),
						disabled: !selected,
						className: `mt-2.5 w-full rounded-full py-4 text-white text-base font-black flex items-center justify-center gap-3 transition-all ${selected ? "active:scale-[0.98]" : "opacity-50 cursor-not-allowed"}`,
						style: {
							background: "linear-gradient(180deg,#FF8534,#FF6B00)",
							boxShadow: selected ? "0 14px 30px -10px rgba(255,107,0,0.55), 0 0 0 6px rgba(255,107,0,0.08)" : "none"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "متابعة" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
							className: "h-5 w-5",
							strokeWidth: 2.6
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex items-center justify-center gap-2 text-[11.5px] text-neutral-500",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
							className: "h-3.5 w-3.5",
							style: { color: "#FF6B00" }
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "معلوماتك تبقى خاصة وآمنة" })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes actIconGlow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(255,107,0,0.06), inset 0 0 0 0 rgba(255,107,0,0);
          }
          50% {
            box-shadow: 0 0 16px 1px rgba(255,107,0,0.18), inset 0 0 12px rgba(255,107,0,0.06);
          }
        }
        @keyframes actIconShine {
          0% { transform: translateX(-140%) skewX(-14deg); opacity: 0; }
          18% { opacity: 0.45; }
          55% { opacity: 0.25; }
          100% { transform: translateX(220%) skewX(-14deg); opacity: 0; }
        }
        @keyframes actFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes actWalk {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          35% { transform: translateY(-2px) rotate(-4deg); }
          70% { transform: translateY(-1px) rotate(3deg); }
        }
        @keyframes actStep {
          0%, 100% { transform: translateY(0) scale(1); }
          45% { transform: translateY(-4px) scale(1.05); }
          75% { transform: translateY(-1px) scale(1.01); }
        }
        @keyframes actLift {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(-10deg); }
        }
        @keyframes actFlame {
          0%, 100% { transform: scale(1) translateY(0); opacity: 1; }
          30% { transform: scale(1.07) translateY(-2px); opacity: 0.92; }
          60% { transform: scale(0.97) translateY(0); opacity: 1; }
          85% { transform: scale(1.04) translateY(-1px); opacity: 0.96; }
        }
        @keyframes actTrophy {
          0%, 100% { transform: translateY(0) scale(1); filter: brightness(1); }
          50% { transform: translateY(-3px) scale(1.06); filter: brightness(1.15); }
        }
        .activity-icon-shell {
          animation: actIconGlow 3.8s ease-in-out infinite;
          will-change: box-shadow;
        }
        .activity-icon-shine-beam {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
          animation: actIconShine 4.5s ease-in-out infinite;
          will-change: transform, opacity;
        }
        .act-anim-float { animation: actFloat 4s ease-in-out infinite; will-change: transform; }
        .act-anim-walk { animation: actWalk 2.8s ease-in-out infinite; will-change: transform; }
        .act-anim-step { animation: actStep 2.5s ease-in-out infinite; will-change: transform; }
        .act-anim-lift { animation: actLift 2.6s ease-in-out infinite; will-change: transform; }
        .act-anim-flame { animation: actFlame 2.3s ease-in-out infinite; will-change: transform, opacity; }
        .act-anim-trophy { animation: actTrophy 3.4s ease-in-out infinite; will-change: transform, filter; }
      ` })
		]
	});
}
var CHALLENGES = [
	{
		id: "belly",
		label: "دهون البطن",
		image: مشكلة_دهون_البطن_للرجال_default
	},
	{
		id: "muscle",
		label: "صعوبة بناء العضلات",
		image: صعوبة_في_بناء_العضلات_default
	},
	{
		id: "energy",
		label: "قلة الطاقة والحيوية",
		image: قلة_الطاقة_والحيوية_default
	},
	{
		id: "goal",
		label: "عدم وضوح الهدف",
		image: عدم_وضوح_الهدف_default
	},
	{
		id: "commitment",
		label: "الالتزام والاستمرارية",
		image: الالتزام_والاستمرارية_default
	},
	{
		id: "confidence",
		label: "الثقة بالنفس والمظهر",
		image: الثقة_بالنفس_والمظهر_default
	}
];
function ChallengeScreen({ onBack, onNext, onSelect }) {
	const [selected, setSelected] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (selected) onSelect?.(selected);
	}, [selected, onSelect]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative w-full h-full flex flex-col animate-[fadeIn_.5s_ease-out]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GymBackdrop, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex flex-col h-full px-5 pt-3 pb-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressHeader, {
						current: 6,
						onBack
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xl font-black",
								style: { color: "#FF6B00" },
								children: ["ممتاز ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "inline-block align-middle",
									children: "✨"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-1 text-[24px] font-black text-neutral-900 leading-tight",
								children: "ما هي أكبر مشكلة تواجهك حالياً؟"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-[12.5px] text-neutral-500 leading-relaxed px-2",
								children: "اختر التحدي الذي يؤثر عليك أكثر لنساعدك على التغلب عليه."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 grid grid-cols-2 gap-2.5 flex-1 min-h-0 content-stretch overflow-y-auto pb-1",
						children: CHALLENGES.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuizImageOptionCard, {
							label: c.label,
							image: c.image,
							active: selected === c.id,
							index: i,
							onClick: () => {
								triggerSelectionHaptic();
								setSelected(c.id);
							}
						}, c.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2.5 rounded-2xl bg-white/80 backdrop-blur ring-1 ring-black/5 px-4 py-3 flex items-center gap-3",
						style: { boxShadow: "0 8px 20px -12px rgba(0,0,0,0.1)" },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid h-10 w-10 place-items-center rounded-full bg-white shrink-0",
							style: { boxShadow: "0 6px 14px -6px rgba(255,107,0,0.4)" },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, {
								className: "h-5 w-5",
								style: { color: "#FF6B00" },
								strokeWidth: 2.4
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[13px] font-extrabold",
								style: { color: "#FF6B00" },
								children: "معلومة مهمة"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11.5px] text-neutral-700 font-medium mt-0.5 leading-relaxed",
								children: "معرفة أكبر تحدي لديك هي الخطوة الأولى للتغيير الحقيقي."
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: onNext,
						disabled: !selected,
						className: `mt-2.5 w-full rounded-full py-4 text-white text-base font-black flex items-center justify-center gap-3 transition-all ${selected ? "active:scale-[0.98]" : "opacity-50 cursor-not-allowed"}`,
						style: {
							background: "linear-gradient(180deg,#FF8534,#FF6B00)",
							boxShadow: selected ? "0 14px 30px -10px rgba(255,107,0,0.55), 0 0 0 6px rgba(255,107,0,0.08)" : "none"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "متابعة" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
							className: "h-5 w-5",
							strokeWidth: 2.6
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex items-center justify-center gap-2 text-[11.5px] text-neutral-500",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
							className: "h-3.5 w-3.5",
							style: { color: "#FF6B00" }
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "معلوماتك تبقى خاصة وآمنة" })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      ` })
		]
	});
}
var FEMALE_CHALLENGES = [
	{
		id: "belly",
		label: "الكرش والدهون البطن",
		image: الكرش_و_الدهون_البطن_default
	},
	{
		id: "glutes",
		label: "شكل المؤخرة",
		image: شكل_المؤخرة_default
	},
	{
		id: "sagging",
		label: "ترهلات الجسم",
		image: ترهلات_الجسم_للبنات_default
	},
	{
		id: "weight",
		label: "عدم نزول الوزن",
		image: fbody_overweight_default
	},
	{
		id: "confidence",
		label: "الثقة بالنفس",
		image: عدم_الثقة_بالنفس_للبنات_default
	},
	{
		id: "cravings",
		label: "عدم تناسق الجسم",
		image: عدم_تناسق_الجسم_default
	}
];
function FemaleChallengeScreen({ onBack, onNext, onSelect }) {
	const [selected, setSelected] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (selected) onSelect?.(selected);
	}, [selected, onSelect]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative w-full h-full flex flex-col animate-[fadeIn_.5s_ease-out]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeminineBackdrop, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex flex-col h-full px-5 pt-3 pb-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressHeader, {
						current: 6,
						onBack
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xl font-black",
								style: { color: "#FF6B00" },
								children: ["ممتاز ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "inline-block align-middle",
									children: "✨"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-1 text-[24px] font-black text-neutral-900 leading-tight",
								children: "ما هي أكبر مشكلة تواجهك حالياً؟"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-[12.5px] text-neutral-500 leading-relaxed px-2",
								children: "اختاري التحدي الذي يؤثر عليك أكثر لنساعدك على التغلب عليه."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 grid grid-cols-2 gap-2.5 flex-1 min-h-0 content-stretch overflow-y-auto pb-1",
						children: FEMALE_CHALLENGES.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuizImageOptionCard, {
							label: c.label,
							image: c.image,
							active: selected === c.id,
							index: i,
							onClick: () => {
								triggerSelectionHaptic();
								setSelected(c.id);
							}
						}, c.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2.5 rounded-2xl bg-white/80 backdrop-blur ring-1 ring-black/5 px-4 py-3 flex items-center gap-3",
						style: { boxShadow: "0 8px 20px -12px rgba(0,0,0,0.1)" },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid h-10 w-10 place-items-center rounded-full bg-white shrink-0",
							style: { boxShadow: "0 6px 14px -6px rgba(255,107,0,0.4)" },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, {
								className: "h-5 w-5",
								style: { color: "#FF6B00" },
								strokeWidth: 2.4
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[13px] font-extrabold",
								style: { color: "#FF6B00" },
								children: "معلومة مهمة"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11.5px] text-neutral-700 font-medium mt-0.5 leading-relaxed",
								children: "معرفة أكبر تحدي لديك هي الخطوة الأولى للتغيير الحقيقي."
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: onNext,
						disabled: !selected,
						className: `mt-2.5 w-full rounded-full py-4 text-white text-base font-black flex items-center justify-center gap-3 transition-all ${selected ? "active:scale-[0.98]" : "opacity-50 cursor-not-allowed"}`,
						style: {
							background: "linear-gradient(180deg,#FF8534,#FF6B00)",
							boxShadow: selected ? "0 14px 30px -10px rgba(255,107,0,0.55), 0 0 0 6px rgba(255,107,0,0.08)" : "none"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "متابعة" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
							className: "h-5 w-5",
							strokeWidth: 2.6
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex items-center justify-center gap-2 text-[11.5px] text-neutral-500",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
							className: "h-3.5 w-3.5",
							style: { color: "#FF6B00" }
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "معلوماتك تبقى خاصة وآمنة" })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      ` })
		]
	});
}
function TrophyIcon({ size = 48 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 64 64",
		width: size,
		height: size,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("defs", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
				id: "trophyGrad",
				x1: "0%",
				y1: "0%",
				x2: "0%",
				y2: "100%",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "0%",
						stopColor: "#FFD700"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "50%",
						stopColor: "#FFC107"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "100%",
						stopColor: "#B8860B"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
				id: "trophyBase",
				x1: "0%",
				y1: "0%",
				x2: "0%",
				y2: "100%",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "0%",
					stopColor: "#8B6914"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "100%",
					stopColor: "#5C4008"
				})]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "22",
				y: "50",
				width: "20",
				height: "6",
				rx: "2",
				fill: "url(#trophyBase)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "18",
				y: "54",
				width: "28",
				height: "5",
				rx: "2",
				fill: "url(#trophyBase)",
				opacity: "0.8"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M16 16 Q16 42 32 46 Q48 42 48 16 Z",
				fill: "url(#trophyGrad)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M32 22 L34 28 L40 28 L35 32 L37 38 L32 34 L27 38 L29 32 L24 28 L30 28 Z",
				fill: "#FFF8DC",
				opacity: "0.9"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M16 18 Q8 18 8 28 Q8 38 18 38",
				fill: "none",
				stroke: "url(#trophyGrad)",
				strokeWidth: "4",
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M48 18 Q56 18 56 28 Q56 38 46 38",
				fill: "none",
				stroke: "url(#trophyGrad)",
				strokeWidth: "4",
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
				cx: "32",
				cy: "16",
				rx: "16",
				ry: "3",
				fill: "#FFD700"
			})
		]
	});
}
function CoinIcon({ size = 48 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 64 64",
		width: size,
		height: size,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("defs", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
				id: "coinGrad",
				x1: "0%",
				y1: "0%",
				x2: "100%",
				y2: "100%",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "0%",
						stopColor: "#FFD700"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "40%",
						stopColor: "#FFC107"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "100%",
						stopColor: "#B8860B"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
				id: "coinEdge",
				x1: "0%",
				y1: "0%",
				x2: "0%",
				y2: "100%",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "0%",
					stopColor: "#D4AF37"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "100%",
					stopColor: "#8B6914"
				})]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "32",
				cy: "32",
				r: "28",
				fill: "url(#coinGrad)",
				stroke: "url(#coinEdge)",
				strokeWidth: "2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "32",
				cy: "32",
				r: "20",
				fill: "none",
				stroke: "#B8860B",
				strokeWidth: "1.5",
				opacity: "0.5"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
				x: "32",
				y: "40",
				textAnchor: "middle",
				fontSize: "28",
				fontWeight: "bold",
				fill: "#5C4008",
				fontFamily: "Arial",
				children: "$"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
				cx: "24",
				cy: "22",
				rx: "8",
				ry: "5",
				fill: "white",
				opacity: "0.25",
				transform: "rotate(-30 24 22)"
			})
		]
	});
}
function PiggyBankIcon({ size = 48 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 64 64",
		width: size,
		height: size,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("defs", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
				id: "piggyGrad",
				x1: "0%",
				y1: "0%",
				x2: "0%",
				y2: "100%",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "0%",
						stopColor: "#FFB6C1"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "50%",
						stopColor: "#FF91A4"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "100%",
						stopColor: "#F06279"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
				id: "coinSmall",
				x1: "0%",
				y1: "0%",
				x2: "100%",
				y2: "100%",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "0%",
					stopColor: "#FFD700"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "100%",
					stopColor: "#D4AF37"
				})]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
				cx: "32",
				cy: "38",
				rx: "22",
				ry: "16",
				fill: "url(#piggyGrad)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "48",
				cy: "30",
				r: "10",
				fill: "url(#piggyGrad)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
				cx: "56",
				cy: "30",
				rx: "4",
				ry: "5",
				fill: "#FF91A4"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "55",
				cy: "28",
				r: "1.5",
				fill: "#D4506B"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "57",
				cy: "28",
				r: "1.5",
				fill: "#D4506B"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "50",
				cy: "26",
				r: "2",
				fill: "#333"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "50.5",
				cy: "25.5",
				r: "0.7",
				fill: "white"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
				cx: "42",
				cy: "20",
				rx: "5",
				ry: "7",
				fill: "#FF91A4",
				transform: "rotate(-20 42 20)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "18",
				y: "50",
				width: "6",
				height: "8",
				rx: "3",
				fill: "#F06279"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "40",
				y: "50",
				width: "6",
				height: "8",
				rx: "3",
				fill: "#F06279"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M12 38 Q8 36 10 32 Q12 30 10 28",
				fill: "none",
				stroke: "#FF91A4",
				strokeWidth: "2",
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "26",
				y: "22",
				width: "12",
				height: "3",
				rx: "1.5",
				fill: "#D4506B"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "32",
				cy: "14",
				r: "6",
				fill: "url(#coinSmall)",
				stroke: "#D4AF37",
				strokeWidth: "1"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
				x: "32",
				y: "17",
				textAnchor: "middle",
				fontSize: "8",
				fontWeight: "bold",
				fill: "#8B6914",
				children: "$"
			})
		]
	});
}
function MagnifyingGlassIcon({ size = 48 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 64 64",
		width: size,
		height: size,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("defs", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
				id: "glassGrad",
				x1: "0%",
				y1: "0%",
				x2: "100%",
				y2: "100%",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "0%",
						stopColor: "#E8E8E8"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "50%",
						stopColor: "#F5F5F5"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
						offset: "100%",
						stopColor: "#D0D0D0"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
				id: "handleGrad",
				x1: "0%",
				y1: "0%",
				x2: "0%",
				y2: "100%",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "0%",
					stopColor: "#888"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "100%",
					stopColor: "#555"
				})]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "42",
				y: "42",
				width: "8",
				height: "20",
				rx: "4",
				fill: "url(#handleGrad)",
				transform: "rotate(45 46 52)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "28",
				cy: "28",
				r: "18",
				fill: "none",
				stroke: "url(#handleGrad)",
				strokeWidth: "4"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "28",
				cy: "28",
				r: "15",
				fill: "url(#glassGrad)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
				cx: "22",
				cy: "20",
				rx: "6",
				ry: "4",
				fill: "white",
				opacity: "0.5",
				transform: "rotate(-45 22 20)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
				cx: "24",
				cy: "22",
				rx: "3",
				ry: "2",
				fill: "white",
				opacity: "0.7",
				transform: "rotate(-45 24 22)"
			})
		]
	});
}
function TargetIconSmall({ size = 22 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 24 24",
		width: size,
		height: size,
		fill: "none",
		stroke: "#FF6B00",
		strokeWidth: "2.2",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "12",
				cy: "12",
				r: "10"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "12",
				cy: "12",
				r: "6"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "12",
				cy: "12",
				r: "2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: "12",
				y1: "2",
				x2: "12",
				y2: "6"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: "12",
				y1: "18",
				x2: "12",
				y2: "22"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: "2",
				y1: "12",
				x2: "6",
				y2: "12"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: "18",
				y1: "12",
				x2: "22",
				y2: "12"
			})
		]
	});
}
var INVESTMENT_OPTIONS = [
	{
		id: "premium",
		title: "مستعد لفعل كل ما يلزم",
		highlight: "أريد أسرع وأفضل نتيجة ممكنة.",
		description: "أنا جاد وأؤمن أن الاستثمار في نفسي هو أفضل قرار سأتخذه.",
		Icon: TrophyIcon,
		iconBg: "#FFF8E7"
	},
	{
		id: "standard",
		title: "مستعد لكن بميزانية متوسطة",
		highlight: "أبحث عن خطة مناسبة أستطيع الالتزام بها.",
		description: "أريد نتائج قوية مع خطة تناسب ميزانيتي الحالية.",
		Icon: CoinIcon,
		iconBg: "#FFF8E7"
	},
	{
		id: "budget",
		title: "أبحث عن أرخص خيار",
		highlight: "أريد البدء بأقل تكلفة ممكنة.",
		description: "ميزانيتي محدودة حالياً وأبحث عن خيار اقتصادي.",
		Icon: PiggyBankIcon,
		iconBg: "#FFF0F3"
	},
	{
		id: "price_only",
		title: "أريد فقط معرفة السعر",
		highlight: "لست متأكداً بعد.",
		description: "أحتاج معلومات أكثر قبل أن أقرر إذا كنت سأبدأ أم لا.",
		Icon: MagnifyingGlassIcon,
		iconBg: "#F0F0F0"
	}
];
function InvestmentScreen({ onBack, onNext }) {
	const [selected, setSelected] = (0, import_react.useState)(null);
	const ORANGE = "#FF6B00";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative w-full h-full overflow-hidden",
		style: {
			backgroundColor: "#FAF8F5",
			backgroundImage: `url(${quiz_gym_bg_default})`,
			backgroundSize: "cover",
			backgroundPosition: "center",
			animation: "fadeIn .35s ease-out"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0",
				style: { background: "linear-gradient(180deg, rgba(250,248,245,0.88) 0%, rgba(250,248,245,0.94) 60%, rgba(250,248,245,0.98) 100%)" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative h-full flex flex-col px-5 pt-3 pb-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: onBack,
								className: "w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] ring-1 ring-black/5",
								"aria-label": "رجوع",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
									size: 20,
									className: "text-neutral-700"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-[15px] font-bold text-neutral-800",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									style: { color: ORANGE },
									children: "7"
								}), " من 13"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-10" })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex gap-1.5",
						children: Array.from({ length: 13 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex-1 h-[5px] rounded-full overflow-hidden bg-gray-200",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full rounded-full",
								style: {
									width: i < 6 ? "100%" : i === 6 ? "55%" : "0%",
									background: ORANGE
								}
							})
						}, i))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 text-center",
						style: { animation: "fadeUp .5s ease-out" },
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "inline-flex items-center justify-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TargetIconSmall, { size: 22 }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[20px] font-extrabold",
										style: { color: ORANGE },
										children: "كن صريحاً معي"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[20px]",
										children: "👇"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-2 text-[24px] font-extrabold text-[#1F1F1F] leading-tight",
								children: "كم أنت مستعد للاستثمار في تغيير جسمك؟"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-[13px] text-gray-500 font-medium leading-relaxed px-4",
								children: "النتائج الحقيقية تحتاج التزاماً واستثماراً حقيقياً."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 flex flex-col gap-2.5 flex-1 min-h-0 overflow-hidden",
						children: INVESTMENT_OPTIONS.map((opt, i) => {
							const active = selected === opt.id;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									triggerSelectionHaptic();
									setSelected(opt.id);
								},
								className: "relative w-full rounded-[22px] bg-white text-right overflow-hidden transition-all duration-250 active:scale-[0.98]",
								style: {
									border: `2px solid ${active ? ORANGE : "rgba(0,0,0,0.04)"}`,
									boxShadow: active ? "0 14px 36px -14px rgba(255,107,0,0.4), 0 6px 16px -8px rgba(0,0,0,0.08)" : "0 8px 22px -14px rgba(0,0,0,0.14), 0 2px 6px -2px rgba(0,0,0,0.05)",
									transform: active ? "scale(1.02)" : "scale(1)",
									animation: `fadeUp .5s ease-out ${i * 70}ms both`
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-row-reverse items-stretch",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-[72px] shrink-0 self-stretch flex items-center justify-center",
										style: { background: opt.iconBg },
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(opt.Icon, { size: 48 })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1 px-4 py-3 flex flex-col justify-center gap-0.5 text-right",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-[15px] font-extrabold text-[#2A2A2A] leading-tight",
												children: opt.title
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[12.5px] font-bold",
												style: { color: ORANGE },
												children: opt.highlight
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11.5px] text-[#4A4A4A] font-medium leading-snug",
												children: opt.description
											})
										]
									})]
								})
							}, opt.id);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2.5 rounded-[20px] bg-white/85 backdrop-blur px-4 py-3 flex flex-row-reverse items-center gap-3",
						style: {
							boxShadow: "0 6px 18px -10px rgba(0,0,0,0.12)",
							animation: "fadeUp .5s ease-out .35s both"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0",
							style: {
								boxShadow: "0 4px 12px rgba(255,107,0,0.18)",
								border: "1px solid #F5E6D6"
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, {
								size: 20,
								style: { color: ORANGE }
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[13px] font-extrabold",
								style: { color: ORANGE },
								children: "معلومة مهمة"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11.5px] text-[#3D3D3D] font-medium leading-snug",
								children: "كلما كان استثمارك أعلى، كانت نتائجك أسرع وأفضل. أنا هنا لمساعدتك على تحقيق أفضل نسخة منك."
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-auto pt-2.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							disabled: !selected,
							onClick: () => selected && onNext(selected),
							className: "w-full h-[56px] rounded-[18px] flex items-center justify-center gap-2 text-white text-[17px] font-extrabold transition-all duration-200 active:scale-[0.98]",
							style: {
								background: selected ? `linear-gradient(135deg, #FF8A3D 0%, ${ORANGE} 100%)` : "#E5D9CC",
								boxShadow: selected ? "0 14px 30px -10px rgba(255,107,0,0.55)" : "none",
								opacity: selected ? 1 : .7
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "متابعة" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 20 })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex items-center justify-center gap-1.5 text-[11.5px] text-gray-500",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { size: 12 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "معلوماتك تبقى خاصة وآمنة" })]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      ` })
		]
	});
}
var BODY_TYPES = [
	{
		id: "skinny_fat",
		title: "دهون بسيطة بالبطن",
		sub: "بطن بارز وعضلات خفيفة",
		img: body_skinny_fat_default
	},
	{
		id: "lean",
		title: "نحيف رياضي",
		sub: "جسم رشيق وعضلات قليلة",
		img: body_lean_default
	},
	{
		id: "very_skinny",
		title: "نحيف جداً",
		sub: "وزن أقل من الطبيعي",
		img: body_very_skinny_default
	},
	{
		id: "muscular",
		title: "عضلي",
		sub: "كتلة عضلية واضحة",
		img: body_muscular_default
	},
	{
		id: "overweight",
		title: "ممتلئ",
		sub: "زيادة في الوزن والدهون",
		img: body_overweight_default
	},
	{
		id: "average",
		title: "جسم متوسط",
		sub: "وزن طبيعي وكتلة معتدلة",
		img: body_average_default
	}
];
function DelayedExplainBubble({ title, body, delayMs = 5e3 }) {
	const ORANGE = "#FF6B00";
	const [phase, setPhase] = (0, import_react.useState)("idle");
	(0, import_react.useEffect)(() => {
		const showTimer = setTimeout(() => setPhase("icon"), delayMs);
		return () => clearTimeout(showTimer);
	}, [delayMs]);
	(0, import_react.useEffect)(() => {
		if (phase !== "icon") return;
		const expandTimer = setTimeout(() => setPhase("open"), 650);
		return () => clearTimeout(expandTimer);
	}, [phase]);
	if (phase === "idle") return null;
	const isOpen = phase === "open";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `mt-2.5 w-full ${isOpen ? "" : "flex justify-end"}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-[18px] bg-white/85 backdrop-blur flex flex-row-reverse items-center relative overflow-hidden",
			style: {
				width: isOpen ? "100%" : 44,
				padding: isOpen ? "10px 12px" : 0,
				gap: isOpen ? 12 : 0,
				boxShadow: isOpen ? "0 6px 18px -10px rgba(0,0,0,0.12)" : "0 6px 20px -6px rgba(255,107,0,0.35)",
				border: isOpen ? "1px solid rgba(255,107,0,0.08)" : `2px solid rgba(255,107,0,0.22)`,
				transition: "width 0.55s cubic-bezier(0.22, 1, 0.36, 1), padding 0.55s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease, border-color 0.4s ease",
				animation: phase === "icon" ? "explainSlideFromRight 0.55s cubic-bezier(0.22, 1, 0.36, 1) both" : void 0
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0",
					style: {
						boxShadow: "0 4px 12px rgba(255,107,0,0.18)",
						border: "1px solid #F5E6D6",
						animation: phase === "icon" ? "explainIconPulse 1.4s ease-in-out 0.55s 2" : void 0
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {
						size: 22,
						style: { color: ORANGE }
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 min-w-0 text-right",
					style: {
						opacity: isOpen ? 1 : 0,
						transform: isOpen ? "translateX(0)" : "translateX(12px)",
						transition: "opacity 0.4s ease 0.15s, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.12s"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[12.5px] font-extrabold",
						style: { color: ORANGE },
						children: title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] text-[#3D3D3D] font-medium leading-snug",
						children: body
					})]
				}),
				isOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
					size: 14,
					className: "absolute left-2 top-2 opacity-50",
					style: { color: ORANGE }
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
					size: 10,
					className: "absolute left-3 bottom-2 opacity-40",
					style: { color: ORANGE }
				})] })
			]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        @keyframes explainSlideFromRight {
          0% { opacity: 0; transform: translateX(52px) scale(0.88); }
          72% { opacity: 1; transform: translateX(-3px) scale(1.03); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes explainIconPulse {
          0%, 100% { box-shadow: 0 4px 12px rgba(255,107,0,0.18); }
          50% { box-shadow: 0 4px 18px rgba(255,107,0,0.42); }
        }
      ` })] });
}
function BodyTypeScreen({ onBack, onNext }) {
	const [selected, setSelected] = (0, import_react.useState)(null);
	const ORANGE = "#FF6B00";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "relative w-full h-full overflow-hidden",
		style: {
			backgroundColor: "#FAF8F5",
			animation: "fadeIn .35s ease-out"
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative h-full flex flex-col px-5 pt-3 pb-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: onBack,
							className: "w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] ring-1 ring-black/5",
							"aria-label": "رجوع",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
								size: 20,
								className: "text-neutral-700"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-[15px] font-bold text-neutral-800",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								style: { color: ORANGE },
								children: "8"
							}), " من 13"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-10" })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex gap-1.5",
					children: Array.from({ length: 13 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 h-[5px] rounded-full overflow-hidden bg-gray-200",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full rounded-full",
							style: {
								width: i < 8 ? "100%" : "0%",
								background: ORANGE
							}
						})
					}, i))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 text-center",
					style: { animation: "fadeUp .5s ease-out" },
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-[22px] font-extrabold text-[#1F1F1F] leading-tight",
							children: "أي شكل أقرب لجسمك الحالي؟"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1.5 text-[12.5px] text-gray-500 font-medium",
							children: "اختر الشكل الأقرب لك حتى أخصص لك الخطة المناسبة."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mx-auto mt-1.5 h-[3px] w-10 rounded-full",
							style: { background: ORANGE }
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 grid grid-cols-3 gap-2 flex-1 min-h-0",
					children: BODY_TYPES.map((b, i) => {
						const active = selected === b.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => {
								triggerSelectionHaptic();
								setSelected(b.id);
							},
							className: "relative rounded-[18px] bg-white p-1.5 flex flex-col items-center transition-all duration-250",
							style: {
								border: `2px solid ${active ? ORANGE : "rgba(0,0,0,0.04)"}`,
								boxShadow: active ? "0 12px 28px -12px rgba(255,107,0,0.45), 0 4px 12px -6px rgba(0,0,0,0.08)" : "0 6px 16px -10px rgba(0,0,0,0.14), 0 2px 4px -2px rgba(0,0,0,0.05)",
								transform: active ? "scale(1.03)" : "scale(1)",
								animation: `fadeUp .5s ease-out ${i * 50}ms both`
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-full rounded-[12px] overflow-hidden bg-[#F2EDE6] aspect-[3/4]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: b.img,
										alt: b.title,
										loading: "lazy",
										className: "w-full h-full object-cover"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-1 text-[11.5px] font-extrabold text-[#1F1F1F] text-center leading-tight",
									children: b.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[9.5px] text-gray-500 font-medium text-center leading-tight px-0.5 line-clamp-2",
									children: b.sub
								})
							]
						}, b.id);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DelayedExplainBubble, {
					title: "لماذا نسأل هذا؟",
					body: "اختبارك يساعدنا على تحليل حالتك بدقة وبناء خطة مناسبة لجسمك وهدفك."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						disabled: !selected,
						onClick: () => selected && onNext(selected),
						className: "w-full h-[54px] rounded-[18px] flex items-center justify-center gap-2 text-white text-[17px] font-extrabold transition-all duration-200 active:scale-[0.98]",
						style: {
							background: selected ? `linear-gradient(135deg, #FF8A3D 0%, ${ORANGE} 100%)` : "#E5D9CC",
							boxShadow: selected ? "0 14px 30px -10px rgba(255,107,0,0.55)" : "none",
							opacity: selected ? 1 : .7
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "متابعة" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 20 })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1.5 flex items-center justify-center gap-1.5 text-[11.5px] text-gray-500",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { size: 12 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "معلوماتك تبقى خاصة وآمنة" })]
					})]
				})
			]
		})
	});
}
var FEMALE_BODY_TYPES = [
	{
		id: "needs_toning",
		title: "جسم يحتاج شد",
		sub: "ترهلات خفيفة في البطن أو الذراعين والجسم",
		img: جسم_يحتاج_شد_default
	},
	{
		id: "belly_fat_light",
		title: "كرش خفيفة",
		sub: "دهون بسيطة في منطقة البطن فقط",
		img: كرش_خفيفة_default
	},
	{
		id: "slim",
		title: "نحيفة",
		sub: "وزن أقل من الطبيعي ودهون قليلة جداً",
		img: fbody_slim_default
	},
	{
		id: "overweight",
		title: "جسم ممتلئ بدهون",
		sub: "زيادة واضحة في الوزن وتراكم الدهون",
		img: fbody_overweight_default
	},
	{
		id: "athletic",
		title: "جسم رياضي",
		sub: "جسم مشدود وعضلات بارزة وقوام رياضي",
		img: fbody_athletic_default
	},
	{
		id: "body_shaping",
		title: "عدم تناسق الأرداف",
		sub: "أرغب بجسم أكثر تناسقاً وخصراً أنحف",
		img: عدم_تناسق_الارداف_default
	}
];
function FemaleBodyTypeScreen({ onBack, onNext }) {
	const [selected, setSelected] = (0, import_react.useState)(null);
	const ORANGE = "#FF6B00";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "relative w-full h-full overflow-hidden",
		style: {
			backgroundColor: "#FAF8F5",
			animation: "fadeIn .35s ease-out"
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative h-full flex flex-col px-5 pt-3 pb-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: onBack,
							className: "w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] ring-1 ring-black/5",
							"aria-label": "رجوع",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
								size: 20,
								className: "text-neutral-700"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-[15px] font-bold text-neutral-800",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								style: { color: ORANGE },
								children: "8"
							}), " من 13"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-10" })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex gap-1.5",
					children: Array.from({ length: 13 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 h-[5px] rounded-full overflow-hidden bg-gray-200",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full rounded-full",
							style: {
								width: i < 8 ? "100%" : "0%",
								background: ORANGE
							}
						})
					}, i))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 text-center",
					style: { animation: "fadeUp .5s ease-out" },
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-[22px] font-extrabold text-[#1F1F1F] leading-tight",
							children: "أي شكل أقرب لجسمك الحالي؟"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1.5 text-[12.5px] text-gray-500 font-medium",
							children: "اختري الشكل الأقرب لك حتى أخصص لك الخطة المثالية."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mx-auto mt-1.5 h-[3px] w-10 rounded-full",
							style: { background: ORANGE }
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 grid grid-cols-3 gap-2 flex-1 min-h-0",
					children: FEMALE_BODY_TYPES.map((b, i) => {
						const active = selected === b.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => {
								triggerSelectionHaptic();
								setSelected(b.id);
							},
							className: "relative rounded-[18px] bg-white p-1.5 flex flex-col items-center transition-all duration-250",
							style: {
								border: `2px solid ${active ? ORANGE : "rgba(0,0,0,0.04)"}`,
								boxShadow: active ? "0 12px 28px -12px rgba(255,107,0,0.45), 0 4px 12px -6px rgba(0,0,0,0.08)" : "0 6px 16px -10px rgba(0,0,0,0.14), 0 2px 4px -2px rgba(0,0,0,0.05)",
								transform: active ? "scale(1.03)" : "scale(1)",
								animation: `fadeUp .5s ease-out ${i * 50}ms both`
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-full rounded-[12px] overflow-hidden bg-[#F2EDE6] aspect-[3/4]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: b.img,
										alt: b.title,
										loading: "lazy",
										className: "w-full h-full object-cover"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-1 text-[11px] font-extrabold text-[#1F1F1F] text-center leading-tight px-0.5 line-clamp-2",
									children: b.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[9px] text-gray-500 font-medium text-center leading-tight px-0.5 line-clamp-2 mt-0.5",
									children: b.sub
								})
							]
						}, b.id);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DelayedExplainBubble, {
					title: "لماذا نسألك هذا؟",
					body: "اختيارك يساعدنا على تحليل حالتك بدقة وبناء خطة مناسبة لجسمك وهدفك."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						disabled: !selected,
						onClick: () => selected && onNext(selected),
						className: "w-full h-[54px] rounded-[18px] flex items-center justify-center gap-2 text-white text-[17px] font-extrabold transition-all duration-200 active:scale-[0.98]",
						style: {
							background: selected ? `linear-gradient(135deg, #FF8A3D 0%, ${ORANGE} 100%)` : "#E5D9CC",
							boxShadow: selected ? "0 14px 30px -10px rgba(255,107,0,0.55)" : "none",
							opacity: selected ? 1 : .7
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "متابعة" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 20 })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1.5 flex items-center justify-center gap-1.5 text-[11.5px] text-gray-500",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { size: 12 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "معلوماتك تبقى خاصة وآمنة" })]
					})]
				})
			]
		})
	});
}
function AnalysisScreen({ onBack, onDone }) {
	const [pct, setPct] = (0, import_react.useState)(0);
	const DURATION = 1e4;
	(0, import_react.useEffect)(() => {
		const start = performance.now();
		let raf = 0;
		const tick = (now) => {
			const elapsed = now - start;
			setPct(Math.min(100, Math.round(elapsed / DURATION * 100)));
			if (elapsed < DURATION) raf = requestAnimationFrame(tick);
			else setTimeout(() => onDone(), 1e3);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [onDone]);
	const thresholds = [
		25,
		50,
		75,
		90,
		100
	];
	const stepStatus = (i) => {
		if (pct >= thresholds[i]) return "done";
		if (pct >= (i === 0 ? 0 : thresholds[i - 1])) return "loading";
		return "pending";
	};
	const items = [
		{
			title: "فهم هدفك الحالي",
			sub: "أحلل هدفك وأولوياتك تحقيقه",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Target, {
				size: 22,
				className: "text-[#FF6B00]"
			})
		},
		{
			title: "مقارنة حالتك بنتائج متدربين مشابهين",
			sub: "أقارن وضعك الحالي بنتائج حقيقية لمتدربين لديهم هدف مشابه",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarsIcon, {})
		},
		{
			title: "اختيار أفضل استراتيجية لك",
			sub: "أختار الاستراتيجية الأكثر فعالية لتحقيق هدفك",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrainIcon2, {})
		},
		{
			title: "تحديد الخطة المناسبة لجسمك",
			sub: "أختار الخطة التي تناسب جسمك وهدفك ونمط حياتك",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardIcon, {})
		},
		{
			title: "تجهيز برنامجك الخاص",
			sub: "أجهز برنامجك خطوة بخطوة مع جميع التفاصيل",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardStarIcon, {})
		}
	];
	const R = 70;
	const C = 2 * Math.PI * R;
	const dash = pct / 100 * C;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "absolute inset-0 flex flex-col",
		style: {
			backgroundColor: "#FAF8F5",
			fontFamily: FONT
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-4 pt-3 pb-2 shrink-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: onBack,
							"aria-label": "رجوع",
							className: "w-9 h-9 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex items-center justify-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
								size: 20,
								className: "text-gray-700 rotate-180"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-[15px] font-bold text-gray-800",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[#FF6B00]",
								children: "9"
							}), " من 13"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-9" })
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 flex gap-1",
					children: Array.from({ length: 13 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-[3px] flex-1 rounded-full",
						style: { backgroundColor: i < 9 ? "#FF6B00" : "#F0E6DC" }
					}, i))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 overflow-hidden px-4 flex flex-col",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-center mt-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
							className: "text-[19px] font-bold text-gray-900 leading-tight",
							children: ["لحظة... جاري تجهيز برنامجك الخاص ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "inline-block",
								children: "✨"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[12px] text-gray-600 mt-1 leading-snug px-4",
							children: [
								"أراجع هدفك وحالتك الحالية لاختيار الخطة الأنسب ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[#FF6B00] font-bold",
									children: "لجسمك وهدفك"
								}),
								"."
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex items-center justify-center my-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
								size: 12,
								className: "absolute text-[#FFB37A]/70 top-2 left-6 animate-pulse"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
								size: 10,
								className: "absolute text-[#FFB37A]/60 bottom-3 right-7 animate-pulse",
								style: { animationDelay: "0.4s" }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
								size: 14,
								className: "absolute text-[#FFB37A]/50 top-8 right-2 animate-pulse",
								style: { animationDelay: "0.8s" }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
								size: 9,
								className: "absolute text-[#FFB37A]/60 bottom-6 left-2 animate-pulse",
								style: { animationDelay: "1.2s" }
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
								width: "170",
								height: "170",
								viewBox: "0 0 170 170",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
										id: "ringGrad",
										x1: "0",
										y1: "0",
										x2: "1",
										y2: "1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
											offset: "0%",
											stopColor: "#FF8A3D"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
											offset: "100%",
											stopColor: "#FF5A00"
										})]
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
										cx: "85",
										cy: "85",
										r: R,
										fill: "none",
										stroke: "#FCE6D4",
										strokeWidth: "12"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
										cx: "85",
										cy: "85",
										r: R,
										fill: "none",
										stroke: "url(#ringGrad)",
										strokeWidth: "12",
										strokeLinecap: "round",
										strokeDasharray: `${dash} ${C - dash}`,
										transform: "rotate(-90 85 85)",
										style: { transition: "stroke-dasharray 80ms linear" }
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "absolute inset-0 flex flex-col items-center justify-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-baseline",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[36px] font-black text-gray-900 leading-none tabular-nums",
										children: pct
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[16px] font-bold text-gray-700 mr-0.5",
										children: "%"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] text-gray-500 mt-0.5",
									children: "...جاري التحضير"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex-1 min-h-0 mt-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute right-[10px] top-3 bottom-3 w-px bg-gray-200" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-col gap-1.5",
							children: items.map((it, i) => {
								const status = stepStatus(i);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `w-2.5 h-2.5 rounded-full shrink-0 z-10 ${status === "pending" ? "bg-gray-300" : "bg-[#FF6B00]"}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1 bg-white rounded-xl px-2.5 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center gap-2.5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "w-9 h-9 rounded-lg bg-[#FFF1E5] flex items-center justify-center shrink-0",
												children: it.icon
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex-1 min-w-0 text-right",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-[12.5px] font-bold text-gray-900 leading-tight",
													children: it.title
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-[10.5px] text-gray-500 leading-snug line-clamp-2",
													children: it.sub
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "w-6 h-6 shrink-0 flex items-center justify-center",
												children: [
													status === "done" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "w-6 h-6 rounded-full border-2 border-[#FF6B00] flex items-center justify-center",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
															size: 14,
															className: "text-[#FF6B00]",
															strokeWidth: 3
														})
													}),
													status === "loading" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-5 h-5 rounded-full border-2 border-[#FF6B00] border-t-transparent animate-spin" }),
													status === "pending" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-5 h-5 rounded-full border-2 border-dashed border-gray-300" })
												]
											})
										]
									})]
								}, i);
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative mt-1.5 rounded-2xl bg-gradient-to-l from-[#FFF1E5] to-[#FFF7EF] p-2 flex items-center gap-2 overflow-hidden shrink-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
								size: 56,
								className: "absolute left-3 top-1/2 -translate-y-1/2 text-[#FF6B00]/10"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative w-12 h-12 rounded-full bg-white overflow-hidden shrink-0 shadow",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: coach_default,
									alt: "Coach Hakim",
									className: "w-full h-full object-cover"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full bg-[#FF6B00] border-2 border-white flex items-center justify-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
										size: 8,
										className: "text-white",
										strokeWidth: 4
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1 text-right",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-[12px] font-bold text-gray-900 flex items-center justify-end gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "خصوصيتك 100% آمنة" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
										size: 11,
										className: "text-[#FF6B00]"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10.5px] text-gray-600 leading-snug",
									children: "جميع بياناتك محمية ولن يتم مشاركتها مع أي جهة خارجية نهائياً."
								})]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "shrink-0 mt-1.5 mx-4 mb-2 rounded-xl bg-[#FFF1E5] px-3 py-2 flex items-center justify-center gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lightbulb, {
					size: 14,
					className: "text-[#FF6B00]"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-[11.5px] text-gray-700 text-center",
					children: [
						"أنت في ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[#FF6B00] font-bold",
							children: "الخطوة الأخيرة!"
						}),
						" بعد التحضير ستستلم برنامجك مباشرة."
					]
				})]
			})
		]
	});
}
function BarsIcon() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: "22",
		height: "22",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "#FF6B00",
		strokeWidth: "2.2",
		strokeLinecap: "round",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: "6",
				y1: "18",
				x2: "6",
				y2: "14"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: "12",
				y1: "18",
				x2: "12",
				y2: "10"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: "18",
				y1: "18",
				x2: "18",
				y2: "6"
			})
		]
	});
}
function BrainIcon2() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: "22",
		height: "22",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "#FF6B00",
		strokeWidth: "1.8",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-2 5 3 3 0 0 0 2 5v1a3 3 0 0 0 3 3h1V4H9z" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 2 5 3 3 0 0 1-2 5v1a3 3 0 0 1-3 3h-1V4h1z" })]
	});
}
function ClipboardIcon() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: "22",
		height: "22",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "#FF6B00",
		strokeWidth: "1.8",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "6",
				y: "4",
				width: "12",
				height: "17",
				rx: "2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M9 3h6v3H9z" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: "9",
				y1: "11",
				x2: "15",
				y2: "11"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: "9",
				y1: "15",
				x2: "13",
				y2: "15"
			})
		]
	});
}
function ClipboardStarIcon() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: "22",
		height: "22",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "#FF6B00",
		strokeWidth: "1.8",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "6",
				y: "4",
				width: "12",
				height: "17",
				rx: "2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M9 3h6v3H9z" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M12 10l1.2 2.4 2.6.4-1.9 1.8.4 2.6L12 16l-2.3 1.2.4-2.6-1.9-1.8 2.6-.4z",
				fill: "#FF6B00",
				stroke: "none"
			})
		]
	});
}
var COUNTRIES = [
	{
		code: "ae",
		name: "الإمارات العربية المتحدة",
		dial: "+971",
		flag: "🇦🇪",
		cities: [
			"دبي",
			"أبوظبي",
			"الشارقة",
			"عجمان",
			"رأس الخيمة",
			"الفجيرة",
			"أم القيوين",
			"العين"
		]
	},
	{
		code: "sa",
		name: "المملكة العربية السعودية",
		dial: "+966",
		flag: "🇸🇦",
		cities: [
			"الرياض",
			"جدة",
			"مكة المكرمة",
			"المدينة المنورة",
			"الدمام",
			"الخبر",
			"الطائف",
			"تبوك",
			"أبها",
			"حائل"
		]
	},
	{
		code: "kw",
		name: "الكويت",
		dial: "+965",
		flag: "🇰🇼",
		cities: [
			"مدينة الكويت",
			"حولي",
			"الفروانية",
			"الأحمدي",
			"الجهراء",
			"مبارك الكبير"
		]
	},
	{
		code: "qa",
		name: "قطر",
		dial: "+974",
		flag: "🇶🇦",
		cities: [
			"الدوحة",
			"الريان",
			"الوكرة",
			"الخور",
			"أم صلال"
		]
	},
	{
		code: "bh",
		name: "البحرين",
		dial: "+973",
		flag: "🇧🇭",
		cities: [
			"المنامة",
			"المحرق",
			"الرفاع",
			"مدينة عيسى",
			"مدينة حمد"
		]
	},
	{
		code: "om",
		name: "عمان",
		dial: "+968",
		flag: "🇴🇲",
		cities: [
			"مسقط",
			"صلالة",
			"صحار",
			"نزوى",
			"صور"
		]
	},
	{
		code: "eg",
		name: "مصر",
		dial: "+20",
		flag: "🇪🇬",
		cities: [
			"القاهرة",
			"الإسكندرية",
			"الجيزة",
			"شبرا الخيمة",
			"بورسعيد",
			"السويس",
			"المنصورة",
			"طنطا",
			"أسيوط"
		]
	},
	{
		code: "jo",
		name: "الأردن",
		dial: "+962",
		flag: "🇯🇴",
		cities: [
			"عمّان",
			"الزرقاء",
			"إربد",
			"العقبة",
			"السلط"
		]
	},
	{
		code: "lb",
		name: "لبنان",
		dial: "+961",
		flag: "🇱🇧",
		cities: [
			"بيروت",
			"طرابلس",
			"صيدا",
			"صور",
			"زحلة"
		]
	},
	{
		code: "iq",
		name: "العراق",
		dial: "+964",
		flag: "🇮🇶",
		cities: [
			"بغداد",
			"البصرة",
			"الموصل",
			"أربيل",
			"النجف",
			"كربلاء"
		]
	},
	{
		code: "ma",
		name: "المغرب",
		dial: "+212",
		flag: "🇲🇦",
		cities: [
			"الدار البيضاء",
			"الرباط",
			"سلا",
			"فاس",
			"مراكش",
			"طنجة",
			"أكادير",
			"وجدة",
			"القنيطرة",
			"مكناس",
			"تطوان",
			"الصويرة",
			"العيون",
			"الناظور",
			"الجديدة",
			"بني ملال",
			"خريبكة",
			"آسفي",
			"تازة",
			"الرشيدية",
			"ورزازات",
			"الحسيمة",
			"العرائش",
			"القصر الكبير",
			"تارودانت",
			"برشيد",
			"سطات",
			"إفران",
			"أزرو",
			"خنيفرة",
			"الداخلة",
			"تيزنيت",
			"كلميم",
			"بوجدور",
			"الفنيدق",
			"المحمدية",
			"تمارة",
			"بركان",
			"تاوريرت"
		]
	},
	{
		code: "dz",
		name: "الجزائر",
		dial: "+213",
		flag: "🇩🇿",
		cities: [
			"الجزائر",
			"وهران",
			"قسنطينة",
			"عنابة",
			"البليدة"
		]
	},
	{
		code: "tn",
		name: "تونس",
		dial: "+216",
		flag: "🇹🇳",
		cities: [
			"تونس",
			"صفاقس",
			"سوسة",
			"بنزرت",
			"القيروان"
		]
	},
	{
		code: "ly",
		name: "ليبيا",
		dial: "+218",
		flag: "🇱🇾",
		cities: [
			"طرابلس",
			"بنغازي",
			"مصراتة",
			"الزاوية",
			"البيضاء"
		]
	},
	{
		code: "ye",
		name: "اليمن",
		dial: "+967",
		flag: "🇾🇪",
		cities: [
			"صنعاء",
			"عدن",
			"تعز",
			"الحديدة",
			"إب"
		]
	},
	{
		code: "sd",
		name: "السودان",
		dial: "+249",
		flag: "🇸🇩",
		cities: [
			"الخرطوم",
			"أم درمان",
			"بورتسودان",
			"كسلا"
		]
	},
	{
		code: "sy",
		name: "سوريا",
		dial: "+963",
		flag: "🇸🇾",
		cities: [
			"دمشق",
			"حلب",
			"حمص",
			"اللاذقية",
			"حماة"
		]
	},
	{
		code: "ps",
		name: "فلسطين",
		dial: "+970",
		flag: "🇵🇸",
		cities: [
			"القدس",
			"غزة",
			"رام الله",
			"الخليل",
			"نابلس"
		]
	},
	{
		code: "tr",
		name: "تركيا",
		dial: "+90",
		flag: "🇹🇷",
		cities: [
			"إسطنبول",
			"أنقرة",
			"إزمير",
			"بورصة",
			"أنطاليا"
		]
	},
	{
		code: "us",
		name: "الولايات المتحدة",
		dial: "+1",
		flag: "🇺🇸",
		cities: [
			"نيويورك",
			"لوس أنجلوس",
			"شيكاغو",
			"هيوستن",
			"ميامي"
		]
	},
	{
		code: "gb",
		name: "المملكة المتحدة",
		dial: "+44",
		flag: "🇬🇧",
		cities: [
			"لندن",
			"مانشستر",
			"برمنغهام",
			"ليفربول",
			"غلاسكو"
		]
	},
	{
		code: "ca",
		name: "كندا",
		dial: "+1",
		flag: "🇨🇦",
		cities: [
			"تورنتو",
			"مونتريال",
			"فانكوفر",
			"كالغاري",
			"أوتاوا"
		]
	},
	{
		code: "de",
		name: "ألمانيا",
		dial: "+49",
		flag: "🇩🇪",
		cities: [
			"برلين",
			"هامبورغ",
			"ميونخ",
			"كولونيا",
			"فرانكفورت"
		]
	},
	{
		code: "fr",
		name: "فرنسا",
		dial: "+33",
		flag: "🇫🇷",
		cities: [
			"باريس",
			"مرسيليا",
			"ليون",
			"تولوز",
			"نيس"
		]
	}
];
function ContactScreen({ quizAnswers, onBack, onDone }) {
	const ORANGE = "#FF6B00";
	const [showOverlay, setShowOverlay] = (0, import_react.useState)(true);
	const [fadingOverlay, setFadingOverlay] = (0, import_react.useState)(false);
	const [overlayProgress, setOverlayProgress] = (0, import_react.useState)(0);
	const [form, setForm] = (0, import_react.useState)({
		name: "",
		email: "",
		phone: "",
		country: "ae",
		city: ""
	});
	const [submitting, setSubmitting] = (0, import_react.useState)(false);
	const [countryOpen, setCountryOpen] = (0, import_react.useState)(false);
	const [cityOpen, setCityOpen] = (0, import_react.useState)(false);
	const [countryQuery, setCountryQuery] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		const DURATION = 1e4;
		const start = Date.now();
		const tick = setInterval(() => {
			const p = Math.min(100, (Date.now() - start) / DURATION * 100);
			setOverlayProgress(p);
			if (p >= 100) clearInterval(tick);
		}, 50);
		const tFade = setTimeout(() => setFadingOverlay(true), DURATION - 500);
		const tHide = setTimeout(() => setShowOverlay(false), DURATION);
		return () => {
			clearInterval(tick);
			clearTimeout(tFade);
			clearTimeout(tHide);
		};
	}, []);
	const country = COUNTRIES.find((c) => c.code === form.country) ?? COUNTRIES[0];
	const filteredCountries = countryQuery ? COUNTRIES.filter((c) => c.name.includes(countryQuery) || c.dial.includes(countryQuery)) : COUNTRIES;
	const cities = country.cities;
	const canSubmit = form.name.trim() && form.email.trim() && form.phone.trim() && form.city.trim();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		dir: "rtl",
		className: "relative h-full w-full overflow-y-auto",
		style: { backgroundColor: "#FAF8F5" },
		children: [
			showOverlay && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `fixed inset-0 z-50 flex flex-col items-center justify-center px-8 text-center transition-opacity duration-500 ${fadingOverlay ? "opacity-0" : "opacity-100"}`,
				style: { background: "linear-gradient(180deg, #FFF8F1 0%, #FAF8F5 100%)" },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid h-20 w-20 place-items-center rounded-full mb-6 animate-scale-in",
						style: { background: "rgba(255,107,0,0.12)" },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
							className: "h-10 w-10",
							style: { color: ORANGE },
							strokeWidth: 3
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-2xl font-black text-neutral-900 leading-snug animate-fade-in",
						children: "تهانينا! 🎉 تم تحليل بياناتك بنجاح"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 max-w-sm text-[14px] leading-7 text-neutral-600 animate-fade-in",
						children: "لقد وجدت الخطة المثالية التي تضمن لك الوصول لنتائجك المرغوبة خلال 90 يوماً بدقة. خطوتك الأخيرة هي تزويدي بمعلومات التواصل الأساسية لتأكيد استلام برنامجك الخاص."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-8 w-full max-w-xs h-2 rounded-full overflow-hidden",
						style: { background: "rgba(255,107,0,0.15)" },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full rounded-full transition-[width] duration-100 ease-linear",
							style: {
								width: `${overlayProgress}%`,
								background: `linear-gradient(90deg, ${ORANGE} 0%, #FFB547 100%)`
							}
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 text-[11.5px] text-neutral-500",
						children: [Math.ceil((100 - overlayProgress) / 10), " ثوانٍ..."]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 pt-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: onBack,
							className: "flex items-center gap-1 text-neutral-700",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-5 w-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm",
								children: "رجوع"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-sm font-bold",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								style: { color: ORANGE },
								children: "10"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-neutral-700",
								children: " من 13"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-12" })
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex gap-1.5",
					children: Array.from({ length: 13 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-1.5 flex-1 rounded-full",
						style: { backgroundColor: i < 10 ? ORANGE : "#E5E5E5" }
					}, i))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 pt-4 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "font-[Tajawal] text-[25px] font-black leading-[1.25] text-neutral-900",
					children: [
						"لقد وجدت",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "program-match-title relative inline-block pb-2",
							style: { color: ORANGE },
							children: ["البرنامج المناسب لك", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "program-match-lines",
								"aria-hidden": "true",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "program-match-line program-match-line-1" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "program-match-line program-match-line-2" })]
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mx-auto mt-3 max-w-[280px] text-[13px] leading-7 text-neutral-600",
					children: "بناءً على إجاباتك، قمت بتحليل هدفك وحالتك الحالية لتحديد أفضل استراتيجية مناسبة لك."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 mt-7 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "-translate-y-[10px] flex items-center justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Target, {
						className: "h-5 w-5",
						style: { color: ORANGE }
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
						className: "text-[18px] font-black text-neutral-900",
						children: [
							"بقيت ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								style: { color: ORANGE },
								children: "خطوة أخيرة"
							}),
							" فقط"
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "-translate-y-[10px] mt-1.5 text-[13px] text-neutral-600",
					children: "أدخل بياناتك لاستلام برنامجك الخاص."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 mt-4 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldRow, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserIcon, {}),
						label: "الاسم",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: form.name,
							onChange: (e) => setForm({
								...form,
								name: e.target.value
							}),
							placeholder: "مثال: أحمد",
							dir: "rtl",
							className: "quiz-input w-full bg-transparent outline-none text-[14px] text-right placeholder:text-neutral-400"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldRow, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MailIcon, {}),
						label: "البريد الإلكتروني",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "email",
							value: form.email,
							onChange: (e) => setForm({
								...form,
								email: e.target.value
							}),
							placeholder: "example@email.com",
							dir: "ltr",
							className: "quiz-input w-full bg-transparent outline-none text-[14px] text-left placeholder:text-neutral-400"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldRow, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhatsAppIcon, {}),
						label: "واتساب للتواصل",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 w-full",
							dir: "ltr",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setCountryOpen(true),
								className: "flex items-center gap-1 rounded-lg bg-neutral-50 px-2 py-1.5 ring-1 ring-black/5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-base leading-none",
										children: country.flag
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[13px] font-semibold",
										children: country.dial
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-3 w-3 text-neutral-500" })
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: form.phone,
								onChange: (e) => setForm({
									...form,
									phone: e.target.value.replace(/\D/g, "").slice(0, 12)
								}),
								placeholder: form.country === "ma" ? "6X XXX XXXX" : "5X XXX XXXX",
								dir: "ltr",
								inputMode: "numeric",
								className: "quiz-input flex-1 bg-transparent outline-none text-[14px] text-left placeholder:text-neutral-400"
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldRow, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlobeIcon, {}),
						label: "الدولة",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setCountryOpen(true),
							className: "flex items-center justify-between w-full",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4 text-neutral-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[14px]",
									children: country.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-base leading-none",
									children: country.flag
								})]
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldRow, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PinIcon, {}),
						label: "المدينة",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setCityOpen(true),
							className: "flex items-center justify-between w-full",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4 text-neutral-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `text-[14px] ${form.city ? "text-neutral-900" : "text-neutral-400"}`,
								children: form.city || `اختر مدينة في ${country.name}`
							})]
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-5 mt-5 rounded-2xl p-4",
				style: { background: "rgba(255,107,0,0.06)" },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-3 gap-2 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrustItem, {
							color: "#22C55E",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WhatsAppIcon, { small: true }),
							text: "ستصلك رسالة الترحيب وخطة العمل مباشرة عبر الواتساب",
							signalDelay: 0
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrustItem, {
							color: "#3B82F6",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MailIcon, { small: true }),
							text: "سأرسل برنامجك وتفاصيله على البريد الإلكتروني",
							signalDelay: 450
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrustItem, {
							color: "#16A34A",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldIcon, {}),
							text: "بياناتك خاصة وآمنة 100%",
							signalDelay: 900
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 mt-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					disabled: !canSubmit || submitting,
					onClick: async () => {
						if (!canSubmit || submitting) return;
						setSubmitting(true);
						const selectedCountry = COUNTRIES.find((c) => c.code === form.country);
						const isDubai = form.country === "ae" && form.city === "دبي";
						const fullPhone = `${selectedCountry?.dial ?? ""} ${form.phone.trim()}`.trim();
						try {
							await createLead(buildLeadInsertFromQuiz(quizAnswers, {
								fullName: form.name.trim(),
								email: form.email.trim(),
								phone: fullPhone,
								city: form.city,
								country: selectedCountry?.name ?? form.country,
								locationPreference: isDubai ? "dubai" : "remote"
							}));
							onDone(form.name.trim(), isDubai, fullPhone, form.city);
						} catch (error) {
							console.error("Failed to save lead:", error);
							alert("حدث خطأ في حفظ بياناتك. حاول مرة أخرى.");
							setSubmitting(false);
						}
					},
					className: "cta-pulse w-full h-14 rounded-2xl font-black text-white text-[17px] flex items-center justify-center gap-2 shadow-[0_8px_20px_-6px_rgba(255,107,0,0.5)] transition-transform active:scale-[0.98] disabled:opacity-60 disabled:animate-none",
					style: { background: `linear-gradient(180deg, ${ORANGE} 0%, #E85F00 100%)` },
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "🚀" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "استلم برنامجي الآن" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex items-center justify-center gap-1.5 text-[11.5px] text-neutral-500",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-3 w-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "لن تتم مشاركة بياناتك مع أي جهة خارجية" })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 mt-4 pb-8 flex items-center justify-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex -space-x-2 rtl:space-x-reverse",
					children: [
						avatar1_default,
						avatar2_default,
						avatar3_default,
						avatar4_default
					].map((a, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: a,
						alt: "",
						className: "h-7 w-7 rounded-full ring-2 ring-white object-cover"
					}, i))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-[12px] text-neutral-600",
					children: [
						"أكثر من ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-black",
							style: { color: ORANGE },
							children: "2500"
						}),
						" شخص غيروا حياتهم مع البرنامج"
					]
				})]
			}),
			countryOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PickerSheet, {
				title: "اختر الدولة",
				onClose: () => {
					setCountryOpen(false);
					setCountryQuery("");
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "px-4 pb-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: countryQuery,
						onChange: (e) => setCountryQuery(e.target.value),
						placeholder: "ابحث عن دولة...",
						className: "w-full rounded-xl bg-neutral-100 px-4 py-2.5 text-[14px] outline-none focus:ring-2 focus:ring-[#FF6B00]/40 text-right",
						dir: "rtl"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "max-h-[55vh] overflow-y-auto px-2 pb-4",
					children: filteredCountries.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							setForm((f) => ({
								...f,
								country: c.code,
								city: ""
							}));
							setCountryOpen(false);
							setCountryQuery("");
						},
						className: `w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-right hover:bg-neutral-50 ${c.code === form.country ? "bg-orange-50" : ""}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[12px] text-neutral-500",
							dir: "ltr",
							children: c.dial
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 flex-1 justify-end",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[14px] font-medium text-neutral-900",
								children: c.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xl leading-none",
								children: c.flag
							})]
						})]
					}, c.code))
				})]
			}),
			cityOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickerSheet, {
				title: `مدن ${country.name}`,
				onClose: () => setCityOpen(false),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "max-h-[55vh] overflow-y-auto px-2 pb-4",
					children: cities.map((city) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							setForm((f) => ({
								...f,
								city
							}));
							setCityOpen(false);
						},
						className: `w-full flex items-center justify-end gap-2 px-4 py-3 rounded-xl text-right hover:bg-neutral-50 ${city === form.city ? "bg-orange-50" : ""}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[14px] font-medium text-neutral-900",
							children: city
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PinIcon, {})]
					}, city))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        .quiz-input { transition: box-shadow .2s ease; }
        .quiz-input:focus { box-shadow: 0 0 0 3px rgba(255,107,0,0.18); border-radius: 8px; }
        @keyframes cta-pulse-kf { 0%,100% { box-shadow: 0 8px 20px -6px rgba(255,107,0,0.5), 0 0 0 0 rgba(255,107,0,0.55); } 50% { box-shadow: 0 8px 24px -4px rgba(255,107,0,0.6), 0 0 0 10px rgba(255,107,0,0); } }
        .cta-pulse { animation: cta-pulse-kf 2.2s ease-in-out infinite; }
        .trust-signal-ring {
          border: 1.5px solid var(--trust-signal-color);
          opacity: 0;
          animation: trustSignalPing 2.5s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }
        .trust-signal-ring-2 { animation-delay: calc(var(--trust-signal-delay, 0ms) + 800ms); }
        .trust-signal-dot {
          animation: trustSignalDot 1.8s ease-in-out infinite;
          animation-delay: var(--trust-signal-delay, 0ms);
        }
        .trust-signal-icon {
          animation: trustSignalGlow 2.5s ease-in-out infinite;
          animation-delay: var(--trust-signal-delay, 0ms);
        }
        @keyframes trustSignalPing {
          0% { transform: scale(0.9); opacity: 0.5; }
          75%, 100% { transform: scale(1.65); opacity: 0; }
        }
        @keyframes trustSignalDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.72); }
        }
        @keyframes trustSignalGlow {
          0%, 100% { box-shadow: 0 0 0 0 transparent; }
          50% { box-shadow: 0 0 0 5px color-mix(in srgb, var(--trust-signal-color) 18%, transparent); }
        }
        .program-match-lines {
          position: absolute;
          right: 0;
          left: 0;
          bottom: -7px;
          height: 7px;
          overflow: hidden;
          pointer-events: none;
        }
        .program-match-line {
          display: block;
          height: 2px;
          border-radius: 999px;
          transform-origin: center center;
          will-change: transform, opacity;
        }
        .program-match-line-1 {
          background: linear-gradient(90deg, transparent 0%, #FF6B00 18%, #FFB547 52%, #FF6B00 82%, transparent 100%);
          animation: programMatchLineSweep 2.6s cubic-bezier(0.45, 0, 0.25, 1) infinite;
        }
        .program-match-line-2 {
          margin-top: 3px;
          height: 1.5px;
          opacity: 0.75;
          background: linear-gradient(90deg, transparent 0%, rgba(255,107,0,0.35) 20%, rgba(255,181,71,0.95) 50%, rgba(255,107,0,0.35) 80%, transparent 100%);
          animation: programMatchLineSweep 2.6s cubic-bezier(0.45, 0, 0.25, 1) infinite;
          animation-delay: 0.45s;
        }
        @keyframes programMatchLineSweep {
          0% { transform: scaleX(0.12); opacity: 0.2; }
          45% { transform: scaleX(1); opacity: 1; }
          55% { transform: scaleX(1); opacity: 1; }
          100% { transform: scaleX(0.12); opacity: 0.2; }
        }
      ` })
		]
	});
}
function PickerSheet({ title, onClose, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-[60] flex items-end justify-center",
		onClick: onClose,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-black/40 animate-fade-in" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			dir: "rtl",
			onClick: (e) => e.stopPropagation(),
			className: "relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl animate-slide-in-right",
			style: { animation: "slideUp .3s ease-out both" },
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between px-5 pt-4 pb-3 border-b border-neutral-100",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: onClose,
							className: "text-neutral-500 text-sm",
							children: "إلغاء"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
							className: "text-[15px] font-bold text-neutral-900",
							children: title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-10" })
					]
				}),
				children,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `@keyframes slideUp { from { transform: translateY(100%);} to { transform: translateY(0);} }` })
			]
		})]
	});
}
function FieldRow({ icon, label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-black/5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] focus-within:ring-2 focus-within:ring-[#FF6B00]/40 focus-within:shadow-[0_4px_18px_-6px_rgba(255,107,0,0.35)] transition-all",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 shrink-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid h-7 w-7 place-items-center",
				children: icon
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[13px] font-bold text-neutral-800",
				children: label
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex-1 min-w-0 text-left",
			children
		})]
	});
}
function TrustItem({ icon, text, color, signalDelay = 0 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center gap-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative grid h-8 w-8 place-items-center",
			style: {
				"--trust-signal-color": color,
				"--trust-signal-delay": `${signalDelay}ms`
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "trust-signal-ring absolute inset-0 rounded-full",
					style: { animationDelay: `${signalDelay}ms` }
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "trust-signal-ring trust-signal-ring-2 absolute inset-0 rounded-full" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "trust-signal-dot absolute -top-0.5 -left-0.5 h-2 w-2 rounded-full ring-2 ring-white",
					style: { background: color }
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "trust-signal-icon relative grid h-8 w-8 place-items-center rounded-full bg-white ring-1 ring-black/5",
					style: { color },
					children: icon
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-[10.5px] leading-snug text-neutral-700",
			children: text
		})]
	});
}
function UserIcon() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: "18",
		height: "18",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "#FF6B00",
		strokeWidth: "1.8",
		strokeLinecap: "round",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "12",
			cy: "8",
			r: "4"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 21c0-4 4-7 8-7s8 3 8 7" })]
	});
}
function MailIcon({ small } = {}) {
	const s = small ? 16 : 18;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: s,
		height: s,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.8",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		style: { color: small ? "#3B82F6" : "#FF6B00" },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			x: "3",
			y: "5",
			width: "18",
			height: "14",
			rx: "2"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3 7l9 6 9-6" })]
	});
}
function WhatsAppIcon({ small } = {}) {
	const s = small ? 16 : 20;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		width: s,
		height: s,
		viewBox: "0 0 24 24",
		fill: "#22C55E",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 2a10 10 0 00-8.5 15.2L2 22l4.9-1.4A10 10 0 1012 2zm5.5 14.3c-.2.6-1.3 1.2-1.8 1.3-.5.1-1.1.1-1.7-.1-.4-.1-1-.3-1.7-.6-3-1.3-5-4.3-5.1-4.5-.2-.2-1.2-1.6-1.2-3.1s.8-2.2 1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .5-.1.7.5.3.7 1 2.3 1 2.4.1.1.1.3 0 .5-.1.2-.2.3-.3.5l-.5.5c-.2.2-.3.3-.1.6.2.3.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.8 1.7.3.1.5.1.7-.1.2-.2.8-.9 1-1.2.2-.3.4-.3.7-.2.3.1 1.8.9 2.1 1 .3.2.5.2.6.4.1.1.1.7-.1 1.3z" })
	});
}
function GlobeIcon() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: "18",
		height: "18",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "#FF6B00",
		strokeWidth: "1.8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "12",
			cy: "12",
			r: "9"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" })]
	});
}
function PinIcon() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: "18",
		height: "18",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "#FF6B00",
		strokeWidth: "1.8",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 22s-7-7.5-7-12a7 7 0 1114 0c0 4.5-7 12-7 12z" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "12",
			cy: "10",
			r: "2.5"
		})]
	});
}
function ShieldIcon() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: "16",
		height: "16",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "#16A34A",
		strokeWidth: "1.8",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M9 12l2 2 4-4" })]
	});
}
function buildRevealConfig(gender, goalId, challengeId) {
	const isFemale = gender === "female";
	if (isFemale && (goalId === "glutes" || challengeId === "glutes")) return {
		programTitle: "برنامج شد وتكبير المؤخرة",
		goalLabel: "تكبير وشد المؤخرة",
		problemLabel: "شكل المؤخرة غير متناسق",
		metricNumbers: [
			"6.2",
			"5.7",
			"4.8",
			"5.1",
			"6.5"
		],
		metricUnit: "سم",
		metricDesc: "زيادة في محيط المؤخرة",
		benefits: [
			{
				label: "زيادة الثقة بالنفس",
				value: "+70%",
				color: "#FF6B00",
				bg: "#FFE9D9",
				Icon: Zap
			},
			{
				label: "تقليل مقاسات الجسم",
				value: "4 - 10 سم",
				color: "#22C55E",
				bg: "#E8FAEE",
				Icon: Ruler
			},
			{
				label: "حرق الدهون",
				value: "10-18 كجم",
				color: "#9333EA",
				bg: "#F3E8FF",
				Icon: Flame
			},
			{
				label: "تحسين شكل الجسم",
				value: "+80%",
				color: "#3B82F6",
				bg: "#DBEAFE",
				Icon: PersonStanding
			}
		]
	};
	if (goalId === "fat" || challengeId === "belly") return {
		programTitle: isFemale ? "برنامج خسارة دهون البطن" : "برنامج خسارة الدهون وشد البطن",
		goalLabel: "خسارة الدهون",
		problemLabel: isFemale ? "الكرش ودهون البطن" : "دهون البطن والكرش",
		metricNumbers: [
			"8.5",
			"12.3",
			"10.1",
			"14.0",
			"9.7"
		],
		metricUnit: "كجم",
		metricDesc: "خسارة في الدهون",
		benefits: [
			{
				label: "حرق الدهون",
				value: "10-18 كجم",
				color: "#FF6B00",
				bg: "#FFE9D9",
				Icon: Flame
			},
			{
				label: "تقليل محيط الخصر",
				value: "8 - 15 سم",
				color: "#22C55E",
				bg: "#E8FAEE",
				Icon: Ruler
			},
			{
				label: "زيادة الطاقة والنشاط",
				value: "+85%",
				color: "#3B82F6",
				bg: "#DBEAFE",
				Icon: Zap
			},
			{
				label: "تحسين شكل الجسم",
				value: "+80%",
				color: "#9333EA",
				bg: "#F3E8FF",
				Icon: PersonStanding
			}
		]
	};
	if (goalId === "muscle" || challengeId === "muscle") return {
		programTitle: "برنامج بناء العضلات والقوة",
		goalLabel: "بناء العضلات",
		problemLabel: "صعوبة بناء الكتلة العضلية",
		metricNumbers: [
			"5.8",
			"6.4",
			"4.9",
			"5.5",
			"7.1"
		],
		metricUnit: "كجم",
		metricDesc: "زيادة في الكتلة العضلية",
		benefits: [
			{
				label: "زيادة الكتلة العضلية",
				value: "+5-8 كجم",
				color: "#FF6B00",
				bg: "#FFE9D9",
				Icon: Dumbbell
			},
			{
				label: "زيادة القوة",
				value: "+90%",
				color: "#22C55E",
				bg: "#E8FAEE",
				Icon: Zap
			},
			{
				label: "تحسين شكل الجسم",
				value: "+85%",
				color: "#3B82F6",
				bg: "#DBEAFE",
				Icon: PersonStanding
			},
			{
				label: "زيادة الثقة بالنفس",
				value: "+75%",
				color: "#9333EA",
				bg: "#F3E8FF",
				Icon: Trophy
			}
		]
	};
	return {
		programTitle: isFemale ? "برنامج شد القوام المخصص لكِ" : "برنامج التحول الكامل المخصص لك",
		goalLabel: isFemale ? "جسم متناسق ورشيق" : "جسم رياضي ومتناسق",
		problemLabel: "عدم الرضا عن الشكل الحالي",
		metricNumbers: [
			"6.0",
			"5.5",
			"5.0",
			"6.5",
			"5.8"
		],
		metricUnit: "سم",
		metricDesc: "تحسن في مقاسات الجسم",
		benefits: [
			{
				label: "تحسين شكل الجسم",
				value: "+85%",
				color: "#FF6B00",
				bg: "#FFE9D9",
				Icon: PersonStanding
			},
			{
				label: "تقليل المقاسات",
				value: "5 - 12 سم",
				color: "#22C55E",
				bg: "#E8FAEE",
				Icon: Ruler
			},
			{
				label: "زيادة الطاقة",
				value: "+80%",
				color: "#3B82F6",
				bg: "#DBEAFE",
				Icon: Zap
			},
			{
				label: "زيادة الثقة بالنفس",
				value: "+75%",
				color: "#9333EA",
				bg: "#F3E8FF",
				Icon: Trophy
			}
		]
	};
}
var TIMELINE_STAGES = [
	{
		week: "الأسبوع 1-2",
		title: "بداية التغيير",
		desc: ["تحسن في الطاقة", "بداية حرق الدهون"],
		color: "#22C55E",
		bg: "#E8FAEE",
		Icon: Sparkles
	},
	{
		week: "الأسبوع 3-6",
		title: "تغير ملحوظ",
		desc: ["نزول المقاسات", "تحسن في شكل الجسم"],
		color: "#FF6B00",
		bg: "#FFE9D9",
		Icon: Flame
	},
	{
		week: "الأسبوع 7-12",
		title: "نتائج واضحة",
		desc: ["شد وتناسق أكبر", "زيادة في الكتلة العضلية"],
		color: "#9333EA",
		bg: "#F3E8FF",
		Icon: Dumbbell
	},
	{
		week: "الأسبوع 13+",
		title: "الشكل المثالي",
		desc: ["الوصول للهدف", "الاستمرارية والنتائج الدائمة"],
		color: "#3B82F6",
		bg: "#DBEAFE",
		Icon: Trophy
	}
];
function ProgramRevealScreen({ name, gender, goalId, challengeId, total = 13, onNext }) {
	const ORANGE = "#FF6B00";
	const GREEN = "#22C55E";
	const TEXT = "#0F172A";
	const cfg = buildRevealConfig(gender, goalId, challengeId);
	const useGlutesRevealPhotos = gender === "female" && (goalId === "glutes" || challengeId === "glutes");
	const [showGoal, setShowGoal] = (0, import_react.useState)(false);
	const [showResults, setShowResults] = (0, import_react.useState)(false);
	const [showBenefits, setShowBenefits] = (0, import_react.useState)(false);
	const [showTimeline, setShowTimeline] = (0, import_react.useState)(false);
	const [showSuccess, setShowSuccess] = (0, import_react.useState)(false);
	const [showCTA, setShowCTA] = (0, import_react.useState)(false);
	const [carouselIdx, setCarouselIdx] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		const timers = [];
		timers.push(window.setTimeout(() => setShowGoal(true), 1e3));
		timers.push(window.setTimeout(() => setShowResults(true), 2e3));
		timers.push(window.setTimeout(() => setShowBenefits(true), 3500));
		timers.push(window.setTimeout(() => setShowTimeline(true), 5e3));
		timers.push(window.setTimeout(() => setShowSuccess(true), 7e3));
		timers.push(window.setTimeout(() => setShowCTA(true), 8500));
		return () => {
			timers.forEach(clearTimeout);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (!showResults) return;
		const id = window.setInterval(() => {
			setCarouselIdx((i) => (i + 1) % cfg.metricNumbers.length);
		}, 2200);
		return () => clearInterval(id);
	}, [showResults, cfg.metricNumbers.length]);
	const HEADING_FONT = "'Cairo', 'Tajawal', sans-serif";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "h-full w-full overflow-y-auto",
		style: {
			background: "#FAF8F5",
			fontFamily: FONT
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        @keyframes pr-fade { from { opacity: 0; transform: translateY(14px);} to {opacity:1; transform: translateY(0);} }
        @keyframes pr-pop  { 0% { opacity:0; transform: scale(.7);} 60% { transform: scale(1.05);} 100% { opacity:1; transform: scale(1);} }
        @keyframes pr-stagger { from {opacity:0; transform: translateY(18px);} to {opacity:1; transform: translateY(0);} }
        @keyframes pr-glow-success { 0%,100% { box-shadow: 0 10px 30px -8px rgba(34,197,94,.35);} 50% { box-shadow: 0 22px 55px -6px rgba(34,197,94,.55);} }
        @keyframes pr-draw { from { stroke-dashoffset: 400; } to { stroke-dashoffset: 0; } }
        @keyframes pr-shimmer-bg { 0%{ background-position: -200% 0;} 100%{ background-position: 200% 0;} }
        @keyframes pr-dot-in { from { opacity:0; transform: scale(0);} to {opacity:1; transform: scale(1);} }
        .pr-fade { animation: pr-fade .7s ease-out both; }
        .pr-pop { animation: pr-pop .55s cubic-bezier(.34,1.56,.64,1) both; }
        .pr-stagger { animation: pr-stagger .55s cubic-bezier(.2,.8,.2,1) both; }
        .pr-glow { animation: pr-glow-success 2.4s ease-in-out infinite; }
        .pr-line { stroke-dasharray: 400; animation: pr-draw 1.6s ease-out forwards; }
        .pr-dot { animation: pr-dot-in .5s cubic-bezier(.34,1.56,.64,1) both; }
        .pr-shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,.6), transparent); background-size: 200% 100%; animation: pr-shimmer-bg 1.6s linear infinite; }
        .pr-heading { font-family: ${HEADING_FONT}; font-weight: 900; letter-spacing: -0.01em; }
      ` }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 pt-5 max-w-md mx-auto",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center text-[12px] font-bold text-neutral-500 mb-2",
					children: ["12 من ", total]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-1.5",
					children: Array.from({ length: total }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 h-1.5 rounded-full",
						style: { background: i < 12 ? ORANGE : "#ECE8E1" }
					}, i))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 pt-6 pb-32 max-w-md mx-auto",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pr-fade text-right",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-[Tajawal] text-[24px] font-black leading-tight",
							style: { color: TEXT },
							children: "هذا ما يمكنك تحقيقه خلال"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-[Tajawal] text-[34px] font-black leading-none mt-1",
							style: { color: ORANGE },
							children: "90 يوم"
						})] })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "pr-fade mt-3 text-[13px] text-neutral-600 leading-relaxed text-center px-2",
						style: { animationDelay: ".15s" },
						children: [name ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							"بناءً على هدفك يا ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-bold",
								style: { color: ORANGE },
								children: name
							}),
							" وتحليل بياناتك، "
						] }) : "بناءً على هدفك الحالي وتحليل بياناتك، ", "هذه نتائج حقيقية لأشخاص يعانون من نفس المشكلة التي تعاني منها."]
					}),
					showGoal && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pr-pop mt-5 rounded-3xl bg-white p-1 grid grid-cols-2 gap-1",
						style: {
							boxShadow: "0 10px 30px -16px rgba(0,0,0,.14)",
							border: "1px solid #ECE8E1"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-[20px] p-3 flex items-center gap-2.5",
							style: { background: "#FFF7F0" },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "shrink-0 h-10 w-10 rounded-xl grid place-items-center",
								style: { background: "#FFE0CC" },
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Target, {
									className: "h-5 w-5",
									style: { color: ORANGE },
									strokeWidth: 2.4
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-right min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[10px] font-extrabold",
									style: { color: GREEN },
									children: "هدفك"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[12px] font-black leading-tight mt-0.5",
									style: { color: TEXT },
									children: cfg.goalLabel
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-[20px] p-3 flex items-center gap-2.5",
							style: { background: "#FFF1F1" },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "shrink-0 h-10 w-10 rounded-xl grid place-items-center",
								style: { background: "#FFD9D9" },
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-lg font-black",
									style: { color: "#EF4444" },
									children: "!"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-right min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[10px] font-extrabold",
									style: { color: "#EF4444" },
									children: "مشكلتك الحالية"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[12px] font-black leading-tight mt-0.5",
									style: { color: TEXT },
									children: cfg.problemLabel
								})]
							})]
						})]
					}),
					showResults && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pr-stagger mt-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-center gap-2 mb-3 font-[Tajawal]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-6 w-6 rounded-full grid place-items-center",
									style: { background: GREEN },
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
										className: "h-3.5 w-3.5 text-white",
										strokeWidth: 3.5
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-[15px] font-black",
									style: { color: TEXT },
									children: "نتائج حقيقية لعملاء حققوا نفس هدفك"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "relative overflow-hidden rounded-3xl",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex gap-3 transition-transform duration-700 ease-out",
									style: { transform: `translateX(${carouselIdx * 50}%)` },
									children: cfg.metricNumbers.map((num, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "shrink-0 w-[48%] rounded-2xl bg-white overflow-hidden",
										style: {
											border: "1px solid #ECE8E1",
											boxShadow: "0 8px 24px -16px rgba(0,0,0,.14)"
										},
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative grid grid-cols-2 gap-0.5 p-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BeforeAfterTile, {
												label: "قبل",
												tone: "muted",
												seed: i,
												image: useGlutesRevealPhotos ? REVEAL_GLUTES_BEFORE[i] : void 0
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BeforeAfterTile, {
												label: "بعد",
												tone: "bright",
												seed: i,
												image: useGlutesRevealPhotos ? REVEAL_GLUTES_AFTER[i] : void 0
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "px-3 pb-3 pt-1 text-center",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-[10px] text-neutral-500 font-bold",
													children: "بعد 90 يوم"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "pr-heading text-[22px] mt-0.5",
													style: { color: ORANGE },
													children: [
														cfg.metricDesc.startsWith("خسارة") ? "-" : "+",
														num,
														" ",
														cfg.metricUnit
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-[10.5px] text-neutral-500 mt-0.5 leading-snug",
													children: cfg.metricDesc
												})
											]
										})]
									}, i))
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center justify-center gap-1.5 mt-3",
								children: cfg.metricNumbers.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-1.5 rounded-full transition-all duration-300",
									style: {
										width: i === carouselIdx ? 18 : 6,
										background: i === carouselIdx ? ORANGE : "#E5E1DA"
									}
								}, i))
							})
						]
					}),
					showBenefits && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6 grid grid-cols-2 gap-2.5",
						children: cfg.benefits.map((b, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "pr-stagger rounded-2xl bg-white p-3",
							style: {
								border: "1px solid #ECE8E1",
								boxShadow: "0 6px 20px -14px rgba(0,0,0,.12)",
								animationDelay: `${i * 120}ms`
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "shrink-0 h-9 w-9 rounded-full grid place-items-center",
									style: { background: b.bg },
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(b.Icon, {
										className: "h-4.5 w-4.5",
										style: {
											color: b.color,
											width: 18,
											height: 18
										},
										strokeWidth: 2.4
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1 text-right min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[10.5px] text-neutral-500 font-bold leading-tight",
										children: b.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "pr-heading text-[15px] mt-0.5",
										style: { color: b.color },
										children: b.value
									})]
								})]
							})
						}, i))
					}),
					showTimeline && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-7",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "pr-heading text-center text-[16px] mb-4",
								style: { color: TEXT },
								children: "ماذا تتوقع خلال رحلتك؟"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative h-7 mb-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
									viewBox: "0 0 320 28",
									className: "w-full h-full",
									preserveAspectRatio: "none",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
										className: "pr-line",
										x1: "10",
										y1: "14",
										x2: "310",
										y2: "14",
										stroke: "#E5E1DA",
										strokeWidth: "2",
										strokeDasharray: "4 4"
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "absolute inset-0 flex items-center justify-between px-2",
									children: TIMELINE_STAGES.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "pr-dot h-4 w-4 rounded-full ring-4 ring-[#FAF8F5]",
										style: {
											background: s.color,
											animationDelay: `${600 + i * 250}ms`
										}
									}, i))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-2 gap-2.5",
								children: TIMELINE_STAGES.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pr-stagger rounded-2xl bg-white p-3",
									style: {
										border: "1px solid #ECE8E1",
										boxShadow: "0 6px 20px -14px rgba(0,0,0,.12)",
										animationDelay: `${800 + i * 150}ms`
									},
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-[10.5px] font-extrabold",
												style: { color: s.color },
												children: s.week
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "h-8 w-8 rounded-xl grid place-items-center",
												style: { background: s.bg },
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(s.Icon, {
													className: "h-4 w-4",
													style: { color: s.color },
													strokeWidth: 2.4
												})
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "pr-heading text-[13.5px] mt-2 text-right",
											style: { color: TEXT },
											children: s.title
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
											className: "mt-1.5 space-y-1",
											children: s.desc.map((d, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
												className: "text-[11px] text-neutral-600 text-right leading-snug flex items-center justify-end gap-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: d }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "h-1 w-1 rounded-full",
													style: { background: s.color }
												})]
											}, j))
										})
									]
								}, i))
							})
						]
					}),
					showSuccess && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pr-pop pr-glow mt-6 rounded-3xl p-4 flex items-start gap-3",
						style: {
							background: "linear-gradient(135deg, #EAFBEF 0%, #FFFFFF 100%)",
							border: `1.5px solid ${GREEN}55`
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "shrink-0 h-12 w-12 rounded-2xl grid place-items-center bg-white",
							style: { boxShadow: "0 6px 16px -8px rgba(34,197,94,.5)" },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
								className: "h-7 w-7",
								style: { color: GREEN },
								strokeWidth: 2.2
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "pr-heading text-[15px]",
								style: { color: TEXT },
								children: "أنت على بعد 90 يوم فقط من أفضل نسخة منك!"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-[12px] text-neutral-600 leading-relaxed",
								children: ["التزم بالخطة، ثق بالعملية، والنتيجة ستكون مذهلة ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "👍" })]
							})]
						})]
					})
				]
			}),
			showCTA && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed bottom-0 left-0 right-0 px-5 pt-4 pb-6",
				style: { background: "linear-gradient(180deg, rgba(250,248,245,0) 0%, #FAF8F5 35%)" },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "max-w-md mx-auto",
					style: { animation: "pr-cta-in .6s cubic-bezier(.34,1.56,.64,1) both" },
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: onNext,
						className: "w-full flex items-center justify-center gap-2 active:scale-[0.98] transition-transform",
						style: {
							height: 60,
							borderRadius: 18,
							background: ORANGE,
							color: "#fff",
							fontFamily: HEADING_FONT,
							fontWeight: 900,
							fontSize: 16,
							boxShadow: "0 10px 24px -10px rgba(255,107,0,.55)",
							letterSpacing: "-0.01em"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ممتاز 💪 أريد رؤية الخطة المناسبة لي" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, {
							className: "h-5 w-5",
							strokeWidth: 2.8
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `@keyframes pr-cta-in { 0% { opacity:0; transform: translateY(20px) scale(.92);} 100% { opacity:1; transform: translateY(0) scale(1);} }` })]
			})
		]
	});
}
function BeforeAfterTile({ label, tone, seed, image }) {
	const palettes = [
		["#6B7280", "#22C55E"],
		["#9CA3AF", "#FF6B00"],
		["#737373", "#3B82F6"],
		["#71717A", "#9333EA"],
		["#525B6B", "#22C55E"]
	];
	const [muted, bright] = palettes[seed % palettes.length];
	const accent = tone === "muted" ? muted : bright;
	const bg = tone === "muted" ? "linear-gradient(160deg,#E5E7EB 0%,#D1D5DB 100%)" : `linear-gradient(160deg, ${accent}33 0%, ${accent}55 100%)`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative aspect-[3/4] rounded-xl overflow-hidden",
		style: { background: image ? "#E5E7EB" : bg },
		children: [image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: image,
			alt: label,
			loading: "lazy",
			className: "absolute inset-0 w-full h-full object-cover"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 60 80",
			className: "absolute inset-0 w-full h-full",
			preserveAspectRatio: "xMidYMid slice",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
				id: `g-${tone}-${seed}`,
				x1: "0",
				y1: "0",
				x2: "0",
				y2: "1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "0%",
					stopColor: tone === "muted" ? "#9CA3AF" : accent,
					stopOpacity: "0.75"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "100%",
					stopColor: tone === "muted" ? "#6B7280" : accent,
					stopOpacity: "0.95"
				})]
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: tone === "muted" ? "M30 12 C 22 12 18 18 18 26 C 18 34 22 38 22 44 C 18 50 14 58 16 70 L 44 70 C 46 58 42 50 38 44 C 38 38 42 34 42 26 C 42 18 38 12 30 12 Z" : "M30 12 C 22 12 18 18 18 26 C 18 34 22 38 22 44 C 16 48 12 60 14 72 L 46 72 C 48 60 44 48 38 44 C 38 38 42 34 42 26 C 42 18 38 12 30 12 Z",
				fill: `url(#g-${tone}-${seed})`
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-md px-2 py-0.5 text-[10px] font-extrabold text-white",
			style: { background: tone === "muted" ? "rgba(0,0,0,.55)" : GREEN_BADGE_COLOR },
			children: label
		})]
	});
}
var GREEN_BADGE_COLOR = "#22C55E";
function CongratsScreen({ name, gender, total = 13, onNext }) {
	const ORANGE = "#FF6B00";
	const GREEN = "#22C55E";
	const TEXT = "#0F172A";
	const HEADING_FONT = "'Cairo', 'Tajawal', sans-serif";
	const programTitle = gender === "female" ? "برنامج شد القوام والتنحيف" : "برنامج بناء العضلات وحرق الدهون";
	const [showBadge, setShowBadge] = (0, import_react.useState)(false);
	const [showTitle, setShowTitle] = (0, import_react.useState)(false);
	const [showCard, setShowCard] = (0, import_react.useState)(false);
	const [showCta, setShowCta] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const t1 = window.setTimeout(() => setShowBadge(true), 150);
		const t2 = window.setTimeout(() => setShowTitle(true), 700);
		const t3 = window.setTimeout(() => setShowCard(true), 1400);
		const t4 = window.setTimeout(() => setShowCta(true), 2100);
		return () => {
			[
				t1,
				t2,
				t3,
				t4
			].forEach(clearTimeout);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "h-full w-full overflow-y-auto",
		style: {
			background: "#FAF8F5",
			fontFamily: FONT
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        @keyframes cg-pop { 0%{opacity:0; transform: scale(.5);} 60%{transform: scale(1.08);} 100%{opacity:1; transform: scale(1);} }
        @keyframes cg-fade { from{opacity:0; transform: translateY(14px);} to{opacity:1; transform: translateY(0);} }
        @keyframes cg-pulse-btn { 0%,100%{ box-shadow: 0 14px 32px -10px rgba(255,107,0,.55);} 50%{ box-shadow: 0 18px 44px -8px rgba(255,107,0,.85);} }
        @keyframes cg-spark { 0%,100%{opacity:.4; transform: scale(.9);} 50%{opacity:1; transform: scale(1.15);} }
        @keyframes cg-success-burst {
          0% { transform: scale(0.55); opacity: 0.75; }
          100% { transform: scale(2.35); opacity: 0; }
        }
        @keyframes cg-success-ring {
          0% { transform: scale(0.88); opacity: 0.55; box-shadow: 0 0 0 0 rgba(34,197,94,0.45); }
          100% { transform: scale(1.9); opacity: 0; box-shadow: 0 0 0 14px rgba(34,197,94,0); }
        }
        @keyframes cg-success-check {
          0% { opacity: 0; transform: scale(0.15) rotate(-14deg); }
          58% { transform: scale(1.14) rotate(5deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes cg-success-badge-glow {
          0%, 100% { box-shadow: 0 18px 40px -10px rgba(34,197,94,.55), 0 0 0 0 rgba(34,197,94,0.28); }
          50% { box-shadow: 0 22px 50px -8px rgba(34,197,94,.68), 0 0 0 12px rgba(34,197,94,0); }
        }
        @keyframes cg-success-shine {
          0% { transform: translateX(-130%) skewX(-16deg); opacity: 0; }
          25% { opacity: 0.45; }
          100% { transform: translateX(130%) skewX(-16deg); opacity: 0; }
        }
        .cg-pop { animation: cg-pop .7s cubic-bezier(.34,1.56,.64,1) both; }
        .cg-fade { animation: cg-fade .6s ease-out both; }
        .cg-pulse-btn { animation: cg-pulse-btn 2s ease-in-out infinite; }
        .cg-heading { font-family: ${HEADING_FONT}; font-weight: 900; letter-spacing: -0.01em; }
        .cg-success-ring { animation: cg-success-ring 2.1s ease-out infinite; }
        .cg-success-burst {
          background: radial-gradient(circle, rgba(34,197,94,0.42) 0%, rgba(34,197,94,0.12) 42%, transparent 72%);
          animation: cg-success-burst 1.05s ease-out both;
        }
        .cg-success-badge {
          animation: cg-success-badge-glow 2.5s ease-in-out infinite;
          animation-delay: 0.65s;
        }
        .cg-success-check { animation: cg-success-check 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.38s both; }
        .cg-success-shine {
          background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.55) 50%, transparent 62%);
          animation: cg-success-shine 0.95s ease-out 0.55s both;
        }
        @keyframes cg-feature-shadow-drift {
          0%, 100% { box-shadow: 0 4px 14px -8px rgba(255,107,0,0.1), 0 2px 6px -4px rgba(15,23,42,0.07); }
          33% { box-shadow: 5px 8px 18px -7px rgba(255,107,0,0.2), 2px 4px 10px -5px rgba(15,23,42,0.09); }
          66% { box-shadow: -4px 9px 16px -7px rgba(255,107,0,0.16), -2px 3px 8px -5px rgba(15,23,42,0.08); }
        }
        .cg-feature-card {
          animation: cg-feature-shadow-drift 3.2s ease-in-out infinite;
        }
      ` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-h-full max-w-md mx-auto px-5 pt-8 pb-10 flex flex-col",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center text-[12px] font-bold text-neutral-500 mb-2",
					children: ["11 من ", total]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-1.5 mb-8",
					children: Array.from({ length: total }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 h-1.5 rounded-full",
						style: { background: i < 11 ? ORANGE : "#ECE8E1" }
					}, i))
				}),
				showBadge && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "cg-pop relative mx-auto mt-2 mb-6 h-24 w-24",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "cg-success-burst absolute -inset-3 rounded-full pointer-events-none" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "cg-success-ring absolute inset-0 rounded-full",
							style: { animationDelay: "0ms" }
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "cg-success-ring absolute inset-0 rounded-full",
							style: { animationDelay: "520ms" }
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "cg-success-ring absolute inset-0 rounded-full",
							style: { animationDelay: "1040ms" }
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "cg-success-badge relative h-24 w-24 overflow-hidden rounded-full grid place-items-center",
							style: {
								background: `linear-gradient(135deg, ${GREEN} 0%, #16A34A 100%)`,
								boxShadow: "0 18px 40px -10px rgba(34,197,94,.55)"
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "cg-success-shine absolute inset-0 pointer-events-none",
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
								className: "cg-success-check relative z-10 h-12 w-12 text-white",
								strokeWidth: 3.5
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
							className: "absolute -top-1 -right-2 h-5 w-5",
							style: {
								color: ORANGE,
								animation: "cg-spark 1.6s ease-in-out infinite .7s"
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
							className: "absolute -bottom-1 -left-2 h-4 w-4",
							style: {
								color: "#FBBF24",
								animation: "cg-spark 1.6s ease-in-out infinite 1.1s"
							}
						})
					]
				}),
				showTitle && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "cg-fade text-center font-[Tajawal]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
							className: "text-[26px] font-black leading-tight",
							style: { color: TEXT },
							children: [
								"تهانينا",
								name ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [" ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									style: { color: ORANGE },
									children: name
								})] }) : "",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "🎉" })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-[18px] font-black",
							style: { color: TEXT },
							children: "لقد تم تجهيز برنامجك الخاص"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-[13px] text-neutral-600 leading-relaxed px-2",
							children: "قمنا بتحليل جميع بياناتك وإعداد برنامج مخصص يناسب هدفك ومستواك الحالي."
						})
					]
				}),
				showCard && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "cg-fade mt-6 rounded-3xl p-5",
					style: {
						background: "linear-gradient(135deg, #FFF7F0 0%, #FFFFFF 100%)",
						border: "1.5px solid #FFD9B8",
						boxShadow: "0 14px 36px -18px rgba(255,107,0,.35)"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "shrink-0 h-12 w-12 rounded-2xl grid place-items-center",
							style: {
								background: `linear-gradient(135deg, ${ORANGE} 0%, #FF8A33 100%)`,
								boxShadow: "0 8px 18px -6px rgba(255,107,0,.55)"
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, {
								className: "h-6 w-6 text-white",
								strokeWidth: 2.4
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 text-right min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] font-extrabold",
								style: { color: GREEN },
								children: "برنامجك جاهز"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-[Tajawal] text-[16px] font-black mt-0.5",
								style: { color: TEXT },
								children: programTitle
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 grid grid-cols-3 gap-2",
						children: [
							{
								Icon: Calendar,
								label: "90 يوم"
							},
							{
								Icon: Target,
								label: "هدف مخصص"
							},
							{
								Icon: ShieldCheck,
								label: "متابعة"
							}
						].map(({ Icon, label }, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "cg-feature-card rounded-2xl bg-white p-2.5 text-center",
							style: {
								border: "1px solid #ECE8E1",
								animationDelay: `${i * 350}ms`
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								className: "h-5 w-5 mx-auto",
								style: { color: ORANGE },
								strokeWidth: 2.4
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10.5px] font-bold mt-1",
								style: { color: TEXT },
								children: label
							})]
						}, i))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1" }),
				showCta && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "cg-fade mt-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: onNext,
						className: "cg-pulse-btn w-full rounded-2xl py-4 px-5 font-[Tajawal] text-white flex items-center justify-center gap-2 active:scale-[.98] transition-transform",
						style: {
							background: `linear-gradient(135deg, ${ORANGE} 0%, #FF8A33 100%)`,
							fontWeight: 900,
							fontSize: 16
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "اكتشف ما يمكنك تحقيقه خلال 90 يوم" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
							className: "h-5 w-5",
							strokeWidth: 3
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-center text-[11.5px] text-neutral-500 mt-3 leading-relaxed",
						children: "شاهد النتائج المتوقعة لبرنامجك قبل الاطلاع على الأسعار"
					})]
				})
			]
		})]
	});
}
var PRICING_TIERS = [
	{
		id: "transform",
		name: "باقة التحول العادية",
		tagline: "كل ما تحتاجه لتحقيق أفضل نسخة منك في 90 يوم.",
		pricePerDay: "3.3",
		totalPrice: "299",
		features: [
			"خطة تدريب مخصصة",
			"خطة تغذية مخصصة",
			"مراجعة كل أسبوعين",
			"دعم واتساب",
			"تعديلات حسب التقدم"
		],
		primary: "#FF6B00",
		primarySoft: "#FFE6D2",
		primaryBg: "#FFF6EE",
		ring: "#FFB07A",
		Icon: Crown
	},
	{
		id: "pro",
		name: "باقة التحول Pro",
		tagline: "للأشخاص الذين يريدون متابعة أقرب ونتائج أسرع.",
		pricePerDay: "5.5",
		totalPrice: "499",
		features: [
			"كل مزايا باقة التحول العادية",
			"مراجعة أسبوعية",
			"أولوية في الدعم",
			"تعديلات أسرع",
			"متابعة أدق للتقدم"
		],
		primary: "#2563EB",
		primarySoft: "#DBEAFE",
		primaryBg: "#F2F7FF",
		ring: "#93B8F2",
		Icon: Star,
		topBadge: "الأكثر اختياراً"
	},
	{
		id: "vip",
		name: "باقة التحول VIP",
		tagline: "لمن يريد أعلى مستوى من المتابعة والدعم.",
		pricePerDay: "11",
		totalPrice: "999",
		features: [
			"جميع مزايا باقة التحول Pro",
			"متابعة شخصية",
			"تواصل مباشر مع المدرب",
			"مراجعة مستمرة",
			"خطة مخصصة بالكامل",
			"دعم فوري على مدار الساعة"
		],
		primary: "#7C3AED",
		primarySoft: "#EDE3FF",
		primaryBg: "#F7F1FF",
		ring: "#C4A7F2",
		Icon: Gem
	}
];
function PricingTierTitle({ tier, color }) {
	const suffix = tier.id === "transform" ? "العادية" : tier.id === "pro" ? "Pro" : "VIP";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
		className: "pri-heading text-[22px]",
		style: { color },
		children: ["باقة التحول ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			style: { color: tier.primary },
			children: suffix
		})]
	});
}
var PRICING_CTA_COPY = {
	transform: "ابدأ تحولي الآن — 90 يوم",
	pro: "انطلق مع الأكثر اختياراً",
	vip: "احجز مقعدك VIP الآن"
};
var PRICING_TIER_TABS = [
	{
		id: "transform",
		label: "العادية"
	},
	{
		id: "pro",
		label: "Pro"
	},
	{
		id: "vip",
		label: "VIP"
	}
];
function PricingTrustInline() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		dir: "rtl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-5 grid grid-cols-2 gap-2.5 rounded-2xl p-3",
			style: {
				background: "#F0FAF4",
				border: "1px solid #D8EFE0"
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "shrink-0 h-9 w-9 rounded-xl grid place-items-center",
					style: { background: "#E7F7EE" },
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
						className: "h-4 w-4",
						style: { color: "#16A34A" },
						strokeWidth: 2.4
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-right min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pri-heading text-[11.5px]",
						style: { color: "#16A34A" },
						children: "بياناتك محمية"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[9.5px] text-neutral-500 leading-snug mt-0.5",
						children: "نحن لا نشارك بياناتك مع أي جهة"
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "shrink-0 h-9 w-9 rounded-xl grid place-items-center",
					style: { background: "#E7F7EE" },
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
						className: "h-4 w-4",
						style: { color: "#16A34A" },
						strokeWidth: 2.4
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-right min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pri-heading text-[11.5px]",
						style: { color: "#16A34A" },
						children: "دفع آمن 100%"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[9.5px] text-neutral-500 leading-snug mt-0.5",
						children: "جميع المدفوعات مشفرة وآمنة"
					})]
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 flex items-center justify-center gap-1.5 text-[10.5px] text-neutral-500",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "h-3 w-3 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "كل خطط التدريب والتغذية خاصة بك وحدك" })]
		})]
	});
}
function PricingPriceRing({ tier, mounted, className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `relative shrink-0 h-[96px] w-[96px] -translate-y-3 ${className}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 120 120",
			className: "absolute inset-0 pri-ring -rotate-90",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "60",
				cy: "60",
				r: "54",
				fill: "white",
				stroke: `${tier.primary}22`,
				strokeWidth: "3"
			}), mounted && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				className: "anim",
				cx: "60",
				cy: "60",
				r: "54",
				fill: "none",
				stroke: tier.primary,
				strokeWidth: "3",
				strokeLinecap: "round",
				style: { animationDelay: "0.15s" }
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative h-full grid place-items-center text-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-center gap-0.5",
				dir: "ltr",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "pri-heading text-[24px] leading-none",
					style: { color: tier.primary },
					children: tier.pricePerDay
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "pri-heading text-[13px]",
					style: { color: tier.primary },
					children: "$"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[9px] text-neutral-500 font-bold mt-0.5",
				children: "في اليوم فقط"
			})] })
		})]
	});
}
function PricingValueCompare({ tier }) {
	const snackApprox = tier.id === "transform" ? "3" : tier.id === "pro" ? "5" : "11";
	const compareBg = tier.id === "transform" ? "#FFF4EB" : tier.id === "pro" ? "#F2F7FF" : "#F7F1FF";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-2 relative",
		dir: "rtl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			className: "pointer-events-none absolute -top-5 left-3 h-[36px] w-[48px] text-neutral-800/75 z-[1]",
			viewBox: "0 0 54 42",
			fill: "none",
			"aria-hidden": true,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M50 8 C36 8 26 18 16 34",
				stroke: "currentColor",
				strokeWidth: "1.6",
				strokeLinecap: "round"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M21 31 L14 36 L18 28",
				stroke: "currentColor",
				strokeWidth: "1.6",
				strokeLinecap: "round",
				strokeLinejoin: "round"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative rounded-[18px] px-2.5 py-2.5 min-h-[118px]",
			style: {
				background: compareBg,
				border: `1px solid ${tier.primary}22`
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex h-full items-stretch gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "shrink-0 flex flex-col items-center justify-center gap-1 px-1 w-[58px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: سندويش_المقارنة_default,
							alt: "",
							className: "h-[46px] w-full max-w-[54px] object-contain object-bottom"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-[10px] font-extrabold text-neutral-600",
							children: [
								"≈ ",
								snackApprox,
								"$"
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 text-right min-w-0 flex flex-col justify-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pri-heading text-[11px] leading-snug",
							style: { color: tier.primary },
							children: [tier.pricePerDay, "$ في اليوم..."]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-[9px] text-neutral-600 leading-[1.55]",
							children: [
								"أقل من ثمن كوب قهوة ووجبة خفيفة، لكنه استثمار حقيقي في صحتك ولياقتك خلال",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-extrabold",
									style: { color: tier.primary },
									children: "90 يوماً"
								}),
								"."
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "shrink-0 flex flex-col items-center justify-center gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative flex items-center gap-0.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: سمير_قبل_default,
									alt: "",
									className: "h-[52px] w-[38px] rounded-lg object-cover object-top"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[#22C55E] text-[11px] font-black leading-none",
									children: "←"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: سمير_بعد_default,
									alt: "",
									className: "h-[52px] w-[38px] rounded-lg object-cover object-top"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-md px-2 py-0.5 text-[8px] font-extrabold text-white whitespace-nowrap",
							style: { background: "#22C55E" },
							children: "تغيير حقيقي يدوم"
						})]
					})
				]
			})
		})]
	});
}
function PricingFeaturesList({ features, primary, textColor, mountDelayMs = 0 }) {
	const [revealedCount, setRevealedCount] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		setRevealedCount(0);
		const timers = [];
		features.forEach((_, i) => {
			timers.push(window.setTimeout(() => setRevealedCount(i + 1), mountDelayMs + i * 500));
		});
		return () => timers.forEach(clearTimeout);
	}, [features, mountDelayMs]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		dir: "rtl",
		className: "mt-4 space-y-2.5",
		children: features.map((f, i) => {
			const isChecked = i < revealedCount;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-center gap-2.5 text-[13px]",
				style: { color: textColor },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `pri-feat-icon shrink-0 h-5 w-5 rounded-full grid place-items-center ${isChecked ? "pri-feat-icon--checked" : "pri-feat-icon--pending"}`,
					style: { "--feat-primary": primary },
					children: isChecked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
						className: "h-3 w-3 text-white pri-feat-check",
						strokeWidth: 3.5
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "pri-feat-dot",
						"aria-hidden": "true"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "flex-1 text-right leading-tight",
					children: f
				})]
			}, i);
		})
	});
}
function PricingScreen({ name, total = 14, onBack, dubai = false, onSelectTier }) {
	const ORANGE = "#FF6B00";
	const TEXT = "#0F172A";
	const HEADING_FONT = "'Cairo','Tajawal',sans-serif";
	const [selected, setSelected] = (0, import_react.useState)("pro");
	const [mounted, setMounted] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const t = window.setTimeout(() => setMounted(true), 30);
		return () => clearTimeout(t);
	}, []);
	const handleChoose = (tier) => {
		setSelected(tier.id);
		triggerSelectionHaptic();
		window.setTimeout(() => onSelectTier(tier.id), 150);
	};
	const handleTabSelect = (id) => {
		if (selected === id) return;
		setSelected(id);
		triggerSelectionHaptic();
	};
	const activeTier = PRICING_TIERS.find((t) => t.id === selected) ?? PRICING_TIERS[1];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-full w-full overflow-y-auto",
		dir: "rtl",
		style: {
			background: "#FFFFFF",
			fontFamily: FONT
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        @keyframes pri-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pri-in-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pri-ring { from { stroke-dashoffset: 360; } to { stroke-dashoffset: 0; } }
        .pri-in { animation: pri-in .45s cubic-bezier(.2,.8,.2,1) both; }
        .pri-glass-wrap--pro.pri-in { animation: pri-in-fade .45s cubic-bezier(.2,.8,.2,1) both; }
        .pri-ring circle.anim { stroke-dasharray: 360; animation: pri-ring 1.2s ease-out forwards; }
        .pri-heading { font-family: ${HEADING_FONT}; font-weight: 900; letter-spacing: -0.01em; }

        @keyframes pri-glass-shine {
          0% { transform: translateX(-145%) skewX(-14deg); opacity: 0; }
          14% { opacity: 0.28; }
          100% { transform: translateX(145%) skewX(-14deg); opacity: 0; }
        }
        @keyframes pri-glass-glow-pro {
          0%, 100% {
            box-shadow:
              0 24px 52px -20px rgba(37,99,235,0.42),
              0 10px 28px -14px rgba(37,99,235,0.2),
              0 0 0 1px rgba(147,197,253,0.35),
              inset 0 1px 0 rgba(255,255,255,0.92),
              inset 0 -1px 0 rgba(37,99,235,0.06);
          }
          50% {
            box-shadow:
              0 30px 64px -16px rgba(37,99,235,0.55),
              0 14px 32px -12px rgba(59,130,246,0.28),
              0 0 0 1px rgba(96,165,250,0.5),
              inset 0 1px 0 rgba(255,255,255,0.98),
              inset 0 -1px 0 rgba(37,99,235,0.1);
          }
        }

        .pri-glass-wrap {
          position: relative;
          z-index: 1;
        }
        .pri-glass-wrap--pro {
          z-index: 2;
          padding-top: 12px;
        }
        .pri-glass-wrap--badge {
          padding-top: 4px;
        }
        .pri-glass-badge {
          top: 12px;
          transform: translateY(-50%);
        }

        .pri-glass-card {
          position: relative;
          border-radius: 28px;
          overflow: hidden;
          padding: 18px 16px;
          backdrop-filter: blur(14px) saturate(1.15);
          -webkit-backdrop-filter: blur(14px) saturate(1.15);
          isolation: isolate;
          transition: box-shadow .25s ease, border-color .25s ease;
        }
        .pri-glass-card--badge {
          padding-top: 28px;
        }

        .pri-glass-shine {
          pointer-events: none;
          position: absolute;
          inset: 0;
          z-index: 0;
          border-radius: 28px;
          background: linear-gradient(105deg, transparent 44%, rgba(255,255,255,0.16) 50%, transparent 56%);
        }
        .pri-glass-shine--pro {
          background: linear-gradient(105deg, transparent 44%, rgba(255,255,255,0.32) 50%, transparent 56%);
          animation: pri-glass-shine 5.2s ease-in-out infinite;
          will-change: transform;
        }

        .pri-glass-edge {
          pointer-events: none;
          position: absolute;
          inset-inline: 20px;
          top: 0;
          z-index: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent 12%, rgba(255,255,255,0.45) 50%, transparent 88%);
        }
        .pri-glass-edge--pro {
          background: linear-gradient(90deg, transparent 8%, rgba(255,255,255,0.55) 28%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.55) 72%, transparent 92%);
        }

        .pri-glass-inner-glow {
          pointer-events: none;
          position: absolute;
          inset: 0;
          z-index: 0;
          border-radius: 28px;
        }
        .pri-glass-inner-glow--pro {
          background: radial-gradient(ellipse 85% 55% at 50% -8%, rgba(59,130,246,0.14) 0%, transparent 68%);
        }
        .pri-glass-inner-glow--transform {
          background: radial-gradient(ellipse 80% 50% at 50% -6%, rgba(255,107,0,0.08) 0%, transparent 65%);
        }
        .pri-glass-inner-glow--vip {
          background: radial-gradient(ellipse 80% 50% at 50% -6%, rgba(124,58,237,0.1) 0%, transparent 65%);
        }

        .pri-glass-transform {
          background: linear-gradient(155deg, rgba(255,255,255,0.97) 0%, rgba(255,248,240,0.91) 48%, rgba(255,230,210,0.84) 100%);
          border: 1.5px solid rgba(255,107,0,0.24);
          box-shadow:
            0 10px 28px -18px rgba(255,107,0,0.16),
            inset 0 1px 0 rgba(255,255,255,0.84),
            inset 0 -1px 0 rgba(255,107,0,0.04);
        }
        .pri-glass-transform.pri-glass-selected {
          border-color: rgba(255,107,0,0.52);
          box-shadow:
            0 16px 36px -16px rgba(255,107,0,0.28),
            inset 0 1px 0 rgba(255,255,255,0.9),
            inset 0 -1px 0 rgba(255,107,0,0.06);
        }

        .pri-glass-pro {
          background: linear-gradient(155deg, rgba(255,255,255,0.98) 0%, rgba(245,249,255,0.93) 42%, rgba(224,236,255,0.86) 100%);
          backdrop-filter: blur(20px) saturate(1.35);
          -webkit-backdrop-filter: blur(20px) saturate(1.35);
          border: 1.5px solid rgba(96,165,250,0.48);
          animation: pri-glass-glow-pro 3.4s ease-in-out infinite;
        }
        .pri-glass-pro.pri-glass-selected {
          border-color: rgba(37,99,235,0.72);
        }

        .pri-glass-vip {
          background: linear-gradient(155deg, rgba(255,255,255,0.97) 0%, rgba(249,245,255,0.91) 48%, rgba(237,227,255,0.84) 100%);
          border: 1.5px solid rgba(124,58,237,0.28);
          box-shadow:
            0 12px 30px -18px rgba(124,58,237,0.2),
            inset 0 1px 0 rgba(255,255,255,0.84),
            inset 0 -1px 0 rgba(124,58,237,0.05);
        }
        .pri-glass-vip.pri-glass-selected {
          border-color: rgba(124,58,237,0.55);
          box-shadow:
            0 18px 40px -16px rgba(124,58,237,0.32),
            inset 0 1px 0 rgba(255,255,255,0.9),
            inset 0 -1px 0 rgba(124,58,237,0.07);
        }

        @keyframes pri-cta-pulse {
          0%, 100% { box-shadow: 0 10px 22px -10px var(--cta-glow), 0 0 0 0 var(--cta-ring); }
          50% { box-shadow: 0 14px 28px -8px var(--cta-glow), 0 0 0 4px var(--cta-ring); }
        }
        @keyframes pri-cta-shimmer {
          0% { transform: translateX(120%) skewX(-12deg); opacity: 0; }
          18% { opacity: 0.45; }
          100% { transform: translateX(-120%) skewX(-12deg); opacity: 0; }
        }
        .pri-cta-btn {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          animation: pri-cta-pulse 2.8s ease-in-out infinite;
        }
        .pri-cta-btn::after {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.28) 50%, transparent 60%);
          animation: pri-cta-shimmer 3.6s ease-in-out infinite;
        }
        .pri-cta-arrow {
          transition: transform .2s ease;
        }
        .pri-cta-btn:active .pri-cta-arrow {
          transform: translateX(-3px);
        }

        @keyframes pri-feat-pop {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.12); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pri-feat-pulse-dot {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.15); opacity: 0.85; }
        }
        .pri-feat-icon {
          transition: background-color .35s ease, box-shadow .35s ease;
        }
        .pri-feat-icon--pending {
          background: color-mix(in srgb, var(--feat-primary) 14%, transparent);
          border: 1.5px solid color-mix(in srgb, var(--feat-primary) 38%, transparent);
        }
        .pri-feat-icon--checked {
          background: var(--feat-primary);
          box-shadow: 0 4px 10px -4px var(--feat-primary);
          animation: pri-feat-pop .45s cubic-bezier(.2,.8,.2,1) both;
        }
        .pri-feat-dot {
          display: block;
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: var(--feat-primary);
          animation: pri-feat-pulse-dot 1.8s ease-in-out infinite;
        }
        .pri-feat-check {
          animation: pri-feat-pop .4s cubic-bezier(.2,.8,.2,1) both;
        }

        @keyframes pri-rate-shimmer {
          0% { transform: translateX(130%) skewX(-14deg); opacity: 0; }
          16% { opacity: 0.65; }
          100% { transform: translateX(-130%) skewX(-14deg); opacity: 0; }
        }
        @keyframes pri-rate-glow {
          0%, 100% {
            box-shadow:
              0 0 0 1px rgba(255,255,255,0.7) inset,
              0 4px 14px -6px var(--rate-glow);
          }
          50% {
            box-shadow:
              0 0 0 1px rgba(255,255,255,0.95) inset,
              0 6px 20px -4px var(--rate-glow),
              0 0 18px -2px var(--rate-glow-soft);
          }
        }
        .pri-rate-badge {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          animation: pri-rate-glow 2.6s ease-in-out infinite;
        }
        .pri-rate-badge::after {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 36%, rgba(255,255,255,0.72) 50%, transparent 64%);
          animation: pri-rate-shimmer 3.4s ease-in-out infinite;
        }

        @keyframes pri-tab-panel-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pri-tier-tabs {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0;
          border-radius: 0;
          background: transparent;
          border: none;
          box-shadow: none;
        }
        .pri-tier-tab {
          position: relative;
          border-radius: 0;
          padding: 10px 4px 8px;
          text-align: center;
          background: transparent;
          border: none;
          border-top: 2.5px solid transparent;
          border-bottom: 2.5px solid transparent;
          transition: border-color .22s ease, color .22s ease;
        }
        .pri-tier-tab--active {
          background: transparent;
          box-shadow: none;
        }
        .pri-plan-card {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          padding: 16px 14px 14px;
          background: #fff;
          box-shadow: 0 10px 28px -16px rgba(15, 23, 42, 0.12);
          transition: border-color .25s ease, box-shadow .25s ease;
        }
        .pri-tab-panel {
          animation: pri-tab-panel-in .35s cubic-bezier(.2,.8,.2,1) both;
        }
        .pri-sticky-cta {
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
      ` }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 pt-5 pb-3 max-w-md mx-auto",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: onBack,
							className: "flex items-center gap-1 text-neutral-500 text-[13px] font-bold active:scale-95",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4" }), "رجوع"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-[12px] font-extrabold",
							style: { color: ORANGE },
							children: [
								total,
								" من ",
								total
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-12" })
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex gap-1.5",
					children: Array.from({ length: total }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 h-1.5 rounded-full",
						style: { background: ORANGE }
					}, i))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 pb-28 max-w-md mx-auto",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pri-in mt-4 w-full text-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
							className: "pri-heading text-[24px] leading-snug",
							style: {
								color: TEXT,
								fontFamily: "'Tajawal', 'Cairo', sans-serif"
							},
							children: [
								"اختر مستوى ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									style: { color: ORANGE },
									children: "المتابعة"
								}),
								" المناسب لك"
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "pri-in mt-2 text-center text-[12.5px] text-neutral-500 leading-relaxed",
						style: { animationDelay: ".08s" },
						children: dubai ? "باقات التدريب الحضوري + الأونلاين قادمة قريباً. في الوقت الحالي يمكنك اختيار باقات المتابعة عن بُعد." : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							"تم تصميم جميع الباقات لتحقيق هدفك خلال ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-extrabold",
								style: { color: ORANGE },
								children: "90 يوماً"
							}),
							"."
						] })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pri-in mt-5 border-b border-neutral-200/80",
						style: { animationDelay: ".12s" },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							dir: "rtl",
							className: "pri-tier-tabs",
							role: "tablist",
							"aria-label": "اختر الباقة",
							children: PRICING_TIER_TABS.map((tab) => {
								const tierMeta = PRICING_TIERS.find((t) => t.id === tab.id);
								const TabIcon = tierMeta.Icon;
								const isActive = selected === tab.id;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									role: "tab",
									"aria-selected": isActive,
									onClick: () => handleTabSelect(tab.id),
									className: `pri-tier-tab ${isActive ? "pri-tier-tab--active" : ""} active:scale-[0.98]`,
									style: {
										borderTopColor: isActive ? tierMeta.primary : "transparent",
										borderBottomColor: isActive ? tierMeta.primary : "transparent"
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-center gap-1 pri-heading text-[13px]",
										style: { color: isActive ? tierMeta.primary : TEXT },
										children: [tab.id !== "transform" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabIcon, {
											className: "h-3.5 w-3.5",
											style: { color: tab.id === "pro" ? "#F59E0B" : tierMeta.primary },
											strokeWidth: 2.3,
											fill: tab.id === "vip" ? `${tierMeta.primary}33` : tab.id === "pro" ? "#F59E0B" : "none"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: tab.label })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-0.5 text-[10px] font-bold text-neutral-500",
										children: [tierMeta.pricePerDay, "$ / يوم"]
									})]
								}, tab.id);
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3",
						children: (() => {
							const tier = activeTier;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pri-tab-panel relative",
								children: [tier.topBadge && selected === "pro" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "absolute -top-3 right-5 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-[11px] font-extrabold",
									style: {
										background: tier.primary,
										boxShadow: `0 6px 14px -6px ${tier.primary}88`
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: tier.topBadge }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
										className: "h-3 w-3",
										fill: "#fff",
										strokeWidth: 0
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pri-plan-card",
									style: { border: `1.5px solid ${tier.primary}${selected === tier.id ? "88" : "33"}` },
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-start gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex-1 text-right min-w-0",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(tier.Icon, {
															className: "h-6 w-6 shrink-0",
															style: { color: tier.primary },
															strokeWidth: 2.4,
															fill: tier.id === "vip" ? `${tier.primary}33` : "none"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PricingTierTitle, {
															tier,
															color: TEXT
														})]
													}),
													tier.id === "vip" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "mt-1 text-[11.5px] font-extrabold",
														style: { color: tier.primary },
														children: "عدد محدود جداً"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "mt-1.5 text-[12px] text-neutral-500 leading-relaxed",
														children: tier.tagline
													})
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PricingPriceRing, {
												tier,
												mounted
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-2 flex justify-center",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "pri-rate-badge inline-flex rounded-full px-3 py-1 text-[10.5px] font-bold",
												style: {
													background: `${tier.primary}16`,
													color: tier.primary,
													border: `1px solid ${tier.primary}33`,
													["--rate-glow"]: `${tier.primary}44`,
													["--rate-glow-soft"]: `${tier.primary}22`
												},
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "relative z-[1]",
													children: [
														"بمعدل $",
														tier.totalPrice,
														" لمدة 90 يوم"
													]
												})
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PricingValueCompare, { tier }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PricingFeaturesList, {
											features: tier.features,
											primary: tier.primary,
											textColor: TEXT,
											mountDelayMs: 300
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PricingTrustInline, {})
									]
								})]
							}, tier.id);
						})()
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pri-sticky-cta fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.06] bg-white/88",
				style: { boxShadow: "0 -12px 32px -16px rgba(15,23,42,0.18)" },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto max-w-md px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => handleChoose(activeTier),
						className: "pri-cta-btn w-full flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform",
						style: {
							height: 56,
							borderRadius: 16,
							background: activeTier.primary,
							color: "#fff",
							fontFamily: HEADING_FONT,
							fontWeight: 900,
							fontSize: 15.5,
							["--cta-glow"]: `${activeTier.primary}88`,
							["--cta-ring"]: `${activeTier.primary}33`
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "relative z-[1] tracking-tight",
							children: PRICING_CTA_COPY[activeTier.id]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "pri-cta-arrow relative z-[1] h-7 w-7 rounded-full grid place-items-center",
							style: { background: "rgba(255,255,255,.22)" },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
								className: "h-4 w-4 text-white",
								strokeWidth: 3
							})
						})]
					})
				})
			})
		]
	});
}
function TrainingTypeScreen({ onBack, onSelect }) {
	const ORANGE = "#FF6B00";
	const TEXT = "#0F172A";
	const [selected, setSelected] = (0, import_react.useState)(null);
	const TOTAL = 14;
	const CURRENT = 13;
	const pick = (id) => {
		if (selected) return;
		setSelected(id);
		triggerSelectionHaptic();
		window.setTimeout(() => onSelect(id), 150);
	};
	const Card = ({ id, emoji, title, subtitle1, subtitle2, chips }) => {
		const active = selected === id;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => pick(id),
			disabled: !!selected && !active,
			className: "relative w-full text-right rounded-[26px] bg-white p-5 transition-all duration-300 active:scale-[0.99]",
			style: {
				border: `2px solid ${active ? ORANGE : "rgba(0,0,0,0.05)"}`,
				boxShadow: active ? `0 22px 48px -18px ${ORANGE}66, 0 0 0 6px ${ORANGE}1A` : "0 10px 26px -16px rgba(0,0,0,0.14)",
				transform: active ? "scale(1.03)" : "scale(1)",
				animation: active ? "tt-bounce .55s cubic-bezier(.34,1.56,.64,1)" : void 0
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute top-4 left-4 z-10",
				children: active ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative h-8 w-8 rounded-full grid place-items-center",
					style: {
						background: ORANGE,
						boxShadow: `0 6px 14px ${ORANGE}66`
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
							size: 18,
							strokeWidth: 3,
							className: "text-white"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
							className: "absolute -top-2 -right-2 h-3.5 w-3.5",
							style: {
								color: "#FBBF24",
								animation: "tt-spark 1s ease-in-out infinite"
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
							className: "absolute -bottom-2 -left-2 h-3 w-3",
							style: {
								color: ORANGE,
								animation: "tt-spark 1s ease-in-out infinite .2s"
							}
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 w-8 rounded-full bg-white border-2 border-gray-200" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-[22px] font-black leading-tight",
							style: {
								color: TEXT,
								fontFamily: "'Cairo','Tajawal',sans-serif"
							},
							children: title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-[13px] leading-6 text-neutral-600",
							children: subtitle1
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[13px] leading-6 text-neutral-600",
							children: subtitle2
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 flex gap-2 flex-wrap",
							children: chips.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11.5px] font-bold",
								style: {
									background: active ? `${ORANGE}15` : "#FFF6EE",
									color: ORANGE
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "h-1.5 w-1.5 rounded-full",
									style: { background: ORANGE }
								}), c]
							}, c))
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "shrink-0 h-20 w-20 rounded-2xl grid place-items-center text-[40px] leading-none",
					style: {
						background: active ? `linear-gradient(135deg, ${ORANGE} 0%, #FF8A33 100%)` : "#FFF1E5",
						boxShadow: active ? `0 12px 24px -10px ${ORANGE}80` : "none",
						transition: "all .3s"
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						style: { filter: active ? "grayscale(0) brightness(1.05)" : "none" },
						children: emoji
					})
				})]
			})]
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "absolute inset-0 overflow-y-auto",
		style: {
			background: "#FAF8F5",
			fontFamily: FONT
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        @keyframes tt-bounce { 0%{ transform: scale(1);} 35%{ transform: scale(1.06);} 70%{ transform: scale(1.01);} 100%{ transform: scale(1.03);} }
        @keyframes tt-spark { 0%,100%{ opacity:.5; transform: scale(.85);} 50%{ opacity:1; transform: scale(1.15);} }
        @keyframes tt-in { from { opacity:0; transform: translateY(14px);} to { opacity:1; transform: translateY(0);} }
        .tt-in { animation: tt-in .5s ease-out both; }
      ` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md mx-auto px-5 pt-4 pb-10",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: onBack,
							className: "grid h-10 w-10 place-items-center rounded-full bg-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] ring-1 ring-black/5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-5 w-5 text-neutral-700" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-sm font-bold text-neutral-800",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									style: { color: ORANGE },
									children: CURRENT
								}),
								" من ",
								TOTAL
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-10" })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex gap-1.5",
					children: Array.from({ length: TOTAL }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 h-1.5 rounded-full",
						style: { background: i < CURRENT ? ORANGE : "rgba(0,0,0,0.1)" }
					}, i))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "tt-in mt-7 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
							className: "text-[26px] font-black leading-tight",
							style: {
								color: TEXT,
								fontFamily: "'Cairo','Tajawal',sans-serif"
							},
							children: ["اختر ما ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								style: { color: ORANGE },
								children: "يناسبك"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-[14px] text-neutral-700 font-bold",
							children: "حتى نساعدك بطريقة أفضل"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-[12.5px] text-neutral-500 leading-relaxed px-4",
							children: "اختر طريقة التدريب الأنسب لك"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "tt-in",
						style: { animationDelay: ".08s" },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
							id: "online",
							emoji: "🌍",
							title: "أونلاين",
							subtitle1: "تدريب ومتابعة عن بعد",
							subtitle2: "عبر التطبيق وواتساب",
							chips: ["مرونة أكبر", "سعر أقل"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "tt-in",
						style: { animationDelay: ".18s" },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
							id: "inperson",
							emoji: "🏋️",
							title: "تدريب شخصي",
							subtitle1: "جلسات تدريب مباشرة",
							subtitle2: "في النادي مع المدرب",
							chips: ["نتائج أسرع", "إشراف مباشر"]
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 rounded-2xl bg-white/70 backdrop-blur ring-1 ring-black/5 px-4 py-3 flex items-center justify-center gap-2 tt-in",
					style: { animationDelay: ".28s" },
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
						className: "h-4 w-4",
						style: { color: ORANGE }
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[12px] text-neutral-700",
						children: "كلا الخيارين يضمن لك متابعة احترافية ونتائج حقيقية"
					})]
				})
			]
		})]
	});
}
var OFFLINE_GOAL_LABELS = {
	muscle: "بناء العضلات",
	lose: "خسارة الوزن",
	strength: "زيادة القوة",
	fitness: "تحسين اللياقة",
	tone: "شد الجسم",
	weight_loss: "خسارة الوزن",
	toning: "شد وتنسيق الجسم"
};
var OFFLINE_CHALLENGE_LABELS = {
	muscle: "صعوبة بناء العضلات",
	fat: "تراكم الدهون",
	motivation: "ضعف الالتزام",
	time: "ضيق الوقت",
	plan: "عدم وجود خطة واضحة",
	diet: "صعوبة في التغذية"
};
function OfflinePackagesScreen({ name, phone, city, goalId, challengeId, total, onBack }) {
	const ORANGE = "#FF6B00";
	const GREEN = "#22C55E";
	const TEXT = "#111827";
	const CURRENT = total;
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [customSessions, setCustomSessions] = (0, import_react.useState)("");
	const [timeLeft, setTimeLeft] = (0, import_react.useState)({
		h: 23,
		m: 59,
		s: 59
	});
	(0, import_react.useEffect)(() => {
		const t = setInterval(() => {
			setTimeLeft((p) => {
				let { h, m, s } = p;
				s--;
				if (s < 0) {
					s = 59;
					m--;
				}
				if (m < 0) {
					m = 59;
					h--;
				}
				if (h < 0) {
					h = 23;
					m = 59;
					s = 59;
				}
				return {
					h,
					m,
					s
				};
			});
		}, 1e3);
		return () => clearInterval(t);
	}, []);
	const pad = (n) => String(n).padStart(2, "0");
	const pickPackage = (id) => {
		if (selected) return;
		setSelected(id);
		triggerSelectionHaptic();
	};
	const packageLabel = (id) => {
		if (id === "p12") return "باقة 12 حصة (3 مرات أسبوعياً) — 3,600 درهم شهرياً";
		if (id === "p20") return "باقة 20 حصة (5 مرات أسبوعياً) — 5,500 درهم شهرياً";
		return `باقة مخصصة — ${customSessions || "حسب اقتراح المدرب"}`;
	};
	const buildWhatsapp = () => {
		if (!selected) return "#";
		const goal = OFFLINE_GOAL_LABELS[goalId] || goalId || "—";
		const ch = OFFLINE_CHALLENGE_LABELS[challengeId] || challengeId || "—";
		const msg = `مرحباً كابتن حكيم،\nأريد حجز باقة التدريب الشخصي في دبي.\n\nالاسم: ${name || "—"}\nالهاتف: ${phone || "—"}\nالمدينة: ${city || "دبي"}\nالهدف: ${goal}\nالمشكلة الأساسية: ${ch}\nالباقة المختارة: ${packageLabel(selected)}\n\nأريد البدء في رحلتي نحو أفضل نسخة مني.`;
		return `https://wa.me/971505129019?text=${encodeURIComponent(msg)}`;
	};
	const pkg12 = {
		id: "p12",
		name: "باقة 12 حصة",
		badge: "الأكثر توازناً",
		badgeColor: ORANGE,
		freq: "3 مرات أسبوعياً",
		price: "3,600",
		oldPrice: "4,500",
		save: "وفر 900 درهم",
		desc: "مناسبة لمن يريد نتائج قوية مع جدول مرن ومتوازن.",
		icon: "🏆",
		iconBg: "#FFF6E6",
		features: [
			"12 حصة تدريب شخصية شهرياً",
			"3 حصص أسبوعياً",
			"خطة تدريب مخصصة لهدفك",
			"متابعة تقدمك أسبوعياً",
			"تعديل التمارين حسب مستواك",
			"دعم عبر واتساب"
		],
		guaranteeTitle: "ضمان 90 يوم:",
		guaranteeText: "إذا التزمت بالخطة ولم تحقق تقدماً حقيقياً، تسترجع أموالك.",
		guaranteeBg: "#FFF1E6",
		guaranteeColor: ORANGE
	};
	const pkg20 = {
		id: "p20",
		name: "باقة 20 حصة",
		badge: "أسرع نتائج",
		badgeColor: "#A855F7",
		freq: "5 مرات أسبوعياً",
		price: "5,500",
		oldPrice: "7,000",
		save: "وفر 1,500 درهم",
		desc: "لمن يريد أفضل نتيجة في أقل وقت مع التزام أعلى ومتابعة أقوى.",
		icon: "⚡",
		iconBg: "#F3E8FF",
		features: [
			"20 حصة تدريب شخصية شهرياً",
			"5 حصص أسبوعياً",
			"تسريع النتائج بشكل واضح",
			"متابعة أدق لتقدمك",
			"تعديل مستمر للبرنامج",
			"خطة تدريب مكثفة حسب هدفك",
			"دعم مباشر عبر واتساب",
			"أولوية في المواعيد"
		],
		guaranteeTitle: "ضمان نتائج أسرع:",
		guaranteeText: "إذا التزمت ولم تشعر بتغيير حقيقي، سنعالج الأمر أو تسترجع أموالك.",
		guaranteeBg: "#F5EBFF",
		guaranteeColor: "#9333EA"
	};
	const PackageCard = ({ p }) => {
		const active = selected === p.id;
		const hidden = selected !== null && selected !== p.id;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "off-card transition-all duration-400",
			style: {
				opacity: hidden ? 0 : 1,
				maxHeight: hidden ? 0 : 2e3,
				transform: active ? "scale(1.02)" : "scale(1)",
				marginBottom: hidden ? 0 : 16,
				overflow: "hidden"
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => pickPackage(p.id),
				disabled: !!selected,
				className: "w-full text-right rounded-[24px] bg-white p-5 transition-all relative",
				style: {
					border: `2px solid ${active ? ORANGE : "rgba(0,0,0,0.06)"}`,
					boxShadow: active ? `0 24px 50px -18px ${ORANGE}55, 0 0 0 6px ${ORANGE}1A` : "0 10px 26px -16px rgba(0,0,0,0.12)"
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute top-4 right-4",
						children: active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-7 w-7 rounded-full grid place-items-center",
							style: {
								background: ORANGE,
								boxShadow: `0 6px 14px ${ORANGE}66`
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
								size: 16,
								strokeWidth: 3,
								className: "text-white"
							})
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-7 w-7 rounded-full border-2 border-gray-300" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-3 pr-9",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "shrink-0 h-16 w-16 rounded-2xl grid place-items-center text-[34px] leading-none",
							style: { background: p.iconBg },
							children: p.icon
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 min-w-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 flex-wrap",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-[19px] font-black",
										style: {
											color: TEXT,
											fontFamily: "'Cairo','Tajawal',sans-serif"
										},
										children: p.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "inline-block rounded-full px-2.5 py-0.5 text-[10.5px] font-bold text-white",
										style: { background: p.badgeColor },
										children: p.badge
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-[12.5px] font-bold",
									style: { color: ORANGE },
									children: p.freq
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 flex items-end gap-2 flex-wrap",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[26px] font-black leading-none",
											style: {
												color: ORANGE,
												fontFamily: "'Cairo',sans-serif"
											},
											children: p.price
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[12px] text-neutral-600 mb-0.5",
											children: "درهم شهرياً"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[13px] text-neutral-400 line-through mb-0.5",
											children: p.oldPrice
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-2 inline-block rounded-full bg-green-50 text-green-700 px-2.5 py-0.5 text-[11px] font-bold",
									children: p.save
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-[12.5px] leading-6 text-neutral-600",
						children: p.desc
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 grid grid-cols-2 gap-x-3 gap-y-2",
						children: p.features.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-1.5 text-[11.5px] leading-5 text-neutral-700",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-0.5 h-4 w-4 shrink-0 rounded-full grid place-items-center",
								style: { background: "#DCFCE7" },
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
									size: 10,
									strokeWidth: 3,
									className: "text-green-600"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: f })]
						}, f))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 rounded-2xl p-3 flex items-start gap-2.5",
						style: { background: p.guaranteeBg },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
							className: "h-5 w-5 mt-0.5 shrink-0",
							style: { color: p.guaranteeColor }
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[12.5px] font-black",
								style: { color: p.guaranteeColor },
								children: p.guaranteeTitle
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11.5px] text-neutral-700 leading-5",
								children: p.guaranteeText
							})]
						})]
					})
				]
			})
		});
	};
	const customActive = selected === "custom";
	const customHidden = selected !== null && selected !== "custom";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "absolute inset-0 overflow-y-auto",
		style: {
			background: "#FAF8F5",
			fontFamily: FONT
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        @keyframes off-in { from{opacity:0; transform: translateY(14px);} to{opacity:1; transform: translateY(0);} }
        .off-in { animation: off-in .5s ease-out both; }
        @keyframes off-pulse { 0%,100%{ transform: scale(1); box-shadow: 0 14px 30px -10px rgba(34,197,94,0.55);} 50%{ transform: scale(1.015); box-shadow: 0 18px 40px -10px rgba(34,197,94,0.7);} }
        .off-pulse { animation: off-pulse 2.2s ease-in-out infinite; }
        @keyframes off-glow { 0%,100%{ box-shadow: 0 0 0 0 rgba(255,107,0,0.35);} 50%{ box-shadow: 0 0 0 10px rgba(255,107,0,0);} }
        .off-urgent-glow { animation: off-glow 2.4s ease-in-out infinite; }
      ` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md mx-auto px-5 pt-4 pb-10",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-sm font-bold text-neutral-800",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								style: { color: ORANGE },
								children: CURRENT
							}),
							" من ",
							total
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: onBack,
						className: "flex items-center gap-1 text-sm font-bold text-neutral-700",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "رجوع" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4" })]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex gap-1.5",
					children: Array.from({ length: total }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 h-1.5 rounded-full",
						style: { background: i < CURRENT ? ORANGE : "rgba(0,0,0,0.1)" }
					}, i))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "off-in mt-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
								className: "text-[24px] font-black leading-tight",
								style: {
									color: TEXT,
									fontFamily: "'Cairo','Tajawal',sans-serif"
								},
								children: [
									"اختر باقة ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										style: { color: ORANGE },
										children: "التدريب الشخصي"
									}),
									" المناسبة لك"
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-[12.5px] leading-6 text-neutral-600",
								children: "جلسات حضورية مباشرة في دبي مع متابعة مخصصة لتحقيق أفضل نتيجة خلال 90 يوم."
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "shrink-0 h-14 w-14 rounded-2xl grid place-items-center text-[28px]",
							style: { background: "#FFF1E5" },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dumbbell, {
								className: "h-7 w-7",
								style: { color: ORANGE }
							})
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex justify-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "off-urgent-glow inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-black text-white",
							style: { background: `linear-gradient(135deg, ${ORANGE} 0%, #FF8A33 100%)` },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { className: "h-4 w-4" }), " عرض محدود لعملاء دبي فقط"]
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "off-in mt-5 rounded-[22px] p-4",
					style: {
						background: "linear-gradient(135deg,#FFF6EC 0%, #FFEAD2 100%)",
						border: "1px solid #FFD1A8"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "shrink-0 h-12 w-12 rounded-2xl grid place-items-center",
							style: { background: "#FFE1C2" },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
								className: "h-6 w-6",
								style: { color: ORANGE }
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[13.5px] font-black flex items-center gap-1 justify-start",
								style: { color: ORANGE },
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "⚠️" }), " الأماكن محدودة هذا الأسبوع"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-[11.5px] text-neutral-700 leading-5",
								children: "عدد المقاعد المتاحة للتدريب الشخصي محدود بسبب عدد الحصص اليومية. سارع بحجز مكانك قبل أن يسبقك شخص آخر."
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 rounded-2xl bg-white/70 p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11.5px] font-bold text-neutral-700 text-center",
							children: "ينتهي العرض خلال:"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 flex items-center justify-center gap-2",
							dir: "ltr",
							children: [
								{
									v: pad(timeLeft.h),
									l: "ساعة"
								},
								{
									v: pad(timeLeft.m),
									l: "دقيقة"
								},
								{
									v: pad(timeLeft.s),
									l: "ثانية"
								}
							].map((u, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [i > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[20px] font-black",
									style: { color: ORANGE },
									children: ":"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "rounded-xl px-3 py-1.5 text-[20px] font-black text-white min-w-[52px]",
										style: { background: `linear-gradient(180deg, ${ORANGE}, #E85F00)` },
										children: u.v
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-1 text-[10px] text-neutral-600",
										dir: "rtl",
										children: u.l
									})]
								})]
							}, i))
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PackageCard, { p: pkg12 }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PackageCard, { p: pkg20 }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "off-card transition-all duration-400",
							style: {
								opacity: customHidden ? 0 : 1,
								maxHeight: customHidden ? 0 : 2e3,
								transform: customActive ? "scale(1.02)" : "scale(1)",
								marginBottom: customHidden ? 0 : 16,
								overflow: "hidden"
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => pickPackage("custom"),
								disabled: !!selected && !customActive,
								className: "w-full text-right rounded-[24px] bg-white p-5 transition-all relative",
								style: {
									border: `2px solid ${customActive ? ORANGE : "rgba(0,0,0,0.06)"}`,
									boxShadow: customActive ? `0 24px 50px -18px ${ORANGE}55, 0 0 0 6px ${ORANGE}1A` : "0 10px 26px -16px rgba(0,0,0,0.12)"
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "absolute top-4 right-4",
										children: customActive ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-7 w-7 rounded-full grid place-items-center",
											style: {
												background: ORANGE,
												boxShadow: `0 6px 14px ${ORANGE}66`
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
												size: 16,
												strokeWidth: 3,
												className: "text-white"
											})
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-7 w-7 rounded-full border-2 border-gray-300" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start gap-3 pr-9",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "shrink-0 h-16 w-16 rounded-2xl grid place-items-center",
											style: { background: "#E0F2FE" },
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, {
												className: "h-8 w-8",
												style: { color: "#0EA5E9" }
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex-1 min-w-0",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2 flex-wrap",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "text-[19px] font-black",
													style: {
														color: TEXT,
														fontFamily: "'Cairo','Tajawal',sans-serif"
													},
													children: "خصص باقتك"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "inline-block rounded-full px-2.5 py-0.5 text-[10.5px] font-bold text-white",
													style: { background: "#0EA5E9" },
													children: "مرونة كاملة"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 text-[12.5px] font-bold text-neutral-700",
												children: "حسب عدد الحصص"
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 text-[12.5px] leading-6 text-neutral-600",
										children: "اختر عدد الحصص التي تناسب وقتك وهدفك، وسنصمم لك باقة شخصية بالكامل."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-4 grid grid-cols-2 gap-x-3 gap-y-2",
										children: [
											"اختر عدد الحصص المناسب لك",
											"جدول مرن حسب وقتك",
											"مناسب للمبتدئين والمشغولين",
											"خطة تدريب مخصصة",
											"متابعة مباشرة",
											"إمكانية ترقية الباقة لاحقاً"
										].map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-start gap-1.5 text-[11.5px] leading-5 text-neutral-700",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "mt-0.5 h-4 w-4 shrink-0 rounded-full grid place-items-center",
												style: { background: "#DCFCE7" },
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
													size: 10,
													strokeWidth: 3,
													className: "text-green-600"
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: f })]
										}, f))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-4 rounded-2xl bg-[#F8FAFC] p-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[12px] font-bold text-neutral-700 text-right mb-2",
											children: "عدد الحصص المطلوبة شهرياً"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex flex-wrap gap-2",
											children: [
												"8 حصص",
												"12 حصة",
												"16 حصة",
												"20 حصة",
												"أريد اقتراح المدرب"
											].map((opt) => {
												const on = customSessions === opt;
												return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													onClick: (e) => {
														e.stopPropagation();
														if (!selected || customActive) setCustomSessions(opt);
													},
													className: "cursor-pointer rounded-full px-3 py-1.5 text-[11.5px] font-bold transition-all",
													style: {
														background: on ? ORANGE : "#fff",
														color: on ? "#fff" : "#334155",
														border: `1.5px solid ${on ? ORANGE : "#E2E8F0"}`
													},
													children: opt
												}, opt);
											})
										})]
									})
								]
							})
						})
					]
				}),
				!selected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "off-in mt-2 rounded-[22px] p-4 flex items-start gap-3",
					style: {
						background: "#FFF6EC",
						border: "1px solid #FFD1A8"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "shrink-0 h-12 w-12 rounded-2xl grid place-items-center",
						style: { background: "#FFE1C2" },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, {
							className: "h-6 w-6",
							style: { color: ORANGE }
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 text-right",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[13px] font-black",
							style: { color: ORANGE },
							children: "المقاعد محدودة جداً لهذا الأسبوع!"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-[11.5px] text-neutral-700 leading-5",
							children: "لا تنتظر حتى يسرق شخص آخر حلمك ويحقق ما تتمناه."
						})]
					})]
				}),
				selected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 off-in",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-center text-[12px] text-neutral-700 mb-2 font-bold",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "inline h-3 w-3 mb-0.5 ml-1" }), "تدريب شخصي + متابعة احترافية + نتائج مضمونة"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: buildWhatsapp(),
							target: "_blank",
							rel: "noopener noreferrer",
							className: "off-pulse w-full h-14 rounded-[22px] font-black text-white text-[15px] flex items-center justify-center gap-2 transition-transform active:scale-[0.98]",
							style: { background: `linear-gradient(135deg, ${GREEN} 0%, #16A34A 100%)` },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
								xmlns: "http://www.w3.org/2000/svg",
								viewBox: "0 0 24 24",
								className: "h-6 w-6 fill-white",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M20.52 3.48A11.93 11.93 0 0 0 12.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.15 1.6 5.96L0 24l6.32-1.66a11.9 11.9 0 0 0 5.73 1.46h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.44-8.42zM12.06 21.5h-.01a9.6 9.6 0 0 1-4.89-1.34l-.35-.21-3.75.99 1-3.65-.23-.37a9.58 9.58 0 0 1-1.47-5.02c0-5.3 4.31-9.6 9.61-9.6 2.57 0 4.98 1 6.8 2.81a9.55 9.55 0 0 1 2.81 6.8c0 5.3-4.31 9.6-9.62 9.6zm5.55-7.18c-.3-.15-1.79-.88-2.07-.98-.28-.1-.48-.15-.69.15s-.79.98-.97 1.18c-.18.2-.36.22-.66.07-.3-.15-1.28-.47-2.43-1.5-.9-.8-1.51-1.79-1.69-2.09-.18-.3-.02-.46.13-.61.13-.13.3-.36.45-.54.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.07-.15-.67-1.61-.91-2.21-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.51.07-.78.38-.27.3-1.02 1-1.02 2.44s1.05 2.83 1.2 3.03c.15.2 2.06 3.14 5 4.4.7.3 1.25.48 1.68.62.7.22 1.34.19 1.85.12.56-.08 1.79-.73 2.04-1.43.25-.7.25-1.3.18-1.43-.07-.13-.27-.2-.57-.35z" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "أرسل حجزك على الواتساب الآن وابدأ رحلتك نحو الأفضل" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-center text-[11.5px] text-neutral-600 leading-5",
							children: "سيتم إرسال اختيارك وبياناتك للمدرب لتأكيد الحجز والبدء في رحلتك."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex items-center justify-center gap-4 text-[11px] text-neutral-600",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
								className: "h-3.5 w-3.5",
								style: { color: GREEN }
							}), " بياناتك محمية"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
								className: "h-3.5 w-3.5",
								style: { color: GREEN }
							}), " دفع آمن"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
								className: "h-3.5 w-3.5",
								style: { color: "#F59E0B" }
							}), " +500 عميل"]
						})
					]
				})
			]
		})]
	});
}
function PaymentScreen({ name, tierId, total = 14, onBack }) {
	const tier = PRICING_TIERS.find((t) => t.id === tierId) ?? PRICING_TIERS[0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckoutScreen, {
		name,
		tier: {
			id: tier.id,
			name: tier.name,
			pricePerDay: tier.pricePerDay,
			totalPrice: tier.totalPrice,
			topBadge: tier.topBadge
		},
		total,
		onBack
	});
}
//#endregion
export { QuizPage as component };
