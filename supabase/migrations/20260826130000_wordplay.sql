-- 세 단어 글쓰기(/wordplay): 명사/색/동사 세 단어를 무작위로 뽑아 짧은 문장을 지어보는
-- 가벼운 연습 기능. AI 평가 없이 로그인 유저 본인 글만 최대 10개까지 보관한다.
-- (개수 상한은 애플리케이션 코드에서 확인 후 insert하며, DB에는 별도 제약을 두지 않는다.)

create table wordplay_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  noun text not null,
  verb text not null,
  color_name text not null,
  color_hex text not null,
  sentence text not null,
  created_at timestamptz not null default now()
);

create index wordplay_entries_user_id_idx on wordplay_entries (user_id, created_at);

alter table wordplay_entries enable row level security;

create policy "wordplay_entries_own_rows" on wordplay_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
