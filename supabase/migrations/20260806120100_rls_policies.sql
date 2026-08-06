-- Row Level Security 정책
-- 원칙: situation_sentences/submissions 쓰기는 서버(서비스 롤 키)를 거치도록 하고,
--       클라이언트에는 읽기 위주 + 본인 데이터 쓰기만 허용한다.

alter table profiles enable row level security;
alter table situation_sentences enable row level security;
alter table daily_rounds enable row level security;
alter table submissions enable row level security;
alter table evaluations enable row level security;
alter table proposal_tickets enable row level security;
alter table point_transactions enable row level security;

-- profiles: 닉네임/포인트는 랭킹 페이지용으로 공개, 본인만 수정 가능
create policy "profiles are publicly readable" on profiles
  for select using (true);

create policy "users can update own profile" on profiles
  for update using (auth.uid() = id);

-- situation_sentences: 그날 사용된 문장만 공개 (제안 대기열/풀 내용은 비공개)
create policy "used sentences are publicly readable" on situation_sentences
  for select using (status = 'used');

-- daily_rounds: 오늘 문장 노출, 어제 결과 페이지용으로 전체 공개
create policy "daily rounds are publicly readable" on daily_rounds
  for select using (true);

-- submissions: 본인 글은 언제나 열람/작성/수정 가능
create policy "users can manage own submissions" on submissions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- submissions: 라운드가 마감(closed)된 경우에만 전체 공개 (당일 비공개 = 베끼기 방지)
create policy "closed round submissions are publicly readable" on submissions
  for select using (
    exists (
      select 1 from daily_rounds dr
      where dr.id = submissions.daily_round_id
        and dr.status = 'closed'
    )
  );

-- evaluations: 평가 결과(1위 + 이유)는 공개
create policy "evaluations are publicly readable" on evaluations
  for select using (true);

-- proposal_tickets: 본인 제안권만 열람 가능
create policy "users can view own proposal tickets" on proposal_tickets
  for select using (auth.uid() = user_id);

-- point_transactions: 본인 포인트 내역만 열람 가능
create policy "users can view own point transactions" on point_transactions
  for select using (auth.uid() = user_id);
