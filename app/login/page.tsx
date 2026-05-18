"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLogo } from "@/components/AppLogo";
import {
  USER_NAME_STORAGE_KEY,
  USER_STORAGE_KEY,
} from "@/lib/constants";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/app";

  const [displayName, setDisplayName] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(USER_NAME_STORAGE_KEY) ?? "";
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const userId = localStorage.getItem(USER_STORAGE_KEY) ?? undefined;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "user",
          displayName: displayName.trim(),
          userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "ログインに失敗しました");
      }

      localStorage.setItem(USER_STORAGE_KEY, data.userId);
      localStorage.setItem(USER_NAME_STORAGE_KEY, data.displayName);
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラー");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell flex min-h-dvh flex-col px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← トップへ
        </Link>
        <div className="mt-6 mb-8">
          <AppLogo showTagline />
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-fail-border bg-fail-card/90 p-5"
        >
          <h1 className="font-display mb-1 text-xl text-fail">ログイン</h1>
          <p className="mb-4 text-sm text-zinc-500">
            タスク作成・自分のタスク・懺悔室に入るには名前が必要です
          </p>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-400">あなたの名前</span>
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="名前"
              required
              maxLength={32}
            />
          </label>

          {error && <p className="mt-3 text-sm text-fail">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-xl bg-fail py-3 font-bold text-white disabled:opacity-50"
          >
            {submitting ? "ログイン中…" : "入る"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-600">
          <Link href="/admin/login" className="underline hover:text-zinc-400">
            管理者ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <p className="p-8 text-center text-zinc-500">読み込み中…</p>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
