import { DONATION_DESTINATIONS } from "@/lib/donationDestinations";

/** タスクに保存された URL、なければプリセット名から解決 */
export function resolveTaskDonateUrl(task: {
  donate_url: string | null;
  donation_destination: string;
}): string | null {
  const stored = task.donate_url?.trim();
  if (stored) return stored;

  const preset = DONATION_DESTINATIONS.find(
    (d) => d.name === task.donation_destination && d.url
  );
  return preset?.url ?? null;
}
