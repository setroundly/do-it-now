import { APP_NAME } from "@/lib/branding";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendFailureEmail(params: {
  to: string;
  displayName: string;
  taskTitle: string;
  penaltyAmount: number;
  donationDestination?: string;
  donateUrl?: string | null;
}) {
  if (!resend || !process.env.RESEND_API_KEY) {
    console.warn("[resend] Skipping email: RESEND_API_KEY not set");
    return { skipped: true as const };
  }

  const from = process.env.EMAIL_FROM?.trim();
  if (!from) {
    console.warn("[resend] Skipping email: EMAIL_FROM not set");
    return { skipped: true as const };
  }

  const {
    to,
    displayName,
    taskTitle,
    penaltyAmount,
    donationDestination,
    donateUrl,
  } = params;

  let text = `${displayName}さんがタスク『${taskTitle}』に失敗しました。\n寄付予定額：${penaltyAmount.toLocaleString()}円`;
  if (donationDestination) {
    text += `\n寄付先：${donationDestination}`;
  }
  if (donateUrl) {
    text += `\n寄付ページ：${donateUrl}`;
  }

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: `【${APP_NAME}】${displayName}さんがタスクに失敗しました`,
    text,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { skipped: false as const, id: data?.id };
}
