import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

/** OTP length sent by Supabase Auth (production currently uses 8). */
export const QUIZ_EMAIL_OTP_LENGTH = 8;

const AVATARS_BUCKET = "avatars";
const DRAFT_TOKEN_KEY = "hakim_onboarding_draft_token_v1";

export type OnboardingDraftPayload = {
  email: string;
  full_name: string;
  phone?: string;
  country?: string;
  city?: string;
  goal?: string;
  training_type?: string;
  location_preference?: string;
  answers?: Json;
};

type CreateDraftResponse = {
  draft_token?: string;
};

function readDraftToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(DRAFT_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function persistDraftToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_TOKEN_KEY, token);
  } catch {
    // no-op
  }
}

export function clearDraftToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_TOKEN_KEY);
  } catch {
    // no-op
  }
}

export function getStoredDraftToken(): string | null {
  return readDraftToken();
}

export async function createOnboardingDraft(payload: OnboardingDraftPayload): Promise<string> {
  const { data, error } = await supabase.rpc("create_onboarding_draft", {
    p_payload: payload as Json,
  });

  if (error) throw error;

  const record = data as CreateDraftResponse | null;
  const token = record?.draft_token;
  if (!token) throw new Error("لم يتم إنشاء مسودة التسجيل.");

  persistDraftToken(token);
  return token;
}

export function getQuizVerifyEmailRedirectUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/quiz?step=createPassword`;
  }
  return "https://hakimlemagicien.com/quiz?step=createPassword";
}

function hasAuthCallbackParams(searchParams: URLSearchParams, hashParams: URLSearchParams): boolean {
  return (
    searchParams.has("code") ||
    searchParams.has("token_hash") ||
    hashParams.has("access_token") ||
    hashParams.has("token_hash")
  );
}

function cleanAuthCallbackParams(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("token_hash");
  url.searchParams.delete("type");
  url.hash = "";
  window.history.replaceState(null, "", url.toString());
}

/** Returns true when the user is authenticated via magic link / OTP callback. */
export async function consumeQuizAuthCallback(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const hadAuthParams = hasAuthCallbackParams(searchParams, hashParams);

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    cleanAuthCallbackParams();
    if (error) throw error;
    return true;
  }

  const tokenHash = searchParams.get("token_hash") ?? hashParams.get("token_hash");
  const type = searchParams.get("type") ?? hashParams.get("type");
  if (tokenHash && type === "email") {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "email",
    });
    cleanAuthCallbackParams();
    if (error) throw error;
    return true;
  }

  if (hashParams.has("access_token")) {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session) {
      cleanAuthCallbackParams();
      return true;
    }
  }

  if (hadAuthParams) {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session) {
      cleanAuthCallbackParams();
      return true;
    }
  }

  return false;
}

export function isQuizEmailOtpComplete(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length === QUIZ_EMAIL_OTP_LENGTH;
}

export async function sendEmailVerificationOtp(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      shouldCreateUser: true,
      emailRedirectTo: getQuizVerifyEmailRedirectUrl(),
    },
  });
  if (error) throw error;
}

export async function verifyEmailOtp(email: string, token: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: "email",
  });
  if (error) throw error;
}

export async function setUserPassword(password: string, fullName?: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password,
    data: fullName ? { full_name: fullName } : undefined,
  });
  if (error) throw error;
}

function getFileExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp"].includes(fromName)) return fromName === "jpeg" ? "jpg" : fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export async function uploadUserAvatar(file: File, userId: string): Promise<string> {
  const ext = getFileExtension(file);
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || undefined });

  if (uploadError) throw uploadError;
  return path;
}

export async function updateDraftEmail(draftToken: string, email: string): Promise<void> {
  const { error } = await supabase.rpc("update_onboarding_draft", {
    p_draft_token: draftToken,
    p_payload: { email: email.trim().toLowerCase() } as Json,
  });
  if (error) throw error;
}

export async function updateDraftAvatar(draftToken: string, avatarPath: string): Promise<void> {
  const { error } = await supabase.rpc("update_onboarding_draft", {
    p_draft_token: draftToken,
    p_payload: { avatar_path: avatarPath } as Json,
  });
  if (error) throw error;
}

export async function finalizeOnboarding(draftToken: string): Promise<void> {
  const { error } = await supabase.rpc("finalize_onboarding", {
    p_draft_token: draftToken,
  });
  if (error) throw error;
}
