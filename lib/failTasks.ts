import { getSupabaseAdmin } from "./supabaseAdmin";
import { resolveTaskDonateUrl } from "./resolveDonateUrl";
import { sendFailureEmail } from "./resend";

export async function processOverdueFailures() {
  const supabase = getSupabaseAdmin();

  const { data: failedIds, error: rpcError } = await supabase.rpc(
    "fail_overdue_tasks"
  );

  if (rpcError) {
    throw new Error(rpcError.message);
  }

  const taskIds = (failedIds ?? []) as string[];
  const results: { taskId: string; emailsSent: number }[] = [];

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

    const donateUrl = resolveTaskDonateUrl(task);

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
          console.error(
            `[failTasks] email skipped for ${target.id}: set RESEND_API_KEY and EMAIL_FROM`
          );
          continue;
        }

        await supabase
          .from("notification_targets")
          .update({ notified_at: new Date().toISOString() })
          .eq("id", target.id);

        emailsSent += 1;
      } catch (err) {
        console.error(`[failTasks] email failed for ${target.id}:`, err);
      }
    }

    results.push({ taskId, emailsSent });
  }

  return { processed: taskIds.length, results };
}
