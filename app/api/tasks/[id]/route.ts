import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, supabaseConfigResponse } from "@/lib/apiRoute";
import { requireAppUser } from "@/lib/requireAppUser";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const configError = supabaseConfigResponse();
  if (configError) return configError;

  const auth = await requireAppUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const { user } = auth;
    const supabase = getSupabaseAdmin();

    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select("id, user_id, title, status")
      .eq("id", id)
      .single();

    if (fetchError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: failureError } = await supabase
      .from("failures")
      .delete()
      .eq("task_id", id);

    if (failureError) {
      return NextResponse.json({ error: failureError.message }, { status: 500 });
    }

    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
