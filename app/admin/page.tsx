"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminEmailDiagnostics } from "@/components/AdminEmailDiagnostics";
import { AppLogo } from "@/components/AppLogo";
import { formatJstDateTimeLong, formatJstTime } from "@/lib/datetime";
import { flattenConfessionThreads } from "@/lib/confession";
import { failureDonationLine, failureHeadline } from "@/lib/failures";
import { apiErrorMessage, fetchJson } from "@/lib/fetchJson";
import { useAdminSession } from "@/lib/useAdminSession";
import type { ConfessionPost, Failure } from "@/lib/types";

type AdminTab = "failures" | "confession";

export default function AdminPage() {
  const { isAdmin, loading, login, logout } = useAdminSession();
  const [tab, setTab] = useState<AdminTab>("failures");
  const [secret, setSecret] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  const [failures, setFailures] = useState<Failure[]>([]);
  const [threads, setThreads] = useState<ConfessionPost[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchFailures = useCallback(async () => {
    const { res, data } = await fetchJson<{
      error?: string;
      failures?: Failure[];
    }>("/api/failures");
    if (!res.ok) {
      throw new Error(apiErrorMessage(data, "一覧の取得に失敗しました"));
    }
    setFailures(data.failures ?? []);
  }, []);

  const fetchConfession = useCallback(async () => {
    const { res, data } = await fetchJson<{
      error?: string;
      threads?: ConfessionPost[];
    }>("/api/confession");
    if (!res.ok) {
      throw new Error(apiErrorMessage(data, "懺悔室の取得に失敗しました"));
    }
    setThreads(data.threads ?? []);
  }, []);

  const fetchList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      if (tab === "failures") {
        await fetchFailures();
      } else {
        await fetchConfession();
      }
    } catch (e) {
      setListError(e instanceof Error ? e.message : "エラー");
    } finally {
      setListLoading(false);
    }
  }, [tab, fetchFailures, fetchConfession]);

  useEffect(() => {
    if (isAdmin) void fetchList();
  }, [isAdmin, fetchList]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSubmitting(true);
    try {
      await login(secret);
      setSecret("");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "エラー");
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleDeleteFailure = async (failure: Failure) => {
    const message = [
      `「${failure.title}」を削除しますか？`,
      "",
      failureHeadline(failure),
      failureDonationLine(failure),
      "",
      "この操作は取り消せません。",
    ].join("\n");

    if (!window.confirm(message)) return;

    setDeletingId(failure.id);
    try {
      const res = await fetch(`/api/failures/${failure.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "削除に失敗しました");
      }
      setFailures((prev) => prev.filter((f) => f.id !== failure.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteConfession = async (post: ConfessionPost, isReply: boolean) => {
    const kind = isReply ? "返信" : "懺悔";
    const message = [
      `${kind}を削除しますか？`,
      "",
      `${post.display_name}: ${post.body.slice(0, 120)}${post.body.length > 120 ? "…" : ""}`,
      "",
      isReply
        ? ""
        : "※ スレッド本体を削除すると、返信もまとめて消えます。",
      "この操作は取り消せません。",
    ]
      .filter(Boolean)
      .join("\n");

    if (!window.confirm(message)) return;

    setDeletingId(post.id);
    try {
      const res = await fetch(`/api/confession/${post.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "削除に失敗しました");
      }
      setThreads((prev) =>
        prev
          .filter((t) => t.id !== post.id)
          .map((t) => ({
            ...t,
            replies: t.replies?.filter((r) => r.id !== post.id),
          }))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  };

  const confessionItems = flattenConfessionThreads(threads);

  if (loading) {
    return (
      <p className="app-shell p-8 text-center text-zinc-500">読み込み中…</p>
    );
  }

  return (
    <div className="app-shell min-h-screen text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2">
          <Link href="/">
            <AppLogo showTagline={false} />
          </Link>
          {isAdmin && (
            <button
              type="button"
              onClick={() => logout()}
              className="text-xs text-zinc-500 underline"
            >
              ログアウト
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        {!isAdmin ? (
          <form
            onSubmit={handleLogin}
            className="card p-5"
          >
            <h1 className="font-display mb-1 text-lg text-zinc-900">管理画面</h1>
            <p className="mb-4 text-sm text-zinc-500">
              ADMIN_SECRET を入力してください
            </p>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-400">
                管理者シークレット
              </span>
              <input
                type="password"
                className="input"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                required
                autoComplete="off"
              />
            </label>
            {loginError && (
              <p className="mt-3 text-sm text-fail">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={loginSubmitting}
              className="mt-4 w-full rounded-xl bg-fail py-3 font-bold text-white disabled:opacity-50"
            >
              {loginSubmitting ? "確認中…" : "入る"}
            </button>
            <p className="mt-6 text-center">
              <Link href="/" className="text-sm text-zinc-500 underline">
                トップへ戻る
              </Link>
            </p>
          </form>
        ) : (
          <>
            <h1 className="font-display mb-1 text-lg text-zinc-900">管理画面</h1>
            <p className="mb-4 text-sm text-zinc-500">
              投稿の削除はここからのみ可能です（一般ユーザーには表示されません）
            </p>

            <AdminEmailDiagnostics />

            <div className="mb-4 flex rounded-lg border border-zinc-200 bg-zinc-50 p-1">
              <TabButton
                active={tab === "failures"}
                onClick={() => setTab("failures")}
                label="タイムライン"
              />
              <TabButton
                active={tab === "confession"}
                onClick={() => setTab("confession")}
                label="懺悔室"
              />
            </div>

            {listLoading && (
              <p className="text-empty-hint py-8">読み込み中…</p>
            )}

            {listError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {listError}
                <button
                  type="button"
                  onClick={() => void fetchList()}
                  className="mt-2 block text-fail underline"
                >
                  再試行
                </button>
              </div>
            )}

            {!listLoading && !listError && tab === "failures" && failures.length === 0 && (
              <p className="text-empty-hint py-12">投稿がありません</p>
            )}

            {!listLoading && !listError && tab === "confession" && confessionItems.length === 0 && (
              <p className="text-empty-hint py-12">投稿がありません</p>
            )}

            {!listLoading && !listError && tab === "failures" && (
              <ul className="flex flex-col gap-3">
                {failures.map((failure) => (
                  <li
                    key={failure.id}
                    className="card p-4"
                  >
                    <p className="font-display text-sm text-fail">
                      {failureHeadline(failure)}
                    </p>
                    <p className="mt-1 font-medium text-zinc-800">
                      『{failure.title}』
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-600">
                      {failure.description}
                    </p>
                    <p className="mt-2 text-xs text-fail">
                      {failureDonationLine(failure)}
                    </p>
                    <time className="mt-2 block text-[10px] text-zinc-600">
                      {formatJstDateTimeLong(failure.created_at)} JST
                    </time>
                    <DeleteButton
                      loading={deletingId === failure.id}
                      onClick={() => void handleDeleteFailure(failure)}
                    />
                  </li>
                ))}
              </ul>
            )}

            {!listLoading && !listError && tab === "confession" && (
              <ul className="flex flex-col gap-3">
                {confessionItems.map(({ post, isReply }) => (
                  <li
                    key={post.id}
                    className={`card p-4 ${
                      isReply ? "ml-3 border-zinc-100" : ""
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        {isReply ? "返信" : "懺悔"}
                      </span>
                      <time className="text-[10px] tabular-nums text-zinc-600">
                        {isReply
                          ? formatJstTime(post.created_at)
                          : formatJstDateTimeLong(post.created_at)}
                      </time>
                    </div>
                    <p className="font-display text-sm text-fail">
                      {post.display_name}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                      {post.body}
                    </p>
                    {!isReply && (post.replies?.length ?? 0) > 0 && (
                      <p className="mt-2 text-[10px] text-zinc-600">
                        返信 {post.replies!.length} 件
                      </p>
                    )}
                    <DeleteButton
                      loading={deletingId === post.id}
                      onClick={() => void handleDeleteConfession(post, isReply)}
                    />
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-8 text-center">
              <Link href="/" className="text-sm text-zinc-500 underline">
                トップへ戻る
              </Link>
            </p>
          </>
        )}
      </main>
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
      className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
        active
          ? "bg-fail text-white"
          : "text-zinc-500 hover:text-zinc-700"
      }`}
    >
      {label}
    </button>
  );
}

function DeleteButton({
  loading,
  onClick,
}: {
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="mt-3 w-full rounded-lg border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
    >
      {loading ? "削除中…" : "この投稿を削除"}
    </button>
  );
}
