"use client";

import { formatJstRelative } from "@/lib/datetime";
import { failureDonationLine } from "@/lib/failures";
import type { Failure } from "@/lib/types";
import { UserAvatar, userHandle } from "./UserAvatar";

interface FailureCardProps {
  failure: Failure;
  isNew?: boolean;
}

export function FailureCard({ failure, isNew }: FailureCardProps) {
  const name = failure.user_name.trim() || "匿名";

  return (
    <article
      className={`card relative overflow-hidden p-4 transition ${
        isNew ? "failure-enter ring-2 ring-brand-200" : ""
      }`}
    >
      <div className="fail-stamp" aria-hidden>
        FAIL
      </div>

      <div className="relative flex gap-3">
        <UserAvatar name={name} />
        <div className="min-w-0 flex-1 pr-16">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-semibold text-zinc-900">{name}</span>
            <span className="text-sm text-zinc-400">{userHandle(name)}</span>
            <span className="text-sm text-zinc-400">·</span>
            <time
              dateTime={failure.created_at}
              className="text-sm text-zinc-400 tabular-nums"
            >
              {formatJstRelative(failure.created_at)}
            </time>
          </div>

          <h3 className="mt-2 text-base font-bold text-zinc-900">{failure.title}</h3>

          <p className="mt-1 text-sm leading-relaxed text-zinc-600">
            {failure.description}
          </p>

          <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-fail">
            <span aria-hidden>❤️</span>
            {failureDonationLine(failure)}予定
          </p>

          {(failure.consecutive_fail_count ?? 0) > 1 && (
            <span className="mt-2 inline-block rounded-full bg-fail-soft px-2 py-0.5 text-[10px] font-bold text-fail">
              連続{failure.consecutive_fail_count}敗
            </span>
          )}

          <div className="mt-3 flex max-w-xs items-center justify-between text-zinc-400">
            <ActionIcon label="コメント" />
            <ActionIcon label="リポスト" />
            <ActionIcon label="いいね" />
            <ActionIcon label="共有" />
          </div>
        </div>
      </div>
    </article>
  );
}

function ActionIcon({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="rounded-lg p-1.5 transition hover:bg-zinc-100 hover:text-brand-600"
      aria-label={label}
    >
      <span className="block h-4 w-4 rounded border border-current opacity-60" />
    </button>
  );
}
