import { APP_NAME } from "@/lib/branding";
import type { ReminderCopy, ReminderTier } from "@/lib/reminderMessages";
import { Resend } from "resend";

function formatDeadlineJa(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

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

export async function sendReminderEmail(params: {
  to: string;
  displayName: string;
  taskTitle: string;
  deadlineAt: string;
  penaltyAmount: number;
  donationDestination: string;
  copy: ReminderCopy;
  tier: ReminderTier;
  appUrl: string;
}) {
  if (!resend || !process.env.RESEND_API_KEY) {
    console.warn("[resend] Skipping reminder: RESEND_API_KEY not set");
    return { skipped: true as const };
  }

  const from = process.env.EMAIL_FROM?.trim();
  if (!from) {
    console.warn("[resend] Skipping reminder: EMAIL_FROM not set");
    return { skipped: true as const };
  }

  const {
    to,
    displayName,
    taskTitle,
    deadlineAt,
    penaltyAmount,
    donationDestination,
    copy,
    tier,
    appUrl,
  } = params;

  const whenLabel = tier === "24h" ? "24時間前" : "1時間前";
  const deadlineLabel = formatDeadlineJa(deadlineAt);

  const text = [
    `${displayName}さん、${whenLabel}リマインドです。`,
    "",
    copy.headline,
    copy.punchline,
    "",
    `タスク：${taskTitle}`,
    `締切：${deadlineLabel}`,
    `失敗時の寄付：${penaltyAmount.toLocaleString()}円 → ${donationDestination}`,
    "",
    `今すぐ確認：${appUrl}`,
    "",
    `— ${APP_NAME}`,
  ].join("\n");

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: `【${APP_NAME}】${copy.subject}`,
    text,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { skipped: false as const, id: data?.id };
}
