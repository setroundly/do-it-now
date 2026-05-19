import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/apiRoute";
import { getEmailConfigStatus } from "@/lib/emailConfig";
import { requireAdminSession } from "@/lib/requireAdmin";
import { sendFailureEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  to: z.string().email(),
});

/** Resend 設定の疎通確認（管理者のみ） */
export async function POST(request: NextRequest) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  const config = getEmailConfigStatus();
  if (!config.ready) {
    return NextResponse.json(
      { ok: false, error: "メール設定が未完成です", emailConfig: config },
      { status: 400 }
    );
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "有効なメールアドレスを指定してください" },
        { status: 400 }
      );
    }

    const result = await sendFailureEmail({
      to: parsed.data.to,
      displayName: "テスト",
      taskTitle: "メール送信テスト",
      penaltyAmount: 1000,
      donationDestination: "日本赤十字社",
      donateUrl: "https://www.jrc.or.jp/contribute/",
    });

    if (result.skipped) {
      return NextResponse.json(
        { ok: false, error: "送信がスキップされました", emailConfig: config },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      messageId: result.id,
      hint: "Resend ダッシュボードの Logs で delivery を確認してください",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "送信に失敗しました";
    return NextResponse.json(
      { ok: false, error: message, emailConfig: config },
      { status: 502 }
    );
  }
}
