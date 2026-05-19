/** メール送信の設定状態（秘密情報は返さない） */
export function getEmailConfigStatus() {
  const hasApiKey = Boolean(process.env.RESEND_API_KEY?.trim());
  const from = process.env.EMAIL_FROM?.trim() ?? "";
  const hasFrom = Boolean(from);

  const fromEmailMatch = from.match(/<([^>]+)>/);
  const fromEmail = fromEmailMatch?.[1] ?? (from.includes("@") ? from : null);
  const fromDomain = fromEmail?.split("@")[1] ?? null;

  const hints: string[] = [];
  if (!hasApiKey) {
    hints.push("Vercel の Environment Variables に RESEND_API_KEY を追加してください");
  }
  if (!hasFrom) {
    hints.push("EMAIL_FROM を追加してください（例: DoItNow <noreply@your-domain.com>）");
  }
  if (from.includes("your-verified-domain")) {
    hints.push("EMAIL_FROM のプレースホルダを、Resend で認証したドメインのメールに変更してください");
  }
  if (hasFrom && !fromEmail) {
    hints.push('EMAIL_FROM は "表示名 <email@domain.com>" または email@domain.com 形式にしてください');
  }
  if (fromDomain === "resend.dev" || fromEmail === "onboarding@resend.dev") {
    hints.push(
      "テスト用送信元です。届け先は Resend に登録した自分のメールのみ可能です（ドメイン認証前）"
    );
  } else if (hasFrom && fromDomain && fromDomain !== "resend.dev") {
    hints.push(
      `送信元ドメイン「${fromDomain}」が Resend → Domains で Verified になっているか確認してください`
    );
  }

  return {
    ready: hasApiKey && hasFrom,
    hasApiKey,
    hasFrom,
    fromDomain,
    fromEmailMasked: fromEmail
      ? fromEmail.replace(/^(.{1,2})[^@]*(@.+)$/, "$1***$2")
      : null,
    hints,
  };
}
