# FAIL DONATE

締切までにタスクを完了できなかったら、失敗がタイムラインに流れるタスク管理アプリ。

## 技術スタック

- Next.js App Router + TypeScript + Tailwind CSS
- Supabase (Postgres)
- Resend (メール)
- Vercel (ホスティング + Cron)

## ローカル起動

```bash
cp .env.example .env.local
# .env.local を編集

npm install
npm run dev
```

ブラウザで http://localhost:3000 を開く。

### リアルタイムタイムライン

- 締切超過した失敗は `failures` テーブルへ保存し、**Supabase Realtime** で即時反映
- 締切超過タスクの失敗化は **Vercel Cron**（15分ごと）＋アプリ表示時の即時実行
- Supabase SQL Editor で `supabase/failures.sql` を実行
- 続けて `supabase/realtime-setup.sql` を実行し、**Database → Replication** で `failures` と `confession_posts` を ON

### 管理者（投稿削除）

- `/admin` に `ADMIN_SECRET` を入力してログイン
- **タイムライン** / **懺悔室** タブから投稿を削除（一般ユーザーには削除ボタンなし）
- 削除は Realtime でアプリから即時消える

## Supabase 設定

1. [supabase.com](https://supabase.com) でプロジェクト作成
2. **SQL Editor** で `supabase/schema.sql` を実行
3. 続けて `supabase/confession.sql` を実行（懺悔室）
4. 続けて `supabase/failures.sql` を実行（リアルタイムタイムライン）
5. 続けて `supabase/migration-donated-at.sql` を実行（寄付申告）
5. **Database → Replication** で `failures` テーブルの Realtime を ON
5. **Settings → API** から URL / anon key / service_role key を `.env.local` に設定
6. **Google ログイン**（タスク作成・自分のタスクに必要）:
   - SQL Editor で `supabase/auth-google.sql` を実行（既存 DB の場合）
   - **Authentication → Providers → Google** を有効化
   - Google Cloud Console で OAuth クライアントを作成し、Client ID / Secret を Supabase に設定
   - **Authentication → URL Configuration** の Redirect URLs に  
     `http://localhost:3000/auth/callback` と本番 `https://あなたのドメイン/auth/callback` を追加
7. （任意）**Database → Replication** で `timeline_posts` の Realtime を有効化

## Vercel デプロイ

1. GitHub に push
2. Vercel で Import
3. Environment Variables に `.env.example` の値を設定（本番 URL は `NEXT_PUBLIC_APP_URL` に反映）
4. Deploy

## フォルダ構成

```
fail-donate/
├─ app/           # ページ & API Routes
├─ components/    # UI
├─ lib/           # Supabase, Resend, 型
├─ supabase/      # schema.sql
├─ .env.example
└─ vercel.json
```
