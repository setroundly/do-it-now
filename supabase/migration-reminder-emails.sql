-- 締切24時間前・1時間前リマインドメールの送信記録
alter table public.tasks
  add column if not exists reminded_24h_at timestamptz,
  add column if not exists reminded_1h_at timestamptz;

create index if not exists tasks_pending_reminder_idx
  on public.tasks (status, deadline_at)
  where status = 'pending';
