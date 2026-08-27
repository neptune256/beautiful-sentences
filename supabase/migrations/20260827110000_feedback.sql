-- 화면 우측 하단 피드백 버튼에서 접수되는 자유 의견함.
-- 쓰기/읽기 모두 서버 액션의 서비스 롤 클라이언트로만 수행하며 별도의 RLS 정책은 두지 않는다.

create table feedback (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  user_id uuid references profiles(id) on delete set null,
  nickname text,
  page_path text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index feedback_created_at_idx on feedback (created_at desc);

alter table feedback enable row level security;
