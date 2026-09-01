export const CLIENT_ACCOUNT_STATUSES = ["active", "suspended", "archived", "deletion_pending"] as const;
export type ClientAccountStatus = (typeof CLIENT_ACCOUNT_STATUSES)[number];

export const CLIENT_ACCOUNT_ACTIONS = ["suspend", "reactivate", "archive", "restore"] as const;
export type ClientAccountAction = (typeof CLIENT_ACCOUNT_ACTIONS)[number];

export type ClientDeletionBlockCode =
  | "active_paid_subscription"
  | "provider_confirmation_pending"
  | "payment_exception"
  | "legacy_payment_pending"
  | "provider_event_failed";

export function isClientAccountStatus(value: unknown): value is ClientAccountStatus {
  return typeof value === "string" && (CLIENT_ACCOUNT_STATUSES as readonly string[]).includes(value);
}

export function normalizeClientAccountStatus(value: unknown): ClientAccountStatus {
  return isClientAccountStatus(value) ? value : "active";
}

export function clientAccountStatusLabel(status: ClientAccountStatus): string {
  if (status === "suspended") return "موقوف";
  if (status === "archived") return "مؤرشف";
  if (status === "deletion_pending") return "حذف قيد المعالجة";
  return "نشط";
}

export function clientAccountStatusTone(
  status: ClientAccountStatus,
): "success" | "danger" | "neutral" | "review" {
  if (status === "active") return "success";
  if (status === "suspended") return "danger";
  if (status === "deletion_pending") return "review";
  return "neutral";
}

export function emailsMatchForDeletion(expected: string | null | undefined, typed: string): boolean {
  return lowerEmail(expected) !== "" && lowerEmail(expected) === lowerEmail(typed);
}

export function lowerEmail(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function deletionBlockLabel(code: string): string {
  if (code === "active_paid_subscription") return "اشتراك مدفوع نشط";
  if (code === "provider_confirmation_pending") return "طلب إيقاف تجديد بانتظار تأكيد المزود";
  if (code === "payment_exception") return "استثناء دفع (متأخر)";
  if (code === "legacy_payment_pending") return "تحويل بنكي بانتظار المراجعة";
  if (code === "provider_event_failed") return "حدث مزود دفع فاشل";
  return code;
}

export function parseAccountRpcError(error: unknown): string {
  const raw =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : error instanceof Error
        ? error.message
        : "";
  const text = raw.toLowerCase();
  if (text.includes("forbidden") || text.includes("42501")) {
    return "ليس لديك صلاحية لتنفيذ هذا الإجراء.";
  }
  if (text.includes("reason_required")) return "السبب إلزامي (5 أحرف على الأقل).";
  if (text.includes("confirmation_mismatch")) return "البريد المدخل لا يطابق بريد العميل.";
  if (text.includes("deletion_in_progress")) return "لا يمكن تنفيذ هذا الإجراء أثناء معالجة طلب الحذف.";
  if (text.includes("invalid_transition")) return "هذه الحالة لا تسمح بهذا الانتقال.";
  if (text.includes("cannot_delete_self")) return "لا يمكن حذف حساب المشغّل الحالي.";
  if (text.includes("cannot_delete_staff")) return "لا يمكن حذف حساب عضو طاقم من هنا.";
  if (text.includes("financial_blocker")) {
    return "لا يمكن إكمال حذف الحساب قبل معالجة حالة الاشتراك/الدفع الحالية.";
  }
  return "تعذر تنفيذ العملية. أعد المحاولة.";
}

export function canChangeAccountLifecycle(status: ClientAccountStatus, action: ClientAccountAction): boolean {
  if (status === "deletion_pending") return false;
  if (action === "suspend") return status === "active";
  if (action === "reactivate") return status === "suspended";
  if (action === "archive") return status === "active" || status === "suspended";
  if (action === "restore") return status === "archived";
  return false;
}
