import { corsHeaders, handleCors, jsonResponse } from "../_shared/cors.ts";
import { sendAdminNotificationEmail } from "../_shared/send-email.ts";
import { createSupabaseAdmin } from "../_shared/supabase-admin.ts";

type RequestBody = {
  leadId?: string;
  accessToken?: string;
};

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const leadId = body.leadId?.trim();
  const accessToken = body.accessToken?.trim();

  if (!leadId || !accessToken) {
    return jsonResponse({ error: "missing_credentials" }, 400);
  }

  const admin = createSupabaseAdmin();

  const { data: lead, error: leadError } = await admin
    .from("leads")
    .select(
      "id, full_name, email, phone, payment_amount, payment_currency, payment_status, access_token",
    )
    .eq("id", leadId)
    .maybeSingle();

  if (leadError || !lead) {
    console.error("[notify-receipt-upload] lead lookup:", leadError?.message);
    return jsonResponse({ error: "lead_not_found" }, 404);
  }

  if (lead.access_token !== accessToken) {
    return jsonResponse({ error: "invalid_credentials" }, 403);
  }

  if (lead.payment_status !== "submitted") {
    return jsonResponse({ ok: true, emailSent: false, skipped: "not_submitted" });
  }

  const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL");
  const siteUrl = (Deno.env.get("SITE_URL") ?? "https://hakimlemagicien.com").replace(
    /\/$/,
    "",
  );

  if (!adminEmail) {
    // TODO(email): Set ADMIN_NOTIFICATION_EMAIL in Supabase Edge Function secrets.
    console.warn(
      "[notify-receipt-upload] TODO: Set ADMIN_NOTIFICATION_EMAIL to notify admin on receipt upload.",
    );
    return jsonResponse({ ok: true, emailSent: false, reason: "admin_email_not_configured" });
  }

  const amount =
    lead.payment_amount != null
      ? `${lead.payment_amount} ${lead.payment_currency ?? ""}`.trim()
      : "—";

  const html = `
    <div dir="rtl" style="font-family: Tajawal, Arial, sans-serif;">
      <h2>إيصال تحويل جديد بانتظار المراجعة</h2>
      <ul>
        <li><strong>الاسم:</strong> ${lead.full_name ?? "—"}</li>
        <li><strong>البريد:</strong> ${lead.email ?? "—"}</li>
        <li><strong>الهاتف:</strong> ${lead.phone ?? "—"}</li>
        <li><strong>المبلغ:</strong> ${amount}</li>
      </ul>
      <p><a href="${siteUrl}/admin/payments">مراجعة المدفوعات</a></p>
    </div>
  `;

  const emailResult = await sendAdminNotificationEmail({
    to: adminEmail,
    subject: `[Hakim Coaching] إيصال تحويل جديد — ${lead.full_name ?? lead.email ?? leadId}`,
    html,
  });

  return jsonResponse({
    ok: true,
    emailSent: emailResult.sent,
    reason: emailResult.reason,
  });
});
