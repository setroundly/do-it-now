import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, supabaseConfigResponse } from "@/lib/apiRoute";
import { requireAppUser } from "@/lib/requireAppUser";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const createSchema = z.object({
  displayName: z.string().min(1).max(32).optional(),
  title: z.string().min(1).max(120),
  deadlineAt: z.string().datetime(),
  penaltyAmount: z.number().int().positive(),
  donationDestination: z.string().min(1).max(120),
  donateUrl: z.string().url().optional().or(z.literal("")),
});

export async function GET(request: NextRequest) {
  const configError = supabaseConfigResponse();
  if (configError) return configError;

  try {
    const supabase = getSupabaseAdmin();
    const auth = await requireAppUser();

    if (!auth.error) {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ tasks: data ?? [] });
    }

    const { data: timeline, error: timelineError } = await supabase
      .from("timeline_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (timelineError) {
      return NextResponse.json({ error: timelineError.message }, { status: 500 });
    }

    const posts = timeline ?? [];
    const userIds = [...new Set(posts.map((p) => p.user_id))];
    const taskIds = posts.map((p) => p.task_id);
    const failCounts: Record<string, number> = {};
    const donateUrls: Record<string, string | null> = {};

    for (const uid of userIds) {
      const { data: count } = await supabase.rpc("get_consecutive_fail_count", {
        p_user_id: uid,
      });
      failCounts[uid] = (count as number) ?? 0;
    }

    if (taskIds.length > 0) {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, donate_url")
        .in("id", taskIds);

      for (const t of tasks ?? []) {
        donateUrls[t.id] = t.donate_url;
      }
    }

    const enriched = posts.map((p) => ({
      ...p,
      consecutive_fail_count: failCounts[p.user_id] ?? 0,
      donate_url: donateUrls[p.task_id] ?? null,
    }));

    return NextResponse.json({ timeline: enriched });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  const configError = supabaseConfigResponse();
  if (configError) return configError;

  const auth = await requireAppUser();
  if (auth.error) return auth.error;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const supabase = getSupabaseAdmin();
    const userId = auth.user.id;
    const displayName = data.displayName?.trim() || auth.user.display_name;

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        title: data.title,
        deadline_at: data.deadlineAt,
        penalty_amount: data.penaltyAmount,
        donation_destination: data.donationDestination,
        donate_url: data.donateUrl || null,
        status: "pending",
      })
      .select("*")
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { error: taskError?.message ?? "Failed to create task" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: { id: userId, display_name: displayName },
      task,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
