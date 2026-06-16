"use client";

import { FailureCard } from "./FailureCard";
import type { TimelineFeed } from "./layout/LeftSidebar";
import type { useFailuresTimeline } from "@/lib/useFailuresTimeline";
import { useMemo, useState } from "react";

type FeedTab = "timeline" | "following" | "popular" | "latest";
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
  feed = "bad",
  onComposeClick,
}: {
  timeline: TimelineState;
  feed?: TimelineFeed;
  onComposeClick?: () => void;
}) {
  const { failures, loading, error, newIds, refresh } = timeline;
  const [tab, setTab] = useState<FeedTab>("timeline");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (feed === "good") {
      return [];
    }

    let list = [...failures];
    if (tab === "popular") {
      list.sort((a, b) => b.donation_amount - a.donation_amount);
    } else {
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
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
  }, [failures, tab, query, feed]);

  const tabs: { id: FeedTab; label: string }[] = [
    { id: "timeline", label: "タイムライン" },
    { id: "following", label: "フォロー中" },
    { id: "popular", label: "人気" },
    { id: "latest", label: "最新" },
  ];

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onComposeClick}
        className="card mb-4 w-full px-4 py-3 text-left text-zinc-400 transition hover:border-brand-200 hover:text-zinc-500"
      >
        今日は何を DOO（失敗）しましたか？
      </button>

      <div className="mb-3 flex gap-1 overflow-x-auto border-b border-zinc-200 pb-0 [scrollbar-width:none]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "following" && (
        <p className="mb-3 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
          フォロー機能は準備中です。いまは全員の失敗を表示しています。
        </p>
      )}

      <div className="mb-4 lg:hidden">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="失敗を検索…"
          className="input py-2 text-sm"
        />
      </div>

      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Live
        </span>
        <span className="text-[10px] text-zinc-400">{filtered.length}件</span>
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
          {feed === "good" ? (
            <>
              <p className="font-semibold text-emerald-600">まだ good 投稿がありません</p>
              <p className="text-empty-hint mt-2">
                締切前に逃げ切った成功は、いずれここに流れる予定です。
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-zinc-600">まだ失敗がありません</p>
              <p className="text-empty-hint mt-2">
                タスクの締切を過ぎると、ここに自動で流れてきます。
              </p>
            </>
          )}
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

      {!loading && filtered.length > 0 && (
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-4 w-full rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
        >
          さらに読み込む
        </button>
      )}
    </div>
  );
}
