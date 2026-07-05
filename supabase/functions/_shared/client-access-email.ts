import { sendAdminNotificationEmail } from "./send-email.ts";
import { authRedirectUrl, normalizeActionLink } from "./site-url.ts";
import type { createSupabaseAdmin } from "./supabase-admin.ts";

type LinkType = "invite" | "recovery" | "magiclink";

export async function ensureAuthUser(
  admin: ReturnType<typeof createSupabaseAdmin>,
  email: string,
  fullName?: string | null,
) {
  const normalized = email.trim().toLowerCase();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;

  const existing = data.users.find((user) => user.email?.trim().toLowerCase() === normalized);
  if (existing) return existing;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: normalized,
    email_confirm: false,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  });

  if (createError) throw createError;
  return created.user;
}

export async function generateAndEmailAccessLink(
  admin: ReturnType<typeof createSupabaseAdmin>,
  options: {
    email: string;
    fullName?: string | null;
    linkType: LinkType;
  },
): Promise<{ sent: boolean; method: string; message: string; reason?: string }> {
  const email = options.email.trim();
  const redirectTo = authRedirectUrl();

  await ensureAuthUser(admin, email, options.fullName);

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: options.linkType,
    email,
    options: { redirectTo },
  });

  if (linkError || !linkData?.properties?.action_link) {
    console.error("[client-access-email] generateLink:", linkError?.message);
    throw new Error(linkError?.message ?? "link_generation_failed");
  }

  const actionLink = normalizeActionLink(linkData.properties.action_link);
  console.log("[client-access-email] sending link", { email, linkType: options.linkType, redirectTo });

  const subject =
    options.linkType === "recovery"
      ? "الكوتش حكيم — إعادة تعيين كلمة المرور"
      : "الكوتش حكيم — أكمل إنشاء حسابك";

  const cta =
    options.linkType === "recovery" ? "إعادة تعيين كلمة المرور" : "إنشاء كلمة المرور والدخول";

  const emailResult = await sendAdminNotificationEmail({
    to: email,
    subject,
    html: `
      <div dir="rtl" style="font-family: Tajawal, Arial, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #0F172A;">مرحباً ${options.fullName ?? ""}</h2>
        <p style="color: #475569; line-height: 1.7;">
          اضغط الزر أدناه للوصول إلى برنامجك على موقع الكوتش حكيم.
        </p>
        <p style="text-align: center; margin: 28px 0;">
          <a href="${actionLink}"
             style="display: inline-block; background: #FF6B00; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700;">
            ${cta}
          </a>
        </p>
        <p style="color: #94A3B8; font-size: 12px;">hakimlemagicien.com</p>
      </div>
    `,
  });

  if (!emailResult.sent) {
    return {
      sent: false,
      method: options.linkType,
      message: "تعذر إرسال البريد. تحقق من RESEND_API_KEY.",
      reason: emailResult.reason,
    };
  }

  return {
    sent: true,
    method: options.linkType,
    message: "تم إرسال رابط الدخول للعميل عبر البريد الإلكتروني.",
  };
}

export function pickLinkType(
  authUser: { email_confirmed_at?: string | null; last_sign_in_at?: string | null } | null,
): LinkType {
  if (!authUser?.email_confirmed_at && !authUser?.last_sign_in_at) {
    return "invite";
  }
  return "recovery";
}
