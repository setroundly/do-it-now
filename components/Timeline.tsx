"use client";

import { FailureCard } from "./FailureCard";
import { FirstTaskBanner } from "./FirstTaskBanner";
import type { useFailuresTimeline } from "@/lib/useFailuresTimeline";
import { useMemo, useState } from "react";

type TimelineState = ReturnType<typeof useFailuresTimeline>;

function TimelineSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-36 animate-pulse rounded-xl border border-zinc-100 bg-white"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

export function Timeline({
  timeline,
  showOnboarding,
  onCreateClick,
}: {
  timeline: TimelineState;
  showOnboarding?: boolean;
  onCreateClick?: () => void;
}) {
  const { failures, loading, error, newIds, refresh } = timeline;
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let list = [...failures];
    list.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.user_name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [failures, query]);

  return (
    <div className="flex flex-col">
      {showOnboarding && onCreateClick && (
        <FirstTaskBanner onCreateClick={onCreateClick} />
      )}

      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Live
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-400">{filtered.length}件</span>
          {!loading && (
            <button
              type="button"
              onClick={() => void refresh()}
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              更新
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 lg:hidden">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="失敗を検索…"
          className="input py-2 text-sm"
        />
      </div>

      {loading && (
        <>
          <p className="text-empty-hint mb-4">みんなの失敗を読み込み中…</p>
          <TimelineSkeleton />
        </>
      )}

      {!loading && error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-2 block font-medium text-brand-600 underline"
          >
            再試行
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center">
          <p className="font-semibold text-zinc-600">まだ失敗がありません</p>
          <p className="text-empty-hint mt-2">
            タスクの締切を過ぎると、ここに自動で流れてきます。
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <ul className="flex flex-col gap-3">
          {filtered.map((failure) => (
            <li key={failure.id}>
              <FailureCard failure={failure} isNew={newIds.has(failure.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
