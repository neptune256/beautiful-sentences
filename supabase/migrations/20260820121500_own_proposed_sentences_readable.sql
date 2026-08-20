-- insert().select()로 방금 등록한 제안(pending_review 등)을 본인이 다시 읽어올 수 있도록 허용한다.
-- 이게 없으면 INSERT ... RETURNING 단계에서 "new row violates row-level security policy" 에러가 난다
-- (RETURNING 절도 SELECT 정책의 적용을 받기 때문).

create policy "users can view own proposed sentences" on situation_sentences
  for select using (auth.uid() = proposed_by);
