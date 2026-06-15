"use client";

import { useCallback, useState } from "react";
import { useFailOverdue } from "@/lib/useFailOverdue";
import { useFailuresTimeline } from "@/lib/useFailuresTimeline";
import { Timeline } from "./Timeline";
import { TaskForm } from "./TaskForm";
import { MyTasks } from "./MyTasks";
import { ConfessionRoom } from "./ConfessionRoom";
import { AppHeader } from "./layout/AppHeader";
import { LeftSidebar, type SidebarView } from "./layout/LeftSidebar";
import { RightSidebar } from "./layout/RightSidebar";
import { computeTimelineStats } from "@/lib/timelineStats";

type View = SidebarView;

function viewToHeader(view: View): "home" | "timeline" | "ranking" {
  if (view === "ranking") return "ranking";
  if (view === "timeline" || view === "home") return view === "home" ? "home" : "timeline";
  return "home";
}

export function HomeApp() {
  const [view, setView] = useState<View>("home");
  const [taskRefresh, setTaskRefresh] = useState(0);
  const timeline = useFailuresTimeline();

  const bumpTaskRefresh = useCallback(() => {
    setTaskRefresh((k) => k + 1);
  }, []);
  useFailOverdue(bumpTaskRefresh);

  const showFeed = view === "home" || view === "timeline";
  const stats = computeTimelineStats(timeline.failures);

  return (
    <div className="app-shell flex min-h-screen flex-col text-zinc-900">
      <AppHeader
        activeView={viewToHeader(view)}
        onNavigate={(v) => {
          if (v === "ranking") setView("ranking");
          else if (v === "timeline") setView("timeline");
          else setView("home");
        }}
      />

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 px-4 lg:gap-6 lg:px-6">
        <LeftSidebar active={view} onNavigate={setView} />

        <main className="min-w-0 flex-1 py-4 pb-20 lg:max-w-[600px] lg:pb-6 xl:max-w-[640px]">
          {showFeed && (
            <Timeline
              timeline={timeline}
              onComposeClick={() => setView("create")}
            />
          )}

          {view === "create" && (
            <section>
              <h2 className="mb-1 text-lg font-bold text-zinc-900">覚悟を決める</h2>
              <p className="mb-5 text-sm text-zinc-500">
                失敗したら、選んだ先へ強制送還。
              </p>
              <TaskForm
                onCreated={() => {
                  setTaskRefresh((k) => k + 1);
                  setView("mine");
                }}
              />
            </section>
          )}

          {view === "mine" && (
            <section>
              <h2 className="mb-3 text-lg font-bold text-zinc-900">自分のタスク</h2>
              <MyTasks refreshKey={taskRefresh} />
            </section>
          )}

          {view === "confession" && (
            <section>
              <h2 className="mb-1 text-lg font-bold text-zinc-900">懺悔室</h2>
              <ConfessionRoom />
            </section>
          )}

          {view === "ranking" && (
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-zinc-900">ランキング</h2>
              <div className="card p-4">
                <h3 className="text-sm font-bold text-zinc-700">今週のDOOランキング</h3>
                <ol className="mt-3 space-y-2">
                  {stats.weeklyRanking.length === 0 ? (
                    <li className="text-sm text-zinc-500">データがありません</li>
                  ) : (
                    stats.weeklyRanking.map((r) => (
                      <li
                        key={r.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>
                          <span className="mr-2 font-bold text-brand-600">{r.rank}</span>
                          {r.name}
                        </span>
                        <span className="text-zinc-500">{r.count}件</span>
                      </li>
                    ))
                  )}
                </ol>
              </div>
            </section>
          )}
        </main>

        <RightSidebar failures={timeline.failures} />
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-zinc-200 bg-white lg:hidden">
        <div className="mx-auto flex max-w-lg">
          <MobileTab active={view === "home" || view === "timeline"} onClick={() => setView("home")} label="ホーム" />
          <MobileTab active={view === "create"} onClick={() => setView("create")} label="設定" />
          <MobileTab active={view === "mine"} onClick={() => setView("mine")} label="自分" />
          <MobileTab active={view === "confession"} onClick={() => setView("confession")} label="懺悔" />
        </div>
      </nav>
    </div>
  );
}

function MobileTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-3 text-center text-xs font-semibold ${
        active ? "text-brand-600" : "text-zinc-500"
      }`}
    >
      {label}
    </button>
  );
}
