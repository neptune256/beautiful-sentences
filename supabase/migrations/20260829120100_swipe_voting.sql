-- 좋아요 스와이프 투표: submission_votes에 스와이프 1회(좋아요/패스)를 기록해
-- 같은 카드를 다시 보여주지 않는다. 좋아요 1개 = 작성자에게 +1점 즉시 지급.
-- 글은 공개(daily_rounds.evaluated_at) 후 24시간 동안만 투표를 받을 수 있다.

create table submission_votes (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  voter_id uuid not null references profiles(id) on delete cascade,
  liked boolean not null,
  created_at timestamptz not null default now(),
  unique (voter_id, submission_id)
);

alter table submissions add column likes_count integer not null default 0;

alter table submission_votes enable row level security;

-- 본인이 던진 투표만 열람 가능. 쓰기는 정책 없음 — service-role 전용 RPC로만 삽입된다.
create policy "voters can view own votes" on submission_votes
  for select using (auth.uid() = voter_id);

-- 좋아요 등록 + likes_count 증가 + 포인트 지급을 원자적으로 처리 (like_board_post와 동일 패턴).
-- service-role 호출은 RLS를 우회하므로, 자기 글 투표 차단과 24시간 마감은
-- 정책이 아니라 이 함수 내부에서 강제해야 실효성이 있다.
create or replace function cast_submission_vote(
  p_submission_id uuid,
  p_voter_id uuid,
  p_liked boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_evaluated_at timestamptz;
  v_rows integer;
begin
  select s.user_id, dr.evaluated_at
    into v_owner_id, v_evaluated_at
  from submissions s
  join daily_rounds dr on dr.id = s.daily_round_id
  where s.id = p_submission_id;

  if v_owner_id is null then
    raise exception '존재하지 않는 글입니다.';
  end if;

  if v_owner_id = p_voter_id then
    raise exception '본인 글에는 투표할 수 없습니다.';
  end if;

  if v_evaluated_at is null or v_evaluated_at < now() - interval '24 hours' then
    raise exception '투표 기간이 종료된 글입니다.';
  end if;

  insert into submission_votes (submission_id, voter_id, liked)
  values (p_submission_id, p_voter_id, p_liked)
  on conflict (voter_id, submission_id) do nothing;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    return false;
  end if;

  if p_liked then
    update submissions set likes_count = likes_count + 1 where id = p_submission_id;

    insert into point_transactions (user_id, amount, reason, reference_id)
      values (v_owner_id, 1, 'like_received', p_submission_id);
    perform increment_points(v_owner_id, 1);
  end if;

  return true;
end;
$$;

revoke all on function cast_submission_vote(uuid, uuid, boolean) from public;
grant execute on function cast_submission_vote(uuid, uuid, boolean) to service_role;
