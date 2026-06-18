"use client";

export function FirstTaskBanner({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="card mb-4 border-brand-200 bg-brand-50/80 p-4">
      <p className="text-sm font-semibold text-brand-900">はじめての DOO IT NOW</p>
      <p className="mt-1 text-sm text-brand-800/90">
        まずは目標と締切を決めましょう。失敗したらタイムラインに流れ、寄付先へ送還です。
      </p>
      <button
        type="button"
        onClick={onCreateClick}
        className="mt-3 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        失敗する（目標を設定する）
      </button>
    </div>
  );
}
