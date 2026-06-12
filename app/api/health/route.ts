import { NextResponse } from "next/server";
import {
  getSupabaseEnvStatus,
  testSupabaseConnection,
} from "@/lib/supabaseHealth";

export const dynamic = "force-dynamic";

/** Supabase 接続診断（秘密鍵は返さない） */
export async function GET() {
  const env = getSupabaseEnvStatus();
  const connection = env.ready
    ? await testSupabaseConnection()
    : { ok: false, message: env.hints[0] ?? "未設定" };

  return NextResponse.json({
    ok: connection.ok,
    env,
    connection,
  });
}
