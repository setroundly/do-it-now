import { NextResponse } from "next/server";
import { getAuthenticatedAppUser } from "@/lib/requireAppUser";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ user: null });
    }

    const user = await getAuthenticatedAppUser();
    return NextResponse.json({
      user: user
        ? {
            id: user.id,
            display_name: user.display_name,
            email: authUser.email ?? null,
          }
        : null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
