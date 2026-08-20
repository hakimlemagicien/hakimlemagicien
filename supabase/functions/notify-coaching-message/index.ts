import { corsHeaders, handleCors, jsonResponse } from "../_shared/cors.ts";
import { sendAdminNotificationEmail } from "../_shared/send-email.ts";
import { createSupabaseAdmin, createSupabaseUserClient } from "../_shared/supabase-admin.ts";

const DEFAULT_ADMIN_EMAIL = "support@hakimlemagicien.com";
const DEFAULT_SITE_URL = "https://hakimlemagicien.com";

type RequestBody = {
  conversationId?: string;
  messageId?: string;
};

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "unauthenticated" }, 401);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const conversationId = body.conversationId?.trim();
  const messageId = body.messageId?.trim();
  if (!conversationId || !messageId) {
    return jsonResponse({ error: "missing_ids" }, 400);
  }

  const userClient = createSupabaseUserClient(authHeader);
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) return jsonResponse({ error: "unauthenticated" }, 401);

  const admin = createSupabaseAdmin();
  const { data: message, error: messageError } = await admin
    .from("coaching_messages")
    .select("id, actor, body, kind, conversation_id, sender_id")
    .eq("id", messageId)
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (messageError || !message) return jsonResponse({ error: "message_not_found" }, 404);
  if (message.sender_id !== user.id) return jsonResponse({ error: "forbidden" }, 403);

  const { data: conversation } = await admin
    .from("coaching_conversations")
    .select("id, member_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conversation) return jsonResponse({ error: "conversation_not_found" }, 404);

  const siteUrl = (Deno.env.get("SITE_URL") ?? DEFAULT_SITE_URL).replace(/\/$/, "");
  const preview =
    message.kind === "image" ? "صورة" : message.kind === "voice" ? "رسالة صوتية" : (message.body ?? "");

  if (message.actor === "member") {
    const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") ?? DEFAULT_ADMIN_EMAIL;
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", conversation.member_id)
      .maybeSingle();
    const html = `
      <div dir="rtl" style="font-family: Tajawal, Arial, sans-serif;">
        <h2>رسالة جديدة في صندوق الكوتش</h2>
        <p><strong>العميل:</strong> ${profile?.full_name ?? profile?.email ?? conversation.member_id}</p>
        <p>${preview}</p>
        <p><a href="${siteUrl}/admin/messages/${conversationId}">فتح المحادثة</a></p>
      </div>
    `;
    const emailResult = await sendAdminNotificationEmail({
      to: adminEmail,
      subject: `[MAAKFIT] رسالة جديدة — ${profile?.full_name ?? "عميل"}`,
      html,
    });
    return jsonResponse({ ok: true, emailSent: emailResult.sent, reason: emailResult.reason });
  }

  const { data: member } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", conversation.member_id)
    .maybeSingle();
  if (!member?.email) return jsonResponse({ ok: true, emailSent: false, reason: "member_has_no_email" });

  const html = `
    <div dir="rtl" style="font-family: Tajawal, Arial, sans-serif;">
      <h2>رد جديد من الكوتش حكيم</h2>
      <p>${preview}</p>
      <p><a href="${siteUrl}/app/support/chat">فتح الدردشة</a></p>
    </div>
  `;
  const emailResult = await sendAdminNotificationEmail({
    to: member.email,
    subject: "رد من الكوتش حكيم — MAAKFIT",
    html,
  });
  return jsonResponse({ ok: true, emailSent: emailResult.sent, reason: emailResult.reason });
});
