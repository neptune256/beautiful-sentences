-- 최종 제출 기능: 참가자가 '저장'(자정까지 자유 수정) 대신 '최종 제출'을 선택하면
-- 그 시점에 개별적으로(다른 참가자와 비교하지 않고 절대 채점) Gemini 평가를 미리 받는다.
-- finalized_at이 채워진 글은 더 이상 수정할 수 없고, 자정 마감 cron은 이 글을 다시
-- 채점하지 않고 이미 저장된 eval_* 값을 그대로 사용해 1위 결정에만 활용한다.

alter table submissions add column finalized_at timestamptz;
