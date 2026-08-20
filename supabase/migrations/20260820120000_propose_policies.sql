-- 상황 문장 제안 흐름에 필요한 RLS 정책
-- 공유 시 제안권(proposal_tickets) 발급, 제안권 사용 시 situation_sentences에
-- 'pending_review' 상태로만 등록 가능하도록 범위를 좁힌다. 승인/반려는 관리자
-- 서버 액션(서비스 롤)에서만 수행하므로 별도 update 정책을 두지 않는다.

create policy "users can create own proposal tickets" on proposal_tickets
  for insert with check (auth.uid() = user_id);

create policy "users can use own proposal tickets" on proposal_tickets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users can propose pending situation sentences" on situation_sentences
  for insert with check (auth.uid() = proposed_by and status = 'pending_review');
