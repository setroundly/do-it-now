-- 失敗タスクの「寄付した」申告用
alter table public.tasks
  add column if not exists donated_at timestamptz;
