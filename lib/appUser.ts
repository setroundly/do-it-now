import type { User } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { User as AppUser } from "@/lib/types";

function displayNameFromAuth(authUser: User): string {
  const meta = authUser.user_metadata ?? {};
  const raw =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    authUser.email?.split("@")[0] ||
    "ユーザー";
  return raw.trim().slice(0, 32) || "ユーザー";
}

/** Google ログインユーザーに対応する public.users 行を取得または作成 */
export async function ensurePublicUser(authUser: User): Promise<AppUser> {
  const supabase = getSupabaseAdmin();

  const { data: existing, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (existing) {
    const name = displayNameFromAuth(authUser);
    if (existing.display_name !== name && name !== "ユーザー") {
      const { data: updated } = await supabase
        .from("users")
        .update({ display_name: name })
        .eq("id", existing.id)
        .select("*")
        .single();
      return (updated ?? existing) as AppUser;
    }
    return existing as AppUser;
  }

  const { data: created, error: insertError } = await supabase
    .from("users")
    .insert({
      auth_user_id: authUser.id,
      display_name: displayNameFromAuth(authUser),
    })
    .select("*")
    .single();

  if (insertError || !created) {
    throw new Error(insertError?.message ?? "Failed to create user");
  }

  return created as AppUser;
}
