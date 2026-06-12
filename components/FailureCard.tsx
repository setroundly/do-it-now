"use client";



import { formatJstDateTimeLong, formatJstRelative } from "@/lib/datetime";

import { failureDonationLine, failureHeadline } from "@/lib/failures";

import type { Failure } from "@/lib/types";



interface FailureCardProps {

  failure: Failure;

  isNew?: boolean;

}



export function FailureCard({ failure, isNew }: FailureCardProps) {

  return (

    <article

      className={`card p-4 transition-colors ${

        isNew ? "failure-enter border-fail/40 ring-1 ring-fail/10" : ""

      }`}

    >

      <div className="mb-2 flex items-start justify-between gap-2">

        <div className="min-w-0 flex-1">

          <p className="font-display text-base text-fail">

            {failureHeadline(failure)}

          </p>

          <p className="mt-1 text-sm font-medium text-zinc-800">

            『{failure.title}』

          </p>

        </div>

        {(failure.consecutive_fail_count ?? 0) > 1 && (

          <span className="shrink-0 rounded-full bg-fail-soft px-2.5 py-1 text-xs font-semibold text-fail">

            連続{failure.consecutive_fail_count}敗

          </span>

        )}

      </div>



      <p className="mb-2 text-sm leading-relaxed text-zinc-600">

        {failure.description}

      </p>



      <p className="mb-3 inline-flex items-center gap-1 rounded-full bg-fail-soft px-3 py-1 text-xs font-semibold text-fail">

        💸 {failureDonationLine(failure)}

      </p>



      <p className="text-xs text-zinc-500">

        <time

          dateTime={failure.created_at}

          className="tabular-nums"

          title={formatJstDateTimeLong(failure.created_at)}

        >

          {formatJstRelative(failure.created_at)}

        </time>

        <span className="mx-1 text-zinc-300">·</span>

        <span className="text-zinc-400">

          {formatJstDateTimeLong(failure.created_at)} JST

        </span>

      </p>

    </article>

  );

}


