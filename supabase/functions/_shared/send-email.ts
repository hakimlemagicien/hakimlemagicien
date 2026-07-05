/**
 * Sends transactional email via Resend when configured.
 *
 * TODO(email): Configure RESEND_API_KEY + EMAIL_FROM + ADMIN_NOTIFICATION_EMAIL
 * in Supabase Edge Function secrets to enable admin receipt notifications.
 * Client invite emails use Supabase Auth (inviteUserByEmail) — configure SMTP
 * in Supabase Dashboard → Project Settings → Authentication → SMTP.
 */
export async function sendAdminNotificationEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM");

  if (!apiKey || !from) {
    console.warn(
      "[sendAdminNotificationEmail] TODO: Set RESEND_API_KEY and EMAIL_FROM in edge function secrets.",
    );
    return { sent: false, reason: "email_not_configured" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [options.to],
      subject: options.subject,
      html: options.html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("[sendAdminNotificationEmail]", response.status, detail);
    return { sent: false, reason: "send_failed" };
  }

  return { sent: true };
}
