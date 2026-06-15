"use client";

import { useCallback, useEffect, useState } from "react";
import { formatJstDateTime } from "@/lib/datetime";
import { apiErrorMessage, fetchJson, parseJsonResponse } from "@/lib/fetchJson";
import { resolveTaskDonateUrl } from "@/lib/resolveDonateUrl";
import { useAppAuth } from "@/lib/useAppAuth";
import type { Task } from "@/lib/types";
import { GoogleLoginButton } from "./GoogleLoginButton";

export function MyTasks({ refreshKey }: { refreshKey?: number }) {
  const { user, loading: authLoading } = useAppAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { res, data } = await fetchJson<{ tasks?: Task[] }>("/api/tasks");
      if (!res.ok) throw new Error(apiErrorMessage(data, "読み込みに失敗しました"));
      setTasks(data.tasks ?? []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void fetchTasks();
  }, [fetchTasks, refreshKey, authLoading]);

  const deleteTask = async (task: Task) => {
    const timelineNote =
      task.status === "failed"
        ? "\n\n※ タイムラインに載っている失敗投稿も一緒に消えます。"
        : "";

    const message = [
      `「${task.title}」を削除しますか？`,
      timelineNote,
      "",
      "この操作は取り消せません。",
    ]
      .filter((line, i, arr) => line !== "" || (i > 0 && arr[i - 1] !== ""))
      .join("\n");

    if (!window.confirm(message)) return;

    setDeletingId(task.id);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });
      const data = await parseJsonResponse<{ error?: string }>(res);
      if (!res.ok) {
        throw new Error(apiErrorMessage(data, "削除に失敗しました"));
      }
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  };

  const completeTask = async (taskId: string) => {
    const res = await fetch(`/api/tasks/${taskId}/complete`, {
      method: "POST",
    });
    if (res.ok) {
      fetchTasks();
      return;
    }
    const data = await parseJsonResponse<{ error?: string }>(res);
    alert(apiErrorMessage(data, "完了できませんでした"));
  };

  if (authLoading || loading) {
    return <p className="text-empty-hint py-8">読み込み中…</p>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-empty-hint">
          タスクの作成・管理にはログインが必要です。
        </p>
        <GoogleLoginButton />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <p className="text-empty-hint py-12">タスクがありません。</p>
    );
  }

  const statusLabel: Record<Task["status"], string> = {
    pending: "進行中",
    completed: "完了",
    failed: "失敗",
  };

  const statusColor: Record<Task["status"], string> = {
    pending: "text-amber-600",
    completed: "text-emerald-600",
    failed: "text-fail",
  };

  const failedTasks = tasks.filter((t) => t.status === "failed");
  const otherTasks = tasks.filter((t) => t.status !== "failed");

  const renderTask = (task: Task) => {
    const donateUrl =
      task.status === "failed" ? resolveTaskDonateUrl(task) : null;

    return (
        <div className="card p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display min-w-0 flex-1 text-base font-normal leading-snug text-zinc-900">
              {task.title}
            </h3>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span className={`text-xs font-bold ${statusColor[task.status]}`}>
                {statusLabel[task.status]}
              </span>
              <button
                type="button"
                onClick={() => void deleteTask(task)}
                disabled={deletingId === task.id}
                className="text-[11px] text-zinc-500 underline decoration-zinc-600 underline-offset-2 hover:text-fail disabled:opacity-50"
              >
                {deletingId === task.id ? "削除中…" : "削除"}
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            <span className="tabular-nums">
              締切 {formatJstDateTime(task.deadline_at)} JST
            </span>
            {" · "}
            {task.penalty_amount.toLocaleString()}円 → {task.donation_destination}
          </p>
          {task.status === "failed" && donateUrl && (
            <a
              href={donateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-fail/30 bg-fail-soft py-2.5 text-sm font-semibold text-fail transition hover:bg-red-100"
            >
              {task.donation_destination}へ寄付する
              <span aria-hidden>↗</span>
            </a>
          )}
          {task.status === "failed" && !donateUrl && (
            <p className="mt-2 text-xs text-zinc-500">
              寄付ページのURLが未設定です（作成時に「その他」でURLを指定してください）
            </p>
          )}
          {task.status === "pending" && (
            <button
              type="button"
              onClick={() => completeTask(task.id)}
              className="mt-3 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              完了した（逃げ切る）
            </button>
          )}
        </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {failedTasks.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-fail">
            失敗したタスク
          </h3>
          <ul className="flex flex-col gap-3">
            {failedTasks.map((task) => (
              <li key={task.id}>{renderTask(task)}</li>
            ))}
          </ul>
        </section>
      )}
      {otherTasks.length > 0 && (
        <section>
          {failedTasks.length > 0 && (
            <h3 className="mb-2 text-sm font-semibold text-zinc-500">
              その他のタスク
            </h3>
          )}
          <ul className="flex flex-col gap-3">
            {otherTasks.map((task) => (
              <li key={task.id}>{renderTask(task)}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
