-- 하루 두 퀘스트(오늘의 문장 + 네 단어 글쓰기) 모두 완료 시 지급하는 다이아 사유 추가.
-- diamond_transactions의 (user_id, reference_date, reason) 유니크 제약을 그대로 재사용해
-- 같은 날 중복 지급을 막는다.

alter type diamond_reason add value 'daily_quest_complete';
