const LEAD_ID_KEY = "hakim_lead_id";
const LEAD_TOKEN_KEY = "hakim_lead_token";

export type LeadCredentials = {
  leadId: string;
  accessToken: string;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getLeadCredentials(): LeadCredentials | null {
  if (!canUseStorage()) return null;

  const leadId = window.localStorage.getItem(LEAD_ID_KEY);
  const accessToken = window.localStorage.getItem(LEAD_TOKEN_KEY);

  if (!leadId || !accessToken) return null;
  return { leadId, accessToken };
}

export function setLeadCredentials(credentials: LeadCredentials): void {
  if (!canUseStorage()) return;

  window.localStorage.setItem(LEAD_ID_KEY, credentials.leadId);
  window.localStorage.setItem(LEAD_TOKEN_KEY, credentials.accessToken);
}

export function clearLeadCredentials(): void {
  if (!canUseStorage()) return;

  window.localStorage.removeItem(LEAD_ID_KEY);
  window.localStorage.removeItem(LEAD_TOKEN_KEY);
}
