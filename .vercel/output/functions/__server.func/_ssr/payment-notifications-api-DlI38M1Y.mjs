import { t as supabase } from "./client-DaoHZWri.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/payment-notifications-api-DlI38M1Y.js
function getSupabaseUrl() {
	return "https://ufgrbpakuemamggwypdh.supabase.co";
}
function getSupabaseAnonKey() {
	return "sb_publishable_JC4GXNYsEQoU3eiPTIMMqw_Xhnozp-d";
}
async function invokeAdminAcceptPayment(leadId) {
	const { data: { session }, error: sessionError } = await supabase.auth.getSession();
	if (sessionError || !session?.access_token) throw new Error("unauthenticated");
	const supabaseUrl = getSupabaseUrl();
	const anonKey = getSupabaseAnonKey();
	if (!supabaseUrl || !anonKey) throw new Error("Missing Supabase configuration");
	const response = await fetch(`${supabaseUrl}/functions/v1/admin-accept-payment`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${session.access_token}`,
			apikey: anonKey,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({ leadId })
	});
	const payload = await response.json();
	if (!response.ok) throw new Error(payload.error ?? payload.detail ?? "accept_onboarding_failed");
	return payload;
}
async function notifyAdminReceiptUpload(leadId, accessToken) {
	const supabaseUrl = getSupabaseUrl();
	const anonKey = getSupabaseAnonKey();
	if (!supabaseUrl || !anonKey) {
		console.warn("[notifyAdminReceiptUpload] Missing Supabase configuration.");
		return;
	}
	try {
		const response = await fetch(`${supabaseUrl}/functions/v1/notify-receipt-upload`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${anonKey}`,
				apikey: anonKey,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				leadId,
				accessToken
			})
		});
		if (!response.ok) {
			const detail = await response.text();
			console.warn("[notifyAdminReceiptUpload] failed:", response.status, detail);
		}
	} catch (err) {
		console.warn("[notifyAdminReceiptUpload]", err);
	}
}
//#endregion
export { notifyAdminReceiptUpload as n, invokeAdminAcceptPayment as t };
