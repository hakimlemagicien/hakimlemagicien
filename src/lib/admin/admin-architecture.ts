/**
 * MAAKFIT Command Center — Phase 1 architecture contracts.
 * These are boundaries, not implemented business logic.
 */

export const COMMAND_CENTER_PRODUCT = "MAAKFIT" as const;
export const COMMAND_CENTER_IDENTITY = "Coach Hakim" as const;
export const COMMAND_CENTER_DOMAIN = "hakimlemagicien.com" as const;

export const CLIENT_APP_PREFIX = "/app" as const;
export const ADMIN_APP_PREFIX = "/admin" as const;

/** Program template catalog ≠ a client's assigned program snapshot. */
export const PROGRAM_BOUNDARIES = {
  template: "PROGRAM_TEMPLATE",
  assigned: "CLIENT_ASSIGNED_PROGRAM",
} as const;

export const NUTRITION_BOUNDARIES = {
  library: "MEAL_LIBRARY_RECORD",
  assigned: "CLIENT_ASSIGNED_MEAL",
  plan: "CLIENT_NUTRITION_ASSIGNMENT",
} as const;

export const CONTENT_PUBLISHING_STATES = ["draft", "review", "published", "archived"] as const;

export const NOTIFICATION_CHANNELS = {
  admin: "admin_notification",
  coachAlert: "coach_alert",
  client: "client_notification",
  system: "system_event",
} as const;

export const CLIENT_360_SECTIONS = [
  "overview",
  "training",
  "nutrition",
  "progress",
  "membership",
  "activity",
  "notes",
] as const;

export type Client360Section = (typeof CLIENT_360_SECTIONS)[number];

export const CLIENT_360_SECTION_LABELS: Record<Client360Section, string> = {
  overview: "نظرة عامة",
  training: "التدريب",
  nutrition: "التغذية",
  progress: "التقدم",
  membership: "العضوية والفوترة",
  activity: "النشاط",
  notes: "الملاحظات",
};

/** Legacy tab keys kept for deep links — mapped in client route search validation. */
export const CLIENT_360_LEGACY_TABS = {
  history: "activity",
  messages: "overview",
} as const;

export function normalizeClient360Tab(value: unknown): Client360Section {
  if (typeof value === "string") {
    if (value in CLIENT_360_LEGACY_TABS) {
      return CLIENT_360_LEGACY_TABS[value as keyof typeof CLIENT_360_LEGACY_TABS];
    }
    if (CLIENT_360_SECTIONS.includes(value as Client360Section)) {
      return value as Client360Section;
    }
  }
  return "overview";
}

export const ATTENTION_SIGNAL_CONTRACTS = [
  { id: "unread_coaching", status: "LIVE", source: "admin_list_coaching_inbox" },
  { id: "pending_payments", status: "LIVE", source: "admin_list_submitted_leads" },
  { id: "open_support", status: "LIVE", source: "admin_list_support_tickets" },
  { id: "progress_review_due", status: "DOMAIN_RULE_REQUIRED" },
  { id: "vip_priority_response", status: "DOMAIN_RULE_REQUIRED" },
  { id: "low_adherence", status: "DOMAIN_RULE_REQUIRED" },
  { id: "stalled_progress", status: "DOMAIN_RULE_REQUIRED" },
  { id: "injury_flag", status: "DOMAIN_RULE_REQUIRED" },
  { id: "program_adjustment_due", status: "DOMAIN_RULE_REQUIRED" },
  { id: "training_review_flags", status: "LIVE", source: "getCoachTrainingOverview" },
  { id: "no_active_nutrition", status: "LIVE", source: "admin_get_client_overview" },
  { id: "nutrition_allergen_conflict", status: "LIVE", source: "client_nutrition_assignments" },
  { id: "nutrition_issue", status: "DOMAIN_RULE_REQUIRED" },
  { id: "subscription_issue", status: "DOMAIN_RULE_REQUIRED" },
  { id: "support_escalation", status: "DOMAIN_RULE_REQUIRED" },
] as const;

export function isClientAppPath(pathname: string): boolean {
  return pathname === CLIENT_APP_PREFIX || pathname.startsWith(`${CLIENT_APP_PREFIX}/`);
}

export function isAdminAppPath(pathname: string): boolean {
  return pathname === ADMIN_APP_PREFIX || pathname.startsWith(`${ADMIN_APP_PREFIX}/`);
}
