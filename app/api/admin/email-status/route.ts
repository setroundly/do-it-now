import { NextResponse } from "next/server";
import { getEmailConfigStatus } from "@/lib/emailConfig";
import { requireAdminSession } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;

  return NextResponse.json(getEmailConfigStatus());
}
