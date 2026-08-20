-- 관리자가 대기열(승인된 제안) 순서를 직접 조정할 수 있도록 정렬 컬럼을 추가한다.
-- 기존 큐 항목은 created_at(제출 순서) 기준으로 초기값을 채운다.

alter table situation_sentences add column queue_position integer;

with ordered as (
  select id, row_number() over (order by created_at asc) as rn
  from situation_sentences
  where status = 'queued'
)
update situation_sentences s
set queue_position = ordered.rn
from ordered
where s.id = ordered.id;
