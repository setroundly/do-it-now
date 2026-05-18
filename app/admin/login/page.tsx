"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppLogo } from "@/components/AppLogo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "admin", password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "ログインに失敗しました");
      }

      router.push("/admin");
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
          <AppLogo showTagline={false} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-fail-border bg-fail-card/90 p-5"
        >
          <h1 className="font-display mb-4 text-xl text-fail">管理画面ログイン</h1>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-400">管理者パスワード</span>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <p className="mt-3 text-sm text-fail">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-xl bg-fail py-3 font-bold text-white disabled:opacity-50"
          >
            {submitting ? "確認中…" : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}
