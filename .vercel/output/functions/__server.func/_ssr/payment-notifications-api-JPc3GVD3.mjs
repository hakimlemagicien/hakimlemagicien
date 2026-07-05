import { t as supabase } from "./client-DaoHZWri.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/payment-notifications-api-JPc3GVD3.js
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
async function invokeAdminResendAccess(leadId) {
	const { data: { session }, error: sessionError } = await supabase.auth.getSession();
	if (sessionError || !session?.access_token) throw new Error("unauthenticated");
	const supabaseUrl = getSupabaseUrl();
	const anonKey = getSupabaseAnonKey();
	if (!supabaseUrl || !anonKey) throw new Error("Missing Supabase configuration");
	const response = await fetch(`${supabaseUrl}/functions/v1/admin-resend-access`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${session.access_token}`,
			apikey: anonKey,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({ leadId })
	});
	const payload = await response.json();
	if (!response.ok) throw new Error(payload.error ?? payload.detail ?? "resend_access_failed");
	return payload;
}
async function notifyAdminReceiptUpload(leadId, accessToken) {
	console.log("[notifyAdminReceiptUpload] start", { leadId });
	const supabaseUrl = getSupabaseUrl();
	const anonKey = getSupabaseAnonKey();
	if (!supabaseUrl || !anonKey) {
		console.warn("[notifyAdminReceiptUpload] Missing Supabase configuration.", {
			hasUrl: Boolean(supabaseUrl),
			hasKey: Boolean(anonKey)
		});
		return;
	}
	const headers = {
		apikey: anonKey,
		"Content-Type": "application/json"
	};
	if (!anonKey.startsWith("sb_publishable_") && !anonKey.startsWith("sb_secret_")) headers.Authorization = `Bearer ${anonKey}`;
	try {
		console.log("[notifyAdminReceiptUpload] calling edge function", {
			leadId,
			url: `${supabaseUrl}/functions/v1/notify-receipt-upload`
		});
		const response = await fetch(`${supabaseUrl}/functions/v1/notify-receipt-upload`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				leadId,
				accessToken
			})
		});
		const body = await response.text();
		console.log("[notifyAdminReceiptUpload] response", {
			leadId,
			status: response.status,
			body
		});
		if (!response.ok) console.warn("[notifyAdminReceiptUpload] failed:", response.status, body);
	} catch (err) {
		console.warn("[notifyAdminReceiptUpload] error", err);
	}
}
//#endregion
export { invokeAdminResendAccess as n, notifyAdminReceiptUpload as r, invokeAdminAcceptPayment as t };
