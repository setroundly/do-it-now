"use client";

import { useCallback, useEffect } from "react";

const FAIL_OVERDUE_INTERVAL_MS = 60_000;

/** 締切超過タスクの失敗処理（全タブで動かす） */
export function useFailOverdue(onProcessed?: () => void) {
  const onProcessedStable = useCallback(() => {
    onProcessed?.();
  }, [onProcessed]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetch("/api/tasks/fail-overdue", { method: "POST" });
        if (!cancelled && res.ok) onProcessedStable();
      } catch {
        // 表示は続行
      }
    };

    void run();
    const timer = window.setInterval(run, FAIL_OVERDUE_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [onProcessedStable]);
}
