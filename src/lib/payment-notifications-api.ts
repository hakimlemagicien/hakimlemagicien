import { supabase } from "@/integrations/supabase/client";

function getSupabaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
}

function getSupabaseAnonKey(): string {
  return (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || ""
  );
}

export type AcceptPaymentOnboardingResult = {
  ok: boolean;
  linked: boolean;
  invited: boolean;
  userId?: string;
  message?: string;
  warning?: string;
  error?: string;
};

export async function invokeAdminAcceptPayment(
  leadId: string,
): Promise<AcceptPaymentOnboardingResult> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error("unauthenticated");
  }

  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase configuration");
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/admin-accept-payment`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ leadId }),
  });

  const payload = (await response.json()) as AcceptPaymentOnboardingResult & {
    detail?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? payload.detail ?? "accept_onboarding_failed");
  }

  return payload;
}

export async function notifyAdminReceiptUpload(
  leadId: string,
  accessToken: string,
): Promise<void> {
  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !anonKey) {
    // TODO(email): Supabase URL/key missing — admin won't be notified.
    console.warn("[notifyAdminReceiptUpload] Missing Supabase configuration.");
    return;
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/notify-receipt-upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ leadId, accessToken }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.warn("[notifyAdminReceiptUpload] failed:", response.status, detail);
    }
  } catch (err) {
    // Never block client UX on notification failure.
    console.warn("[notifyAdminReceiptUpload]", err);
  }
}
