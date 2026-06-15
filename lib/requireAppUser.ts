import { NextResponse } from "next/server";
import { ensurePublicUser } from "@/lib/appUser";
import { createClient } from "@/lib/supabase/server";
import type { User as AppUser } from "@/lib/types";

export async function getAuthenticatedAppUser(): Promise<AppUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;
    return await ensurePublicUser(user);
  } catch {
    return null;
  }
}

export async function requireAppUser() {
  const user = await getAuthenticatedAppUser();
  if (!user) {
    return {
      error: NextResponse.json(
        { error: "ログインが必要です" },
        { status: 401 }
      ),
    };
  }
  return { user };
}
