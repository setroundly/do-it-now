"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient, isSupabaseAuthConfigured } from "@/lib/supabase/client";

export type AppAuthUser = {
  id: string;
  display_name: string;
  email: string | null;
};

export function useAppAuth() {
  const [user, setUser] = useState<AppAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseAuthConfigured();

  const refresh = useCallback(async () => {
    if (!configured) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/me");
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = (await res.json()) as { user: AppAuthUser | null };
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    void refresh();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });

    return () => subscription.unsubscribe();
  }, [configured, refresh]);

  const signInWithGoogle = useCallback(async () => {
    if (!configured) return;
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  }, [configured]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    if (configured) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    setUser(null);
  }, [configured]);

  return {
    user,
    loading,
    configured,
    signInWithGoogle,
    signOut,
    refresh,
  };
}
