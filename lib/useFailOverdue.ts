"use client";

import { useCallback, useEffect } from "react";

const BACKGROUND_TASK_INTERVAL_MS = 60_000;

async function runBackgroundTasks(): Promise<boolean> {
  const results = await Promise.allSettled([
    fetch("/api/tasks/fail-overdue", { method: "POST" }),
    fetch("/api/tasks/send-reminders", { method: "POST" }),
  ]);
  return results.some(
    (r) => r.status === "fulfilled" && r.value.ok
  );
}

/** 締切超過の失敗化 + リマインド（アプリ表示中に定期実行） */
export function useFailOverdue(onProcessed?: () => void) {
  const onProcessedStable = useCallback(() => {
    onProcessed?.();
  }, [onProcessed]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const ok = await runBackgroundTasks();
        if (!cancelled && ok) onProcessedStable();
      } catch {
        // 表示は続行
      }
    };

    void run();
    const timer = window.setInterval(run, BACKGROUND_TASK_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [onProcessedStable]);
}
