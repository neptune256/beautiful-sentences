-- 매일 라운드 마감 시 선정된 1위 글을 자유 게시판에 자동으로 올린다.
-- 일반 글은 24시간 뒤 사라지지만, 1위 글은 예외적으로 7일 동안 유지된다.
-- 좋아요를 받았을 때의 만료 시간 리셋도 글마다 다른 ttl_hours를 그대로 써서
-- 1위 글이 좋아요로 인해 오히려 짧은 24시간으로 당겨지지 않게 한다.

alter table board_posts
  add column source text not null default 'user' check (source in ('user', 'daily_winner')),
  add column ttl_hours integer not null default 24;

drop function if exists like_board_post(uuid, uuid, text, integer);

create or replace function like_board_post(
  p_post_id uuid,
  p_user_id uuid,
  p_anon_token text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
begin
  insert into board_likes (post_id, user_id, anon_token)
  values (p_post_id, p_user_id, p_anon_token)
  on conflict (post_id, liker_key) do nothing;

  get diagnostics v_rows = row_count;

  if v_rows = 0 then
    return false;
  end if;

  update board_posts
    set likes_count = likes_count + 1,
        expires_at = now() + (ttl_hours || ' hours')::interval
    where id = p_post_id;

  return true;
end;
$$;

revoke all on function like_board_post(uuid, uuid, text) from public;
grant execute on function like_board_post(uuid, uuid, text) to service_role;
