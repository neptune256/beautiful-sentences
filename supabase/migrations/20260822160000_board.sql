-- 자유 게시판(코르크보드): 로그인/익명 모두 자유롭게 글을 남기고,
-- 좋아요/댓글을 남길 수 있으며, 24시간 뒤 자동으로 사라진다.
-- 좋아요를 받으면 만료 시간이 24시간 뒤로 리셋된다.

create table board_posts (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  author_name text not null,
  user_id uuid references profiles(id) on delete set null,
  anon_token text,
  x double precision not null,
  y double precision not null,
  rotation real not null default 0,
  color text not null default 'yellow',
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint board_posts_owner_check check (user_id is not null or anon_token is not null)
);

create index board_posts_expires_at_idx on board_posts (expires_at);

create table board_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references board_posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  anon_token text,
  liker_key text generated always as (coalesce(user_id::text, anon_token)) stored,
  created_at timestamptz not null default now(),
  constraint board_likes_liker_check check (user_id is not null or anon_token is not null),
  unique (post_id, liker_key)
);

create table board_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references board_posts(id) on delete cascade,
  author_name text not null,
  user_id uuid references profiles(id) on delete set null,
  anon_token text,
  content text not null,
  created_at timestamptz not null default now(),
  constraint board_comments_owner_check check (user_id is not null or anon_token is not null)
);

create index board_comments_post_id_idx on board_comments (post_id, created_at);

alter table board_posts enable row level security;
alter table board_likes enable row level security;
alter table board_comments enable row level security;

-- 읽기는 전원 공개(익명 포함). 쓰기/수정/삭제는 서버 액션의 서비스 롤 클라이언트로만 수행하며
-- (본인 글인지는 애플리케이션 코드에서 확인), RLS에는 별도의 insert/update/delete 정책을 두지 않는다.
create policy "board_posts_select_all" on board_posts for select using (true);
create policy "board_likes_select_all" on board_likes for select using (true);
create policy "board_comments_select_all" on board_comments for select using (true);

-- 댓글이 늘고 줄 때 board_posts.comments_count를 자동으로 맞춘다.
create or replace function bump_board_comments_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update board_posts set comments_count = comments_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update board_posts set comments_count = greatest(comments_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger board_comments_count_trigger
after insert or delete on board_comments
for each row execute function bump_board_comments_count();

-- 좋아요 등록 + 카운트 증가 + 만료 시간 리셋을 원자적으로 처리.
-- 이미 좋아요를 눌렀으면 아무 것도 하지 않고 false를 반환한다.
create or replace function like_board_post(
  p_post_id uuid,
  p_user_id uuid,
  p_anon_token text,
  p_reset_hours integer default 24
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
        expires_at = now() + (p_reset_hours || ' hours')::interval
    where id = p_post_id;

  return true;
end;
$$;

revoke all on function like_board_post(uuid, uuid, text, integer) from public;
grant execute on function like_board_post(uuid, uuid, text, integer) to service_role;

-- 실시간 구독(신규 글/좋아요/댓글이 다른 방문자 화면에도 즉시 반영)을 위해 publication에 추가.
alter publication supabase_realtime add table board_posts;
alter publication supabase_realtime add table board_likes;
alter publication supabase_realtime add table board_comments;
