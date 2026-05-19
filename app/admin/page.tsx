"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppLogo } from "@/components/AppLogo";
import { formatJstDateTimeLong } from "@/lib/datetime";
import { failureDonationLine, failureHeadline } from "@/lib/failures";
import { apiErrorMessage, fetchJson } from "@/lib/fetchJson";
import { useAdminSession } from "@/lib/useAdminSession";
import type { Failure } from "@/lib/types";

export default function AdminPage() {
  const { isAdmin, loading, login, logout } = useAdminSession();
  const [secret, setSecret] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  const [failures, setFailures] = useState<Failure[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchFailures = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const { res, data } = await fetchJson<{
        error?: string;
        failures?: Failure[];
      }>("/api/failures");
      if (!res.ok) {
        throw new Error(apiErrorMessage(data, "一覧の取得に失敗しました"));
      }
      setFailures(data.failures ?? []);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "エラー");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) void fetchFailures();
  }, [isAdmin, fetchFailures]);

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

  const handleDelete = async (failure: Failure) => {
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

  if (loading) {
    return (
      <p className="app-shell p-8 text-center text-zinc-500">読み込み中…</p>
    );
  }

  return (
    <div className="app-shell min-h-screen text-zinc-100">
      <header className="border-b border-fail-border bg-fail-bg px-4 py-3">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2">
          <Link href="/">
            <AppLogo size="sm" showTagline={false} />
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
            className="rounded-2xl border border-fail-border bg-fail-card p-5"
          >
            <h1 className="font-display mb-1 text-xl text-fail">管理画面</h1>
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
            <h1 className="font-display mb-1 text-xl text-fail">
              タイムライン管理
            </h1>
            <p className="mb-4 text-sm text-zinc-500">
              投稿の削除はここからのみ可能です（一般ユーザーには表示されません）
            </p>

            {listLoading && (
              <p className="text-empty-hint py-8">読み込み中…</p>
            )}

            {listError && (
              <div className="mb-4 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
                {listError}
                <button
                  type="button"
                  onClick={() => void fetchFailures()}
                  className="mt-2 block text-fail underline"
                >
                  再試行
                </button>
              </div>
            )}

            {!listLoading && !listError && failures.length === 0 && (
              <p className="text-empty-hint py-12">投稿がありません</p>
            )}

            <ul className="flex flex-col gap-3">
              {failures.map((failure) => (
                <li
                  key={failure.id}
                  className="rounded-2xl border border-fail-border bg-fail-card p-4"
                >
                  <p className="font-display text-sm text-fail">
                    {failureHeadline(failure)}
                  </p>
                  <p className="mt-1 font-semibold text-zinc-200">
                    『{failure.title}』
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
                    {failure.description}
                  </p>
                  <p className="mt-2 text-xs text-fail">
                    {failureDonationLine(failure)}
                  </p>
                  <time className="mt-2 block text-[10px] text-zinc-600">
                    {formatJstDateTimeLong(failure.created_at)} JST
                  </time>
                  <button
                    type="button"
                    disabled={deletingId === failure.id}
                    onClick={() => void handleDelete(failure)}
                    className="mt-3 w-full rounded-xl border border-red-900/60 bg-red-950/40 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-950/70 disabled:opacity-50"
                  >
                    {deletingId === failure.id ? "削除中…" : "この投稿を削除"}
                  </button>
                </li>
              ))}
            </ul>

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
