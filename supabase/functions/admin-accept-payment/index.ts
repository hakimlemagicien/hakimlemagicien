import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { createSupabaseAdmin, createSupabaseUserClient } from "../_shared/supabase-admin.ts";
import { verifyAdminUser } from "../_shared/verify-admin.ts";

type RequestBody = {
  leadId?: string;
};

function siteUrl(): string {
  return (Deno.env.get("SITE_URL") ?? "https://hakimlemagicien.com").replace(/\/$/, "");
}

async function findAuthUserIdByEmail(
  admin: ReturnType<typeof createSupabaseAdmin>,
  email: string,
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();

  // Paginate listUsers — typical lead volume is small enough for first page.
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) {
    console.error("[admin-accept-payment] listUsers:", error.message);
    throw error;
  }

  const match = data.users.find(
    (user) => user.email?.trim().toLowerCase() === normalized,
  );
  return match?.id ?? null;
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
    .select("id, email, full_name, phone, payment_status, status, user_id")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError || !lead) {
    console.error("[admin-accept-payment] lead lookup:", leadError?.message);
    return jsonResponse({ error: "lead_not_found" }, 404);
  }

  if (lead.payment_status !== "confirmed") {
    return jsonResponse({ error: "payment_not_confirmed" }, 409);
  }

  const email = lead.email?.trim();
  if (!email) {
    return jsonResponse({
      ok: true,
      linked: false,
      invited: false,
      warning: "lead_has_no_email",
    });
  }

  let userId = lead.user_id ?? (await findAuthUserIdByEmail(admin, email));
  let invited = false;

  if (!userId) {
    const redirectTo = `${siteUrl()}/auth`;

    const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo,
        data: {
          full_name: lead.full_name ?? undefined,
          phone: lead.phone ?? undefined,
        },
      },
    );

    if (inviteError) {
      // User may have been created between lookup and invite.
      const existingId = await findAuthUserIdByEmail(admin, email);
      if (!existingId) {
        console.error("[admin-accept-payment] invite:", inviteError.message);
        return jsonResponse({ error: "invite_failed", detail: inviteError.message }, 500);
      }
      userId = existingId;
    } else {
      userId = inviteData.user.id;
      invited = true;
    }
  }

  const { error: linkError } = await admin
    .from("leads")
    .update({ user_id: userId, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  if (linkError) {
    console.error("[admin-accept-payment] link lead:", linkError.message);
    return jsonResponse({ error: "link_failed" }, 500);
  }

  return jsonResponse({
    ok: true,
    linked: true,
    invited,
    userId,
    message: invited
      ? "تم إرسال دعوة للعميل لإنشاء كلمة المرور عبر البريد الإلكتروني."
      : "تم ربط الطلب بحساب العميل الموجود.",
  });
});
