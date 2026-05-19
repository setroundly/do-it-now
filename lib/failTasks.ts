import { getEmailConfigStatus } from "./emailConfig";
import { getSupabaseAdmin } from "./supabaseAdmin";
import { resolveTaskDonateUrl } from "./resolveDonateUrl";
import { sendFailureEmail } from "./resend";

export type EmailAttemptResult =
  | { status: "sent"; messageId?: string }
  | { status: "skipped"; reason: string }
  | { status: "error"; message: string };

export async function processOverdueFailures() {
  const supabase = getSupabaseAdmin();

  const { data: failedIds, error: rpcError } = await supabase.rpc(
    "fail_overdue_tasks"
  );

  if (rpcError) {
    throw new Error(rpcError.message);
  }

  const taskIds = (failedIds ?? []) as string[];
  const emailConfig = getEmailConfigStatus();
  const results: {
    taskId: string;
    emailsSent: number;
    attempts: EmailAttemptResult[];
  }[] = [];

  for (const taskId of taskIds) {
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select(
        "id, title, penalty_amount, user_id, donation_destination, donate_url"
      )
      .eq("id", taskId)
      .single();

    if (taskError || !task) continue;

    const { data: user } = await supabase
      .from("users")
      .select("display_name")
      .eq("id", task.user_id)
      .single();

    const displayName = user?.display_name ?? "不明";

    const { data: targets } = await supabase
      .from("notification_targets")
      .select("*")
      .eq("task_id", taskId)
      .eq("type", "email")
      .is("notified_at", null);

    let emailsSent = 0;
    const attempts: EmailAttemptResult[] = [];

    const donateUrl = resolveTaskDonateUrl(task);

    if ((targets ?? []).length === 0) {
      results.push({ taskId, emailsSent: 0, attempts: [] });
      continue;
    }

    for (const target of targets ?? []) {
      try {
        const result = await sendFailureEmail({
          to: target.destination,
          displayName,
          taskTitle: task.title,
          penaltyAmount: task.penalty_amount,
          donationDestination: task.donation_destination,
          donateUrl,
        });

        if (result.skipped) {
          const reason = !emailConfig.hasApiKey
            ? "RESEND_API_KEY 未設定"
            : !emailConfig.hasFrom
              ? "EMAIL_FROM 未設定"
              : "メール設定が無効";
          console.error(`[failTasks] email skipped for ${target.id}: ${reason}`);
          attempts.push({ status: "skipped", reason });
          continue;
        }

        await supabase
          .from("notification_targets")
          .update({ notified_at: new Date().toISOString() })
          .eq("id", target.id);

        emailsSent += 1;
        attempts.push({ status: "sent", messageId: result.id });
      } catch (err) {
        const message = err instanceof Error ? err.message : "送信エラー";
        console.error(`[failTasks] email failed for ${target.id}:`, err);
        attempts.push({ status: "error", message });
      }
    }

    results.push({ taskId, emailsSent, attempts });
  }

  return { processed: taskIds.length, emailConfig, results };
}
