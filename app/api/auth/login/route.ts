import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, supabaseConfigResponse } from "@/lib/apiRoute";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/session";

const userSchema = z.object({
  type: z.literal("user"),
  displayName: z.string().min(1).max(32),
  userId: z.string().uuid().optional(),
});

const adminSchema = z.object({
  type: z.literal("admin"),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const type = (body as { type?: string })?.type;

    if (type === "admin") {
      const parsed = adminSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Validation failed" }, { status: 400 });
      }

      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        return NextResponse.json(
          { error: "Admin login is not configured" },
          { status: 503 }
        );
      }

      if (parsed.data.password !== adminPassword) {
        return NextResponse.json({ error: "パスワードが違います" }, { status: 401 });
      }

      const token = createSessionToken({
        userId: "00000000-0000-0000-0000-000000000001",
        displayName: "管理者",
        role: "admin",
      });

      const res = NextResponse.json({ ok: true, role: "admin" });
      res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
      return res;
    }

    if (type === "user") {
      const configError = supabaseConfigResponse();
      if (configError) return configError;

      const parsed = userSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Validation failed" }, { status: 400 });
      }

      const supabase = getSupabaseAdmin();
      const displayName = parsed.data.displayName.trim();
      let userId = parsed.data.userId;
      let resolvedName = displayName;

      if (userId) {
        const { data: existing } = await supabase
          .from("users")
          .select("id, display_name")
          .eq("id", userId)
          .maybeSingle();

        if (existing) {
          resolvedName = existing.display_name;
          await supabase
            .from("users")
            .update({ display_name: displayName })
            .eq("id", userId);
          resolvedName = displayName;
        } else {
          userId = undefined;
        }
      }

      if (!userId) {
        const { data: created, error } = await supabase
          .from("users")
          .insert({ display_name: displayName })
          .select("id, display_name")
          .single();

        if (error || !created) {
          return NextResponse.json(
            { error: error?.message ?? "ユーザーの作成に失敗しました" },
            { status: 500 }
          );
        }
        userId = created.id;
        resolvedName = created.display_name;
      }

      const token = createSessionToken({
        userId: userId!,
        displayName: resolvedName,
        role: "user",
      });

      const res = NextResponse.json({
        ok: true,
        role: "user",
        userId,
        displayName: resolvedName,
      });
      res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
      return res;
    }

    return NextResponse.json({ error: "Invalid login type" }, { status: 400 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
