import type { ConfessionPost } from "@/lib/types";

/** 管理画面用：スレッドをフラットな一覧に */
export function flattenConfessionThreads(
  threads: ConfessionPost[]
): { post: ConfessionPost; isReply: boolean }[] {
  const items: { post: ConfessionPost; isReply: boolean }[] = [];

  for (const thread of threads) {
    items.push({ post: thread, isReply: false });
    for (const reply of thread.replies ?? []) {
      items.push({ post: reply, isReply: true });
    }
  }

  return items;
}

export function removeConfessionPostFromThreads(
  threads: ConfessionPost[],
  postId: string
): ConfessionPost[] {
  return threads
    .filter((t) => t.id !== postId)
    .map((t) => ({
      ...t,
      replies: t.replies?.filter((r) => r.id !== postId),
    }));
}
