-- Google ログイン用: public.users と auth.users を紐づけ
-- Supabase SQL Editor で schema.sql の後に実行

alter table public.users
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete cascade;

create index if not exists users_auth_user_id_idx on public.users(auth_user_id);
