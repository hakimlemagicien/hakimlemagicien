/**
 * Retention categories for MAAKFIT V1.
 * Durations that depend on legal entity / jurisdiction stay TBD_LEGAL_RETENTION.
 */

export const TBD_LEGAL_RETENTION = "TBD_LEGAL_RETENTION" as const;

export const RETENTION_CONTRACT = {
  account_data: TBD_LEGAL_RETENTION,
  progress_data: TBD_LEGAL_RETENTION,
  progress_photos: TBD_LEGAL_RETENTION,
  coaching_chat: TBD_LEGAL_RETENTION,
  attachments: TBD_LEGAL_RETENTION,
  financial_records: TBD_LEGAL_RETENTION,
  consent_records: TBD_LEGAL_RETENTION,
  security_logs: TBD_LEGAL_RETENTION,
  support_tickets: TBD_LEGAL_RETENTION,
  backups: TBD_LEGAL_RETENTION,
} as const;
