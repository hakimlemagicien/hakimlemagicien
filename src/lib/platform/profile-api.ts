import { supabase } from "@/integrations/supabase/client";
import { uploadUserAvatar } from "@/lib/quiz-onboarding-api";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
/** Match platform signed-media guidance: ~50 min client use / 60 min server TTL. */
const AVATAR_SIGNED_URL_TTL_SECONDS = 50 * 60;

export type ProfileDetails = {
  id: string;
  email: string | null;
  fullName: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  goal: string | null;
  avatarPath: string | null;
  createdAt: string | null;
  programStartDate: string | null;
  trainingType: string | null;
  locationPreference: string | null;
};

export type TrainingProfileSnapshot = {
  goal: string | null;
  trainingType: string | null;
  completedAt: string | null;
  answers: {
    gender?: "male" | "female" | null;
    heightCm?: number | null;
    weightKg?: number | null;
    targetWeightKg?: number | null;
    birthDate?: string | null;
    activityLevel?: string | null;
    goalId?: string | null;
  };
};

export type PersonalInfoUpdate = {
  fullName?: string;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  targetWeightKg?: number | null;
  activityLevel?: string | null;
  gender?: "male" | "female" | null;
  birthDate?: string | null;
};

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export async function fetchMyProfileDetails(): Promise<ProfileDetails | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, phone, country, city, goal, avatar_path, created_at, program_start_date, training_type, location_preference",
    )
    .eq("id", auth.user.id)
    .maybeSingle();

  if (error) throw error;

  return {
    id: auth.user.id,
    email: data?.email ?? auth.user.email ?? null,
    fullName: data?.full_name?.trim() || auth.user.email?.split("@")[0] || "بطل",
    phone: data?.phone ?? null,
    country: data?.country ?? null,
    city: data?.city ?? null,
    goal: data?.goal ?? null,
    avatarPath: data?.avatar_path ?? null,
    createdAt: data?.created_at ?? auth.user.created_at ?? null,
    programStartDate: data?.program_start_date ?? null,
    trainingType: data?.training_type ?? null,
    locationPreference: data?.location_preference ?? null,
  };
}

export async function fetchMyTrainingProfile(): Promise<TrainingProfileSnapshot | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data, error } = await supabase
    .from("training_profiles")
    .select("goal, training_type, completed_at, answers")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const answers = (data.answers ?? {}) as Record<string, unknown>;
  return {
    goal: data.goal ?? null,
    trainingType: data.training_type ?? null,
    completedAt: data.completed_at ?? null,
    answers: {
      gender: (answers.gender as "male" | "female" | null) ?? null,
      heightCm: typeof answers.heightCm === "number" ? answers.heightCm : null,
      weightKg: typeof answers.weightKg === "number" ? answers.weightKg : null,
      targetWeightKg: typeof answers.targetWeightKg === "number" ? answers.targetWeightKg : null,
      birthDate: typeof answers.birthDate === "string" ? answers.birthDate : null,
      activityLevel: typeof answers.activityLevel === "string" ? answers.activityLevel : null,
      goalId: typeof answers.goalId === "string" ? answers.goalId : null,
    },
  };
}

/**
 * Avatars bucket is private — public URLs never load.
 * Always resolve a signed URL for display.
 */
export async function resolveAvatarDisplayUrl(
  avatarPath: string | null | undefined,
): Promise<string | null> {
  const value = avatarPath?.trim();
  if (!value) return null;
  if (/^(https?:\/\/|blob:|data:)/i.test(value)) return value;

  const objectPath = value.replace(/^\/+/, "").replace(/^avatars\//, "");

  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(objectPath, AVATAR_SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.error("[resolveAvatarDisplayUrl]", error.message);
    return null;
  }

  return data.signedUrl;
}

/** @deprecated use resolveAvatarDisplayUrl — public URLs fail on private avatars bucket */
export function getAvatarPublicUrl(avatarPath: string | null, _bustCache = false): string | null {
  if (!avatarPath) return null;
  const { data } = supabase.storage.from("avatars").getPublicUrl(avatarPath);
  return data.publicUrl || null;
}

export async function updateMyDisplayName(fullName: string): Promise<string> {
  const name = normalizeName(fullName);
  if (name.length < 2) throw new Error("الاسم قصير جداً");
  if (name.length > 60) throw new Error("الاسم طويل جداً");

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("يجب تسجيل الدخول أولاً");

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: auth.user.id, full_name: name }, { onConflict: "id" });

  if (error) throw error;

  void supabase
    .from("training_profiles")
    .update({ full_name: name })
    .eq("user_id", auth.user.id);

  void supabase.auth.updateUser({ data: { full_name: name } });

  return name;
}

