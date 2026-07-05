import { t as supabase } from "./client-DaoHZWri.mjs";
import { t as invokeAdminAcceptPayment } from "./payment-notifications-api-DlI38M1Y.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-payments-api-DvAtcEsN.js
var PAYMENT_PROOFS_BUCKET = "payment-proofs";
var PROOF_SIGNED_URL_TTL_SECONDS = 3600;
async function checkAdminAccess() {
	const { data: { session }, error: sessionError } = await supabase.auth.getSession();
	if (sessionError || !session?.user) throw new Error("unauthenticated");
	const userId = session.user.id;
	const { data: roles, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", userId);
	if (roleError) {
		console.error("[checkAdminAccess] user_roles:", roleError.message);
		throw new Error("forbidden");
	}
	if (!(roles?.some((row) => row.role === "admin") ?? false)) throw new Error("forbidden");
	return { userId };
}
async function fetchSubmittedLeads() {
	const { data, error } = await supabase.rpc("admin_list_submitted_leads");
	if (error) throw error;
	return data ?? [];
}
async function updateLeadPaymentStatus(leadId, status) {
	const { error } = await supabase.rpc("admin_update_lead_payment_status", {
		p_lead_id: leadId,
		p_payment_status: status
	});
	if (error) throw error;
}
/** Confirm payment in DB, then invite/link client auth account (server edge function). */
async function acceptLeadPayment(leadId) {
	await updateLeadPaymentStatus(leadId, "confirmed");
	return invokeAdminAcceptPayment(leadId);
}
function normalizeProofPath(proofPath) {
	let path = proofPath.trim();
	if (!path) return "";
	const bucketPrefix = `${PAYMENT_PROOFS_BUCKET}/`;
	if (path.startsWith(bucketPrefix)) path = path.slice(bucketPrefix.length);
	return path.replace(/^\/+/, "");
}
async function getProofSignedUrl(proofPath) {
	const objectPath = normalizeProofPath(proofPath);
	if (!objectPath) throw new Error("مسار الإيصال غير صالح.");
	const { data: { session } } = await supabase.auth.getSession();
	if (!session) throw new Error("يجب تسجيل الدخول لعرض الإيصال.");
	const { data: file, error: downloadError } = await supabase.storage.from(PAYMENT_PROOFS_BUCKET).download(objectPath);
	if (!downloadError && file) {
		const blobUrl = URL.createObjectURL(file);
		window.setTimeout(() => URL.revokeObjectURL(blobUrl), 6e4);
		return blobUrl;
	}
	const { data, error: signError } = await supabase.storage.from(PAYMENT_PROOFS_BUCKET).createSignedUrl(objectPath, PROOF_SIGNED_URL_TTL_SECONDS);
	if (!signError && data?.signedUrl) return data.signedUrl;
	console.error("[getProofSignedUrl]", {
		objectPath,
		bucket: PAYMENT_PROOFS_BUCKET,
		downloadError: downloadError?.message,
		signError: signError?.message
	});
	throw signError ?? downloadError ?? /* @__PURE__ */ new Error("تعذر فتح الإيصال.");
}
function openUrlInNewTab(url) {
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.target = "_blank";
	anchor.rel = "noopener noreferrer";
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
}
async function openProofInNewTab(proofPath) {
	openUrlInNewTab(await getProofSignedUrl(proofPath));
}
function formatPaymentMethod(method) {
	if (!method) return "—";
	return {
		bank_nbd_uae: "Emirates NBD",
		bank_cih_morocco: "CIH Bank",
		bank_bmce_morocco: "BMCE Bank",
		binance: "Binance",
		paypal: "PayPal",
		wise: "Wise",
		skrill: "Skrill",
		stripe: "Stripe",
		other: "أخرى"
	}[method] ?? method;
}
function formatDate(value) {
	return new Date(value).toLocaleString("ar-EG", {
		dateStyle: "medium",
		timeStyle: "short"
	});
}
//#endregion
export { formatPaymentMethod as a, formatDate as i, checkAdminAccess as n, openProofInNewTab as o, fetchSubmittedLeads as r, updateLeadPaymentStatus as s, acceptLeadPayment as t };
