import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, supabaseConfigResponse } from "@/lib/apiRoute";
import { requireAppUser } from "@/lib/requireAppUser";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(
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
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (task.status !== "pending") {
      return NextResponse.json(
        { error: "Task is not pending" },
        { status: 400 }
      );
    }

    if (new Date(task.deadline_at) <= new Date()) {
      return NextResponse.json(
        { error: "Deadline has passed" },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("tasks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "pending")
      .select("*")
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: updateError?.message ?? "Update failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ task: updated });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
