import { NextResponse } from "next/server";
import {
  getServerSession,
  type SessionPayload,
  type SessionRole,
} from "@/lib/session";

export async function requireSession(
  role?: SessionRole
): Promise<
  { session: SessionPayload } | { error: NextResponse }
> {
  const session = await getServerSession();
  if (!session) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (role && session.role !== role) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session };
}

export async function requireUserSession() {
  return requireSession("user");
}
