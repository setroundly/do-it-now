"use client";

import { useCallback, useState } from "react";
import { useFailOverdue } from "@/lib/useFailOverdue";
import { Timeline } from "./Timeline";
import { TaskForm } from "./TaskForm";
import { MyTasks } from "./MyTasks";
import { ConfessionRoom } from "./ConfessionRoom";
import { AppLogo } from "./AppLogo";

type Tab = "timeline" | "create" | "mine" | "confession";

export function HomeApp() {
  const [tab, setTab] = useState<Tab>("timeline");
  const [taskRefresh, setTaskRefresh] = useState(0);

  const bumpTaskRefresh = useCallback(() => {
    setTaskRefresh((k) => k + 1);
  }, []);
  useFailOverdue(bumpTaskRefresh);

  return (
    <div className="app-shell flex min-h-screen flex-col text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur-sm">
        <AppLogo />
      </header>

      <main className="relative z-10 mx-auto w-full max-w-md flex-1 px-4 py-5 pb-24">
        {tab === "timeline" && (
          <section>
            <h2 className="font-display mb-3 text-lg text-zinc-900">
              失敗タイムライン
            </h2>
            <Timeline />
          </section>
        )}
        {tab === "create" && (
          <section>
            <h2 className="font-display mb-1 text-lg text-zinc-900">
              覚悟を決める
            </h2>
            <p className="text-empty-hint mb-5">
              失敗したら、選んだ先へ強制送還。
            </p>
            <TaskForm
              onCreated={() => {
                setTaskRefresh((k) => k + 1);
                setTab("mine");
              }}
            />
          </section>
        )}
        {tab === "mine" && (
          <section>
            <h2 className="font-display mb-3 text-lg text-zinc-900">
              自分のタスク
            </h2>
            <MyTasks refreshKey={taskRefresh} />
          </section>
        )}
        {tab === "confession" && (
          <section>
            <h2 className="font-display mb-1 text-lg text-zinc-900">
              懺悔室
            </h2>
            <ConfessionRoom />
          </section>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-md">
          <TabButton
            active={tab === "timeline"}
            onClick={() => setTab("timeline")}
            label="タイムライン"
          />
          <TabButton
            active={tab === "create"}
            onClick={() => setTab("create")}
            label="作成"
          />
          <TabButton
            active={tab === "mine"}
            onClick={() => setTab("mine")}
            label="自分"
          />
          <TabButton
            active={tab === "confession"}
            onClick={() => setTab("confession")}
            label="懺悔室"
          />
        </div>
      </nav>
    </div>
  );
}

function TabButton({
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
      className={`flex-1 py-3 text-center text-xs font-semibold transition ${
        active
          ? "border-t-2 border-fail text-fail"
          : "border-t-2 border-transparent text-zinc-500"
      }`}
    >
      {label}
    </button>
  );
}
