"use client";

import { useState } from "react";
import { formatJstRelative } from "@/lib/datetime";
import { failureDonationLine } from "@/lib/failures";
import type { Failure } from "@/lib/types";
import { UserAvatar, userHandle } from "./UserAvatar";

type Reaction = "good" | "bad" | null;

interface FailureCardProps {
  failure: Failure;
  isNew?: boolean;
}

export function FailureCard({ failure, isNew }: FailureCardProps) {
  const name = failure.user_name.trim() || "匿名";
  const [reaction, setReaction] = useState<Reaction>(null);

  const toggle = (next: Reaction) => {
    setReaction((current) => (current === next ? null : next));
  };

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

          <div className="mt-3 flex items-center gap-2">
            <ReactionButton
              emoji="👍"
              label="good"
              active={reaction === "good"}
              onClick={() => toggle("good")}
            />
            <ReactionButton
              emoji="👎"
              label="bad"
              active={reaction === "bad"}
              onClick={() => toggle("bad")}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function ReactionButton({
  emoji,
  label,
  active,
  onClick,
}: {
  emoji: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`rounded-lg px-2 py-1 text-xl transition ${
        active
          ? "bg-brand-50 ring-2 ring-brand-300"
          : "hover:bg-zinc-100"
      }`}
    >
      {emoji}
    </button>
  );
}
