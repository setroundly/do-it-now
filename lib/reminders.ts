import { getAppBaseUrl } from "@/lib/constants";
import { pickReminderCopy, type ReminderTier } from "@/lib/reminderMessages";
import { sendReminderEmail } from "@/lib/resend";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const HOUR_MS = 60 * 60 * 1000;

type ReminderTaskRow = {
  id: string;
  title: string;
  deadline_at: string;
  penalty_amount: number;
  donation_destination: string;
  reminded_24h_at: string | null;
  reminded_1h_at: string | null;
  users: { display_name: string; auth_user_id: string | null } | null;
};

function reminderTierForTask(task: ReminderTaskRow, now: Date): ReminderTier | null {
  const deadline = new Date(task.deadline_at);
  if (deadline <= now) return null;

  const msLeft = deadline.getTime() - now.getTime();

  if (!task.reminded_1h_at && msLeft <= HOUR_MS) {
    return "1h";
  }
  if (!task.reminded_24h_at && msLeft <= 24 * HOUR_MS && msLeft > HOUR_MS) {
    return "24h";
  }
  return null;
}

async function resolveUserEmail(authUserId: string | null): Promise<string | null> {
  if (!authUserId) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.admin.getUserById(authUserId);
  if (error || !data.user?.email) return null;
  return data.user.email;
}

async function markReminderSent(taskId: string, tier: ReminderTier) {
  const supabase = getSupabaseAdmin();
  const column = tier === "24h" ? "reminded_24h_at" : "reminded_1h_at";
  const { error } = await supabase
    .from("tasks")
    .update({ [column]: new Date().toISOString() })
    .eq("id", taskId)
    .eq("status", "pending");

  if (error) {
    throw new Error(error.message);
  }
}

export async function processTaskReminders() {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const horizon = new Date(now.getTime() + 25 * HOUR_MS).toISOString();

  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id, title, deadline_at, penalty_amount, donation_destination, reminded_24h_at, reminded_1h_at, users(display_name, auth_user_id)"
    )
    .eq("status", "pending")
    .gt("deadline_at", now.toISOString())
    .lte("deadline_at", horizon);

  if (error) {
    throw new Error(error.message);
  }

  let sent24h = 0;
  let sent1h = 0;
  let skipped = 0;

  for (const row of data ?? []) {
    const joined = row.users;
    const user = Array.isArray(joined) ? joined[0] : joined;
    const task: ReminderTaskRow = {
      id: row.id,
      title: row.title,
      deadline_at: row.deadline_at,
      penalty_amount: row.penalty_amount,
      donation_destination: row.donation_destination,
      reminded_24h_at: row.reminded_24h_at,
      reminded_1h_at: row.reminded_1h_at,
      users: user ?? null,
    };
    const tier = reminderTierForTask(task, now);
    if (!tier) continue;

    const email = await resolveUserEmail(task.users?.auth_user_id ?? null);
    if (!email) {
      await markReminderSent(task.id, tier);
      skipped += 1;
      continue;
    }

    const copy = pickReminderCopy(tier, task.id);
    const result = await sendReminderEmail({
      to: email,
      displayName: task.users?.display_name ?? "あなた",
      taskTitle: task.title,
      deadlineAt: task.deadline_at,
      penaltyAmount: task.penalty_amount,
      donationDestination: task.donation_destination,
      copy,
      tier,
      appUrl: getAppBaseUrl(),
    });

    if (result.skipped) {
      skipped += 1;
      continue;
    }

    await markReminderSent(task.id, tier);
    if (tier === "24h") sent24h += 1;
    else sent1h += 1;
  }

  return { sent24h, sent1h, skipped, checked: (data ?? []).length };
}
