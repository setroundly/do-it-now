"use client";

import { useCallback, useEffect, useState } from "react";
import {
  USER_NAME_STORAGE_KEY,
  USER_STORAGE_KEY,
} from "@/lib/constants";

export interface SessionUser {
  id: string;
  displayName: string;
  role: "user" | "admin";
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = (await res.json()) as { user: SessionUser };
      setUser(data.user);
      if (data.user.role === "user") {
        localStorage.setItem(USER_STORAGE_KEY, data.user.id);
        localStorage.setItem(USER_NAME_STORAGE_KEY, data.user.displayName);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(USER_NAME_STORAGE_KEY);
    setUser(null);
    window.location.href = "/";
  };

  return { user, loading, refresh, logout };
}
