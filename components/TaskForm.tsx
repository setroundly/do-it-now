"use client";

import { useState } from "react";
import { apiErrorMessage, fetchJson } from "@/lib/fetchJson";
import { datetimeLocalJstToUtcIso, defaultDeadlineJstParts } from "@/lib/datetime";
import type { DonationDestinationId } from "@/lib/donationDestinations";
import type { Task } from "@/lib/types";
import { useAppAuth } from "@/lib/useAppAuth";
import { DeadlinePicker } from "./DeadlinePicker";
import { DonationDestinationPicker } from "./DonationDestinationPicker";
import { Field } from "./ui/Field";

interface TaskFormProps {
  onCreated?: (payload: { userId: string; displayName: string; task: Task }) => void;
}

const defaultDeadline = (() => {
  const { date, time } = defaultDeadlineJstParts();
  return `${date}T${time}`;
})();

export function TaskForm({ onCreated }: TaskFormProps) {
  const { user } = useAppAuth();
  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [deadlineAt, setDeadlineAt] = useState(defaultDeadline);
  const [penaltyAmount, setPenaltyAmount] = useState("1000");
  const [selectedDonationId, setSelectedDonationId] =
    useState<DonationDestinationId | null>(null);
  const [donationDestination, setDonationDestination] = useState("");
  const [donateUrl, setDonateUrl] = useState("");
  const [customDonationName, setCustomDonationName] = useState("");
  const [customDonateUrl, setCustomDonateUrl] = useState("");
  const [notifyName, setNotifyName] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveName = displayName.trim() || user?.display_name || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!effectiveName) {
      setError("表示名を入力してください");
      return;
    }

    if (!selectedDonationId) {
      setError("寄付先を選択してください");
      return;
    }

    const finalName =
      selectedDonationId === "other"
        ? customDonationName.trim()
        : donationDestination.trim();
    const finalUrl =
      selectedDonationId === "other"
        ? customDonateUrl.trim()
        : donateUrl.trim();

    if (!finalName) {
      setError("寄付先名を入力してください");
      return;
    }
    if (selectedDonationId === "other" && !finalUrl) {
      setError("寄付ページのURLを入力してください");
      return;
    }

    setSubmitting(true);

    let deadlineIso: string;
    try {
      deadlineIso = datetimeLocalJstToUtcIso(deadlineAt);
    } catch {
      setError("締切の日時が正しくありません");
      setSubmitting(false);
      return;
    }

    try {
      const { res, data } = await fetchJson<{
        error?: string;
        user?: { id: string; display_name: string };
        task?: Task;
      }>("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: effectiveName,
          title: title.trim(),
          deadlineAt: deadlineIso,
          penaltyAmount: Number(penaltyAmount),
          donationDestination: finalName,
          donateUrl: finalUrl || undefined,
          ...(notifyEmail.trim()
            ? {
                notifyName: notifyName.trim() || undefined,
                notifyEmail: notifyEmail.trim(),
              }
            : {}),
        }),
      });

      if (!res.ok) {
        throw new Error(apiErrorMessage(data, "作成に失敗しました"));
      }

      if (!data.user || !data.task) {
        throw new Error("作成に失敗しました");
      }

      setTitle("");
      setDeadlineAt(defaultDeadline);
      setPenaltyAmount("1000");
      setSelectedDonationId(null);
      setDonationDestination("");
      setDonateUrl("");
      setCustomDonationName("");
      setCustomDonateUrl("");
      setNotifyName("");
      setNotifyEmail("");

      onCreated?.({
        userId: data.user.id,
        displayName: data.user.display_name,
        task: data.task,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラー");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field
        label="表示名"
        hint={user ? `Google: ${user.display_name}` : undefined}
        required
      >
        <input
          className="input"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={user?.display_name ?? "名前"}
          required
          maxLength={32}
        />
      </Field>

      <Field
        label="公開タスク"
        hint="3キロ痩せる など具体的に"
        required
      >
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={120}
        />
      </Field>

      <DeadlinePicker value={deadlineAt} onChange={setDeadlineAt} />

      <Field label="覚悟の金額（円）" required>
        <input
          type="number"
          inputMode="numeric"
          className="input tabular-nums"
          value={penaltyAmount}
          onChange={(e) => setPenaltyAmount(e.target.value)}
          min={1}
          required
        />
      </Field>

      <DonationDestinationPicker
        selectedId={selectedDonationId}
        customName={customDonationName}
        customUrl={customDonateUrl}
        onSelect={(option) => {
          setSelectedDonationId(option.id);
          if (option.id === "other") {
            setDonationDestination("");
            setDonateUrl("");
          } else {
            setDonationDestination(option.name);
            setDonateUrl(option.url);
            setCustomDonationName("");
            setCustomDonateUrl("");
          }
        }}
        onCustomNameChange={setCustomDonationName}
        onCustomUrlChange={setCustomDonateUrl}
      />

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="mb-1 text-xs font-semibold text-zinc-600">
          見届け人
        </p>
        <p className="mb-3 text-xs text-zinc-500">
          任意。メールを入れた場合だけ、失敗時に通知します。
        </p>
        <div className="flex flex-col gap-4">
          <Field label="名前">
            <input
              className="input"
              value={notifyName}
              onChange={(e) => setNotifyName(e.target.value)}
              placeholder="上司（任意）"
              maxLength={64}
            />
          </Field>
          <Field label="メール">
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              className="input"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              placeholder="friend@example.com（任意）"
            />
          </Field>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-fail/30 bg-fail/10 px-3 py-2 text-sm text-fail">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-brand-600 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? "設定中…" : "タスクを設定"}
      </button>
    </form>
  );
}
