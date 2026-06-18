import { getSupabaseAdmin } from "./supabaseAdmin";

export async function processOverdueFailures() {
  const supabase = getSupabaseAdmin();

  const { data: failedIds, error: rpcError } = await supabase.rpc(
    "fail_overdue_tasks"
  );

  if (rpcError) {
    throw new Error(rpcError.message);
  }

  const taskIds = (failedIds ?? []) as string[];
  return { processed: taskIds.length };
}
