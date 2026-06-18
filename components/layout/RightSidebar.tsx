"use client";

import { UserAvatar } from "@/components/UserAvatar";
import { computeTimelineStats } from "@/lib/timelineStats";
import type { Failure } from "@/lib/types";

export function RightSidebar({ failures }: { failures: Failure[] }) {
  const stats = computeTimelineStats(failures);

  return (
    <aside className="hidden w-[280px] shrink-0 xl:block">
      <div className="sticky top-[4.5rem] space-y-4 py-4 pl-2">
        <Widget title="今日のDOO状況">
          <StatRow label="今日の失敗投稿数" value={`${stats.todayCount}件`} />
          <StatRow
            label="今日の寄付予定総額"
            value={`¥${stats.todayDonation.toLocaleString()}`}
            highlight
          />
        </Widget>

        <footer className="px-1 pt-2 text-[10px] text-zinc-400">
          <p>© DOO IT NOW</p>
        </footer>
      </div>
    </aside>
  );
}

function Widget({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-zinc-100 bg-zinc-50/80 px-4 py-2.5">
        <h3 className="text-xs font-bold text-zinc-700">{title}</h3>
      </div>
      <div className="space-y-2 p-4">{children}</div>
    </div>
  );
}

function StatRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className={`font-semibold tabular-nums ${highlight ? "text-fail" : "text-zinc-800"}`}>
        {value}
      </span>
    </div>
  );
}
