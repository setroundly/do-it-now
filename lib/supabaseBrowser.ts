"use client";

import { createClient, isSupabaseAuthConfigured } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (!isSupabaseAuthConfigured()) return null;

  if (!browserClient) {
    browserClient = createClient();
  }

  return browserClient;
}

export function isSupabaseBrowserConfigured(): boolean {
  return isSupabaseAuthConfigured();
}
