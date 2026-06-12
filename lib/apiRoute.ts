import { NextResponse } from "next/server";
import { getSupabaseConfigError } from "./supabaseAdmin";

export function supabaseConfigResponse() {
  const message = getSupabaseConfigError();
  if (!message) return null;
  return NextResponse.json({ error: message }, { status: 503 });
}

/** Node fetch / Supabase 接続失敗をユーザー向け文言に変換 */
export function formatApiError(err: unknown): string {
  if (!(err instanceof Error)) return "不明なエラーが発生しました";

  const msg = err.message;
  const cause =
    err.cause instanceof Error
      ? err.cause.message
      : typeof err.cause === "string"
        ? err.cause
        : "";

  if (
    msg.includes("fetch failed") ||
    cause.includes("fetch failed") ||
    msg.includes("ENOTFOUND") ||
    msg.includes("ECONNREFUSED")
  ) {
    return "Supabase に接続できません。Vercel の NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY（または SUPABASE_SECRET_KEY）を確認してください。プロジェクトが一時停止していないかも確認してください。";
  }

  return msg;
}

export function apiErrorResponse(err: unknown, status = 500) {
  return NextResponse.json({ error: formatApiError(err) }, { status });
}
