import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, supabaseConfigResponse } from "@/lib/apiRoute";
import { processOverdueFailures } from "@/lib/failTasks";

export const dynamic = "force-dynamic";

async function runFailOverdue() {
  const configError = supabaseConfigResponse();
  if (configError) return configError;

  try {
    const result = await processOverdueFailures();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

/** Vercel Cron（15分ごと） */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  return runFailOverdue();
}

/** アプリ表示時の即時失敗化 */
export async function POST() {
  return runFailOverdue();
}
