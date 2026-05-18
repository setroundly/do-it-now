import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "doitnow_session";

export type SessionRole = "user" | "admin";

export interface SessionPayload {
  userId: string;
  displayName: string;
  role: SessionRole;
  exp: number;
}

const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "development") {
    return "dev-only-session-secret-32chars!!";
  }
  throw new Error("SESSION_SECRET is not configured");
}

function signPayload(encoded: string): string {
  return createHmac("sha256", getSecret()).update(encoded).digest("base64url");
}

export function createSessionToken(
  payload: Omit<SessionPayload, "exp">,
  maxAgeSec = MAX_AGE_SEC
): string {
  const data: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + maxAgeSec,
  };
  const encoded = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${encoded}.${signPayload(encoded)}`;
}

export function parseSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;

  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;

  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  try {
    const expected = signPayload(encoded);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const data = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as SessionPayload;

    if (!data.userId || !data.displayName || !data.role || !data.exp) return null;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;

    return data;
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  return parseSessionToken(jar.get(SESSION_COOKIE)?.value);
}

export function getRequestSession(request: NextRequest): SessionPayload | null {
  return parseSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

export function sessionCookieOptions(maxAgeSec = MAX_AGE_SEC) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec,
  };
}
