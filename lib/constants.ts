export const USER_STORAGE_KEY = "fail_donate_user_id";
export const USER_NAME_STORAGE_KEY = "fail_donate_display_name";

export const SETROUNDLY_URL =
  process.env.NEXT_PUBLIC_SETROUNDLY_URL ?? "https://setroundly.com";

/** タイムライン等のフォールバック（SETROUNDLY ではなく赤十字の一般寄付） */
export const DEFAULT_DONATE_URL =
  process.env.NEXT_PUBLIC_DEFAULT_DONATE_URL ??
  "https://www.jrc.or.jp/contribute/";

export function getAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}
