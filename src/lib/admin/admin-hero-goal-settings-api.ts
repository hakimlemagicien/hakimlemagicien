import { supabase } from "@/integrations/supabase/client";
import type { HeroGender } from "@/lib/platform/hero-goal-images";
import type { HeroGoalCardTheme, HeroGoalFraming } from "@/lib/platform/hero-goal-framing";

export const HERO_GOAL_COVER_BUCKET = "hero-goal-covers";
export const HERO_GOAL_COVER_MAX_BYTES = 5 * 1024 * 1024;
export const HERO_GOAL_COVER_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

export function validateHeroGoalCoverFile(file: File): string | null {
  if (!file.size) return "الملف فارغ.";
  if (file.size > HERO_GOAL_COVER_MAX_BYTES) return "حجم الصورة أكبر من 5 ميغابايت.";
  if (!HERO_GOAL_COVER_MIME.includes(file.type as (typeof HERO_GOAL_COVER_MIME)[number])) {
    return "الصيغة المسموحة: JPG أو PNG أو WebP.";
  }
  return null;
}

function coverExtension(file: File): string {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export async function adminSaveHeroGoalFraming(input: {
  gender: HeroGender;
  goalId: string;
  assetFileName: string;
  framing: HeroGoalFraming;
}) {
  const { data, error } = await supabase.rpc("admin_save_hero_goal_framing", {
    p_gender: input.gender,
    p_goal_id: input.goalId,
    p_asset_file_name: input.assetFileName,
    p_payload: input.framing,
  });
  if (error) throw error;
  return data;
}

export async function adminSaveHeroGoalCardTheme(input: {
  gender: HeroGender;
  goalId: string;
  theme: HeroGoalCardTheme;
}) {
  const { data, error } = await supabase.rpc("admin_save_hero_goal_card_theme", {
    p_gender: input.gender,
    p_goal_id: input.goalId,
    p_payload: input.theme,
  });
  if (error) throw error;
  return data;
}

export async function adminResetHeroGoalFraming(input: {
  gender: HeroGender;
  goalId: string;
  assetFileName: string;
}) {
  const { data, error } = await supabase.rpc("admin_reset_hero_goal_setting", {
    p_kind: "framing",
    p_gender: input.gender,
    p_goal_id: input.goalId,
    p_asset_file_name: input.assetFileName,
  });
  if (error) throw error;
  return data;
}

export async function adminResetHeroGoalCardTheme(input: {
  gender: HeroGender;
  goalId: string;
}) {
  const { data, error } = await supabase.rpc("admin_reset_hero_goal_setting", {
    p_kind: "card_theme",
    p_gender: input.gender,
    p_goal_id: input.goalId,
    p_asset_file_name: "",
  });
  if (error) throw error;
  return data;
}

export async function adminUploadHeroGoalImage(input: {
  gender: HeroGender;
  goalId: string;
  file: File;
  surface?: "home" | "workout";
}): Promise<{ id: string; url: string; fileName: string }> {
  const validation = validateHeroGoalCoverFile(input.file);
  if (validation) throw new Error(validation);
  const surface = input.surface ?? "workout";

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("يجب تسجيل الدخول لرفع الصورة.");

  const ext = coverExtension(input.file);
  const fileName = `${Date.now()}.${ext}`;
  const path = `${surface}/${input.gender}/${input.goalId}/${fileName}`;

  const { error: uploadError } = await supabase.storage.from(HERO_GOAL_COVER_BUCKET).upload(path, input.file, {
    upsert: true,
    contentType: input.file.type || undefined,
    cacheControl: "3600",
  });
  if (uploadError) {
    if (uploadError.message.toLowerCase().includes("bucket")) {
      throw new Error("مخزن صور الأهداف غير مفعّل بعد. طبّق هجرة hero-goal-covers ثم أعد المحاولة.");
    }
    throw new Error(uploadError.message || "فشل رفع الصورة.");
  }

  const { data: publicData } = supabase.storage.from(HERO_GOAL_COVER_BUCKET).getPublicUrl(path);
  if (!publicData.publicUrl) throw new Error("تعذر الحصول على رابط الصورة بعد الرفع.");

  const { data, error } = await supabase.rpc("admin_save_hero_goal_image", {
    p_gender: input.gender,
    p_goal_id: input.goalId,
    p_image_url: publicData.publicUrl,
    p_storage_path: path,
    p_file_name: fileName,
    p_sort_order: null,
    p_surface: surface,
  });
  if (error) throw error;

  const row = (data ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id ?? ""),
    url: String(row.url ?? publicData.publicUrl),
    fileName: String(row.fileName ?? fileName),
  };
}

export async function adminDeleteHeroGoalImage(id: string): Promise<void> {
  const { data, error } = await supabase.rpc("admin_delete_hero_goal_image", { p_id: id });
  if (error) throw error;
  const path = String((data as { storagePath?: string } | null)?.storagePath ?? "");
  if (path) {
    await supabase.storage.from(HERO_GOAL_COVER_BUCKET).remove([path]).catch(() => undefined);
  }
}

export async function adminClearHeroGoalImages(input: {
  gender: HeroGender;
  goalId: string;
  surface?: "home" | "workout";
}): Promise<void> {
  const { data, error } = await supabase.rpc("admin_clear_hero_goal_images", {
    p_gender: input.gender,
    p_goal_id: input.goalId,
    p_surface: input.surface ?? "workout",
  });
  if (error) throw error;
  const paths = ((data as { storagePaths?: string[] } | null)?.storagePaths ?? []).filter(Boolean);
  if (paths.length) {
    await supabase.storage.from(HERO_GOAL_COVER_BUCKET).remove(paths).catch(() => undefined);
  }
}
