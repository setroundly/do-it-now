-- 懺悔室の削除を Realtime で即時反映（任意）
alter table public.confession_posts replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.confession_posts;
exception
  when duplicate_object then null;
end $$;
