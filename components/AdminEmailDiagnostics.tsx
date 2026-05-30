"use client";

import { useCallback, useEffect, useState } from "react";
import { apiErrorMessage, fetchJson } from "@/lib/fetchJson";

type EmailConfigStatus = {
  ready: boolean;
  hasApiKey: boolean;
  hasFrom: boolean;
  fromDomain: string | null;
  fromEmailMasked: string | null;
  hints: string[];
};

export function AdminEmailDiagnostics() {
  const [config, setConfig] = useState<EmailConfigStatus | null>(null);
  const [testTo, setTestTo] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const loadConfig = useCallback(async () => {
    const { res, data } = await fetchJson<EmailConfigStatus & { error?: string }>(
      "/api/admin/email-status"
    );
    if (res.ok) setConfig(data);
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const sendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestResult(null);
    setTesting(true);
    try {
      const { res, data } = await fetchJson<{
        ok?: boolean;
        error?: string;
        messageId?: string;
        hint?: string;
        emailConfig?: EmailConfigStatus;
      }>("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testTo.trim() }),
      });
      if (!res.ok) {
        throw new Error(apiErrorMessage(data, "テスト送信に失敗しました"));
      }
      setTestResult(
        `送信リクエスト成功（ID: ${data.messageId ?? "—"}）。${data.hint ?? ""}`
      );
    } catch (err) {
      setTestResult(err instanceof Error ? err.message : "エラー");
    } finally {
      setTesting(false);
    }
  };

  if (!config) return null;

  return (
    <details className="mb-5 card p-4">
      <summary className="cursor-pointer text-sm font-semibold text-zinc-700">
        メール（Resend）診断
        <span
          className={`ml-2 text-xs ${config.ready ? "text-emerald-400" : "text-fail"}`}
        >
          {config.ready ? "設定OK" : "要確認"}
        </span>
      </summary>

      <ul className="mt-3 space-y-1 text-xs text-zinc-500">
        <li>API キー: {config.hasApiKey ? "あり" : "なし"}</li>
        <li>送信元: {config.hasFrom ? config.fromEmailMasked ?? "設定済" : "なし"}</li>
        {config.fromDomain && <li>ドメイン: {config.fromDomain}</li>}
      </ul>

      {config.hints.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-amber-800">
          {config.hints.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}

      <form onSubmit={sendTest} className="mt-4 flex flex-col gap-2">
        <label className="text-xs text-zinc-500">
          テスト送信先（ドメイン未認証時は Resend 登録メールのみ）
        </label>
        <input
          type="email"
          className="input"
          value={testTo}
          onChange={(e) => setTestTo(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <button
          type="submit"
          disabled={testing || !config.ready}
          className="rounded-lg border border-zinc-200 py-2 text-sm font-semibold text-fail disabled:opacity-40"
        >
          {testing ? "送信中…" : "テストメールを送る"}
        </button>
      </form>

      {testResult && (
        <p className="mt-2 text-xs text-zinc-400 whitespace-pre-wrap">{testResult}</p>
      )}
    </details>
  );
}
