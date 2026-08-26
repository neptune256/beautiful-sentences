-- 세 단어 글쓰기 -> 네 단어 글쓰기: 형용사 카드를 추가한다.
alter table wordplay_entries add column adjective text not null default '';
