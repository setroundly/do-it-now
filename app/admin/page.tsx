"use client";

import Link from "next/link";
import { useSession } from "@/lib/useSession";

export default function AdminPage() {
  const { user, logout } = useSession();

  return (
    <div className="app-shell min-h-dvh px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-xl text-fail">管理画面</h1>
          <button
            type="button"
            onClick={() => logout()}
            className="text-sm text-zinc-500 underline"
          >
            ログアウト
          </button>
        </div>

        <p className="mb-6 text-sm text-zinc-400">
          ログイン中: {user?.displayName ?? "管理者"}
        </p>

        <section className="rounded-2xl border border-fail-border bg-fail-card p-4">
          <h2 className="mb-2 text-sm font-semibold text-zinc-300">締切チェック（手動）</h2>
          <p className="mb-3 text-xs text-zinc-500">
            Vercel Hobby は Cron が1日1回のため、必要なら手動実行してください。
          </p>
          <code className="block overflow-x-auto rounded-lg bg-zinc-950 p-3 text-[11px] text-zinc-400">
            curl -H &quot;Authorization: Bearer CRON_SECRET&quot;{" "}
            {process.env.NEXT_PUBLIC_APP_URL ?? "https://your-app.vercel.app"}
            /api/cron/check-failures
          </code>
        </section>

        <p className="mt-8 text-center">
          <Link href="/" className="text-sm text-fail underline">
            公開トップへ
          </Link>
        </p>
      </div>
    </div>
  );
}
