"use client";

import { useCallback, useEffect, useState } from "react";
import { useFailOverdue } from "@/lib/useFailOverdue";
import { useFailuresTimeline } from "@/lib/useFailuresTimeline";
import { fetchJson } from "@/lib/fetchJson";
import { Timeline } from "./Timeline";
import { TaskForm } from "./TaskForm";
import { MyTasks } from "./MyTasks";
import { ConfessionRoom } from "./ConfessionRoom";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { AppHeader } from "./layout/AppHeader";
import { LeftSidebar, type SidebarView } from "./layout/LeftSidebar";
import { RightSidebar } from "./layout/RightSidebar";
import { useAppAuth } from "@/lib/useAppAuth";

type View = SidebarView;

export function HomeApp() {
  const [view, setView] = useState<View>("timeline");
  const [taskRefresh, setTaskRefresh] = useState(0);
  const [hasTasks, setHasTasks] = useState<boolean | null>(null);
  const timeline = useFailuresTimeline();
  const { user, loading: authLoading } = useAppAuth();

  const bumpTaskRefresh = useCallback(() => {
    setTaskRefresh((k) => k + 1);
  }, []);
  useFailOverdue(bumpTaskRefresh);

  useEffect(() => {
    if (authLoading || !user) {
      setHasTasks(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const { res, data } = await fetchJson<{ tasks?: unknown[] }>("/api/tasks");
        if (cancelled) return;
        if (!res.ok) {
          setHasTasks(null);
          return;
        }
        setHasTasks((data.tasks?.length ?? 0) > 0);
      } catch {
        if (!cancelled) setHasTasks(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, taskRefresh]);

  return (
    <div className="app-shell flex min-h-screen flex-col text-zinc-900">
      <AppHeader />

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 px-4 lg:gap-6 lg:px-6">
        <LeftSidebar active={view} onNavigate={setView} />

        <main className="min-w-0 flex-1 py-4 pb-20 lg:max-w-[600px] lg:pb-6 xl:max-w-[640px]">
          {view === "timeline" && (
            <Timeline
              timeline={timeline}
              showOnboarding={Boolean(user && hasTasks === false)}
              onCreateClick={() => setView("create")}
            />
          )}

          {view === "create" && (
            <section>
              <h2 className="mb-1 text-lg font-bold text-zinc-900">覚悟を決める</h2>
              <p className="mb-5 text-sm text-zinc-500">
                失敗したら、選んだ先へ強制送還。
              </p>
              {!authLoading && !user ? (
                <div className="card flex flex-col items-center gap-4 p-8 text-center">
                  <p className="text-sm text-zinc-600">
                    タスクを設定するには Google でログインしてください。
                  </p>
                  <GoogleLoginButton />
                </div>
              ) : (
                <TaskForm
                  onCreated={() => {
                    setTaskRefresh((k) => k + 1);
                    setView("mine");
                  }}
                />
              )}
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
        </main>

        <RightSidebar failures={timeline.failures} />
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-zinc-200 bg-white lg:hidden">
        <div className="mx-auto flex max-w-lg">
          <MobileTab active={view === "timeline"} onClick={() => setView("timeline")} label="タイムライン" />
          <MobileTab active={view === "create"} onClick={() => setView("create")} label="失敗する" />
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
