"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiErrorMessage, fetchJson } from "@/lib/fetchJson";
import {
  mapRowToFailure,
  mergeFailure,
  removeFailureById,
  sortFailuresNewest,
} from "@/lib/failures";
import {
  getSupabaseBrowser,
  isSupabaseBrowserConfigured,
} from "@/lib/supabaseBrowser";
import type { Failure } from "@/lib/types";

/** Realtime 未設定時のフォールバック（静かに再取得） */
const POLL_INTERVAL_MS = 15_000;
const CLIENT_FAIL_INTERVAL_MS = 60_000;

async function processOverdueClient() {
  try {
    await Promise.allSettled([
      fetch("/api/tasks/fail-overdue", { method: "POST" }),
      fetch("/api/tasks/send-reminders", { method: "POST" }),
    ]);
  } catch {
    // 失敗してもタイムライン表示は続行
  }
}

export function useFailuresTimeline() {
  const [failures, setFailures] = useState<Failure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const mountedRef = useRef(true);

  const markNew = useCallback((id: string) => {
    setNewIds((prev) => new Set(prev).add(id));
    window.setTimeout(() => {
      setNewIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 2400);
  }, []);

  const fetchFailures = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const { res, data } = await fetchJson<{
        error?: string;
        failures?: Failure[];
      }>("/api/failures");

      if (!res.ok) {
        throw new Error(apiErrorMessage(data, "タイムラインの読み込みに失敗しました"));
      }

      if (mountedRef.current) {
        setFailures(sortFailuresNewest(data.failures ?? []));
      }
    } catch (e) {
      if (mountedRef.current && !opts?.silent) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
      }
    } finally {
      if (mountedRef.current && !opts?.silent) {
        setLoading(false);
      }
    }
  }, []);

  const prependFailure = useCallback(
    (failure: Failure) => {
      setFailures((prev) => mergeFailure(prev, failure));
      markNew(failure.id);
    },
    [markNew]
  );

  useEffect(() => {
    mountedRef.current = true;

    const bootstrap = async () => {
      await processOverdueClient();
      await fetchFailures();
    };

    void bootstrap();

    const overdueTimer = window.setInterval(
      () => void processOverdueClient().then(() => fetchFailures({ silent: true })),
      CLIENT_FAIL_INTERVAL_MS
    );

    const supabase = getSupabaseBrowser();
    let channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null =
      null;

    const pollTimer = window.setInterval(
      () => void fetchFailures({ silent: true }),
      POLL_INTERVAL_MS
    );

    const onFocus = () => void fetchFailures({ silent: true });
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        void fetchFailures({ silent: true });
      }
    });

    if (supabase && isSupabaseBrowserConfigured()) {
      channel = supabase
        .channel("failures-timeline-live")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "failures" },
          (payload) => {
            const row = payload.new as Record<string, unknown>;
            const failure = mapRowToFailure(row);
            setFailures((prev) => mergeFailure(prev, failure));
            markNew(failure.id);
          }
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "failures" },
          (payload) => {
            const deletedId = (payload.old as { id?: string }).id;
            if (deletedId) {
              setFailures((prev) => removeFailureById(prev, deletedId));
            } else {
              void fetchFailures({ silent: true });
            }
          }
        )
        .subscribe();
    }

    return () => {
      mountedRef.current = false;
      window.clearInterval(overdueTimer);
      window.clearInterval(pollTimer);
      window.removeEventListener("focus", onFocus);
      if (supabase && channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [fetchFailures, markNew]);

  return {
    failures,
    loading,
    error,
    newIds,
    refresh: fetchFailures,
    prependFailure,
  };
}
