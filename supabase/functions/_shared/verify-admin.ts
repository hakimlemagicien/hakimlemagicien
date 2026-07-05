import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export async function verifyAdminUser(
  supabase: SupabaseClient,
): Promise<{ userId: string } | { error: string }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "unauthenticated" };
  }

  const { data: roles, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (roleError) {
    console.error("[verifyAdminUser]", roleError.message);
    return { error: "forbidden" };
  }

  const isAdmin = roles?.some((row) => row.role === "admin") ?? false;
  if (!isAdmin) {
    return { error: "forbidden" };
  }

  return { userId: user.id };
}
