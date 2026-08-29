-- 좋아요 1개 = 작성자에게 즉시 +1점 지급을 위한 새 point_reason 값.
-- 같은 트랜잭션 내에서 바로 사용하는 함수와 분리된 파일로 둔다
-- (일부 Postgres 버전은 enum 추가 값을 같은 트랜잭션에서 즉시 사용하지 못함).
alter type point_reason add value 'like_received';
