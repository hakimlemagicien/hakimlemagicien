import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as openProofInNewTab, i as formatPaymentMethod, n as fetchSubmittedLeads, o as updateLeadPaymentStatus, r as formatDate } from "./admin-payments-api-DyW3la1J.mjs";
import { D as RefreshCw, R as LoaderCircle, Z as ExternalLink, gt as Check, n as X } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/payments-D33Vtm8K.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminPaymentsPage() {
	const [leads, setLeads] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(null);
	const [actionId, setActionId] = (0, import_react.useState)(null);
	const loadLeads = (0, import_react.useCallback)(async () => {
		setLoading(true);
		setError(null);
		try {
			setLeads(await fetchSubmittedLeads());
		} catch (err) {
			console.error(err);
			setError(err instanceof Error && /forbidden|42501/i.test(err.message) ? "ليس لديك صلاحية الوصول." : "تعذر جلب الطلبات. تأكد من تطبيق migration الإدارة على Supabase.");
			setLeads([]);
		} finally {
			setLoading(false);
		}
	}, []);
	(0, import_react.useEffect)(() => {
		loadLeads();
	}, [loadLeads]);
	const handleViewProof = async (proofPath) => {
		if (!proofPath) {
			alert("لا يوجد مسار إيصال لهذا الطلب.");
			return;
		}
		setActionId(`proof:${proofPath}`);
		try {
			await openProofInNewTab(proofPath);
		} catch (err) {
			console.error(err);
			const detail = err instanceof Error && err.message ? `\n\n${err.message}` : "";
			alert(`تعذر فتح الإيصال. تأكد من صلاحيات Admin على التخزين.${detail}`);
		} finally {
			setActionId(null);
		}
	};
	const handleDecision = async (leadId, status) => {
		const label = status === "confirmed" ? "قبول" : "رفض";
		if (!window.confirm(`هل تريد ${label} هذا الطلب؟`)) return;
		setActionId(leadId);
		try {
			await updateLeadPaymentStatus(leadId, status);
			setLeads((prev) => prev.filter((row) => row.id !== leadId));
		} catch (err) {
			console.error(err);
			alert(`تعذر ${label} الطلب.`);
		} finally {
			setActionId(null);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-[Tajawal] text-2xl font-black text-[#0F172A] md:text-3xl",
				children: "مراجعة مدفوعات التحويل"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-neutral-500",
				children: [
					"الطلبات ذات الحالة ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-bold text-[#FF6B00]",
						children: "submitted"
					}),
					" فقط"
				]
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => void loadLeads(),
				disabled: loading,
				className: "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-bold text-[#0F172A] disabled:opacity-50",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: `h-4 w-4 ${loading ? "animate-spin" : ""}` }), "تحديث"]
			})]
		}),
		error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-6 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]",
			children: error
		}) : null,
		loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex min-h-[30vh] items-center justify-center text-neutral-500",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-6 w-6 animate-spin" })
		}) : leads.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "rounded-2xl border border-dashed border-[#E5E7EB] bg-white px-6 py-12 text-center text-neutral-500",
			children: "لا توجد طلبات بانتظار المراجعة حالياً."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "hidden overflow-x-auto rounded-2xl border border-[#E5E7EB] bg-white shadow-sm md:block",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "min-w-full text-right text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
					className: "bg-[#F9FAFB] text-xs font-bold text-neutral-500",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "الاسم"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "البريد"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "الهاتف"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "المبلغ"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "العملة"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "طريقة الدفع"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "مسار الإيصال"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "التاريخ"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "px-4 py-3",
							children: "إجراءات"
						})
					] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
					className: "divide-y divide-[#F1F5F9]",
					children: leads.map((lead) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LeadTableRow, {
						lead,
						busy: actionId === lead.id || actionId === `proof:${lead.proof_path}`,
						onViewProof: () => void handleViewProof(lead.proof_path),
						onAccept: () => void handleDecision(lead.id, "confirmed"),
						onReject: () => void handleDecision(lead.id, "rejected")
					}, lead.id))
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-4 md:hidden",
			children: leads.map((lead) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LeadMobileCard, {
				lead,
				busy: actionId === lead.id || actionId === `proof:${lead.proof_path}`,
				onViewProof: () => void handleViewProof(lead.proof_path),
				onAccept: () => void handleDecision(lead.id, "confirmed"),
				onReject: () => void handleDecision(lead.id, "rejected")
			}, lead.id))
		})] })
	] });
}
function PageShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		dir: "rtl",
		lang: "ar",
		className: "min-h-screen bg-[#FAFAFA] font-[Tajawal,Cairo,sans-serif]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8",
			children
		})
	});
}
function Cell({ value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: value ?? "—" });
}
function LeadTableRow({ lead, busy, onViewProof, onAccept, onReject }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
		className: "text-[#0F172A]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-4 py-3 font-medium",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { value: lead.full_name })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-4 py-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { value: lead.email })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-4 py-3",
				dir: "ltr",
				style: { textAlign: "right" },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { value: lead.phone })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-4 py-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { value: lead.payment_amount })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-4 py-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { value: lead.payment_currency })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-4 py-3",
				children: formatPaymentMethod(lead.payment_method)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "max-w-[180px] truncate px-4 py-3 text-xs text-neutral-500",
				title: lead.proof_path ?? "",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { value: lead.proof_path })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-4 py-3 whitespace-nowrap text-xs text-neutral-500",
				children: formatDate(lead.created_at)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "px-4 py-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LeadActions, {
					busy,
					onViewProof,
					onAccept,
					onReject
				})
			})
		]
	});
}
function LeadMobileCard({ lead, busy, onViewProof, onAccept, onReject }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-2 text-sm",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
					label: "الاسم",
					value: lead.full_name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
					label: "البريد",
					value: lead.email
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
					label: "الهاتف",
					value: lead.phone,
					ltr: true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
					label: "المبلغ",
					value: lead.payment_amount != null ? `${lead.payment_amount} ${lead.payment_currency ?? ""}`.trim() : null
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
					label: "طريقة الدفع",
					value: formatPaymentMethod(lead.payment_method)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
					label: "مسار الإيصال",
					value: lead.proof_path,
					mono: true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
					label: "التاريخ",
					value: formatDate(lead.created_at)
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 border-t border-[#F1F5F9] pt-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LeadActions, {
				busy,
				onViewProof,
				onAccept,
				onReject,
				stacked: true
			})
		})]
	});
}
function InfoRow({ label, value, ltr, mono }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-start justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "shrink-0 text-neutral-500",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `text-left font-medium text-[#0F172A] ${mono ? "font-mono text-xs break-all" : ""}`,
			dir: ltr ? "ltr" : void 0,
			style: ltr ? { textAlign: "left" } : void 0,
			children: value ?? "—"
		})]
	});
}
function LeadActions({ busy, onViewProof, onAccept, onReject, stacked }) {
	const base = "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold disabled:opacity-50";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: stacked ? "flex flex-col gap-2" : "flex flex-wrap gap-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				disabled: busy,
				onClick: onViewProof,
				className: `${base} border border-[#E5E7EB] bg-white text-[#0F172A]`,
				children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "h-3.5 w-3.5" }), "عرض الإيصال"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				disabled: busy,
				onClick: onAccept,
				className: `${base} bg-[#16A34A] text-white`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3.5 w-3.5" }), "قبول الدفع"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				disabled: busy,
				onClick: onReject,
				className: `${base} bg-[#DC2626] text-white`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3.5 w-3.5" }), "رفض الدفع"]
			})
		]
	});
}
//#endregion
export { AdminPaymentsPage as component };