export async function updateMyAvatar(file: File): Promise<{ path: string; url: string }> {
  if (!ALLOWED_TYPES.has(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
    throw new Error("صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WebP");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("حجم الصورة كبير. الحد الأقصى 5MB");
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("يجب تسجيل الدخول أولاً");

  const path = await uploadUserAvatar(file, auth.user.id);

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: auth.user.id, avatar_path: path }, { onConflict: "id" });

  if (error) throw error;

  void supabase
    .from("training_profiles")
    .update({ avatar_path: path })
    .eq("user_id", auth.user.id);

  const url = await resolveAvatarDisplayUrl(path);
  if (!url) throw new Error("تم رفع الصورة لكن تعذر عرضها. أعد المحاولة.");

  return { path, url };
}

export async function removeMyAvatar(): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("يجب تسجيل الدخول أولاً");

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: auth.user.id, avatar_path: null }, { onConflict: "id" });

  if (error) throw error;

  void supabase.from("training_profiles").update({ avatar_path: null }).eq("user_id", auth.user.id);
}

export async function updateMyPersonalInfo(input: PersonalInfoUpdate): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("يجب تسجيل الدخول أولاً");

  const profilePatch: Record<string, unknown> = { id: auth.user.id };
  if (input.fullName !== undefined) {
    const name = normalizeName(input.fullName);
    if (name.length < 2) throw new Error("الاسم قصير جداً");
    profilePatch.full_name = name;
  }
  if (input.phone !== undefined) profilePatch.phone = input.phone?.trim() || null;
  if (input.city !== undefined) profilePatch.city = input.city?.trim() || null;
  if (input.country !== undefined) profilePatch.country = input.country?.trim() || null;

  const { data: trainingRow } = await supabase
    .from("training_profiles")
    .select("answers")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const prevAnswers = (trainingRow?.answers ?? {}) as Record<string, unknown>;
  const nextAnswers = { ...prevAnswers };
  if (input.gender !== undefined) nextAnswers.gender = input.gender;
  if (input.heightCm !== undefined) nextAnswers.heightCm = input.heightCm;
  if (input.weightKg !== undefined) nextAnswers.weightKg = input.weightKg;
  if (input.targetWeightKg !== undefined) nextAnswers.targetWeightKg = input.targetWeightKg;
  if (input.activityLevel !== undefined) nextAnswers.activityLevel = input.activityLevel;
  if (input.birthDate !== undefined) nextAnswers.birthDate = input.birthDate;

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(profilePatch, { onConflict: "id" });
  if (profileError) throw profileError;

  const trainingPatch: Record<string, unknown> = { answers: nextAnswers };
  if (input.fullName !== undefined) trainingPatch.full_name = normalizeName(input.fullName);
  if (input.phone !== undefined) trainingPatch.phone = input.phone;
  if (input.city !== undefined) trainingPatch.city = input.city;
  if (input.country !== undefined) trainingPatch.country = input.country;

  const { error: trainingError } = await supabase
    .from("training_profiles")
    .update(trainingPatch)
    .eq("user_id", auth.user.id);
  if (trainingError) throw trainingError;
}

export async function updateMyEmail(newEmail: string): Promise<void> {
  const email = newEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("البريد الإلكتروني غير صالح");
  }
  const { error } = await supabase.auth.updateUser({ email });
  if (error) throw error;
}

export async function updateMyPassword(currentPassword: string, newPassword: string): Promise<void> {
  if (newPassword.length < 8) throw new Error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
  const { data: auth } = await supabase.auth.getUser();
  const email = auth.user?.email;
  if (!email) throw new Error("لا يمكن تغيير كلمة المرور لهذا الحساب");

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (signInError) throw new Error("كلمة المرور الحالية غير صحيحة");

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function signOutAllDevices(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) throw error;
}
