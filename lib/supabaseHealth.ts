/** 設定状態（秘密情報は返さない） */
export function getSupabaseEnvStatus() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  let urlHost: string | null = null;
  let urlValid = false;

  if (rawUrl) {
    try {
      urlHost = new URL(rawUrl).host;
      urlValid = rawUrl.startsWith("https://") && urlHost.includes("supabase");
    } catch {
      urlValid = false;
    }
  }

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ??
    process.env.SUPABASE_SECRET_KEY?.trim() ??
    "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
    "";

  const hints: string[] = [];

  if (!rawUrl) {
    hints.push("NEXT_PUBLIC_SUPABASE_URL が未設定です");
  } else if (!urlValid) {
    hints.push(
      "URL は https://xxxxxxxx.supabase.co の形式にしてください（Dashboard → Settings → API → Project URL）"
    );
  }

  if (!serviceKey) {
    hints.push(
      "SUPABASE_SERVICE_ROLE_KEY（Legacy の service_role）または SUPABASE_SECRET_KEY（sb_secret_...）を設定してください"
    );
  } else if (
    serviceKey.startsWith("eyJ") &&
    serviceKey.length < 100
  ) {
    hints.push("service_role キーが短すぎます。コピー漏れの可能性があります");
  } else if (
    !serviceKey.startsWith("eyJ") &&
    !serviceKey.startsWith("sb_secret_")
  ) {
    hints.push(
      "サーバー用キーは service_role（eyJ...）または sb_secret_... を使ってください（anon / publishable キーは不可）"
    );
  }

  if (!anonKey) {
    hints.push(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY（または sb_publishable_...）も設定すると Realtime が動きます"
    );
  }

  return {
    ready: Boolean(rawUrl && urlValid && serviceKey),
    urlHost,
    urlValid,
    hasServiceKey: Boolean(serviceKey),
    serviceKeyKind: serviceKey.startsWith("sb_secret_")
      ? "secret"
      : serviceKey.startsWith("eyJ")
        ? "service_role_jwt"
        : serviceKey
          ? "unknown"
          : null,
    hasAnonKey: Boolean(anonKey),
    hints,
  };
}

export async function testSupabaseConnection(): Promise<{
  ok: boolean;
  message: string;
}> {
  const status = getSupabaseEnvStatus();
  if (!status.ready) {
    return { ok: false, message: status.hints[0] ?? "Supabase 未設定" };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim().replace(/\/$/, "");
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ??
    process.env.SUPABASE_SECRET_KEY?.trim()!;

  try {
    const res = await fetch(`${url}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    });

    if (res.ok || res.status === 404 || res.status === 406) {
      return { ok: true, message: "Supabase REST API に接続できました" };
    }

    const text = await res.text().catch(() => "");
    if (res.status === 401) {
      return {
        ok: false,
        message:
          "API キーが無効です。service_role / sb_secret_ キーを再コピーしてください",
      };
    }

    return {
      ok: false,
      message: `Supabase が ${res.status} を返しました: ${text.slice(0, 120)}`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "接続エラー";
    if (msg.includes("fetch failed") || msg.includes("ENOTFOUND")) {
      return {
        ok: false,
        message:
          "URL に到達できません。プロジェクト URL の typo、または Supabase プロジェクトの一時停止を確認してください",
      };
    }
    return { ok: false, message: msg };
  }
}
