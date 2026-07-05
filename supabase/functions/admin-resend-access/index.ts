import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { generateAndEmailAccessLink, pickLinkType } from "../_shared/client-access-email.ts";
import { createSupabaseAdmin, createSupabaseUserClient } from "../_shared/supabase-admin.ts";
import { verifyAdminUser } from "../_shared/verify-admin.ts";

type RequestBody = {
  leadId?: string;
};

async function findAuthUserByEmail(
  admin: ReturnType<typeof createSupabaseAdmin>,
  email: string,
) {
  const normalized = email.trim().toLowerCase();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find((user) => user.email?.trim().toLowerCase() === normalized) ?? null;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "unauthenticated" }, 401);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const leadId = body.leadId?.trim();
  if (!leadId) {
    return jsonResponse({ error: "missing_lead_id" }, 400);
  }

  const userClient = createSupabaseUserClient(authHeader);
  const adminCheck = await verifyAdminUser(userClient);
  if ("error" in adminCheck) {
    const status = adminCheck.error === "unauthenticated" ? 401 : 403;
    return jsonResponse({ error: adminCheck.error }, status);
  }

  const admin = createSupabaseAdmin();

  const { data: lead, error: leadError } = await admin
    .from("leads")
    .select("id, email, full_name, payment_status")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError || !lead) {
    return jsonResponse({ error: "lead_not_found" }, 404);
  }

  if (lead.payment_status !== "approved") {
    return jsonResponse({ error: "payment_not_approved" }, 409);
  }

  const email = lead.email?.trim();
  if (!email) {
    return jsonResponse({ error: "lead_has_no_email" }, 422);
  }

  const authUser = await findAuthUserByEmail(admin, email);
  const linkType = pickLinkType(authUser);

  try {
    const emailResult = await generateAndEmailAccessLink(admin, {
      email,
      fullName: lead.full_name,
      linkType,
    });

    if (!emailResult.sent) {
      return jsonResponse({ error: "email_not_sent", reason: emailResult.reason }, 500);
    }

    return jsonResponse({
      ok: true,
      method: emailResult.method,
      message: emailResult.message,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "resend_failed";
    console.error("[admin-resend-access]", detail);
    return jsonResponse({ error: "resend_failed", detail }, 500);
  }
});
