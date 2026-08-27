-- 일일 퀘스트: "네 단어 글쓰기 + 공유" 완료 기록.
-- wordplay_entries는 최대 개수 제한이 있어 오래된 글이 삭제될 수 있으므로,
-- 출석/스트릭 계산에 쓸 완료 여부는 별도 테이블에 날짜 단위로 영구 기록한다.

create table wordplay_quest_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  quest_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, quest_date)
);

create index wordplay_quest_log_user_id_idx on wordplay_quest_log (user_id, quest_date);

alter table wordplay_quest_log enable row level security;

create policy "users can manage own wordplay quest log" on wordplay_quest_log
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
