"use client";

import { UserAvatar, userHandle } from "@/components/UserAvatar";
import { useAppAuth } from "@/lib/useAppAuth";

export type SidebarView =
  | "home"
  | "create"
  | "timeline"
  | "mine"
  | "confession";

export type TimelineFeed = "good" | "bad";

interface LeftSidebarProps {
  active: SidebarView;
  timelineFeed: TimelineFeed;
  onNavigate: (view: SidebarView) => void;
  onTimelineFeedChange: (feed: TimelineFeed) => void;
}

export function LeftSidebar({
  active,
  timelineFeed,
  onNavigate,
  onTimelineFeedChange,
}: LeftSidebarProps) {
  const { user, loading, signOut } = useAppAuth();
  const displayName = user?.display_name ?? "ゲスト";

  const linkClass = (v: SidebarView) =>
    `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
      active === v
        ? "bg-brand-50 text-brand-700"
        : "text-zinc-600 hover:bg-zinc-100"
    }`;

  const showTimeline = active === "home" || active === "timeline";

  const selectFeed = (feed: TimelineFeed) => {
    onTimelineFeedChange(feed);
    onNavigate("home");
  };

  return (
    <aside className="hidden w-[240px] shrink-0 lg:block">
      <div className="sticky top-[4.5rem] space-y-4 py-4 pr-2">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <UserAvatar name={displayName} size="lg" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-zinc-900">{displayName}</p>
              <p className="truncate text-xs text-zinc-500">{userHandle(displayName)}</p>
            </div>
          </div>
          {!loading && user && (
            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-3 text-xs text-zinc-500 underline hover:text-zinc-700"
            >
              ログアウト
            </button>
          )}
          <p className="mt-3 text-xs leading-relaxed text-zinc-500">
            締切と向き合う日々。失敗は隠さず、覚悟に変える。
          </p>
        </div>

        <nav className="space-y-0.5">
          <button type="button" onClick={() => onNavigate("home")} className={linkClass("home")}>
            <NavIcon name="home" /> ホーム
          </button>

          <button type="button" onClick={() => onNavigate("create")} className={linkClass("create")}>
            <NavIcon name="pencil" />
            <span className="min-w-0">
              <span className="block leading-tight">失敗する</span>
              <span
                className={`mt-0.5 block text-[10px] font-normal leading-tight ${
                  active === "create" ? "text-brand-500" : "text-zinc-400"
                }`}
              >
                （目標を設定する）
              </span>
            </span>
          </button>

          <div>
            <button
              type="button"
              onClick={() => onNavigate("home")}
              className={linkClass(showTimeline ? "home" : "timeline")}
            >
              <NavIcon name="timeline" /> タイムライン
            </button>
            <div className="ml-10 mt-1 flex gap-1.5 pr-2">
              <FeedPill
                label="good"
                active={showTimeline && timelineFeed === "good"}
                tone="good"
                onClick={() => selectFeed("good")}
              />
              <FeedPill
                label="bad"
                active={showTimeline && timelineFeed === "bad"}
                tone="bad"
                onClick={() => selectFeed("bad")}
              />
            </div>
          </div>

          <button type="button" onClick={() => onNavigate("mine")} className={linkClass("mine")}>
            <NavIcon name="task" /> 自分のタスク
          </button>
          <button
            type="button"
            onClick={() => onNavigate("confession")}
            className={linkClass("confession")}
          >
            <NavIcon name="heart" /> 懺悔室
          </button>
        </nav>

        <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-3">
          <p className="text-xs font-semibold text-brand-800">DOO IT NOWとは？</p>
          <p className="mt-1 text-[11px] leading-relaxed text-brand-700/80">
            締切に負けた失敗を公開し、選んだ先へ寄付するタスク管理です。
          </p>
        </div>
      </div>
    </aside>
  );
}

function FeedPill({
  label,
  active,
  tone,
  onClick,
}: {
  label: string;
  active: boolean;
  tone: "good" | "bad";
  onClick: () => void;
}) {
  const base =
    tone === "good"
      ? active
        ? "bg-emerald-600 text-white"
        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      : active
        ? "bg-fail text-white"
        : "bg-red-50 text-fail hover:bg-red-100";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg px-2 py-1 text-xs font-bold uppercase tracking-wide transition ${base}`}
    >
      {label}
    </button>
  );
}

function NavIcon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const c = `h-4 w-4 shrink-0 ${className || "text-current"}`;
  switch (name) {
    case "home":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case "pencil":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      );
    default:
      return <span className={`inline-block h-4 w-4 rounded bg-current opacity-30 ${className}`} />;
  }
}
