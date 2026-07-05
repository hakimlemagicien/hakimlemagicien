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

export type ResendAccessResult = {
  ok: boolean;
  method?: string;
  message?: string;
  error?: string;
  detail?: string;
};

export async function invokeAdminResendAccess(leadId: string): Promise<ResendAccessResult> {
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

  const response = await fetch(`${supabaseUrl}/functions/v1/admin-resend-access`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ leadId }),
  });

  const payload = (await response.json()) as ResendAccessResult & { detail?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? payload.detail ?? "resend_access_failed");
  }

  return payload;
}

export async function notifyAdminReceiptUpload(
  leadId: string,
  accessToken: string,
): Promise<void> {
  console.log("[notifyAdminReceiptUpload] start", { leadId });

  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !anonKey) {
    console.warn("[notifyAdminReceiptUpload] Missing Supabase configuration.", {
      hasUrl: Boolean(supabaseUrl),
      hasKey: Boolean(anonKey),
    });
    return;
  }

  const headers: Record<string, string> = {
    apikey: anonKey,
    "Content-Type": "application/json",
  };
  // New publishable keys are not JWTs — match supabase client header behavior.
  if (!anonKey.startsWith("sb_publishable_") && !anonKey.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${anonKey}`;
  }

  try {
    console.log("[notifyAdminReceiptUpload] calling edge function", {
      leadId,
      url: `${supabaseUrl}/functions/v1/notify-receipt-upload`,
    });

    const response = await fetch(`${supabaseUrl}/functions/v1/notify-receipt-upload`, {
      method: "POST",
      headers,
      body: JSON.stringify({ leadId, accessToken }),
    });

    const body = await response.text();
    console.log("[notifyAdminReceiptUpload] response", {
      leadId,
      status: response.status,
      body,
    });

    if (!response.ok) {
      console.warn("[notifyAdminReceiptUpload] failed:", response.status, body);
    }
  } catch (err) {
    console.warn("[notifyAdminReceiptUpload] error", err);
  }
}
