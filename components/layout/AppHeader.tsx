"use client";

import Link from "next/link";
import { AppLogo } from "@/components/AppLogo";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { UserAvatar } from "@/components/UserAvatar";
import { useAppAuth } from "@/lib/useAppAuth";

type NavView = "home" | "timeline";

export function AppHeader({
  activeView,
  onNavigate,
}: {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
}) {
  const { user, loading, signOut } = useAppAuth();
  const displayName = user?.display_name ?? "ゲスト";

  const navClass = (v: NavView) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      activeView === v
        ? "bg-white/20 text-white"
        : "text-white/85 hover:bg-white/10"
    }`;

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 lg:px-6">
        <Link href="/" className="shrink-0">
          <AppLogo variant="header" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <button type="button" onClick={() => onNavigate("home")} className={navClass("home")}>
            ホーム
          </button>
          <button type="button" onClick={() => onNavigate("timeline")} className={navClass("timeline")}>
            タイムライン
          </button>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden max-w-[200px] flex-1 sm:block lg:max-w-xs">
            <input
              type="search"
              placeholder="失敗を検索…"
              className="w-full rounded-full border-0 bg-white/15 px-4 py-1.5 text-sm text-white placeholder:text-white/60 focus:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label="失敗を検索"
            />
          </div>
          {!loading && user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3">
                <UserAvatar name={displayName} size="sm" />
                <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline">
                  {displayName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void signOut()}
                className="hidden rounded-lg px-2 py-1 text-xs text-white/80 hover:bg-white/10 sm:block"
              >
                ログアウト
              </button>
            </div>
          ) : !loading ? (
            <GoogleLoginButton className="!border-0 !bg-white !py-1.5 !text-xs !text-zinc-800" label="ログイン" />
          ) : null}
        </div>
      </div>
    </header>
  );
}
