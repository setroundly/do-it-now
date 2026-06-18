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
    const supabase = getSupabaseAdmin();

    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select("id, user_id, status")
      .eq("id", id)
      .single();

    if (fetchError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.user_id !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (task.status !== "failed") {
      return NextResponse.json(
        { error: "失敗したタスクのみ申告できます" },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("tasks")
      .update({ donated_at: new Date().toISOString() })
      .eq("id", id)
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
    const supabase = getSupabaseAdmin();

    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (fetchError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.user_id !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: updated, error: updateError } = await supabase
      .from("tasks")
      .update({ donated_at: null })
      .eq("id", id)
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
