-- 제출별 평가 상세: 기존 evaluations 테이블은 라운드당 1위/이유만 담고 있어
-- 참가자 본인 글이 왜 그 순위인지 알 수 없었다. 세부 기준별 점수와,
-- 1위가 아닌 글에 대한 한 줄 피드백을 제출 행에 직접 붙인다.

alter table submissions
  add column eval_passed_gate boolean,
  add column eval_gate_issue text,
  add column eval_scores jsonb,
  add column eval_note text;
