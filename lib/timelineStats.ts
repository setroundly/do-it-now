import type { Failure } from "@/lib/types";

function isTodayJst(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  const fmt = (x: Date) =>
    x.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" });
  return fmt(d) === fmt(now);
}

function isThisWeekJst(iso: string): boolean {
  const d = new Date(iso).getTime();
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return d >= weekAgo;
}

export function computeTimelineStats(failures: Failure[]) {
  const today = failures.filter((f) => isTodayJst(f.created_at));
  const week = failures.filter((f) => isThisWeekJst(f.created_at));

  const orgs = new Set(
    failures.map((f) => f.donation_destination).filter(Boolean)
  );

  const titleCounts = new Map<string, number>();
  for (const f of failures) {
    titleCounts.set(f.title, (titleCounts.get(f.title) ?? 0) + 1);
  }
  const popularCategories = [...titleCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count], i) => ({ rank: i + 1, name, count }));

  const userCounts = new Map<string, number>();
  for (const f of week) {
    const name = f.user_name.trim() || "匿名";
    userCounts.set(name, (userCounts.get(name) ?? 0) + 1);
  }
  const weeklyRanking = [...userCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count], i) => ({ rank: i + 1, name, count }));

  return {
    todayCount: today.length,
    todayDonation: today.reduce((s, f) => s + f.donation_amount, 0),
    orgCount: orgs.size,
    popularCategories,
    weeklyRanking,
  };
}
