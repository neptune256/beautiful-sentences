-- 버그: 긴 글(board_posts.content)이 TOAST되면, 그 값이 바뀌지 않은 UPDATE(좋아요, 드래그 이동 등)의
-- 논리 복제(WAL) 페이로드에서 해당 컬럼 값이 통째로 빠진다. Supabase Realtime의 postgres_changes가
-- 이걸 그대로 클라이언트에 전달하면서, 화면에서 content가 사라져 보이는 문제가 있었다.
-- REPLICA IDENTITY FULL로 설정하면 모든 변경에 전체 행(TOAST 컬럼 포함)이 항상 포함된다.
alter table board_posts replica identity full;
