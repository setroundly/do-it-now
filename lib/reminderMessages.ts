export type ReminderTier = "24h" | "1h";

export interface ReminderCopy {
  subject: string;
  headline: string;
  punchline: string;
}

/** 24時間前 — 軽めの煽り */
const COPY_24H: ReminderCopy[] = [
  {
    subject: "え、まさか終わってないの？",
    headline: "え、まさか終わってないの？",
    punchline: "締切まで24時間。今からなら、まだ「言い訳」は通用する。",
  },
  {
    subject: "明日の自分に丸投げする？",
    headline: "明日の自分に全部押し付けるつもり？",
    punchline: "24時間ある。未来の自分をヒーローにするか、被害者にするかは今日決まる。",
  },
  {
    subject: "まだ間に合う（たぶん）",
    headline: "まだ間に合う。……今から動くなら。",
    punchline: "あと24時間。スマホを伏せて、タスク名をもう一度読んでみ。",
  },
  {
    subject: "通知は見えてるよね？",
    headline: "通知は見えてるのに、手が動いてない説？",
    punchline: "締切24時間前。タイムラインに載るのは、今からも選べる。",
  },
  {
    subject: "「あとで」はもう使えない",
    headline: "「あとで」って言葉、今日で卒業しない？",
    punchline: "24時間切った。寄付先に名前が載る未来、想像してみ。",
  },
  {
    subject: "本気？",
    headline: "設定したの自分なのに、忘れたフリは通用しないよ。",
    punchline: "締切まで24時間。完了ボタン、まだ使える。",
  },
];

/** 1時間前 — 本気の煽り */
const COPY_1H: ReminderCopy[] = [
  {
    subject: "ショート動画見てる暇ある？",
    headline: "ショート動画見てる暇ある？",
    punchline: "あと1時間。スクロールを止めて、タスクを終わらせろ。",
  },
  {
    subject: "あと60分。マジで。",
    headline: "あと60分。本当にこのまま終わる？",
    punchline: "失敗したらタイムライン行き。今ならまだ取り返せる。",
  },
  {
    subject: "寄付先、もう見えてる？",
    headline: "寄付先の名前、もう見えてる？",
    punchline: "締切1時間前。ペナルティ額、ちゃんと覚えてる？",
  },
  {
    subject: "タイムライン載るの好き？",
    headline: "タイムラインに載るの、そんなに嬉しい？",
    punchline: "あと1時間。公開処刑か完了、選べ。",
  },
  {
    subject: "今動かないと終わり",
    headline: "今動かないと、本当に終わり。",
    punchline: "1時間後に締切。後悔は早い。",
  },
  {
    subject: "通知開くの早いくせに",
    headline: "通知開くのは早いくせに、タスクは？",
    punchline: "ラスト1時間。言い訳より完了ボタン。",
  },
  {
    subject: "ラストチャンス",
    headline: "これがラストチャンス。",
    punchline: "あと1時間で失敗確定ライン。今すぐ動け。",
  },
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function pickReminderCopy(
  tier: ReminderTier,
  taskId: string
): ReminderCopy {
  const pool = tier === "24h" ? COPY_24H : COPY_1H;
  return pool[hashString(`${taskId}:${tier}`) % pool.length]!;
}
