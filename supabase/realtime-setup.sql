-- 削除の即時反映用（SQL Editor で一度実行）
-- Dashboard → Database → Replication でも各テーブルを ON にすること

alter table public.failures replica identity full;
alter table public.confession_posts replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.failures;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.confession_posts;
exception
  when duplicate_object then null;
end $$;
