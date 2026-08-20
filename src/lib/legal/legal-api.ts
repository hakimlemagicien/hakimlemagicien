import { supabase } from "@/integrations/supabase/client";
import { CHECKOUT_CONSENT_COPY, POLICY_META, POLICY_VERSION, CURRENT_SUPPORT_EMAIL } from "./policy-catalog";
import type { CheckoutDisclosure } from "./billing";
import { isForbiddenSupportContent } from "./support-guards";

export { isForbiddenSupportContent };

export type SupportTicketCategory =
  | "account"
  | "subscription_billing"
  | "refund"
  | "technical"
  | "privacy"
  | "other";

export type SupportTicketStatus = "received" | "in_review" | "resolved" | "closed";

export type CreateSupportTicketInput = {
  category: SupportTicketCategory;
  subject: string;
  message: string;
  email?: string;
  name?: string;
  language?: "ar" | "en";
};

export type CreateSupportTicketResult = {
  ticketId: string;
  status: SupportTicketStatus;
  createdAt: string;
  via: "rpc" | "mailto_fallback";
};

function sanitizeTicketText(value: string, max = 4000) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export async function createSupportTicket(
  input: CreateSupportTicketInput,
): Promise<CreateSupportTicketResult> {
  const subject = sanitizeTicketText(input.subject, 160);
  const message = sanitizeTicketText(input.message);
  const email = input.email?.trim() || null;
  const name = input.name?.trim() || null;

  if (!subject || !message) {
    throw new Error("missing_fields");
  }
  if (isForbiddenSupportContent(`${subject} ${message}`)) {
    throw new Error("forbidden_sensitive_data");
  }

  const { data, error } = await supabase.rpc("create_support_ticket", {
    p_category: input.category,
    p_subject: subject,
    p_message: message,
    p_email: email,
    p_name: name,
    p_language: input.language ?? "ar",
  });

  if (!error && data) {
    const row = data as { ticket_id?: string; id?: string; status?: SupportTicketStatus; created_at?: string };
    return {
      ticketId: String(row.ticket_id ?? row.id),
      status: row.status ?? "received",
      createdAt: row.created_at ?? new Date().toISOString(),
      via: "rpc",
    };
  }

  const ticketId = `LOCAL-${Date.now().toString(36).toUpperCase()}`;
  const mailto = new URL(`mailto:${CURRENT_SUPPORT_EMAIL}`);
  mailto.searchParams.set("subject", `[MAAKFIT ${input.category}] ${subject} (${ticketId})`);
  mailto.searchParams.set(
    "body",
    [
      `Ticket: ${ticketId}`,
      `Category: ${input.category}`,
      name ? `Name: ${name}` : null,
      email ? `Email: ${email}` : null,
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  if (typeof window !== "undefined") {
    window.location.href = mailto.toString();
  }
  return {
    ticketId,
    status: "received",
    createdAt: new Date().toISOString(),
    via: "mailto_fallback",
  };
}

export async function recordCheckoutConsent(disclosure: CheckoutDisclosure) {
  const { data, error } = await supabase.rpc("accept_checkout_policies", {
    p_plan: disclosure.planId,
    p_billing_period_months: disclosure.billingPeriodMonths,
    p_amount: disclosure.amount,
    p_currency: disclosure.currency,
    p_terms_version: disclosure.termsVersion,
    p_refund_policy_version: disclosure.refundPolicyVersion,
    p_privacy_version: disclosure.privacyVersion,
    p_checkout_disclosure_version: disclosure.checkoutDisclosureVersion,
    p_renewal_disclosure_version: disclosure.renewalDisclosureVersion,
    p_consent_text: CHECKOUT_CONSENT_COPY.ar,
    p_policy_version: POLICY_VERSION,
  });
  if (error) throw error;
  return data;
}

export async function recordPolicyAcceptance(policy: "terms" | "privacy" | "refund", language: "ar" | "en" = "ar") {
  const { error } = await supabase.rpc("accept_policy_version", {
    p_policy: policy,
    p_version: POLICY_META[policy].version,
    p_language: language,
  });
  if (error) throw error;
}

export async function requestAccountDeletion(reason?: string) {
  const { data, error } = await supabase.rpc("request_account_deletion", {
    p_reason: reason ?? null,
  });
  if (error) throw error;
  return data as { request_id?: string };
}

export async function recordMediaMarketingConsent(granted: boolean, assetIds?: string[]) {
  const { error } = await supabase.rpc("record_media_consent", {
    p_granted: granted,
    p_scope: "before_after_marketing",
    p_asset_ids: assetIds ?? null,
    p_version: POLICY_VERSION,
  });
  if (error) {
    console.warn("[recordMediaMarketingConsent]", error.message);
  }
}
