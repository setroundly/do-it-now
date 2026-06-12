import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function readSupabaseUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

const supabaseUrl = readSupabaseUrl();

function getServiceRoleKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ??
    process.env.SUPABASE_SECRET_KEY?.trim()
  );
}

function getAnonKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  );
}

export function getSupabaseConfigError(): string | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    return "NEXT_PUBLIC_SUPABASE_URL が未設定です (.env.local / Vercel を確認)";
  }
  if (!supabaseUrl) {
    return "NEXT_PUBLIC_SUPABASE_URL の形式が正しくありません（例: https://xxxx.supabase.co）";
  }
  if (!getServiceRoleKey()) {
    return "SUPABASE_SERVICE_ROLE_KEY または SUPABASE_SECRET_KEY が未設定です";
  }
  return null;
}

export function getSupabaseAdmin(): SupabaseClient {
  const configError = getSupabaseConfigError();
  if (configError) {
    throw new Error(configError);
  }

  return createClient(supabaseUrl!, getServiceRoleKey()!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getSupabaseAnon(): SupabaseClient {
  const anonKey = getAnonKey();
  if (!supabaseUrl || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY または NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY が未設定です"
    );
  }

  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
