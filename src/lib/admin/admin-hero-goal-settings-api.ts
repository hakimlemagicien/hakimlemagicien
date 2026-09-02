import { supabase } from "@/integrations/supabase/client";
import type { HeroGender } from "@/lib/platform/hero-goal-images";
import type { HeroGoalCardTheme, HeroGoalFraming } from "@/lib/platform/hero-goal-framing";

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
