import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({
    user: {
      id: session.userId,
      displayName: session.displayName,
      role: session.role,
    },
  });
}
