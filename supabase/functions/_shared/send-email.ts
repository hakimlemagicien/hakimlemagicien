/**
 * Sends transactional email via Resend when configured.
 *
 * Secrets (Supabase → Edge Functions → Secrets):
 * - RESEND_API_KEY — required to send
 * - EMAIL_FROM — optional, defaults to support@hakimlemagicien.com
 * - ADMIN_NOTIFICATION_EMAIL — optional, defaults to support@hakimlemagicien.com
 */
const DEFAULT_FROM = "Hakim Coaching <support@hakimlemagicien.com>";

export async function sendAdminNotificationEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM") ?? DEFAULT_FROM;

  if (!apiKey) {
    console.warn(
      "[sendAdminNotificationEmail] Set RESEND_API_KEY in edge function secrets to enable admin emails.",
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
