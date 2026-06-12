export type ApiErrorBody = { error?: string; details?: unknown };

export async function fetchJson<T = ApiErrorBody>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ res: Response; data: T }> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch {
    throw new Error(
      "サーバーに接続できませんでした。ネットワークまたはデプロイ設定を確認してください。"
    );
  }
  const data = await parseJsonResponse<T>(res);
  return { res, data };
}

export async function parseJsonResponse<T = ApiErrorBody>(
  res: Response
): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    if (!res.ok) {
      throw new Error(
        res.status === 500
          ? "サーバーエラーが発生しました。.env.local の Supabase 設定を確認してください。"
          : `API error (${res.status})`
      );
    }
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      res.ok
        ? "サーバーから不正な応答が返されました"
        : `API error (${res.status})`
    );
  }
}

export function apiErrorMessage(
  data: ApiErrorBody | Record<string, unknown>,
  fallback: string
): string {
  const err = (data as ApiErrorBody).error;
  if (typeof err !== "string") return fallback;
  if (err.includes("fetch failed")) {
    return "Supabase に接続できません。環境変数（NEXT_PUBLIC_SUPABASE_URL 等）を確認してください。";
  }
  return err;
}
