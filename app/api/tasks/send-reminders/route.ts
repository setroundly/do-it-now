import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, supabaseConfigResponse } from "@/lib/apiRoute";
import { processTaskReminders } from "@/lib/reminders";

export const dynamic = "force-dynamic";

async function runReminders() {
  const configError = supabaseConfigResponse();
  if (configError) return configError;

  try {
    const result = await processTaskReminders();
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
  return runReminders();
}

/** 手動実行（開発・疎通確認） */
export async function POST() {
  return runReminders();
}
