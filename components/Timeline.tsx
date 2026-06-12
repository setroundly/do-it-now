"use client";

import { FailureCard } from "./FailureCard";
import { useFailuresTimeline } from "@/lib/useFailuresTimeline";

function TimelineSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-xl border border-zinc-100 bg-zinc-50"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

export function Timeline() {
  const { failures, loading, error, newIds, refresh } = useFailuresTimeline();

  if (loading) {
    return (
      <div className="flex flex-col">
        <p className="text-empty-hint mb-4">みんなの失敗を読み込み中…</p>
        <TimelineSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Live
        </span>
        <span className="text-[10px] text-zinc-400">締切を過ぎた失敗が流れます</span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <a
            href="/api/health"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block text-xs font-medium text-fail underline"
          >
            接続診断を開く（/api/health）
          </a>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-2 block font-medium text-fail underline"
          >
            再試行
          </button>
        </div>
      )}

      {!error && failures.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
          <p className="font-display text-base text-zinc-600">
            まだ失敗がありません
          </p>
          <p className="text-empty-hint mt-2">
            タスクの締切を過ぎると、ここに自動で流れてきます。
          </p>
        </div>
      )}

      {failures.length > 0 && (
        <ul className="flex flex-col gap-3">
          {failures.map((failure) => (
            <li key={failure.id}>
              <FailureCard failure={failure} isNew={newIds.has(failure.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
